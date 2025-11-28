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
} from "./icons";

const LANGS = [
  { code: "en-US", label: "English (US)" },
  { code: "en-GB", label: "English (UK)" },
  { code: "en-IN", label: "English (India)" },

  // Indian languages (10)
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

  // NEW props for Live CC + Recording
  liveCcEnabled = false,
  onToggleLiveCc = () => {},
  liveCcLang = "en-US",
  onChangeLiveCcLang = () => {},
  recording = false,
  onToggleRecord = () => {},
  recordingTime = 0, // seconds
}) {
  const [reactOpen, setReactOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);

  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") { setMoreOpen(false); setReactOpen(false); } }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const meetingUrl = `${window.location.origin}/meet/${roomId}?name=${encodeURIComponent(name)}`;

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch (e) {
      prompt("Copy this link:", text);
    }
  };

  const togglePanel = (panel) => {
    if (typeof onOpenPanel === "function") onOpenPanel((prev) => (prev === panel ? null : panel));
  };

  const formatTime = (sec) => {
    if (!sec || sec <= 0) return "00:00";
    const s = Math.floor(sec % 60).toString().padStart(2, "0");
    const m = Math.floor((sec / 60) % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <>
      <div className="premium-toolbar toolbar-bar" style={{ position: "sticky", top: 0, zIndex: 1000 }}>
        <div className="toolbar-left">
          <div className="brand">
            <div className="brand-title">Premium Meet</div>
            <div className="brand-room">Room: <span className="room-badge">{roomId || "(no id)"}</span></div>
          </div>

          <div className="toolbar-actions-left">
            <button className="icon-text-btn" onClick={() => copy(meetingUrl)} title="Copy invite">Copy invite</button>

            <button className="icon-text-btn" onClick={() => onShareLink && onShareLink()} title="Share link">Share link</button>

            <nav className="toolbar-nav">
              <button className="toolbar-item" onClick={() => togglePanel("chat")} title="Chat">
                <IconChat size={18} /> <span className="tool-label">Chat</span>
              </button>

              <button className="toolbar-item" onClick={() => togglePanel("people")} title="People">
                <IconPeople size={18} /> <span className="tool-label">People</span>
              </button>

              <button className="toolbar-item" onClick={() => onRaise && onRaise()} title="Raise hand">
                <IconHand size={18} /> <span className="tool-label">Raise</span>
              </button>

              <div className="react-container" style={{ position: "relative" }}>
                <button
                  className="toolbar-item"
                  aria-expanded={reactOpen}
                  onClick={() => setReactOpen((r) => !r)}
                  title="React"
                >
                  <IconEmoji size={18} /> <span className="tool-label">React</span>
                </button>

                {reactOpen && (
                  <div className="react-popup">
                    {["👍", "👏", "❤️", "😮", "😂"].map((e) => (
                      <button
                        key={e}
                        className="react-emoji"
                        onClick={() => { onReact && onReact(e); setReactOpen(false); }}
                        aria-label={`React ${e}`}
                      >{e}</button>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>
        </div>

        <div className="toolbar-center">
          <div className="toolbar-meter" aria-hidden="true" />
        </div>

        <div className="toolbar-right">
          <button className={`tool-btn ${camOn ? "" : "off"}`} onClick={() => onToggleCam && onToggleCam()} title={camOn ? "Turn camera off" : "Turn camera on"}>
            <IconCam size={18} active={camOn} /> <span className="tool-label">Camera</span>
          </button>

          <button className={`tool-btn ${micOn ? "" : "off"}`} onClick={() => onToggleMic && onToggleMic()} title={micOn ? "Mute" : "Unmute"}>
            <IconMic size={18} muted={!micOn} /> <span className="tool-label">Mic</span>
          </button>

          <button className="tool-btn" onClick={() => onScreenShare && onScreenShare()} title="Share screen">
            <IconShare size={18} /> <span className="tool-label">Share</span>
          </button>

          <div className="more-container" style={{ position: "relative" }}>
            <button className="tool-btn" onClick={() => setMoreOpen((s) => !s)} title="More options">
              <IconMore size={18} /> <span className="tool-label">More</span>
            </button>

            {moreOpen && (
              <div className="more-popup" role="menu" onMouseLeave={() => setMoreOpen(false)}>
                <button className="host-action" onClick={() => { setMoreOpen(false); alert("Meeting info"); }}>
                  Meeting info
                </button>

                <button className="host-action" onClick={() => { setMoreOpen(false); onOpenPanel && onOpenPanel("settings"); }}>
                  Settings
                </button>

                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 8 }} />

                {/* LIVE CAPTIONS */}
                <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="checkbox" checked={liveCcEnabled} onChange={(e) => onToggleLiveCc && onToggleLiveCc(e.target.checked)} />
                    <span>Live captions</span>
                  </label>

                  <div>
                    <label style={{ fontSize: 12, color: "#444" }}>Language</label>
                    <div>
                      <select value={liveCcLang} onChange={(e) => onChangeLiveCcLang && onChangeLiveCcLang(e.target.value)} style={{ width: 220, padding: 6, borderRadius: 6 }}>
                        {LANGS.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 8 }} />

                {/* RECORDING */}
                <div style={{ padding: 8, display: "flex", gap: 8, alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button
                      className={`host-action ${recording ? "danger" : ""}`}
                      onClick={() => { onToggleRecord && onToggleRecord(!recording); }}
                    >
                      {recording ? "Stop recording" : "Record meeting"}
                    </button>

                    {recording && <div style={{ fontSize: 13, color: "#333" }}>● {formatTime(recordingTime)}</div>}
                  </div>
                  <div style={{ fontSize: 12, color: "#777" }}>Local recording (webm)</div>
                </div>

                <div style={{ borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 8 }} />

                {isHost && (
                  <>
                    <button className="host-action danger" onClick={() => { setMoreOpen(false); setEndModalOpen(true); }}>
                      End meeting (host)
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {isHost ? (
            <button className="tool-btn leave host-leave" onClick={() => setEndModalOpen(true)} title="End meeting / leave">
              <IconEnd size={18} /> <span className="tool-label">End</span>
            </button>
          ) : (
            <button className="tool-btn leave" onClick={onLeave} title="Leave">
              <IconLeave size={18} /> <span className="tool-label">Leave</span>
            </button>
          )}
        </div>
      </div>

      {/* End modal */}
      {endModalOpen && (
        <div className="invite-modal-backdrop overlay-center" onClick={() => setEndModalOpen(false)}>
          <div className="invite-modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{isHost ? "End meeting for everyone" : "Leave meeting"}</h3>
              <button className="icon-btn" onClick={() => setEndModalOpen(false)}>✕</button>
            </div>

            <div style={{ marginTop: 12, color: "#ddd" }}>
              {isHost ? <p>Ending the meeting will remove all participants and close the room.</p> : <p>Are you sure you want to leave the meeting?</p>}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
              <button className="btn-secondary" onClick={() => setEndModalOpen(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => {
                setEndModalOpen(false);
                if (isHost && typeof onEndMeeting === "function") onEndMeeting();
                else onLeave();
              }}>{isHost ? "End meeting" : "Leave"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
