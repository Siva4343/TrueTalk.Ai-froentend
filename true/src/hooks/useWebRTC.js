// src/hooks/useWebRTC.js
import { useEffect, useRef, useState, useCallback } from "react";

const DEFAULT_STUN = [{ urls: "stun:stun.l.google.com:19302" }];

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

  function emit(ev, payload) {
    const list = handlersRef.current.get(ev) || [];
    list.forEach((fn) => {
      try { fn(payload); } catch (e) {}
    });
  }

  const on = useCallback((ev, cb) => {
    if (!handlersRef.current.has(ev)) handlersRef.current.set(ev, []);
    handlersRef.current.get(ev).push(cb);
    return () => {
      const arr = handlersRef.current.get(ev) || [];
      handlersRef.current.set(ev, arr.filter((f) => f !== cb));
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
  }

  function createPeerConnection(remoteId, opts = {}) {
    if (peersRef.current.has(remoteId)) return peersRef.current.get(remoteId);

    const pc = new RTCPeerConnection({ iceServers: DEFAULT_STUN });
    const info = { pc, stream: null, candidatesQueue: [], name: opts.name, muted: false, isHost: !!opts.isHost };

    let dc = null;
    const remoteStream = new MediaStream();
    pc.ontrack = (ev) => {
      try {
        ev.streams && ev.streams.length && ev.streams.forEach(s => s.getTracks().forEach(t => remoteStream.addTrack(t)));
      } catch (e) {}
      info.stream = remoteStream;
      peersRef.current.set(remoteId, info);
      refreshRemoteStreams();
    };

    pc.onicecandidate = (evt) => {
      if (!evt.candidate) return;
      sendSignal(remoteId, { type: "candidate", candidate: evt.candidate });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === "failed" || pc.connectionState === "closed" || pc.connectionState === "disconnected") {
        setTimeout(() => {
          try { pc.close(); } catch (_) {}
          peersRef.current.delete(remoteId);
          refreshRemoteStreams();
        }, 600);
      }
    };

    info.pc = pc;
    info.dc = dc;
    peersRef.current.set(remoteId, info);
    return info;
  }

  function sendRaw(obj) {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(obj));
    }
  }

  function sendSignal(to, signal) {
    const payload = { type: "signal", to, from: myIdRef.current, signal };
    sendRaw(payload);
  }

  async function makeOffer(remoteId) {
    const info = createPeerConnection(remoteId);
    const pc = info.pc;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, mediaStreamRef.current));
    }

    try {
      if (!info.dc) {
        info.dc = pc.createDataChannel("chat");
        info.dc.onopen = () => {};
        info.dc.onmessage = () => {};
      }
    } catch (e) {}

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal(remoteId, { type: "offer", sdp: pc.localDescription });
  }

  async function handleOffer(from, sdp) {
    const info = createPeerConnection(from);
    const pc = info.pc;
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, mediaStreamRef.current));
    }
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(from, { type: "answer", sdp: pc.localDescription });

      if (info.candidatesQueue && info.candidatesQueue.length) {
        info.candidatesQueue.forEach(c => {
          try { pc.addIceCandidate(c).catch(()=>{}); } catch(_) {}
        });
        info.candidatesQueue = [];
      }
    } catch (e) {
      console.warn("handleOffer error", e);
    }
  }

  async function handleAnswer(from, sdp) {
    const info = peersRef.current.get(from);
    if (!info) return;
    try {
      await info.pc.setRemoteDescription(new RTCSessionDescription(sdp));
    } catch (e) {
      console.warn("handleAnswer error", e);
    }
  }

  async function handleCandidate(from, cand) {
    const info = peersRef.current.get(from);
    if (!info) return;
    try {
      if (info.pc && info.pc.remoteDescription) {
        await info.pc.addIceCandidate(new RTCIceCandidate(cand));
      } else {
        info.candidatesQueue = info.candidatesQueue || [];
        info.candidatesQueue.push(cand);
      }
    } catch (e) {
      console.warn("candidate add failed", e);
    }
  }

// REPLACE the existing startLocalMedia with this block:
async function startLocalMedia(opts = { video: true, audio: true, deviceId: null, resolution: "auto" }) {
  try {
    const res = (opts.resolution || "auto").toString().toLowerCase();
    let videoConstraint = false;

    if (opts.video) {
      if (res === "4k") {
        videoConstraint = {
          width: { ideal: 3840 },
          height: { ideal: 2160 },
          frameRate: { ideal: 30, max: 60 },
        };
      } else if (res === "1080p" || res === "1080") {
        videoConstraint = {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        };
      } else if (res === "720p" || res === "720") {
        videoConstraint = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        };
      } else {
        videoConstraint = { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } };
      }

      if (opts.deviceId) {
        videoConstraint.deviceId = { exact: opts.deviceId };
      }
    }

    const constraints = { audio: !!opts.audio, video: videoConstraint };

    // Try requested constraints, then progressively fallback if rejected
    const tryGet = async (c) => {
      try {
        return await navigator.mediaDevices.getUserMedia(c);
      } catch (err) {
        return null;
      }
    };

    let s = await tryGet(constraints);

    // fallback chain
    if (!s) {
      if (res === "4k") {
        s = await tryGet({ audio: !!opts.audio, video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 }, deviceId: opts.deviceId ? { exact: opts.deviceId } : undefined } });
      }
      if (!s && (res === "4k" || res === "1080p" || res === "1080")) {
        s = await tryGet({ audio: !!opts.audio, video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, deviceId: opts.deviceId ? { exact: opts.deviceId } : undefined } });
      }
      if (!s) {
        // final fallback: let browser pick anything available
        s = await tryGet({ audio: !!opts.audio, video: !!opts.video });
      }
    }

    if (!s) throw new Error("Could not obtain media stream");

    mediaStreamRef.current = s;

    if (localVideoElRef.current) {
      try {
        localVideoElRef.current.srcObject = s;
        localVideoElRef.current.muted = true;
        localVideoElRef.current.play && localVideoElRef.current.play().catch(()=>{});
      } catch (e) {}
    }

    // notify UI that local media changed
    emit("local-media-updated", mediaStreamRef.current);

    return s;
  } catch (e) {
    console.warn("startLocalMedia failed", e);
    throw e;
  }
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
      if (oldTrack) {
        ms.removeTrack(oldTrack);
        oldTrack.stop && oldTrack.stop();
      }
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
      if (!mediaStreamRef.current) return;
      const cam = await startLocalMedia({ video: true, audio: true }).catch(()=>null);
      if (!cam) return;
      const newTrack = mediaStreamRef.current.getVideoTracks()[0];
      for (const [, info] of peersRef.current.entries()) {
        try {
          const sender = info.pc.getSenders().find(s => s.track && s.track.kind === "video");
          if (sender) await sender.replaceTrack(newTrack);
        } catch (e) {}
      }
      emit("local-media-updated", mediaStreamRef.current);
    } catch (e) { console.warn(e); }
  }

  function sendChatMessage(roomId, payload) {
    sendRaw({ type: "chat-message", roomId, payload });
  }

  function sendHostCommand(roomId, payload) {
    sendRaw({ type: "host-command", roomId, payload });
  }

  async function connect({ roomId, name } = {}) {
    const url = signalingUrl || (() => {
      const loc = window.location;
      const proto = loc.protocol === "https:" ? "wss" : "ws";
      return `${proto}://${loc.host}/ws`;
    })();

    if (!(wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      wsRef.current = new WebSocket(url);
    }

    roomRef.current = roomId || roomRef.current;
    nameRef.current = name || nameRef.current;
    const ws = wsRef.current;

    ws.onopen = () => {
      sendRaw({ type: "join", roomId: roomRef.current, name: nameRef.current });
    };

    ws.onmessage = async (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === "assign-id") {
          myIdRef.current = msg.id;
          emit("assign-id", { id: msg.id });
        } else if (msg.type === "participants") {
          setParticipants(msg.list || []);
          emit("participants", msg.list || []);
          for (const p of (msg.list || [])) {
            if (p.socketId === myIdRef.current) continue;
            if (!peersRef.current.has(p.socketId)) {
              setTimeout(() => { try { makeOffer(p.socketId); } catch (e) {} }, 300 + Math.random() * 200);
            }
          }
        } else if (msg.type === "signal") {
          const { from, signal } = msg;
          if (!from || !signal) return;
          if (signal.type === "offer") {
            await handleOffer(from, signal.sdp);
          } else if (signal.type === "answer") {
            await handleAnswer(from, signal.sdp);
          } else if (signal.type === "candidate") {
            await handleCandidate(from, signal.candidate || signal.cand || signal);
          }
        } else if (msg.type === "chat-message") {
          emit("chat-message", msg.payload);
        } else if (msg.type === "host-command") {
          emit("host-command", msg.payload);
        } else {
          emit(msg.type, msg);
        }
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
  };
}
