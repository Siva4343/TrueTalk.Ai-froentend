import { useEffect, useRef, useState, useCallback } from "react";

const DEFAULT_STUN = [{ urls: "stun:stun.l.google.com:19302" }];

export default function useWebRTC(signalingUrl = null) {
  const wsRef = useRef(null);
  const localVideoElRef = useRef(null); // DOM Video element for the local preview
  const mediaStreamRef = useRef(null); // MediaStream
  const peersRef = useRef(new Map()); // peerId -> { pc, stream, candidatesQueue, name, muted, dataChannel }
  const [remoteStreams, setRemoteStreams] = useState([]); // [{ socketId, stream, name, muted }]
  const [participants, setParticipants] = useState([]);
  const handlersRef = useRef(new Map());
  const myIdRef = useRef(null);
  const roomRef = useRef(null);
  const nameRef = useRef("Guest");

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
      dataChannel: null, // will hold DataChannel object
    };

    const remoteStream = new MediaStream();
    pc.ontrack = (ev) => {
      try {
        // prefer ev.streams
        if (ev.streams && ev.streams.length) {
          ev.streams.forEach(s => s.getTracks().forEach(t => remoteStream.addTrack(t)));
        } else if (ev.track) {
          remoteStream.addTrack(ev.track);
        }
      } catch (e) { /* swallow */ }
      info.stream = remoteStream;
      peersRef.current.set(remoteId, info);
      refreshRemoteStreams();
    };

    // Listen for data channels created by remote peer
    pc.ondatachannel = (ev) => {
      try {
        const ch = ev.channel;
        if (ch && ch.label === "captions") {
          info.dataChannel = ch;
          ch.onopen = () => {
            emit("dc-open", { peer: remoteId });
          };
          ch.onmessage = (mEv) => {
            try {
              const data = typeof mEv.data === "string" ? JSON.parse(mEv.data) : mEv.data;
              emit("dc-message", { from: remoteId, data });
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
        // send candidate using the signaling format used by the backend
        sendSignal(remoteId, { type: "candidate", candidate: evt.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      if (["failed", "disconnected", "closed"].includes(pc.connectionState)) {
        setTimeout(() => {
          try { pc.close(); } catch(_) {}
          peersRef.current.delete(remoteId);
          refreshRemoteStreams();
        }, 600);
      }
    };

    peersRef.current.set(remoteId, info);
    return info;
  }

  function sendRaw(obj) {
    const ws = wsRef.current;
    try {
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
    } catch (e) { console.warn("sendRaw failed", e); }
  }

  function sendSignal(to, signal) {
    sendRaw({ type: "signal", to, from: myIdRef.current, signal });
  }

  // DataChannel helpers: send caption to a single peer (fallback to websocket)
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

  // send to all connected peers (returns number of successful sends)
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

  async function makeOffer(remoteId) {
    const info = createPeerConnection(remoteId);
    const pc = info.pc;
    if (mediaStreamRef.current) {
      try { mediaStreamRef.current.getTracks().forEach(t => pc.addTrack(t, mediaStreamRef.current)); } catch(_) {}
    }

    // Create a DataChannel for captions (only on offerer side)
    try {
      const existing = info.dataChannel;
      if (!existing) {
        const dc = pc.createDataChannel("captions", { ordered: true });
        info.dataChannel = dc;
        dc.onopen = () => emit("dc-open", { peer: remoteId });
        dc.onmessage = (ev) => {
          try {
            const data = typeof ev.data === "string" ? JSON.parse(ev.data) : ev.data;
            emit("dc-message", { from: remoteId, data });
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
      sendSignal(remoteId, { type: "offer", sdp: pc.localDescription });
    } catch (e) { console.warn("makeOffer failed", e); }
  }

  async function handleOffer(from, sdp) {
    const info = createPeerConnection(from);
    const pc = info.pc;
    if (mediaStreamRef.current) {
      try { mediaStreamRef.current.getTracks().forEach(t => pc.addTrack(t, mediaStreamRef.current)); } catch(_) {}
    }
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(from, { type: "answer", sdp: pc.localDescription });
      if (info.candidatesQueue && info.candidatesQueue.length) {
        for (const c of info.candidatesQueue) {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch(_) {}
        }
        info.candidatesQueue = [];
      }
    } catch (e) { console.warn("handleOffer error", e); }
  }

  async function handleAnswer(from, sdp) {
    const info = peersRef.current.get(from);
    if (!info) return;
    try { await info.pc.setRemoteDescription(new RTCSessionDescription(sdp)); } catch (e) { console.warn("handleAnswer error", e); }
  }

  async function handleCandidate(from, cand) {
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
  }

  // startLocalMedia - robust constraints & fallback
  async function startLocalMedia(opts = { video: true, audio: true, deviceId: null, resolution: "auto" }) {
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

      const constraints = { audio: !!opts.audio, video: videoConstraint };

      const tryGet = async (c) => {
        try { return await navigator.mediaDevices.getUserMedia(c); } catch (err) { return null; }
      };

      let s = await tryGet(constraints);

      if (!s) {
        // fallback attempts
        s = await tryGet({ audio: !!opts.audio, video: !!opts.video });
      }

      if (!s) throw new Error("Could not obtain media");

      mediaStreamRef.current = s;

      // setup local video element if present
      if (localVideoElRef.current) {
        try {
          localVideoElRef.current.srcObject = s;
          localVideoElRef.current.muted = true;
          localVideoElRef.current.play && localVideoElRef.current.play().catch(()=>{});
        } catch (e) {}
      }

      // add tracks to existing peer connections (senders)
      for (const [id, info] of peersRef.current.entries()) {
        try {
          const pc = info.pc;
          const senders = pc.getSenders();
          const videoTrack = s.getVideoTracks()[0];
          const audioTrack = s.getAudioTracks()[0];
          // replace or add
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

  async function selectDevice(deviceId) {
    try {
      if (!navigator.mediaDevices || !mediaStreamRef.current) return;
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } }, audio: false }).catch(()=>null);
      if (!newStream) return;
      const newTrack = newStream.getVideoTracks()[0];
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
    } catch (e) { console.warn(e); }
  }

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
      // re-acquire camera
      const cam = await startLocalMedia({ video: true, audio: true }).catch(()=>null);
      if (!cam) return;
      // newly acquired local tracks replaced to peers in startLocalMedia
      emit("local-media-updated", mediaStreamRef.current);
    } catch (e) { console.warn(e); }
  }

  function sendChatMessage(roomId, payload) {
    sendRaw({ type: "chat-message", payload, roomId });
  }

  function sendHostCommand(roomId, payload) {
    sendRaw({ type: "host-command", payload, roomId });
  }

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
          emit("assign-id", { id });
          return;
        }

        if (msg.type === "participants") {
          const list = msg.participants || payload.participants || msg.list || [];
          setParticipants(list);
          emit("participants", list);

          // create offers to new peers if needed
          for (const p of (list || [])) {
            const pid = p.socketId || p.id || p.clientId;
            if (!pid || pid === myIdRef.current) continue;
            if (!peersRef.current.has(pid)) {
              setTimeout(() => makeOffer(pid), 250 + Math.random() * 300);
            }
          }
          return;
        }

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
      for (const [id, info] of peersRef.current.entries()) {
        try { info.pc.close(); } catch (_) {}
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
      try { info.pc.close(); } catch (e) {}
      peersRef.current.delete(id);
    }
    setRemoteStreams([]);
    setParticipants([]);
    myIdRef.current = null;
    roomRef.current = null;
  }

  // whenever peers change or streams change, refresh
  useEffect(() => {
    refreshRemoteStreams();
    // eslint-disable-next-line
  }, []);

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
    sendChatMessage, // still available for non-caption chat
    sendHostCommand,
    toggleCam,
    toggleMic,
    startScreenShare,
    stopScreenShare,
    selectDevice,
    // DataChannel caption helpers exposed for UI layer
    sendCaptionToPeer,
    sendCaptionToAll,
  };
}
