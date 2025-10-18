import { useEffect, useRef } from 'react';

// Declare global particlesJS function
declare global {
  interface Window {
    particlesJS: (id: string, config: any) => any;
  }
}

const particlesConfig = {
  particles: {
    number: {
      value: 30,
      density: {
        enable: true,
        value_area: 1000
      }
    },
    color: {
      value: "#6f817e"
    },
    shape: {
      type: "polygon",
      polygon: {
        nb_sides: 6
      },
    },
    opacity: {
      value: 0.06,
      random: false,
      anim: {
        enable: false,
      }
    },
    size: {
      value: 80,
      random: true,
      anim: {
        enable: false,
      }
    },
    line_linked: {
      enable: false,
    },
    move: {
      enable: true,
      speed: 1,
      direction: "none",
      random: false,
      straight: false,
      out_mode: "out",
      bounce: false,
      attract: {
        enable: false,
      }
    }
  },
  retina_detect: false
};

export function useParticles() {
  const particlesInstance = useRef<any>(null);

  useEffect(() => {
    // Wait for particles.js to be available on window
    const initParticles = () => {
      if (typeof window !== 'undefined' && window.particlesJS) {
        particlesInstance.current = window.particlesJS("particles-js", particlesConfig);
      } else {
        // Retry after a short delay if particles.js isn't loaded yet
        setTimeout(initParticles, 100);
      }
    };

    initParticles();

    // Handle window resize to redraw particles
    const handleResize = () => {
      if (particlesInstance.current?.pJSDom?.[0]) {
        particlesInstance.current.pJSDom[0].pJS.fn.particlesRefresh();
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return particlesInstance.current;
}
