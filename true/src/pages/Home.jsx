// src/pages/Home.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home-v2.css";

export default function Home() {
  const [joinCode, setJoinCode] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [lastRoom, setLastRoom] = useState("");
  const [displayName, setDisplayName] = useState("");

  // existing advancedRoomId state used by create flow
  const [advancedRoomId, setAdvancedRoomId] = useState("");

  // NEW: modal-open state + local modal form fields
  const [advancedModalOpen, setAdvancedModalOpen] = useState(false);
  const [advCustomRoom, setAdvCustomRoom] = useState("");        // local custom room input
  const [advParticipantLimit, setAdvParticipantLimit] = useState(""); // local participant limit input

  // Persisted participant limit used when creating room (could be sent to backend)
  const [participantLimit, setParticipantLimit] = useState("");

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

  // create flow (opens the invite modal after generating id)
  const handleCreate = () => {
    // if advancedRoomId is set, use it; otherwise create a new one
    const id = (advancedRoomId || makeRoomId()).trim();
    setLastRoom(id);
    setInviteOpen(true);
  };

  // handle create when advanced modal confirms values
  const handleAdvancedCreate = () => {
    // advancedRoomId is expected to already be set by the modal confirm
    const id = (advancedRoomId || makeRoomId()).trim();
    setLastRoom(id);
    setInviteOpen(true);

    // NOTE: if you want participantLimit enforced on server side,
    // send participantLimit in the create POST to your backend.
    // Example:
    // fetch("/meet/api/rooms/create/", { method: "POST", body: JSON.stringify({ room_id: id, participant_limit: participantLimit }), headers: { "Content-Type":"application/json" }})
    //  .then(...)
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

  // Modal confirm handler (applies modal fields to main state then creates)
  const confirmAdvancedModal = () => {
    // validate participant limit if present
    if (advParticipantLimit !== "") {
      const n = Number(advParticipantLimit);
      if (!Number.isInteger(n) || n < 0 || n > 500) {
        return alert("Participant limit must be an integer between 0 and 500");
      }
    }

    // apply the modal values to the shared state used for creation
    setAdvancedRoomId(advCustomRoom.trim());
    setParticipantLimit(advParticipantLimit.toString().trim());
    setDisplayName((d) => d); // keep current displayName (modal also edits it)
    setAdvancedModalOpen(false);

    // now call the create flow that uses advancedRoomId / participantLimit
    handleAdvancedCreate();
  };

  // quick presets for participant limit
  const applyPreset = (val) => {
    setAdvParticipantLimit(String(val));
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

                {/* Gear button opens the Advanced modal */}
                <button
                  className="btn btn-ghost"
                  title="Advanced settings"
                  onClick={() => {
                    // prefill modal fields from persisted values for convenience
                    setAdvCustomRoom(advancedRoomId || "");
                    setAdvParticipantLimit(participantLimit || "");
                    setAdvancedModalOpen(true);
                  }}
                  aria-haspopup="dialog"
                  aria-expanded={advancedModalOpen}
                >
                  ⚙️ Advanced
                </button>
              </div>

              {/* note: inline advanced removed intentionally for a clean UI */}
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

        {/* features below cards */}
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

      {/* Premium invite modal */}
      {inviteOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="invite-modal card-surface invite-scrollable">
            <div className="invite-header">
              <h4>Room created</h4>
              <div className="invite-header-actions">
                <button className="btn btn-ghost" onClick={() => setInviteOpen(false)}>Close</button>
              </div>
            </div>

            <div className="invite-content">
              <p className="invite-desc">Share this link with participants to invite them to your room.</p>

              <div className="invite-row">
                <input className="input invite-input" readOnly value={`${window.location.origin}/meet/${lastRoom}`} />
                <div className="invite-actions">
                  <button className="btn btn-outline" onClick={copyInvite}>Copy link</button>
                  <button className="btn btn-primary" onClick={confirmCreateAndJoin}>Start meeting</button>
                </div>
              </div>

              <div className="invite-footer">
                <small className="muted">Tip: You can paste this link into chat or email. Participant limit: {participantLimit || "default"}</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings Modal */}
      {advancedModalOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="advanced-modal card-surface">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h4 style={{ margin: 0 }}>Advanced settings</h4>
              <button className="btn btn-ghost" onClick={() => setAdvancedModalOpen(false)}>Close</button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
              <label className="adv-label">
                Display name
                <input
                  className="input adv-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Optional"
                />
              </label>

              <label className="adv-label">
                Room id (leave empty to generate)
                <input
                  className="input adv-input"
                  value={advCustomRoom}
                  onChange={(e) => setAdvCustomRoom(e.target.value.toUpperCase())}
                  placeholder="Custom room id (e.g. TEAM123)"
                />
              </label>

              <label className="adv-label">
                Participant limit (0 = default)
                <input
                  className="input adv-input"
                  type="number"
                  min="0"
                  max="500"
                  value={advParticipantLimit}
                  onChange={(e) => setAdvParticipantLimit(e.target.value)}
                  placeholder="e.g. 200"
                />
              </label>

              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-outline" onClick={() => applyPreset && applyPreset(25) || setAdvParticipantLimit("25")}>Small (25)</button>
                <button className="btn btn-outline" onClick={() => applyPreset && applyPreset(100) || setAdvParticipantLimit("100")}>Medium (100)</button>
                <button className="btn btn-outline" onClick={() => applyPreset && applyPreset(300) || setAdvParticipantLimit("300")}>Large (300)</button>
                <button className="btn btn-ghost" onClick={() => { setAdvParticipantLimit(""); setAdvCustomRoom(""); }}>Reset</button>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                <button className="btn btn-outline" onClick={() => setAdvancedModalOpen(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={confirmAdvancedModal}>Create with options</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
