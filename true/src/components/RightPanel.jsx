// src/components/RightPanel.jsx
import React, { useEffect, useRef, useState } from "react";
import "../styles/rightpanel.css"; // keep this import
import "../styles/meeting.css";    // ensure chat CSS is loaded (the Teams-like chat CSS you added)

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

  // NEW props for meeting info
  meetingStartAt = null,
  roomId = null,
  hostName = null,
}) {
  const [tab, setTab] = useState(activeTab || "chat");
  const [text, setText] = useState("");
  const messagesRef = useRef(null);
  const [devices, setDevices] = useState([]);
  const [selectedCamera, setSelectedCamera] = useState("");
  const [recording, setRecording] = useState(false);
  const [livecc, setLivecc] = useState(false);

  // optimistic local pending messages (shown until server echoes back)
  const [localPending, setLocalPending] = useState([]);

  // emoji picker
  const [emojiOpen, setEmojiOpen] = useState(false);
  const emojiList = ["😀","😃","😂","😊","😍","😮","😢","👍","🙏","🎉","🔥","💯","😅","😉","🤝","🎁","😎","🤔","🙌","❤️"];

  // file input ref
  const fileInputRef = useRef(null);

  // voice recorder
  const recRef = useRef(null); // MediaRecorder
  const chunksRef = useRef([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordStartAt, setRecordStartAt] = useState(null);

  // Meeting info timer (seconds)
  const [elapsedSec, setElapsedSec] = useState(() => meetingStartAt ? Math.floor((Date.now() - meetingStartAt) / 1000) : 0);

  useEffect(() => {
    setTab(activeTab || "chat");
  }, [activeTab]);

  // Meeting timer effect
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

  // auto scroll to bottom when chat messages change (vertical only)
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
    if (selectedCamera) onSelectDevice(selectedCamera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCamera]);

  // When parent provides new chatMessages, remove any pending local messages
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
            const timeClose = Math.abs((cm.time || 0) - (pending.time || 0)) < 5000; // 5s tolerance
            return sameType && sameText && timeClose;
          } catch (e) {
            return false;
          }
        });
        return !matched;
      })
    );
  }, [chatMessages]);

  // create combined list for rendering: server messages first, then pending
  const combinedMessages = (chatMessages || []).concat(localPending);

  // Updated submit: create a normalized message object and optimistically add to localPending
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

    // show instantly
    setLocalPending(prev => [...prev, payload]);

    // send to parent (parent should forward to server). parent can also strip/transform if needed.
    try {
      onSendChat(payload);
    } catch (err) {
      console.warn("onSendChat failed", err);
    }

    setText("");
  };

  // insert emoji at cursor / append
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

  // file attach handler
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

  // voice recording logic
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
        setIsRecording(false);
        setRecordStartAt(null);
      };
      mr.start();
      setIsRecording(true);
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

  // render a chat message block
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

          {/* content */}
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

  // send an emoji-only click (convenience)
  const sendEmojiQuick = (emoji) => {
    const payload = { type: "text", text: emoji, from: mySocketId || "You", time: Date.now(), _localId: `local-${Date.now()}-${Math.random().toString(36).slice(2,7)}` };
    setLocalPending(prev => [...prev, payload]);
    onSendChat(payload);
  };

  return (
    <aside
      className={`right-panel sidebar ${open ? "open" : ""}`}
      role="complementary"
      aria-label="Right panel"
      style={{ overflowX: "hidden" }} // prevent side scroll on panel root
    >
      <div className="rp-header">
        <div className="rp-title">
          <h3>Meeting</h3>
          <div className="rp-tabs">
            <button className={`rp-tab ${tab === "chat" ? "active" : ""}`} onClick={() => setTab("chat")}>Chat</button>
            <button className={`rp-tab ${tab === "people" ? "active" : ""}`} onClick={() => setTab("people")}>People</button>
            <button className={`rp-tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>Settings</button>
            {/* NEW Meeting info tab */}
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
            {/* chat-messages: ensure no horizontal scroll, vertical scroll only */}
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
                style={{ flex: 1, minWidth: 0 }} // minWidth:0 avoids input causing overflow
              />

              <input type="file" ref={fileInputRef} style={{ display: "none" }} onChange={onFileSelected} />

              <button type="button" className="tool-btn" onClick={() => fileInputRef.current && fileInputRef.current.click()} title="Attach file">📎</button>

              {/* voice record toggle */}
              {!isRecording ? (
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

            <div className="right-panel-section" style={{ marginTop: 12 }}>
              <h4>Meeting features</h4>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={recording} onChange={(e) => { setRecording(e.target.checked); onToggleRecord(e.target.checked); }} />
                  Record meeting
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="checkbox" checked={livecc} onChange={(e) => { setLivecc(e.target.checked); onToggleLiveCC(e.target.checked); }} />
                  Live captions
                </label>
              </div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 8 }}>Record and Live CC toggles are UI-level controls — wire to your backend / transcription service to persist & function.</div>
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

        {/* NEW: Meeting info tab content */}
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
