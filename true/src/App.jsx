import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import { SocketProvider } from './context/SocketContext';

// Components
import BusinessProfileSetup from './components/BusinessProfile/BusinessProfileSetup';
import ChatDashboard from './components/ChatDashboard/ChatDashboard';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Configure axios
axios.defaults.baseURL = 'http://localhost:8000';
axios.defaults.withCredentials = true;

// Request interceptor to add token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post('/api/token/refresh/', {
          refresh: refreshToken
        });

        const { access, refresh } = response.data;
        localStorage.setItem('access_token', access);
        if (refresh) {
          localStorage.setItem('refresh_token', refresh);
        }

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Redirect to login if refresh fails
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        // Verify token by fetching user profile
        const response = await axios.get('/api/accounts/profile/');
        setUser(response.data);
        setIsAuthenticated(true);
        
        // Check if user has completed business profile
        if (response.data.business_profile?.business_name) {
          setHasProfile(true);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = (tokens, userData) => {
    localStorage.setItem('access_token', tokens.access);
    if (tokens.refresh) {
      localStorage.setItem('refresh_token', tokens.refresh);
    }
    setUser(userData);
    setIsAuthenticated(true);
    
    // Check if user has profile
    if (userData.business_profile?.business_name) {
      setHasProfile(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
    setHasProfile(false);
  };

  const handleProfileComplete = () => {
    setHasProfile(true);
    // Refresh user data
    axios.get('/api/accounts/profile/').then(response => {
      setUser(response.data);
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" /> : <Register />
        } />

        {/* Protected Routes */}
        <Route path="/" element={
          !isAuthenticated ? <Navigate to="/login" /> : 
          !hasProfile ? <Navigate to="/complete-profile" /> : (
            <SocketProvider token={localStorage.getItem('access_token')}>
              <ChatDashboard user={user} onLogout={handleLogout} />
            </SocketProvider>
          )
        } />

        <Route path="/complete-profile" element={
          !isAuthenticated ? <Navigate to="/login" /> : 
          hasProfile ? <Navigate to="/" /> : (
            <BusinessProfileSetup 
              user={user} 
              onComplete={handleProfileComplete}
            />
          )
        } />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;