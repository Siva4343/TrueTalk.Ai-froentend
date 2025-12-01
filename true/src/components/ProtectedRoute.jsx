import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  fallbackPath = "/unauthorized" 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Securing Your Session</h3>
            <p className="text-gray-600 mb-6">
              We're verifying your authentication status to ensure your security.
            </p>
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate 
        to="/login" 
        state={{ 
          from: location,
          message: "🔒 Authentication Required",
          description: "Please log in to access this page."
        }} 
        replace 
      />
    );
  }

  // Role-based access control (optional feature)
  if (requiredRoles.length > 0 && user?.role) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      return (
        <Navigate 
          to={fallbackPath} 
          state={{ 
            from: location,
            message: "🚫 Access Denied",
            description: "You don't have permission to access this page."
          }} 
          replace 
        />
      );
    }
  }

  // Render protected content
  return (
    <div className="protected-content">
      {/* Optional: Add a small auth status indicator */}
      <div className="auth-status-bar hidden lg:block fixed top-20 right-4 bg-green-50 border border-green-200 rounded-lg px-4 py-2 shadow-sm z-50">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-green-700 font-medium">
            Signed in as {user?.first_name || user?.email}
          </span>
        </div>
      </div>
      {children}
    </div>
  );
};

export default ProtectedRoute;