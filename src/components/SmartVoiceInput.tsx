import React from 'react';
import { VoiceInput } from './VoiceInput';
import { EnhancedVoiceInput } from './EnhancedVoiceInput';
import { isMobileDevice } from '../utils/lemonfoxSpeechRecognition';

interface SmartVoiceInputProps {
  onTranscript: (text: string) => void;
  isActive: boolean;
  disabled?: boolean;
  autoStart?: boolean;
  onSubmit?: () => void;
}

export function SmartVoiceInput(props: SmartVoiceInputProps) {
  // Check for LEMONFOX API key in a way that works in browser
  const hasLemonfox = typeof window !== 'undefined' && 
    (window as any).LEMONFOX_API_KEY && 
    (window as any).LEMONFOX_API_KEY !== 'undefined';
  
  // Use LEMONFOX as primary method when available
  if (hasLemonfox) {
    return <EnhancedVoiceInput {...props} />;
  }
  
  // Fall back to browser speech recognition
  return <VoiceInput {...props} />;
}
