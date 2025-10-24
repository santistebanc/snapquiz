import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useGameStore } from "../store";
import { useMicrophone } from "../contexts/MicrophoneContext";
import { Zap } from "lucide-react";
import { Howl } from "howler";

interface BuzzerButtonProps {
  isPlayerMode?: boolean;
}

export function BuzzerButton({ isPlayerMode = false }: BuzzerButtonProps) {
  const { gameState, serverAction, connectionId } = useGameStore();
  const microphone = useMicrophone();

  // Only show in player mode
  if (!isPlayerMode || !connectionId) return null;

  const currentRound = gameState.rounds[gameState.currentRound - 1];
  if (!currentRound) return null;

  // Check if this player is banned (already has points deducted from buzzing)
  const isPlayerBanned = (currentRound.pointsAwarded[connectionId] || 0) < 0;
  if (isPlayerBanned) return null;

  // Check if someone else already buzzed
  const isBuzzerDisabled = currentRound.buzzedPlayerId !== null;
  if (isBuzzerDisabled) return null;

  // Only show during questioning and afterQuestioning phases
  if (!['questioning', 'afterQuestioning'].includes(gameState.phase)) return null;

  const handleBuzz = async () => {
    // Play buzzer sound immediately (only on this device)
    const buzzerSound = new Howl({
      src: ['/sounds/buzzer.mp3'],
      volume: 0.7,
      onloaderror: () => {
        console.log('Buzzer sound file not found, using fallback');
        // Fallback to Web Audio API if sound file doesn't exist
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    });
    buzzerSound.play();

    serverAction("buzzIn", connectionId);
    
    // Check if user prefers voice input
    const useVoice = typeof window !== 'undefined' 
      ? JSON.parse(localStorage.getItem('snapquiz-voice-preference') || 'true')
      : true;
    
    // Start listening if in voice mode (after a brief delay to allow phase change)
    if (useVoice) {
      setTimeout(async () => {
        try {
          console.log('Starting voice recording after buzz');
          await microphone.startListening();
        } catch (error) {
          console.error('Failed to start listening after buzz:', error);
        }
      }, 100); // Small delay to allow phase to update
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-md mx-auto"
    >
      <Button
        onClick={handleBuzz}
        className="w-full h-32 text-4xl font-bold bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white border-4 border-red-400 shadow-2xl"
        style={{
          animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        }}
      >
        <Zap className="mr-3 h-12 w-12" />
        BUZZ!
      </Button>
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .8;
          }
        }
      `}</style>
    </motion.div>
  );
}

