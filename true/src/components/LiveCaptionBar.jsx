// src/components/LiveCaptionBar.jsx
import React from "react";

/**
 * LiveCaptionBar
 * Props:
 *  - captions: array of { text, from, time }
 *  - visible: boolean
 *  - maxLines: number (optional, default 2)
 */
export default function LiveCaptionBar({ captions = [], visible = false, maxLines = 2 }) {
  if (!visible || !Array.isArray(captions) || captions.length === 0) return null;

  // take the last `maxLines` captions
  const items = captions.slice(-maxLines);

  return (
    <div className="live-caption-bar" aria-live="polite" aria-atomic="true">
      <div className="live-caption-inner">
        {items.map((c, idx) => (
          <div key={c.time || idx} className="live-caption-line">
            <span className="live-caption-speaker">{c.from}:</span>
            <span className="live-caption-text">{c.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
