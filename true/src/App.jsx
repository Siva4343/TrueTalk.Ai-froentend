// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// use exact filenames (including .jsx) to avoid Vite resolution issues
import Home from "./pages/Home.jsx";
import MeetingPage from "./pages/Meeting.jsx";
import Join from "./pages/Join.jsx";
import Landing from "./pages/landing.jsx";

export default function App() {
  return (
    <Routes>
      {/* landing / home */}
      <Route path="/" element={<Home />} />

      {/* older landing page if you want to preview it */}
      <Route path="/landing" element={<Landing />} />

      {/* join page (if you have a join-specific UI) */}
      <Route path="/join" element={<Join />} />

      {/* meeting route with room id param */}
      <Route path="/meet/:roomId" element={<MeetingPage />} />

      {/* fallback: redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
