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
    <div className="landing-root no-scroll">
      <div className="landing-hero compact">

        {/* HERO LEFT */}
        <div className="hero-left compact-left">
          {/* HERO IMAGE above title */}
          <div className="hero-top-image-wrap">
            <img
              className="hero-top-image"
              src="/mnt/data/84082276-77cb-4b98-97b9-3f5fae25f1b5.png"
              alt="MeetLite preview"
            />
          </div>

          <h1 className="hero-title compact-title">MeetLite</h1>
          <p className="hero-sub compact-sub">
            Premium video meetings — fast, secure, beautiful.
          </p>

          <div className="join-form compact-form">
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

            <div className="or compact-or">OR</div>
            <div className="foot-note compact-foot">Tip: Allow camera & mic to preview before joining.</div>
          </div>
        </div>

        {/* HERO RIGHT */}
        <div className="hero-right compact-right">
          <div className="card-preview compact-preview">
            <div className="card-media">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 7.5V16.5C21 17.3284 20.3284 18 19.5 18H4.5C3.67157 18 3 17.3284 3 16.5V7.5C3 6.67157 3.67157 6 4.5 6H19.5C20.3284 6 21 6.67157 21 7.5Z" stroke="#fff" strokeWidth="1.2"/><path d="M8 10.5L12 13.5L16 10.5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>

            <div className="card-body">
              <h3>Fast meetings</h3>
              <p>Share a short room id — no signup. Optimized for audio/video calls and chat.</p>
              <ul className="card-feats">
                <li>HD video preview</li>
                <li>Host controls & reactions</li>
                <li>Live captions & AI translation</li>
              </ul>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 8 }}>
            <button className="btn-ghost" onClick={openInviteModal}>Copy invite / QR</button>
          </div>
        </div>
      </div>

      {/* Invite modal (keeps internal scrolling if needed) */}
      {inviteOpen && (
        <div className="invite-modal-backdrop" role="dialog" aria-modal="true">
          <div className="invite-modal card-surface invite-scrollable">
            <div className="invite-header">
              <h3 style={{ margin: 0 }}>Invite people to this meeting</h3>
              <div>
                <button className="btn-ghost" onClick={() => { navigator.clipboard?.writeText(meetingUrl(room || "")); alert("Copied"); }}>Copy link</button>
                <button className="btn-ghost" style={{ marginLeft: 8 }} onClick={() => setInviteOpen(false)}>Close</button>
              </div>
            </div>

            <div className="invite-body">
              <div className="invite-left">
                <label className="adv-label">Room</label>
                <input readOnly value={meetingUrl(room || "")} className="input" />
                <div className="invite-actions">
                  <button className="btn-ghost" onClick={() => {
                    navigator.share ? navigator.share({ title: "Join my meeting", url: meetingUrl(room || "") }) : alert("Share not supported");
                  }}>
                    Native share
                  </button>
                  <button className="btn-ghost" onClick={() => window.open(`mailto:?subject=Join meeting&body=${encodeURIComponent(meetingUrl(room || ""))}`)}>Email</button>
                  <button className="btn-ghost" onClick={() => navigator.clipboard?.writeText(`meet://${room || ""}?name=${encodeURIComponent(name || "Guest")}`)}>Copy deep-link</button>
                </div>

                <div style={{ marginTop: 12 }}>
                  <small style={{ color: "#94a3b8" }}>Deep-link (app)</small>
                  <div className="deep-preview">{`meet://${room || ""}?name=${encodeURIComponent(name || "Guest")}`}</div>
                </div>
              </div>

              <div className="invite-right">
                {qrDataUrl ? <img src={qrDataUrl} alt="QR" className="qr-img" /> : <div className="qr-placeholder">Generating QR…</div>}
                <div className="qr-caption">Scan to join</div>
                <div className="preview-wrap">
                  <small>Preview</small>
                  <img alt="preview" src={"/mnt/data/511fe844-0f8d-42f2-b0bf-4445f33ab68a.png"} className="preview-img" />
                </div>
              </div>
            </div>

            <div className="invite-footer">
              <button className="btn-primary" onClick={() => setInviteOpen(false)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
