import React, { useEffect } from 'react';
import { useMicrophone } from '../contexts/MicrophoneContext';

interface ContextVoiceInputProps {
  isActive: boolean;
  disabled?: boolean;
  onTranscript?: (text: string) => void;
  onSubmit?: () => void;
  showStatus?: boolean;
  showTranscript?: boolean;
  className?: string;
}

export function ContextVoiceInput({
  isActive,
  disabled = false,
  onTranscript,
  onSubmit,
  showStatus = true,
  showTranscript = true,
  className = ""
}: ContextVoiceInputProps) {
  const {
    isListening,
    isSupported,
    useLemonfox,
    transcript,
    error,
    isOnline,
    isWaitingForSilence,
    startListening,
    stopListening,
    clearTranscript,
    clearError,
    getStatusText,
    getStatusIcon
  } = useMicrophone();

  // Auto-start when active, auto-stop when inactive
  useEffect(() => {
    console.log('ContextVoiceInput useEffect:', { isActive, isSupported, isListening, disabled });
    if (isActive && isSupported && !isListening && !disabled) {
      console.log('ContextVoiceInput: Starting voice recording...');
      startListening();
    } else if (!isActive && isListening) {
      console.log('ContextVoiceInput: Stopping voice recording...');
      stopListening();
    }
  }, [isActive, isSupported, isListening, disabled, startListening, stopListening]);

  // Handle transcript changes
  useEffect(() => {
    if (transcript && onTranscript) {
      onTranscript(transcript);
    }
  }, [transcript, onTranscript]);

  // Handle auto-submit when waiting for silence
  useEffect(() => {
    if (isWaitingForSilence && onSubmit) {
      const timeout = setTimeout(() => {
        console.log('ContextVoiceInput: Auto-submitting after silence');
        onSubmit();
      }, 1500);
      
      return () => clearTimeout(timeout);
    }
  }, [isWaitingForSilence, onSubmit]);

  const getStatusColor = () => {
    if (!isOnline) return "text-red-400";
    if (useLemonfox) return "text-blue-400";
    return "text-green-400";
  };

  return (
    <div className={`space-y-4 ${className}`}>

      {/* Error message */}
      {error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 p-2 rounded-lg">
          {error}
          <button 
            onClick={clearError}
            className="ml-2 text-red-300 hover:text-red-200 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Transcript display */}
      {showTranscript && transcript && (
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

      {/* Listening indicator */}
      {isListening && (
        <div className="flex items-center justify-center gap-2 text-sm text-warm-yellow">
          <div className="w-2 h-2 bg-warm-yellow rounded-full animate-pulse"></div>
          <span>Listening...</span>
        </div>
      )}
    </div>
  );
}
