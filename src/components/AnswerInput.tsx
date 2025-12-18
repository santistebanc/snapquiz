import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ContextVoiceInput } from "./ContextVoiceInput";
import { useMicrophone } from "../contexts/MicrophoneContext";
import { useGameStore } from "../store";
// Timer constants removed - no longer using countdown timer

interface AnswerInputProps {
  isPlayerMode?: boolean;
}

export function AnswerInput({ isPlayerMode = false }: AnswerInputProps) {
  const { gameState, serverAction, connectionId } = useGameStore();
  const microphone = useMicrophone();
  const [answer, setAnswer] = useState("");
  
  // Load voice preference from localStorage, default to true
  const [useVoice, setUseVoice] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('snapquiz-voice-preference');
      return saved ? JSON.parse(saved) : true;
    }
    return true;
  });
  
  const [showSavedMessage, setShowSavedMessage] = useState(false);
  const resetRef = useRef(false);
  const answerRef = useRef("");
  const [hasStoppedListening, setHasStoppedListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");

  // Safely access current round
  if (!gameState.rounds || gameState.currentRound < 1 || gameState.currentRound > gameState.rounds.length) {
    return null;
  }
  const currentRound = gameState.rounds[gameState.currentRound - 1];
  if (!currentRound) return null;
  
  const buzzedPlayerId = currentRound.buzzedPlayerId ?? null;
  const buzzedPlayer = buzzedPlayerId ? gameState.players?.[buzzedPlayerId] : null;
  
  const handleSubmit = useCallback(() => {
    console.log('AnswerInput handleSubmit called with answer:', answerRef.current);
    console.log('Current mode (useVoice):', useVoice);
    
    // Stop listening immediately when submit is clicked
    if (microphone.isListening) {
      console.log('Stopping voice recording immediately on submit');
      microphone.stopListening();
      // Capture final transcript if we were listening
      const currentTranscript = microphone.transcript || answer || answerRef.current;
      setFinalTranscript(currentTranscript);
      answerRef.current = currentTranscript;
      setAnswer(currentTranscript);
    }
    
    if (useVoice) {
      // Voice mode: submit audio transcription
      // Prefer finalTranscript (shown to user), then current transcript, then answerRef
      const transcriptToSubmit = finalTranscript || microphone.transcript || answer || answerRef.current;
      if (transcriptToSubmit) {
        console.log('Submitting transcript:', transcriptToSubmit);
        serverAction("submitAnswer", transcriptToSubmit, connectionId);
      } else {
        console.warn('No transcript available to submit');
      }
    } else {
      // Type mode: submit typed text (ignore any audio)
      console.log('Submitting typed text:', answerRef.current);
      serverAction("submitAnswer", answerRef.current, connectionId);
    }
  }, [serverAction, connectionId, microphone, useVoice, answer, finalTranscript]);

  const lastTranscriptRef = useRef<string>('');
  
  const handleVoiceTranscript = useCallback((transcript: string) => {
    // Prevent duplicate transcript updates
    if (transcript === lastTranscriptRef.current) {
      return;
    }
    lastTranscriptRef.current = transcript;
    
    console.log('AnswerInput handleVoiceTranscript called with:', transcript);
    console.log('Current answer state before setting:', answer);
    setAnswer(transcript);
    answerRef.current = transcript; // Update ref with latest value
    console.log('Answer state set to:', transcript);
    
    // Update final transcript if we've stopped listening
    if (hasStoppedListening) {
      setFinalTranscript(transcript);
    }
  }, [answer, hasStoppedListening]);
  
  const handleStartListening = async () => {
    try {
      // Clear previous transcript and state when starting fresh
      setHasStoppedListening(false);
      setFinalTranscript("");
      setAnswer("");
      answerRef.current = "";
      lastTranscriptRef.current = "";
      microphone.clearTranscript(); // Clear the microphone transcript too
      await microphone.startListening();
    } catch (error) {
      console.error('Failed to start listening:', error);
    }
  };
  
  const handleStopListening = () => {
    microphone.stopListening();
    setHasStoppedListening(true);
    
    // Immediately capture any existing transcript (from partial updates during listening)
    const currentTranscript = microphone.transcript?.trim() || '';
    if (currentTranscript) {
      setFinalTranscript(currentTranscript);
      answerRef.current = currentTranscript;
      setAnswer(currentTranscript);
    }
    // Note: Final transcript may also arrive asynchronously after audio processing
    // The useEffect below will update it if a new/final transcript arrives
  };
  
  // Update transcript from microphone context when listening
  useEffect(() => {
    if (microphone.isListening && microphone.transcript) {
      // Prevent duplicate transcript updates
      if (microphone.transcript === lastTranscriptRef.current) {
        return;
      }
      lastTranscriptRef.current = microphone.transcript;
      
      // Update answer textbox with live transcript while listening
      setAnswer(microphone.transcript);
      answerRef.current = microphone.transcript;
    }
  }, [microphone.transcript, microphone.isListening]);
  
  // Capture final transcript after stopping (transcript arrives async after audio processing)
  useEffect(() => {
    if (hasStoppedListening && !microphone.isListening && microphone.transcript) {
      // Transcript has arrived after stopping (or was already available)
      const currentTranscript = microphone.transcript.trim();
      if (currentTranscript) {
        setFinalTranscript(currentTranscript);
        // Update answer textbox with final transcript
        answerRef.current = currentTranscript;
        setAnswer(currentTranscript);
        lastTranscriptRef.current = currentTranscript;
      }
    }
  }, [hasStoppedListening, microphone.transcript, microphone.isListening]);

  // Save voice preference to localStorage when it changes
  const handleVoiceToggle = (newUseVoice: boolean) => {
    setUseVoice(newUseVoice);
    
    if (!newUseVoice) {
      // Switching to type mode - stop listening and clear any pending requests
      if (microphone.isListening) {
        console.log('Switching to type mode - stopping voice recording');
        microphone.stopListening();
        // Clear any pending submit callback
        microphone.setSubmitCallback(() => {});
      }
      // Reset voice-related state
      setHasStoppedListening(false);
      setFinalTranscript("");
    } else {
      // Switching to voice mode - reset state but don't auto-start
      setHasStoppedListening(false);
      setFinalTranscript("");
    }
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('snapquiz-voice-preference', JSON.stringify(newUseVoice));
      // Show brief confirmation message
      setShowSavedMessage(true);
      setTimeout(() => setShowSavedMessage(false), 2000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Timer removed - answers are only submitted when user submits manually

  // Reset answer when phase changes to buzzing (only once per buzzing session)
  useEffect(() => {
    if (gameState.phase === 'buzzing' && !resetRef.current) {
      console.log('Resetting answer for new buzzing session');
      setAnswer("");
      answerRef.current = ""; // Also reset the ref
      setHasStoppedListening(false);
      setFinalTranscript("");
      resetRef.current = true;
      
      // Sound effects temporarily removed for debugging
    } else if (gameState.phase !== 'buzzing') {
      console.log('Phase changed away from buzzing, resetting flag');
      resetRef.current = false;
      setHasStoppedListening(false);
      setFinalTranscript("");
      
      // Stop listening when phase changes away from buzzing
      if (microphone.isListening) {
        console.log('Stopping voice recording - phase changed away from buzzing');
        microphone.stopListening();
      }
    }
  }, [gameState.phase, microphone, isPlayerMode, buzzedPlayerId, connectionId]);

  // Only show during buzzing phase
  if (gameState.phase !== 'buzzing') return null;
  if (!currentRound) return null;

  // In player mode, only show to the player who buzzed
  if (isPlayerMode && (!connectionId || buzzedPlayerId !== connectionId)) return null;
  
  // In screen mode, show a waiting message
  if (!isPlayerMode) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-2xl mx-auto space-y-4 text-center"
      >
        <div className="text-4xl font-bold text-warm-yellow">
          {buzzedPlayer?.name || "A player"} is answering...
        </div>
        <div className="text-2xl text-warm-cream/60">
          Waiting for response
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto space-y-4"
    >
      <div className="text-center">
        <div className="text-4xl font-bold text-warm-yellow mb-2">
          Answer Now
        </div>
      </div>

      <div className="space-y-4">
        {/* Voice input with manual start/stop controls */}
        <div className="space-y-4">
            {/* Start/Stop Listening buttons */}
            {!microphone.isListening && (
              <Button
                onClick={handleStartListening}
                className="w-full py-6 text-2xl font-bold bg-blue-600 hover:bg-blue-700 text-white"
              >
                🎤 Start Listening
              </Button>
            )}
            
            {microphone.isListening && (
              <Button
                onClick={handleStopListening}
                className="w-full py-6 text-2xl font-bold bg-red-600 hover:bg-red-700 text-white"
              >
                ⏹️ Stop Listening
              </Button>
            )}
            
            {/* Listening indicator */}
            {microphone.isListening && (
              <div className="flex items-center justify-center gap-2 text-lg text-warm-yellow">
                <div className="w-3 h-3 bg-warm-yellow rounded-full animate-pulse"></div>
                <span>Listening...</span>
              </div>
            )}
            
            {/* Show processing message while waiting for transcript */}
            {hasStoppedListening && !finalTranscript && !microphone.transcript && !microphone.error && (
              <div className="bg-card-dark/60 p-4 rounded-lg border-2 border-warm-yellow/30">
                <div className="flex items-center justify-center gap-2 text-warm-yellow">
                  <div className="w-4 h-4 border-2 border-warm-yellow border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-lg">Processing your answer...</p>
                </div>
              </div>
            )}
            
            {/* Error display */}
            {microphone.error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 p-2 rounded-lg">
                {microphone.error}
              </div>
            )}
        </div>

        {/* Answer textbox - always visible */}
        <div className="space-y-2">
          {hasStoppedListening && (finalTranscript || microphone.transcript) && (
            <p className="text-sm text-warm-cream/80">Your answer:</p>
          )}
          <input
            type="text"
            value={hasStoppedListening && (finalTranscript || microphone.transcript) 
              ? (finalTranscript || microphone.transcript || answer)
              : answer}
            onChange={(e) => {
              const newValue = e.target.value;
              setAnswer(newValue);
              answerRef.current = newValue;
              // If we have a final transcript, update it too
              if (hasStoppedListening && finalTranscript) {
                setFinalTranscript(newValue);
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder={hasStoppedListening && (finalTranscript || microphone.transcript)
              ? "Edit your answer..."
              : "Type your answer..."}
            autoFocus={!hasStoppedListening}
            className="w-full px-6 py-4 text-2xl text-center bg-card-dark/60 border-2 border-border-muted/30 rounded-lg text-warm-cream placeholder-warm-cream/40 focus:outline-none focus:border-warm-yellow transition-colors"
          />
        </div>
        
        {/* Submit button - show when we have an answer (either from voice or text) */}
        {answer ? (
          <Button
            onClick={handleSubmit}
            className="w-full py-6 text-2xl font-bold bg-teal-600 hover:bg-teal-700 text-white"
          >
            Submit Answer
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}
