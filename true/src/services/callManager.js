// src/services/callManager.js
import { WebRTCService } from './webrtc';
import { SignalingService } from './signaling';

export class CallManager {
  constructor() {
    this.webrtc = new WebRTCService();
    this.signaling = new SignalingService();
    this.roomName = null;
    this.userId = null;
    this.isCaller = false;
    this.isConnected = false;

    // Bind methods
    this.handleIceCandidate = this.handleIceCandidate.bind(this);
  }

  async startCall(roomName, userId, isCaller = false) {
    this.roomName = roomName;
    this.userId = userId;
    this.isCaller = isCaller;

    try {
      console.log('🚀 Starting call...');

      // 1. Get local media stream
      console.log('📹 Getting local media...');
      await this.webrtc.initializeLocalStream();

      // 2. Create peer connection
      console.log('🔗 Creating peer connection...');
      this.webrtc.createPeerConnection();

      // 3. Connect to signaling server
      console.log('📡 Connecting to signaling server...');
      await this.signaling.connect(roomName);

      // 4. Set up signaling callbacks
      this.setupSignalingCallbacks();
      this.webrtc.onIceCandidate(this.handleIceCandidate);

      // 5. If caller, create and send offer
      if (this.isCaller) {
        console.log('🎯 Creating offer (caller)...');
        await this.createAndSendOffer();
      }

      this.isConnected = true;
      console.log('✅ Call setup complete');
      return true;

    } catch (error) {
      console.error('❌ Failed to start call:', error);
      this.cleanup();
      throw error;
    }
  }

  setupSignalingCallbacks() {
    // Set up individual callbacks for signaling events
    this.signaling.onOffer((data) => this.handleOffer(data));
    this.signaling.onAnswer((data) => this.handleAnswer(data));
    this.signaling.onIceCandidate((candidate) => this.handleRemoteIceCandidate({ candidate }));
    this.signaling.onJoin((data) => console.log('Remote user joined:', data));
    this.signaling.onLeave((data) => this.handleCallEnd());
    this.signaling.onError((error) => console.error('Signaling error:', error));
  }

  async createAndSendOffer() {
    try {
      const offer = await this.webrtc.createOffer();
      console.log('📤 Sending offer:', offer.type);

      this.signaling.sendOffer(offer);
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async createAndSendAnswer() {
    try {
      const answer = await this.webrtc.createAnswer();
      console.log('📤 Sending answer:', answer.type);

      this.signaling.sendAnswer(answer);
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  async handleOffer(data) {
    console.log('📥 Received offer from:', data.userId || 'peer');

    if (!this.isCaller) {
      try {
        // Set remote description
        await this.webrtc.setRemoteDescription({
          type: 'offer',
          sdp: data.sdp
        });

        // Create and send answer
        await this.createAndSendAnswer();

      } catch (error) {
        console.error('Error handling offer:', error);
      }
    }
  }

  async handleAnswer(data) {
    console.log('📥 Received answer from:', data.userId || 'peer');

    if (this.isCaller) {
      try {
        await this.webrtc.setRemoteDescription({
          type: 'answer',
          sdp: data.sdp
        });
        console.log('✅ Answer accepted');
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }

  async handleRemoteIceCandidate(data) {
    console.log('📥 Received ICE candidate');

    try {
      await this.webrtc.addIceCandidate(data.candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }

  handleIceCandidate(candidate) {
    console.log('📤 Sending ICE candidate');

    this.signaling.sendIceCandidate(candidate);
  }

  handleCallEnd() {
    console.log('📞 Call ended by remote');
    this.endCall();
  }

  async joinCall(roomName, userId) {
    return this.startCall(roomName, userId, false);
  }

  endCall() {
    console.log('🛑 Ending call...');

    // Send end call signal
    if (this.signaling.socket && this.signaling.socket.readyState === WebSocket.OPEN) {
      this.signaling.sendCallEnd();
    }

    this.cleanup();
  }

  cleanup() {
    this.webrtc.closeConnection();
    this.webrtc.stopLocalStream();
    this.signaling.disconnect();

    this.isConnected = false;
    console.log('🧹 Cleanup complete');
  }

  // Proxy methods to WebRTCService
  onRemoteStream(callback) {
    this.webrtc.onRemoteStream(callback);
  }

  onConnectionState(callback) {
    this.webrtc.onConnectionState(callback);
  }

  toggleVideo() {
    return this.webrtc.toggleVideo();
  }

  toggleAudio() {
    return this.webrtc.toggleAudio();
  }

  getLocalStream() {
    return this.webrtc.localStream;
  }

  getRemoteStream() {
    return this.webrtc.remoteStream;
  }
}

// Singleton instance
export const callManager = new CallManager();