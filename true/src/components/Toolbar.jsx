import React, { useState, useEffect } from "react";
import {
  IconChat,
  IconPeople,
  IconHand,
  IconEmoji,
  IconCam,
  IconMic,
  IconShare,
  IconMore,
  IconLeave,
  IconEnd,
  IconRecord,
  IconStop,
} from "./icons";

const LANGS = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi (हिंदी)" },
  { code: "te-IN", label: "Telugu (తెలుగు)" },
  { code: "ta-IN", label: "Tamil (தமிழ்)" },
  { code: "kn-IN", label: "Kannada (ಕನ್ನಡ)" },
  { code: "ml-IN", label: "Malayalam (മലയാളം)" },
  { code: "mr-IN", label: "Marathi (मराठी)" },
  { code: "gu-IN", label: "Gujarati (ગુજરાતી)" },
  { code: "bn-IN", label: "Bengali (বাংলা)" },
  { code: "pa-IN", label: "Punjabi (ਪੰਜਾਬੀ)" },
  { code: "or-IN", label: "Odia (ଓଡ଼ିଆ)" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "de-DE", label: "German" },
];

export default function Toolbar({
  roomId = "",
  name = "Guest",
  onOpenPanel = () => {},
  onToggleCam = () => {},
  onToggleMic = () => {},
  onShareLink = () => {},
  onScreenShare = () => {},
  onLeave = () => {},
  onRaise = () => {},
  onReact = () => {},
  onMuteAll = () => {},
  onLock = () => {},
  isHost = false,
  hostLocked = false,
  onEndMeeting = null,
  camOn = true,
  micOn = true,

  // Live CC props (now used)
  liveCcEnabled = false,
  onToggleLiveCc = () => {},
  liveCcLang = "en-US",
  onChangeLiveCcLang = () => {},

  // Recording props
  onStartRecording = () => {},
  onStopRecording = () => {},
  isRecording = false,
  recordingTime = 0, // seconds
}) {
  const [reactOpen, setReactOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);

  const formatRecordingTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        setMoreOpen(false);
        setReactOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const meetingUrl = `${window.location.origin}/meet/${roomId}?name=${encodeURIComponent(
    name
  )}`;

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch (e) {
      prompt("Copy this link:", text);
    }
  };

  const togglePanel = (panel) => {
    if (typeof onOpenPanel === "function")
      onOpenPanel((prev) => (prev === panel ? null : panel));
  };

  const handleRecordingToggle = () => {
    if (isRecording) onStopRecording && onStopRecording();
    else onStartRecording && onStartRecording();
    setMoreOpen(false);
  };

  // Compact Teams-like button style
  const btnStyle = {
    display: "inline-flex",
    gap: 8,
    alignItems: "center",
    padding: "8px 12px",
    borderRadius: 10,
    border: "1px solid rgba(2,8,20,0.06)",
    background: "#fff",
    color: "#0b2b4a",
    cursor: "pointer",
    boxShadow: "0 2px 8px rgba(2,8,20,0.04)",
  };

  return (
    <>
      <div
        className="premium-toolbar toolbar-bar"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 2000,
          background: "#fff",
          borderBottom: "1px solid rgba(2,8,20,0.04)",
        }}
      >
        <div
          style={{
            maxWidth: 1300,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            padding: "10px 16px",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <div style={{ fontWeight: 800, color: "#0b2b4a", fontSize: 20 }}>
                Premium Meet
              </div>
              <div style={{ fontSize: 12, color: "#60748a" }}>
                Room:{" "}
                <span
                  style={{
                    background: "#eaf3ff",
                    color: "#0b2b4a",
                    padding: "4px 8px",
                    borderRadius: 8,
                    fontWeight: 700,
                    marginLeft: 6,
                    display: "inline-block",
                  }}
                >
                  {roomId || "(no id)"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginLeft: 12 }}>
              <button
                onClick={() => copy(meetingUrl)}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(2,8,20,0.06)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Copy invite
              </button>
              <button
                onClick={() => onShareLink && onShareLink()}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(2,8,20,0.06)",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Share link
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="toolbar-item"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              onClick={() => togglePanel("chat")}
            >
              <IconChat size={18} /> <span className="tool-label">Chat</span>
            </button>
            <button
              className="toolbar-item"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              onClick={() => togglePanel("people")}
            >
              <IconPeople size={18} /> <span className="tool-label">People</span>
            </button>
            <button
              className="toolbar-item"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              onClick={() => onRaise && onRaise()}
            >
              <IconHand size={18} /> <span className="tool-label">Raise</span>
            </button>
            <div style={{ position: "relative" }}>
              <button
                className="toolbar-item"
                style={{ background: "transparent", border: "none", cursor: "pointer" }}
                onClick={() => setReactOpen((r) => !r)}
                aria-expanded={reactOpen}
              >
                <IconEmoji size={18} /> <span className="tool-label">React</span>
              </button>
              {reactOpen && (
                <div
                  className="react-popup"
                  style={{
                    position: "absolute",
                    top: 36,
                    left: 0,
                    background: "#fff",
                    padding: 8,
                    borderRadius: 8,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
                    zIndex: 2200,
                  }}
                >
                  {["👍", "👏", "❤️", "😮", "😂"].map((e) => (
                    <button
                      key={e}
                      onClick={() => {
                        onReact && onReact(e);
                        setReactOpen(false);
                      }}
                      style={{ fontSize: 18, padding: 6, margin: 4, background: "transparent", border: "none" }}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => onToggleCam && onToggleCam()}
                style={{ ...btnStyle, background: camOn ? "#fff" : "transparent" }}
                title={camOn ? "Turn camera off" : "Turn camera on"}
              >
                <IconCam size={18} active={camOn} />
              </button>

              <button
                onClick={() => onToggleMic && onToggleMic()}
                style={{ ...btnStyle, background: micOn ? "#fff" : "transparent" }}
                title={micOn ? "Mute" : "Unmute"}
              >
                <IconMic size={18} muted={!micOn} />
              </button>

              <button onClick={() => onScreenShare && onScreenShare()} style={btnStyle} title="Share screen">
                <IconShare size={18} />
              </button>
            </div>

            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMoreOpen((s) => !s)}
                style={{ ...btnStyle, padding: "8px 10px" }}
                title="More options"
              >
                <IconMore size={18} />
              </button>

              {moreOpen && (
                <div
                  className="more-popup"
                  role="menu"
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 42,
                    width: 300,
                    background: "#fff",
                    borderRadius: 10,
                    padding: 12,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                    zIndex: 2200,
                  }}
                  onMouseLeave={() => setMoreOpen(false)}
                >
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button
                      className={`host-action ${isRecording ? "danger" : ""}`}
                      onClick={handleRecordingToggle}
                      style={{ padding: 8, borderRadius: 8, border: "none", textAlign: "left", background: "transparent", cursor: "pointer" }}
                    >
                      {isRecording ? (
                        <>
                          <IconStop size={16} /> Stop Recording ({formatRecordingTime(recordingTime)})
                        </>
                      ) : (
                        <>
                          <IconRecord size={16} /> Start Recording
                        </>
                      )}
                    </button>

                    <button
                      className="host-action"
                      onClick={() => {
                        setMoreOpen(false);
                        alert("Meeting info");
                      }}
                      style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", textAlign: "left", cursor: "pointer" }}
                    >
                      Meeting info
                    </button>

                    <button
                      className="host-action"
                      onClick={() => {
                        setMoreOpen(false);
                        onOpenPanel && onOpenPanel("settings");
                      }}
                      style={{ padding: 8, borderRadius: 8, border: "none", background: "transparent", textAlign: "left", cursor: "pointer" }}
                    >
                      Settings
                    </button>

                    <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "8px 0" }} />

                    {/* live captions control (controlled props) */}
                    <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={!!liveCcEnabled}
                        onChange={(e) => onToggleLiveCc && onToggleLiveCc(e.target.checked)}
                      />
                      <span>Live captions</span>
                    </label>

                    <div style={{ marginTop: 6 }}>
                      <label style={{ fontSize: 12, color: "#444" }}>Language</label>
                      <div style={{ marginTop: 6 }}>
                        <select
                          value={liveCcLang}
                          onChange={(e) => onChangeLiveCcLang && onChangeLiveCcLang(e.target.value)}
                          style={{ width: "100%", padding: 8, borderRadius: 8 }}
                        >
                          {LANGS.map((l) => (
                            <option key={l.code} value={l.code}>
                              {l.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ height: 1, background: "rgba(0,0,0,0.06)", margin: "8px 0" }} />

                    {/* leave/end controls in menu as well */}
                    {isHost ? (
                      <button
                        onClick={() => {
                          setMoreOpen(false);
                          setEndModalOpen(true);
                        }}
                        className="host-action danger"
                        style={{ padding: 8, borderRadius: 8, background: "#ffebeb", color: "#c0392b", border: "none", cursor: "pointer", textAlign: "left" }}
                      >
                        End meeting (host)
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setMoreOpen(false);
                          onLeave && onLeave();
                        }}
                        className="host-action"
                        style={{ padding: 8, borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}
                      >
                        Leave meeting
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Host gets "End", others get "Leave" as primary button */}
            {isHost ? (
              <button
                className="tool-btn leave host-leave"
                onClick={() => setEndModalOpen(true)}
                title="End meeting"
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "linear-gradient(180deg,#ff6b6b,#ff3b3b)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <IconEnd size={16} />
                <span className="tool-label" style={{ marginLeft: 8 }}>
                  End
                </span>
              </button>
            ) : (
              <button
                className="tool-btn leave"
                onClick={onLeave}
                title="Leave"
                style={{
                  padding: "8px 12px",
                  borderRadius: 10,
                  background: "transparent",
                  color: "#c0392b",
                  border: "1px solid rgba(192,57,43,0.08)",
                  cursor: "pointer",
                }}
              >
                <IconLeave size={16} />
                <span className="tool-label" style={{ marginLeft: 8 }}>
                  Leave
                </span>
              </button>
            )}
          </div>

          {/* Floating REC badge - moved upward so it doesn't overlap right controls */}
          {isRecording && (
            <div
              className="recording-indicator"
              style={{
                position: "absolute",
                left: "50%",
                top: -36,            // moved further up so it won't cover the right buttons
                transform: "translateX(-50%)",
                zIndex: 2100,
                background: "rgba(255,255,255,0.95)",
                borderRadius: 12,
                padding: "6px 10px",
                display: "flex",
                gap: 8,
                alignItems: "center",
                boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
                pointerEvents: "none",
              }}
              aria-live="polite"
            >
              <div
                className="recording-dot"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#ff3b30",
                  boxShadow: "0 0 8px rgba(255,59,48,0.6)",
                }}
              />
              <div style={{ fontWeight: 700, color: "#c0392b" }}>REC {formatRecordingTime(recordingTime)}</div>
            </div>
          )}
        </div>
      </div>

      {/* End modal */}
      {endModalOpen && (
        <div
          className="invite-modal-backdrop overlay-center"
          onClick={() => setEndModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
          }}
        >
          <div
            className="invite-modal"
            style={{
              width: 520,
              background: "#071727",
              color: "#e7f6ff",
              borderRadius: 10,
              padding: 18,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{isHost ? "End meeting for everyone" : "Leave meeting"}</h3>
              <button className="icon-btn" onClick={() => setEndModalOpen(false)} style={{ background: "transparent", border: "none", color: "#fff" }}>
                ✕
              </button>
            </div>

            <div style={{ marginTop: 12, color: "#ddd" }}>
              {isHost ? (
                <p>Ending the meeting will remove all participants and close the room.</p>
              ) : (
                <p>Are you sure you want to leave the meeting?</p>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
              <button className="btn-secondary" onClick={() => setEndModalOpen(false)} style={{ padding: 8, borderRadius: 8 }}>
                Cancel
              </button>
              <button
                className="btn-danger"
                onClick={() => {
                  setEndModalOpen(false);
                  if (isHost && typeof onEndMeeting === "function") onEndMeeting();
                  else onLeave();
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 8,
                  background: isHost ? "linear-gradient(180deg,#ff6b6b,#ff3b3b)" : "#fff",
                  color: isHost ? "#fff" : "#0b2b4a",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {isHost ? "End meeting" : "Leave"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
