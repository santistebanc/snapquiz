import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

interface MicrophoneTestProps {
  isPlayerMode?: boolean;
}

export function MicrophoneTest({ isPlayerMode = false }: MicrophoneTestProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Check if speech recognition is supported
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for various speech recognition implementations
      const hasSpeechRecognition = 'SpeechRecognition' in window || 
                                   'webkitSpeechRecognition' in window ||
                                   'mozSpeechRecognition' in window ||
                                   'msSpeechRecognition' in window;
      
      const isMobile = navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone');
      
      if (hasSpeechRecognition) {
        setIsSupported(true);
        checkMicrophonePermission();
      } else {
        const errorMessage = isMobile 
          ? "Speech recognition is not supported in this mobile browser. Please use Chrome Mobile, Safari Mobile, or Edge Mobile."
          : "Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.";
        setError(errorMessage);
      }
    }
  }, []);

  // Check microphone permission
  const checkMicrophonePermission = async () => {
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermission(result.state);
      } else {
        // Fallback: try to access microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setPermission('granted');
        stream.getTracks().forEach(track => track.stop());
      }
    } catch (err) {
      setPermission('denied');
      setError("Microphone access denied");
    }
  };

  // Request microphone permission
  const requestPermission = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setPermission('granted');
      
      // Set up audio level monitoring
      setupAudioLevelMonitoring(stream);
      
      // Stop the stream after getting permission
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setPermission('denied');
      setError("Failed to access microphone. Please check your browser settings.");
    }
  };

  // Setup audio level monitoring
  const setupAudioLevelMonitoring = (stream: MediaStream) => {
    try {
      // Better AudioContext compatibility for Edge
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext || (window as any).mozAudioContext;
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      mediaStreamRef.current = stream;
      
      // Start monitoring audio levels
      monitorAudioLevel();
    } catch (err) {
      console.error('Error setting up audio monitoring:', err);
      setError("Failed to set up audio monitoring. This might be a browser compatibility issue.");
    }
  };

  // Monitor audio levels
  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const updateLevel = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
      setAudioLevel(average);
      
      if (isRecording) {
        animationFrameRef.current = requestAnimationFrame(updateLevel);
      }
    };
    
    updateLevel();
  };

  // Start listening
  const startListening = async () => {
    if (!isSupported) return;
    
    try {
      setError(null);
      setTranscript("");
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      setupAudioLevelMonitoring(stream);
      
      // Set up speech recognition with better browser compatibility
      const SpeechRecognition = window.SpeechRecognition || 
                               (window as any).webkitSpeechRecognition ||
                               (window as any).mozSpeechRecognition ||
                               (window as any).msSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        setIsRecording(true);
        monitorAudioLevel();
      };
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        setTranscript(finalTranscript || interimTranscript);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = '';
        switch (event.error) {
          case 'network':
            errorMessage = 'Network error: Speech recognition service is unavailable. Please check your internet connection or try again later.';
            break;
          case 'not-allowed':
            errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
            break;
          case 'no-speech':
            errorMessage = 'No speech detected. Please try speaking again.';
            break;
          case 'audio-capture':
            errorMessage = 'Audio capture error. Please check your microphone and try again.';
            break;
          case 'service-not-allowed':
            errorMessage = 'Speech recognition service not allowed. Please try again later.';
            break;
          case 'aborted':
            errorMessage = 'Speech recognition was aborted. Please try again.';
            break;
          default:
            errorMessage = `Speech recognition error: ${event.error}`;
        }
        
        setError(errorMessage);
        setIsListening(false);
        setIsRecording(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
        setIsRecording(false);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
      
      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (err) {
      setError("Failed to start microphone. Please check your permissions.");
      console.error('Microphone error:', err);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setIsListening(false);
    setIsRecording(false);
    setAudioLevel(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  if (!isSupported) {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
        <div className="flex items-center gap-2 text-red-400">
          <MicOff className="w-5 h-5" />
          <span className="font-semibold">Speech recognition not supported</span>
        </div>
        <p className="text-red-300/80 text-sm mt-1">
          Your browser doesn't support speech recognition. Please use Chrome, Edge, or Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Mic className="w-5 h-5 text-warm-yellow" />
        <h3 className="text-lg font-semibold text-warm-cream">Microphone Test</h3>
      </div>
      
      {/* Permission Status */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-warm-cream/80">Permission Status:</span>
          <span className={`text-sm font-medium px-2 py-1 rounded ${
            permission === 'granted' ? 'bg-green-500/20 text-green-400' :
            permission === 'denied' ? 'bg-red-500/20 text-red-400' :
            'bg-yellow-500/20 text-yellow-400'
          }`}>
            {permission === 'granted' ? 'Granted' :
             permission === 'denied' ? 'Denied' :
             'Not Requested'}
          </span>
        </div>
        
        {permission !== 'granted' && (
          <Button
            onClick={requestPermission}
            size="sm"
            className="bg-warm-yellow hover:bg-warm-yellow/90 text-deep-purple"
          >
            <Mic className="w-4 h-4 mr-2" />
            Request Microphone Access
          </Button>
        )}
      </div>

      {/* Audio Level Indicator */}
      {permission === 'granted' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-warm-cream/80">Audio Level:</span>
            <div className="flex-1 bg-card-dark/40 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-warm-yellow h-full rounded-full"
                style={{ width: `${Math.min(audioLevel * 2, 100)}%` }}
                transition={{ duration: 0.1 }}
              />
            </div>
            <span className="text-xs text-warm-cream/60 w-8 text-right">
              {Math.round(audioLevel)}
            </span>
          </div>
        </div>
      )}

      {/* Test Controls */}
      {permission === 'granted' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={isListening ? stopListening : startListening}
              size="sm"
              className={`${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-warm-orange hover:bg-warm-orange/90 text-white'
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 mr-2" />
                  Stop Test
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 mr-2" />
                  Start Test
                </>
              )}
            </Button>
            
            {transcript && (
              <Button
                onClick={() => setTranscript("")}
                size="sm"
                variant="outline"
                className="border-warm-cream/30 text-warm-cream hover:bg-warm-cream/10 bg-transparent"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="p-3 bg-card-dark/40 border border-border-muted/30 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-warm-yellow" />
                <span className="text-sm font-medium text-warm-cream">What I heard:</span>
              </div>
              <p className="text-warm-cream/90 text-sm">{transcript}</p>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 text-red-400">
            <MicOff className="w-4 h-4" />
            <span className="text-sm font-medium">Error</span>
          </div>
          <p className="text-red-300/80 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-warm-cream/60 space-y-1">
        <p>• Click "Request Microphone Access" to allow voice input</p>
        <p>• Use "Start Test" to check if your microphone is working</p>
        <p>• Speak clearly and watch the audio level indicator</p>
        <p>• Your spoken words should appear in the transcript</p>
        <p>• <strong>Mobile users:</strong> Ensure you're in a quiet environment and speak clearly</p>
        <p>• <strong>Mobile Chrome:</strong> Make sure no other apps are using the microphone</p>
        <p>• <strong>Edge users:</strong> If you experience issues, try refreshing the page or using Chrome</p>
        <p>• <strong>HTTPS required:</strong> Microphone access requires a secure connection</p>
      </div>
    </div>
  );
}
