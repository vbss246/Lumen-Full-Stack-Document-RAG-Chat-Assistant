import { hooks, EVENTS } from '../../hooks/customHooks.js';
import { storage } from '../../services/storage.js';

export class Header {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.unsubscribes = [];
  }

  /**
   * Initializes the header component and fetches its template
   */
  async init() {
    await this.render();
    this.setupListeners();
    this.updateState();
  }

  /**
   * Loads template and mounts it to container
   */
  async render() {
    try {
      const response = await fetch('src/components/Header/Header.html');
      const htmlText = await response.text();
      this.container.innerHTML = htmlText;
    } catch (err) {
      console.error('Failed to load Header template, using fallback.', err);
      this.container.innerHTML = this.getFallbackTemplate();
    }
  }

  /**
   * Bind event subscriptions
   */
  setupListeners() {
    const btnSettings = this.container.querySelector('#header-btn-settings');
    btnSettings?.addEventListener('click', () => hooks.emit(EVENTS.SETTINGS_OPENED));

    const unsubChat = hooks.on(EVENTS.CHAT_SELECTED, (chatId) => this.handleChatSelected(chatId));
    const unsubDocUpdate = hooks.on(EVENTS.DOCUMENT_UPLOADED, () => this.updateContextBadge());
    const unsubDocDel = hooks.on(EVENTS.DOCUMENT_DELETED, () => this.updateContextBadge());
    
    this.unsubscribes.push(unsubChat, unsubDocUpdate, unsubDocDel);
  }

  /**
   * Handles chat selection changes
   */
  handleChatSelected(chatId) {
    const chats = storage.getChats();
    const chat = chats.find(c => c.id === chatId);
    const titleEl = document.getElementById('header-chat-title');
    if (titleEl && chat) {
      titleEl.innerText = chat.title;
    }
  }

  /**
   * Dynamic updates on initialization
   */
  updateState() {
    const activeChatId = storage.getCurrentChatId();
    if (activeChatId) {
      this.handleChatSelected(activeChatId);
    }
    this.updateContextBadge();
  }

  /**
   * Refresh RAG context status
   */
  updateContextBadge() {
    const badge = this.container.querySelector('.header-context-badge');
    const badgeText = document.getElementById('header-context-text');
    if (!badge || !badgeText) return;

    const docs = storage.getDocuments();
    if (docs.length > 0) {
      badge.classList.add('has-docs');
      badgeText.innerText = `${docs.length} RAG Source${docs.length > 1 ? 's' : ''}`;
    } else {
      badge.classList.remove('has-docs');
      badgeText.innerText = 'No source documents';
    }
  }

  /**
   * Cleanup event bindings
   */
  destroy() {
    this.unsubscribes.forEach(unsub => unsub());
  }

  /**
   * Fallback markup in case template loading fails
   */
  getFallbackTemplate() {
    return `
      <div class="layout-header">
        <div class="layout-header-left">
          <div class="header-logo"><span class="text-white">L</span></div>
          <div class="header-details">
            <h2 id="header-chat-title" class="header-title">Lumen</h2>
            <span class="header-subtitle text-xs">Your notes, conversationally</span>
          </div>
        </div>
        <div class="layout-header-right">
          <div class="header-context-badge">
            <span class="context-badge-icon"></span>
            <span id="header-context-text" class="text-xs font-medium">No source documents</span>
          </div>
        </div>
      </div>
    `;
  }
}
