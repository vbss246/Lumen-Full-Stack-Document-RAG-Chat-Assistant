import { hooks, EVENTS } from '../../hooks/customHooks.js';
import { animeEngine } from '../../animations/animeEngine.js';
import { RippleEffect } from '../../animations/rippleEffect.js';
import { AnimeBackground } from '../../animations/animeBackground.js';

export class SettingsModal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.unsubscribes = [];
    this.ripple = null;
    this.animeBg = null;
    this.mouseMoveListener = null;
    this.clickListener = null;
    this.currentTheme = 'default';
  }

  async init() {
    await this.render();
    
    // Initialize background managers with saved preferences
    const savedBg = localStorage.getItem('lumen_setting_bg') || 'images/misty_forest.png';
    this.ripple = new RippleEffect(document.getElementById('background-canvas'), savedBg);
    this.ripple.init();
    this.animeBg = new AnimeBackground(document.getElementById('bg-animation-container'));

    this.setupUIHandlers();
    this.setupListeners();
    this.loadPreferences();
  }

  async render() {
    try {
      const response = await fetch('src/components/SettingsModal/SettingsModal.html');
      const text = await response.text();
      const div = document.createElement('div');
      div.id = 'settings-modal-wrapper';
      div.innerHTML = text;
      this.container.appendChild(div);
    } catch {
      console.error("Failed to load SettingsModal template.");
    }
  }

  setupUIHandlers() {
    const overlay = this.container.querySelector('#settings-modal-overlay');
    const closeBtn = this.container.querySelector('#settings-modal-close');
    const themeSelect = this.container.querySelector('#settings-theme-select');
    const bgSelect = this.container.querySelector('#settings-bg-select');
    const rippleToggle = this.container.querySelector('#settings-ripple-toggle');
    const clockToggle = this.container.querySelector('#settings-clock-toggle');
    const scrollToggle = this.container.querySelector('#settings-scroll-toggle');
    const resetBtn = this.container.querySelector('#btn-reset-storage');

    closeBtn?.addEventListener('click', () => this.hideModal());
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.hideModal();
    });

    themeSelect?.addEventListener('change', (e) => this.applyTheme(e.target.value));
    rippleToggle?.addEventListener('change', (e) => this.toggleRipple(e.target.checked));
    
    clockToggle?.addEventListener('change', (e) => {
      localStorage.setItem('lumen_setting_show_clock', String(e.target.checked));
      hooks.emit(EVENTS.CLOCK_TOGGLED, e.target.checked);
    });

    scrollToggle?.addEventListener('change', (e) => {
      localStorage.setItem('lumen_setting_scroll_globe', String(e.target.checked));
      hooks.emit(EVENTS.SCROLL_TOGGLED, e.target.checked);
    });
    
    bgSelect?.addEventListener('change', (e) => {
      const newBg = e.target.value;
      localStorage.setItem('lumen_setting_bg', newBg);
      this.ripple.updateImage(newBg);
    });

    resetBtn?.addEventListener('click', () => {
      if (confirm("Are you sure you want to clear all chats and documents?")) {
        localStorage.clear();
        window.location.reload();
      }
    });
  }

  setupListeners() {
    const unsubOpened = hooks.on(EVENTS.SETTINGS_OPENED, () => this.showModal());
    this.unsubscribes.push(unsubOpened);
  }

  showModal() {
    const overlay = this.container.querySelector('#settings-modal-overlay');
    const container = overlay?.querySelector('.modal-container');
    if (overlay && container) {
      animeEngine.animateModalIn(overlay, container);
    }
  }

  hideModal() {
    const overlay = this.container.querySelector('#settings-modal-overlay');
    overlay?.classList.remove('active');
    setTimeout(() => {
      if (overlay) overlay.style.display = 'none';
    }, 300);
  }

  /**
   * Loads saved themes and animation preferences
   */
  loadPreferences() {
    const savedTheme = localStorage.getItem('lumen_setting_theme') || 'default';
    const savedBg = localStorage.getItem('lumen_setting_bg') || 'images/misty_forest.png';
    const savedRipple = localStorage.getItem('lumen_setting_ripple') !== 'false';
    const savedClock = localStorage.getItem('lumen_setting_show_clock') !== 'false';
    const savedScroll = localStorage.getItem('lumen_setting_scroll_globe') !== 'false';

    const themeSelect = this.container.querySelector('#settings-theme-select');
    const bgSelect = this.container.querySelector('#settings-bg-select');
    const rippleToggle = this.container.querySelector('#settings-ripple-toggle');
    const clockToggle = this.container.querySelector('#settings-clock-toggle');
    const scrollToggle = this.container.querySelector('#settings-scroll-toggle');

    if (themeSelect) themeSelect.value = savedTheme;
    if (bgSelect) bgSelect.value = savedBg;
    if (rippleToggle) rippleToggle.checked = savedRipple;
    if (clockToggle) clockToggle.checked = savedClock;
    if (scrollToggle) scrollToggle.checked = savedScroll;

    this.applyTheme(savedTheme, false); // no transition flash on startup
    this.toggleRipple(savedRipple);
  }

  /**
   * Applies selected theme variables to document.body
   */
  applyTheme(themeName, triggerFlash = true) {
    this.currentTheme = themeName;
    localStorage.setItem('lumen_setting_theme', themeName);

    if (triggerFlash) {
      animeEngine.animateThemeChange();
    }

    // Replace theme class on body
    const body = document.body;
    body.className = body.className.replace(/\btheme-\S+/g, '');
    body.classList.add(`theme-${themeName}`);

    const bgGroup = this.container.querySelector('#settings-bg-select-group');
    const rippleGroup = this.container.querySelector('#settings-ripple-toggle-group');
    const clockGroup = this.container.querySelector('#settings-clock-toggle-group');
    const scrollGroup = this.container.querySelector('#settings-scroll-toggle-group');

    // Toggle background rendering and options visibility
    if (themeName === 'default') {
      if (bgGroup) bgGroup.style.display = 'block';
      if (rippleGroup) rippleGroup.style.display = 'flex';
      if (clockGroup) clockGroup.style.display = 'none';
      if (scrollGroup) scrollGroup.style.display = 'none';
      this.animeBg.stop();
      this.ripple.start();
    } else {
      if (bgGroup) bgGroup.style.display = 'none';
      if (rippleGroup) rippleGroup.style.display = 'none';
      
      // If Mechanical Gears theme, show the clock and scroll options!
      if (themeName === 'midnight') {
        if (clockGroup) clockGroup.style.display = 'flex';
        if (scrollGroup) scrollGroup.style.display = 'flex';
      } else {
        if (clockGroup) clockGroup.style.display = 'none';
        if (scrollGroup) scrollGroup.style.display = 'none';
      }
      
      this.ripple.stop();
      this.animeBg.start();
    }
    
    // Broadcast theme changed to other components
    hooks.emit(EVENTS.THEME_CHANGED, themeName);
  }

  /**
   * Enable/Disable water ripples on background clicks and mouse movements
   */
  toggleRipple(enabled) {
    localStorage.setItem('lumen_setting_ripple', String(enabled));

    if (enabled) {
      this.setupRippleEventListeners();
    } else {
      this.removeRippleEventListeners();
    }
  }

  setupRippleEventListeners() {
    if (!this.clickListener) {
      this.clickListener = (e) => {
        if (this.currentTheme !== 'default') return;
        const target = e.target;
        const isInteractive = target.closest('button') || target.closest('a') || target.closest('input') || target.closest('textarea') || target.closest('.chat-bubble') || target.closest('.glass-card') || target.closest('.chat-list-item') || target.closest('.calendar-day-btn');
        
        if (!isInteractive) {
          this.ripple.triggerRipple(e.clientX, e.clientY, 350); // Strong click wave
        }
      };
      document.body.addEventListener('click', this.clickListener);
    }

    if (!this.mouseMoveListener) {
      this.mouseMoveListener = (e) => {
        if (this.currentTheme !== 'default') return;
        // Sample trace at a throttled pace (12% of frames) to maintain 60fps
        if (Math.random() < 0.12) {
          this.ripple.triggerRipple(e.clientX, e.clientY, 40); // Gentle hover trail
        }
      };
      document.body.addEventListener('mousemove', this.mouseMoveListener);
    }
  }

  removeRippleEventListeners() {
    if (this.clickListener) {
      document.body.removeEventListener('click', this.clickListener);
      this.clickListener = null;
    }
    if (this.mouseMoveListener) {
      document.body.removeEventListener('mousemove', this.mouseMoveListener);
      this.mouseMoveListener = null;
    }
  }

  destroy() {
    this.unsubscribes.forEach(unsub => unsub());
    this.removeRippleEventListeners();
    this.ripple.stop();
    this.animeBg.destroy();
  }
}
