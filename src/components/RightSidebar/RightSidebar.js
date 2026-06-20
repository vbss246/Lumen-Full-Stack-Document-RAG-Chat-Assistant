import { hooks, EVENTS } from '../../hooks/customHooks.js';
import { storage } from '../../services/storage.js';
import { formatDate } from '../../utils/helpers.js';

export class RightSidebar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentDate = new Date(2026, 5, 20); // June 20, 2026 (Mock active day)
    this.viewDate = new Date(2026, 5, 1);     // Current view month (June 2026)
    this.selectedDateStr = '';
    this.unsubscribes = [];
    
    // Stopwatch state fields
    this.stopwatchDuration = 60; // in seconds
    this.stopwatchElapsed = 0;   // in milliseconds
    this.stopwatchIsRunning = false;
    this.stopwatchLastTime = 0;
    this.stopwatchFrameId = null;
  }

  async init() {
    await this.render();
    this.setupUIHandlers();
    this.setupListeners();
    this.renderCalendar();
    this.updateClockVisibility();
  }

  async render() {
    try {
      const response = await fetch('src/components/RightSidebar/RightSidebar.html');
      this.container.innerHTML = await response.text();
    } catch {
      this.container.innerHTML = '<div>Right Sidebar Error</div>';
    }
  }

  setupUIHandlers() {
    this.container.querySelector('#calendar-prev-month')?.addEventListener('click', () => this.navigateMonth(-1));
    this.container.querySelector('#calendar-next-month')?.addEventListener('click', () => this.navigateMonth(1));
    
    const clearBtn = this.container.querySelector('#btn-clear-date-filter');
    clearBtn?.addEventListener('click', () => this.clearDateFilter());
    
    // Stopwatch control event listeners
    const startBtn = this.container.querySelector('#btn-stopwatch-start');
    const resetBtn = this.container.querySelector('#btn-stopwatch-reset');
    const durationInput = this.container.querySelector('#stopwatch-input-secs');

    startBtn?.addEventListener('click', () => this.toggleStopwatch());
    resetBtn?.addEventListener('click', () => this.resetStopwatch());
    durationInput?.addEventListener('input', () => this.handleDurationChange());
  }

  setupListeners() {
    const renderAll = () => {
      this.renderCalendar();
      if (this.selectedDateStr) this.renderFilteredChats();
    };

    const unsubCreated = hooks.on(EVENTS.CHAT_CREATED, renderAll);
    const unsubDeleted = hooks.on(EVENTS.CHAT_DELETED, renderAll);
    const unsubSelected = hooks.on(EVENTS.CHAT_SELECTED, () => {
      if (this.selectedDateStr) this.renderFilteredChats();
    });
    
    const unsubTheme = hooks.on(EVENTS.THEME_CHANGED, (themeName) => this.handleThemeChanged(themeName));
    const unsubClock = hooks.on(EVENTS.CLOCK_TOGGLED, (showClock) => this.handleClockToggled(showClock));

    this.unsubscribes.push(unsubCreated, unsubDeleted, unsubSelected, unsubTheme, unsubClock);
  }

  navigateMonth(direction) {
    this.viewDate.setMonth(this.viewDate.getMonth() + direction);
    this.renderCalendar();
  }

  /**
   * Render calendar grid cells
   */
  renderCalendar() {
    const grid = this.container.querySelector('#calendar-days-grid');
    const monthYearText = this.container.querySelector('#calendar-month-year');
    if (!grid) return;

    grid.innerHTML = '';
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    
    monthYearText.innerHTML = `${this.viewDate.toLocaleString('default', { month: 'long' })} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay(); // Sun=0
    const adjustedStart = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Mon=0
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Draw empty pads for starting days
    for (let i = 0; i < adjustedStart; i++) {
      const pad = document.createElement('div');
      pad.className = 'calendar-day-btn outside-month';
      grid.appendChild(pad);
    }

    const chats = storage.getChats();
    
    // Draw day buttons
    for (let day = 1; day <= totalDays; day++) {
      const btn = this.createDayButton(day, month, year, chats);
      grid.appendChild(btn);
    }
  }

  /**
   * Create single day button with dot badges for conversations
   */
  createDayButton(day, month, year, chats) {
    const btn = document.createElement('div');
    btn.className = 'calendar-day-btn';
    btn.innerText = day;

    const btnDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // Highlight if selected
    if (this.selectedDateStr === btnDateStr) btn.classList.add('selected');

    // Highlight today
    if (day === this.currentDate.getDate() && month === this.currentDate.getMonth() && year === this.currentDate.getFullYear()) {
      btn.classList.add('is-today');
    }

    // Has activity check
    const hasActivity = chats.some(chat => {
      const chatDate = new Date(chat.dateCreated);
      return chatDate.getFullYear() === year && chatDate.getMonth() === month && chatDate.getDate() === day;
    });
    if (hasActivity) btn.classList.add('has-activity');

    btn.addEventListener('click', () => this.handleDateClick(btnDateStr));
    return btn;
  }

  handleDateClick(dateStr) {
    this.selectedDateStr = dateStr;
    this.renderCalendar();
    this.renderFilteredChats();
  }

  clearDateFilter() {
    this.selectedDateStr = '';
    this.renderCalendar();
    
    const list = this.container.querySelector('#filtered-chats-list');
    const title = this.container.querySelector('#filtered-chats-title');
    const clearBtn = this.container.querySelector('#btn-clear-date-filter');
    
    if (clearBtn) clearBtn.style.display = 'none';
    if (title) title.innerText = 'Chats on Selected Date';
    if (list) {
      list.innerHTML = '<div class="no-filtered-chats">Select a date in the calendar to view chats created on that day.</div>';
    }
  }

  /**
   * Render chats filtered by date
   */
  renderFilteredChats() {
    const list = this.container.querySelector('#filtered-chats-list');
    const title = this.container.querySelector('#filtered-chats-title');
    const clearBtn = this.container.querySelector('#btn-clear-date-filter');
    if (!list) return;

    if (clearBtn) clearBtn.style.display = 'inline-block';
    
    const formatted = formatDate(this.selectedDateStr);
    if (title) title.innerText = `Chats on ${formatted}`;

    const chats = storage.getChats();
    const activeId = storage.getCurrentChatId();
    
    const filtered = chats.filter(chat => {
      const chatDate = new Date(chat.dateCreated);
      const year = chatDate.getFullYear();
      const month = String(chatDate.getMonth() + 1).padStart(2, '0');
      const day = String(chatDate.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}` === this.selectedDateStr;
    });

    list.innerHTML = '';
    if (filtered.length === 0) {
      list.innerHTML = '<div class="no-filtered-chats">No conversations recorded on this day.</div>';
      return;
    }

    filtered.forEach(chat => {
      const card = document.createElement('div');
      card.className = `filtered-chat-card ${chat.id === activeId ? 'active' : ''}`;
      
      const lastMsg = chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : 'No messages yet';
      
      card.innerHTML = `
        <span class="filtered-chat-card-title">${chat.title}</span>
        <span class="filtered-chat-card-preview">${lastMsg}</span>
      `;
      
      card.addEventListener('click', () => {
        storage.setCurrentChatId(chat.id);
        hooks.emit(EVENTS.CHAT_SELECTED, chat.id);
      });
      
      list.appendChild(card);
    });
  }

  handleThemeChanged(themeName) {
    this.updateClockVisibility();
  }

  handleClockToggled(showClock) {
    this.updateClockVisibility();
  }

  updateClockVisibility() {
    const activeTheme = localStorage.getItem('lumen_setting_theme') || 'default';
    const showClockPref = localStorage.getItem('lumen_setting_show_clock') !== 'false';
    
    const calEl = this.container.querySelector('#calendar-widget-wrapper');
    const clockEl = this.container.querySelector('#mechanical-clock-wrapper');
    
    if (activeTheme === 'midnight' && showClockPref) {
      if (calEl) calEl.style.display = 'none';
      if (clockEl) {
        clockEl.style.display = 'flex';
        this.startClockUpdate();
        this.updateStopwatchUI();
      }
    } else {
      if (clockEl) {
        clockEl.style.display = 'none';
        this.stopClockUpdate();
      }
      if (calEl) calEl.style.display = 'block';
    }
  }

  startClockUpdate() {
    this.stopClockUpdate();
    
    // Outer sweeps animated by anime.js
    if (window.anime) {
      this.sweepAnim1 = window.anime({
        targets: this.container.querySelectorAll('.clock-sweep-arc'),
        strokeDashoffset: [0, 240],
        duration: 10000,
        easing: 'linear',
        loop: true
      });
      this.sweepAnim2 = window.anime({
        targets: this.container.querySelectorAll('.clock-sweep-arc-2'),
        strokeDashoffset: [-30, -270],
        duration: 8000,
        easing: 'linear',
        loop: true
      });
    }
  }

  stopClockUpdate() {
    if (this.sweepAnim1) {
      this.sweepAnim1.pause();
      this.sweepAnim1 = null;
    }
    if (this.sweepAnim2) {
      this.sweepAnim2.pause();
      this.sweepAnim2 = null;
    }
    
    this.stopwatchIsRunning = false;
    const startBtn = this.container.querySelector('#btn-stopwatch-start');
    if (startBtn) startBtn.innerText = 'Start';

    if (this.stopwatchFrameId) {
      cancelAnimationFrame(this.stopwatchFrameId);
      this.stopwatchFrameId = null;
    }
  }

  /**
   * Stopwatch event/logic methods
   */
  handleDurationChange() {
    const input = this.container.querySelector('#stopwatch-input-secs');
    if (!input) return;
    
    let val = parseInt(input.value);
    if (isNaN(val) || val <= 0) val = 60;
    
    this.stopwatchDuration = val;
    if (!this.stopwatchIsRunning) {
      this.stopwatchElapsed = 0;
      this.updateStopwatchUI();
    }
  }

  toggleStopwatch() {
    const startBtn = this.container.querySelector('#btn-stopwatch-start');
    if (!startBtn) return;
    
    if (this.stopwatchIsRunning) {
      this.stopwatchIsRunning = false;
      startBtn.innerText = 'Start';
    } else {
      const input = this.container.querySelector('#stopwatch-input-secs');
      let val = parseInt(input?.value || '60');
      if (isNaN(val) || val <= 0) val = 60;
      this.stopwatchDuration = val;

      if (this.stopwatchElapsed >= this.stopwatchDuration * 1000) {
        this.stopwatchElapsed = 0;
      }
      
      this.stopwatchIsRunning = true;
      this.stopwatchLastTime = performance.now();
      startBtn.innerText = 'Pause';
      
      this.runStopwatchTick();
    }
  }

  resetStopwatch() {
    this.stopwatchIsRunning = false;
    this.stopwatchElapsed = 0;
    
    const startBtn = this.container.querySelector('#btn-stopwatch-start');
    if (startBtn) startBtn.innerText = 'Start';
    
    if (this.stopwatchFrameId) {
      cancelAnimationFrame(this.stopwatchFrameId);
      this.stopwatchFrameId = null;
    }
    
    this.updateStopwatchUI();
  }

  runStopwatchTick() {
    if (!this.stopwatchIsRunning) return;
    
    const tick = (now) => {
      if (!this.stopwatchIsRunning) return;
      
      const delta = now - this.stopwatchLastTime;
      this.stopwatchLastTime = now;
      
      this.stopwatchElapsed += delta;
      
      const targetMs = this.stopwatchDuration * 1000;
      if (this.stopwatchElapsed >= targetMs) {
        this.stopwatchElapsed = targetMs;
        this.stopwatchIsRunning = false;
        
        const startBtn = this.container.querySelector('#btn-stopwatch-start');
        if (startBtn) startBtn.innerText = 'Start';
      }
      
      this.updateStopwatchUI();
      
      if (this.stopwatchIsRunning) {
        this.stopwatchFrameId = requestAnimationFrame(tick);
      }
    };
    
    this.stopwatchFrameId = requestAnimationFrame(tick);
  }

  updateStopwatchUI() {
    const totalMs = this.stopwatchDuration * 1000;
    const remainingMs = Math.max(0, totalMs - this.stopwatchElapsed);
    
    const mins = Math.floor(remainingMs / 60000);
    const secs = Math.floor((remainingMs % 60000) / 1000);
    const centis = Math.floor((remainingMs % 1000) / 10);
    
    const displayStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(centis).padStart(2, '0')}`;
    
    const display = this.container.querySelector('#mech-timer-display');
    if (display) display.innerText = displayStr;
    
    const ratio = this.stopwatchElapsed / totalMs;
    const angle = ratio * 360;
    
    const needle = this.container.querySelector('#clock-needle-group');
    if (needle) {
      needle.style.transform = `rotate(${angle}deg)`;
    }
  }

  destroy() {
    this.unsubscribes.forEach(unsub => unsub());
    this.stopClockUpdate();
  }
}
