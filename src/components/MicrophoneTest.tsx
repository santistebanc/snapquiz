import React, { useState } from "react";
import { motion } from "framer-motion";
import { useMicrophone } from "../contexts/MicrophoneContext";
import { Wifi, Volume2, WifiOff, Mic, MicOff, Speaker } from "lucide-react";
import { Howl } from "howler";

interface MicrophoneTestProps {
  isPlayerMode?: boolean;
}

export function MicrophoneTest({ isPlayerMode = false }: MicrophoneTestProps) {
  const [transcript, setTranscript] = useState("");
  const microphone = useMicrophone();

  const handleTranscript = (text: string) => {
    setTranscript(text);
  };

  const handleSubmit = () => {
    // Auto-submit functionality for testing
    console.log("Test transcript submitted:", transcript);
  };

  const handleStartListening = async () => {
    try {
      await microphone.startListening();
    } catch (error) {
      console.error("Failed to start listening:", error);
    }
  };

  const handleStopListening = () => {
    microphone.stopListening();
  };

  const handleTestSpeaker = () => {
    // Play buzzer sound for testing
    const buzzerSound = new Howl({
      src: ['/sounds/buzzer.mp3'],
      volume: 0.7
    });
    buzzerSound.play();
  };


  // Handle transcript updates from microphone context
  React.useEffect(() => {
    if (microphone.transcript) {
      setTranscript(microphone.transcript);
    }
  }, [microphone.transcript]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 bg-card-dark/40 rounded-lg border border-border-muted/20"
    >
      {/* Test Speaker Button - At the top */}
      <div className="flex justify-center mb-6">
        <button
          onClick={handleTestSpeaker}
          className="px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Speaker className="w-4 h-4" />
          Test Speaker
        </button>
      </div>
      
      <div className="text-center">
        
        {/* Status Indicator */}
        <div className="flex items-center justify-center gap-2 mb-4 p-3 bg-card-dark/60 rounded-lg border border-border-muted/30">
          <span className="text-lg">{microphone.getStatusIcon()}</span>
          <span className={`text-sm font-medium ${microphone.isOnline ? 'text-warm-cream' : 'text-red-400'}`}>
            {microphone.getStatusText()}
            {microphone.isListening && (
              <span className="text-warm-yellow animate-pulse ml-2">● Listening</span>
            )}
          </span>
        </div>
      </div>

      {/* Manual Start/Stop Control - Single Toggle Button */}
      <div className="flex justify-center mb-4">
        <button
          onClick={microphone.isListening ? handleStopListening : handleStartListening}
          disabled={!microphone.isSupported}
          className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            microphone.isListening 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {microphone.isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              Stop Recording
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Start Recording
            </>
          )}
        </button>
      </div>

      {/* Error Display */}
      {microphone.error && (
        <div className="text-red-400 text-sm bg-red-900/20 border border-red-800/30 p-3 rounded-lg mb-4">
          {microphone.error}
          <button 
            onClick={microphone.clearError}
            className="ml-2 text-red-300 hover:text-red-200 underline"
          >
            Dismiss
          </button>
        </div>
      )}

          {/* Transcript Display */}
          {transcript && (
        <div className="bg-card-dark/60 p-4 rounded-lg border border-border-muted/30 mb-4">
          <h4 className="text-sm font-medium text-warm-cream/80 mb-2">Transcript:</h4>
          <p className="text-warm-cream text-sm leading-relaxed">{transcript}</p>
        </div>
      )}
    </motion.div>
  );
}