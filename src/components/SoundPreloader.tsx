import { useEffect } from "react";
import { Howl } from "howler";

interface SoundPreloaderProps {
  isPlayerMode?: boolean;
}

export function SoundPreloader({ isPlayerMode = false }: SoundPreloaderProps) {
  useEffect(() => {
    // Only preload sounds in screen mode
    if (isPlayerMode) {
      return;
    }

    console.log('🔊 Preloading game sound effects...');

    // Preload all game sound effects
    const sounds = [
      { src: '/sounds/buzzer.mp3', name: 'buzzer' },
      { src: '/sounds/correct.mp3', name: 'correct' },
      { src: '/sounds/wrong.mp3', name: 'wrong' },
      { src: '/sounds/reveal.mp3', name: 'reveal' }
    ];

    sounds.forEach(({ src, name }) => {
      const howl = new Howl({
        src: [src],
        volume: 1.0,
        preload: true,
        onload: () => {
          console.log(`✅ Sound preloaded: ${name}`);
        },
        onloaderror: (id, error) => {
          console.warn(`⚠️ Failed to preload sound ${name}:`, error);
        }
      });
    });

    console.log('🔊 Sound preloading initiated');
  }, [isPlayerMode]);

  // This component doesn't render anything
  return null;
}
