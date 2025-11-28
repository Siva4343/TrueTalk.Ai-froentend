// src/components/Toolbar.jsx
import React, { useState } from "react";
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

export default function Toolbar({
  roomId = "",
  name = "Guest",
  onOpenPanel = () => {},
  onToggleCam = () => {},
  onToggleMic = () => {},
  onShare = () => {},
  onLeave = () => {},
  onRaise = () => {},
  onReact = () => {},

  isHost = false,
  onEndMeeting = null,
  camOn = true,
  micOn = true,
  // Recording props
  onStartRecording = () => {},
  onStopRecording = () => {},
  isRecording = false,
  recordingTime = 0,
  // Live Captions props
  onToggleLiveCaptions = () => {},
  liveCaptionsEnabled = false,
  isCaptionsActive = false,
}) {
  const [reactOpen, setReactOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [endModalOpen, setEndModalOpen] = useState(false);
  
  // Format recording time (HH:MM:SS)
  const formatRecordingTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const meetingUrl = `${window.location.origin}/meet/${roomId}?name=${encodeURIComponent(name)}`;

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard");
    } catch {
      prompt("Copy this link:", text);
    }
  };

  const togglePanel = (panel) => {
    onOpenPanel((prev) => (prev === panel ? null : panel));
  };

  const handleCamClick = () => {
    try {
      if (typeof onToggleCam === "function") onToggleCam();
    } catch (error) {
      console.error("Error toggling camera:", error);
    }
  };

  const handleMicClick = () => {
    try {
      if (typeof onToggleMic === "function") onToggleMic();
    } catch (error) {
      console.error("Error toggling mic:", error);
    }
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      onStopRecording && onStopRecording();
    } else {
      onStartRecording && onStartRecording();
    }
    setMoreOpen(false);
  };

  const handleLiveCaptionsToggle = () => {
    onToggleLiveCaptions && onToggleLiveCaptions();
    setMoreOpen(false);
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
            <button className="icon-text-btn" onClick={() => copy(meetingUrl)} title="Copy invite">
              Copy invite
            </button>

            <button className="icon-text-btn" onClick={() => setInviteOpen(true)} title="Share link">
              Share link
            </button>

            {/* Recording indicator - only show when recording */}
            {isRecording && (
              <div className="recording-indicator">
                <div className="recording-dot"></div>
                <span style={{ 
                  color: '#ff3b30', 
                  fontSize: '13px', 
                  fontWeight: '600' 
                }}>
                  REC {formatRecordingTime(recordingTime)}
                </span>
              </div>
            )}

            {/* Live Captions indicator */}
            {liveCaptionsEnabled && (
              <div className="captions-indicator">
                <div className={`captions-dot ${isCaptionsActive ? 'active' : ''}`}></div>
                <span style={{ 
                  color: '#4cd964', 
                  fontSize: '13px', 
                  fontWeight: '600' 
                }}>
                  CC {isCaptionsActive ? 'LIVE' : 'PAUSED'}
                </span>
              </div>
            )}

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
                        onClick={() => {
                          onReact && onReact(e);
                          setReactOpen(false);
                        }}
                        aria-label={`React ${e}`}
                      >
                        {e}
                      </button>
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
          <button className={`tool-btn ${camOn ? "" : "off"}`} onClick={handleCamClick} title={camOn ? "Turn camera off" : "Turn camera on"}>
            <IconCam size={18} active={camOn} /> <span className="tool-label">Camera</span>
          </button>

          <button className={`tool-btn ${micOn ? "" : "off"}`} onClick={handleMicClick} title={micOn ? "Mute" : "Unmute"}>
            <IconMic size={18} muted={!micOn} /> <span className="tool-label">Mic</span>
          </button>

          <button className="tool-btn" onClick={() => onShare && onShare()} title="Share screen">
            <IconShare size={18} /> <span className="tool-label">Share</span>
          </button>

          <div className="more-container" style={{ position: "relative" }}>
            <button className="tool-btn" onClick={() => setMoreOpen((s) => !s)} title="More options">
              <IconMore size={18} /> <span className="tool-label">More</span>
            </button>

            {moreOpen && (
              <div className="more-popup" role="menu" onMouseLeave={() => setMoreOpen(false)}>
                {/* Recording control */}
                <button 
                  className={`host-action ${isRecording ? 'danger' : ''}`} 
                  onClick={handleRecordingToggle}
                >
                  {isRecording ? (
                    <>
                      <IconStop size={16} />
                      Stop Recording ({formatRecordingTime(recordingTime)})
                    </>
                  ) : (
                    <>
                      <IconRecord size={16} />
                      Start Recording
                    </>
                  )}
                </button>

                {/* Live Captions control */}
                <button 
                  className={`host-action ${liveCaptionsEnabled ? 'active' : ''}`} 
                  onClick={handleLiveCaptionsToggle}
                >
                  {liveCaptionsEnabled ? (
                    <>
                      📝 Stop Live Captions
                    </>
                  ) : (
                    <>
                      📝 Start Live Captions
                    </>
                  )}
                </button>

                <button className="host-action" onClick={() => { setMoreOpen(false); onOpenPanel("settings"); }}>
                  Settings
                </button>

                {isHost && (
                  <>
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: 8 }} />
                    <button
                      className="host-action danger"
                      onClick={() => {
                        setEndModalOpen(true);
                        setMoreOpen(false);
                      }}
                    >
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

      {/* Invite modal (floating overlay) */}
      {inviteOpen && (
        <div className="invite-modal-backdrop overlay-center" onClick={() => setInviteOpen(false)}>
          <div className="invite-modal" onClick={(e) => e.stopPropagation()}>
            <div className="invite-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>Invite people to this meeting</h3>
              <button className="icon-btn" onClick={() => setInviteOpen(false)} aria-label="Close">✕</button>
            </div>

            <div style={{ marginTop: 12 }}>
              <p style={{ marginTop: 6 }}><strong>Room:</strong> {roomId}</p>
              <div style={{ marginTop: 6 }}>
                <input readOnly value={meetingUrl} onFocus={(e) => e.target.select()} style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #eee" }} />
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={() => { window.open(`https://wa.me/?text=${encodeURIComponent("Join my meeting: " + meetingUrl)}`, "_blank"); }} className="btn-secondary">WhatsApp</button>
                <button onClick={() => window.open(`mailto:?subject=Join meeting&body=${encodeURIComponent(meetingUrl)}`)} className="btn-secondary">Email</button>
                <button onClick={() => copy(meetingUrl)} className="btn-secondary">Copy link</button>
                <button onClick={() => setInviteOpen(false)} className="btn-secondary">Close</button>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <div style={{ width: 220, height: 220, background: "#fff", borderRadius: 8, display: "grid", placeItems: "center" }}>
                  <div style={{ color: "#999" }}>QR preview</div>
                </div>
                <div style={{ flex: 1, color: "#cfe9ff", fontSize: 13 }}>
                  <p>Share this link to let others join the room. Using WhatsApp opens the native web share for mobile users.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* End modal */}
      {endModalOpen && (
        <div className="invite-modal-backdrop overlay-center" onClick={() => setEndModalOpen(false)}>
          <div className="invite-modal" style={{ width: 520 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{isHost ? "End meeting for everyone" : "Leave meeting"}</h3>
              <button className="icon-btn" onClick={() => setEndModalOpen(false)}>✕</button>
            </div>

            <div style={{ marginTop: 12, color: "#ddd" }}>
              {isHost ? (
                <p>Ending the meeting will remove all participants and close the room.</p>
              ) : (
                <p>Are you sure you want to leave the meeting? You can rejoin later using the same link.</p>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
              <button className="btn-secondary" onClick={() => setEndModalOpen(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => {
                setEndModalOpen(false);
                if (isHost && typeof onEndMeeting === "function") {
                  onEndMeeting();
                } else {
                  onLeave();
                }
              }}>{isHost ? "End meeting" : "Leave"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}