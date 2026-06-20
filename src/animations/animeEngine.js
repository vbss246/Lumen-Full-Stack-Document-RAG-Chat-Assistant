/**
 * AnimeEngine handles all custom animations using the global anime.js library.
 * It detects if anime.js is loaded via CDN; if not, it falls back to clean CSS/DOM rendering.
 */
export const animeEngine = {
  /**
   * Staggered bouncy scaling for chat bubbles
   * @param {HTMLElement} el 
   */
  animateBubbleIn(el) {
    if (typeof window.anime === 'undefined') return;
    
    // Set initial state before animation
    el.style.transformOrigin = 'bottom left';
    if (el.classList.contains('chat-bubble-user')) {
      el.style.transformOrigin = 'bottom right';
    }

    window.anime({
      targets: el,
      scale: [0.75, 1],
      opacity: [0, 1],
      duration: 500,
      easing: 'easeOutBack'
    });
  },

  /**
   * Springy scale-up and slide-in for modals
   * @param {HTMLElement} overlay 
   * @param {HTMLElement} container 
   */
  animateModalIn(overlay, container) {
    if (typeof window.anime === 'undefined') {
      overlay.classList.add('active');
      return;
    }

    overlay.style.display = 'flex';
    overlay.style.opacity = 0;
    container.style.transform = 'translateY(30px) scale(0.9)';
    
    window.anime({
      targets: overlay,
      opacity: [0, 1],
      duration: 250,
      easing: 'linear',
      begin: () => overlay.classList.add('active')
    });

    window.anime({
      targets: container,
      translateY: [30, 0],
      scale: [0.9, 1],
      opacity: [0, 1],
      duration: 450,
      easing: 'easeOutElastic(1, 0.8)'
    });
  },

  /**
   * Flash overlay transition on theme variable swap
   */
  animateThemeChange() {
    if (typeof window.anime === 'undefined') return;

    // Create a temporary fullscreen screen flash overlay element
    const flash = document.createElement('div');
    flash.style.position = 'fixed';
    flash.style.top = '0';
    flash.style.left = '0';
    flash.style.width = '100vw';
    flash.style.height = '100vh';
    flash.style.background = 'rgba(255, 255, 255, 0.15)';
    flash.style.backdropFilter = 'blur(4px)';
    flash.style.zIndex = '9999';
    flash.style.pointerEvents = 'none';
    flash.style.opacity = '0';
    
    document.body.appendChild(flash);

    window.anime({
      targets: flash,
      opacity: [0, 1, 0],
      duration: 600,
      easing: 'easeInOutQuad',
      complete: () => flash.remove()
    });
  },

  /**
   * Water ripple expanding ring animation from cursor
   * @param {number} x Client X coordinate
   * @param {number} y Client Y coordinate
   */
  createWaterRipple(x, y) {
    if (typeof window.anime === 'undefined') return;

    const ring = document.createElement('div');
    ring.className = 'water-ripple-ring';
    
    // Basic inline styles to structure the ripple element
    ring.style.position = 'fixed';
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    ring.style.width = '12px';
    ring.style.height = '12px';
    ring.style.border = '2px solid var(--accent-color)';
    ring.style.borderRadius = '50%';
    ring.style.pointerEvents = 'none';
    ring.style.zIndex = '9998';
    ring.style.transform = 'translate(-50%, -50%)';
    ring.style.boxShadow = '0 0 10px var(--accent-color)';
    
    document.body.appendChild(ring);

    window.anime({
      targets: ring,
      scale: [1, 25],
      opacity: [0.8, 0],
      borderWidth: ['2px', '0.5px'],
      duration: 1000,
      easing: 'easeOutQuart',
      complete: () => ring.remove()
    });
  }
};
