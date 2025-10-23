import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { VoiceInput } from "./VoiceInput";
import { useGameStore } from "../store";
import { BUZZER_ANSWER_TIMEOUT_SECONDS } from "../constants";

interface AnswerInputProps {
  isPlayerMode?: boolean;
}

export function AnswerInput({ isPlayerMode = false }: AnswerInputProps) {
  const { gameState, serverAction, connectionId } = useGameStore();
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(BUZZER_ANSWER_TIMEOUT_SECONDS);
  const [useVoice, setUseVoice] = useState(true);
  const resetRef = useRef(false);
  const answerRef = useRef("");

  const currentRound = gameState.rounds[gameState.currentRound - 1];
  const buzzedPlayerId = currentRound?.buzzedPlayerId;
  const buzzedPlayer = buzzedPlayerId ? gameState.players[buzzedPlayerId] : null;
  
  const handleSubmit = useCallback(() => {
    console.log('AnswerInput handleSubmit called with answer:', answerRef.current);
    serverAction("submitAnswer", answerRef.current, connectionId);
  }, [serverAction, connectionId]);

  const handleVoiceTranscript = (transcript: string) => {
    console.log('AnswerInput handleVoiceTranscript called with:', transcript);
    console.log('Current answer state before setting:', answer);
    setAnswer(transcript);
    answerRef.current = transcript; // Update ref with latest value
    console.log('Answer state set to:', transcript);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Countdown timer - only runs when we're in the input mode
  useEffect(() => {
    if (gameState.phase !== 'buzzing' || !isPlayerMode || buzzedPlayerId !== connectionId) {
      return;
    }

    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, gameState.phase, isPlayerMode, buzzedPlayerId, connectionId, handleSubmit]);

  // Reset timer and answer when phase changes to buzzing (only once per buzzing session)
  useEffect(() => {
    if (gameState.phase === 'buzzing' && !resetRef.current) {
      console.log('Resetting answer and timer for new buzzing session');
      setTimeLeft(BUZZER_ANSWER_TIMEOUT_SECONDS);
      setAnswer("");
      answerRef.current = ""; // Also reset the ref
      resetRef.current = true;
    } else if (gameState.phase !== 'buzzing') {
      console.log('Phase changed away from buzzing, resetting flag');
      resetRef.current = false;
    }
  }, [gameState.phase]);

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
        <div className="text-6xl font-bold text-warm-yellow mb-2">
          {timeLeft}
        </div>
        <div className="text-lg text-warm-cream/80">
          seconds remaining
        </div>
      </div>

      <div className="space-y-4">
        {/* Input method toggle */}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => setUseVoice(false)}
            variant={!useVoice ? "default" : "outline"}
            size="sm"
            className={!useVoice 
              ? "bg-warm-yellow hover:bg-warm-yellow/90 text-deep-purple" 
              : "border-warm-cream/30 text-warm-cream hover:bg-warm-cream/10 bg-transparent"
            }
          >
            Type
          </Button>
          <Button
            onClick={() => setUseVoice(true)}
            variant={useVoice ? "default" : "outline"}
            size="sm"
            className={useVoice 
              ? "bg-warm-yellow hover:bg-warm-yellow/90 text-deep-purple" 
              : "border-warm-cream/30 text-warm-cream hover:bg-warm-cream/10 bg-transparent"
            }
          >
            🎤 Voice
          </Button>
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
          <VoiceInput
            onTranscript={handleVoiceTranscript}
            isActive={gameState.phase === 'buzzing'}
            disabled={timeLeft <= 0}
            autoStart={true}
            onSubmit={handleSubmit}
          />
        )}
        
        <Button
          onClick={handleSubmit}
          className="w-full py-6 text-2xl font-bold bg-warm-yellow hover:bg-warm-yellow/90 text-deep-purple"
        >
          Submit Answer
        </Button>
      </div>
    </motion.div>
  );
}
