import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ContextVoiceInput } from "./ContextVoiceInput";
import { useMicrophone } from "../contexts/MicrophoneContext";
import { useGameStore } from "../store";
import { Howl } from "howler";
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

  const currentRound = gameState.rounds[gameState.currentRound - 1];
  const buzzedPlayerId = currentRound?.buzzedPlayerId;
  const buzzedPlayer = buzzedPlayerId ? gameState.players[buzzedPlayerId] : null;
  
  const handleSubmit = useCallback(() => {
    console.log('AnswerInput handleSubmit called with answer:', answerRef.current);
    console.log('Current mode (useVoice):', useVoice);
    
    // Stop listening immediately when submit is clicked
    if (microphone.isListening) {
      console.log('Stopping voice recording immediately on submit');
      microphone.stopListening();
    }
    
    if (useVoice) {
      // Voice mode: submit audio transcription
      if (microphone.transcript || answer) {
        // Use current transcript if available
        const currentTranscript = microphone.transcript || answer || answerRef.current;
        console.log('Submitting current transcript:', currentTranscript);
        console.log('Available transcripts - microphone.transcript:', microphone.transcript, 'answer:', answer, 'answerRef.current:', answerRef.current);
        serverAction("submitAnswer", currentTranscript, connectionId);
      } else {
        // Set up callback to submit when transcript is ready (if no current transcript)
        microphone.setSubmitCallback((transcript: string) => {
          console.log('Submitting with transcript from callback:', transcript);
          answerRef.current = transcript;
          serverAction("submitAnswer", transcript, connectionId);
        });
      }
    } else {
      // Type mode: submit typed text (ignore any audio)
      console.log('Submitting typed text:', answerRef.current);
      serverAction("submitAnswer", answerRef.current, connectionId);
    }
  }, [serverAction, connectionId, microphone, useVoice, answer]);

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
  }, [answer]);

  // Save voice preference to localStorage when it changes
  const handleVoiceToggle = (newUseVoice: boolean) => {
    setUseVoice(newUseVoice);
    
    if (newUseVoice) {
      // Switching to voice mode - start listening (but only if we're in buzzing phase)
      if (gameState.phase === 'buzzing') {
        console.log('Switching to voice mode - starting voice recording');
        microphone.startListening().catch(error => {
          console.error('Failed to start listening:', error);
        });
      }
    } else {
      // Switching to type mode - stop listening and clear any pending requests
      if (microphone.isListening) {
        console.log('Switching to type mode - stopping voice recording');
        microphone.stopListening();
        // Clear any pending submit callback
        microphone.setSubmitCallback(() => {});
      }
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
      resetRef.current = true;
      
      // Play buzzer sound when someone becomes the buzzed player (only on their device)
      if (isPlayerMode && buzzedPlayerId === connectionId) {
        const buzzerSound = new Howl({
          src: ['/sounds/buzzer.mp3'],
          volume: 0.7
        });
        buzzerSound.play();
      }
    } else if (gameState.phase !== 'buzzing') {
      console.log('Phase changed away from buzzing, resetting flag');
      resetRef.current = false;
      
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
        {/* Input method toggle */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2 justify-center">
            <Button
              onClick={() => handleVoiceToggle(false)}
              variant={!useVoice ? "default" : "outline"}
              size="sm"
              className={!useVoice 
                ? "bg-slate-600 hover:bg-slate-700 text-white" 
                : "border-warm-cream/30 text-warm-cream hover:bg-warm-cream/10 bg-transparent"
              }
            >
              Type
            </Button>
            <Button
              onClick={() => handleVoiceToggle(true)}
              variant={useVoice ? "default" : "outline"}
              size="sm"
              className={useVoice 
                ? "bg-slate-600 hover:bg-slate-700 text-white" 
                : "border-warm-cream/30 text-warm-cream hover:bg-warm-cream/10 bg-transparent"
              }
            >
              🎤 Voice
            </Button>
          </div>
        </div>

        {/* Text input */}
        {!useVoice && (
          <input
            type="text"
            value={answer}
            onChange={(e) => {
              setAnswer(e.target.value);
              answerRef.current = e.target.value; // Also update ref
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type your answer..."
            autoFocus
            className="w-full px-6 py-4 text-2xl text-center bg-card-dark/60 border-2 border-border-muted/30 rounded-lg text-warm-cream placeholder-warm-cream/40 focus:outline-none focus:border-warm-yellow transition-colors"
          />
        )}

        {/* Voice input */}
        {useVoice && (
          <ContextVoiceInput
            onTranscript={handleVoiceTranscript}
            isActive={gameState.phase === 'buzzing'}
            disabled={false}
            onSubmit={handleSubmit}
            showStatus={true}
            showTranscript={true}
          />
        )}
        
        {/* Submit button - show for both voice and text input */}
        <Button
          onClick={handleSubmit}
          className="w-full py-6 text-2xl font-bold bg-teal-600 hover:bg-teal-700 text-white"
        >
          Submit Answer
        </Button>
      </div>
    </motion.div>
  );
}
