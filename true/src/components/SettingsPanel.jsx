// src/components/SettingsPanel.jsx
import React, { useEffect, useState } from "react";
import "../styles/meeting.css";

/* same timeAgo helper */
function timeAgo(ts) {
  if (!ts) return "";
  const sec = Math.floor((Date.now() - (typeof ts === "number" ? ts : new Date(ts).getTime())) / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function SettingsPanel({
  visibleTab = "chat",
  participants = [],
  chatMessages = [],
  onSendChat = () => {},
  onKick = () => {},
  onMute = () => {},
  onMuteAll = () => {},
  onToggleCC = () => {},
  ccEnabled = false,
  ccLang = "none",
  setCcLang = () => {},
  onRaiseHand = () => {},
  isHost = false,
  mySocketId = null,
}) {
  const [tab, setTab] = useState(visibleTab);
  const [text, setText] = useState("");
  const [devices, setDevices] = useState({ cams: [], mics: [], speakers: [] });
  const [selCam, setSelCam] = useState("");
  const [selMic, setSelMic] = useState("");
  const [videoEffect, setVideoEffect] = useState("none");

  useEffect(() => {
    async function loadDevices() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
        const list = await navigator.mediaDevices.enumerateDevices();
        const cams = list.filter(d => d.kind === "videoinput");
        const mics = list.filter(d => d.kind === "audioinput");
        const speakers = list.filter(d => d.kind === "audiooutput");
        setDevices({ cams, mics, speakers });
        if (cams[0]) setSelCam(cams[0].deviceId);
        if (mics[0]) setSelMic(mics[0].deviceId);
      } catch (e) { console.warn(e); }
    }
    loadDevices();
  }, []);

  const send = () => {
  if (!text.trim()) return;
  const p = { type: "text", from: "You", text: text.trim(), time: Date.now(), local: true };
  onSendChat && onSendChat(p);
  setText("");
};


  return (
    <div className="panel right-panel">
      <div className="panel-header">
        <div style={{ fontWeight: 700 }}>Chat & Settings</div>
      </div>

      <div className="panel-tabs">
        <button className={`tab-btn ${tab === "chat" ? "active" : ""}`} onClick={() => setTab("chat")}>Chat</button>
        <button className={`tab-btn ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>Settings</button>
        <button className={`tab-btn ${tab === "people" ? "active" : ""}`} onClick={() => setTab("people")}>People</button>
      </div>

      <div className="panel-body">
        {tab === "chat" && (
          <>
            <div className="chat-list">
              <div className="chat-messages">
                {chatMessages.length === 0 ? <div className="small-muted">No messages</div> :
                  chatMessages.map((m, i) => {
                    if (m.type === "system") {
                      return <div key={i} className="chat-message system">{m.text}</div>;
                    }
                    const isMe = (m.from === mySocketId || m.from === "You" || m.local);
                    const cls = isMe ? "chat-item me" : "chat-item other";
                    const displayName = m.from === "You" ? "You" : (m.from || m.name || "Someone");
                    const initial = (displayName || "U").charAt(0).toUpperCase();
                    return (
                      <div key={i} className={cls}>
                        <div className="avatar">{initial}</div>
                        <div className="msg-body-wrap">
                          <div className="meta">
                            <span className="meta-name">{displayName}</span>
                            <span className="meta-time">{timeAgo(m.time)}</span>
                          </div>
                          <div className="bubble">{m.text}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input value={text} onChange={e => setText(e.target.value)} placeholder="Write a message..." />
              <button className="btn" onClick={send}>Send</button>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>Captions (recent)</div>
              <div className="caption-history">
                <div className="small-muted">No captions yet</div>
              </div>
            </div>
          </>
        )}

        {tab === "settings" && (
          <>
            <h4>Camera</h4>
            <select value={selCam} onChange={(e) => setSelCam(e.target.value)}>
              {devices.cams.map(c => <option key={c.deviceId} value={c.deviceId}>{c.label || c.deviceId}</option>)}
            </select>

            <h4 style={{ marginTop: 12 }}>Video effect</h4>
            <div>
              <label><input type="radio" name="ve" checked={videoEffect === "none"} onChange={() => setVideoEffect("none")} /> None</label>
              <label style={{ marginLeft: 8 }}><input type="radio" name="ve" checked={videoEffect === "soft"} onChange={() => setVideoEffect("soft")} /> Soft</label>
              <label style={{ marginLeft: 8 }}><input type="radio" name="ve" checked={videoEffect === "blur"} onChange={() => setVideoEffect("blur")} /> Blur</label>
              <label style={{ marginLeft: 8 }}><input type="radio" name="ve" checked={videoEffect === "bright"} onChange={() => setVideoEffect("bright")} /> Bright</label>
            </div>

            <h4 style={{ marginTop: 12 }}>Live captions (AI)</h4>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={ccLang} onChange={(e) => setCcLang(e.target.value)}>
                <option value="none">English (no translate)</option>
                <option value="hi">Hindi</option>
                <option value="te">Telugu</option>
                <option value="ta">Tamil</option>
              </select>
              <button className="btn" onClick={() => onToggleCC(!ccEnabled)}>{ccEnabled ? "Disable CC" : "Enable CC"}</button>
              <div style={{ marginLeft: 8, color: "#666", fontSize: 13 }}>{ccEnabled ? "Captions: ON" : "Captions: OFF"}</div>
            </div>

            <div style={{ marginTop: 12 }}>
              {isHost && <button className="tiny-btn" onClick={() => onMuteAll && onMuteAll()}>Mute all</button>}
            </div>
          </>
        )}

        {tab === "people" && (
          <>
            <h4>Participants ({participants.length})</h4>
            {participants.length === 0 ? <div className="small-muted">No participants</div> :
              participants.map(p => (
                <div key={p.socketId || p.id} className="person-item">
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.name || p.socketId} {p.socketId === mySocketId ? " (you)" : ""}</div>
                    <div className="small-muted">{p.isHost ? "Host" : "Participant"}</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {isHost && p.socketId !== mySocketId && (
                      <>
                        <button className="tiny-btn" onClick={() => onMute && onMute(p.socketId)}>Mute</button>
                        <button className="tiny-btn danger" onClick={() => onKick && onKick(p.socketId)}>Kick</button>
                      </>
                    )}
                    {p.socketId === mySocketId && <button className="tiny-btn" onClick={() => onRaiseHand && onRaiseHand(p.socketId, true)}>Raise</button>}
                  </div>
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
