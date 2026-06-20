import { hooks, EVENTS } from '../hooks/customHooks.js';

/**
 * AnimeBackground manages the background featuring floating gold/orange geometric shapes
 * and a green wireframe globe that draws/spins on scroll, and fades out when scrolling stops.
 */
export class AnimeBackground {
  /**
   * @param {HTMLElement} containerElement 
   */
  constructor(containerElement) {
    this.container = containerElement;
    this.animationInstances = [];
    this.unsubscribes = [];
    this.active = false;
    
    this.scrollHandler = (e) => this.handleScroll(e);
    this.scrollTimeoutId = null;
    
    // Subscribe to preferences settings changes dynamically
    const unsubScroll = hooks.on(EVENTS.SCROLL_TOGGLED, (enabled) => {
      if (this.active) {
        this.setupScrollListener();
        if (!enabled) {
          const svg = this.container.querySelector('#scroll-sphere-svg');
          if (svg) svg.style.opacity = '0';
        }
      }
    });
    this.unsubscribes.push(unsubScroll);
  }

  start() {
    this.active = true;
    this.container.innerHTML = '';
    
    // Spawn floating geometric shapes and the scroll-driven globe
    this.spawnShapes();
    this.spawnScrollSphere();
    
    this.runAnimations();
    this.setupScrollListener();
  }

  stop() {
    this.active = false;
    this.removeScrollListener();
    // Halt all anime.js timelines and delete elements
    this.animationInstances.forEach(inst => inst.pause());
    this.animationInstances = [];
    this.container.innerHTML = '';
  }

  /**
   * Spawns floating shapes matching the screenshot
   */
  spawnShapes() {
    const shapeCount = 28;
    const shapeTypes = ['solid-circle', 'solid-square', 'hollow-circle', 'hollow-square', 'dashed-box'];
    
    for (let i = 0; i < shapeCount; i++) {
      const shape = document.createElement('div');
      shape.className = 'floating-shape';
      
      const type = shapeTypes[i % shapeTypes.length];
      const size = Math.floor(Math.random() * 35) + 20;
      
      shape.style.position = 'absolute';
      shape.style.width = `${size}px`;
      shape.style.height = `${size}px`;
      shape.style.pointerEvents = 'none';
      
      const color = '#f97316';
      
      if (type === 'solid-circle') {
        shape.style.background = color;
        shape.style.borderRadius = '50%';
        shape.style.opacity = '0.08';
      } else if (type === 'solid-square') {
        shape.style.background = color;
        shape.style.borderRadius = '8px';
        shape.style.opacity = '0.08';
      } else if (type === 'hollow-circle') {
        shape.style.border = `2.5px solid ${color}`;
        shape.style.borderRadius = '50%';
        shape.style.opacity = '0.12';
      } else if (type === 'hollow-square') {
        shape.style.border = `2.5px solid ${color}`;
        shape.style.borderRadius = '8px';
        shape.style.opacity = '0.12';
      } else if (type === 'dashed-box') {
        shape.style.border = `1.5px dashed ${color}`;
        shape.style.borderRadius = '4px';
        shape.style.opacity = '0.15';
        shape.style.width = `${size * 0.6}px`;
        shape.style.height = `${size * 0.6}px`;
      }
      
      shape.style.left = `${Math.random() * 100}%`;
      shape.style.top = `${Math.random() * 100}%`;
      
      this.container.appendChild(shape);
    }
  }

  /**
   * Spawns the green wireframe globe SVG in the center of the viewport background
   */
  spawnScrollSphere() {
    const sphereWrapper = document.createElement('div');
    sphereWrapper.id = 'scroll-sphere-wrapper';
    sphereWrapper.style.position = 'absolute';
    sphereWrapper.style.left = '50%';
    sphereWrapper.style.top = '50%';
    sphereWrapper.style.transform = 'translate(-50%, -50%)';
    sphereWrapper.style.width = '240px';
    sphereWrapper.style.height = '240px';
    sphereWrapper.style.pointerEvents = 'none';
    sphereWrapper.style.zIndex = '0';
    
    sphereWrapper.innerHTML = `
      <svg id="scroll-sphere-svg" viewBox="0 0 100 100" style="width: 100%; height: 100%; overflow: visible; transform: translate(-50%, -50%) rotate(25deg); position: absolute; left: 50%; top: 50%; opacity: 0; transition: opacity 0.4s ease; pointer-events: none;">
        <!-- Horizontal slices -->
        <ellipse cx="50" cy="25" rx="35" ry="9" stroke="#10b981" stroke-width="1.2" fill="none" stroke-dasharray="140" stroke-dashoffset="140" class="sphere-path" />
        <ellipse cx="50" cy="37" rx="42" ry="11" stroke="#10b981" stroke-width="1.2" fill="none" stroke-dasharray="160" stroke-dashoffset="160" class="sphere-path" />
        <ellipse cx="50" cy="50" rx="45" ry="12" stroke="#10b981" stroke-width="1.2" fill="none" stroke-dasharray="180" stroke-dashoffset="180" class="sphere-path" />
        <ellipse cx="50" cy="63" rx="42" ry="11" stroke="#10b981" stroke-width="1.2" fill="none" stroke-dasharray="160" stroke-dashoffset="160" class="sphere-path" />
        <ellipse cx="50" cy="75" rx="35" ry="9" stroke="#10b981" stroke-width="1.2" fill="none" stroke-dasharray="140" stroke-dashoffset="140" class="sphere-path" />
        
        <!-- Vertical slices -->
        <ellipse cx="50" cy="50" rx="15" ry="45" stroke="#10b981" stroke-width="1.2" fill="none" stroke-dasharray="160" stroke-dashoffset="160" class="sphere-path" />
        <ellipse cx="50" cy="50" rx="30" ry="45" stroke="#10b981" stroke-width="1.2" fill="none" stroke-dasharray="180" stroke-dashoffset="180" class="sphere-path" />
      </svg>
    `;
    
    this.container.appendChild(sphereWrapper);
  }

  /**
   * Bind/remove window scroll events
   */
  setupScrollListener() {
    this.removeScrollListener();
    const prefEnabled = localStorage.getItem('lumen_setting_scroll_globe') !== 'false';
    if (prefEnabled) {
      window.addEventListener('scroll', this.scrollHandler, true);
    }
  }

  removeScrollListener() {
    window.removeEventListener('scroll', this.scrollHandler, true);
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
      this.scrollTimeoutId = null;
    }
  }

  /**
   * Scroll handler: draws the globe as scroll occurs, fades it out when scroll stops
   */
  handleScroll(e) {
    if (!this.active) return;
    
    const svg = this.container.querySelector('#scroll-sphere-svg');
    if (!svg) return;
    
    const scrollTop = e.target.scrollTop || window.scrollY || 0;
    
    // Fade in the globe while scrolling
    svg.style.opacity = '0.35';
    
    // Draw paths dynamically based on scroll offsets
    const paths = svg.querySelectorAll('.sphere-path');
    paths.forEach(p => {
      const dashLen = parseFloat(p.getAttribute('stroke-dasharray') || '160');
      const offset = Math.max(0, dashLen - ((scrollTop * 1.5) % dashLen));
      p.style.strokeDashoffset = offset;
    });
    
    // Rotate the globe on scroll
    svg.style.transform = `translate(-50%, -50%) rotate(${25 + scrollTop * 0.12}deg)`;
    
    // Clear and set fade out timeout
    if (this.scrollTimeoutId) {
      clearTimeout(this.scrollTimeoutId);
    }
    this.scrollTimeoutId = setTimeout(() => {
      svg.style.opacity = '0';
    }, 800);
  }

  /**
   * Smooth continuous background shape drift
   */
  runAnimations() {
    if (typeof window.anime === 'undefined') return;

    const shapes = this.container.querySelectorAll('.floating-shape');
    
    shapes.forEach((shape) => {
      const anim = window.anime({
        targets: shape,
        translateX: () => [0, window.anime.random(-150, 150)],
        translateY: () => [0, window.anime.random(-150, 150)],
        rotate: () => [0, window.anime.random(-180, 180)],
        scale: () => [1, window.anime.random(0.8, 1.4)],
        duration: () => window.anime.random(4000, 7000),
        delay: () => window.anime.random(0, 800),
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutQuad'
      });
      
      this.animationInstances.push(anim);
    });
  }

  destroy() {
    this.stop();
    this.unsubscribes.forEach(unsub => unsub());
  }
}
