// src/components/LiveCaptionBar.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/live-caption.css";

/*
 Props expected:
  - captions: [{ id?, text, translations?, from, time, __final }]
  - visible: bool
  - selectedLang: "en-US" | "te" | "te-IN" etc (we use short part like 'te')
  - maxLines: number
*/

export default function LiveCaptionBar({
  captions = [],
  visible = true,
  selectedLang = "en-US",
  maxLines = 6
}) {
  const boxRef = useRef(null);
  const [expanded, setExpanded] = useState(new Set());
  const TRUNCATE_CHARS = 140;

  // normalize language key: 'te' from 'te' or 'te-IN' or 'te-IN'
  const langShort = (selectedLang || "en-US").split("-")[0];

  // pick the best text for a caption item based on translations + fallback to text
  const pickText = (c) => {
    if (!c) return "";
    // translations may be an object with keys like 'te' or 'te-IN'
    if (c.translations && typeof c.translations === "object") {
      if (langShort && c.translations[langShort]) return c.translations[langShort];
      if (selectedLang && c.translations[selectedLang]) return c.translations[selectedLang];
      // fallback to first available translation if no exact match
      const keys = Object.keys(c.translations);
      if (keys.length > 0 && c.translations[keys[0]]) return c.translations[keys[0]];
    }
    return c.text || "";
  };

  // Build displayItems from incoming captions:
  // - Replace interim entries from same speaker
  // - Replace previous final if new final is incremental (prefix case)
  // - Keep last `maxLines` items
  const displayItems = useMemo(() => {
    const items = [];
    const makeId = (c, idx) => c.id || `${c.from || "speaker"}-${c.time || Date.now()}-${idx}`;

    for (let i = 0; i < captions.length; i++) {
      const c = captions[i];
      const text = (pickText(c) || "").trim();
      if (!text) continue;

      const entry = { id: makeId(c, i), from: c.from || "Speaker", time: c.time || Date.now(), text, __final: !!c.__final };

      if (items.length === 0) {
        items.push(entry);
        continue;
      }

      const last = items[items.length - 1];

      // case: same speaker, last is interim -> update/replace it
      if (!last.__final && last.from === entry.from) {
        last.text = entry.text;
        last.time = entry.time;
        last.id = entry.id;
        if (entry.__final) last.__final = true;
        continue;
      }

      // case: new is final and previous final for same speaker is prefix of new final -> replace previous final
      if (entry.__final && last.__final && last.from === entry.from) {
        const prevText = (last.text || "").trim();
        if (prevText && entry.text.startsWith(prevText)) {
          last.text = entry.text;
          last.time = entry.time;
          last.id = entry.id;
          last.__final = true;
          continue;
        }
      }

      // default: push new entry
      items.push(entry);
    }

    if (items.length > maxLines) return items.slice(items.length - maxLines);
    return items;
  }, [captions, selectedLang, maxLines]); // recompute when captions or language changes

  // auto-scroll to bottom when items change
  useEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    try { box.scrollTo({ top: box.scrollHeight, behavior: "smooth" }); }
    catch (e) { box.scrollTop = box.scrollHeight; }
  }, [displayItems.length]);

  if (!visible) return null;

  const isExpanded = (id) => expanded.has(id);
  const toggleExpand = (id) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const formatTime = (ts) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch { return ""; }
  };

  return (
    <div className="live-cc-container" role="region" aria-label="Live captions">
      <div className="live-cc-inner">
        <div className="live-cc-header">
          <div className="live-cc-title">Captions</div>
          <div className="live-cc-note">Live — {langShort.toUpperCase()}</div>
        </div>

        <div className="live-cc-box" ref={boxRef} tabIndex={0}>
          {displayItems.length === 0 && (
            <div className="live-cc-empty">No captions yet — enable live captions to start</div>
          )}

          {displayItems.map(it => {
            const long = it.text && it.text.length > TRUNCATE_CHARS;
            const truncated = long && !isExpanded(it.id);
            return (
              <div
                key={it.id}
                className={`live-cc-entry ${it.__final ? "final" : "interim"}`}
                aria-live={it.__final ? "polite" : "assertive"}
              >
                <div className="live-cc-left">
                  <div className="live-cc-avatar" aria-hidden>
                    {(it.from || "S").toString().slice(0,1).toUpperCase()}
                  </div>
                </div>

                <div className="live-cc-body">
                  <div className="live-cc-meta">
                    <span className="live-cc-speaker">{it.from || "Speaker"}</span>
                    {it.time && <span className="live-cc-time">{formatTime(it.time)}</span>}
                  </div>

                  <div className="live-cc-text">
                    {truncated ? it.text.slice(0, TRUNCATE_CHARS) + "…" : it.text}
                    {!it.__final && !truncated && <span className="live-cc-pulse" aria-hidden />}
                  </div>

                  {long && (
                    <div style={{ marginTop: 6 }}>
                      <button
                        onClick={() => toggleExpand(it.id)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "rgba(255,255,255,0.75)",
                          cursor: "pointer",
                          padding: 0,
                          fontSize: 13,
                          textDecoration: "underline"
                        }}
                        aria-expanded={isExpanded(it.id)}
                      >
                        {isExpanded(it.id) ? "Collapse" : "Expand"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
