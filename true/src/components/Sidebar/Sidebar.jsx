import React, { useState, useEffect } from 'react';
import { SearchIcon, UserGroupIcon, ChatIcon, BellIcon, CogIcon } from '@heroicons/react/outline';
import axios from 'axios';

const Sidebar = ({ onSelectChat, currentUser }) => {
  const [chats, setChats] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ messages: [], users: [] });

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/chat/rooms/');
        setChats(response.data);
      } catch (error) {
        console.error('Error fetching chats:', error);
      }
    };

    fetchChats();
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults({ messages: [], users: [] });
      return;
    }

    try {
      const response = await axios.get(`http://127.0.0.1:8000/api/chat/search/?q=${query}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const startNewChat = async (userId) => {
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/chat/rooms/create_direct_chat/', {
        user_id: userId
      });
      onSelectChat(response.data);
      setSearchQuery('');
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  return (
    <div className="sidebar bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Messages</h2>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded">
              <UserGroupIcon className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <BellIcon className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <CogIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search messages or users..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="absolute z-10 mt-2 bg-white border rounded-lg shadow-lg w-96">
            {searchResults.users.length > 0 && (
              <div className="p-2">
                <h3 className="font-semibold mb-2">Users</h3>
                {searchResults.users.map(user => (
                  <div
                    key={user.id}
                    onClick={() => startNewChat(user.id)}
                    className="flex items-center p-2 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-300 mr-3"></div>
                    <div>
                      <p className="font-medium">{user.business_profile.business_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {searchResults.messages.length > 0 && (
              <div className="p-2 border-t">
                <h3 className="font-semibold mb-2">Messages</h3>
                {searchResults.messages.map(message => (
                  <div
                    key={message.id}
                    onClick={() => onSelectChat(message.room)}
                    className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs text-gray-500">
                      From: {message.sender.username} • In: {message.room.name}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat List */}
      <div className="overflow-y-auto" style={{ height: 'calc(100vh - 180px)' }}>
        {chats.map(chat => (
          <div
            key={chat.id}
            onClick={() => onSelectChat(chat)}
            className="p-4 border-b hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                    <ChatIcon className="w-6 h-6 text-gray-500" />
                  </div>
                  {chat.participants.some(p => p.is_online) && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">{chat.name}</h4>
                  {chat.last_message && (
                    <p className="text-sm text-gray-600 truncate">
                      {chat.last_message.sender?.username}: {chat.last_message.content}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                {chat.last_message && (
                  <span className="text-xs text-gray-500">
                    {new Date(chat.last_message.created_at).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                )}
                {chat.unread_count > 0 && (
                  <div className="mt-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-auto">
                    {chat.unread_count}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;