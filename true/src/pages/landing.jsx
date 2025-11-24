// src/pages/Landing.jsx
import React, { useState } from "react";
import QRCode from "qrcode";

import "../styles/landing.css";

export default function Landing({ initialName = "" }) {
  const [name, setName] = useState(initialName);
  const [room, setRoom] = useState("");
  const [creating, setCreating] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  // change this if your backend route differs
  async function createNewRoomAndJoin(providedName = "Guest") {
    setCreating(true);
    try {
      const res = await fetch("/meet/api/rooms/create/", { method: "POST" });
      if (!res.ok) throw new Error("create room failed");
      const data = await res.json();
      const roomId = data.room_id || data.room || "";
      setRoom(roomId);

      // generate QR data url for the meeting link
      const url = meetingUrl(roomId, providedName);
      try { const q = await QRCode.toDataURL(url, { margin: 1, scale: 6 }); setQrDataUrl(q); } catch(e){ setQrDataUrl(null); }

      // redirect: go to /meet/<room>?name=<name>
      window.location.href = url;
    } catch (err) {
      console.error("create room error", err);
      alert("Could not create room. Try again.");
    } finally { setCreating(false); }
  }

  function meetingUrl(roomId, nm = name || "Guest") {
    const base = window.location.origin;
    // if roomId empty, use join root path (makes copy/share show something)
    const path = roomId ? `/meet/${encodeURIComponent(roomId)}?name=${encodeURIComponent(nm)}` : `/meet/?name=${encodeURIComponent(nm)}`;
    return `${base}${path}`;
  }

  async function onCopyInvite() {
    const url = meetingUrl(room || "");
    try {
      await navigator.clipboard.writeText(url);
      alert("Invite link copied");
    } catch (e) {
      prompt("Copy this link", url);
    }
  }

  function openInviteModal() {
    // pre-generate QR for current room or generic join URL
    const url = meetingUrl(room || "");
    setInviteOpen(true);
    QRCode.toDataURL(url, { margin: 1, scale: 6 })
      .then((d) => setQrDataUrl(d))
      .catch(() => setQrDataUrl(null));
  }

  return (
    <div className="landing-root">
      <div className="landing-hero">
        <div className="hero-left">
          <h1 className="hero-title">Meet Lite</h1>
          <p className="hero-sub">
            Fast, lightweight WebRTC meetings — no install. Create a room, share the link, and start your call.
          </p>

          <div className="join-form">
            <div className="input-row">
              <input className="input" placeholder="Your name (e.g. Maya)" value={name} onChange={(e) => setName(e.target.value)} />
              <button className="btn-ghost" onClick={() => {
                // join existing /meet?name=... (user can paste a room in below)
                const url = meetingUrl(room || "");
                window.location.href = url;
              }}>Join</button>
            </div>

            <div className="input-row">
              <input className="input" placeholder="Paste room id to join (or leave empty to create)" value={room} onChange={(e) => setRoom(e.target.value)} />
              <button className="btn-primary btn-create" onClick={() => {
                if (room.trim()) {
                  // join existing
                  window.location.href = meetingUrl(room.trim(), name || "Guest");
                } else {
                  // create new
                  createNewRoomAndJoin(name || "Guest");
                }
              }}>{creating ? "Creating…" : "Create new meeting"}</button>
            </div>

            <div className="or">OR</div>
            <div className="foot-note">Tip: Use your browser's camera & mic permissions to preview before joining.</div>
          </div>
        </div>

        <div className="hero-right">
          <div className="card-preview">
            <div className="card-media">
              {/* small icon or gradient */}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 7.5V16.5C21 17.3284 20.3284 18 19.5 18H4.5C3.67157 18 3 17.3284 3 16.5V7.5C3 6.67157 3.67157 6 4.5 6H19.5C20.3284 6 21 6.67157 21 7.5Z" stroke="#fff" strokeWidth="1.2"/><path d="M8 10.5L12 13.5L16 10.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>

            <div className="card-body">
              <h3>Fast meetings</h3>
              <p>Share a short room id — no signup. Optimized layout for audio/video calls and chat.</p>
              <ul className="card-feats">
                <li>HD video preview</li>
                <li>Host controls & reactions</li>
                <li>Live captions & AI translation (optional)</li>
              </ul>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 10 }}>
            <button className="btn-ghost" onClick={openInviteModal}>Copy invite / QR</button>
          </div>
        </div>
      </div>

      {/* Invite modal (basic) */}
      {inviteOpen && (
        <div className="invite-modal-backdrop" role="dialog" aria-modal="true" style={{
          position: "fixed", left: 0, right: 0, top: 0, bottom: 0, display: "grid", placeItems: "center",
          background: "rgba(6,10,18,0.6)", zIndex: 2000
        }}>
          <div style={{ width: 820, maxWidth: "calc(100% - 40px)", background: "#fff", borderRadius: 12, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Invite people to this meeting</h3>
              <div>
                <button className="btn-ghost" onClick={() => { navigator.clipboard?.writeText(meetingUrl(room || "")); alert("Copied"); }}>Copy link</button>
                <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={() => setInviteOpen(false)}>Close</button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 18, marginTop: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 700 }}>Room:</label>
                <input readOnly value={meetingUrl(room || "")} style={{ width: "100%", marginTop: 8, padding: 10, borderRadius: 8, border: "1px solid #eee" }} />
                <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                  <button className="btn-ghost" onClick={() => { navigator.share ? navigator.share({ title: "Join my meeting", url: meetingUrl(room || "") }) : alert("Share not supported"); }}>Native share</button>
                  <button className="btn-ghost" onClick={() => window.open(`mailto:?subject=Join meeting&body=${encodeURIComponent(meetingUrl(room || ""))}`)}>Email</button>
                  <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(`meet://${room || ""}?name=${encodeURIComponent(name || "Guest")}`)}>Copy deep-link</button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <small style={{ color: "#666" }}>Deep-link (app):</small>
                  <div style={{ marginTop: 6, background: "#fafafa", padding: 8, borderRadius: 6, fontFamily: "monospace", fontSize: 13 }}>
                    {`meet://${room || ""}?name=${encodeURIComponent(name || "Guest")}`}
                  </div>
                </div>
              </div>

              <div style={{ width: 260, textAlign: "center" }}>
                {qrDataUrl ? <img src={qrDataUrl} alt="QR" style={{ width: 220, height: 220 }} /> : <div style={{ width: 220, height: 220, display: "grid", placeItems: "center" }}>Generating QR…</div>}
                <div style={{ marginTop: 8, color: "#666" }}>Scan to join</div>

                {/* preview screenshot (use the uploaded path you gave me) */}
                <div style={{ marginTop: 14 }}>
                  <small>Preview</small>
                  <img alt="preview" src={"/mnt/data/511fe844-0f8d-42f2-b0bf-4445f33ab68a.png"} style={{ width: 160, borderRadius: 8, display: "block", marginTop: 8 }} />
                </div>
              </div>
            </div>

            <div style={{ textAlign: "right", marginTop: 12 }}>
              <button className="btn-primary" onClick={() => setInviteOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
