// src/hooks/useLiveCaptions.js
import { useEffect, useRef, useState } from "react";

/**
 * useLiveCaptions
 * - webrtc: the object returned by useWebRTC()
 * - opts: { roomId, langCode }  langCode: "te" or "hi" etc. (short code). We map to recognition tags.
 */
export default function useLiveCaptions(webrtc, opts = { roomId: null, langCode: "en" }) {
  const { roomId } = opts;
  const recognitionRef = useRef(null);
  const [isRunning, setIsRunning] = useState(false);

  // history (final-only captions), and current live bubble map by speaker
  const [history, setHistory] = useState([]); // [{ from, text, time }]
  const [liveBubbles, setLiveBubbles] = useState({}); // { speakerId: { text, isFinal } }

  // map short code to Web Speech API lang tag
  const LANG_MAP = {
    en: "en-US",
    hi: "hi-IN",
    te: "te-IN",
    ta: "ta-IN",
    kn: "kn-IN",
    ml: "ml-IN",
    mr: "mr-IN",
    gu: "gu-IN",
    bn: "bn-IN",
    pa: "pa-IN",
    or: "or-IN",
  };

  // helper to send caption message via webrtc hook
  function sendCaption(text, isFinal = false) {
    if (!webrtc || !webrtc.sendChatMessage) return;
    const payload = { type: "caption", text, from: webrtc.wsRef?.current?.socketId || null, time: Date.now(), isFinal };
    // your sendChatMessage expects (roomId, payload)
    try { webrtc.sendChatMessage(roomId, payload); } catch (e) { console.warn("sendCaption failed", e); }
  }

  // create and attach ws listeners to receive captions & history
  useEffect(() => {
    if (!webrtc) return;

    // msg handler (use same shape your useWebRTC emits)
    const onMessage = (payload) => {
      // payload format: { type: 'caption', from, text, translations, time, isFinal, sourceSocket }
      try {
        if (!payload) return;
        const type = payload.type || payload.messageType;
        if (type === "caption" || (payload && payload.type === "caption")) {
          const cap = payload;
          const speaker = cap.from || cap.sourceSocket || "unknown";

          if (cap.isFinal) {
            // append final to history
            setHistory(h => [...h, { from: speaker, text: cap.text, time: cap.time || Date.now() }]);
            // remove live bubble for speaker (or mark final)
            setLiveBubbles(lb => {
              const copy = { ...lb };
              delete copy[speaker];
              return copy;
            });
          } else {
            // update live bubble for interim
            setLiveBubbles(lb => ({ ...lb, [speaker]: { text: cap.text, isFinal: false } }));
          }
        } else if (type === "caption-history" || (Array.isArray(payload) && payload.length && payload[0].text)) {
          // some servers send caption-history as separate message with payload array
          const hist = Array.isArray(payload) ? payload : (payload.payload || []);
          if (Array.isArray(hist)) {
            setHistory(h => [...hist, ...hist]); // keep existing then add (or replace if desired)
            // a better option: replace history so no duplication:
            setHistory(hist);
          }
        }
      } catch (e) { console.warn("onMessage caption parse", e); }
    };

    // subscribe to 'chat-message' emits from useWebRTC
    const unsub = webrtc.on("chat-message", onMessage);

    // also handle caption-history sent as a top-level message type
    const unsubHist = webrtc.on("caption-history", (payload) => {
      if (!payload) return;
      setHistory(payload);
    });

    return () => {
      // cleanup handlers; your webrtc.on returns an unsubscribe; if not, adapt to your API
      try { unsub && unsub(); } catch (e) {}
      try { unsubHist && unsubHist(); } catch (e) {}
    };
  }, [webrtc, roomId]);

  // start recognition
  function start(langShort = "en") {
    // guard
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in this browser");
      return;
    }

    stop(); // reset any previous

    const rec = new SpeechRecognition();
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;
    rec.lang = LANG_MAP[langShort] || "en-US";

    rec.onresult = (evt) => {
      try {
        const results = Array.from(evt.results || []);
        const transcript = results.map(r => r[0].transcript).join("");
        const isFinal = results[results.length - 1].isFinal;
        // update local live bubble display
        setLiveBubbles(lb => ({ ...lb, ["me"]: { text: transcript, isFinal } }));
        // send to server
        sendCaption(transcript, isFinal);
      } catch (e) { console.warn("rec.onresult err", e); }
    };

    rec.onerror = (e) => {
      console.warn("SpeechRecognition error", e);
    };

    rec.onend = () => {
      // if was running, restart for continuous recognition
      if (isRunning) {
        try { rec.start(); } catch (e) {}
      }
    };

    try {
      rec.start();
      recognitionRef.current = rec;
      setIsRunning(true);
    } catch (e) {
      console.warn("recognition start failed", e);
      setIsRunning(false);
    }
  }

  function stop() {
    const r = recognitionRef.current;
    if (r) {
      try { r.onresult = null; r.onend = null; r.onerror = null; r.stop(); } catch (e) {}
      recognitionRef.current = null;
    }
    setIsRunning(false);
    setLiveBubbles({}); // optionally clear live bubble
  }

  return {
    start, stop, isRunning,
    history, liveBubbles,
    sendCaption, // exposed if you want to manually send captions
  };
}
