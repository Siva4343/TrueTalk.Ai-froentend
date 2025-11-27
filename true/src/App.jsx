import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import './index.css';

const ProtectedRoute = () => {
  const isAuthenticated = Boolean(localStorage.getItem('username'));
  console.log('ProtectedRoute check:', isAuthenticated);
  // If not authenticated, redirect to /login (use replace to avoid back navigation to a protected route)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  const isAuthenticated = Boolean(localStorage.getItem('username'));

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/chat" element={<ChatPage />} />
        </Route>
        {/*
          Redirect root to either /chat or /login depending on auth state so the app "connects" routing properly.
        */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />} />
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/chat" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;