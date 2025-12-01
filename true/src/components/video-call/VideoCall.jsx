// src/components/video-call/VideoCall.jsx
import { useEffect, useRef, useState } from 'react';
import { WebRTCService } from '../../services/webrtc.js';

export default function VideoCall() {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [webrtcService, setWebrtcService] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [status, setStatus] = useState('Disconnected');
  const [connectionState, setConnectionState] = useState('disconnected');
  const [isCaller, setIsCaller] = useState(false);
  const [signalingData, setSignalingData] = useState({
    offer: null,
    answer: null,
    iceCandidates: []
  });

  useEffect(() => {
    const service = new WebRTCService();
    setWebrtcService(service);

    return () => {
      service.stopLocalStream();
      service.closeConnection();
    };
  }, []);

  const initializeWebRTC = async () => {
    try {
      setIsLoading(true);
      setError('');
      setStatus('Initializing...');
      
      // Initialize local stream
      const stream = await webrtcService.initializeLocalStream();
      setLocalStream(stream);
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      webrtcService.createPeerConnection();
      
      // Set up callbacks
      webrtcService.onRemoteStream((stream) => {
        console.log('Remote stream received:', stream);
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setStatus('Connected to remote participant');
      });

      webrtcService.onIceCandidate((candidate) => {
        console.log('New ICE candidate:', candidate);
        setSignalingData(prev => ({
          ...prev,
          iceCandidates: [...prev.iceCandidates, candidate]
        }));
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

      setStatus('Ready for call');

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
      setSignalingData(prev => ({ ...prev, offer }));
      
      console.log('Offer created:', offer);
      setStatus('Offer created - waiting for answer');
      
      // In real app, send offer to signaling server
      // For demo, we'll simulate the answer process
      simulateAnswerProcess(offer);
      
    } catch (err) {
      setError(`Call error: ${err.message}`);
    }
  };

  const answerCall = async () => {
    if (!webrtcService?.peerConnection || !signalingData.offer) {
      setError('No offer to answer');
      return;
    }

    try {
      setIsCaller(false);
      setStatus('Answering call...');
      
      await webrtcService.setRemoteDescription(signalingData.offer);
      const answer = await webrtcService.createAnswer();
      
      setSignalingData(prev => ({ ...prev, answer }));
      console.log('Answer created:', answer);
      setStatus('Call answered - adding ICE candidates');
      
      // Simulate adding ICE candidates
      simulateIceCandidates();
      
    } catch (err) {
      setError(`Answer error: ${err.message}`);
    }
  };

  // Simulate the answering process (for demo purposes)
  const simulateAnswerProcess = async (offer) => {
    // In a real app, this would happen via signaling server
    setTimeout(() => {
      setStatus('Simulating remote answer...');
      
      // Create a simulated answer
      const simulatedAnswer = {
        type: 'answer',
        sdp: offer.sdp // Simplified for demo
      };
      
      setSignalingData(prev => ({ ...prev, answer: simulatedAnswer }));
      
      // Set the remote description
      webrtcService.setRemoteDescription(simulatedAnswer)
        .then(() => {
          setStatus('Remote description set - simulating ICE candidates');
          simulateIceCandidates();
        })
        .catch(err => setError(`Simulation error: ${err.message}`));
    }, 2000);
  };

  // Simulate ICE candidates exchange (for demo purposes)
  const simulateIceCandidates = () => {
    setTimeout(() => {
      setStatus('Exchanging ICE candidates...');
      
      // Simulate some ICE candidates
      const simulatedCandidates = [
        // This would be real ICE candidates in a production app
      ];
      
      simulatedCandidates.forEach(candidate => {
        webrtcService.addIceCandidate(candidate).catch(console.error);
      });
      
      setStatus('ICE candidates exchanged');
    }, 1000);
  };

  const stopCall = () => {
    webrtcService.stopLocalStream();
    webrtcService.closeConnection();
    setLocalStream(null);
    setRemoteStream(null);
    setStatus('Call ended');
    setConnectionState('disconnected');
    setIsCaller(false);
    setSignalingData({
      offer: null,
      answer: null,
      iceCandidates: []
    });
    
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Video Call</h2>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          connectionState === 'connected' ? 'bg-green-100 text-green-800' :
          status.includes('Error') ? 'bg-red-100 text-red-800' :
          status.includes('Ready') ? 'bg-blue-100 text-blue-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {status}
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={initializeWebRTC}
          disabled={isLoading || localStream}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Initializing...
            </>
          ) : (
            'Initialize Camera'
          )}
        </button>
        
        <button
          onClick={startCall}
          disabled={!localStream || connectionState === 'connected'}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Start Call
        </button>

        <button
          onClick={answerCall}
          disabled={!localStream || !signalingData.offer || connectionState === 'connected'}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Answer Call
        </button>
        
        <button
          onClick={stopCall}
          disabled={!localStream}
          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
        >
          End Call
        </button>
        
        <button
          onClick={toggleVideo}
          disabled={!localStream}
          className={`${
            videoEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
          } disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors`}
        >
          {videoEnabled ? 'Video On' : 'Video Off'}
        </button>
        
        <button
          onClick={toggleAudio}
          disabled={!localStream}
          className={`${
            audioEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
          } disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors`}
        >
          {audioEnabled ? 'Audio On' : 'Audio Off'}
        </button>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Local Video */}
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Your Camera {isCaller && '(Caller)'}</h3>
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!localStream && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p>Camera not started</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Remote Video */}
        <div className="bg-gray-50 rounded-lg p-4 border">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Remote Participant {!isCaller && '(Caller)'}
          </h3>
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {!remoteStream ? (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 bg-gray-200 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <p>{connectionState === 'connected' ? 'Connecting...' : 'Waiting for participant...'}</p>
                </div>
              </div>
            ) : (
              <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                Live
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Info */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-700 mb-2">Connection Information</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Local Stream:</span>
            <span className={`ml-2 font-medium ${localStream ? 'text-green-600' : 'text-red-600'}`}>
              {localStream ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Remote Stream:</span>
            <span className={`ml-2 font-medium ${remoteStream ? 'text-green-600' : 'text-gray-600'}`}>
              {remoteStream ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Connection:</span>
            <span className={`ml-2 font-medium ${
              connectionState === 'connected' ? 'text-green-600' :
              connectionState === 'connecting' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {connectionState}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Role:</span>
            <span className="ml-2 font-medium text-blue-600">
              {isCaller ? 'Caller' : 'Callee'}
            </span>
          </div>
        </div>
        
        {/* Signaling Data (for debugging) */}
        <div className="mt-3 text-xs text-gray-500">
          <p>Offer: {signalingData.offer ? 'Created' : 'None'}</p>
          <p>Answer: {signalingData.answer ? 'Received' : 'None'}</p>
          <p>ICE Candidates: {signalingData.iceCandidates.length}</p>
        </div>
      </div>
    </div>
  );
}