import React, { useEffect, useRef, useState, useMemo } from "react";
import useWebRTC from "../hooks/useWebRTC";
import Toolbar from "../components/Toolbar";
import RightPanel from "../components/RightPanel";
import VideoGrid from "../components/VideoGrid";
import InviteModal from "../components/InviteModal";
import LiveCaptionBar from "../components/LiveCaptionBar";
import "../styles/meeting.css";

export default function MeetingPage() {
  const qs = new URLSearchParams(window.location.search);
  const name = qs.get("name") || "Guest";
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const roomId = pathParts[pathParts.length - 1] || qs.get("room") || "";

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
    selectDevice
  } = useWebRTC();

  // UI state
  const localPreviewRef = useRef(null);
  const [mySocketId, setMySocketId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [pinnedId, setPinnedId] = useState(null);
  const [panelOpen, setPanelOpen] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [raiseHands, setRaiseHands] = useState(new Set());
  const [error, setError] = useState(null);

  // Invite modal state
  const [inviteOpen, setInviteOpen] = useState(false);

  // live captions
  const [liveCcEnabled, setLiveCcEnabled] = useState(false);
  const [liveCcLang, setLiveCcLang] = useState("en-US");
  const speechRef = useRef(null);
  const [captions, setCaptions] = useState([]); // items have { text, from, time, __final }

  // recording
  const recRef = useRef({ recorder: null, chunks: [], raf: null, timer: 0, timerInt: null });
  const [recording, setRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  /* Setup event listeners for signaling events (handles translated captions) */
  useEffect(() => {
    if (!on) return;

    const offAssign = on("assign-id", (p) => { if (p?.id) setMySocketId(p.id); });

    const offParts = on("participants", (list) => {
      if (!Array.isArray(list)) return;
      setIsHost(() => {
        const host = list.find(x => x.isHost) || list[0];
        return !!(host && (host.socketId === mySocketId || host.id === mySocketId));
      });
    });

    // Chat + caption handler
    const offChat = on("chat-message", (m) => {
      if (!m) return;

      // If it's a caption object (backend sends payload.type === 'caption')
      if (m && m.type === "caption") {
        // map user selected lang (e.g. "hi-IN") to short code "hi"
        const langShort = (liveCcLang || "en-US").split("-")[0];

        const translations = m.translations || {};
        let showText = m.text || "";

        if (langShort === "hi" && translations.hi) showText = translations.hi;
        else if (langShort === "te" && translations.te) showText = translations.te;
        else if (langShort === "ta" && translations.ta) showText = translations.ta;
        else if (langShort === "kn" && translations.kn) showText = translations.kn;
        else if (langShort === "ml" && translations.ml) showText = translations.ml;
        else if (langShort === "mr" && translations.mr) showText = translations.mr;
        else if (langShort === "gu" && translations.gu) showText = translations.gu;
        else if (langShort === "bn" && translations.bn) showText = translations.bn;
        else if (langShort === "pa" && translations.pa) showText = translations.pa;
        else if (langShort === "or" && translations.or) showText = translations.or;
        // else for english variants show original m.text

        setCaptions(prev => {
          const p = prev.slice();
          const text = showText;
          const from = m.from || "Someone";
          const time = m.time || Date.now();
          const isFinal = !!m.isFinal;

          if (isFinal) {
            if (p.length && p[p.length - 1] && !p[p.length - 1].__final) {
              p[p.length - 1] = { text, from, time, __final: true };
            } else {
              p.push({ text, from, time, __final: true });
            }
          } else {
            if (p.length && p[p.length - 1] && !p[p.length - 1].__final) {
              p[p.length - 1] = { ...p[p.length - 1], text, time, __final: false };
            } else {
              p.push({ text, from, time, __final: false });
            }
          }

          return p.slice(-50);
        });

        return;
      }

      // fallback: non-caption chat messages
      setChatMessages(prev => [...prev, m]);
    });

    return () => { offAssign(); offParts(); offChat(); };
  }, [on, mySocketId, liveCcLang]);

  /* Auto-start camera and connect */
  useEffect(() => {
    (async () => {
      try {
        if (typeof startLocalMedia === "function") {
          try { await startLocalMedia({ video: true, audio: true }); } catch (_) {}
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
  }, [roomId]);

  /* mount local preview element */
  useEffect(() => {
    function mount() {
      const container = localPreviewRef.current;
      if (!container) return;
      while (container.firstChild) container.removeChild(container.firstChild);
      const el = localVideoElRef && localVideoElRef.current ? localVideoElRef.current : null;
      if (el) {
        el.style.width = "100%"; el.style.height = "100%"; el.style.objectFit = "cover"; el.muted = true;
        container.appendChild(el);
        try { el.play && el.play().catch(()=>{}); } catch(_) {}
        return;
      }
      if (mediaStreamRef && mediaStreamRef.current) {
        const v = document.createElement("video");
        v.autoplay = true; v.playsInline = true; v.muted = true;
        v.srcObject = mediaStreamRef.current;
        v.style.width = "100%"; v.style.height = "100%"; v.style.objectFit = "cover";
        container.appendChild(v);
        try { v.play && v.play().catch(()=>{}); } catch(_) {}
        return;
      }
      const ph = document.createElement("div");
      ph.style.width = "100%"; ph.style.height = "100%"; ph.style.background = "#111";
      container.appendChild(ph);
    }
    mount();
    const t1 = setTimeout(mount, 300);
    const t2 = setTimeout(mount, 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [localVideoElRef && localVideoElRef.current, mediaStreamRef && mediaStreamRef.current]);

  /* ---------- Live captions (SpeechRecognition) ---------- */
  const startLiveCC = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert("Live captions not supported in this browser."); return; }
    try {
      const r = new SpeechRecognition();
      r.lang = liveCcLang || "en-US";
      r.interimResults = true;
      r.continuous = true;

      r.onresult = (ev) => {
        const lastIndex = ev.results.length - 1;
        const lastResult = ev.results[lastIndex];
        const text = (lastResult[0] && lastResult[0].transcript) ? lastResult[0].transcript.trim() : "";
        const isFinal = !!lastResult.isFinal;

        if (!text) return;

        if (isFinal) {
          setCaptions(prev => {
            const p = prev.slice();
            if (p.length && p[p.length - 1] && !p[p.length - 1].__final) {
              p[p.length - 1] = { text, from: name || "You", time: Date.now(), __final: true };
            } else {
              p.push({ text, from: name || "You", time: Date.now(), __final: true });
            }
            return p;
          });

          // broadcast only final captions
          sendChatMessage && sendChatMessage(roomId, {
            type: "caption",
            from: name,
            text,
            time: Date.now(),
            isFinal: true
          });
        } else {
          setCaptions(prev => {
            const p = prev.slice();
            if (p.length && p[p.length - 1] && !p[p.length - 1].__final) {
              p[p.length - 1] = { ...p[p.length - 1], text, time: Date.now(), __final: false };
            } else {
              p.push({ text, from: name || "You", time: Date.now(), __final: false });
            }
            return p;
          });
        }
      };

      r.onerror = (e) => console.warn("speech err", e);
      r.onend = () => {
        if (liveCcEnabled) {
          try { r.start(); } catch(_) {}
        }
      };

      r.start();
      speechRef.current = r;
      setLiveCcEnabled(true);
    } catch (e) { console.warn("startLiveCC failed", e); setError("Live captions failed."); }
  };

  const stopLiveCC = () => {
    setLiveCcEnabled(false);
    if (speechRef.current) {
      try { speechRef.current.stop(); } catch(_) {}
      speechRef.current = null;
    }
    setCaptions(prev => prev.map(c => ({ ...c, __final: !!c.__final })));
  };

  const handleChangeLiveCcLang = (lang) => {
    setLiveCcLang(lang);
    if (liveCcEnabled) {
      try {
        stopLiveCC();
        setTimeout(() => startLiveCC(), 250);
      } catch (e) { console.warn("failed to restart live cc after lang change", e); }
    }
  };

  /* ---------- Recording (unchanged) ---------- */
  const startRecording = async () => {
    if (recRef.current.recorder) return;
    try {
      const gallery = document.querySelector(".grid-container") || document.body;
      const rect = gallery.getBoundingClientRect();
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(640, Math.floor(rect.width));
      canvas.height = Math.max(360, Math.floor(rect.height));
      const ctx = canvas.getContext("2d");

      let rafId = 0;
      const drawLoop = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const videos = Array.from(gallery.querySelectorAll("video"));
        const cols = 3;
        const rows = Math.max(1, Math.ceil(videos.length / cols));
        const w = Math.floor(canvas.width / cols);
        const h = Math.floor(canvas.height / rows);
        let i = 0;
        videos.forEach(v => {
          try { ctx.drawImage(v, (i % cols) * w, Math.floor(i / cols) * h, w, h); } catch (e) {}
          i++;
        });
        rafId = requestAnimationFrame(drawLoop);
      };
      rafId = requestAnimationFrame(drawLoop);

      const videoStream = canvas.captureStream(25);

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContext();
      const dest = audioCtx.createMediaStreamDestination();

      if (mediaStreamRef.current && mediaStreamRef.current.getAudioTracks().length) {
        try {
          const src = audioCtx.createMediaStreamSource(mediaStreamRef.current);
          src.connect(dest);
        } catch (e) {}
      }

      (remoteStreams || []).forEach(r => {
        try {
          if (r.stream && r.stream.getAudioTracks().length) {
            const ssrc = audioCtx.createMediaStreamSource(r.stream);
            ssrc.connect(dest);
          }
        } catch (e) {}
      });

      const combined = new MediaStream();
      videoStream.getVideoTracks().forEach(t => combined.addTrack(t));
      dest.stream.getAudioTracks().forEach(t => combined.addTrack(t));

      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";
      const recorder = new MediaRecorder(combined, { mimeType: mime });
      const chunks = [];
      recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
      recorder.onstop = () => {
        cancelAnimationFrame(rafId);
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `meeting-${roomId || "recording"}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        try { audioCtx.close(); } catch(_) {}
        if (recRef.current.timerInt) clearInterval(recRef.current.timerInt);
        recRef.current = { recorder: null, chunks: [], raf: null, timer: 0, timerInt: null };
        setRecording(false);
        setRecordingTime(0);
      };
      recorder.start(1000);

      recRef.current = { recorder, chunks, raf: rafId, timer: 0, timerInt: setInterval(() => {
        recRef.current.timer += 1;
        setRecordingTime(recRef.current.timer);
      }, 1000) };

      setRecording(true);
    } catch (e) { console.warn(e); setError("Could not start recording."); }
  };

  const stopRecording = () => {
    try {
      if (recRef.current && recRef.current.recorder) {
        clearInterval(recRef.current.timerInt);
        recRef.current.recorder.stop();
      }
    } catch (e) { console.warn("stop recording failed", e); setError("Stop recording failed."); setRecording(false); setRecordingTime(0); }
  };

  /* toolbar controls wiring */
  const handleToggleLiveCc = (enabled) => {
    if (enabled) startLiveCC(); else stopLiveCC();
  };

  const handleToggleRecord = (shouldRecord) => {
    if (shouldRecord) startRecording(); else stopRecording();
  };

  /* camera/mic control proxies */
  const handleToggleCam = () => { try { toggleCam && toggleCam(); } catch (e) { setError("Camera toggle failed"); } };
  const handleToggleMic = () => { try { toggleMic && toggleMic(); } catch (e) { setError("Mic toggle failed"); } };

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
        hostLocked={false}
        onEndMeeting={() => { sendHostCommand && sendHostCommand(roomId, { type: "end-meeting" }); disconnect(); window.location.href = "/"; }}
        camOn={!!(mediaStreamRef.current && mediaStreamRef.current.getVideoTracks()[0]?.enabled)}
        micOn={!!(mediaStreamRef.current && mediaStreamRef.current.getAudioTracks()[0]?.enabled)}
        liveCcEnabled={liveCcEnabled}
        onToggleLiveCc={() => handleToggleLiveCc(!liveCcEnabled)}
        liveCcLang={liveCcLang}
        onChangeLiveCcLang={(lang) => handleChangeLiveCcLang(lang)}
        recording={recording}
        recordingTime={recordingTime}
        onToggleRecord={() => handleToggleRecord(!recording)}
      />

      <div className="meeting-body">
        <div className="video-grid-wrapper" style={{ padding: 20 }}>
          <div className="gallery-area" style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
            <div className="video-box.local hero" style={{ width: 720, height: 450, borderRadius: 12 }}>
              <div ref={localPreviewRef} style={{ width: "100%", height: "100%" }} />
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
            onMuteAll={() => sendHostCommand && sendHostCommand(roomId, { type: "mute-all" })}
            onKick={(socketId) => sendHostCommand && sendHostCommand(roomId, { type: "kicked", target: socketId })}
            onToggleRecord={(enabled) => handleToggleRecord(enabled)}
            onToggleLiveCC={(enabled) => handleToggleLiveCc(enabled)}
            startLocalMedia={startLocalMedia}
            meetingStartAt={null}
            roomId={roomId}
            hostName={name}
          />
        </div>
      </div>

      <LiveCaptionBar captions={captions} visible={liveCcEnabled} maxLines={2} />

      <InviteModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        inviteLink={inviteLink}
      />

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}
