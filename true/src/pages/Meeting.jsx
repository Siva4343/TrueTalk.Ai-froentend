// src/pages/Meeting.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import useWebRTC from "../hooks/useWebRTC";
import Toolbar from "../components/Toolbar";
import RightPanel from "../components/RightPanel";
import VideoGrid from "../components/VideoGrid";
import "../styles/meeting.css";

export default function MeetingPage() {
  const qs = new URLSearchParams(window.location.search);
  const name = qs.get("name") || "Guest";
  const pathParts = window.location.pathname.split("/").filter(Boolean);
  const currentRoomFromPath = pathParts[pathParts.length - 1] || qs.get("room") || "";
  const roomId = currentRoomFromPath;

  const {
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
    stopScreenShare
  } = useWebRTC();

  const localPreviewRef = useRef(null);
  const [mySocketId, setMySocketId] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [pinnedId, setPinnedId] = useState(null);
  const [sharing, setSharing] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [raiseHands, setRaiseHands] = useState(new Set());
  const [panelOpen, setPanelOpen] = useState(null);
  const [error, setError] = useState(null);

  // meeting start info
  const [meetingStartAt, setMeetingStartAt] = useState(null);
  const [hostName, setHostName] = useState(null);

  // native cam/mic state (driven by local media stream)
  const [camOn, setCamOn] = useState(true);
  const [micOn, setMicOn] = useState(true);

  // Recording state
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [lastRecordingUrl, setLastRecordingUrl] = useState(null);

  // Enhanced Live Captions state
  const [liveCaptionsEnabled, setLiveCaptionsEnabled] = useState(false);
  const [captions, setCaptions] = useState([]);
  const [currentCaption, setCurrentCaption] = useState("");
  const [captionsLanguage, setCaptionsLanguage] = useState("en-US");
  const [speechRecognition, setSpeechRecognition] = useState(null);
  const [isCaptionsActive, setIsCaptionsActive] = useState(false);
  const [captionsRestartAttempts, setCaptionsRestartAttempts] = useState(0);

  // Helper function to format file size
  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Helper function to format recording time
  const formatRecordingTime = useCallback((seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  // Recording timer effect - FIXED: Avoid setState in effect
  useEffect(() => {
    let interval;
    if (isRecording && recordingStartTime) {
      interval = setInterval(() => {
        const newRecordingTime = Math.floor((Date.now() - recordingStartTime) / 1000);
        setRecordingTime(newRecordingTime);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recordingStartTime]);

  // Enhanced Live Captions functions with continuous recognition - FIXED: Move inside useCallback
  const initializeSpeechRecognition = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError("Live captions not supported in this browser. Try Chrome or Edge.");
      return null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = captionsLanguage;
    recognition.maxAlternatives = 1;
    
    // Enhanced settings for better continuous recognition
    if (recognition.continuous !== undefined) {
      recognition.continuous = true;
    }
    if (recognition.interimResults !== undefined) {
      recognition.interimResults = true;
    }

    let silenceTimeout;
    let isRestarting = false;

    const restartRecognition = () => {
      if (isRestarting || !liveCaptionsEnabled) return;
      
      isRestarting = true;
      console.log("🔄 Restarting speech recognition...");
      
      setTimeout(() => {
        if (liveCaptionsEnabled && recognition) {
          try {
            recognition.stop();
            setTimeout(() => {
              try {
                recognition.start();
                console.log("✅ Speech recognition restarted successfully");
                setCaptionsRestartAttempts(prev => prev + 1);
                isRestarting = false;
              } catch (startError) {
                console.warn("Failed to restart speech recognition:", startError);
                isRestarting = false;
                setTimeout(restartRecognition, 2000);
              }
            }, 500);
          } catch (stopError) {
            console.warn("Error stopping recognition for restart:", stopError);
            isRestarting = false;
          }
        }
      }, 1000);
    };

    recognition.onstart = () => {
      console.log("🎤 Live captions started - Continuous mode");
      setIsCaptionsActive(true);
      setCaptionsRestartAttempts(0);
    };

    recognition.onresult = (event) => {
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }

      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        const newCaption = {
          id: Date.now(),
          text: finalTranscript.trim(),
          speaker: name,
          timestamp: Date.now(),
          type: 'final'
        };
        
        setCaptions(prev => {
          const updated = [...prev, newCaption];
          return updated.slice(-100);
        });
        
        setCurrentCaption("");
        
        // Broadcast caption to other participants
        if (sendHostCommand) {
          sendHostCommand(roomId, {
            type: "live-caption",
            caption: newCaption.text,
            speaker: name,
            timestamp: newCaption.timestamp,
            captionId: newCaption.id
          });
        }
        
        console.log("📝 Final caption:", finalTranscript.trim());
      }
      
      if (interimTranscript.trim()) {
        setCurrentCaption(interimTranscript);
        console.log("📝 Interim caption:", interimTranscript);
      }

      silenceTimeout = setTimeout(() => {
        if (liveCaptionsEnabled && isCaptionsActive) {
          console.log("🔇 Long silence detected, ensuring recognition continues...");
          setCurrentCaption("");
        }
      }, 3000);
    };

    recognition.onerror = (event) => {
      console.error("❌ Speech recognition error:", event.error);
      
      if (event.error === 'no-speech') {
        console.log("🔇 No speech detected, continuing...");
        return;
      }
      
      if (event.error === 'not-allowed') {
        setError("Microphone permission denied for live captions");
        setIsCaptionsActive(false);
      } else if (event.error === 'network') {
        console.warn("Network error in speech recognition, attempting restart...");
        restartRecognition();
      } else {
        console.warn(`Speech recognition error (${event.error}), attempting restart...`);
        setTimeout(restartRecognition, 1000);
      }
    };

    recognition.onend = () => {
      console.log("🔚 Speech recognition ended");
      
      if (silenceTimeout) {
        clearTimeout(silenceTimeout);
      }

      if (liveCaptionsEnabled && !isRestarting) {
        console.log("🔄 Auto-restarting speech recognition...");
        setTimeout(() => {
          if (liveCaptionsEnabled && !isRestarting) {
            try {
              recognition.start();
              console.log("✅ Auto-restart successful");
            } catch (restartError) {
              console.warn("Auto-restart failed:", restartError);
              setTimeout(restartRecognition, 2000);
            }
          }
        }, 500);
      } else {
        setIsCaptionsActive(false);
      }
    };

    return recognition;
  }, [captionsLanguage, name, roomId, sendHostCommand, liveCaptionsEnabled, isCaptionsActive]);

  // Define startLiveCaptions first to avoid circular dependency - FIXED: Include initializeSpeechRecognition in deps
  const startLiveCaptions = useCallback(() => {
    if (!micOn) {
      setError("Enable your microphone to use live captions");
      return;
    }

    if (speechRecognition) {
      try {
        speechRecognition.stop();
      } catch (e) {
        console.warn("Error stopping existing recognition:", e);
      }
    }

    const recognition = initializeSpeechRecognition();
    if (!recognition) return;

    try {
      console.log("🚀 Starting live captions with continuous recognition...");
      recognition.start();
      setSpeechRecognition(recognition);
      setLiveCaptionsEnabled(true);
      setCaptions([]);
      setCurrentCaption("");
      
      sendHostCommand?.(roomId, {
        type: "livecc-toggle",
        enabled: true,
        startedBy: name
      });

      const captionMessage = {
        type: "system",
        text: `📝 Live captions enabled by ${name}`,
        time: Date.now(),
        _localId: `captions-start-${Date.now()}`
      };
      setChatMessages(prev => [...prev, captionMessage]);

    } catch (error) {
      console.error("❌ Failed to start speech recognition:", error);
      setError("Failed to start live captions. Please check microphone permissions.");
      
      // Use a direct call instead of referencing startLiveCaptions to avoid circular dependency
      setTimeout(() => {
        if (liveCaptionsEnabled) {
          console.log("🔄 Retrying speech recognition start...");
          const newRecognition = initializeSpeechRecognition();
          if (newRecognition) {
            try {
              newRecognition.start();
              setSpeechRecognition(newRecognition);
            } catch (retryError) {
              console.error("Retry failed:", retryError);
            }
          }
        }
      }, 1000);
    }
  }, [micOn, name, roomId, sendHostCommand, speechRecognition, liveCaptionsEnabled, initializeSpeechRecognition]);

  const stopLiveCaptions = useCallback(() => {
    console.log("🛑 Stopping live captions...");
    
    if (speechRecognition) {
      try {
        speechRecognition.stop();
      } catch (error) {
        console.warn("Error stopping speech recognition:", error);
      }
    }
    
    setSpeechRecognition(null);
    setLiveCaptionsEnabled(false);
    setIsCaptionsActive(false);
    setCurrentCaption("");
    setCaptionsRestartAttempts(0);
    
    sendHostCommand?.(roomId, {
      type: "livecc-toggle",
      enabled: false,
      stoppedBy: name
    });

    const captionMessage = {
      type: "system",
      text: `📝 Live captions disabled by ${name}`,
      time: Date.now(),
      _localId: `captions-stop-${Date.now()}`
    };
    setChatMessages(prev => [...prev, captionMessage]);
  }, [speechRecognition, name, roomId, sendHostCommand]);

  const toggleLiveCaptions = useCallback(() => {
    if (liveCaptionsEnabled) {
      stopLiveCaptions();
    } else {
      startLiveCaptions();
    }
  }, [liveCaptionsEnabled, startLiveCaptions, stopLiveCaptions]);

  const clearCaptions = useCallback(() => {
    setCaptions([]);
    setCurrentCaption("");
  }, []);

  const exportCaptions = useCallback(() => {
    if (captions.length === 0) {
      alert("No captions to export");
      return;
    }

    const meetingInfo = `Meeting Transcript\nRoom: ${roomId}\nDate: ${new Date().toLocaleString()}\nDuration: ${formatRecordingTime(Math.floor((Date.now() - (meetingStartAt || Date.now())) / 1000))}\nParticipants: ${participants?.length || 1}\n\n`;
    
    const transcript = captions
      .map(caption => `[${new Date(caption.timestamp).toLocaleTimeString()}] ${caption.speaker}: ${caption.text}`)
      .join('\n');

    const fullTranscript = meetingInfo + transcript;

    const blob = new Blob([fullTranscript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meeting-transcript-${roomId}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    const exportMessage = {
      type: "system",
      text: `📄 Meeting transcript exported (${captions.length} captions)`,
      time: Date.now(),
      _localId: `export-${Date.now()}`
    };
    setChatMessages(prev => [...prev, exportMessage]);
  }, [captions, roomId, formatRecordingTime, meetingStartAt, participants]);

  // Auto-restart captions if they stop unexpectedly - FIXED: Include initializeSpeechRecognition in deps
  useEffect(() => {
    let restartInterval;
    
    if (liveCaptionsEnabled && !isCaptionsActive) {
      restartInterval = setInterval(() => {
        if (liveCaptionsEnabled && !isCaptionsActive && captionsRestartAttempts < 5) {
          console.log("🔄 Attempting to restart inactive captions...");
          // Use direct initialization instead of calling startLiveCaptions
          const recognition = initializeSpeechRecognition();
          if (recognition) {
            try {
              recognition.start();
              setSpeechRecognition(recognition);
            } catch (error) {
              console.warn("Auto-restart failed:", error);
            }
          }
        }
      }, 5000);
    }
    
    return () => {
      if (restartInterval) clearInterval(restartInterval);
    };
  }, [liveCaptionsEnabled, isCaptionsActive, captionsRestartAttempts, initializeSpeechRecognition]);

  // REAL Recording handler
  const handleStartRecording = useCallback(async () => {
    try {
      console.log("🟢 Starting recording...");
      
      const stream = mediaStreamRef.current;
      
      if (!stream) {
        alert("❌ No media stream available for recording. Please make sure your camera is enabled.");
        return;
      }

      console.log("📹 Media stream obtained:", stream.getTracks().map(t => t.kind));

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
        options = {};
      }

      console.log("🎬 Using MIME type:", options.mimeType || 'browser-default');

      const recorder = new MediaRecorder(stream, options);
      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data);
          console.log("📦 Recording chunk:", event.data.size, "bytes");
        }
      };

      recorder.onstop = () => {
        console.log("🛑 Recording stopped, processing data...");
        
        if (chunks.length === 0) {
          console.warn("⚠️ No recording data captured");
          alert("No recording data was captured. Please try again.");
          return;
        }

        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        
        console.log("🎉 Recording completed:", {
          size: blob.size,
          type: blob.type,
          chunks: chunks.length
        });

        setRecordedBlob(blob);
        setRecordedUrl(url);
        setLastRecordingUrl(url);

        // AUTO-DOWNLOAD THE RECORDING
        const timestamp = new Date().toISOString()
          .replace(/[:.]/g, '-')
          .replace('T', '_')
          .split('Z')[0];
        
        const filename = `meeting-recording-${roomId}-${timestamp}.webm`;
        
        console.log("📥 Auto-downloading recording:", filename);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => {
          URL.revokeObjectURL(url);
          console.log("🧹 Cleaned up recording URL");
        }, 1000);

        const downloadMessage = {
          type: "system",
          text: `📥 Recording downloaded automatically (${formatFileSize(blob.size)})`,
          time: Date.now(),
          _localId: `download-${Date.now()}`
        };
        setChatMessages(prev => [...prev, downloadMessage]);
      };

      recorder.onerror = (event) => {
        console.error("❌ MediaRecorder error:", event);
        alert(`Recording error: ${event.error?.message || 'Unknown error'}`);
        setIsRecording(false);
        setRecordingStartTime(null);
      };

      recorder.start(1000);
      console.log("🎥 Recording started successfully");
      
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingStartTime(Date.now());

      sendHostCommand?.(roomId, { 
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
  }, [mediaStreamRef, roomId, name, mySocketId, sendHostCommand, formatFileSize]);

  // Stop recording handler
  const handleStopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      console.log("🛑 Stopping recording...");
      mediaRecorder.stop();
    } else {
      console.warn("⚠️ No active recording to stop");
    }
    
    const duration = recordingTime;
    setIsRecording(false);
    setRecordingStartTime(null);

    sendHostCommand?.(roomId, { 
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
  }, [mediaRecorder, recordingTime, roomId, name, sendHostCommand, formatRecordingTime]);

  // Manual download function
  const handleDownloadRecording = useCallback(() => {
    if (!recordedBlob && !lastRecordingUrl) {
      alert("No recording available to download. Please start and stop a recording first.");
      return;
    }

    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('Z')[0];
    
    const filename = `meeting-recording-${roomId}-${timestamp}.webm`;
    
    const downloadUrl = lastRecordingUrl || URL.createObjectURL(recordedBlob);
    
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = filename;
    a.style.display = 'none';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    const downloadMessage = {
      type: "system",
      text: `📥 Recording re-downloaded by ${name}`,
      time: Date.now(),
      _localId: `download-${Date.now()}`
    };
    setChatMessages(prev => [...prev, downloadMessage]);
  }, [recordedBlob, lastRecordingUrl, roomId, name]);

  // Normalize server messages
  const normalizeMessageFromServer = useCallback((m) => {
    if (!m) return null;
    
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

    return {
      ...base,
      type: "text",
      text: m.text || m.message || m.body || (typeof m === "string" ? m : ""),
    };
  }, []);

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
          if (c.add) s.add(c.from); 
          else s.delete(c.from);
          return s;
        });
      }
      
      if (c.type === "mute-all") {
        try {
          if (mediaStreamRef?.current) {
            const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = false;
          }
        } catch (error) {
          console.warn("Failed to mute all:", error);
        }
      }
      
      if (c.type === "kicked" && c.target === mySocketId) {
        alert("You were removed by the host");
        try { 
          disconnect(); 
        } catch (error) {
          console.warn("Disconnect error:", error);
        }
        window.location.href = "/";
      }
      
      if (c.type === "end-meeting" && c.byHost) {
        alert("Host ended meeting");
        try { 
          disconnect(); 
        } catch (error) {
          console.warn("Disconnect error:", error);
        }
        window.location.href = "/";
      }
      
      if (c.type === "record-toggle") {
        if (c.enabled && !isRecording) {
          setIsRecording(true);
          setRecordingStartTime(c.startTime || Date.now());
          
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
          
          const recordingMessage = {
            type: "system",
            text: `⏹️ Recording stopped by ${c.stoppedBy || "a participant"}. Duration: ${formatRecordingTime(duration)}`,
            time: Date.now(),
            _localId: `recording-stop-${Date.now()}`
          };
          setChatMessages(prev => [...prev, recordingMessage]);
        }
      }

      // Handle live captions commands
      if (c.type === "livecc-toggle") {
        if (c.enabled && !liveCaptionsEnabled) {
          setLiveCaptionsEnabled(true);
          const captionMessage = {
            type: "system",
            text: `📝 Live captions enabled by ${c.startedBy || "the host"}`,
            time: Date.now(),
            _localId: `captions-start-${Date.now()}`
          };
          setChatMessages(prev => [...prev, captionMessage]);
        } else if (!c.enabled && liveCaptionsEnabled) {
          setLiveCaptionsEnabled(false);
          const captionMessage = {
            type: "system",
            text: `📝 Live captions disabled by ${c.stoppedBy || "the host"}`,
            time: Date.now(),
            _localId: `captions-stop-${Date.now()}`
          };
          setChatMessages(prev => [...prev, captionMessage]);
        }
      }

      // Handle incoming live captions
      if (c.type === "live-caption" && c.speaker !== name) {
        const newCaption = {
          id: c.captionId || Date.now(),
          text: c.caption,
          speaker: c.speaker,
          timestamp: c.timestamp || Date.now(),
          type: 'final'
        };
        
        setCaptions(prev => {
          const updated = [...prev, newCaption].slice(-100);
          return updated;
        });
      }
    });

    const offChat = on("chat-message", (m) => {
      if (!m) return;
      const norm = normalizeMessageFromServer(m);
      console.log("[MeetingPage] RECV chat normalized:", norm);
      if (norm) setChatMessages(prev => [...prev, norm]);
    });

    return () => { 
      offAssign?.(); 
      offParts?.(); 
      offHost?.(); 
      offChat?.(); 
    };
  }, [on, mySocketId, isRecording, recordingTime, mediaStreamRef, disconnect, normalizeMessageFromServer, formatRecordingTime, liveCaptionsEnabled, name]);

  // Auto start camera & join
  useEffect(() => {
    (async () => {
      try {
        if (typeof startLocalMedia === "function") {
          try { 
            await startLocalMedia({ video: true, audio: true }); 
          } catch (error) {
            console.warn("startLocalMedia error:", error);
          }
        }
        
        if ((!mediaStreamRef?.current) && navigator.mediaDevices?.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true }).catch(() => null);
          if (stream) {
            mediaStreamRef.current = stream;
            if (!localVideoElRef.current) {
              const video = document.createElement("video");
              video.autoplay = true; 
              video.playsInline = true; 
              video.muted = true;
              video.srcObject = stream;
              localVideoElRef.current = video;
            }
          }
        }
        
        try { 
          await connect({ roomId, name }); 
          
          if (!meetingStartAt) setMeetingStartAt(Date.now());
          if (!hostName) setHostName(name);
        } catch(error){ 
          console.warn("connect failed", error); 
        }
      } catch (error) {
        console.warn("autostart error", error);
        setError("Could not start camera/mic. Check permissions.");
      }
    })();
  }, [roomId, name, startLocalMedia, mediaStreamRef, localVideoElRef, connect, meetingStartAt, hostName]);

  // Mount local preview
  useEffect(() => {
    function mount() {
      const container = localPreviewRef.current;
      if (!container) return;
      
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      
      const element = localVideoElRef?.current;
      if (element) {
        element.style.width = "100%";
        element.style.height = "100%";
        element.style.objectFit = "cover";
        element.muted = true;
        container.appendChild(element);
        try { 
          element.play?.()?.catch(() => {}); 
        } catch(error) {
          console.warn("Video play error:", error);
        }
        return;
      }
      
      if (mediaStreamRef?.current) {
        const video = document.createElement("video");
        video.autoplay = true; 
        video.playsInline = true; 
        video.muted = true;
        video.srcObject = mediaStreamRef.current;
        video.style.width = "100%"; 
        video.style.height = "100%"; 
        video.style.objectFit = "cover";
        container.appendChild(video);
        try { 
          video.play?.()?.catch(() => {}); 
        } catch(error) {
          console.warn("Video play error:", error);
        }
        return;
      }
      
      const placeholder = document.createElement("div");
      placeholder.style.width = "100%"; 
      placeholder.style.height = "100%"; 
      placeholder.style.background = "#111";
      container.appendChild(placeholder);
    }
    
    mount();
    const timer1 = setTimeout(mount, 300);
    const timer2 = setTimeout(mount, 900);
    
    return () => { 
      clearTimeout(timer1); 
      clearTimeout(timer2); 
    };
  }, [localVideoElRef, mediaStreamRef]);

  // Keep camOn/micOn in sync with local media
  useEffect(() => {
    function updateFromStream(stream) {
      if (!stream) {
        setCamOn(false);
        setMicOn(false);
        return;
      }
      const videoTrack = stream.getVideoTracks()[0];
      const audioTrack = stream.getAudioTracks()[0];
      setCamOn(!!(videoTrack && videoTrack.enabled !== false));
      setMicOn(!!(audioTrack && audioTrack.enabled !== false));
    }

    if (mediaStreamRef?.current) {
      updateFromStream(mediaStreamRef.current);
    }

    if (!on) return;
    
    const offLocal = on("local-media-updated", (stream) => {
      updateFromStream(stream || mediaStreamRef.current);
    });
    
    const offParts = on("participants", (list) => {
      if (!Array.isArray(list)) return;
      const me = list.find(p => p.socketId === mySocketId);
      if (me && typeof me.muted === "boolean") {
        setMicOn(!me.muted);
      }
    });

    return () => {
      offLocal?.();
      offParts?.();
    };
  }, [on, mediaStreamRef, mySocketId]);

  // Clean up speech recognition on unmount
  useEffect(() => {
    return () => {
      if (speechRecognition) {
        try {
          speechRecognition.stop();
        } catch (error) {
          console.warn("Error cleaning up speech recognition:", error);
        }
      }
    };
  }, [speechRecognition]);

  // Controls
  const handleToggleCam = useCallback(() => { 
    try { 
      toggleCam?.(); 
    } catch(error) { 
      setError("Camera toggle failed"); 
      console.error("Camera toggle error:", error);
    } 
  }, [toggleCam]);

  const handleToggleMic = useCallback(() => { 
    try { 
      toggleMic?.(); 
    } catch(error) { 
      setError("Mic toggle failed"); 
      console.error("Mic toggle error:", error);
    } 
  }, [toggleMic]);

  const handleShare = useCallback(async () => { 
    try { 
      await startScreenShare(); 
      setSharing(true); 
    } catch(error){ 
      setError("Share failed"); 
      console.error("Share error:", error);
    } 
  }, [startScreenShare]);

  const handleStopShare = useCallback(async () => { 
    try { 
      await stopScreenShare(); 
      setSharing(false); 
    } catch(error){ 
      setError("Stop share failed"); 
      console.error("Stop share error:", error);
    } 
  }, [stopScreenShare]);

  const hostMuteAll = useCallback(() => { 
    if (!isHost) return; 
    sendHostCommand?.(roomId, { type: "mute-all" }); 
  }, [isHost, sendHostCommand, roomId]);

  const hostKick = useCallback((socketId) => { 
    if (!isHost) return; 
    sendHostCommand?.(roomId, { type: "kicked", target: socketId }); 
  }, [isHost, sendHostCommand, roomId]);

  const toggleRaise = useCallback(() => {
    const has = raiseHands.has(mySocketId);
    sendHostCommand?.(roomId, { type: "raise-hand", from: mySocketId, add: !has });
    setRaiseHands(prev => { 
      const newSet = new Set(prev); 
      if (!has) newSet.add(mySocketId); 
      else newSet.delete(mySocketId); 
      return newSet; 
    });
  }, [raiseHands, mySocketId, sendHostCommand, roomId]);

  const handleEndMeeting = useCallback(() => {
    if (!isHost) return;
    try { 
      sendHostCommand?.(roomId, { type: "end-meeting", byHost: true }); 
    } catch(error) {
      console.error("End meeting error:", error);
    }
    try { 
      disconnect(); 
    } catch(error) {
      console.error("Disconnect error:", error);
    }
    window.location.href = "/";
  }, [isHost, sendHostCommand, roomId, disconnect]);

  // Handle outgoing chat
  const handleOutgoingChatFromPanel = useCallback((message) => {
    const outgoing = (typeof message === "string")
      ? { type: "text", from: name, text: message, time: Date.now() }
      : { 
          ...message, 
          type: message.type === "user" ? "text" : (message.type || "text"), 
          time: message.time || Date.now() 
        };

    console.log("[MeetingPage] SEND chat payload:", outgoing);

    try {
      sendChatMessage?.(roomId, outgoing);
    } catch (error) {
      console.warn("sendChatMessage failed:", error);
    }

    setChatMessages(prev => [...prev, outgoing]);
  }, [name, roomId, sendChatMessage]);

  return (
    <div className="meeting-page premium">
      <Toolbar
        roomId={roomId}
        name={name}
        onOpenPanel={(panel) => setPanelOpen(prev => prev === panel ? null : panel)}
        onToggleCam={handleToggleCam}
        onToggleMic={handleToggleMic}
        onShare={sharing ? handleStopShare : handleShare}
        onLeave={() => { 
          disconnect(); 
          window.location.href="/"; 
        }}
        onRaise={toggleRaise}
        onReact={(emoji) => sendHostCommand?.(roomId, { type: "reaction", emoji })}
        onMuteAll={hostMuteAll}
        onLock={() => {}}
        isHost={isHost}
        onEndMeeting={handleEndMeeting}
        camOn={camOn}
        micOn={micOn}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        isRecording={isRecording}
        recordingTime={recordingTime}
        recordedUrl={lastRecordingUrl || recordedUrl}
        onDownloadRecording={handleDownloadRecording}
        onToggleLiveCaptions={toggleLiveCaptions}
        liveCaptionsEnabled={liveCaptionsEnabled}
        isCaptionsActive={isCaptionsActive}
      />

      <div className="meeting-body">
        <div className="video-grid-wrapper">
          <div className="gallery-area">
            {/* Enhanced Live Captions Display */}
            {(liveCaptionsEnabled && (currentCaption || captions.length > 0)) && (
              <div className="live-captions-overlay">
                <div className="captions-header">
                  <span>📝 Live Captions {isCaptionsActive ? '• LIVE' : '• PAUSED'}</span>
                  <div className="captions-controls">
                    <span className="captions-stats">
                      {captions.length} captions
                    </span>
                    <button 
                      onClick={clearCaptions}
                      className="captions-btn"
                      title="Clear captions"
                    >
                      🗑️
                    </button>
                    <button 
                      onClick={exportCaptions}
                      className="captions-btn"
                      title="Export full transcript"
                    >
                      💾
                    </button>
                  </div>
                </div>
                <div className="captions-display">
                  {currentCaption && (
                    <div className="current-caption interim">
                      <strong>{name}:</strong> {currentCaption}
                    </div>
                  )}
                  <div className="captions-history">
                    {captions.slice(-4).map((caption) => (
                      <div key={caption.id} className="caption-item">
                        <span className="caption-speaker">{caption.speaker}:</span>
                        <span className="caption-text">{caption.text}</span>
                        <span className="caption-time">
                          {new Date(caption.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="video-box local hero" ref={localPreviewRef} />

            <VideoGrid
              localStream={null}
              remoteStreams={remoteStreams || []}
              mySocketId={mySocketId}
              pinnedId={pinnedId}
              onTileClick={(id) => setPinnedId(prev => prev === id ? null : id)}
              includeLocal={false}
              raiseHands={raiseHands}
              fallbackAvatarUrl="/favicon.ico"
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
              if (enabled) {
                handleStartRecording();
              } else {
                handleStopRecording();
              }
            }}
            onToggleLiveCC={toggleLiveCaptions}
            startLocalMedia={startLocalMedia}
            meetingStartAt={meetingStartAt}
            roomId={roomId}
            hostName={hostName}
            recordedUrl={lastRecordingUrl || recordedUrl}
            isRecording={isRecording}
            recordingTime={recordingTime}
            onDownloadRecording={handleDownloadRecording}
            formatRecordingTime={formatRecordingTime}
            // Enhanced Live captions props
            liveCaptionsEnabled={liveCaptionsEnabled}
            isCaptionsActive={isCaptionsActive}
            captions={captions}
            currentCaption={currentCaption}
            onClearCaptions={clearCaptions}
            onExportCaptions={exportCaptions}
            captionsLanguage={captionsLanguage}
            onCaptionsLanguageChange={setCaptionsLanguage}
            captionsRestartAttempts={captionsRestartAttempts}
          />
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
    </div>
  );
}