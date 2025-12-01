// src/config/constants.js

// WebSocket Configuration
export const WS_CONFIG = {
    // Change this to your Django backend URL
    BASE_URL: 'ws://127.0.0.1:8000',  // ← Update this if your backend is on different host/port

    // Alternative configurations (uncomment the one you need):
    // BASE_URL: 'ws://localhost:8000',           // Local development
    // BASE_URL: 'ws://192.168.1.100:8000',       // Local network
    // BASE_URL: 'wss://your-domain.com',         // Production (secure WebSocket)

    // Room configuration
    DEFAULT_ROOM: 'demo-room-123',

    // Connection settings
    RECONNECT_INTERVAL: 3000,  // 3 seconds
    MAX_RECONNECT_ATTEMPTS: 5,
};

// API Configuration
export const API_CONFIG = {
    BASE_URL: 'http://127.0.0.1:8000/api',  // ← Update this too

    // Alternative configurations:
    // BASE_URL: 'http://localhost:8000/api',
    // BASE_URL: 'https://your-domain.com/api',
};

// STUN/TURN Server Configuration
export const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
];

// App Configuration
export const APP_CONFIG = {
    APP_NAME: 'TrueTalk.AI',
    VERSION: '2.0.0',
    DEBUG: true,  // Set to false in production
};
