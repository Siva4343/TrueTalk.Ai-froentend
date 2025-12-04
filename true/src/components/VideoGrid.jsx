// src/components/VideoGrid.jsx
import React, { useMemo, useState } from "react";
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
  peerHealth = {}, // object keyed by peerId with { rttMs, packetsLostPct, bitrateKbps, timestamp }
}) {
  // build full tiles list (local + remotes)
  const tilesAll = useMemo(() => {
    const arr = [];
    if (includeLocal && localStream) {
      arr.push({ id: "local", stream: localStream, name: "You", muted: false, isLocal: true });
    }
    (remoteStreams || []).forEach((r) => {
      if (localStream && r.stream && r.stream.id === localStream.id) return;
      arr.push({
        id: r.socketId || r.id,
        socketId: r.socketId || r.id,
        stream: r.stream,
        name: r.name || r.socketId || r.id || "Participant",
        muted: !!r.muted,
        isHost: !!r.isHost,
      });
    });
    return arr;
  }, [includeLocal, localStream, remoteStreams]);

  const total = tilesAll.length;

  // If many participants, show paged 3x3 grid (9 per page)
  const PAGE_SIZE = 9;
  const usePaging = total > PAGE_SIZE;
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // slice tiles for current page when paging enabled
  const visibleTiles = useMemo(() => {
    if (!usePaging) return tilesAll;
    const start = page * PAGE_SIZE;
    return tilesAll.slice(start, start + PAGE_SIZE);
  }, [usePaging, page, tilesAll]);

  // decide columns: if using paging fixed 3 columns; otherwise responsive as before
  const cols = useMemo(() => {
    const count = visibleTiles.length || 1;
    if (usePaging) return 3;
    if (count <= 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 2;
    return 3;
  }, [visibleTiles, usePaging]);

  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: 14,
    alignItems: "stretch",
  };

  // pagination controls handlers
  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(pageCount - 1, p + 1));
  const goPage = (n) => setPage(Math.max(0, Math.min(pageCount - 1, n)));

  return (
    <div className="video-grid-with-pagination" role="region" aria-label="Video grid">
      <div className="teams-grid" style={gridStyle}>
        {visibleTiles.map((t) => (
          <Tile
            key={t.id}
            tile={t}
            raised={raiseHands.has(t.id)}
            isMe={t.id === mySocketId || t.isLocal}
            onClick={() => onTileClick && onTileClick(t.id)}
            fallbackAvatarUrl={fallbackAvatarUrl}
            pinned={pinnedId === t.id}
            peerHealth={peerHealth}
          />
        ))}
      </div>

      {/* Pagination UI (only when many participants) */}
      {usePaging && (
        <div
          className="video-grid-pagination"
          style={{
            marginTop: 14,
            display: "flex",
            gap: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-hidden={false}
        >
          <button
            className="btn btn-outline"
            onClick={goPrev}
            disabled={page <= 0}
            aria-label="Previous page"
            style={{ opacity: page <= 0 ? 0.5 : 1 }}
          >
            ◀
          </button>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {/* show up to 5 page buttons with active indicator; compact when many pages */}
            {Array.from({ length: pageCount }).map((_, i) => {
              // keep pagination compact: show first, last, current-1..current+1
              const show =
                i === 0 ||
                i === pageCount - 1 ||
                (i >= page - 1 && i <= page + 1) ||
                pageCount <= 7;
              if (!show) {
                // render ellipsis once between ranges
                // only render ellipsis when it's the first hidden index after 0 or before last
                const leftEllipsis = i === 1 && page > 2;
                const rightEllipsis = i === pageCount - 2 && page < pageCount - 3;
                if (leftEllipsis || rightEllipsis) {
                  return (
                    <span key={`dots-${i}`} style={{ padding: "6px 8px", color: "#cbd9ee" }}>
                      …
                    </span>
                  );
                }
                return null;
              }
              return (
                <button
                  key={`pg-${i}`}
                  onClick={() => goPage(i)}
                  aria-current={i === page ? "true" : "false"}
                  className={`btn ${i === page ? "btn-primary" : "btn-outline"}`}
                  style={{ minWidth: 40, padding: "6px 10px" }}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button
            className="btn btn-outline"
            onClick={goNext}
            disabled={page >= pageCount - 1}
            aria-label="Next page"
            style={{ opacity: page >= pageCount - 1 ? 0.5 : 1 }}
          >
            ▶
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- Tile component ---------- */

function Tile({ tile = {}, raised = false, isMe = false, onClick = () => {}, fallbackAvatarUrl, pinned = false, peerHealth = {} }) {
  const { id, stream, name, muted, isHost, isLocal } = tile;
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    if (!videoRef.current) return;
    if (stream && typeof stream === "object") {
      try {
        if (videoRef.current.srcObject !== stream) {
          videoRef.current.srcObject = stream;
        }
        // try to play (promise may reject if autoplay blocked)
        videoRef.current.play && videoRef.current.play().catch(() => {});
      } catch (e) {
        // ignore attach errors
      }
    } else {
      // no stream -> unset srcObject to allow fallback avatar
      try {
        if (videoRef.current.srcObject) videoRef.current.srcObject = null;
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

  // health lookup
  const health = peerHealth && (peerHealth[id] || peerHealth[id.socketId] || peerHealth[id.id]) ? peerHealth[id] || peerHealth[id.socketId] || peerHealth[id.id] : null;

  const healthText = (() => {
    if (!health) return null;
    const parts = [];
    if (typeof health.rttMs === "number") parts.push(`${Math.round(health.rttMs)}ms`);
    if (typeof health.packetsLostPct === "number") parts.push(`${Math.round(health.packetsLostPct)}% loss`);
    if (parts.length === 0 && typeof health.bitrateKbps === "number") parts.push(`${Math.round(health.bitrateKbps)} kbps`);
    return parts.join(" · ");
  })();

  const badgeColor = (() => {
    if (!health) return "rgba(0,0,0,0.5)";
    if ((health.rttMs && health.rttMs > 400) || (typeof health.packetsLostPct === "number" && health.packetsLostPct > 5)) return "#ff6b6b";
    if ((health.rttMs && health.rttMs > 200) || (typeof health.packetsLostPct === "number" && health.packetsLostPct > 2)) return "#ffb36b";
    return "#55c47a";
  })();

  return (
    <div
      className={`teams-tile ${isHost ? "host-tile" : ""} ${isMe ? "me-tile" : ""} ${pinned ? "pinned" : ""}`}
      onClick={onClick}
      style={{
        background: "linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.08))",
        position: "relative",
        overflow: "hidden",
        minHeight: 140,
        borderRadius: 12,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.02)",
        cursor: "pointer",
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onClick(); }}
      aria-label={`${name} ${isMe ? "(you)" : ""}`}
    >
      {stream ? (
        <video
          ref={videoRef}
          className="teams-video"
          autoPlay
          playsInline
          muted={!!isLocal || false}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div className="teams-avatar-wrapper" style={{ display: "grid", placeItems: "center", height: "100%", padding: 18 }}>
          {fallbackAvatarUrl ? (
            <img src={fallbackAvatarUrl} alt={name || "avatar"} className="teams-avatar-img" style={{ width: 64, height: 64, borderRadius: 12 }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : (
            <div className="teams-avatar" style={{ fontSize: 28, fontWeight: 700 }}>{initials}</div>
          )}
        </div>
      )}

      {/* health badge */}
      {healthText && (
        <div style={{
          position: "absolute",
          left: 8,
          top: 8,
          zIndex: 20,
          padding: "6px 8px",
          borderRadius: 8,
          background: "rgba(0,0,0,0.55)",
          color: "#fff",
          fontSize: 12,
          fontWeight: 700,
          backdropFilter: "blur(4px)",
          pointerEvents: "none",
          boxShadow: "0 6px 14px rgba(0,0,0,0.25)"
        }}>
          <span style={{ display: "inline-block", marginRight: 8, background: badgeColor, width: 8, height: 8, borderRadius: 8 }} />
          <span style={{ fontWeight: 700, fontSize: 12 }}>{healthText}</span>
        </div>
      )}

      <div className="teams-footer" style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, background: "linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.35))" }}>
        <div className="teams-footer-left" style={{ display: "flex", alignItems: "center", gap: 8, pointerEvents: "auto", color: "#fff" }}>
          <span className="teams-name" style={{ fontWeight: 700 }}>{name}</span>
          <span className="teams-video-indicator" title={stream ? "Camera On" : "Camera Off"} style={{ display: "inline-flex", alignItems: "center", marginLeft: 8 }}>
            <IconCam size={14} active={!!stream} />
          </span>
          <span className="teams-audio-indicator" title={muted ? "Muted" : "Unmuted"} style={{ display: "inline-flex", alignItems: "center", marginLeft: 8 }}>
            <IconMic size={14} muted={!!muted} />
          </span>
        </div>

        {raised && <span className="teams-raise" style={{ color: "#ffd56b", fontWeight: 800 }}>✋</span>}
      </div>
    </div>
  );
}
