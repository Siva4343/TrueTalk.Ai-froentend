import React, { useEffect, useMemo, useRef, useState } from "react";

const accentColors = [
  "#f97316",
  "#22c55e",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#3b82f6",
];

const API_HOST =
  import.meta.env.VITE_API_HOST ||
  `${window.location.hostname}:${import.meta.env.VITE_API_PORT || "8000"}`;

const API_PROTOCOL = window.location.protocol === "https:" ? "https" : "http";
const API_BASE_URL = `${API_PROTOCOL}://${API_HOST}/api/chat/messages/`;

const WS_PROTOCOL = window.location.protocol === "https:" ? "wss" : "ws";
const WS_URL =
  import.meta.env.VITE_WS_URL || `${WS_PROTOCOL}://${API_HOST}/ws/chat/`;

function Truetalk() {
  const [nameInput, setNameInput] = useState("");
  const [receiverInput, setReceiverInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [quickMeetLink, setQuickMeetLink] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [activeView, setActiveView] = useState("chat");
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState(new Set());
  const [activeChatTab, setActiveChatTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const scrollAnchorRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastReadRef = useRef(null);

  // Mock chat list data
  const chatList = [
    {
      id: 1,
      name: "Session",
      lastMessage: "good morning sir",
      time: "10:20",
      unread: 0,
      isOnline: true,
      type: "personal",
      isVerified: true
    },
    {
      id: 2,
      name: "Subba Raju",
      lastMessage: "Photo",
      time: "09:45",
      unread: 2,
      isOnline: false,
      type: "personal"
    },
    {
      id: 3,
      name: "Instagram",
      lastMessage: "You received a one-time passcode...",
      time: "09:30",
      unread: 1,
      isOnline: false,
      type: "channel"
    },
    {
      id: 4,
      name: "Raman Pragati",
      lastMessage: "Missed group call",
      time: "Yesterday",
      unread: 0,
      isOnline: true,
      type: "personal"
    },
    {
      id: 5,
      name: "#8 Curious Coder",
      lastMessage: "Curious Coder: For certificate you do...",
      time: "Yesterday",
      unread: 3,
      isOnline: false,
      type: "group"
    },
    {
      id: 6,
      name: "Bava Garu Kkd",
      lastMessage: "Audio",
      time: "17/11/25",
      unread: 0,
      isOnline: false,
      type: "personal"
    },
    {
      id: 7,
      name: "Instagram",
      lastMessage: "Use WhatsApp on your phone...",
      time: "14/10/25",
      unread: 0,
      isOnline: false,
      type: "channel"
    }
  ];

  // Mock user data for demonstration
  const userDetails = {
    "session": {
      name: "Session",
      role: "CEO",
      status: "Online",
      lastSeen: "Just now",
      email: "session@company.com",
      phone: "+1 (555) 123-4567",
      department: "Executive",
      avatar: "S",
      isVerified: true
    },
    "subba raju": {
      name: "Subba Raju",
      role: "Designer",
      status: "Offline",
      lastSeen: "2 hours ago",
      email: "subba@company.com",
      phone: "+1 (555) 987-6543",
      department: "Design",
      avatar: "SR"
    },
    "raman pragati": {
      name: "Raman Pragati",
      role: "Developer",
      status: "Online",
      lastSeen: "Just now",
      email: "raman@company.com",
      phone: "+1 (555) 456-7890",
      department: "Engineering",
      avatar: "RP"
    }
  };

  // Load messages from backend on first render
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(API_BASE_URL);
        const data = await response.json();

        const normalized = data.map((m) => ({
          id: m.id,
          author: m.sender_username || m.sender?.username || "Unknown",
          receiver: m.receiver_username || m.receiver?.username || null,
          text: m.text,
          time: new Date(m.created_at),
          formattedTime: new Date(m.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          isOwn: m.sender_username === nameInput,
        }));

        setMessages(normalized);
        lastReadRef.current = normalized[normalized.length - 1]?.id || null;
      } catch (error) {
        console.error("Failed to load messages", error);
        // Load mock messages for demo
        const mockMessages = [
          {
            id: 1,
            author: "Session",
            receiver: null,
            text: "Hello there!",
            time: new Date(Date.now() - 300000),
            formattedTime: "10:15",
            isOwn: false
          },
          {
            id: 2,
            author: nameInput || "You",
            receiver: null,
            text: "Hi Session! How are you?",
            time: new Date(Date.now() - 240000),
            formattedTime: "10:16",
            isOwn: true
          },
          {
            id: 3,
            author: "Session",
            receiver: null,
            text: "I'm doing great! Thanks for asking.",
            time: new Date(Date.now() - 180000),
            formattedTime: "10:17",
            isOwn: false
          }
        ];
        setMessages(mockMessages);
      }
    };

    fetchMessages();
  }, [nameInput]);

  // WebSocket connection for real-time messaging
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          console.log("WebSocket Connected");
          setIsConnected(true);
          if (nameInput) {
            ws.send(JSON.stringify({
              type: "user_join",
              username: nameInput,
            }));
          }
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          
          if (data.type === "chat_message" && data.message) {
            const msg = data.message;
            const newMessage = {
              id: msg.id,
              author: msg.sender_username,
              receiver: msg.receiver_username,
              text: msg.text,
              time: new Date(msg.created_at),
              formattedTime: new Date(msg.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              isOwn: msg.sender_username === nameInput,
            };

            setMessages((prev) => [...prev, newMessage]);
            
            if (activeView !== "chat" || !isElementInViewport(scrollAnchorRef.current)) {
              setUnreadCount(prev => prev + 1);
            }
          }
          else if (data.type === "user_join") {
            setOnlineUsers(prev => new Set([...prev, data.username]));
          }
          else if (data.type === "user_leave") {
            setOnlineUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.username);
              return newSet;
            });
          }
          else if (data.type === "typing_start") {
            if (data.username !== nameInput) {
              setTypingUsers(prev => new Set([...prev, data.username]));
            }
          }
          else if (data.type === "typing_stop") {
            setTypingUsers(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.username);
              return newSet;
            });
          }
          else if (data.type === "online_users") {
            setOnlineUsers(new Set(data.users));
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setIsConnected(false);
        };

        ws.onclose = () => {
          console.log("WebSocket Disconnected");
          setIsConnected(false);
          setTimeout(connectWebSocket, 3000);
        };
      } catch (error) {
        console.error("Failed to connect WebSocket:", error);
        setIsConnected(false);
      }
    };

    if (nameInput) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [nameInput, activeView]);

  // Track typing indicators
  useEffect(() => {
    if (!nameInput || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    if (messageInput.trim()) {
      wsRef.current.send(JSON.stringify({
        type: "typing_start",
        username: nameInput,
      }));

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: "typing_stop",
            username: nameInput,
          }));
        }
      }, 1000);
    } else {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "typing_stop",
          username: nameInput,
        }));
      }
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [messageInput, nameInput]);

  // Reset unread count when viewing chat
  useEffect(() => {
    if (activeView === "chat") {
      setUnreadCount(0);
      lastReadRef.current = messages[messages.length - 1]?.id || null;
    }
  }, [activeView, messages]);

  const isElementInViewport = (el) => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  };

  const colorByAuthor = useMemo(() => {
    const map = new Map();
    let index = 0;

    messages.forEach((msg) => {
      if (!map.has(msg.author)) {
        map.set(msg.author, accentColors[index % accentColors.length]);
        index += 1;
      }
    });

    return map;
  }, [messages]);

  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentGroup = [];
    
    messages.forEach((message, index) => {
      if (index === 0) {
        currentGroup.push(message);
      } else {
        const prevMessage = messages[index - 1];
        const timeDiff = message.time - prevMessage.time;
        const sameAuthor = message.author === prevMessage.author;
        
        if (timeDiff < 300000 && sameAuthor) {
          currentGroup.push(message);
        } else {
          groups.push([...currentGroup]);
          currentGroup = [message];
        }
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push(currentGroup);
    }
    
    return groups;
  }, [messages]);

  const resetInputs = () => {
    setMessageInput("");
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!nameInput.trim() || !messageInput.trim() || isSending) return;

    setIsSending(true);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(
          JSON.stringify({
            type: "chat_message",
            sender_username: nameInput.trim(),
            receiver_username: receiverInput.trim() || null,
            message: messageInput.trim(),
          })
        );
        resetInputs();
      } catch (error) {
        console.error("Failed to send via WebSocket:", error);
        await sendViaAPI();
      }
    } else {
      await sendViaAPI();
    }

    setIsSending(false);
  };

  const sendViaAPI = async () => {
    try {
      const payload = {
        sender_username: nameInput.trim(),
        receiver_username: receiverInput.trim() || null,
        text: messageInput.trim(),
      };

      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const saved = await response.json();

      const newMessage = {
        id: saved.id,
        author: saved.sender_username || saved.sender?.username,
        receiver: saved.receiver_username || saved.receiver?.username || null,
        text: saved.text,
        time: new Date(saved.created_at),
        formattedTime: new Date(saved.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: true,
      };

      setMessages((prev) => [...prev, newMessage]);
      resetInputs();
    } catch (error) {
      console.error("Failed to send message", error);
      // Add message locally for demo purposes
      const newMessage = {
        id: Date.now(),
        author: nameInput,
        receiver: receiverInput.trim() || null,
        text: messageInput.trim(),
        time: new Date(),
        formattedTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isOwn: true,
      };
      setMessages((prev) => [...prev, newMessage]);
      resetInputs();
    }
  };

  const handleCloseChat = () => {
    setSidebarOpen(false);
    setSelectedUser(null);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    if (sidebarOpen) {
      setSelectedUser(null);
    }
  };

  const toggleMessageSelection = (messageId) => {
    setSelectedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Filter chat list based on search query
  const filteredChats = chatList.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-open sidebar when a user is selected
  useEffect(() => {
    if (selectedUser) {
      setSidebarOpen(true);
    }
  }, [selectedUser]);

  // Sidebar Content
  const renderSidebarContent = () => {
    if (!selectedUser) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-gray-50">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
            👤
          </div>
          <h3 className="font-semibold text-gray-900 text-lg mb-2">Contact Info</h3>
          <p className="text-gray-600 text-sm">
            Select a contact to view their details and chat options.
          </p>
        </div>
      );
    }

    const user = userDetails[selectedUser.toLowerCase()] || {
      name: selectedUser,
      role: "Contact",
      status: "Online",
      lastSeen: "Recently",
      email: `${selectedUser.toLowerCase()}@example.com`,
      phone: "+1 (555) 000-0000",
      department: "General",
      avatar: selectedUser.charAt(0).toUpperCase()
    };

    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="p-6 bg-green-500 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white text-green-500 font-bold text-xl flex items-center justify-center">
              {user.avatar}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg">{user.name}</h3>
                {user.isVerified && (
                  <span className="text-blue-300">✓</span>
                )}
              </div>
              <p className="text-green-100 text-sm opacity-90">{user.role}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  user.status === "Online" ? "bg-white" : "bg-gray-300"
                }`}></div>
                <span className="text-xs text-green-100 opacity-80">{user.status} • {user.lastSeen}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-1 mb-6">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Email</span>
                <span className="text-sm text-gray-900">{user.email}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Phone</span>
                <span className="text-sm text-gray-900">{user.phone}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Department</span>
                <span className="text-sm text-gray-900">{user.department}</span>
              </div>
            </div>

            {/* Chat Actions */}
            <div className="space-y-1">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Contact info</span>
                <input type="checkbox" className="rounded border-gray-300" defaultChecked />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Select messages</span>
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300" 
                  checked={selectedMessages.size > 0}
                  onChange={() => {
                    if (selectedMessages.size > 0) {
                      setSelectedMessages(new Set());
                    }
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Mute notifications</span>
                <input type="checkbox" className="rounded border-gray-300" />
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Lock chat</span>
                <button className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                  Lock
                </button>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Close chat</span>
                <button 
                  onClick={handleCloseChat}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Report</span>
                <button className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors">
                  Report
                </button>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Block</span>
                <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                  Block
                </button>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-sm text-gray-600">Clear chat</span>
                <button className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors">
                  Clear
                </button>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-gray-600">Delete chat</span>
                <button className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Login form if no username is set
  if (!nameInput) {
    return (
      <div className="h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Truetalk.ai</h1>
            <p className="text-gray-600">Enter your name to start chatting</p>
          </div>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (nameInput.trim()) {
              setNameInput(nameInput.trim());
            }
          }}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              Start Chatting
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl h-[90vh] bg-white rounded-2xl shadow-xl flex overflow-hidden">
        
        {/* Left Sidebar - Chat List */}
        <div className="w-1/3 border-r border-gray-300 flex flex-col">
          {/* Profile Header */}
          <div className="bg-gray-100 p-4 flex justify-between items-center border-b border-gray-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                {nameInput.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="font-semibold text-gray-800 block">{nameInput}</span>
                <span className="text-xs text-gray-600">Truetalk.ai</span>
              </div>
            </div>
            <div className="flex gap-4 text-gray-600">
              <button className="hover:text-green-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </button>
              <button className="hover:text-green-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
              </button>
              <button className="hover:text-green-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 bg-gray-100 border-b border-gray-300">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search or start new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Chat Tabs */}
          <div className="flex border-b border-gray-300 bg-gray-50">
            {["All", "Unread", "Favourites", "Groups"].map((tab) => (
              <button
                key={tab}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeChatTab === tab
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                onClick={() => setActiveChatTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center gap-3 p-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedUser === chat.name ? "bg-green-50" : ""
                }`}
                onClick={() => setSelectedUser(chat.name)}
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                    {chat.name.charAt(0)}
                  </div>
                  {chat.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {chat.name}
                      {chat.isVerified && (
                        <span className="ml-1 text-blue-500 text-xs">✓</span>
                      )}
                    </span>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{chat.time}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600 truncate flex-1">
                      {chat.type === "personal" && chat.lastMessage.startsWith("Photo") && (
                        <span className="text-gray-400">📷 Photo</span>
                      )}
                      {chat.type === "personal" && chat.lastMessage.startsWith("Audio") && (
                        <span className="text-gray-400">🎵 Audio</span>
                      )}
                      {!chat.lastMessage.startsWith("Photo") && !chat.lastMessage.startsWith("Audio") && chat.lastMessage}
                    </p>
                    {chat.unread > 0 && (
                      <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-5 text-center">
                        {chat.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="bg-gray-100 px-4 py-3 border-b border-gray-300 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                {selectedUser ? selectedUser.charAt(0) : "C"}
              </div>
              <div>
                <div className="font-semibold text-gray-900">
                  {selectedUser || "Select a chat"}
                  {selectedUser && userDetails[selectedUser.toLowerCase()]?.isVerified && (
                    <span className="ml-1 text-blue-500 text-sm">✓</span>
                  )}
                </div>
                <div className="text-xs text-gray-600">
                  {selectedUser ? (
                    typingUsers.has(selectedUser) ? (
                      <span className="text-green-500">typing...</span>
                    ) : (
                      "Online"
                    )
                  ) : (
                    "Click on a chat to start messaging"
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-4 text-gray-600">
              <button className="hover:text-green-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </button>
              <button className="hover:text-green-600 transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </button>
              <button 
                className="hover:text-green-600 transition-colors"
                onClick={toggleSidebar}
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 bg-gray-100 overflow-y-auto p-4" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23e0e0e0' fill-opacity='0.4'/%3E%3C/svg%3E")`
          }}>
            {selectedUser ? (
              <>
                {/* Messages */}
                <div className="space-y-2">
                  {groupedMessages.map((group, groupIndex) => (
                    <div key={groupIndex} className="space-y-1">
                      {group.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                            message.isOwn 
                              ? "bg-green-500 text-white" 
                              : "bg-white text-gray-900 border border-gray-200"
                          }`}>
                            {!message.isOwn && (
                              <div 
                                className="font-medium text-sm mb-1"
                                style={{ color: colorByAuthor.get(message.author) }}
                              >
                                {message.author}
                              </div>
                            )}
                            <div className="text-sm">{message.text}</div>
                            <div className={`text-xs mt-1 ${
                              message.isOwn ? "text-green-100" : "text-gray-500"
                            }`}>
                              {message.formattedTime}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Typing Indicator */}
                {typingUsers.has(selectedUser) && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={scrollAnchorRef} />
              </>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4">
                    <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Welcome to Truetalk</h3>
                  <p className="text-gray-600">Select a chat from the sidebar to start messaging</p>
                </div>
              </div>
            )}
          </div>

          {/* Message Input */}
          {selectedUser && (
            <form onSubmit={handleSend} className="bg-white border-t border-gray-300 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  disabled={isSending}
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim() || isSending}
                  className="bg-green-500 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Right Sidebar - Contact Info */}
        {sidebarOpen && (
          <div className="w-1/4 border-l border-gray-300 flex flex-col">
            {renderSidebarContent()}
          </div>
        )}
      </div>

      {/* Connection Status Indicator */}
      <div className={`fixed bottom-4 right-4 px-3 py-1 rounded-full text-xs font-medium ${
        isConnected ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      }`}>
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>
    </div>
  );
}

export default Truetalk;