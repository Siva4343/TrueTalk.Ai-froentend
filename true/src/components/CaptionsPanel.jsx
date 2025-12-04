// src/components/CaptionsPanel.jsx
import React, { useEffect } from "react";
import useWebRTC from "../hooks/useWebRTC";
import useLiveCaptions from "../hooks/useLiveCaptions";

export default function CaptionsPanel({ roomId, name }) {
  // if you initialized useWebRTC elsewhere, use that instance or create new here
  const webrtc = useWebRTC(); // or get it from context
  useEffect(() => { webrtc.connect({ roomId, name }); }, [webrtc, roomId, name]);

  const lang = "te"; // selected by user - map to "te" etc.
  const captions = useLiveCaptions(webrtc, { roomId, langCode: lang });

  return (
    <div style={{ position: "absolute", bottom: 24, left: 24, right: 24 }}>
      {/* live bubble area */}
      <div>
        {Object.entries(captions.liveBubbles).map(([speaker, b]) => (
          <div key={speaker} className="live-bubble">
            <strong>{speaker === "me" ? "You" : speaker}:</strong> {b.text}
          </div>
        ))}
      </div>

      {/* history */}
      <div className="caption-history">
        {captions.history.map((h, i) => (
          <div key={i} className="caption-history-line">
            <strong>{h.from}:</strong> {h.text}
          </div>
        ))}
      </div>

      {/* controls */}
      <div>
        {!captions.isRunning ? (
          <button onClick={() => captions.start(lang)}>Start Captions</button>
        ) : (
          <button onClick={() => captions.stop()}>Stop Captions</button>
        )}
      </div>
    </div>
  );
}
