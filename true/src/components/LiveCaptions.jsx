import React, { useEffect, useRef, useState } from "react";

// Your WebSocket path
const WS_URL = "ws://localhost:8000/ws/captions/";

export default function LiveCaptions({ speaker }) {
  const [connected, setConnected] = useState(false);
  const [captions, setCaptions] = useState([]);
  const wsRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Connect WebSocket
    const ws = new WebSocket(WS_URL);

    ws.onopen = () => {
      setConnected(true);
      console.log("WebSocket connected");
    };

    ws.onmessage = (e) => {
      let data = JSON.parse(e.data);
      if (data.type === "connected") return;

      setCaptions((prev) => [data, ...prev]);
    };

    ws.onerror = () => setConnected(false);
    ws.onclose = () => setConnected(false);

    wsRef.current = ws;

    // Enable Speech Recognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }

      if (finalText.trim().length > 0) {
        ws.send(
          JSON.stringify({
            type: "transcript",
            text: finalText.trim(),
            speaker,
          })
        );
      }
    };

    recognition.start();
    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
      ws.close();
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto bg-white p-4 rounded shadow">
      <h2 className="text-2xl font-semibold mb-3">🎤 Live Caption Translation</h2>

      <p className="mb-4">
        Status:{" "}
        <span className={connected ? "text-green-600" : "text-red-600"}>
          {connected ? "Connected" : "Disconnected"}
        </span>
      </p>

      <div className="space-y-4">
        {captions.map((c, index) => (
          <div key={index} className="border p-3 rounded bg-gray-50">
            <p className="font-bold text-lg">{c.original}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
              <p><strong>Hindi:</strong> {c.translations.hi}</p>
              <p><strong>Telugu:</strong> {c.translations.te}</p>
              <p><strong>Tamil:</strong> {c.translations.ta}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
