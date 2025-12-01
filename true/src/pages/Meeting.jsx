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

  // ---- NEW: native cam/mic state (driven by local media stream)
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  // REAL Recording state - REPLACED with actual recording functionality
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingStartedBy, setRecordingStartedBy] = useState(null);
  const [lastRecordingUrl, setLastRecordingUrl] = useState(null);

  // Some small helpers / defaults (so the file is self-contained)
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

  // REAL Recording handler - REPLACED with actual recording functionality
  const handleStartRecording = async () => {
    try {
      console.log("🟢 Starting recording...");
      
      // Get the media stream from your camera
      const stream = mediaStreamRef.current;
      
      if (!stream) {
        alert("❌ No media stream available for recording. Please make sure your camera is enabled.");
        return;
      }

      console.log("📹 Media stream obtained:", stream.getTracks().map(t => t.kind));

      // Check if MediaRecorder is supported
      if (typeof MediaRecorder === 'undefined') {
        alert("❌ Recording not supported in this browser. Please use Chrome, Firefox, or Edge.");
        return;
      }

      // Try different MIME types for compatibility
      let options = { mimeType: 'video/webm;codecs=vp9,opus' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm;codecs=vp8,opus' };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = { mimeType: 'video/webm' };
      }
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options = {}; // Let browser choose default
      }

      console.log("🎬 Using MIME type:", options.mimeType || 'browser-default');

      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      // Handle data available event
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
          console.log("📦 Recording chunk:", event.data.size, "bytes");
        }
      };

      // Handle recording stop - THIS IS WHERE THE DOWNLOAD HAPPENS
      recorder.onstop = () => {
        console.log("🛑 Recording stopped, processing data...");
        
        if (chunks.length === 0) {
          console.warn("⚠️ No recording data captured");
          alert("No recording data was captured. Please try again.");
          return;
        }

        // Create the final video blob
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        console.log("🎉 Recording completed:", {
          size: blob.size,
          type: blob.type,
          chunks: chunks.length
        });

        // Store the recording for preview/download
        setRecordedBlob(blob);
        setRecordedUrl(url);
        setRecordedChunks(chunks);
        setLastRecordingUrl(url);

        // AUTO-DOWNLOAD THE RECORDING
        const timestamp = new Date().toISOString()
          .replace(/[:.]/g, '-')
          .replace('T', '_')
          .split('Z')[0];
        
        const filename = `meeting-recording-${roomId}-${timestamp}.webm`;
        
        console.log("📥 Auto-downloading recording:", filename);
        
        // Create download link and trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up URL object after download
        setTimeout(() => {
          URL.revokeObjectURL(url);
          console.log("🧹 Cleaned up recording URL");
        }, 1000);

        // Show success message
        const downloadMessage = {
          type: "system",
          text: `📥 Recording downloaded automatically (${formatFileSize(blob.size)})`,
          time: Date.now(),
          _localId: `download-${Date.now()}`
        };
        setChatMessages(prev => [...prev, downloadMessage]);
      };

      // Handle recording errors
      recorder.onerror = (event) => {
        console.error("❌ MediaRecorder error:", event);
        alert(`Recording error: ${event.error?.message || 'Unknown error'}`);
        setIsRecording(false);
        setRecordingStartTime(null);
      };

      // Start recording with 1-second chunks for better performance
      recorder.start(1000);
      console.log("🎥 Recording started successfully");
      
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingStartTime(Date.now());
      setRecordingStartedBy(name);
      setRecordedChunks([]);

      // Send notification to other participants
      sendHostCommand && sendHostCommand(roomId, { 
        type: "record-toggle", 
        enabled: true,
        startTime: Date.now(),
        startedBy: name,
        startedById: mySocketId
      });

      const recordingMessage = {
        type: "system",
        text: `🔴 Recording started by ${name}`,
        time: Date.now(),
        _localId: `recording-start-${Date.now()}`
      };
      setChatMessages(prev => [...prev, recordingMessage]);

    } catch (error) {
      console.error("❌ Error starting recording:", error);
      alert(`Recording failed to start: ${error.message}`);
      setIsRecording(false);
      setRecordingStartTime(null);
    }
  };

  // REAL Stop recording handler - REPLACED with actual recording functionality
  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      console.log("🛑 Stopping recording...");
      mediaRecorder.stop();
    } else {
      console.warn("⚠️ No active recording to stop");
    }
    
    const duration = recordingTime;
    setIsRecording(false);
    setRecordingStartTime(null);
    setRecordingStartedBy(null);

    // Send stop notification to other participants
    sendHostCommand && sendHostCommand(roomId, { 
      type: "record-toggle", 
      enabled: false,
      duration: duration,
      stoppedBy: name
    });

    const recordingMessage = {
      type: "system",
      text: `⏹️ Recording stopped. Duration: ${formatRecordingTime(duration)}. File is downloading...`,
      time: Date.now(),
      _localId: `recording-stop-${Date.now()}`
    };
    setChatMessages(prev => [...prev, recordingMessage]);
  };

  // Manual download function (in case auto-download fails)
  const handleDownloadRecording = () => {
    if (!recordedBlob && !lastRecordingUrl) {
      alert("No recording available to download. Please start and stop a recording first.");
      return;
    }

    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('Z')[0];
    
    const filename = `meeting-recording-${roomId}-${timestamp}.webm`;
    
    // Use the last recording URL if available, otherwise create new one
    const downloadUrl = lastRecordingUrl || URL.createObjectURL(recordedBlob);
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Show download confirmation
    const downloadMessage = {
      type: "system",
      text: `📥 Recording re-downloaded by ${name}`,
      time: Date.now(),
      _localId: `download-${Date.now()}`
    };
    setChatMessages(prev => [...prev, downloadMessage]);
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Helper function to format recording time
  const formatRecordingTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ---- helper: normalize server messages into the UI shape RightPanel expects
  const normalizeMessageFromServer = (m) => {
    if (!m) return null;
    // if server already uses the UI shape, keep fields
    const base = {
      type: m.type || m.messageType || "text",
      from: m.from || m.sender || m.name || m.user || "Someone",
      time: m.time || m.ts || Date.now(),
      _localId: m._localId || m._id || m.id || undefined,
    };

    if (base.type === "file") {
      return {
        ...base,
        name: m.name || m.filename || m.fileName,
        mime: m.mime || m.fileType,
        dataUrl: m.dataUrl || m.url || m.fileUrl || m.link,
        size: m.size || m.fileSize,
      };
    }

    if (base.type === "audio") {
      return {
        ...base,
        url: m.url || m.audioUrl || m.dataUrl,
        duration: m.duration,
        size: m.size,
      };
    }

    // treat 'user' or other legacy types as text
    return {
      ...base,
      type: "text",
      text: m.text || m.message || m.body || (typeof m === "string" ? m : ""),
    };
  };

  /* Setup event listeners for signaling events (handles translated captions) */
  useEffect(() => {
    if (!on) return;

    const offAssign = on("assign-id", (p) => { if (p?.id) setMySocketId(p.id); });

    const offParts = on("participants", (list) => {
      if (!Array.isArray(list)) return;
      const host = list.find(p => p.isHost) || list[0];
      setIsHost(!!(host && host.socketId === mySocketId));
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
      // Handle recording commands from any user
      if (c.type === "record-toggle") {
        if (c.enabled && !isRecording) {
          setIsRecording(true);
          setRecordingStartTime(c.startTime || Date.now());
          setRecordingStartedBy(c.startedBy || "Someone");
          // Show recording started message for all participants
          const recordingMessage = {
            type: "system",
            text: `🔴 Recording started by ${c.startedBy || "a participant"}`,
            time: Date.now(),
            _localId: `recording-start-${Date.now()}`
          };
          setChatMessages(prev => [...prev, recordingMessage]);
        } else if (!c.enabled && isRecording) {
          setIsRecording(false);
          const duration = c.duration || recordingTime;
          setRecordingStartTime(null);
          setRecordingStartedBy(null);
          // Show recording stopped message for all participants
          const recordingMessage = {
            type: "system",
            text: `⏹️ Recording stopped by ${c.stoppedBy || "a participant"}. Duration: ${formatRecordingTime(duration)}`,
            time: Date.now(),
            _localId: `recording-stop-${Date.now()}`
          };
          setChatMessages(prev => [...prev, recordingMessage]);
        }
      }
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

    return () => { offAssign(); offParts(); offHost(); offChat(); };
  }, [on, mySocketId, isRecording, recordingTime]);

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
              p[p.length - 1] = { ...p[p.length - 1], text, time, __final: false };
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
        // UPDATED: Recording props with real functionality
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        isRecording={isRecording}
        recordingTime={recordingTime}
        recordedUrl={lastRecordingUrl || recordedUrl}
        onDownloadRecording={handleDownloadRecording}
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
            onMuteAll={hostMuteAll}
            onKick={hostKick}
            onToggleRecord={(enabled) => {
              if (enabled) {
                handleStartRecording();
              } else {
                handleStopRecording();
              }
            }}
            onToggleLiveCC={(enabled) => sendHostCommand && sendHostCommand(roomId, { type: "livecc-toggle", enabled })}
            startLocalMedia={startLocalMedia}
            meetingStartAt={null}
            roomId={roomId}
            hostName={hostName}
            /* NEW props for recordings */
            recordedUrl={lastRecordingUrl || recordedUrl}
            isRecording={isRecording}
            recordingTime={recordingTime}
            onDownloadRecording={handleDownloadRecording}
            formatRecordingTime={formatRecordingTime}
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
