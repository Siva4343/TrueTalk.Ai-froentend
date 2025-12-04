// src/hooks/useWebRTC.js
import { useEffect, useRef, useState, useCallback } from "react";

const DEFAULT_STUN = [{ urls: "stun:stun.l.google.com:19302" }];

const MAX_PARTICIPANTS = (() => {
  try {
    const env = (import.meta && import.meta.env && import.meta.env.VITE_PARTICIPANT_LIMIT) || null;
    const n = env ? parseInt(env, 10) : NaN;
    if (!Number.isNaN(n) && n > 0) return n;
  } catch (e) {}
  return 200;
})();

export default function useWebRTC(signalingUrl = null) {
  const wsRef = useRef(null);
  const localVideoElRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const peersRef = useRef(new Map());
  const [remoteStreams, setRemoteStreams] = useState([]);
  const [participants, setParticipants] = useState([]);
  const handlersRef = useRef(new Map());
  const myIdRef = useRef(null);
  const roomRef = useRef(null);
  const nameRef = useRef("Guest");

  // Keep a reference for enhanced noise processing so we can stop it if needed
  const audioProcessingRef = useRef({
    audioContext: null,
    sourceNode: null,
    dest: null,
    processedTrack: null,
    originalTrackId: null,
  });

  // ======================
  // Debug helper (TEMP)
  // ======================
  // Creates floating muted videos in the page so you can visually confirm a remote stream arrived.
  function debugAttachStream(peerId, stream) {
    try {
      if (!window._dbgVideos) window._dbgVideos = {};
      const id = `dbg-video-${peerId}`;
      let v = window._dbgVideos[id];
      if (!v) {
        v = document.createElement("video");
        v.id = id;
        v.autoplay = true;
        v.playsInline = true;
        v.muted = true;
        v.style.position = "fixed";
        v.style.right = "8px";
        v.style.bottom = `${8 + Object.keys(window._dbgVideos).length * 140}px`;
        v.style.width = "200px";
        v.style.height = "120px";
        v.style.zIndex = 99999;
        v.style.border = "2px solid rgba(255,255,255,0.06)";
        document.body.appendChild(v);
        window._dbgVideos[id] = v;
      }
      v.srcObject = stream;
    } catch (e) {
      console.warn("debugAttachStream err", e);
    }
  }

  // ======================
  // Event emitter helpers
  // ======================
  function emit(ev, payload) {
    const list = handlersRef.current.get(ev) || [];
    for (const cb of list) try { cb(payload); } catch (e) {}
  }

  const on = useCallback((ev, cb) => {
    if (!handlersRef.current.has(ev)) handlersRef.current.set(ev, []);
    handlersRef.current.get(ev).push(cb);
    return () => {
      const arr = handlersRef.current.get(ev) || [];
      handlersRef.current.set(ev, arr.filter(f => f !== cb));
    };
  }, []);

  // ======================
  // Remote streams refresh
  // ======================
  function refreshRemoteStreams() {
    const arr = [];
    for (const [id, info] of peersRef.current.entries()) {
      if (info.stream) {
        arr.push({
          socketId: id,
          stream: info.stream,
          name: info.name || id,
          muted: !!info.muted,
          isHost: !!info.isHost,
        });
      }
    }
    setRemoteStreams(arr);
    emit("remote-streams", arr);
  }

  // ======================
  // Enhanced audio processing teardown
  // ======================
  function teardownEnhancedAudioProcessing() {
    try {
      const st = audioProcessingRef.current;
      if (!st) return;
      if (st.processedTrack) {
        try { st.processedTrack.stop && st.processedTrack.stop(); } catch(_) {}
        st.processedTrack = null;
      }
      if (st.sourceNode) {
        try { st.sourceNode.disconnect && st.sourceNode.disconnect(); } catch(_) {}
        st.sourceNode = null;
      }
      if (st.dest) {
        try { st.dest.disconnect && st.dest.disconnect(); } catch(_) {}
        st.dest = null;
      }
      if (st.audioContext) {
        try { st.audioContext.close && st.audioContext.close(); } catch(_) {}
        st.audioContext = null;
      }
      st.originalTrackId = null;
    } catch (e) { console.warn("teardownEnhancedAudioProcessing err", e); }
  }

  // ======================
  // startLocalMedia (unchanged logic except minor robustness)
  // ======================
  async function startLocalMedia(opts = { video: true, audio: true, deviceId: null, resolution: "auto", noiseSuppression: true, enhancedNoise: false }) {
    try {
      const res = (opts.resolution || "auto").toString().toLowerCase();
      let videoConstraint = false;

      if (opts.video) {
        if (res === "4k") videoConstraint = { width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 30 } };
        else if (res === "1080p") videoConstraint = { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } };
        else if (res === "720p") videoConstraint = { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } };
        else videoConstraint = { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } };

        if (opts.deviceId) videoConstraint.deviceId = { exact: opts.deviceId };
      }

      const audioConstraint = opts.audio ? {
        echoCancellation: true,
        noiseSuppression: typeof opts.noiseSuppression === "boolean" ? opts.noiseSuppression : true,
        autoGainControl: true
      } : false;

      const constraints = { audio: audioConstraint, video: videoConstraint };

      const tryGet = async (c) => {
        try { return await navigator.mediaDevices.getUserMedia(c); } catch (err) { return null; }
      };

      let s = await tryGet(constraints);

      if (!s) {
        s = await tryGet({ audio: !!opts.audio, video: !!opts.video });
      }

      if (!s) throw new Error("Could not obtain media");

      if (opts.enhancedNoise && s.getAudioTracks().length) {
        try {
          teardownEnhancedAudioProcessing();

          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(s);
          const hp = audioCtx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 80;
          const lp = audioCtx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 8000;
          const comp = audioCtx.createDynamicsCompressor();
          comp.threshold.value = -50; comp.knee.value = 20; comp.ratio.value = 6; comp.attack.value = 0.01; comp.release.value = 0.3;
          const gainNode = audioCtx.createGain(); gainNode.gain.value = 1.0;
          const dest = audioCtx.createMediaStreamDestination();

          source.connect(hp); hp.connect(lp); lp.connect(comp); comp.connect(gainNode); gainNode.connect(dest);

          const processedTrack = dest.stream.getAudioTracks()[0];

          const outStream = new MediaStream();
          (s.getVideoTracks() || []).forEach(t => outStream.addTrack(t));
          if (processedTrack) outStream.addTrack(processedTrack);

          audioProcessingRef.current.audioContext = audioCtx;
          audioProcessingRef.current.sourceNode = source;
          audioProcessingRef.current.dest = dest;
          audioProcessingRef.current.processedTrack = processedTrack;
          audioProcessingRef.current.originalTrackId = (s.getAudioTracks()[0] && s.getAudioTracks()[0].id) || null;

          s = outStream;
        } catch (e) {
          console.warn("enhancedNoise processing failed, continuing with raw stream", e);
        }
      } else {
        teardownEnhancedAudioProcessing();
      }

      mediaStreamRef.current = s;

      if (localVideoElRef.current) {
        try {
          localVideoElRef.current.srcObject = s;
          localVideoElRef.current.muted = true;
          localVideoElRef.current.play && localVideoElRef.current.play().catch(()=>{});
        } catch (e) {}
      }

      // add/replace tracks for peers
      for (const [id, info] of peersRef.current.entries()) {
        try {
          const pc = info.pc;
          const senders = pc.getSenders();
          const videoTrack = s.getVideoTracks()[0];
          const audioTrack = s.getAudioTracks()[0];
          if (videoTrack) {
            const sender = senders.find(x => x.track && x.track.kind === "video");
            if (sender) await sender.replaceTrack(videoTrack);
            else pc.addTrack(videoTrack, s);
          }
          if (audioTrack) {
            const senderA = senders.find(x => x.track && x.track.kind === "audio");
            if (senderA) await senderA.replaceTrack(audioTrack);
            else pc.addTrack(audioTrack, s);
          }
        } catch (e) { console.warn("add/repl tracks failed", e); }
      }

      emit("local-media-updated", mediaStreamRef.current);
      return s;
    } catch (e) { console.warn("startLocalMedia failed", e); throw e; }
  }

  // ======================
  // selectDevice (unchanged logic)
  // ======================
  async function selectDevice(deviceId, resolution = "auto", opts = {}) {
    try {
      if (!navigator.mediaDevices) return;
      let videoConstraint = { deviceId: { exact: deviceId } };
      const res = (resolution || "auto").toString().toLowerCase();
      if (res === "4k") videoConstraint = { deviceId: { exact: deviceId }, width: { ideal: 3840 }, height: { ideal: 2160 }, frameRate: { ideal: 30 } };
      else if (res === "1080p") videoConstraint = { deviceId: { exact: deviceId }, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 } };
      else if (res === "720p") videoConstraint = { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } };
      else videoConstraint = { deviceId: { exact: deviceId } };

      const audioConstraint = opts.audio !== false ? {
        echoCancellation: true,
        noiseSuppression: typeof opts.noiseSuppression === "boolean" ? opts.noiseSuppression : true,
        autoGainControl: true
      } : false;

      const newStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraint, audio: audioConstraint }).catch(()=>null);
      if (!newStream) {
        try {
          const fallback = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: audioConstraint }).catch(()=>null);
          if (!fallback) return;
          if (!mediaStreamRef.current) mediaStreamRef.current = new MediaStream();
          const newTrack = fallback.getVideoTracks()[0];
          if (!newTrack) return;
          const ms = mediaStreamRef.current;
          const oldTrack = ms.getVideoTracks()[0];
          if (oldTrack) { ms.removeTrack(oldTrack); oldTrack.stop && oldTrack.stop(); }
          ms.addTrack(newTrack);

          for (const [, info] of peersRef.current.entries()) {
            try {
              const sender = info.pc.getSenders().find(s => s.track && s.track.kind === "video");
              if (sender) await sender.replaceTrack(newTrack);
            } catch (e) { console.warn("replaceTrack failed", e); }
          }
          emit("local-media-updated", ms);
          return;
        } catch (e) { return; }
      }

      if (opts.enhancedNoise && newStream.getAudioTracks().length) {
        try {
          teardownEnhancedAudioProcessing();

          const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const source = audioCtx.createMediaStreamSource(newStream);
          const hp = audioCtx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 80;
          const lp = audioCtx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 8000;
          const comp = audioCtx.createDynamicsCompressor();
          comp.threshold.value = -50; comp.knee.value = 20; comp.ratio.value = 6; comp.attack.value = 0.01; comp.release.value = 0.3;
          const gainNode = audioCtx.createGain(); gainNode.gain.value = 1.0;
          const dest = audioCtx.createMediaStreamDestination();
          source.connect(hp); hp.connect(lp); lp.connect(comp); comp.connect(gainNode); gainNode.connect(dest);
          const processedTrack = dest.stream.getAudioTracks()[0];
          const outStream = new MediaStream();
          (newStream.getVideoTracks() || []).forEach(t => outStream.addTrack(t));
          if (processedTrack) outStream.addTrack(processedTrack);

          audioProcessingRef.current.audioContext = audioCtx;
          audioProcessingRef.current.sourceNode = source;
          audioProcessingRef.current.dest = dest;
          audioProcessingRef.current.processedTrack = processedTrack;
          audioProcessingRef.current.originalTrackId = (newStream.getAudioTracks()[0] && newStream.getAudioTracks()[0].id) || null;

          mediaStreamRef.current = outStream;
        } catch (e) {
          console.warn("enhancedNoise selectDevice failed", e);
          mediaStreamRef.current = newStream;
        }
      } else {
        teardownEnhancedAudioProcessing();
        mediaStreamRef.current = newStream;
      }

      const newTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (!newTrack) return;
      const ms = mediaStreamRef.current || new MediaStream();
      const oldTrack = ms.getVideoTracks()[0];
      if (oldTrack) { ms.removeTrack(oldTrack); oldTrack.stop && oldTrack.stop(); }
      ms.addTrack(newTrack);
      mediaStreamRef.current = ms;

      for (const [, info] of peersRef.current.entries()) {
        try {
          const sender = info.pc.getSenders().find(s => s.track && s.track.kind === "video");
          if (sender) await sender.replaceTrack(newTrack);
        } catch (e) { console.warn("replaceTrack failed", e); }
      }

      emit("local-media-updated", ms);
    } catch (e) { console.warn(e); }
  }

  // ======================
  // createPeerConnection (inserted pc.onnegotiationneeded, logs, and debugAttachStream)
  // ======================
  function createPeerConnection(remoteId, opts = {}) {
    if (peersRef.current.has(remoteId)) return peersRef.current.get(remoteId);

    const pc = new RTCPeerConnection({ iceServers: DEFAULT_STUN });
    const info = {
      pc,
      stream: null,
      candidatesQueue: [],
      name: opts.name || null,
      muted: false,
      isHost: !!opts.isHost,
      dataChannel: null,
      statsInterval: null,
    };

    const remoteStream = new MediaStream();

    pc.ontrack = (ev) => {
      try {
        console.debug("[webrtc] pc.ontrack for", remoteId, "ev.streams", ev.streams, "ev.track", ev.track && ev.track.kind);
        if (ev.streams && ev.streams.length) {
          ev.streams.forEach(s => s.getTracks().forEach(t => remoteStream.addTrack(t)));
        } else if (ev.track) {
          // handles separate track events
          remoteStream.addTrack(ev.track);
        }
      } catch (e) { console.warn("pc.ontrack err", e); }
      info.stream = remoteStream;
      peersRef.current.set(remoteId, info);
      refreshRemoteStreams();

      // TEMP debugging: attach small floating video so you can visually confirm receipt
      try { debugAttachStream(remoteId, remoteStream); } catch (e) {}
    };

    pc.ondatachannel = (ev) => {
      try {
        const ch = ev.channel;
        if (ch) {
          info.dataChannel = ch;
          ch.onopen = () => {
            emit("dc-open", { peer: remoteId });
          };
          ch.onmessage = (mEv) => {
            try {
              const raw = mEv.data;
              const data = typeof raw === "string" ? JSON.parse(raw) : raw;
              if (data && data.__type === "ping") {
                const reply = JSON.stringify({ __type: "pong", ts: data.ts, fromSocket: myIdRef.current });
                try { ch.send(reply); } catch (_) {}
              } else if (data && data.__type === "pong") {
                const rtt = Date.now() - (data.ts || Date.now());
                emit("dc-ping", { peerId: remoteId, rtt });
              } else {
                emit("dc-message", { from: remoteId, data });
              }
            } catch (e) { console.warn("dc onmessage parse failed", e); }
          };
          ch.onclose = () => {
            emit("dc-closed", { peer: remoteId });
            info.dataChannel = null;
          };
        }
      } catch (e) { console.warn("ondatachannel err", e); }
    };

    pc.onicecandidate = (evt) => {
      if (evt.candidate) {
        console.debug("[webrtc] onicecandidate -> sending candidate for", remoteId, evt.candidate && evt.candidate.candidate && evt.candidate.candidate.slice && evt.candidate.candidate.slice(0,80));
        sendSignal(remoteId, { type: "candidate", candidate: evt.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      console.debug("[webrtc] connection state change for", remoteId, state);
      if (["failed", "disconnected", "closed"].includes(state)) {
        stopStatsPollingForPeer(remoteId);
        setTimeout(() => {
          try { pc.close(); } catch(_) {}
          peersRef.current.delete(remoteId);
          refreshRemoteStreams();
        }, 600);
      }
      emit("peer-connection-state", { peerId: remoteId, state });
    };

    pc.onnegotiationneeded = () => {
      console.debug("[webrtc] negotiationneeded for", remoteId, "pc.signalingState", pc.signalingState);
    };

    peersRef.current.set(remoteId, info);
    return info;
  }

  // ======================
  // Stats polling helpers (unchanged)
  // ======================
  function stopStatsPollingForPeer(remoteId) {
    try {
      const info = peersRef.current.get(remoteId);
      if (!info) return;
      if (info.statsInterval) {
        clearInterval(info.statsInterval);
        info.statsInterval = null;
      }
    } catch (e) {}
  }

  function startStatsPollingForPeer(remoteId) {
    try {
      const info = peersRef.current.get(remoteId);
      if (!info || !info.pc) return;
      if (info.statsInterval) return;
      info.statsInterval = setInterval(async () => {
        try {
          const pc = info.pc;
          if (!pc || pc.connectionState === "closed") {
            stopStatsPollingForPeer(remoteId);
            return;
          }
          const stats = await pc.getStats();
          let rttMs = null;
          let bytesSent = 0, bytesReceived = 0;
          let packetsSent = 0, packetsLost = 0;
          let packetsReceived = 0;
          let timestamp = Date.now();
          stats.forEach((report) => {
            if (report.type === "candidate-pair" && report.selected === true) {
              if (typeof report.currentRoundTripTime === "number") {
                rttMs = Math.round(report.currentRoundTripTime * 1000);
              } else if (typeof report.roundTripTime === "number") {
                rttMs = Math.round(report.roundTripTime * 1000);
              }
            }
            if (report.type === "outbound-rtp") {
              bytesSent += (report.bytesSent || 0);
              packetsSent += (report.packetsSent || 0);
            }
            if (report.type === "inbound-rtp") {
              bytesReceived += (report.bytesReceived || 0);
              packetsLost += (report.packetsLost || 0);
              packetsReceived += (report.packetsReceived || 0);
            }
          });

          const packetsLostPct = (packetsReceived + packetsLost) > 0 ? Math.round((packetsLost / (packetsReceived + packetsLost)) * 10000) / 100 : 0;
          const bitrateKbps = Math.round(((bytesSent + bytesReceived) * 8) / 1000);

          const payload = {
            peerId: remoteId,
            rttMs,
            packetsSent,
            packetsReceived,
            packetsLost,
            packetsLostPct,
            bitrateKbps,
            timestamp,
          };
          emit("peer-stats", payload);
        } catch (e) {}
      }, 5000);
    } catch (e) { console.warn("startStatsPollingForPeer failed", e); }
  }

  // ======================
  // WebSocket send helpers
  // ======================
  function sendRaw(obj) {
    const ws = wsRef.current;
    try {
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
    } catch (e) { console.warn("sendRaw failed", e); }
  }

  function sendSignal(to, signal) {
    sendRaw({ type: "signal", to, from: myIdRef.current, signal });
  }

  // ======================
  // DataChannel helpers (unchanged)
  // ======================
  function sendCaptionToPeer(peerId, payload) {
    try {
      const info = peersRef.current.get(peerId);
      if (!info) return false;
      const ch = info.dataChannel;
      if (ch && ch.readyState === "open") {
        ch.send(JSON.stringify(payload));
        return true;
      }
    } catch (e) { console.warn("sendCaptionToPeer failed", e); }
    return false;
  }

  function sendCaptionToAll(payload) {
    let sent = 0;
    for (const [peerId, info] of peersRef.current.entries()) {
      try {
        const ch = info.dataChannel;
        if (ch && ch.readyState === "open") {
          ch.send(JSON.stringify(payload));
          sent++;
        }
      } catch (e) {
        console.warn("sendCaptionToAll failed for", peerId, e);
      }
    }
    return sent;
  }

  function sendDcPing(peerId) {
    try {
      const info = peersRef.current.get(peerId);
      if (!info || !info.dataChannel) return false;
      const ch = info.dataChannel;
      if (ch.readyState !== "open") return false;
      const payload = JSON.stringify({ __type: "ping", ts: Date.now(), fromSocket: myIdRef.current });
      ch.send(payload);
      return true;
    } catch (e) { return false; }
  }

  // ======================
  // makeOffer / handlers (add logs)
  // ======================
  async function makeOffer(remoteId) {
    try {
      console.debug("[webrtc] makeOffer -> creating offer for", remoteId);
      const info = createPeerConnection(remoteId);
      const pc = info.pc;
      if (mediaStreamRef.current) {
        try { mediaStreamRef.current.getTracks().forEach(t => pc.addTrack(t, mediaStreamRef.current)); } catch(_) {}
      }

      try {
        const existing = info.dataChannel;
        if (!existing) {
          const dc = pc.createDataChannel("captions", { ordered: true });
          info.dataChannel = dc;
          dc.onopen = () => emit("dc-open", { peer: remoteId });
          dc.onmessage = (ev) => {
            try {
              const raw = ev.data;
              const data = typeof raw === "string" ? JSON.parse(raw) : raw;
              if (data && data.__type === "ping") {
                const reply = JSON.stringify({ __type: "pong", ts: data.ts, fromSocket: myIdRef.current });
                try { dc.send(reply); } catch (_) {}
              } else if (data && data.__type === "pong") {
                const rtt = Date.now() - (data.ts || Date.now());
                emit("dc-ping", { peerId: remoteId, rtt });
              } else {
                emit("dc-message", { from: remoteId, data });
              }
            } catch (e) { console.warn("dc onmessage parse", e); }
          };
          dc.onclose = () => {
            emit("dc-closed", { peer: remoteId });
            info.dataChannel = null;
          };
        }
      } catch (e) {
        console.warn("create datachannel failed", e);
      }

      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.debug("[webrtc] send offer sdp for", remoteId, pc.localDescription && pc.localDescription.type);
        sendSignal(remoteId, { type: "offer", sdp: pc.localDescription });
        setTimeout(() => startStatsPollingForPeer(remoteId), 1500);
      } catch (e) { console.warn("makeOffer failed", e); }
    } catch (e) { console.warn("makeOffer top err", e); }
  }

  async function handleOffer(from, sdp) {
    try {
      console.debug("[webrtc] handleOffer from", from, "sdp type", sdp && sdp.type);
      const info = createPeerConnection(from);
      const pc = info.pc;
      if (mediaStreamRef.current) {
        try { mediaStreamRef.current.getTracks().forEach(t => pc.addTrack(t, mediaStreamRef.current)); } catch(_) {}
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.debug("[webrtc] sending answer to", from, pc.localDescription && pc.localDescription.type);
        sendSignal(from, { type: "answer", sdp: pc.localDescription });
        if (info.candidatesQueue && info.candidatesQueue.length) {
          for (const c of info.candidatesQueue) {
            try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch(_) {}
          }
          info.candidatesQueue = [];
        }
        setTimeout(() => startStatsPollingForPeer(from), 1500);
      } catch (e) { console.warn("handleOffer error", e); }
    } catch (e) { console.warn("handleOffer top err", e); }
  }

  async function handleAnswer(from, sdp) {
    try {
      console.debug("[webrtc] handleAnswer from", from, "sdp type", sdp && sdp.type);
      const info = peersRef.current.get(from);
      if (!info) return;
      try {
        await info.pc.setRemoteDescription(new RTCSessionDescription(sdp));
        setTimeout(() => startStatsPollingForPeer(from), 1200);
      } catch (e) { console.warn("handleAnswer error", e); }
    } catch (e) { console.warn("handleAnswer top err", e); }
  }

  async function handleCandidate(from, cand) {
    try {
      console.debug("[webrtc] handleCandidate from", from, cand && cand.candidate && cand.candidate.slice && cand.candidate.slice(0,80));
      const info = peersRef.current.get(from);
      if (!info) return;
      try {
        if (info.pc && info.pc.remoteDescription && info.pc.remoteDescription.type) {
          await info.pc.addIceCandidate(new RTCIceCandidate(cand));
        } else {
          info.candidatesQueue = info.candidatesQueue || [];
          info.candidatesQueue.push(cand);
        }
      } catch (e) { console.warn("candidate add failed", e); }
    } catch (e) { console.warn("handleCandidate top err", e); }
  }

  // ======================
  // toggleCam / toggleMic (unchanged)
  // ======================
  function toggleCam() {
    try {
      const ms = mediaStreamRef.current;
      if (!ms) return;
      const vt = ms.getVideoTracks()[0];
      if (vt) vt.enabled = !vt.enabled;
      emit("local-media-updated", ms);
    } catch (e) { console.warn(e); }
  }

  function toggleMic() {
    try {
      const ms = mediaStreamRef.current;
      if (!ms) return;
      const at = ms.getAudioTracks()[0];
      if (at) at.enabled = !at.enabled;
      emit("local-media-updated", ms);
    } catch (e) { console.warn(e); }
  }

  // ======================
  // screen share helpers (unchanged)
  // ======================
  async function startScreenShare() {
    try {
      const s = await navigator.mediaDevices.getDisplayMedia({ video: true }).catch(()=>null);
      if (!s) throw new Error("No screen stream");
      const screenTrack = s.getVideoTracks()[0];
      const ms = mediaStreamRef.current;
      if (ms) {
        const old = ms.getVideoTracks()[0];
        if (old) { ms.removeTrack(old); old.stop && old.stop(); }
        ms.addTrack(screenTrack);
      } else {
        mediaStreamRef.current = s;
      }

      for (const [, info] of peersRef.current.entries()) {
        try {
          const sender = info.pc.getSenders().find(s => s.track && s.track.kind === "video");
          if (sender) await sender.replaceTrack(screenTrack);
        } catch (e) {}
      }

      emit("local-media-updated", mediaStreamRef.current);
      return s;
    } catch (e) { console.warn("startScreenShare failed", e); throw e; }
  }

  async function stopScreenShare() {
    try {
      const cam = await startLocalMedia({ video: true, audio: true }).catch(()=>null);
      if (!cam) return;
      emit("local-media-updated", mediaStreamRef.current);
    } catch (e) { console.warn(e); }
  }

  // ======================
  // chat & host commands (unchanged)
  // ======================
  function sendChatMessage(roomId, payload) {
    sendRaw({ type: "chat-message", payload, roomId });
  }

  function sendHostCommand(roomId, payload) {
    sendRaw({ type: "host-command", payload, roomId });
  }

  // ======================
  // connect / disconnect (with deterministic offer rule in participants handling)
  // ======================
  async function connect({ roomId, name } = {}) {
    const builtUrl = (() => {
      if (signalingUrl) {
        try {
          const s = String(signalingUrl);
          if (s.includes("{roomId}")) {
            return s.replace("{roomId}", roomId);
          }
          if (s.startsWith("ws://") || s.startsWith("wss://")) {
            if (s.includes("/ws")) {
              return s;
            }
            return `${s.replace(/\/$/, "")}/ws/meet/${roomId}/`;
          }
          if (/^[^/]+(:\d+)?$/.test(s)) {
            const proto = window.location.protocol === "https:" ? "wss" : "ws";
            return `${proto}://${s.replace(/\/$/, "")}/ws/meet/${roomId}/`;
          }
          return s;
        } catch (e) {
          console.warn("signalingUrl parse failed, falling back", e);
        }
      }

      try {
        const backendHost = (import.meta && import.meta.env && import.meta.env.VITE_BACKEND_HOST) || null;
        const backendPort = (import.meta && import.meta.env && import.meta.env.VITE_BACKEND_PORT) || null;
        if (backendHost) {
          const proto = window.location.protocol === "https:" ? "wss" : "ws";
          const hostPort = backendPort ? `${backendHost}:${backendPort}` : backendHost;
          return `${proto}://${hostPort}/ws/meet/${roomId}/`;
        }
      } catch (e) {}

      const loc = window.location;
      const proto = loc.protocol === "https:" ? "wss" : "ws";
      return `${proto}://${loc.host}/ws/meet/${roomId}/`;
    })();

    const url = builtUrl;

    if (!(wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      try {
        wsRef.current = new WebSocket(url);
      } catch (e) {
        console.warn("WebSocket ctor failed", e);
        throw e;
      }
    }

    roomRef.current = roomId || roomRef.current;
    nameRef.current = name || nameRef.current;

    const ws = wsRef.current;

    ws.onopen = () => {
      try {
        sendRaw({ type: "introduce", payload: { name: nameRef.current, roomId: roomRef.current } });
      } catch (e) {
        console.warn("introduce send failed", e);
      }
      emit("ws-open");
    };

    ws.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(ev.data || "{}");
        const payload = msg.payload || {};

        if (msg.type === "assign-id") {
          const id = payload.id || msg.id || null;
          myIdRef.current = id;
          console.debug("[webrtc] assigned id", id);
          emit("assign-id", { id });
          return;
        }

        // =========================
        // deterministic participants handling
        // =========================
        if (msg.type === "participants") {
          const list = msg.participants || payload.participants || msg.list || [];
          setParticipants(list);
          emit("participants", list);

          if (Array.isArray(list) && list.length > MAX_PARTICIPANTS) {
            emit("participants-limit-exceeded", { limit: MAX_PARTICIPANTS, count: list.length });
          }

          // Evaluate offers deterministically using socket ids
          const evaluate = () => {
            const myId = myIdRef.current;
            if (!myId) {
              // try again shortly
              setTimeout(evaluate, 250);
              return;
            }

            for (const p of (list || [])) {
              const pid = p.socketId || p.id || p.clientId;
              if (!pid || pid === myId) continue;
              if (!peersRef.current.has(pid)) {
                try {
                  // deterministic rule: only the side with lexicographically *larger* id initiates offer
                  if (String(pid) > String(myId)) {
                    setTimeout(() => {
                      console.debug("Attempting makeOffer (initiator rule) to", pid, "from", myId);
                      makeOffer(pid);
                    }, 250 + Math.random() * 300);
                  } else {
                    console.debug("Waiting for offer from", pid, " (other side will initiate). myId:", myId);
                  }
                } catch (e) { console.warn("participants eval err", e); }
              }
            }
          };

          evaluate();
          return;
        }

        // =========================
        // Signal messages (offers/answers/candidates) handling
        // =========================
        if (msg.type === "signal" || (msg.type === "signal-message")) {
          const from = msg.from || payload.from;
          const signal = msg.signal || payload.signal || payload;
          if (!from || !signal) return;
          if (signal.type === "offer") await handleOffer(from, signal.sdp || signal);
          else if (signal.type === "answer") await handleAnswer(from, signal.sdp || signal);
          else if (signal.type === "candidate") await handleCandidate(from, signal.candidate || signal.cand || signal);
          return;
        }

        if (msg.type === "offer" || msg.type === "answer" || msg.type === "ice-candidate" || msg.type === "candidate") {
          const from = msg.from || payload.from;
          const sig = payload || msg;
          if (msg.type === "offer") await handleOffer(from, sig.sdp || sig);
          else if (msg.type === "answer") await handleAnswer(from, sig.sdp || sig);
          else if (msg.type === "ice-candidate" || msg.type === "candidate") await handleCandidate(from, sig.candidate || sig.cand || sig);
          return;
        }

        if (msg.type === "chat-message") {
          emit("chat-message", payload || msg.payload || {});
          return;
        }

        if (msg.type === "host-command") {
          emit("host-command", payload || msg.payload || {});
          return;
        }

        emit(msg.type, payload || msg);
      } catch (e) {
        console.warn("ws onmessage parse", e);
      }
    };

    ws.onclose = () => {
      console.debug("[webrtc] websocket closed, cleaning peers");
      for (const [id, info] of peersRef.current.entries()) {
        try {
          stopStatsPollingForPeer(id);
          info.pc.close();
        } catch (_) {}
        peersRef.current.delete(id);
      }
      setRemoteStreams([]);
      setParticipants([]);
      emit("ws-closed");
    };

    ws.onerror = (err) => { console.warn("ws error", err); emit("ws-error", err); };

    return ws;
  }

  function disconnect() {
    try {
      if (wsRef.current) {
        sendRaw({ type: "leave", roomId: roomRef.current });
        wsRef.current.close();
      }
    } catch (e) {}
    for (const [id, info] of peersRef.current.entries()) {
      try { stopStatsPollingForPeer(id); info.pc.close(); } catch (e) {}
      peersRef.current.delete(id);
    }
    setRemoteStreams([]);
    setParticipants([]);
    myIdRef.current = null;
    roomRef.current = null;
    teardownEnhancedAudioProcessing();
  }

  useEffect(() => {
    refreshRemoteStreams();
    // eslint-disable-next-line
  }, []);

  // ======================
  // Exported API
  // ======================
  return {
    wsRef,
    localVideoElRef,
    mediaStreamRef,
    startLocalMedia,
    connect,
    disconnect,
    peerJoined: (cb) => on("peer-joined", cb),
    remoteStreams,
    participants,
    on,
    sendChatMessage,
    sendHostCommand,
    toggleCam,
    toggleMic,
    startScreenShare,
    stopScreenShare,
    selectDevice,
    sendCaptionToPeer,
    sendCaptionToAll,
    sendDcPing,
    MAX_PARTICIPANTS,
  };
}
