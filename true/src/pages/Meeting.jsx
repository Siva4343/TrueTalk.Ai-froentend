// src/pages/Meeting.jsx
import React, { useEffect, useRef, useState } from "react";
import useWebRTC from "../hooks/useWebRTC";
import Toolbar from "../components/Toolbar";
import RightPanel from "../components/RightPanel";
import VideoGrid from "../components/VideoGrid";
import "../styles/meeting.css";
import { IconCam, IconMic } from "../components/icons";

export default function MeetingPage() {
  const qs = new URLSearchParams(window.location.search);
  const name = qs.get("name") || "Guest";
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const currentRoomFromPath = pathParts[pathParts.length - 1] || qs.get("room") || "";
  const roomId = currentRoomFromPath;

  const {
    wsRef,
    localVideoElRef,
    mediaStreamRef,
    startLocalMedia,
    connect,
    disconnect,
    peerJoined,
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

  const localPreviewRef = useRef(null);
  const prevParticipantsRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [mySocketId, setMySocketId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [pinnedId, setPinnedId] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [raiseHands, setRaiseHands] = useState(new Set());
  const [panelOpen, setPanelOpen] = useState(null);
  const [hostLocked, setHostLocked] = useState(false);
  const [error, setError] = useState(null);

  // debug info for right panel
  const [debugInfo, setDebugInfo] = useState({ wsState: null, peers: 0 });

  // ---- NEW: meeting start info
  const [meetingStartAt, setMeetingStartAt] = useState(null);
  const [hostName, setHostName] = useState(null);

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

  useEffect(() => {
    if (!on) return;
    const offAssign = on("assign-id", (payload) => {
      if (payload?.id) setMySocketId(payload.id);
    });
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

    // normalize incoming chat messages from server
    const offChat = on("chat-message", (m) => {
      if (!m) return;
      const norm = normalizeMessageFromServer(m);
      console.log("[MeetingPage] RECV chat normalized:", norm);
      if (norm) setChatMessages(prev => [...prev, norm]);
    });

    return () => { offAssign(); offParts(); offHost(); offChat(); };
  }, [on, mySocketId, isRecording, recordingTime]);

  /* ---------- auto start camera & join ---------- */
  useEffect(() => {
    (async () => {
      try {
        if (typeof startLocalMedia === "function") {
          try { await startLocalMedia({ video: true, audio: true }); } catch (_) {}
        }
        if ((!mediaStreamRef || !mediaStreamRef.current) && navigator.mediaDevices?.getUserMedia) {
          const s = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(()=>null);
          if (s) mediaStreamRef.current = s;
          if (s && !localVideoElRef.current) {
            const v = document.createElement("video");
            v.autoplay = true; v.playsInline = true; v.muted = true;
            v.srcObject = s;
            localVideoElRef.current = v;
          }
        }
        try { 
          await connect({ roomId, name }); 
          setJoined(true); 

          // ---------- NEW: record meeting start and host name ----------
          // Use local Date.now() when connecting; if server provides a better start timestamp
          // you can override meetingStartAt when a server event arrives (participants/room).
          if (!meetingStartAt) setMeetingStartAt(Date.now());
          if (!hostName) setHostName(name);
        } catch(e){ console.warn("connect failed", e); }
      } catch (err) {
        console.warn("autostart error", err);
        setError("Could not start camera/mic. Check permissions.");
      }
    })();
    // eslint-disable-next-line
  }, [roomId]);

  /* mount local preview into hero */
  useEffect(() => {
    function mount() {
      const cont = localPreviewRef.current;
      if (!cont) return;
      while (cont.firstChild) cont.removeChild(cont.firstChild);
      const el = localVideoElRef && localVideoElRef.current ? localVideoElRef.current : null;
      if (el) {
        el.style.width = "100%";
        el.style.height = "100%";
        el.style.objectFit = "cover";
        el.muted = true;
        cont.appendChild(el);
        try { el.play && el.play().catch(()=>{}); } catch(_) {}
        return;
      }
      if (mediaStreamRef && mediaStreamRef.current) {
        const v = document.createElement("video");
        v.autoplay = true; v.playsInline = true; v.muted = true;
        v.srcObject = mediaStreamRef.current;
        v.style.width = "100%"; v.style.height = "100%"; v.style.objectFit = "cover";
        cont.appendChild(v);
        try { v.play && v.play().catch(()=>{}); } catch(_) {}
        return;
      }
      const ph = document.createElement("div");
      ph.style.width = "100%"; ph.style.height = "100%"; ph.style.background = "#111";
      cont.appendChild(ph);
    }
    mount();
    const t1 = setTimeout(mount, 300);
    const t2 = setTimeout(mount, 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [localVideoElRef && localVideoElRef.current, mediaStreamRef && mediaStreamRef.current]);

  /* keep debug info updated */
  useEffect(() => {
    let t = setInterval(() => {
      try {
        const wsState = (wsRef && wsRef.current) ? wsRef.current.readyState : null;
        const peers = (remoteStreams || []).length;
        setDebugInfo({ wsState, peers });
      } catch (e) {}
    }, 800);
    return () => clearInterval(t);
  }, [wsRef, remoteStreams]);

  /* ---------- NEW: keep camOn/micOn in sync with local media ---------- */
  useEffect(() => {
    function updateFromStream(stream) {
      if (!stream) {
        setCamOn(false);
        setMicOn(false);
        return;
      }
      const vt = stream.getVideoTracks()[0];
      const at = stream.getAudioTracks()[0];
      setCamOn(!!(vt && vt.enabled !== false));
      setMicOn(!!(at && at.enabled !== false));
    }

    if (mediaStreamRef && mediaStreamRef.current) {
      updateFromStream(mediaStreamRef.current);
    }

    if (!on) return;
    const offLocal = on("local-media-updated", (s) => {
      updateFromStream(s || mediaStreamRef.current);
    });
    const offParts = on("participants", (list) => {
      if (!Array.isArray(list)) return;
      const me = list.find(p => p.socketId === mySocketId);
      if (me) {
        if (typeof me.muted === "boolean") setMicOn(!me.muted);
      }
    });

    return () => {
      offLocal && offLocal();
      offParts && offParts();
    };
  }, [on, mediaStreamRef, mySocketId]);

  /* controls */
  const handleToggleCam = () => { try { toggleCam && toggleCam(); } catch(e) { setError("Camera toggle failed"); } };
  const handleToggleMic = () => { try { toggleMic && toggleMic(); } catch(e) { setError("Mic toggle failed"); } };
  const handleShare = async () => { try { await startScreenShare(); setSharing(true); } catch(e){ setError("Share failed"); } };
  const handleStopShare = async () => { try { await stopScreenShare(); setSharing(false); } catch(e){ setError("Stop share failed"); } };

  const hostMuteAll = () => { if (!isHost) return; sendHostCommand && sendHostCommand(roomId, { type: "mute-all" }); };
  const hostKick = (socketId) => { if (!isHost) return; sendHostCommand && sendHostCommand(roomId, { type: "kicked", target: socketId }); };

  const toggleRaise = () => {
    const has = raiseHands.has(mySocketId);
    sendHostCommand && sendHostCommand(roomId, { type: "raise-hand", from: mySocketId, add: !has });
    setRaiseHands(prev => { const s = new Set(prev); if (!has) s.add(mySocketId); else s.delete(mySocketId); return s; });
  };

  const handleEndMeeting = () => {
    if (!isHost) return;
    try { sendHostCommand(roomId, { type: "end-meeting", byHost: true }); } catch(e) {}
    try { disconnect(); } catch(e) {}
    window.location.href = "/";
  };

  // Normalize outgoing payloads from RightPanel before sending to server
  const handleOutgoingChatFromPanel = (m) => {
    // m will often already be normalized by RightPanel (it sends type: "text"/"file"/"audio")
    const outgoing = (typeof m === "string")
      ? { type: "text", from: name, text: m, time: Date.now() }
      : { ...m, type: m.type === "user" ? "text" : (m.type || "text"), time: m.time || Date.now() };

    console.log("[MeetingPage] SEND chat payload:", outgoing);

    // send to server via useWebRTC API (expected to emit to socket)
    try {
      sendChatMessage && sendChatMessage(roomId, outgoing);
    } catch (e) {
      console.warn("sendChatMessage failed:", e);
    }

    // optimistic local append (UI will also receive server echo; we dedupe in RightPanel)
    setChatMessages(prev => [...prev, outgoing]);
  };

  return (
    <div className="meeting-page premium">
      <Toolbar
        roomId={roomId}
        name={name}
        onOpenPanel={(panel) => setPanelOpen(prev => prev === panel ? null : panel)}
        onToggleCam={handleToggleCam}
        onToggleMic={handleToggleMic}
        onShare={sharing ? handleStopShare : handleShare}
        onLeave={() => { disconnect(); window.location.href="/"; }}
        onRaise={toggleRaise}
        onReact={(emoji)=> sendHostCommand && sendHostCommand(roomId, { type: "reaction", emoji })}
        onMuteAll={hostMuteAll}
        onLock={() => {}}
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
        <div className="video-grid-wrapper">
          <div className="gallery-area">
            <div className={`video-box local hero`} ref={localPreviewRef} />

            <VideoGrid
              localStream={null}
              remoteStreams={remoteStreams || []}
              mySocketId={mySocketId}
              pinnedId={pinnedId}
              onTileClick={(id) => setPinnedId(prev => prev === id ? null : id)}
              includeLocal={false}
              raiseHands={raiseHands}
              fallbackAvatarUrl={"/favicon.ico"}
            />
          </div>

          <RightPanel
            open={!!panelOpen}
            activeTab={panelOpen}
            onClose={() => setPanelOpen(null)}
            chatMessages={chatMessages}
            participants={participants}
            mySocketId={mySocketId}
            onSendChat={handleOutgoingChatFromPanel}
            isHost={isHost}
            onMuteAll={hostMuteAll}
            onKick={hostKick}
            onToggleRecord={(enabled) => {
              // ALL USERS can toggle recording
              if (enabled) {
                handleStartRecording();
              } else {
                handleStopRecording();
              }
            }}
            onToggleLiveCC={(enabled) => sendHostCommand && sendHostCommand(roomId, { type: "livecc-toggle", enabled })}
            startLocalMedia={startLocalMedia}

            /* NEW props for meeting info */
            meetingStartAt={meetingStartAt}
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

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}