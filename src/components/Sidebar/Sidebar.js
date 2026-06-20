import { hooks, EVENTS } from '../../hooks/customHooks.js';
import { storage } from '../../services/storage.js';
import { generateUUID, formatDate } from '../../utils/helpers.js';

export class Sidebar {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.unsubscribes = [];
    this.searchQuery = '';
  }

  async init() {
    await this.render();
    this.setupListeners();
    this.renderChats();
  }

  async render() {
    try {
      const response = await fetch('src/components/Sidebar/Sidebar.html');
      this.container.innerHTML = await response.text();
    } catch {
      this.container.innerHTML = '<div>Sidebar Error</div>';
    }
  }

  setupListeners() {
    const btnNew = this.container.querySelector('#btn-new-chat');
    btnNew?.addEventListener('click', () => this.handleCreateChat());

    const searchInput = this.container.querySelector('#sidebar-search-input');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.renderChats();
    });

    const unsubSelected = hooks.on(EVENTS.CHAT_SELECTED, () => this.renderChats());
    const unsubCreated = hooks.on(EVENTS.CHAT_CREATED, () => this.renderChats());
    const unsubDeleted = hooks.on(EVENTS.CHAT_DELETED, () => this.renderChats());

    this.unsubscribes.push(unsubSelected, unsubCreated, unsubDeleted);
  }

  /**
   * Generates a new empty chat session and sets it active
   */
  handleCreateChat() {
    const chats = storage.getChats();
    const newChatId = generateUUID();
    const newChat = {
      id: newChatId,
      title: 'New Chat Session',
      dateCreated: new Date().toISOString(),
      messages: []
    };
    
    chats.unshift(newChat);
    storage.saveChats(chats);
    storage.setCurrentChatId(newChatId);
    
    hooks.emit(EVENTS.CHAT_CREATED, newChat);
    hooks.emit(EVENTS.CHAT_SELECTED, newChatId);
  }

  /**
   * Delete a chat session
   */
  handleDeleteChat(e, id) {
    e.stopPropagation();
    let chats = storage.getChats();
    chats = chats.filter(c => c.id !== id);
    storage.saveChats(chats);

    const activeId = storage.getCurrentChatId();
    if (activeId === id) {
      const nextActiveId = chats.length > 0 ? chats[0].id : '';
      storage.setCurrentChatId(nextActiveId);
      hooks.emit(EVENTS.CHAT_SELECTED, nextActiveId);
    }
    
    hooks.emit(EVENTS.CHAT_DELETED, id);
  }

  /**
   * Render chats in sidebar list
   */
  renderChats() {
    const listContainer = document.getElementById('recent-chats-list');
    if (!listContainer) return;
    
    const chats = storage.getChats();
    const activeChatId = storage.getCurrentChatId();
    
    // Filter chats on query text
    const filteredChats = chats.filter(chat => {
      const matchTitle = chat.title.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchMsg = chat.messages.some(m => m.text.toLowerCase().includes(this.searchQuery.toLowerCase()));
      return matchTitle || matchMsg;
    });

    listContainer.innerHTML = '';
    if (filteredChats.length === 0) {
      listContainer.innerHTML = '<li class="no-filtered-chats">No chats found</li>';
      return;
    }

    filteredChats.forEach(chat => {
      const li = this.createChatItemDOM(chat, activeChatId);
      listContainer.appendChild(li);
    });
  }

  /**
   * Creates list item DOM node
   */
  createChatItemDOM(chat, activeChatId) {
    const li = document.createElement('li');
    li.className = `chat-list-item ${chat.id === activeChatId ? 'active' : ''}`;
    li.addEventListener('click', () => {
      storage.setCurrentChatId(chat.id);
      hooks.emit(EVENTS.CHAT_SELECTED, chat.id);
    });

    const preview = chat.messages.length > 0 
      ? chat.messages[chat.messages.length - 1].text 
      : 'No messages yet';

    li.innerHTML = `
      <div class="chat-item-header">
        <span class="chat-item-title">${chat.title}</span>
        <span class="chat-item-date">${formatDate(chat.dateCreated)}</span>
      </div>
      <div class="chat-item-preview">${preview}</div>
      <button class="chat-item-delete" title="Delete Chat">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    `;

    const delBtn = li.querySelector('.chat-item-delete');
    delBtn.addEventListener('click', (e) => this.handleDeleteChat(e, chat.id));

    return li;
  }

  destroy() {
    this.unsubscribes.forEach(unsub => unsub());
  }
}
