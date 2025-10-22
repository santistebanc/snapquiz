import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Howl } from 'howler';
import type { Question } from '../types';

interface AudioContextValue {
  playAudio: (questionId: string) => void;
  stopAudio: (questionId: string) => void;
  stopAllAudio: () => void;
  preloadAudio: (questionId: string) => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

interface AudioProviderProps {
  children: ReactNode;
  questions: Question[];
}

export function AudioProvider({ children, questions }: AudioProviderProps) {
  const audioCache = useRef<Record<string, Howl>>({});
  const questionUrlMap = useRef<Record<string, string>>({});
  const questionTimestamps = useRef<Record<string, Array<{ word: string; start: number; end: number }>>>({});
  const stopTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Store question URLs and timestamps for on-demand loading
  useEffect(() => {
    questions.forEach(q => {
      if (q.audioUrl) {
        questionUrlMap.current[q.id] = q.audioUrl;
      }
      if (q.wordTimestamps) {
        questionTimestamps.current[q.id] = q.wordTimestamps;
      }
    });
  }, [questions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('AudioProvider unmounting, cleaning up all audio');
      // Clear all pending stop timers
      Object.values(stopTimers.current).forEach(timer => clearTimeout(timer));
      stopTimers.current = {};
      // Unload all audio
      Object.values(audioCache.current).forEach(howl => howl.unload());
      audioCache.current = {};
    };
  }, []);

  const playAudio = useCallback((questionId: string) => {
    console.log(`🎵 playAudio called for question ${questionId}`);
    
    // Clear any pending stop timer for this question
    if (stopTimers.current[questionId]) {
      clearTimeout(stopTimers.current[questionId]);
      delete stopTimers.current[questionId];
    }
    
    // Check if we already have this audio loaded
    let howl = audioCache.current[questionId];
    
    if (!howl) {
      // Load on demand
      const audioUrl = questionUrlMap.current[questionId];
      if (!audioUrl) {
        console.error(`❌ No audio URL found for question ${questionId}`);
        return;
      }
      
      console.log(`📥 Loading audio on-demand for ${questionId}`);
      howl = new Howl({
        src: [audioUrl],
        html5: true,
        format: ['mp3'],
        volume: 1.0,
        onload: () => {
          console.log(`✅ Audio loaded for ${questionId}`);
        },
        onloaderror: (id, error) => {
          console.error(`❌ Load error for ${questionId}:`, error);
        },
        onplay: () => {
          console.log(`▶️ Now playing ${questionId}`);
        },
        onplayerror: (id, error) => {
          console.error(`❌ Play error for ${questionId}:`, error);
        },
        onend: () => {
          console.log(`⏹️ Finished playing ${questionId}`);
        },
      });
      
      audioCache.current[questionId] = howl;
    }
    
    // Play the audio
    howl.stop(); // Stop if already playing
    howl.play();
  }, []);

  const stopAudio = useCallback((questionId: string) => {
    const howl = audioCache.current[questionId];
    if (!howl) return;

    // Clear any pending stop timer for this question
    if (stopTimers.current[questionId]) {
      clearTimeout(stopTimers.current[questionId]);
      delete stopTimers.current[questionId];
    }

    // Check if we have word timestamps for this question
    const timestamps = questionTimestamps.current[questionId];
    if (!timestamps || timestamps.length === 0) {
      // No timestamps, stop immediately
      howl.stop();
      return;
    }

    // Get current playback position in seconds
    const currentTime = howl.seek() as number;
    
    // Find if we're in the middle of a word
    const currentWord = timestamps.find(ts => 
      currentTime >= ts.start && currentTime < ts.end
    );

    if (currentWord) {
      // We're in the middle of a word, wait until it ends
      const remainingTime = (currentWord.end - currentTime) * 1000; // Convert to ms
      console.log(`⏸️ Delaying stop for ${remainingTime.toFixed(0)}ms to finish word "${currentWord.word}"`);
      
      stopTimers.current[questionId] = setTimeout(() => {
        howl.stop();
        delete stopTimers.current[questionId];
        console.log(`⏹️ Stopped audio after word finished: "${currentWord.word}"`);
      }, remainingTime);
    } else {
      // Not in the middle of a word, stop immediately
      howl.stop();
    }
  }, []);

  const stopAllAudio = useCallback(() => {
    // Clear all pending stop timers
    Object.values(stopTimers.current).forEach(timer => clearTimeout(timer));
    stopTimers.current = {};

    // Stop all audio with word-boundary awareness
    Object.entries(audioCache.current).forEach(([questionId, howl]) => {
      const timestamps = questionTimestamps.current[questionId];
      if (!timestamps || timestamps.length === 0) {
        howl.stop();
        return;
      }

      const currentTime = howl.seek() as number;
      const currentWord = timestamps.find(ts => 
        currentTime >= ts.start && currentTime < ts.end
      );

      if (currentWord) {
        const remainingTime = (currentWord.end - currentTime) * 1000;
        console.log(`⏸️ Delaying stop for ${remainingTime.toFixed(0)}ms to finish word "${currentWord.word}"`);
        
        stopTimers.current[questionId] = setTimeout(() => {
          howl.stop();
          delete stopTimers.current[questionId];
        }, remainingTime);
      } else {
        howl.stop();
      }
    });
  }, []);

  const preloadAudio = useCallback((questionId: string) => {
    // Don't preload if already loaded
    if (audioCache.current[questionId]) {
      console.log(`✓ Audio already loaded for ${questionId}`);
      return;
    }

    const audioUrl = questionUrlMap.current[questionId];
    if (!audioUrl) {
      console.warn(`⚠️ No audio URL found for preloading question ${questionId}`);
      return;
    }

    console.log(`📦 Preloading audio for ${questionId}`);
    const howl = new Howl({
      src: [audioUrl],
      html5: true,
      format: ['mp3'],
      volume: 1.0,
      preload: true,
      onload: () => {
        console.log(`✅ Audio preloaded successfully for ${questionId}`);
      },
      onloaderror: (id, error) => {
        console.error(`❌ Preload error for ${questionId}:`, error);
      },
      onplay: () => {
        console.log(`▶️ Now playing ${questionId}`);
      },
      onplayerror: (id, error) => {
        console.error(`❌ Play error for ${questionId}:`, error);
      },
      onend: () => {
        console.log(`⏹️ Finished playing ${questionId}`);
      },
    });

    audioCache.current[questionId] = howl;
  }, []);

  return (
    <AudioContext.Provider value={{ playAudio, stopAudio, stopAllAudio, preloadAudio }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}

