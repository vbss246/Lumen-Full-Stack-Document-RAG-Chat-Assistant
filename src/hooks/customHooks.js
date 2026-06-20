/**
 * Simple Pub-Sub EventBus for reactive cross-component communication
 */
class EventBus {
  constructor() {
    this.listeners = {};
  }

  /**
   * Subscribe to an event
   * @param {string} event 
   * @param {Function} callback 
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event 
   * @param {Function} callback 
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Publish/Emit an event with data
   * @param {string} event 
   * @param {*} data 
   */
  emit(event, data) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (err) {
        console.error(`Error in event listener for ${event}:`, err);
      }
    });
  }
}

export const hooks = new EventBus();

// Defined events
export const EVENTS = {
  CHAT_SELECTED: 'chat:selected',
  CHAT_CREATED: 'chat:created',
  CHAT_DELETED: 'chat:deleted',
  DOCUMENT_UPLOADED: 'document:uploaded',
  DOCUMENT_DELETED: 'document:deleted',
  DATE_FILTER_CHANGED: 'date:filter_changed',
  SETTINGS_OPENED: 'settings:opened',
  THEME_CHANGED: 'settings:theme_changed',
  CLOCK_TOGGLED: 'settings:clock_toggled',
  SCROLL_TOGGLED: 'settings:scroll_toggled'
};
