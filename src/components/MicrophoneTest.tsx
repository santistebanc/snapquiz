import React, { useState } from "react";
import { motion } from "framer-motion";
import { SmartVoiceInput } from "./SmartVoiceInput";
import { ContextVoiceInput } from "./ContextVoiceInput";
import { useMicrophone } from "../contexts/MicrophoneContext";
import { Wifi, Volume2, WifiOff, Mic, MicOff } from "lucide-react";

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
      <div className="text-center">
        <h3 className="text-lg font-semibold text-warm-cream mb-2">
          Microphone Test
        </h3>
        <p className="text-sm text-warm-cream/70 mb-4">
          Test your microphone and speech recognition. This will use LEMONFOX for high-quality speech recognition when available.
        </p>
        
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

      {/* Manual Start/Stop Controls */}
      <div className="flex gap-4 justify-center mb-4">
        <button
          onClick={handleStartListening}
          disabled={!microphone.isSupported || microphone.isListening}
          className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            microphone.isListening 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <Mic className="w-4 h-4" />
          Start Recording
        </button>

        <button
          onClick={handleStopListening}
          disabled={!microphone.isListening}
          className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
            microphone.isListening 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <MicOff className="w-4 h-4" />
          Stop Recording
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

      {/* Auto-submit indicator */}
      {microphone.isWaitingForSilence && (
        <div className="flex items-center justify-center gap-2 text-sm text-warm-yellow mb-4">
          <div className="w-2 h-2 bg-warm-yellow rounded-full animate-pulse"></div>
          <span>Listening for more speech... will submit in 1.5s if you stop speaking</span>
        </div>
      )}


      {/* Instructions */}
      <div className="text-xs text-warm-cream/60 space-y-1">
        <p>• Click "Start Recording" to begin voice recognition</p>
        <p>• Speak clearly into your microphone</p>
        <p>• Click "Stop Recording" when finished</p>
        <p>• The system will automatically use LEMONFOX if available</p>
        <p>• Falls back to browser speech recognition if needed</p>
        <p>• Check the status indicator above to see which method is being used</p>
        <p>• 📶 Blue = LEMONFOX (high-quality), 🌐 Green = Browser (fallback), ❌ Red = Offline</p>
      </div>
    </motion.div>
  );
}