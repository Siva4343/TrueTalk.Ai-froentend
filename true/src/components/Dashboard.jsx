import React, { useContext } from "react";
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const { logout, user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="px-8 py-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl text-white font-bold">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </span>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Dashboard 🎉
            </h2>
            
            {user && (
              <div className="space-y-2 mb-6">
                <p className="text-xl text-gray-600">
                  Hello, <span className="font-semibold text-green-600">
                    {user.first_name} {user.last_name}
                  </span>
                </p>
                <p className="text-gray-500">
                  {user.email}
                </p>
                {user.phone && (
                  <p className="text-gray-500">
                    📱 {user.phone}
                  </p>
                )}
              </div>
            )}
            
            <p className="text-gray-500 mb-8">
              You have successfully logged into your account
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={logout} 
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                Logout
              </button>
              
              <button className="bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105">
                View Profile
              </button>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Analytics</h3>
            <p className="text-gray-600 text-sm">View your usage statistics</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-green-600 text-xl">⚙️</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Settings</h3>
            <p className="text-gray-600 text-sm">Manage your preferences</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-purple-600 text-xl">👥</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Support</h3>
            <p className="text-gray-600 text-sm">Get help when needed</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;