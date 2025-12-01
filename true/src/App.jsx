import React from "react";
import VideoCall from "./components/video-call/VideoCall.jsx";
import "./App.css";

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">TrueTalk.AI</h1>
        </div>
      </nav>

      {/* Video Call View */}
      <main className="max-w-7xl mx-auto py-6 px-4">
        <VideoCall />
      </main>
    </div>
  );
}

export default App;
