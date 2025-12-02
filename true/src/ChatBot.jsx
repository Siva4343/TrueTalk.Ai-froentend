import React, { useState, useEffect, useRef } from "react";
import "./chatbot.css";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I’m your TrueTalk Assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");

  const bodyRef = useRef(null); // 👈 chat body reference for auto-scroll

  // Auto-scroll when new message appears
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages]);

  // AI response logic
  const botResponses = (msg) => {
    msg = msg.toLowerCase();

    if (msg.includes("post job")) {
      return "To post a job:\n1. Click 'Post Job' in the header.\n2. Fill out all details.\n3. Click 'Post Job' to save!";
    }

    if (msg.includes("browse")) {
      return "To browse jobs:\nGo to 'Browse Jobs' in the header. You can filter or click a job to apply.";
    }

    if (msg.includes("apply")) {
      return "To apply:\n1. Open 'Browse Jobs'\n2. Select a job\n3. Fill the form & upload resume.";
    }

    if (msg.includes("application") || msg.includes("status")) {
      return "Your applications are shown in the 'My Applications' tab with status updates.";
    }

    if (msg.includes("hello") || msg.includes("hi")) {
      return "Hello! 😊 How can I guide you today?";
    }

    return "I can help with:\n• How to post a job\n• How to browse jobs\n• How to apply\n• How to view applications";
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = input.trim();

    // Push user message (right side)
    setMessages((prev) => [...prev, { sender: "user", text: userMsg }]);

    // Bot reply
    const reply = botResponses(userMsg);

    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "bot", text: reply }]);
    }, 400);

    setInput("");
  };

  return (
    <>
      {/* Floating Icon */}
      <button className="chatbot-icon" onClick={() => setIsOpen(!isOpen)}>
        💬
      </button>

      {isOpen && (
        <div className="chatbot-window">
          <div className="chatbot-header">
            <span>TrueTalk Support Bot</span>
            <button className="close-btn" onClick={() => setIsOpen(false)}>✖</button>
          </div>

          {/* Chat Messages */}
          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.sender}`}>
                {m.text}
              </div>
            ))}
          </div>

          {/* Input Box */}
          <div className="chatbot-input">
            <input
              type="text"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
