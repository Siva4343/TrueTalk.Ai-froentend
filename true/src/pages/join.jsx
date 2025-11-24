// src/pages/JoinPage.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/landing.css";

export default function JoinPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [room, setRoom] = useState("");

  // simple random id generator for "Create meeting"
  function makeId(len = 7) {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let s = "";
    for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function handleCreate() {
    const id = makeId(8);
    const n = name.trim() || "Guest";
    navigate(`/meet/${id}?name=${encodeURIComponent(n)}`);
  }

  function handleJoin(e) {
    e.preventDefault();
    if (!room.trim()) return;
    const n = name.trim() || "Guest";
    navigate(`/meet/${room.trim()}?name=${encodeURIComponent(n)}`);
  }

  return (
    <main className="landing-root">
      <div className="landing-hero">
        <div className="hero-left">
          <h1 className="hero-title">Meet Lite</h1>
          <p className="hero-sub">
            Fast, lightweight WebRTC meetings — no install. Create a room, share the link,
            and start your call. Beautiful UI, low-latency video.
          </p>

          <form className="join-form" onSubmit={handleJoin} aria-labelledby="join-heading">
            <div className="input-row">
              <label htmlFor="name" className="sr-only">Display name</label>
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (e.g. Maya)"
                className="input"
                aria-label="Display name"
              />
            </div>

            <div className="input-row">
              <label htmlFor="room" className="sr-only">Room id</label>
              <input
                id="room"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Paste room id to join (or leave empty to create)"
                className="input"
                aria-label="Room id"
              />
              <button type="submit" className="btn-ghost">Join</button>
            </div>

            <div className="or">OR</div>

            <button
              type="button"
              className="btn-primary btn-create"
              onClick={handleCreate}
              aria-label="Create new meeting"
            >
              Create new meeting
            </button>

            <p className="foot-note">Tip: Use your browser's camera & mic permissions to preview before joining.</p>
          </form>
        </div>

        <aside className="hero-right">
          <div className="card-preview">
            <div className="card-media" aria-hidden>
              {/* subtle placeholder hero visual */}
              <div className="camera-preview">
                <svg width="78" height="78" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="24" height="24" rx="6" fill="#0b1220"/>
                  <path d="M8 11a4 4 0 1 0 8 0 4 4 0 0 0 -8 0z" fill="#5563ff"/>
                </svg>
              </div>
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

          <div className="promo">Made with ❤️ — lightweight, performant, and private.</div>
        </aside>
      </div>
    </main>
  );
}
