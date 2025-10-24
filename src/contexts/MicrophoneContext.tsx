import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { LemonfoxSpeechRecognition } from '../utils/lemonfoxSpeechRecognition';
import { isLemonfoxAvailable } from '../utils/lemonfoxSpeechRecognition';
import { LemonfoxOpenAI, isLemonfoxOpenAIAvailable } from '../utils/lemonfoxOpenAI';

interface MicrophoneContextType {
  // State
  isListening: boolean;
  isSupported: boolean;
  useLemonfox: boolean;
  transcript: string;
  error: string | null;
  isOnline: boolean;
  isWaitingForSilence: boolean;
  
  // Actions
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearTranscript: () => void;
  clearError: () => void;
  setSubmitCallback: (callback: (transcript: string) => void) => void;
  
  // Status
  getStatusText: () => string;
  getStatusIcon: () => React.ReactNode;
}

const MicrophoneContext = createContext<MicrophoneContextType | null>(null);

export function MicrophoneProvider({ children }: { children: React.ReactNode }) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [useLemonfox, setUseLemonfox] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isWaitingForSilence, setIsWaitingForSilence] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const lemonfoxRef = useRef<LemonfoxSpeechRecognition | null>(null);
  const submitCallbackRef = useRef<((transcript: string) => void) | null>(null);
  const lemonfoxOpenAIRef = useRef<LemonfoxOpenAI | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
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
      
      // Check for browser speech recognition
      const SpeechRecognition = window.SpeechRecognition || 
                               window.webkitSpeechRecognition ||
                               (window as any).mozSpeechRecognition ||
                               (window as any).msSpeechRecognition;
      
      const hasLemonfox = isLemonfoxOpenAIAvailable();
      const hasLemonfoxLegacy = isLemonfoxAvailable() && 
        typeof window !== 'undefined' && 
        (window as any).LEMONFOX_API_KEY && 
        (window as any).LEMONFOX_API_KEY !== 'undefined';
      
      
      if (hasLemonfox) {
        setIsSupported(true);
        setUseLemonfox(true);
        setupLemonfoxOpenAI();
      } else if (hasLemonfoxLegacy) {
        setIsSupported(true);
        setUseLemonfox(true);
        setupLemonfoxRecognition();
      } else if (SpeechRecognition) {
        setIsSupported(true);
        setUseLemonfox(false);
        setupBrowserRecognition(SpeechRecognition);
      } else {
        const errorMessage = "Speech recognition is not available. Please configure LEMONFOX_API_KEY or use a supported browser (Chrome, Edge, Safari).";
        setError(errorMessage);
      }
    };

    initializeSpeechRecognition();
  }, []);

  const setupBrowserRecognition = (SpeechRecognition: any) => {
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      console.log('MicrophoneContext: Browser speech recognition started');
      setIsListening(true);
      setError(null);
    };

    recognitionRef.current.onresult = (event: any) => {
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
        // Clean quotes from transcript
        const cleanText = finalTranscript.replace(/^"|"$/g, '').trim();
        // Call submit callback if set
        if (submitCallbackRef.current) {
          submitCallbackRef.current(cleanText);
          submitCallbackRef.current = null; // Clear after use
        }
        handleAutoSubmit();
      } else {
        // Reset waiting state when new speech is detected
        setIsWaitingForSilence(false);
        if (submitTimeoutRef.current) {
          clearTimeout(submitTimeoutRef.current);
        }
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('MicrophoneContext: Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
      setIsWaitingForSilence(false);
    };

    recognitionRef.current.onend = () => {
      console.log('MicrophoneContext: Browser speech recognition ended');
      setIsListening(false);
    };
  };

  const setupLemonfoxOpenAI = () => {
    const apiKey = typeof window !== 'undefined' ? (window as any).LEMONFOX_API_KEY : null;
    if (!apiKey) {
      setError('LEMONFOX API key not configured');
      return;
    }

    lemonfoxOpenAIRef.current = new LemonfoxOpenAI(apiKey);
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
        // Clean quotes from transcript
        const cleanText = text.replace(/^"|"$/g, '').trim();
        setTranscript(cleanText);
        // Call submit callback if set
        if (submitCallbackRef.current) {
          submitCallbackRef.current(cleanText);
          submitCallbackRef.current = null; // Clear after use
        }
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

  const startLemonfoxOpenAIRecording = async () => {
    try {
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });

      // Create MediaRecorder with optimal settings
      let mimeType = 'audio/webm;codecs=opus';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/mp3')) {
        mimeType = 'audio/mp3';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        mimeType = 'audio/wav';
      }
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: mimeType
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        try {
          const transcription = await lemonfoxOpenAIRef.current!.transcribeAudio(audioBlob);
          // Clean quotes from transcript
          const cleanText = transcription.replace(/^"|"$/g, '').trim();
          setTranscript(cleanText);
          // Call submit callback if set
          if (submitCallbackRef.current) {
            submitCallbackRef.current(cleanText);
            submitCallbackRef.current = null; // Clear after use
          }
          handleAutoSubmit();
        } catch (error) {
          setError(`Transcription failed: ${error}`);
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        setIsListening(false);
      };

      mediaRecorderRef.current.start();
      setIsListening(true);
      setError(null);
      
    } catch (error) {
      setError(`Failed to start recording: ${error}`);
      setIsListening(false);
    }
  };

  const handleAutoSubmit = () => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    
    setIsWaitingForSilence(true);
    
    submitTimeoutRef.current = window.setTimeout(() => {
      setIsWaitingForSilence(false);
      // Note: Auto-submit logic would be handled by the component using the context
    }, 1500); // Auto-submit after 1.5 seconds of silence
  };

  const startListening = useCallback(async () => {
    
    if (!isSupported) {
      setError('Speech recognition not supported');
      return;
    }
    
    setError(null);
    setTranscript('');
    
    if (useLemonfox && lemonfoxOpenAIRef.current) {
      await startLemonfoxOpenAIRecording();
    } else if (useLemonfox && lemonfoxRef.current) {
      console.log('MicrophoneContext: Starting LEMONFOX legacy recording...');
      await lemonfoxRef.current.startRecording();
    } else if (recognitionRef.current) {
      console.log('MicrophoneContext: Starting browser speech recognition...');
      recognitionRef.current.start();
    } else {
      console.log('MicrophoneContext: No speech recognition method available');
      setError('No speech recognition method available');
    }
  }, [isSupported, useLemonfox]);

  const stopListening = useCallback(() => {
    console.log('MicrophoneContext: stopListening called');
    
    if (useLemonfox && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('MicrophoneContext: Stopping LEMONFOX OpenAI SDK recording...');
      mediaRecorderRef.current.stop();
    } else if (useLemonfox && lemonfoxRef.current) {
      lemonfoxRef.current.stopRecording();
    } else if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    setIsWaitingForSilence(false);
  }, [useLemonfox]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setSubmitCallback = useCallback((callback: (transcript: string) => void) => {
    submitCallbackRef.current = callback;
  }, []);

  const getStatusText = useCallback(() => {
    if (!isOnline) return "Offline";
    if (useLemonfox) return "Using Enhanced Recognition";
    return "Using Browser API";
  }, [isOnline, useLemonfox]);

  const getStatusIcon = useCallback(() => {
    if (!isOnline) return "❌";
    if (useLemonfox) return "📶";
    return "🌐";
  }, [isOnline, useLemonfox]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      if (lemonfoxRef.current) {
        lemonfoxRef.current.destroy();
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const value: MicrophoneContextType = {
    // State
    isListening,
    isSupported,
    useLemonfox,
    transcript,
    error,
    isOnline,
    isWaitingForSilence,
    
    // Actions
    startListening,
    stopListening,
    clearTranscript,
    clearError,
    setSubmitCallback,
    
    // Status
    getStatusText,
    getStatusIcon,
  };

  return (
    <MicrophoneContext.Provider value={value}>
      {children}
    </MicrophoneContext.Provider>
  );
}

export function useMicrophone() {
  const context = useContext(MicrophoneContext);
  if (!context) {
    throw new Error('useMicrophone must be used within a MicrophoneProvider');
  }
  return context;
}
