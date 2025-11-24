// src/pages/Home.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home-v2.css";

export default function Home() {
  const [joinCode, setJoinCode] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [lastRoom, setLastRoom] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [advancedRoomId, setAdvancedRoomId] = useState("");
  const navigate = useNavigate();
  const revealContainer = useRef(null);

  const makeRoomId = () => Math.random().toString(36).slice(2, 9).toUpperCase();

  useEffect(() => {
    const root = revealContainer.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll(".reveal"));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("revealed");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((it) => io.observe(it));
    return () => io.disconnect();
  }, []);

  const handleCreate = () => {
    const id = makeRoomId();
    setLastRoom(id);
    setInviteOpen(true);
  };

  const handleAdvancedCreate = () => {
    // if user provided a room id - use it, otherwise generate one
    const id = (advancedRoomId || makeRoomId()).trim();
    setLastRoom(id);
    setInviteOpen(true);
  };

  const confirmCreateAndJoin = () => {
    setInviteOpen(false);
    const name = displayName || "Host";
    navigate(`/meet/${lastRoom}?name=${encodeURIComponent(name)}`);
  };

  const copyInvite = async () => {
    const url = `${window.location.origin}/meet/${lastRoom}`;
    try {
      await navigator.clipboard.writeText(url);
      alert("Invite link copied to clipboard");
    } catch {
      prompt("Copy this invite link:", url);
    }
  };

  const handleJoin = () => {
    const code = (joinCode || "").trim();
    if (!code) return alert("Please enter meeting code");
    navigate(`/meet/${code}?name=${encodeURIComponent("Guest")}`);
  };

  return (
    <div className="home-root-v2">
      <header className="hero-v2">
        <div className="hero-glow" />
        <div className="hero-inner">
          <img
            className="hero-logo"
            alt="MeetLite"
            src="/assets/hero.png"
            onError={(e) => { e.currentTarget.src = "/mnt/data/5c63170f-6724-41a8-af0d-1c28090cd407.png"; }}
          />
          <h1 className="hero-title">MeetLite</h1>
          <p className="hero-sub">Premium video meetings — fast, secure, beautiful.</p>
          <div className="hero-cta-row">
            <button className="btn btn-ghost" onClick={() => window.scrollTo({ top: 680, behavior: "smooth" })}>Explore</button>
            <button className="btn btn-primary" onClick={handleCreate}>Create a meeting</button>
          </div>
        </div>
      </header>

      <main className="main-v2" ref={revealContainer}>

        <section className="card-grid-v2">
          <div className="card-v2 card-create reveal" aria-live="polite">
            <div className="card-left">
              <div className="card-icon" aria-hidden>🎥</div>
              <h3>Create a meeting</h3>
              <p>Create a private room and invite participants instantly. Host controls available.</p>

              <div className="card-actions" style={{ marginTop: 8 }}>
                <button className="btn btn-primary" onClick={handleCreate}>Create room</button>
                <button
                  className="btn btn-outline"
                  onClick={() => setShowAdvanced((s) => !s)}
                  aria-expanded={showAdvanced}
                  aria-controls="advanced-panel"
                >
                  {showAdvanced ? "Close advanced" : "Advanced"}
                </button>
              </div>

              {/* Advanced options (inline) */}
              {showAdvanced && (
                <div id="advanced-panel" className="advanced-panel" role="region" aria-label="Advanced create options">
                  <label className="adv-label">
                    Display name
                    <input
                      className="input adv-input"
                      placeholder="Your display name (optional)"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </label>

                  <label className="adv-label">
                    Room id (leave empty to generate)
                    <input
                      className="input adv-input"
                      placeholder="Custom room id (e.g. TEAM123)"
                      value={advancedRoomId}
                      onChange={(e) => setAdvancedRoomId(e.target.value.toUpperCase())}
                    />
                  </label>

                  <div className="adv-actions">
                    <button
                      className="btn btn-primary"
                      onClick={() => { handleAdvancedCreate(); }}
                    >
                      Create with advanced options
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => {
                        setShowAdvanced(false);
                        setAdvancedRoomId("");
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="card-right">
              <div className="card-note">Fast link</div>
              <div className="card-hero-code">{lastRoom || "—"}</div>
            </div>
          </div>

          <div className="card-v2 card-join reveal">
            <div className="card-left">
              <div className="card-icon">🔗</div>
              <h3>Join a meeting</h3>
              <p>Enter the meeting code you received from the host.</p>
              <div className="join-row">
                <input
                  className="input"
                  placeholder="Meeting code (e.g. ABC1234)"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                />
                <button className="btn btn-primary" onClick={handleJoin}>Join</button>
              </div>
              <div className="small muted">Need help? Contact the host.</div>
            </div>

            <div className="card-right">
              <div className="card-note">Secure</div>
              <div className="card-hero-code">Invite-only</div>
            </div>
          </div>
        </section>

        <section className="features-v2 reveal">
          <div className="feature-v2">
            <strong>HD audio & video</strong>
            <span>Adaptive bitrate and echo cancelation for smooth calls.</span>
          </div>
          <div className="feature-v2">
            <strong>Host controls</strong>
            <span>Mute, remove, lock meeting & screen sharing controls.</span>
          </div>
          <div className="feature-v2">
            <strong>Privacy first</strong>
            <span>Rooms are invite-only and secure.</span>
          </div>
        </section>
      </main>

      <footer className="footer-v2">
        <div>© {new Date().getFullYear()} MeetLite</div>
        <div className="footer-links"><a href="/privacy">Privacy</a> · <a href="/terms">Terms</a></div>
      </footer>

      {inviteOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <h4>Room created</h4>
            <p>Share this link with participants to invite them to your room.</p>
            <div className="invite-row">
              <input readOnly value={`${window.location.origin}/meet/${lastRoom}`} />
              <div className="invite-actions">
                <button className="btn btn-outline" onClick={() => setInviteOpen(false)}>Close</button>
                <button className="btn btn-primary" onClick={copyInvite}>Copy link</button>
                <button className="btn btn-primary" onClick={confirmCreateAndJoin}>Start meeting</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
