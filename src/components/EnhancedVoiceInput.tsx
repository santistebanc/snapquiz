import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, Wifi, WifiOff } from 'lucide-react';
import { Button } from './ui/button';
import { LemonfoxSpeechRecognition, isLemonfoxAvailable, isMobileDevice } from '../utils/lemonfoxSpeechRecognition';

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    mozSpeechRecognition: any;
    msSpeechRecognition: any;
  }
}

interface EnhancedVoiceInputProps {
  onTranscript: (text: string) => void;
  isActive: boolean;
  disabled?: boolean;
  autoStart?: boolean;
  onSubmit?: () => void;
}

export function EnhancedVoiceInput({ 
  onTranscript, 
  isActive, 
  disabled = false, 
  autoStart = false, 
  onSubmit 
}: EnhancedVoiceInputProps) {
  
  const [isSupported, setIsSupported] = useState(false);
  const [useLemonfox, setUseLemonfox] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isWaitingForSilence, setIsWaitingForSilence] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const recognitionRef = useRef<any>(null);
  const lemonfoxRef = useRef<LemonfoxSpeechRecognition | null>(null);
  const submitTimeoutRef = useRef<number | null>(null);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const initializeSpeechRecognition = () => {
      console.log('Initializing speech recognition...');
      // Check for browser speech recognition
      const SpeechRecognition = window.SpeechRecognition || 
                               window.webkitSpeechRecognition ||
                               (window as any).mozSpeechRecognition ||
                               (window as any).msSpeechRecognition;
      
      const hasLemonfox = isLemonfoxAvailable() && 
        typeof window !== 'undefined' && 
        (window as any).LEMONFOX_API_KEY && 
        (window as any).LEMONFOX_API_KEY !== 'undefined';
      
      console.log('Speech recognition check:', { 
        hasBrowserRecognition: !!SpeechRecognition, 
        hasLemonfox, 
        lemonfoxApiKey: (window as any).LEMONFOX_API_KEY 
      });
      
      if (hasLemonfox) {
        // Use LEMONFOX as primary method
        console.log('Using LEMONFOX speech recognition');
        setIsSupported(true);
        setUseLemonfox(true);
        setupLemonfoxRecognition();
      } else if (SpeechRecognition) {
        // Fall back to browser speech recognition
        console.log('Using browser speech recognition');
        setIsSupported(true);
        setUseLemonfox(false);
        setupBrowserRecognition(SpeechRecognition);
      } else {
        console.log('No speech recognition available');
        const errorMessage = "Speech recognition is not available. Please configure LEMONFOX_API_KEY or use a supported browser (Chrome, Edge, Safari).";
        setError(errorMessage);
      }
    };

    initializeSpeechRecognition();
  }, []);

  const setupBrowserRecognition = (SpeechRecognition: any) => {
    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
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
      
      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);
      
      if (finalTranscript) {
        onTranscript(finalTranscript);
        handleAutoSubmit();
      } else {
        // Reset waiting state when new speech is detected
        setIsWaitingForSilence(false);
        if (submitTimeoutRef.current) {
          clearTimeout(submitTimeoutRef.current);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
      setIsWaitingForSilence(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  const setupLemonfoxRecognition = () => {
    const apiKey = typeof window !== 'undefined' ? (window as any).LEMONFOX_API_KEY : null;
    if (!apiKey) {
      setError('LEMONFOX API key not configured');
      return;
    }

    lemonfoxRef.current = new LemonfoxSpeechRecognition({
      apiKey,
      language: 'english',
      onTranscript: (text) => {
        setTranscript(text);
        onTranscript(text);
        handleAutoSubmit();
      },
      onError: (error) => {
        setError(error);
        setIsListening(false);
        setIsWaitingForSilence(false);
      },
      onStart: () => {
        setIsListening(true);
        setError(null);
      },
      onStop: () => {
        setIsListening(false);
      }
    });
  };

  const handleAutoSubmit = () => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    
    setIsWaitingForSilence(true);
    
    submitTimeoutRef.current = window.setTimeout(() => {
      setIsWaitingForSilence(false);
      if (onSubmit) {
        onSubmit();
      }
    }, 1500); // Auto-submit after 1.5 seconds of silence
  };

  const startListening = () => {
    console.log('startListening called:', { isSupported, disabled, useLemonfox, hasLemonfoxRef: !!lemonfoxRef.current, hasRecognitionRef: !!recognitionRef.current });
    if (!isSupported || disabled) {
      console.log('Not starting - not supported or disabled');
      return;
    }
    
    setError(null);
    setTranscript('');
    
    if (useLemonfox && lemonfoxRef.current) {
      console.log('Starting LEMONFOX recording...');
      lemonfoxRef.current.startRecording();
    } else if (recognitionRef.current) {
      console.log('Starting browser speech recognition...');
      recognitionRef.current.start();
    } else {
      console.log('No speech recognition method available');
    }
  };

  const stopListening = () => {
    if (useLemonfox && lemonfoxRef.current) {
      lemonfoxRef.current.stopRecording();
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    setIsWaitingForSilence(false);
  };

  const handleSubmit = () => {
    if (transcript.trim()) {
      onTranscript(transcript);
      if (onSubmit) {
        onSubmit();
      }
    }
  };

  // Auto-start when active, auto-stop when inactive
  useEffect(() => {
    console.log('EnhancedVoiceInput useEffect:', { isActive, isSupported, isListening, disabled });
    if (isActive && isSupported && !isListening && !disabled) {
      console.log('Starting voice recording...');
      startListening();
    } else if (!isActive && isListening) {
      console.log('Stopping voice recording...');
      stopListening();
    }
  }, [isActive, isSupported, isListening, disabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      if (lemonfoxRef.current) {
        lemonfoxRef.current.destroy();
      }
    };
  }, []);

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="w-4 h-4 text-red-500" />;
    if (useLemonfox) return <Wifi className="w-4 h-4 text-blue-500" />;
    return <Volume2 className="w-4 h-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (useLemonfox) return "Using Enhanced Recognition";
    return "Using Browser API";
  };

  return (
    <div className="space-y-4">
      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm text-warm-cream/80">
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>

      {/* Error message */}
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 p-2 rounded-lg">
          {error}
        </div>
      )}

      {/* Transcript display */}
      {transcript && (
        <div className="bg-card-dark/60 p-3 rounded-lg border border-border-muted/30">
          <p className="text-sm text-warm-cream/80 mb-1">Transcript:</p>
          <p className="text-sm text-warm-cream">{transcript}</p>
        </div>
      )}

      {/* Auto-submit indicators */}
      {transcript && onSubmit && (
        <div className="text-center">
          {isWaitingForSilence ? (
            <div className="flex items-center justify-center gap-2 text-sm text-warm-yellow">
              <div className="w-2 h-2 bg-warm-yellow rounded-full animate-pulse"></div>
              <span>Listening for more speech... will submit in 1.5s if you stop speaking</span>
            </div>
          ) : (
            <p className="text-sm text-warm-cream/60 mb-2">
              Answer will be submitted automatically when time runs out
            </p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="text-xs text-warm-cream/60">
        {useLemonfox 
          ? "Using LEMONFOX (primary method) for high-quality speech recognition. Speak clearly and wait for processing."
          : "Using browser speech recognition (fallback). Speak clearly into your microphone."
        }
      </div>
    </div>
  );
}
