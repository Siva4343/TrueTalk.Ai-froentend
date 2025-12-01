// src/services/signaling.js
import { WS_CONFIG } from '../config/constants.js';

export class SignalingService {
  constructor() {
    this.socket = null;
    this.roomName = null;
    this.callbacks = {
      onOffer: null,
      onAnswer: null,
      onIceCandidate: null,
      onJoin: null,
      onLeave: null,
      onError: null,
    };
  }

  connect(roomName) {
    return new Promise((resolve, reject) => {
      this.roomName = roomName;

      // Connect to Django WebSocket
      const wsUrl = `${WS_CONFIG.BASE_URL}/ws/call/${roomName}/`;
      console.log('🔗 Connecting to WebSocket:', wsUrl);

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('✅ WebSocket connected');
        this.send({ type: 'join_call' });
        resolve();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Error parsing message:', error);
        }
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        if (this.callbacks.onError) {
          this.callbacks.onError(error);
        }
        reject(error);
      };

      this.socket.onclose = (event) => {
        console.log('🔌 WebSocket closed:', event.code, event.reason);
      };
    });
  }

  handleMessage(data) {
    switch (data.type) {
      case 'offer':
        if (this.callbacks.onOffer) {
          this.callbacks.onOffer(data);
        }
        break;

      case 'answer':
        if (this.callbacks.onAnswer) {
          this.callbacks.onAnswer(data);
        }
        break;

      case 'ice-candidate':
        if (this.callbacks.onIceCandidate) {
          this.callbacks.onIceCandidate(data.candidate);
        }
        break;

      case 'join_call':
        if (this.callbacks.onJoin) {
          this.callbacks.onJoin(data);
        }
        break;

      case 'leave_call':
        if (this.callbacks.onLeave) {
          this.callbacks.onLeave(data);
        }
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('❌ WebSocket not connected');
    }
  }

  sendOffer(offer) {
    this.send({
      type: 'offer',
      sdp: offer.sdp,
      roomName: this.roomName
    });
  }

  sendAnswer(answer) {
    this.send({
      type: 'answer',
      sdp: answer.sdp,
      roomName: this.roomName
    });
  }

  sendIceCandidate(candidate) {
    this.send({
      type: 'ice-candidate',
      candidate: candidate,
      roomName: this.roomName
    });
  }

  sendCallEnd() {
    this.send({
      type: 'call_end',
      roomName: this.roomName
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
  }

  // Callback setters
  onOffer(callback) {
    this.callbacks.onOffer = callback;
  }

  onAnswer(callback) {
    this.callbacks.onAnswer = callback;
  }

  onIceCandidate(callback) {
    this.callbacks.onIceCandidate = callback;
  }

  onJoin(callback) {
    this.callbacks.onJoin = callback;
  }

  onLeave(callback) {
    this.callbacks.onLeave = callback;
  }

  onError(callback) {
    this.callbacks.onError = callback;
  }
}