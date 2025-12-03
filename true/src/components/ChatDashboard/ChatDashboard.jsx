import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import ChatRoom from '../ChatRoom/ChatRoom';
import Settings from '../Settings/Settings';
import { 
  CogIcon, 
  BellIcon, 
  LogoutIcon,
  SearchIcon,
  UserGroupIcon
} from '@heroicons/react/outline';

const ChatDashboard = ({ user, onLogout }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 border-r bg-white">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                  {user?.business_profile?.business_name?.charAt(0) || user?.username?.charAt(0)}
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h2 className="font-bold text-gray-800">{user?.business_profile?.business_name || user?.username}</h2>
                <p className="text-xs text-gray-500">Online</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-2 hover:bg-gray-100 rounded"
              title="Logout"
            >
              <LogoutIcon className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setSearchOpen(true)}
            />
          </div>
        </div>

        <Sidebar 
          onSelectChat={setSelectedChat} 
          currentUser={user}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {selectedChat ? (
              <>
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <UserGroupIcon className="w-6 h-6 text-gray-600" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h1 className="font-bold text-gray-800">{selectedChat.name}</h1>
                  <p className="text-sm text-gray-500">Active now</p>
                </div>
              </>
            ) : (
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Business Chat</h1>
                <p className="text-gray-600">Select a chat to start messaging</p>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <button
              className="p-2 hover:bg-gray-100 rounded"
              title="Notifications"
            >
              <BellIcon className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 rounded"
              title="Settings"
            >
              <CogIcon className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Chat Area or Welcome Screen */}
        <main className="flex-1 overflow-hidden">
          {selectedChat ? (
            <ChatRoom 
              room={selectedChat} 
              currentUser={user}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mb-3">Welcome to Business Chat</h2>
                <p className="text-gray-600 max-w-md mx-auto mb-8">
                  Connect with business partners, share files, collaborate in real-time, 
                  and boost your productivity with secure messaging.
                </p>
                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  <div className="p-4 bg-white rounded-lg shadow-sm border">
                    <div className="w-10 h-10 mx-auto mb-3 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Secure</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border">
                    <div className="w-10 h-10 mx-auto mb-3 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Fast</p>
                  </div>
                  <div className="p-4 bg-white rounded-lg shadow-sm border">
                    <div className="w-10 h-10 mx-auto mb-3 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Team Chat</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Settings 
          user={user}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};

export default ChatDashboard;