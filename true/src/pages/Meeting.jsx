// src/pages/Meeting.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import useWebRTC from "../hooks/useWebRTC";
import Toolbar from "../components/Toolbar";
import RightPanel from "../components/RightPanel";
import VideoGrid from "../components/VideoGrid";
import InviteModal from "../components/InviteModal";
import LiveCaptionBar from "../components/LiveCaptionBar";
import "../styles/meeting.css";
import "../styles/live-caption.css"; // ensure filename matches your file

export default function MeetingPage() {
  const qs = new URLSearchParams(window.location.search);
  const name = qs.get("name") || "Guest";
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const roomId = pathParts[pathParts.length - 1] || qs.get("room") || "";

  // -----------------------------
  // SIGNALING URL RESOLUTION (UPDATED)
  // -----------------------------
  // This block prefers VITE_SIGNALING_URL (if present). Otherwise it builds a ws/wss URL
  // using the current page host and port 8000 (Django dev server).
  const signalingResolved = (() => {
    try {
      const env = import.meta?.env?.VITE_SIGNALING_URL || null;
      if (env) return String(env).replace(/\/$/, "");
    } catch (e) {
      // ignore
    }

    // Use same protocol style as the page (wss for https, ws for http)
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.hostname || "127.0.0.1";
    const port = 8000; // Django Channels/dev server default
    return `${proto}://${host}:${port}`;
  })();

  const signalingUrl = `${String(signalingResolved).replace(/\/$/, "")}/ws/meet/{roomId}/`;
  // debug
  console.log("[MeetingPage] signalingUrl ->", signalingUrl);

  // -----------------------------
  // useWebRTC hook (must be top-level)
  // pass the signalingUrl so client connects to backend (Channels)
  // -----------------------------
  const {
    wsRef,
    localVideoElRef,
    mediaStreamRef,
    startLocalMedia,
    connect,
    disconnect,
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
    // DataChannel helper exposed by hook
    sendCaptionToAll,
  } = useWebRTC(signalingUrl);

  // UI state
  const [mySocketId, setMySocketId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [pinnedId, setPinnedId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [raiseHands, setRaiseHands] = useState(new Set());
  const [error, setError] = useState(null);

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);

  // Meeting start time state (new)
  const [meetingStartAt, setMeetingStartAt] = useState(null); // timestamp (ms) when meeting was started by host

  // live captions
  const [liveCcEnabled, setLiveCcEnabled] = useState(false);
  const [liveCcLang, setLiveCcLang] = useState("en-US"); // selected **target** language for captions UI
  const speechRef = useRef(null);
  const speechRestartTimerRef = useRef(null); // watchdog timer for SpeechRecognition
  const [captions, setCaptions] = useState([]); // items have { id?, text, from, time, __final }
  // dedupe between DC and WS
  const lastCaptionFromRef = useRef({ from: null, text: null, time: 0 });

  // native cam/mic state
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  // Recording state
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStartedBy, setRecordingStartedBy] = useState(null);
  const [lastRecordingUrl, setLastRecordingUrl] = useState(null);

  // Camera quality (new)
  // values: "auto" (default), "4k", "1080p", "720p"
  const [cameraQuality, setCameraQuality] = useState("auto");

  // helpers
  const hostLocked = false;
  const hostName = name || "Host";

  const hostMuteAll = () => {
    sendHostCommand && sendHostCommand(roomId, { type: "mute-all" });
  };
  const hostKick = (socketId) => {
    sendHostCommand && sendHostCommand(roomId, { type: "kicked", target: socketId });
  };
  const handleEndMeeting = () => {
    sendHostCommand && sendHostCommand(roomId, { type: "end-meeting" });
    try { disconnect(); } catch (_) {}
    window.location.href = "/";
  };

  // Recording timer effect
  useEffect(() => {
    let interval;
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        setRecordingTime(Math.floor((Date.now() - recordingStartTime) / 1000));
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingStartTime]);

  // --- Recording helpers (unchanged from your code) ---
  const ensureLocalStream = async () => {
    try {
      if (mediaStreamRef && mediaStreamRef.current) return mediaStreamRef.current;
      if (typeof startLocalMedia === "function") {
        try {
          const s = await startLocalMedia({ video: true, audio: true, resolution: cameraQuality }).catch(()=>null);
          if (s) {
            if (mediaStreamRef && !mediaStreamRef.current) mediaStreamRef.current = s;
            return s;
          }
        } catch (_) {}
      }
      if (navigator.mediaDevices?.getUserMedia) {
        const s2 = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(()=>null);
        if (s2) {
          if (mediaStreamRef && !mediaStreamRef.current) mediaStreamRef.current = s2;
          return s2;
        }
      }
      return null;
    } catch (e) {
      console.warn("ensureLocalStream failed", e);
      return null;
    }
  };

  const handleStartRecording = async () => {
    try {
      if (!mediaStreamRef || !mediaStreamRef.current) {
        const got = await ensureLocalStream();
        if (!got) {
          setError("No local media stream available for recording.");
          return;
        } else {
          try {
            if (localVideoElRef && localVideoElRef.current) {
              localVideoElRef.current.srcObject = got;
              localVideoElRef.current.muted = true;
              localVideoElRef.current.play && localVideoElRef.current.play().catch(()=>{});
            }
          } catch (_) {}
        }
      }

      const possibleTypes = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
        'video/mp4'
      ];
      let mimeType = "";
      for (const t of possibleTypes) {
        if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
          mimeType = t;
          break;
        }
      }
      const opts = mimeType ? { mimeType } : {};

      const mr = new MediaRecorder(mediaStreamRef.current, opts);
      const chunks = [];
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) {
          chunks.push(ev.data);
        }
      };
      mr.onstart = () => {
        setRecordedChunks([]);
        setIsRecording(true);
        setRecordingStartTime(Date.now());
        setRecordingStartedBy(name || "You");
        setChatMessages(prev => [...prev, { type: "system", text: `🔴 Recording started by ${name}`, time: Date.now(), _localId: `recording-start-${Date.now()}` }]);
        sendHostCommand && sendHostCommand(roomId, { type: "record-toggle", enabled: true, startTime: Date.now(), startedBy: name });
      };
      mr.onstop = () => {
        const blob = new Blob(chunks, { type: mr.mimeType || "video/webm" });
        setRecordedBlob(blob);
        setRecordedChunks(chunks.slice());
        try {
          const url = URL.createObjectURL(blob);
          setLastRecordingUrl(url);
          setRecordedUrl(url);
        } catch (e) { console.warn("createObjectURL failed:", e); }
        setIsRecording(false);
        const duration = recordingTime || Math.round((Date.now() - (recordingStartTime || Date.now())) / 1000);
        setRecordingStartTime(null);
        setRecordingStartedBy(null);
        setChatMessages(prev => [...prev, { type: "system", text: `⏹️ Recording stopped. Duration: ${formatRecordingTime(duration)}. File saved.`, time: Date.now(), _localId: `recording-stop-${Date.now()}` }]);
        sendHostCommand && sendHostCommand(roomId, { type: "record-toggle", enabled: false, duration, stoppedBy: name });

        try {
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = URL.createObjectURL(blob);
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T','_').split('Z')[0];
          a.download = `meeting-recording-${roomId}-${timestamp}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (e) {}
      };

      mr.start();
      setMediaRecorder(mr);
    } catch (err) {
      console.error("start recording err", err);
      setError("Recording failed to start. See console for details.");
    }
  };

  const handleStopRecording = () => {
    try {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      } else {
        setIsRecording(false);
        setRecordingStartTime(null);
        setRecordingStartedBy(null);
        sendHostCommand && sendHostCommand(roomId, { type: "record-toggle", enabled: false, duration: recordingTime, stoppedBy: name });
      }
    } catch (e) {
      console.warn("stop recording failed", e);
    }
  };

  const handleDownloadRecording = () => {
    if (!recordedBlob && !lastRecordingUrl) {
      alert("No recording available to download. Please start and stop a recording first.");
      return;
    }
    const url = lastRecordingUrl || URL.createObjectURL(recordedBlob);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T','_').split('Z')[0];
    const filename = `meeting-recording-${roomId}-${timestamp}.webm`;
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setChatMessages(prev => [...prev, { type: "system", text: `📥 Recording re-downloaded by ${name}`, time: Date.now(), _localId: `download-${Date.now()}` }]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes','KB','MB','GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k,i)).toFixed(2)) + ' ' + sizes[i];
  };
  const formatRecordingTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  // normalize server messages unchanged
  const normalizeMessageFromServer = (m) => {
    if (!m) return null;
    const base = {
      type: m.type || m.messageType || "text",
      from: m.from || m.sender || m.name || m.user || "Someone",
      time: m.time || m.ts || Date.now(),
      _localId: m._localId || m._id || m.id || undefined,
    };
    if (base.type === "file") {
      return {...base, name: m.name || m.filename || m.fileName, mime: m.mime || m.fileType, dataUrl: m.dataUrl || m.url || m.fileUrl || m.link, size: m.size || m.fileSize };
    }
    if (base.type === "audio") {
      return {...base, url: m.url || m.audioUrl || m.dataUrl, duration: m.duration, size: m.size };
    }
    return {...base, type: "text", text: m.text || m.message || m.body || (typeof m === "string" ? m : "") };
  };

  /* Setup event listeners for signaling events (handles captions & commands) */
  useEffect(() => {
    if (!on) return;

    const offAssign = on("assign-id", (p) => { if (p?.id) setMySocketId(p.id); });

    const offParts = on("participants", (list) => {
      if (!Array.isArray(list)) return;
      setParticipants(list);
      const first = (list && list.length) ? list[0] : null;
      const amHost = !!(first && first.socketId && first.socketId === mySocketId);
      setIsHost(amHost);

      // set meeting start when host appears (only set once)
      if (!meetingStartAt && amHost) {
        setMeetingStartAt(Date.now());
      }
    });

    const offHost = on("host-command", (c) => {
      if (!c) return;
      if (c.type === "raise-hand") {
        setRaiseHands(prev => {
          const s = new Set(prev);
          if (c.add) s.add(c.from); else s.delete(c.from);
          return s;
        });
      }
      if (c.type === "mute-all") {
        try {
          if (mediaStreamRef?.current) {
            const at = mediaStreamRef.current.getAudioTracks()[0];
            if (at) at.enabled = false;
          }
        } catch (e) {}
      }
      if (c.type === "kicked" && c.target === mySocketId) {
        alert("You were removed by the host");
        try { disconnect(); } catch (_) {}
        window.location.href = "/";
      }
      if (c.type === "end-meeting" && c.byHost) {
        alert("Host ended meeting");
        try { disconnect(); } catch (_) {}
        window.location.href = "/";
      }
      if (c.type === "record-toggle") {
        if (c.enabled && !isRecording) {
          setIsRecording(true);
          setRecordingStartTime(c.startTime || Date.now());
          setRecordingStartedBy(c.startedBy || "Someone");
          setChatMessages(prev => [...prev, { type: "system", text: `🔴 Recording started by ${c.startedBy || "a participant"}`, time: Date.now(), _localId: `recording-start-${Date.now()}` }]);
        } else if (!c.enabled && isRecording) {
          setIsRecording(false);
          const duration = c.duration || recordingTime;
          setRecordingStartTime(null);
          setRecordingStartedBy(null);
          setChatMessages(prev => [...prev, { type: "system", text: `⏹️ Recording stopped by ${c.stoppedBy || "a participant"}. Duration: ${formatRecordingTime(duration)}`, time: Date.now(), _localId: `recording-stop-${Date.now()}` }]);
        }
      }
    });

    // chat-message (from server) - server does translations for captions
    const offChat = on("chat-message", (m) => {
      if (!m) return;
      if (m && m.type === "caption") {
        // When the server sends caption messages (with translations) we display according to selected lang
        const langShort = (liveCcLang || "en-US").split("-")[0];
        const translations = m.translations || {};
        let showText = m.text || "";
        if (langShort && translations && translations[langShort]) showText = translations[langShort];

        const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

        setCaptions(prev => {
          const p = prev.slice();
          const from = m.from || "Someone";
          const time = m.time || Date.now();
          const isFinal = !!m.isFinal;
          const text = (showText || "").trim();

          // dedupe: if recently received same caption from same source (likely DC -> WS duplication) skip
          const last = lastCaptionFromRef.current;
          if (last.from === from && last.text === text && Math.abs((time || 0) - (last.time || 0)) < 3000) {
            // skip duplicate
            return p;
          }
          // update last seen (server path)
          lastCaptionFromRef.current = { from, text, time };

          if (!text) return p;

          if (isFinal) {
            p.push({ id: makeId(), text, from, time, __final: true });
            // remove previous interim for same speaker
            for (let i = p.length - 2; i >= 0; i--) {
              if (!p[i].__final && p[i].from === from) {
                p.splice(i, 1);
                break;
              }
            }
          } else {
            // interim: replace or add
            let replaced = false;
            for (let i = p.length - 1; i >= 0; i--) {
              const it = p[i];
              if (!it.__final && it.from === from) {
                p[i] = { ...it, text, time, from, __final: false };
                replaced = true;
                break;
              }
            }
            if (!replaced) p.push({ id: `i-${makeId()}`, text, from, time, __final: false });
          }

          const MAX = 200;
          if (p.length > MAX) return p.slice(p.length - MAX);
          return p;
        });

        return;
      }

      // non-caption chat
      setChatMessages(prev => [...prev, m]);
    });

    // DataChannel messages (peer captions via P2P)
    const offDc = on("dc-message", ({ from, data }) => {
      try {
        if (!data) return;
        if (data.type === "caption") {
          // choose a stable id for dedupe: prefer fromSocket (if sender provided it),
          // otherwise fall back to the remote peer id 'from' or fromName.
          const fromSocketId = data.fromSocket || data.from || from || null;
          const fromName = data.fromName || data.from || from || "Someone";
          const text = (data.text || "").trim();
          const isFinal = !!data.isFinal;
          const time = data.time || Date.now();

          // dedupe between DC and WS: skip if same as last seen (close in time)
          const last = lastCaptionFromRef.current;
          if (last.from === fromSocketId && last.text === text && Math.abs((time || 0) - (last.time || 0)) < 3000) {
            return;
          }
          // update last seen based on stable id
          lastCaptionFromRef.current = { from: fromSocketId, text, time };

          setCaptions(prev => {
            const p = prev.slice();
            if (isFinal) {
              p.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2,8)}`, text, from: fromName, time, __final: true });
              // remove previous interim for same speaker
              for (let i = p.length - 2; i >= 0; i--) {
                if (!p[i].__final && p[i].from === fromName) {
                  p.splice(i, 1);
                  break;
                }
              }
            } else {
              // interim: replace or add
              let replaced = false;
              for (let i = p.length - 1; i >= 0; i--) {
                const it = p[i];
                if (!it.__final && it.from === fromName) {
                  p[i] = { ...it, text, time, from: fromName, __final: false };
                  replaced = true;
                  break;
                }
              }
              if (!replaced) p.push({ id: `i-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, text, from: fromName, time, __final: false });
            }

            const MAX = 200;
            if (p.length > MAX) return p.slice(p.length - MAX);
            return p;
          });
        }
      } catch (e) { console.warn("dc-message handler err", e); }
    });

    // safer cleanup wrapper to avoid errors if any offX is undefined
    return () => {
      try { offAssign && offAssign(); } catch(_) {}
      try { offParts && offParts(); } catch(_) {}
      try { offHost && offHost(); } catch(_) {}
      try { offChat && offChat(); } catch(_) {}
      try { offDc && offDc(); } catch(_) {}
    };
  }, [on, mySocketId, isRecording, recordingTime, liveCcLang, sendCaptionToAll, sendChatMessage, meetingStartAt]);

  /* Auto-start camera and connect */
  useEffect(() => {
    (async () => {
      try {
        if (typeof startLocalMedia === "function") {
          try { await startLocalMedia({ video: true, audio: true, resolution: cameraQuality }); } catch (_) {}
        }
        if ((!mediaStreamRef || !mediaStreamRef.current) && navigator.mediaDevices?.getUserMedia) {
          const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(()=>null);
          if (s) mediaStreamRef.current = s;
        }
        await connect({ roomId, name }).catch(e => console.warn("connect failed", e));
      } catch (e) {
        console.warn("autostart failed", e);
        setError("Camera/mic permission required.");
      }
    })();
    // eslint-disable-next-line
  }, [roomId, cameraQuality]);

  /* ---------- Live captions (SpeechRecognition) ---------- */
  const startLiveCC = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Live captions not supported in this browser."); return; }

    try {
      // If there's already a recognizer, stop it first
      if (speechRef.current) {
        try { speechRef.current.onresult = null; speechRef.current.onend = null; speechRef.current.onerror = null; speechRef.current.stop(); } catch(_) {}
        speechRef.current = null;
      }

      const r = new SpeechRecognition();

      // IMPORTANT: recognition language should be the **source** language.
      // We will set it to English by default unless user explicitly selected an English target
      // (i.e. if they chose en-XX as UI language we respect it).
      const chosenTarget = (liveCcLang || "en-US").toString();
      const sourceLang = (String(chosenTarget).toLowerCase().startsWith("en")) ? chosenTarget : "en-US";
      r.lang = sourceLang;

      r.interimResults = true;
      r.continuous = true;

      r.onresult = (ev) => {
        try {
          const resultsArr = Array.from(ev.results || []);
          const transcript = resultsArr.map(res => (res[0] && res[0].transcript) ? res[0].transcript.trim() : "").join(' ').trim();

          const lastIndex = ev.results.length - 1;
          const lastResult = ev.results[lastIndex];
          const isFinal = !!lastResult.isFinal;

          if (!transcript) return;

          // Update local UI immediately (shows recognized text)
          if (isFinal) {
            setCaptions(prev => {
              const p = prev.slice();
              if (p.length && p[p.length - 1] && !p[p.length - 1].__final) {
                p[p.length - 1] = { text: transcript, from: name || "You", time: Date.now(), __final: true };
              } else {
                p.push({ text: transcript, from: name || "You", time: Date.now(), __final: true });
              }
              return p;
            });
          } else {
            setCaptions(prev => {
              const p = prev.slice();
              if (p.length && p[p.length - 1] && !p[p.length - 1].__final) {
                p[p.length - 1] = { ...p[p.length - 1], text: transcript, time: Date.now(), __final: false };
              } else {
                p.push({ text: transcript, from: name || "You", time: Date.now(), __final: false });
              }
              return p;
            });
          }

          // Build payload for DataChannel
          const dcPayload = {
            type: "caption",
            text: transcript,
            fromName: name || "You",
            time: Date.now(),
            isFinal,
            // IMPORTANT: include my socket id so clients can dedupe DC vs WS messages:
            fromSocket: mySocketId || null
          };

          // Try DataChannel fast path (if available)
          let sentCount = 0;
          try {
            if (typeof sendCaptionToAll === "function") {
              sentCount = sendCaptionToAll(dcPayload);
            }
          } catch (e) {
            console.warn("sendCaptionToAll failed", e);
            sentCount = 0;
          }

          // Only send *interim* to server when no DC is available (avoid duplicates).
          // Always send final to server (for translation/history).
          try {
            if (typeof sendChatMessage === "function") {
              const shortLang = (liveCcLang || "en-US").split("-")[0].toLowerCase();
              const shouldSendToServer = (sentCount === 0) || isFinal;
              if (shouldSendToServer) {
                sendChatMessage(roomId, {
                  type: "caption",
                  from: name,
                  text: transcript,
                  time: Date.now(),
                  isFinal: isFinal,
                  targetLang: shortLang // tell server which language to prioritise
                });
              }
            }
          } catch (e) { console.warn("send caption ws failed", e); }

        } catch (e) {
          console.warn("onresult handler failed", e);
        }
      };

      r.onerror = (e) => {
        console.warn("speech err", e);
        // if aborted or other error, tear down and restart after a short delay
        try {
          if (speechRef.current) {
            try { speechRef.current.onresult = null; speechRef.current.onend = null; } catch(_) {}
            speechRef.current = null;
          }
        } catch (_) {}
        if (liveCcEnabled) {
          setTimeout(() => {
            try { startLiveCC(); } catch(_) {}
          }, 300);
        }
      };

      r.onend = () => {
        // when the native recognizer ends, clear the reference and restart if enabled
        try { speechRef.current = null; } catch(_) {}
        if (liveCcEnabled) {
          setTimeout(() => {
            try { startLiveCC(); } catch(_) {}
          }, 250);
        }
      };

      r.start();
      speechRef.current = r;
      setLiveCcEnabled(true);

      // set up periodic restart to avoid long-running aborted/quiet states (every 45s)
      try {
        if (speechRestartTimerRef.current) {
          clearInterval(speechRestartTimerRef.current);
          speechRestartTimerRef.current = null;
        }
        speechRestartTimerRef.current = setInterval(() => {
          try {
            // restart recognizer to keep it healthy
            if (speechRef.current) {
              try { speechRef.current.onresult = null; speechRef.current.onend = null; speechRef.current.onerror = null; speechRef.current.stop(); } catch(_) {}
              speechRef.current = null;
            }
            startLiveCC();
          } catch (err) { /* swallow */ }
        }, 45000); // 45 seconds
      } catch (e) {}
    } catch (e) {
      console.warn("startLiveCC failed", e);
      setError("Live captions failed.");
    }
  };

  const stopLiveCC = () => {
    setLiveCcEnabled(false);
    if (speechRef.current) {
      try { speechRef.current.onresult = null; speechRef.current.onend = null; speechRef.current.onerror = null; speechRef.current.stop(); } catch(_) {}
      speechRef.current = null;
    }
    if (speechRestartTimerRef.current) {
      try { clearInterval(speechRestartTimerRef.current); } catch(_) {}
      speechRestartTimerRef.current = null;
    }
    setCaptions(prev => prev.map(c => ({ ...c, __final: !!c.__final })));
  };

  const handleChangeLiveCcLang = (lang) => {
    setLiveCcLang(lang);
    // we keep recognition language as source (default en-US). For a more advanced flow
    // you could add a UI control "spoken language" separate from "caption language".
    if (liveCcEnabled) {
      try {
        stopLiveCC();
        setTimeout(() => startLiveCC(), 250);
      } catch (e) { console.warn("failed to restart live cc after lang change", e); }
    }
  };

  /* toolbar controls wiring */
  const handleToggleLiveCc = (enabled) => {
    if (enabled) startLiveCC(); else stopLiveCC();
  };

  const handleToggleRecord = (shouldRecord) => {
    if (shouldRecord) handleStartRecording(); else handleStopRecording();
  };

  /* camera/mic control proxies */
  const handleToggleCam = () => { try { toggleCam && toggleCam(); setCamOn(prev => !prev); } catch (e) { setError("Camera toggle failed"); } };
  const handleToggleMic = () => { try { toggleMic && toggleMic(); setMicOn(prev => !prev); } catch (e) { setError("Mic toggle failed"); } };

  /* combined participants for grid (remote only) */
  const combinedParticipants = useMemo(() => {
    const remote = (remoteStreams || []).map(r => ({ socketId: r.socketId, stream: r.stream, name: r.name || "Guest", muted: !!r.muted }));
    return [...remote];
  }, [remoteStreams]);

  // build invite link
  const inviteLink = (() => {
    try {
      const url = new URL(window.location.href);
      if (!url.pathname.includes(roomId) && roomId) {
        url.pathname = `/meet/${roomId}`;
      }
      url.searchParams.set("name", name || "Guest");
      return url.toString();
    } catch (e) { return window.location.href; }
  })();

  const handleScreenShare = async () => {
    try {
      await startScreenShare();
    } catch (e) {
      console.warn("screen share failed", e);
      setError("Screen share failed or was cancelled.");
      setTimeout(() => setError(null), 3500);
    }
  };

  // handle device selection from RightPanel; request media with current quality
  const handleSelectDevice = async (deviceId) => {
    try {
      // prefer startLocalMedia with deviceId+resolution so constraints apply on re-acquire
      if (typeof startLocalMedia === "function") {
        await startLocalMedia({ video: true, audio: true, deviceId, resolution: cameraQuality }).catch(()=>null);
      } else if (typeof selectDevice === "function") {
        await selectDevice(deviceId);
      }
    } catch (e) { console.warn("handleSelectDevice failed", e); }
  };

  // change camera quality and re-acquire camera with chosen resolution
  const handleChangeCameraQuality = async (quality) => {
    try {
      const q = String(quality || "auto").toLowerCase();
      setCameraQuality(q);
      if (typeof startLocalMedia === "function") {
        // re-acquire using currently selected device if available
        // Try preserve deviceId if current stream has a video track with deviceId
        let deviceId = null;
        try {
          const t = mediaStreamRef?.current?.getVideoTracks()[0];
          if (t && t.getSettings && t.getSettings().deviceId) deviceId = t.getSettings().deviceId;
        } catch (e) {}
        await startLocalMedia({ video: true, audio: true, deviceId: deviceId || null, resolution: q }).catch(()=>null);
      }
    } catch (e) { console.warn("change camera quality failed", e); }
  };

  // RecordingIndicator component
  const RecordingIndicator = () => {
    if (!isRecording) return null;
    const hhmmss = formatRecordingTime(recordingTime);
    return (
      <div className="recording-indicator" style={{
        position: "fixed",
        top: 90,
        right: 22,
        zIndex: 3000,
        display: "flex",
        gap: 8,
        alignItems: "center",
        background: "rgba(0,0,0,0.6)",
        color: "#fff",
        padding: "6px 10px",
        borderRadius: 20,
        boxShadow: "0 8px 24px rgba(0,0,0,0.35)"
      }}>
        <span style={{
          width: 10, height: 10, borderRadius: 6,
          background: "#ff4b4b",
          boxShadow: "0 0 10px rgba(255,75,75,0.9)",
          animation: "pulse 1.2s infinite"
        }} />
        <div style={{ fontSize: 13, fontWeight: 700 }}>REC</div>
        <div style={{ fontSize: 13, opacity: 0.92 }}>{hhmmss}</div>
        <style>{`@keyframes pulse { 0% { transform: scale(.9); opacity:1 } 50% { transform: scale(1.2); opacity:.5 } 100% { transform: scale(.9); opacity:1 } }`}</style>
      </div>
    );
  };

  return (
    <div className={`meeting-page premium ${pinnedId ? "spotlight-active" : ""}`}>
      <Toolbar
        roomId={roomId}
        name={name}
        onOpenPanel={(panel) => setPanelOpen(prev => prev === panel ? null : panel)}
        onToggleCam={handleToggleCam}
        onToggleMic={handleToggleMic}
        onShareLink={() => setInviteOpen(true)}
        onScreenShare={handleScreenShare}
        onLeave={() => { disconnect(); window.location.href = "/"; }}
        onRaise={() => sendHostCommand && sendHostCommand(roomId, { type: "raise", from: mySocketId || name })}
        onReact={(emoji) => sendHostCommand && sendHostCommand(roomId, { type: "reaction", emoji })}
        onMuteAll={() => sendHostCommand && sendHostCommand(roomId, { type: "mute-all" })}
        isHost={isHost}
        hostLocked={hostLocked}
        onEndMeeting={handleEndMeeting}
        camOn={camOn}
        micOn={micOn}
        // Recording props
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        isRecording={isRecording}
        recordingTime={recordingTime}
        recordedUrl={lastRecordingUrl || recordedUrl}
        onDownloadRecording={handleDownloadRecording}
        // LIVE CC props (wired) — use prop names Toolbar expects
        liveCcEnabled={liveCcEnabled}
        onToggleLiveCc={handleToggleLiveCc}
        captionLang={liveCcLang}
        onChangeCaptionLang={handleChangeLiveCcLang}
        // optional: spokenLang stub (Toolbar supports it)
        spokenLang={"en-US"}
        onChangeSpokenLang={() => {}}
        // NEW: pass participants + meeting start time for meeting-info UI
        participants={participants}
        meetingStartAt={meetingStartAt}
      />

      <div className="meeting-body">
        <div className="video-grid-wrapper" style={{ padding: 20 }}>
          <div className="gallery-area" style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
            {/* HERO AREA - main stage */}
            <div className="video-box local hero" style={{ flex: "0 0 auto", width: "min(68vw, 680px)", height: "min(48vh, 420px)", borderRadius: 12, position: "relative", overflow: "hidden" }}>
              <video
                ref={localVideoElRef}
                autoPlay
                playsInline
                muted
                className="local-camera-video"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: 12,
                  transform: "scaleX(-1)" // mirrored by default (Teams-style)
                }}
              />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <VideoGrid
                localStream={null}
                remoteStreams={combinedParticipants}
                includeLocal={false}
                mySocketId={mySocketId}
                pinnedId={pinnedId}
                onTileClick={(id) => setPinnedId(prev => prev === id ? null : id)}
                fallbackAvatarUrl={"/favicon.ico"}
              />
            </div>
          </div>

          <RightPanel
            open={!!panelOpen}
            activeTab={panelOpen}
            onClose={() => setPanelOpen(null)}
            chatMessages={chatMessages}
            participants={participants}
            mySocketId={mySocketId}
            onSendChat={(m) => { sendChatMessage && sendChatMessage(roomId, m); setChatMessages(prev => [...prev, m]); }}
            isHost={isHost}
            onMuteAll={hostMuteAll}
            onKick={hostKick}
            onToggleRecord={(enabled) => {
              if (enabled) {
                handleStartRecording();
              } else {
                handleStopRecording();
              }
            }}
            // removed local toggle from panel - toolbar/menu triggers live CC
            onToggleLiveCC={(enabled) => sendHostCommand && sendHostCommand(roomId, { type: "livecc-toggle", enabled })}
            startLocalMedia={startLocalMedia}
            meetingStartAt={meetingStartAt}
            roomId={roomId}
            hostName={hostName}
            /* NEW props for recordings & camera quality */
            recordedUrl={lastRecordingUrl || recordedUrl}
            isRecording={isRecording}
            recordingTime={recordingTime}
            onDownloadRecording={handleDownloadRecording}
            formatRecordingTime={formatRecordingTime}
            // camera quality integration (RightPanel expects these prop names)
            currentResolution={cameraQuality}
            onChangeResolution={handleChangeCameraQuality}
            onSelectDevice={handleSelectDevice}
            // expose live CC status for display (RightPanel no longer toggles it)
            liveCcEnabled={liveCcEnabled}
          />
        </div>
      </div>

      {/* Recording indicator */}
      <RecordingIndicator />

      {/* Pass selectedLang so LiveCaptionBar uses translation keys when available */}
      <LiveCaptionBar captions={captions} visible={liveCcEnabled} selectedLang={liveCcLang} maxLines={6} />

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        inviteLink={inviteLink}
      />

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
