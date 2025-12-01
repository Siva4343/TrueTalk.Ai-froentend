// src/services/webrtc.js
export class WebRTCService {
  constructor() {
    this.localStream = null;
    this.remoteStream = null;
    this.peerConnection = null;
    this.isInitialized = false;
    this.onRemoteStreamCallback = null;
    this.onIceCandidateCallback = null;
    this.onConnectionStateCallback = null;
  }

  async initializeLocalStream() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Your browser does not support camera access');
      }

      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      this.isInitialized = true;
      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      
      if (error.name === 'OverconstrainedError') {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        this.isInitialized = true;
        return this.localStream;
      }
      
      throw error;
    }
  }

  createPeerConnection() {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ],
      sdpSemantics: 'unified-plan' // Use unified plan for better compatibility
    };
    
    this.peerConnection = new RTCPeerConnection(configuration);
    
    // Add local stream to connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });
    }

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream:', event.streams[1]);
      this.remoteStream = event.streams[1];
      
      if (this.onRemoteStreamCallback) {
        this.onRemoteStreamCallback(this.remoteStream);
      }
    };

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.onIceCandidateCallback) {
        this.onIceCandidateCallback(event.candidate);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection.connectionState);
      if (this.onConnectionStateCallback) {
        this.onConnectionStateCallback(this.peerConnection.connectionState);
      }
    };

    return this.peerConnection;
  }

  async createOffer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not created');
    }

    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      // Fix SDP setup attributes
      const fixedOffer = this.fixSDP(offer);
      await this.peerConnection.setLocalDescription(fixedOffer);
      return fixedOffer;
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }

  async createAnswer() {
    if (!this.peerConnection) {
      throw new Error('Peer connection not created');
    }

    try {
      const answer = await this.peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      // Fix SDP setup attributes
      const fixedAnswer = this.fixSDP(answer);
      await this.peerConnection.setLocalDescription(fixedAnswer);
      return fixedAnswer;
    } catch (error) {
      console.error('Error creating answer:', error);
      throw error;
    }
  }

  async setRemoteDescription(description) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not created');
    }

    try {
      // Fix the remote description before setting it
      const fixedDescription = this.fixSDP(description);
      await this.peerConnection.setRemoteDescription(fixedDescription);
    } catch (error) {
      console.error('Error setting remote description:', error);
      throw error;
    }
  }

  // Fix SDP to handle setup attribute compatibility
  fixSDP(sdp) {
    if (!sdp.sdp) return sdp;
    
    let sdpText = sdp.sdp;
    
    // Fix setup attributes - ensure they're consistent
    sdpText = sdpText.replace(/a=setup:.*\r\n/g, 'a=setup:actpass\r\n');
    
    // Ensure proper ice-options
    sdpText = sdpText.replace(/a=ice-options:.*\r\n/g, 'a=ice-options:trickle\r\n');
    
    // Remove any invalid lines that might cause issues
    sdpText = sdpText.split('\r\n')
      .filter(line => {
        // Remove empty lines and keep valid SDP lines
        return line.trim() !== '' && 
               !line.includes('a=mid:data') && // Remove data channels if present
               !line.includes('m=application'); // Remove application media lines
      })
      .join('\r\n') + '\r\n';
    
    return {
      type: sdp.type,
      sdp: sdpText
    };
  }

  async addIceCandidate(candidate) {
    if (!this.peerConnection) {
      throw new Error('Peer connection not created');
    }

    try {
      await this.peerConnection.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      throw error;
    }
  }

  // Callbacks
  onRemoteStream(callback) {
    this.onRemoteStreamCallback = callback;
  }

  onIceCandidate(callback) {
    this.onIceCandidateCallback = callback;
  }

  onConnectionState(callback) {
    this.onConnectionStateCallback = callback;
  }

  stopLocalStream() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
      this.isInitialized = false;
    }
  }

  closeConnection() {
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    this.remoteStream = null;
  }

  toggleVideo() {
    const videoTracks = this.getVideoTracks();
    videoTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    return videoTracks.some(track => track.enabled);
  }

  toggleAudio() {
    const audioTracks = this.getAudioTracks();
    audioTracks.forEach(track => {
      track.enabled = !track.enabled;
    });
    return audioTracks.some(track => track.enabled);
  }

  getVideoTracks() {
    return this.localStream ? this.localStream.getVideoTracks() : [];
  }

  getAudioTracks() {
    return this.localStream ? this.localStream.getAudioTracks() : [];
  }
}