// src/components/VideoGrid.jsx
import React from "react";
import { IconMic, IconCam } from "./icons.jsx";

export default function VideoGrid({
  localStream,
  remoteStreams = [],
  includeLocal = false,
  mySocketId,
  pinnedId = null,
  raiseHands = new Set(),
  onTileClick = () => {},
  fallbackAvatarUrl = "/favicon.ico",
}) {
  const tilesAll = [];

  if (includeLocal && localStream) {
    tilesAll.push({ id: "local", stream: localStream, name: "You", muted: false, isLocal: true });
  }

  (remoteStreams || []).forEach((r) => {
    if (localStream && r.stream && r.stream.id === localStream.id) return;
    tilesAll.push({
      id: r.socketId || r.id,
      stream: r.stream,
      name: r.name || r.socketId || r.id || "Participant",
      muted: !!r.muted,
      isHost: !!r.isHost,
    });
  });

  const count = Math.max(tilesAll.length, 1);
  let cols = 3;
  if (count <= 1) cols = 1;
  else if (count === 2) cols = 2;
  else if (count <= 4) cols = 2;
  else cols = 3;

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: 14,
    alignItems: "stretch",
  };

  return (
    <div className="video-grid-with-pagination" role="grid">
      <div className="teams-grid" style={gridStyle}>
        {tilesAll.map((t) => (
          <Tile
            key={t.id}
            tile={t}
            raised={raiseHands.has(t.id)}
            isMe={t.id === mySocketId || t.isLocal}
            onClick={() => onTileClick && onTileClick(t.id)}
            fallbackAvatarUrl={fallbackAvatarUrl}
            pinned={pinnedId === t.id}
          />
        ))}
      </div>
    </div>
  );
}

function Tile({ tile = {}, raised = false, isMe = false, onClick = () => {}, fallbackAvatarUrl, pinned = false }) {
  const { id, stream, name, muted, isHost } = tile;
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    if (!videoRef.current) return;
    if (stream && typeof stream === "object") {
      try {
        videoRef.current.srcObject = stream;
      } catch (e) {}
    }
  }, [stream]);

  const initials = (name || "")
    .split(" ")
    .map((p) => p && p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  return (
    <div
      className={`teams-tile ${isHost ? "host-tile" : ""} ${isMe ? "me-tile" : ""} ${pinned ? "pinned" : ""}`}
      onClick={onClick}
      style={{ background: "transparent" }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
      aria-label={`${name} ${isMe ? "(you)" : ""}`}
    >
      {stream ? (
        <video ref={videoRef} className="teams-video" autoPlay playsInline muted={!!tile.isLocal || false} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div className="teams-avatar-wrapper" style={{ display: "grid", placeItems: "center", height: "100%" }}>
          {fallbackAvatarUrl ? (
            <img src={fallbackAvatarUrl} alt={name || "avatar"} className="teams-avatar-img" onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : (
            <div className="teams-avatar" style={{ fontSize: 28, fontWeight: 700 }}>{initials}</div>
          )}
        </div>
      )}

      <div className="teams-footer">
        <div className="teams-footer-left" style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto" }}>
          <span className="teams-name">{name}</span>
          <span className="teams-video-indicator" title={stream ? "Camera On" : "Camera Off"} style={{ display: "inline-flex", alignItems: "center", marginLeft: 8 }}>
            <IconCam size={14} active={!!stream} />
          </span>
          <span className="teams-audio-indicator" title={muted ? "Muted" : "Unmuted"} style={{ display: "inline-flex", alignItems: "center", marginLeft: 8 }}>
            <IconMic size={14} muted={!!muted} />
          </span>
        </div>

        {raised && <span className="teams-raise">✋</span>}
      </div>
    </div>
  );
}
