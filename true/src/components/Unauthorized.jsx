import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Unauthorized = () => {
  const location = useLocation();
  const { message = "Access Denied", description = "You don't have permission to view this page." } = location.state || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl">🚫</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{message}</h1>
          <p className="text-gray-600 mb-8">{description}</p>

          <div className="space-y-4">
            <Link
              to="/dashboard"
              className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors duration-200 transform hover:scale-105"
            >
              Go to Dashboard
            </Link>
            
            <Link
              to="/"
              className="block w-full border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 py-3 px-4 rounded-lg font-semibold transition-colors duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;