import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { OpenAISpeechRecognition, isOpenAISpeechRecognitionAvailable } from '../utils/openaiSpeechRecognition';
import { useGameStore } from '../store';

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
  const { gameState } = useGameStore();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isWaitingForSilence, setIsWaitingForSilence] = useState(false);
  
  const openAIRef = useRef<OpenAISpeechRecognition | null>(null);
  const submitCallbackRef = useRef<((transcript: string) => void) | null>(null);
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

  const handleAutoSubmit = useCallback(() => {
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    
    setIsWaitingForSilence(true);
    
    submitTimeoutRef.current = window.setTimeout(() => {
      setIsWaitingForSilence(false);
      // Note: Auto-submit logic would be handled by the component using the context
    }, 1500); // Auto-submit after 1.5 seconds of silence
  }, []);

  const setupOpenAIRecognition = useCallback(() => {
    openAIRef.current = new OpenAISpeechRecognition({
      language: gameState.settings?.language || 'American',
      getLanguage: () => gameState.settings?.language || 'American', // Always get current language
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
  }, [gameState.settings?.language, handleAutoSubmit]);

  // Initialize speech recognition
  useEffect(() => {
    const initializeSpeechRecognition = () => {
      if (isOpenAISpeechRecognitionAvailable()) {
        setIsSupported(true);
        setupOpenAIRecognition();
      } else {
        const errorMessage = "Speech recognition is not available. Please use a supported browser.";
        setError(errorMessage);
      }
    };

    initializeSpeechRecognition();
  }, [setupOpenAIRecognition]);

  // Update language when settings change
  useEffect(() => {
    if (openAIRef.current) {
      const language = gameState.settings?.language || 'American';
      openAIRef.current.updateLanguage(language);
    }
  }, [gameState.settings?.language]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError('Speech recognition not supported');
      return;
    }
    
    setError(null);
    setTranscript('');
    
    if (openAIRef.current) {
      console.log('MicrophoneContext: Starting OpenAI speech recognition...');
      await openAIRef.current.startRecording();
    } else {
      console.log('MicrophoneContext: No speech recognition method available');
      setError('No speech recognition method available');
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    console.log('MicrophoneContext: stopListening called');
    
    if (openAIRef.current) {
      openAIRef.current.stopRecording();
    }
    
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
    }
    setIsWaitingForSilence(false);
  }, []);

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
    return "Using OpenAI Whisper";
  }, [isOnline]);

  const getStatusIcon = useCallback(() => {
    if (!isOnline) return "❌";
    return "🎤";
  }, [isOnline]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
      if (openAIRef.current) {
        openAIRef.current.destroy();
      }
    };
  }, []);

  const value: MicrophoneContextType = {
    // State
    isListening,
    isSupported,
    useLemonfox: true, // Always true now since we're using OpenAI
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
