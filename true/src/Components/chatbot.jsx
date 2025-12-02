import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';

const CalendarAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hello! I'm your calendar assistant. Ask me anything about:\n• How to schedule events\n• Setting reminders\n• Navigating the calendar\n• Understanding the interface",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Calendar knowledge base
  const calendarKnowledgeBase = {
    // Event-related questions
    "event": "To create a new event, click on the 'New Event' button in the Event section. You can schedule meetings, set reminders, and add details like title, date, time, and location.",
    
    "schedule": "Use the 'Scheduling' option to plan events. You can also click directly on a date in the calendar grid to create an event for that specific day.",
    
    "reminder": "To set a reminder, use the 'New Reminder' button. Reminders can be set for specific dates and times, and will notify you according to your notification settings.",
    
    // Navigation questions
    "navigate": "Use the navigation buttons at the bottom: 'Month' shows monthly view, 'Week' shows weekly view, 'Day' shows daily view, and 'Agenda' lists all upcoming events.",
    
    "month": "Month view shows the entire month grid. You can see all days and events scheduled. Click on any day to add events or view details.",
    
    "week": "Week view shows 7 days horizontally. Useful for seeing your week at a glance.",
    
    "day": "Day view shows a single day with time slots. Perfect for detailed daily planning.",
    
    "agenda": "Agenda view lists all upcoming events in chronological order, regardless of calendar view.",
    
    // Calendar operations
    "today": "The 'Today' button takes you to the current date. Below it, you can see 'December 2025' which indicates the current month being viewed.",
    
    "search": "Use the 'Search' bar to find specific events, reminders, or dates in your calendar. It searches through all your calendar content.",
    
    // General help
    "help": "I can help you with:\n• Creating events and reminders\n• Navigating calendar views\n• Understanding the interface\n• Using search functionality\n• Scheduling meetings",
    
    "interface": "The interface has 3 main sections:\n1. Event section (top-left): Create events/reminders\n2. Calendar grid (center): View by month/week/day\n3. View controls (bottom): Switch between views\n4. Search bar (top-right): Find events",
    
    "views": "Available views:\n• Month: Full month calendar\n• Week: 7-day weekly view\n• Day: Single day with time slots\n• Agenda: List of upcoming events",
    
    "create": "To create something:\n1. Click 'New Event' for meetings\n2. Click 'New Reminder' for alerts\n3. Or click directly on a date in the grid",
    
    "date": "The calendar shows December 2025. You can navigate to other months using the navigation arrows or by clicking dates. Current day is highlighted.",
    
    "grid": "The calendar grid shows days from Sunday to Saturday. Numbers represent dates. Click any date to add events. Events appear as blocks on their dates."
  };

  // Quick suggestions
  const quickSuggestions = [
    "How to create event?",
    "What views are available?",
    "How to set reminder?",
    "What is Agenda view?"
  ];

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Focus input when chatbot opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current.focus();
      }, 300);
    }
  }, [isOpen]);

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    handleSendMessage(suggestion);
  };

  const getResponse = (message) => {
    const lowerMsg = message.toLowerCase();
    const keywords = Object.keys(calendarKnowledgeBase);
    
    for (const keyword of keywords) {
      if (lowerMsg.includes(keyword)) {
        return calendarKnowledgeBase[keyword];
      }
    }
    
    // Check for synonyms
    if (lowerMsg.includes('make') || lowerMsg.includes('add') || lowerMsg.includes('new')) {
      return calendarKnowledgeBase.create;
    } else if (lowerMsg.includes('view') || lowerMsg.includes('see') || lowerMsg.includes('look')) {
      return calendarKnowledgeBase.views;
    } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      return "Hello! I'm your Calendar Assistant. I can help you understand how to use this calendar application. What would you like to know?";
    } else if (lowerMsg.includes('thank')) {
      return "You're welcome! Is there anything else about the calendar you'd like to know?";
    } else if (lowerMsg.includes('what is') || lowerMsg.includes('what are') || lowerMsg.includes('explain')) {
      return calendarKnowledgeBase.interface;
    } else if (lowerMsg.includes('where is') || lowerMsg.includes('how do i find')) {
      return calendarKnowledgeBase.navigate;
    }
    
    return `I'm here to help you with the calendar interface. Based on your question "${message}", I suggest asking about:
    • How to create events or reminders
    • Switching between different calendar views
    • Using the search functionality
    • Understanding the calendar grid
    
    Try asking something like "How do I create a new event?" or "What views are available?"`;
  };

  const handleSendMessage = (customMessage = null) => {
    const message = customMessage || inputValue.trim();
    if (!message) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    if (!customMessage) setInputValue('');
    
    // Show typing indicator
    setIsTyping(true);
    
    // Get bot response after delay
    setTimeout(() => {
      const response = getResponse(message);
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'bot',
        timestamp: new Date()
      };
      
      setIsTyping(false);
      setMessages(prev => [...prev, botMessage]);
    }, 800 + Math.random() * 400);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (text) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <button 
        className={`chatbot-toggle-btn ${isOpen ? 'chatbot-open' : ''}`}
        onClick={toggleChatbot}
        title="Ask about Calendar"
      >
        <span className="chat-icon">💬</span>
        
      </button>

      {/* Chatbot Container */}
      <div className={`chatbot-container ${isOpen ? 'chatbot-visible' : 'chatbot-hidden'}`}>
        {/* Chatbot Header */}
        <div className="chatbot-header">
          <h3>📅 Calendar Assistant</h3>
          <button className="close-btn" onClick={toggleChatbot}>×</button>
        </div>

        {/* Messages Area */}
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`message ${message.sender}-message`}>
              {formatMessage(message.text)}
              
              {/* Add quick suggestions to bot messages */}
              {message.sender === 'bot' && message.id === 1 && (
                <div className="quick-suggestions">
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="suggestion-btn"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="typing-indicator">
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about the calendar..."
            disabled={isTyping}
          />
          <button 
            onClick={() => handleSendMessage()} 
            disabled={isTyping || !inputValue.trim()}
          >
            Send
          </button>
        </div>
      </div>
    </>
  );
};

export default CalendarAssistant;