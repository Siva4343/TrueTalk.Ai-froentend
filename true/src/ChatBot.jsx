import { useState, useRef, useEffect } from "react";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! I can help you fill the Business Profile form. Ask me anything!" }
  ]);
  const [input, setInput] = useState("");

  // Create a reference for auto-scrolling
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getBotReply = (q) => {
    q = q.toLowerCase();

    if (q.includes("name"))
      return "Enter your business or brand name. Example: TrueTalk Pvt Ltd.";
    if (q.includes("email"))
      return "Enter your official business email. Example: support@company.com.";
    if (q.includes("phone"))
      return "Enter a valid phone number so customers can contact you.";
    if (q.includes("website"))
      return "Enter your business website URL. Leave blank if not available.";
    if (q.includes("location"))
      return "Mention your business city or full address.";
    if (q.includes("hours"))
      return "Specify business hours. Example: 9AM - 6PM.";
    if (q.includes("tagline"))
      return "A short phrase describing your business. Example: 'We build solutions'.";
    if (q.includes("description"))
      return "Write what your business does, your mission, and your services.";
    if (q.includes("services"))
      return "List the services you provide. Example: Web Development, AI Chatbots.";
    if (q.includes("photo") || q.includes("logo"))
      return "Upload your business logo or brand image.";

    return "I can help you with Name, Email, Phone, Website, Hours, Description, Services, and more!";
  };

  const sendMessage = () => {
    if (!input.trim()) return;

    const userMsg = { sender: "user", text: input };
    const botMsg = { sender: "bot", text: getBotReply(input) };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white w-14 h-14 rounded-full shadow-lg hover:bg-blue-700 text-3xl flex items-center justify-center"
      >
        💬
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 bg-white w-80 h-96 rounded-xl shadow-xl border flex flex-col">

          {/* Header */}
          <div className="bg-blue-600 text-white p-3 rounded-t-xl flex justify-between">
            <h2 className="font-bold">Support Bot</h2>
            <button onClick={() => setIsOpen(false)}>✖</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded-lg max-w-[80%] ${
                  msg.sender === "user" ? "ml-auto bg-blue-100" : "mr-auto bg-gray-200"
                }`}
              >
                {msg.text}
              </div>
            ))}

            {/* Invisible element to scroll into view */}
            <div ref={messagesEndRef}></div>
          </div>

          {/* Bottom Input */}
          <div className="p-3 border-t flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a question..."
              className="flex-1 border rounded-lg px-3 py-2"
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 text-white px-3 rounded-lg"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
