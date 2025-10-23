import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { Button } from './ui/button';

// Extend Window interface for speech recognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
    mozSpeechRecognition: any;
    msSpeechRecognition: any;
  }
}

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isActive: boolean;
  disabled?: boolean;
  autoStart?: boolean;
  onSubmit?: () => void;
}

export function VoiceInput({ onTranscript, isActive, disabled = false, autoStart = false, onSubmit }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const recognitionRef = useRef<any>(null);
  const submitTimeoutRef = useRef<number | null>(null);
  const currentTranscriptRef = useRef<string>('');

  useEffect(() => {
    // Check if speech recognition is supported with better browser compatibility
    const SpeechRecognition = window.SpeechRecognition || 
                             (window as any).webkitSpeechRecognition ||
                             (window as any).mozSpeechRecognition ||
                             (window as any).msSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
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
        onTranscript(currentTranscript);
        currentTranscriptRef.current = currentTranscript;

        // Clear existing timeout
        if (submitTimeoutRef.current) {
          clearTimeout(submitTimeoutRef.current);
        }

        // Set new timeout to auto-submit after 1.5 seconds of silence
        if (currentTranscript.trim() && onSubmit) {
          console.log('Setting timeout for auto-submit with transcript:', currentTranscript);
          submitTimeoutRef.current = window.setTimeout(() => {
            console.log('Timeout triggered - Auto-submitting voice input:', currentTranscript);
            onSubmit();
          }, 1500);
        } else {
          console.log('Not setting timeout - transcript:', currentTranscript.trim(), 'onSubmit:', !!onSubmit);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        
        let errorMessage = '';
        switch (event.error) {
          case 'network':
            // Auto-retry for network errors (up to 2 times)
            if (retryCount < 2) {
              setRetryCount(prev => prev + 1);
              setError(null);
              setTimeout(() => {
                console.log(`Retrying voice input (attempt ${retryCount + 1}/2)`);
                startListening();
              }, 2000);
              return;
            }
            errorMessage = 'Network error: Speech recognition service is unavailable. Please check your internet connection.';
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
      };

      recognition.onend = () => {
        console.log('Recognition ended - isListening:', isListening, 'transcript:', currentTranscriptRef.current);
        setIsListening(false);
        // If there's a transcript and no timeout is set, submit immediately
        const currentTranscript = currentTranscriptRef.current.trim();
        if (currentTranscript && onSubmit && !submitTimeoutRef.current) {
          console.log('Auto-submitting on recognition end:', currentTranscript);
          onSubmit();
        } else {
          console.log('Not submitting on recognition end - transcript:', currentTranscript, 'onSubmit:', !!onSubmit, 'timeout:', !!submitTimeoutRef.current);
        }
      };
    }
  }, [onTranscript]);

  // Auto-start listening when component becomes active and autoStart is true
  useEffect(() => {
    if (autoStart && isActive && isSupported && !isListening && !disabled) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        console.log('Auto-starting voice input');
        startListening();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoStart, isActive, isSupported, isListening, disabled]);

  // Debug logging for onSubmit prop
  useEffect(() => {
    console.log('VoiceInput onSubmit prop changed:', !!onSubmit);
  }, [onSubmit]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current);
      }
    };
  }, []);

  const startListening = () => {
    if (!recognitionRef.current || isListening || disabled) return;
    
    setError(null);
    setTranscript('');
    setRetryCount(0); // Reset retry count on manual start
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const clearTranscript = () => {
    setTranscript('');
    onTranscript('');
  };

  if (!isSupported) {
    return (
      <div className="text-center text-warm-cream/60 text-sm">
        Voice input not supported in this browser
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Voice input controls */}
      <div className="flex items-center justify-center gap-4">
        <Button
          onClick={isListening ? stopListening : startListening}
          disabled={disabled}
          size="lg"
          className={`w-16 h-16 rounded-full transition-all duration-200 ${
            isListening 
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
              : 'bg-warm-yellow hover:bg-warm-yellow/90 text-deep-purple'
          }`}
        >
          {isListening ? (
            <MicOff className="w-6 h-6" />
          ) : (
            <Mic className="w-6 h-6" />
          )}
        </Button>
        
        {transcript && (
          <Button
            onClick={clearTranscript}
            size="sm"
            variant="outline"
            className="border-warm-cream/30 text-warm-cream hover:bg-warm-cream/10"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Status and transcript */}
      <div className="text-center space-y-2">
        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 text-warm-yellow"
          >
            <Volume2 className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Listening...</span>
          </motion.div>
        )}
        
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card-dark/40 border border-border-muted/30 rounded-lg p-3"
          >
            <div className="text-warm-cream text-sm">
              <span className="text-warm-cream/60">You said: </span>
              <span className="font-medium">{transcript}</span>
            </div>
          </motion.div>
        )}
        
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
