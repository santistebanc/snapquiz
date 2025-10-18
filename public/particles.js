// Initialize particles.js with the new greenish-grey theme configuration
document.addEventListener('DOMContentLoaded', function() {
  // Store the particles instance for resize handling
  let particlesInstance = null;
  
  function initParticles() {
    particlesInstance = particlesJS("particles-js", {
    "particles": {
      "number": {
        "value": 166,
        "density": {
          "enable": true,
          "value_area": 788.3699662577651
        }
      },
      "color": {
        "value": "#6f817e"
      },
      "shape": {
        "type": "polygon",
        "stroke": {
          "width": 0,
          "color": "#000000"
        },
        "polygon": {
          "nb_sides": 6
        },
        "image": {
          "src": "img/github.svg",
          "width": 100,
          "height": 100
        }
      },
      "opacity": {
        "value": 0.064,
        "random": false,
        "anim": {
          "enable": false,
          "speed": 0.6482089177341861,
          "opacity_min": 0.032410445886709306,
          "sync": false
        }
      },
      "size": {
        "value": 56,
        "random": true,
        "anim": {
          "enable": false,
          "speed": 40,
          "size_min": 0.1,
          "sync": false
        }
      },
      "line_linked": {
        "enable": false,
        "distance": 150,
        "color": "#ffffff",
        "opacity": 0.4,
        "width": 1
      },
      "move": {
        "enable": true,
        "speed": 1,
        "direction": "none",
        "random": false,
        "straight": false,
        "out_mode": "out",
        "bounce": false,
        "attract": {
          "enable": false,
          "rotateX": 600,
          "rotateY": 1200
        }
      }
    },
    "interactivity": {
      "detect_on": "canvas",
      "events": {
        "onhover": {
          "enable": false,
          "mode": "repulse"
        },
        "onclick": {
          "enable": false,
          "mode": "push"
        },
        "resize": true
      },
      "modes": {
        "grab": {
          "distance": 400,
          "line_linked": {
            "opacity": 1
          }
        },
        "bubble": {
          "distance": 400,
          "size": 40,
          "duration": 2,
          "opacity": 8,
          "speed": 3
        },
        "repulse": {
          "distance": 200,
          "duration": 0.4
        },
        "push": {
          "particles_nb": 4
        },
        "remove": {
          "particles_nb": 2
        }
      }
    },
    "retina_detect": true
  });
  }
  
  // Initialize particles
  initParticles();
  
  // Handle window resize to redraw particles
  window.addEventListener('resize', function() {
    if (particlesInstance && particlesInstance.pJSDom && particlesInstance.pJSDom[0]) {
      particlesInstance.pJSDom[0].pJS.fn.particlesRefresh();
    }
  });
});