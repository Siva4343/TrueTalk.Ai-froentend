// src/components/RightPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import "../styles/rightpanel.css";
import "../styles/meeting.css";

function timeAgo(ts) {
  if (!ts) return "";
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 10) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDuration(totalSeconds) {
  totalSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = Math.floor(totalSeconds % 60);
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function formatStartTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleString();
}

export default function RightPanel({
  open = false,
  activeTab = null,
  onClose = () => {},
  chatMessages = [],
  onSendChat = () => {},
  participants = [],
  mySocketId,
  isHost = false,
  onMuteAll = () => {},
  onKick = () => {},
  onRaise = () => {},
  debugInfo = { wsState: null, peers: 0 },
  onSelectDevice = () => {},
  onToggleRecord = () => {},
  onToggleLiveCC = () => {},
  startLocalMedia = null,
  meetingStartAt = null,
  roomId = null,
  hostName = null,

  // NEW props
  recordedUrl = null,
  isRecording = false,
  recordingTime = 0,
  onDownloadRecording = () => {},
  formatRecordingTime = (s) => "00:00",
  onChangeResolution = () => {},
  currentResolution = "auto",
}) {
  const [tab, setTab] = useState(activeTab || "chat");
  const [text, setText] = useState("");
  const messagesRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [recording, setRecording] = useState(false);
  const [livecc, setLivecc] = useState(false);

  const [localPending, setLocalPending] = useState([]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiList = ["😀","😃","😂","😊","😍","😮","😢","👍","🙏","🎉","🔥","💯","😅","😉","🤝","🎁","😎","🤔","🙌","❤️"];
  const fileInputRef = useRef(null);

  const recRef = useRef(null);
  const chunksRef = useRef([]);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordStartAt, setRecordStartAt] = useState(null);

  const [elapsedSec, setElapsedSec] = useState(() => meetingStartAt ? Math.floor((Date.now() - meetingStartAt) / 1000) : 0);

  useEffect(() => {
    setTab(activeTab || "chat");
  }, [activeTab]);

  useEffect(() => {
    if (!meetingStartAt) {
      setElapsedSec(0);
      return;
    }
    setElapsedSec(Math.floor((Date.now() - meetingStartAt) / 1000));
    const tid = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - meetingStartAt) / 1000));
    }, 1000);
    return () => clearInterval(tid);
  }, [meetingStartAt]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [chatMessages.length, localPending.length]);

  useEffect(() => {
    navigator.mediaDevices && navigator.mediaDevices.enumerateDevices && navigator.mediaDevices.enumerateDevices().then(list => {
      const cams = list.filter(d => d.kind === "videoinput");
      setDevices(cams);
      if (cams.length && !selectedCamera) setSelectedCamera(cams[0].deviceId);
    }).catch(()=>{});
  }, []);

  useEffect(() => {
    if (selectedCamera) {
      // call parent handler to actually select device (Meeting.jsx will call selectDevice(deviceId, quality))
      onSelectDevice(selectedCamera);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCamera]);

  useEffect(() => {
    if (!chatMessages || chatMessages.length === 0) {
      setLocalPending([]);
      return;
    }
    setLocalPending(prev =>
      prev.filter(pending => {
        const matched = chatMessages.some(cm => {
          try {
            if (pending._localId && cm._localId && pending._localId === cm._localId) return true;
            const sameType = cm.type === pending.type;
            const sameText = (pending.text && cm.text && cm.text === pending.text) || (pending.name && cm.name && cm.name === pending.name);
            const timeClose = Math.abs((cm.time || 0) - (pending.time || 0)) < 5000;
            return sameType && sameText && timeClose;
          } catch (e) {
            return false;
          }
        });
        return !matched;
      })
    );
  }, [chatMessages]);

  const combinedMessages = (chatMessages || []).concat(localPending);

  const submitChat = (e) => {
    e && e.preventDefault();
    const trimmed = (text || "").trim();
    if (!trimmed) return;

    const payload = {
      type: "text",
      text: trimmed,
      from: mySocketId || "You",
      time: Date.now(),
      _localId: `local-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    };

    setLocalPending(prev => [...prev, payload]);

    try {
      onSendChat(payload);
    } catch (err) {
      console.warn("onSendChat failed", err);
    }

    setText("");
  };

  const insertEmoji = (emoji) => {
    setText(prev => {
      const input = document.querySelector(".chat-input input[aria-label]");
      if (input && typeof input.selectionStart === "number") {
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const newVal = prev.slice(0, start) + emoji + prev.slice(end);
        setTimeout(() => {
          input.selectionStart = input.selectionEnd = start + emoji.length;
          input.focus();
        }, 0);
        return newVal;
      }
      return prev + emoji;
    });
    setEmojiOpen(false);
  };

  const onFileSelected = (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const payload = {
        type: "file",
        from: mySocketId || "You",
        name: file.name,
        size: file.size,
        mime: file.type,
        dataUrl,
        time: Date.now(),
        _localId: `local-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
      };
      setLocalPending(prev => [...prev, payload]);
      onSendChat(payload);
    };
    reader.readAsDataURL(file);
    ev.target.value = "";
  };

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Recording not supported in this browser");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      recRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (ev) => {
        if (ev.data && ev.data.size) chunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        const payload = {
          type: "audio",
          from: mySocketId || "You",
          url,
          blob,
          size: blob.size,
          duration: Date.now() - recordStartAt,
          time: Date.now(),
          _localId: `local-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
        };
        setLocalPending(prev => [...prev, payload]);
        onSendChat(payload);
        try { stream.getTracks().forEach(t=>t.stop()); } catch(_) {}
        setIsRecordingVoice(false);
        setRecordStartAt(null);
      };
      mr.start();
      setIsRecordingVoice(true);
      setRecordStartAt(Date.now());
    } catch (e) {
      console.warn("startRecording failed", e);
      alert("Microphone access required.");
    }
  };

  const stopRecording = () => {
    try {
      if (recRef.current && recRef.current.state !== "inactive") {
        recRef.current.stop();
      }
    } catch (e) {}
  };

  const renderMessage = (m, i) => {
    const msg = typeof m === "string" ? { type: "text", text: m, from: "Someone", time: Date.now() } : m;
    const isMe = (msg.from === mySocketId || msg.from === "You");
    const cls = msg.type === "system" ? "chat-message system" : `chat-item ${isMe ? "me" : "other"}`;

    if (msg.type === "system") {
      return <div key={msg._localId || i} className="chat-message system">{msg.text || "System"}</div>;
    }

    return (
      <div key={msg._localId || msg.time || i} className={cls}>
        <div className="avatar">{(msg.from || "U").charAt(0).toUpperCase()}</div>

        <div className="msg-body-wrap">
          <div className="meta" style={{ alignSelf: isMe ? "flex-end" : "flex-start" }}>
            <span style={{ fontWeight: 700, color: isMe ? "#c2e6ff" : "#9fb3c8" }}>{isMe ? "You" : (msg.from || "Someone")}</span>
            <span style={{ marginLeft: 8, fontSize: 12, color: "#9fb3c8" }}>{timeAgo(msg.time)}</span>
          </div>

          {msg.type === "text" && (
            <div className="bubble">{msg.text}</div>
          )}

          {msg.type === "file" && (
            <div className="bubble file-bubble" style={{ padding: 12 }}>
              {msg.mime && msg.mime.startsWith("image/") ? (
                <div style={{ display: "flex", gap: 10, alignItems: "center", maxWidth: "100%" }}>
                  <img src={msg.dataUrl} alt={msg.name} style={{ maxWidth: 220, maxHeight: 140, borderRadius: 10, width: "auto", height: "auto" }} />
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ fontWeight: 700, wordBreak: "break-word", maxWidth: 120 }}>{msg.name}</div>
                    <a href={msg.dataUrl} download={msg.name} style={{ color: "#2aa6ff", wordBreak: "break-all" }}>Download</a>
                    <div style={{ fontSize: 12, color: "#9fb3c8" }}>{Math.round((msg.size||0)/1024)} KB</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 700, wordBreak: "break-word", maxWidth: 220 }}>{msg.name}</div>
                  {!msg.mime || !msg.mime.startsWith("audio/") ? (
                    <a href={msg.dataUrl} download={msg.name} style={{ color: "#2aa6ff" }}>Download file</a>
                  ) : (
                    <a href={msg.dataUrl} style={{ color: "#2aa6ff" }}>Open</a>
                  )}
                </div>
              )}
            </div>
          )}

          {msg.type === "audio" && (
            <div className="bubble" style={{ padding: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, maxWidth: "100%" }}>
                <audio
                  controls
                  src={msg.url}
                  controlsList="nodownload"
                  onContextMenu={(e) => e.preventDefault()}
                  style={{ maxWidth: "320px", width: "100%" }}
                />
                <div style={{ fontSize: 12, color: "#9fb3c8", whiteSpace: "nowrap" }}>{(msg.duration) ? `${Math.round((msg.duration)/1000)}s` : ""}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const sendEmojiQuick = (emoji) => {
    const payload = { type: "text", text: emoji, from: mySocketId || "You", time: Date.now(), _localId: `local-${Date.now()}-${Math.random().toString(36).slice(2,7)}` };
    setLocalPending(prev => [...prev, payload]);
    onSendChat(payload);
  };

  // Camera quality options
  const QUALITY_OPTIONS = [
    { value: "auto", label: "Auto" },
    { value: "4k", label: "4K (3840×2160)" },
    { value: "1080p", label: "1080p (1920×1080)" },
    { value: "720p", label: "720p (1280×720)" },
  ];

  return (
    <aside
      className={`right-panel sidebar ${open ? "open" : ""}`}
      role="complementary"
      aria-label="Right panel"
      style={{ overflowX: "hidden" }}
    >
      <div className="rp-header">
        <div className="rp-title">
          <h3>Meeting</h3>
          <div className="rp-tabs">
            <button className={`rp-tab ${tab === "chat" ? "active" : ""}`} onClick={() => setTab("chat")}>Chat</button>
            <button className={`rp-tab ${tab === "people" ? "active" : ""}`} onClick={() => setTab("people")}>People</button>
            <button className={`rp-tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>Settings</button>
            <button className={`rp-tab ${tab === "meeting" ? "active" : ""}`} onClick={() => setTab("meeting")}>Meeting info</button>
          </div>
        </div>

        <div className="rp-actions">
          <button className="icon-btn" onClick={onClose} aria-label="Close panel">✕</button>
        </div>
      </div>

      <div className="right-panel-body">
        {tab === "chat" && (
          <div className="chat-tab">
            <div
              className="chat-messages"
              ref={messagesRef}
              style={{ overflowY: "auto", overflowX: "hidden", maxWidth: "100%" }}
            >
              {combinedMessages.length === 0 && <div className="muted-note">No messages yet</div>}
              {combinedMessages.map((m, i) => renderMessage(m, i))}
            </div>

            <form className="chat-input" onSubmit={submitChat} style={{ width: "100%", boxSizing: "border-box", display: "flex", gap: 8, alignItems: "center" }}>
              <button type="button" className="tool-btn" onClick={() => setEmojiOpen(o => !o)} title="Emoji">😊</button>

              {emojiOpen && (
                <div className="emoji-pop" style={{ position: "absolute", bottom: 92, right: 24, zIndex: 2000, background: "#0b2130", padding: 8, borderRadius: 10, boxShadow: "0 8px 20px rgba(0,0,0,0.6)" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 340 }}>
                    {emojiList.map(e => (
                      <button key={e} onClick={() => insertEmoji(e)} style={{ padding: 8, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", fontSize: 18 }}>{e}</button>
                    ))}
                  </div>
                </div>
              )}

              <input
                aria-label="Type message"
                placeholder="Type a message"
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ flex: 1, minWidth: 0 }}
              />

              <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={onFileSelected} />

              <button type="button" className="tool-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()} title="Attach file">📎</button>

              {!isRecordingVoice ? (
                <button type="button" className="tool-btn" onClick={startRecording} title="Record voice">🎙️</button>
              ) : (
                <button type="button" className="tool-btn danger" onClick={stopRecording} title="Stop recording">⏹️</button>
              )}

              <button type="submit" style={{ background: "#6c4bff", color: "white", border: "none", borderRadius: 10, padding: "8px 12px" }}>Send</button>
            </form>
          </div>
        )}

        {tab === "people" && (
          <div className="people-tab">
            <div className="people-list">
              {participants.length === 0 && <div className="muted-note">No participants yet</div>}
              {participants.map((p) => (
                <div key={p.socketId || p.id} className="person-row">
                  <div className="avatar-small">{p.name ? p.name.charAt(0).toUpperCase() : "?"}</div>
                  <div className="person-meta">
                    <div className="person-name">{p.name || "Unknown"} {p.isHost && <span className="host-inline">Host</span>}</div>
                    <div className="person-sub">{p.muted ? "Muted" : "Unmuted"}</div>
                  </div>

                  <div className="person-actions">
                    {isHost && p.socketId !== mySocketId && (
                      <>
                        <button onClick={() => onKick(p.socketId)} className="danger small">Remove</button>
                        <button onClick={() => onRaise(p.socketId, true)} className="small">Raise</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="people-bottom">
              {isHost && <button className="secondary" onClick={onMuteAll}>Mute all</button>}
              <button className="secondary" onClick={() => navigator.clipboard && navigator.clipboard.writeText(window.location.href).then(()=>alert("Invite link copied"))}>Invite</button>
            </div>
          </div>
        )}

        {tab === "settings" && (
          <div className="settings-tab">
            <div className="right-panel-section">
              <h4>Local controls</h4>

              <div style={{ marginTop: 8 }}>
                <label style={{ display: "block", marginBottom: 6 }}>Camera (choose device)</label>
                <select value={selectedCamera} onChange={(e) => setSelectedCamera(e.target.value)} style={{ padding: 8, width: "100%", borderRadius: 6 }}>
                  {devices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0,4)}`}</option>)}
                </select>
                <div style={{ marginTop: 8 }}>
                  <button className="secondary" onClick={() => alert("Audio settings")}>Audio settings</button>
                </div>
              </div>
            </div>

            {/* Meeting features section: removed checkboxes, added camera quality selector */}
            <div className="right-panel-section" style={{ marginTop: 12 }}>
              <h4>Meeting features</h4>

              <div style={{ marginTop: 8 }}>
                <label style={{ display: "block", marginBottom: 6 }}>Camera quality</label>
                <select
                  value={currentResolution || "auto"}
                  onChange={(e) => {
                    const val = e.target.value;
                    onChangeResolution(val); // parent (Meeting.jsx) will re-acquire media at this quality
                  }}
                  style={{ padding: 8, width: "100%", borderRadius: 6 }}
                >
                  {QUALITY_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                </select>

                <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>
                  The system will attempt to acquire the selected camera resolution. If the device cannot provide it, browser will choose the nearest available resolution.
                </div>
              </div>

              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 8 }}>Start Recording and Live Captions are available from the More menu (top-right). This panel only controls local devices & camera quality.</div>
            </div>

            <div className="right-panel-section" style={{ marginTop: 12 }}>
              <h4>Debug</h4>
              <div style={{ fontSize: 13, color: "#cfe9ff" }}>
                <div>WebSocket state: {String(debugInfo.wsState)}</div>
                <div>Peer connections: {debugInfo.peers || 0}</div>
                <div>Participants: {participants.length || 0}</div>
              </div>
            </div>
          </div>
        )}

        {tab === "meeting" && (
          <div className="meeting-info-tab" style={{ padding: 8, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, color: "#cfe9ff", fontWeight: 700 }}>Meeting</div>
                <div style={{ color: "#9fb3c8", fontSize: 13 }}>Room ID: <span style={{ fontWeight: 700 }}>{roomId || "—"}</span></div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#9fb3c8" }}>Started</div>
                <div style={{ fontWeight: 700 }}>{formatStartTime(meetingStartAt)}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 12, color: "#9fb3c8" }}>Host</div>
                <div style={{ fontWeight: 700 }}>{hostName || "Unknown"}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "#9fb3c8" }}>Duration</div>
                <div style={{ fontWeight: 700 }}>{formatDuration(elapsedSec)}</div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: "#9fb3c8" }}>Participants</div>
                <div style={{ fontWeight: 700 }}>{participants ? participants.length : 0}</div>
              </div>
            </div>

            <div style={{ marginTop: 6, fontSize: 13, color: "#cfe9ff" }}>
              <div style={{ marginBottom: 6 }}>Other details</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#9fb3c8" }}>
                <li>Mute on entry: {hostLocked ? "Yes" : "No"}</li>
                <li>Recording: {recording ? "Enabled" : "Disabled"}</li>
                <li>Live captions: {livecc ? "On" : "Off"}</li>
              </ul>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              {isHost && <button className="secondary" onClick={() => { if (window.confirm("End meeting for all?")) { onToggleRecord(false); /* optionally call host-end logic */ } }}>End meeting</button>}
              <button className="secondary" onClick={() => navigator.clipboard?.writeText(window.location.href).then(()=>alert("Link copied"))}>Copy Invite</button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
