// src/components/video-call/VideoCall.jsx
import { useEffect, useRef, useState } from 'react';
import { WebRTCService } from '../../services/webrtc.js';
import { SignalingService } from '../../services/signaling.js';
import { WS_CONFIG } from '../../config/constants.js';

export default function VideoCall() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [webrtcService, setWebrtcService] = useState(null);
  const [signalingService, setSignalingService] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [status, setStatus] = useState('Disconnected');
  const [connectionState, setConnectionState] = useState('disconnected');
  const [isCaller, setIsCaller] = useState(false);
  const [roomName, setRoomName] = useState('demo-room-123');
  const [hasRemoteJoined, setHasRemoteJoined] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize services
  useEffect(() => {
    const webrtc = new WebRTCService();
    const signaling = new SignalingService();

    setWebrtcService(webrtc);
    setSignalingService(signaling);

    return () => {
      webrtc.stopLocalStream();
      webrtc.closeConnection();
      signaling.disconnect();
    };
  }, []);

  // Set up signaling callbacks
  useEffect(() => {
    if (!signalingService) return;

    signalingService.onOffer(async (offerData) => {
      console.log('📥 Received offer:', offerData);
      setStatus('Received call offer');
      setHasRemoteJoined(true);

      if (webrtcService?.peerConnection) {
        try {
          await webrtcService.setRemoteDescription({
            type: 'offer',
            sdp: offerData.sdp
          });

          const answer = await webrtcService.createAnswer();
          signalingService.sendAnswer(answer);
          setStatus('Sent answer to caller');
        } catch (err) {
          setError(`Error handling offer: ${err.message}`);
        }
      }
    });

    signalingService.onAnswer(async (answerData) => {
      console.log('📥 Received answer:', answerData);
      setStatus('Received answer');

      if (webrtcService?.peerConnection) {
        try {
          await webrtcService.setRemoteDescription({
            type: 'answer',
            sdp: answerData.sdp
          });
          setStatus('Remote description set');
        } catch (err) {
          setError(`Error handling answer: ${err.message}`);
        }
      }
    });

    signalingService.onIceCandidate(async (candidate) => {
      console.log('📥 Received ICE candidate');

      if (webrtcService?.peerConnection && candidate) {
        try {
          await webrtcService.addIceCandidate(candidate);
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    signalingService.onJoin((data) => {
      console.log('👤 Remote user joined');
      setHasRemoteJoined(true);
      setStatus('Remote participant joined');
    });

    signalingService.onError((error) => {
      setError(`Signaling error: ${error.message}`);
    });

  }, [signalingService, webrtcService]);

  const initializeWebRTC = async () => {
    try {
      setIsLoading(true);
      setError('');
      setStatus('Initializing...');

      const stream = await webrtcService.initializeLocalStream();
      setLocalStream(stream);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      webrtcService.createPeerConnection();

      webrtcService.onRemoteStream((stream) => {
        console.log('Remote stream received:', stream);
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setStatus('Connected to remote participant');
        setConnectionState('connected');
      });

      webrtcService.onIceCandidate((candidate) => {
        console.log('New ICE candidate generated');
        if (signalingService && candidate) {
          signalingService.sendIceCandidate(candidate);
        }
      });

      webrtcService.onConnectionState((state) => {
        setConnectionState(state);
        if (state === 'connected') {
          setStatus('Call connected');
        } else if (state === 'disconnected') {
          setStatus('Call disconnected');
        } else if (state === 'failed') {
          setStatus('Connection failed');
        }
      });

      await signalingService.connect(roomName);
      setStatus('Connected to signaling server - Ready for call');

    } catch (err) {
      setError(`Initialization error: ${err.message}`);
      setStatus('Error');
      console.error('WebRTC initialization failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const startCall = async () => {
    if (!webrtcService?.peerConnection) {
      setError('Please initialize camera first');
      return;
    }

    try {
      setIsCaller(true);
      setStatus('Creating offer...');

      const offer = await webrtcService.createOffer();
      signalingService.sendOffer(offer);

      console.log('Offer created and sent');
      setStatus('Offer sent - waiting for answer');

    } catch (err) {
      setError(`Call error: ${err.message}`);
    }
  };

  const stopCall = () => {
    webrtcService.stopLocalStream();
    webrtcService.closeConnection();
    signalingService.sendCallEnd();
    signalingService.disconnect();

    setLocalStream(null);
    setRemoteStream(null);
    setStatus('Call ended');
    setConnectionState('disconnected');
    setIsCaller(false);
    setHasRemoteJoined(false);

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const toggleVideo = () => {
    if (webrtcService) {
      const enabled = webrtcService.toggleVideo();
      setVideoEnabled(enabled);
    }
  };

  const toggleAudio = () => {
    if (webrtcService) {
      const enabled = webrtcService.toggleAudio();
      setAudioEnabled(enabled);
    }
  };

  const testWebSocket = async () => {
    try {
      setStatus('Testing WebSocket connection...');
      const ws = new WebSocket(`${WS_CONFIG.BASE_URL}/ws/call/${roomName}/`);

      ws.onopen = () => {
        setStatus('✅ WebSocket connection successful!');
        ws.close();
      };

      ws.onerror = (error) => {
        setError(`❌ WebSocket error: ${error}`);
        setStatus('WebSocket test failed');
      };

    } catch (err) {
      setError(`WebSocket test error: ${err.message}`);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Video Call</h2>
              <p className="text-blue-100 text-sm">High quality video conferencing</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition-all duration-300 ${connectionState === 'connected'
              ? 'bg-green-500 text-white'
              : status.includes('Error') || status.includes('failed')
                ? 'bg-red-500 text-white'
                : status.includes('Ready') || status.includes('successful')
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/20 text-white backdrop-blur-sm'
            }`}>
            <div className="flex items-center space-x-2">
              {connectionState === 'connected' && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              )}
              <span>{status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-800 px-5 py-4 rounded-lg shadow-sm animate-pulse">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Room Information Card */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span className="text-sm font-medium text-gray-600">Room:</span>
                <span className="font-mono font-semibold text-gray-900 bg-white px-3 py-1 rounded-lg text-sm">{roomName}</span>
              </div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${hasRemoteJoined ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                <span className="text-sm font-medium text-gray-600">Remote:</span>
                <span className={`font-semibold text-sm ${hasRemoteJoined ? 'text-green-600' : 'text-gray-500'}`}>
                  {hasRemoteJoined ? 'Connected' : 'Waiting...'}
                </span>
              </div>
            </div>
            <button
              onClick={testWebSocket}
              className="flex items-center space-x-2 text-sm bg-white hover:bg-gray-50 text-gray-700 font-medium px-4 py-2 rounded-lg border border-gray-200 transition-all hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Test Connection</span>
            </button>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={initializeWebRTC}
            disabled={isLoading || localStream}
            className="flex-1 min-w-[200px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Initializing...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Initialize Camera & Connect</span>
              </div>
            )}
          </button>

          <button
            onClick={startCall}
            disabled={!localStream || connectionState === 'connected' || !hasRemoteJoined}
            className="flex-1 min-w-[150px] bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>Start Call</span>
            </div>
          </button>

          <button
            onClick={stopCall}
            disabled={!localStream}
            className="flex-1 min-w-[150px] bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>End Call</span>
            </div>
          </button>
        </div>

        {/* Media Controls */}
        {localStream && (
          <div className="flex gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <button
              onClick={toggleVideo}
              className={`flex-1 ${videoEnabled
                  ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600'
                } font-medium px-5 py-3 rounded-lg transition-all border-2 shadow-sm hover:shadow-md`}
            >
              <div className="flex items-center justify-center space-x-2">
                {videoEnabled ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                )}
                <span>{videoEnabled ? 'Video On' : 'Video Off'}</span>
              </div>
            </button>

            <button
              onClick={toggleAudio}
              className={`flex-1 ${audioEnabled
                  ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-600'
                } font-medium px-5 py-3 rounded-lg transition-all border-2 shadow-sm hover:shadow-md`}
            >
              <div className="flex items-center justify-center space-x-2">
                {audioEnabled ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                  </svg>
                )}
                <span>{audioEnabled ? 'Audio On' : 'Audio Off'}</span>
              </div>
            </button>

            <button
              onClick={toggleFullscreen}
              className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 font-medium px-5 py-3 rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        )}

        {/* Video Grid */}
        <div className={`grid ${isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'} gap-6`}>
          {/* Local Video */}
          {(!isFullscreen || !remoteStream) && (
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-1 border-2 border-gray-200 shadow-lg overflow-hidden transform transition-all hover:shadow-2xl">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Your Camera {isCaller && <span className="text-blue-600">(Caller)</span>}</span>
                  </h3>
                  {localStream && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">LIVE</span>
                  )}
                </div>
                <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden relative shadow-inner">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {!localStream && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 backdrop-blur-sm bg-black/20">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl">
                          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-white font-medium">Click Initialize Camera to start</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Remote Video */}
          {(!isFullscreen || remoteStream) && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-1 border-2 border-indigo-200 shadow-lg overflow-hidden transform transition-all hover:shadow-2xl">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${remoteStream ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span>Remote Participant {!isCaller && hasRemoteJoined && <span className="text-indigo-600">(Caller)</span>}</span>
                  </h3>
                  {remoteStream && (
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full flex items-center space-x-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <span>LIVE</span>
                    </span>
                  )}
                </div>
                <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden relative shadow-inner">
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {!remoteStream && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400 backdrop-blur-sm bg-black/20">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
                          {hasRemoteJoined ? (
                            <div className="relative">
                              <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                          ) : (
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {hasRemoteJoined ? 'Connecting video...' : 'Waiting for participant...'}
                          </p>
                          {hasRemoteJoined && (
                            <p className="text-blue-300 text-sm mt-2">Establishing peer connection</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Debug Information */}
        <details className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
          <summary className="font-semibold text-gray-700 cursor-pointer px-5 py-4 hover:bg-gray-100 transition-colors flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Debug Information</span>
          </summary>
          <div className="px-5 py-4 bg-white border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h5 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>WebRTC State</span>
                </h5>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-600">Peer Connection:</span>
                    <span className={`font-semibold ${webrtcService?.peerConnection ? 'text-green-600' : 'text-red-600'}`}>
                      {webrtcService?.peerConnection ? '✓ Created' : '✗ Not created'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Local Stream:</span>
                    <span className={`font-semibold ${localStream ? 'text-green-600' : 'text-red-600'}`}>
                      {localStream ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Remote Stream:</span>
                    <span className={`font-semibold ${remoteStream ? 'text-green-600' : 'text-red-600'}`}>
                      {remoteStream ? '✓ Active' : '✗ Inactive'}
                    </span>
                  </p>
                </div>
              </div>
              <div>
                <h5 className="font-bold text-gray-800 mb-3 flex items-center space-x-2">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span>Signaling State</span>
                </h5>
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-gray-600">WebSocket:</span>
                    <span className={`font-semibold ${signalingService?.socket?.readyState === 1 ? 'text-green-600' : 'text-red-600'}`}>
                      {signalingService?.socket?.readyState === 1 ? '✓ Connected' : '✗ Disconnected'}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Room:</span>
                    <span className="font-mono font-semibold text-gray-900">{roomName}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <span className="font-semibold text-gray-900">{isCaller ? '📞 Caller' : '📱 Callee'}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-gray-600">Connection:</span>
                    <span className={`font-semibold ${connectionState === 'connected' ? 'text-green-600' :
                        connectionState === 'failed' ? 'text-red-600' : 'text-yellow-600'
                      }`}>
                      {connectionState}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
}