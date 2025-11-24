// src/components/ChatPanel.jsx
import React, { useState } from "react";

export default function ChatPanel({ visible = false, onClose = () => {}, messages = [], onSend = () => {} }) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className={`chat-panel ${visible ? "visible" : ""}`} role="complementary" aria-hidden={!visible}>
      <div className="chat-header">
        <div>
          <h3>Meeting</h3>
          <div className="chat-sub">Chat · People · Settings</div>
        </div>
        <button className="close-btn" onClick={onClose} aria-label="Close chat">✕</button>
      </div>

      <div className="chat-body">
        <div className="messages">
          {(messages || []).length === 0 && <div className="muted">No messages yet</div>}
          {(messages || []).map((m, idx) => (
            <div key={idx} className="chat-msg">
              <div className="chat-msg-author">{m.from || m.author || "User"}</div>
              <div className="chat-msg-text">{m.text || m.message || m.text}</div>
              <div className="chat-msg-time">{m.time ? new Date(m.time).toLocaleTimeString() : ""}</div>
            </div>
          ))}
        </div>

        <footer className="chat-input">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." />
          <button onClick={handleSend}>Send</button>
        </footer>
      </div>
    </div>
  );
}
