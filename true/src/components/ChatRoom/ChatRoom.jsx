import React, { useState, useEffect, useRef, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  PaperClipIcon, 
  MicrophoneIcon, 
  PaperAirplaneIcon,
  CheckIcon,
  CheckCircleIcon,
  DotsHorizontalIcon,
  SearchIcon,
  ArchiveIcon,
  TrashIcon,
  ShareIcon,
  EmojiHappyIcon
} from '@heroicons/react/outline';  // Changed to v1 syntax
import { useWebSocket } from '../../hooks/useWebSocket';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import Dropzone from 'react-dropzone';

// Simple debounce function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const ChatRoom = ({ roomId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load messages
    const fetchMessages = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/chat/rooms/${roomId}/messages/`);
        setMessages(response.data);
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, [roomId]);

  const handleMessage = useCallback((data) => {
    setMessages(prev => [...prev, data]);
  }, []);

  const handleTyping = useCallback((data) => {
    if (data.is_typing) {
      setTypingUsers(prev => [...prev.filter(u => u.id !== data.user_id), {
        id: data.user_id,
        username: data.username
      }]);
    } else {
      setTypingUsers(prev => prev.filter(u => u.id !== data.user_id));
    }
  }, []);

  const handleStatus = useCallback((data) => {
    if (data.is_online) {
      setOnlineUsers(prev => new Set([...prev, data.user_id]));
    } else {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.user_id);
        return newSet;
      });
    }
  }, []);

  const { sendMessage } = useWebSocket({
    message: handleMessage,
    typing: handleTyping,
    status: handleStatus
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`http://127.0.0.1:8000/api/chat/rooms/${roomId}/messages/`, {
        content: newMessage,
        message_type: 'text'
      });

      sendMessage('message', {
        room_id: roomId,
        content: newMessage,
        message_type: 'text'
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTypingIndicator = useCallback(
    debounce((isTyping) => {
      sendMessage('typing', {
        room_id: roomId,
        is_typing: isTyping
      });
    }, 500),
    [roomId, sendMessage]
  );

  const handleFileUpload = async (files) => {
    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('message_type', file.type.startsWith('image/') ? 'image' : 'file');

    try {
      await axios.post(`http://127.0.0.1:8000/api/chat/rooms/${roomId}/messages/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const formData = new FormData();
        formData.append('voice_note', audioBlob);
        formData.append('message_type', 'voice');

        try {
          await axios.post(`http://127.0.0.1:8000/api/chat/rooms/${roomId}/messages/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } catch (error) {
          console.error('Error sending voice message:', error);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const shareLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;

      try {
        // Get location name using reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();
        const locationName = data.display_name || 'Current Location';

        await axios.post(`http://127.0.0.1:8000/api/chat/rooms/${roomId}/messages/`, {
          message_type: 'location',
          latitude,
          longitude,
          location_name: locationName,
          content: '📍 Shared location'
        });
      } catch (error) {
        console.error('Error sharing location:', error);
      }
    });
  };

  const handleReaction = async (messageId, emoji) => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/chat/rooms/${roomId}/messages/${messageId}/react/`, {
        emoji
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const handleDeleteMessage = async (messageId, forEveryone = false) => {
    try {
      if (forEveryone) {
        await axios.post(`http://127.0.0.1:8000/api/chat/rooms/${roomId}/messages/${messageId}/delete_for_everyone/`);
      } else {
        await axios.post(`http://127.0.0.1:8000/api/chat/rooms/${roomId}/messages/${messageId}/delete_for_me/`);
      }
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleForwardMessage = async (messageId) => {
    // Open forward modal
    // Implementation depends on your UI
  };

  const toggleMessageSelect = (messageId) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const selectAllMessages = () => {
    const allMessageIds = messages.map(msg => msg.id);
    setSelectedMessages(new Set(allMessageIds));
  };

  const handleArchiveChat = async () => {
    try {
      await axios.post(`http://127.0.0.1:8000/api/chat/rooms/${roomId}/archive/`);
      alert('Chat archived successfully');
    } catch (error) {
      console.error('Error archiving chat:', error);
    }
  };

  const handleExportChat = async () => {
    try {
      await axios.post('http://127.0.0.1:8000/api/chat/backup/', {
        format: 'pdf',
        email: currentUser.email
      });
      alert('Chat backup sent to your email');
    } catch (error) {
      console.error('Error exporting chat:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-300"></div>
            {onlineUsers.has(roomId) && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold">Chat Room Name</h3>
            <div className="text-sm text-gray-500">
              {typingUsers.length > 0 ? (
                <div className="flex items-center space-x-1">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <span>{typingUsers.map(u => u.username).join(', ')} is typing...</span>
                </div>
              ) : onlineUsers.size > 0 ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={handleArchiveChat} title="Archive Chat">
            <ArchiveIcon className="w-5 h-5" />
          </button>
          <button onClick={handleExportChat} title="Export Chat">
            <ShareIcon className="w-5 h-5" />
          </button>
          <button>
            <DotsHorizontalIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender.id === currentUser.id ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`message-bubble p-3 rounded-lg ${message.sender.id === currentUser.id ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{message.sender.username}</span>
                <span className="text-xs text-gray-500">
                  {format(new Date(message.created_at), 'HH:mm')}
                </span>
              </div>
              
              {message.message_type === 'image' && (
                <img 
                  src={message.file} 
                  alt="Shared" 
                  className="max-w-xs rounded mb-2"
                />
              )}
              
              {message.message_type === 'file' && (
                <div className="flex items-center space-x-2 p-2 bg-white rounded border">
                  <PaperClipIcon className="w-4 h-4" />
                  <span className="text-sm">{message.file?.split('/').pop() || 'File'}</span>
                </div>
              )}
              
              {message.message_type === 'voice' && (
                <div className="flex items-center space-x-2">
                  <audio controls src={message.voice_note} className="w-48" />
                  <span className="text-sm">Voice message</span>
                </div>
              )}
              
              {message.message_type === 'location' && (
                <div className="p-2 bg-white rounded border">
                  <div className="flex items-center space-x-2">
                    <MapPinIcon className="w-4 h-4 text-red-500" />
                    <span>{message.location_name || 'Shared location'}</span>
                  </div>
                  <a
                    href={`https://maps.google.com/?q=${message.latitude},${message.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    Open in Maps
                  </a>
                </div>
              )}
              
              <p className="mb-1">{message.content}</p>
              
              {/* Reactions */}
              {message.reactions?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {message.reactions.map((reaction, idx) => (
                    <span key={idx} className="text-xs bg-white px-1 rounded border">
                      {reaction.emoji}
                    </span>
                  ))}
                </div>
              )}
              
              {/* Message Actions */}
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleReaction(message.id, '👍')}
                    className="text-xs hover:bg-gray-200 px-1 rounded"
                  >
                    👍
                  </button>
                  <button
                    onClick={() => handleReaction(message.id, '❤️')}
                    className="text-xs hover:bg-gray-200 px-1 rounded"
                  >
                    ❤️
                  </button>
                  <button
                    onClick={() => handleReaction(message.id, '😂')}
                    className="text-xs hover:bg-gray-200 px-1 rounded"
                  >
                    😂
                  </button>
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="text-xs hover:bg-gray-200 px-1 rounded"
                  >
                    <EmojiHappyIcon className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex items-center space-x-1">
                  {message.is_read && <CheckCircleIcon className="w-4 h-4 text-blue-500" />}
                  {!message.is_read && <CheckIcon className="w-4 h-4 text-gray-400" />}
                  
                  <input
                    type="checkbox"
                    checked={selectedMessages.has(message.id)}
                    onChange={() => toggleMessageSelect(message.id)}
                    className="h-4 w-4 rounded"
                  />
                </div>
              </div>
              
              {/* Emoji Picker */}
              {showEmojiPicker && (
                <div className="absolute z-10 mt-2">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      handleReaction(message.id, emojiData.emoji);
                      setShowEmojiPicker(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t p-4">
        {selectedMessages.size > 0 && (
          <div className="flex items-center justify-between mb-4 p-2 bg-blue-50 rounded">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedMessages(new Set())}
                className="text-sm text-gray-600"
              >
                Cancel
              </button>
              <span className="text-sm">{selectedMessages.size} selected</span>
              <button
                onClick={selectAllMessages}
                className="text-sm text-blue-600"
              >
                Select All
              </button>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleDeleteMessage(Array.from(selectedMessages)[0], false)}
                className="text-red-600"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleForwardMessage(Array.from(selectedMessages)[0])}
                className="text-blue-600"
              >
                <ShareIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
          <Dropzone onDrop={handleFileUpload}>
            {({ getRootProps, getInputProps }) => (
              <div {...getRootProps()} className="cursor-pointer p-2 hover:bg-gray-100 rounded">
                <input {...getInputProps()} />
                <PaperClipIcon className="w-5 h-5" />
              </div>
            )}
          </Dropzone>
          
          <button
            type="button"
            onClick={shareLocation}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <MapPinIcon className="w-5 h-5" />
          </button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTypingIndicator(true);
              }}
              onBlur={() => handleTypingIndicator(false)}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <button
            type="button"
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`p-2 rounded-full ${isRecording ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100'}`}
          >
            <MicrophoneIcon className="w-5 h-5" />
          </button>
          
          <button
            type="submit"
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;