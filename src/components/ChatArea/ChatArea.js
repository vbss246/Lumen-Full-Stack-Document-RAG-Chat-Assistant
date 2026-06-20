import { hooks, EVENTS } from '../../hooks/customHooks.js';
import { storage } from '../../services/storage.js';
import { api } from '../../services/api.js';
import { ChatAreaUploader } from './ChatAreaUploader.js';
import { generateUUID, formatTime, renderMarkdown } from '../../utils/helpers.js';

export class ChatArea {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.uploader = null;
    this.unsubscribes = [];
  }

  async init() {
    await this.render();
    this.uploader = new ChatAreaUploader(this.container);
    this.uploader.init();
    
    this.setupUIHandlers();
    this.setupListeners();
    this.loadActiveChat();
  }

  async render() {
    try {
      const response = await fetch('src/components/ChatArea/ChatArea.html');
      this.container.innerHTML = await response.text();
    } catch {
      this.container.innerHTML = '<div>Chat Area Error</div>';
    }
  }

  setupUIHandlers() {
    this.setupTextarea();
    
    this.container.querySelector('#chat-btn-send')?.addEventListener('click', () => this.sendMessage());
    
    const btnAttach = this.container.querySelector('#chat-btn-attach');
    const chatFileInput = this.container.querySelector('#chat-file-input');
    btnAttach?.addEventListener('click', () => chatFileInput?.click());
    chatFileInput?.addEventListener('change', (e) => this.uploader.handleFileUpload(e.target.files));
  }

  setupListeners() {
    const unsubSelect = hooks.on(EVENTS.CHAT_SELECTED, () => this.loadActiveChat());
    const unsubDocUp = hooks.on(EVENTS.DOCUMENT_UPLOADED, () => this.uploader.renderDashboardDocs());
    const unsubDocDel = hooks.on(EVENTS.DOCUMENT_DELETED, () => this.uploader.renderDashboardDocs());
    
    this.unsubscribes.push(unsubSelect, unsubDocUp, unsubDocDel);
  }

  setupTextarea() {
    const textarea = this.container.querySelector('#chat-message-input');
    textarea?.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    });
    textarea?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  /**
   * Loads documents and messages for selected conversation
   */
  loadActiveChat() {
    const chatId = storage.getCurrentChatId();
    if (!chatId) {
      this.toggleModes(false);
      return;
    }
    
    const chats = storage.getChats();
    const activeChat = chats.find(c => c.id === chatId);
    
    if (!activeChat || activeChat.messages.length === 0) {
      this.toggleModes(false);
      this.uploader.renderDashboardDocs();
    } else {
      this.toggleModes(true);
      this.renderMessageList(activeChat.messages);
    }
  }

  /**
   * Switch between Dashboard setup view and Active Chat thread view
   */
  toggleModes(isActiveChat) {
    const preView = this.container.querySelector('#pre-chat-view');
    const actView = this.container.querySelector('#active-chat-view');
    
    if (isActiveChat) {
      preView.style.display = 'none';
      actView.style.display = 'flex';
    } else {
      preView.style.display = 'flex';
      actView.style.display = 'none';
    }
  }

  /**
   * Message rendering pipeline
   */
  renderMessageList(messages) {
    const thread = this.container.querySelector('#active-chat-view');
    if (!thread) return;
    
    thread.innerHTML = '';
    messages.forEach(msg => {
      thread.appendChild(this.createMessageBubbleDOM(msg));
    });
    this.scrollToBottom();
  }

  createMessageBubbleDOM(msg) {
    const row = document.createElement('div');
    row.className = `message-row ${msg.sender}`;
    
    let sourcesHTML = '';
    if (msg.sender === 'ai' && msg.sources && msg.sources.length > 0) {
      const chips = msg.sources.map(src => `<span class="citation-chip" title="Click to view reference">${src}</span>`).join('');
      sourcesHTML = `
        <div class="ai-response-sources">
          <span class="ai-response-sources-title">Sources used:</span>
          <div class="sources-chips-container">${chips}</div>
        </div>
      `;
    }

    row.innerHTML = `
      <div class="chat-bubble chat-bubble-${msg.sender}">
        <div>${renderMarkdown(msg.text)}</div>
        ${sourcesHTML}
      </div>
      <span class="chat-bubble-timestamp">${formatTime(msg.timestamp)}</span>
    `;

    return row;
  }

  /**
   * Ask query and handle streaming
   */
  async sendMessage() {
    const textarea = this.container.querySelector('#chat-message-input');
    const text = textarea?.value.trim();
    if (!text) return;

    let chatId = storage.getCurrentChatId();
    let chats = storage.getChats();

    // Setup active chat if none selected or empty
    if (!chatId) {
      chatId = generateUUID();
      const newChat = { id: chatId, title: text.substring(0, 24) + '...', dateCreated: new Date().toISOString(), messages: [] };
      chats.unshift(newChat);
      storage.saveChats(chats);
      storage.setCurrentChatId(chatId);
      hooks.emit(EVENTS.CHAT_CREATED, newChat);
    } else {
      const actChat = chats.find(c => c.id === chatId);
      if (actChat && actChat.messages.length === 0) {
        actChat.title = text.substring(0, 24) + '...';
        storage.saveChats(chats);
        hooks.emit(EVENTS.CHAT_CREATED, actChat);
      }
    }

    textarea.value = '';
    textarea.style.height = 'auto';
    
    // Add user message
    const userMsg = { id: generateUUID(), sender: 'user', text, timestamp: new Date().toISOString() };
    this.saveMessageToChat(chatId, userMsg);
    this.toggleModes(true);
    
    const thread = this.container.querySelector('#active-chat-view');
    const userBubbleDOM = this.createMessageBubbleDOM(userMsg);
    thread.appendChild(userBubbleDOM);
    
    import('../../animations/animeEngine.js').then(m => {
      m.animeEngine.animateBubbleIn(userBubbleDOM.querySelector('.chat-bubble'));
    });
    
    // Show AI typing status
    const typingBubble = this.showTypingIndicator();
    this.scrollToBottom();

    // Call RAG Stream API
    const docs = storage.getDocuments();
    const aiMsgId = generateUUID();
    let aiResponseText = '';

    const streamRow = document.createElement('div');
    streamRow.className = 'message-row ai';
    streamRow.innerHTML = `
      <div class="chat-bubble chat-bubble-ai">
        <div class="streaming-text-block"></div>
      </div>
      <span class="chat-bubble-timestamp">${formatTime(new Date())}</span>
    `;
    
    try {
      const result = await api.queryRAG(text, docs, (chunkText) => {
        if (typingBubble.parentNode) typingBubble.remove();
        if (!streamRow.parentNode) {
          thread.appendChild(streamRow);
          import('../../animations/animeEngine.js').then(m => {
            m.animeEngine.animateBubbleIn(streamRow.querySelector('.chat-bubble'));
          });
        }
        
        aiResponseText = chunkText;
        const textBlock = streamRow.querySelector('.streaming-text-block');
        if (textBlock) textBlock.innerHTML = renderMarkdown(chunkText);
        this.scrollToBottom();
      });

      if (typingBubble.parentNode) typingBubble.remove();
      
      const aiMsg = {
        id: aiMsgId,
        sender: 'ai',
        text: result.text,
        timestamp: new Date().toISOString(),
        sources: result.sources
      };
      
      this.saveMessageToChat(chatId, aiMsg);
      this.loadActiveChat();
    } catch {
      if (typingBubble.parentNode) typingBubble.remove();
    }
  }

  showTypingIndicator() {
    const thread = this.container.querySelector('#active-chat-view');
    const bubble = document.createElement('div');
    bubble.className = 'message-row ai';
    bubble.id = 'ai-typing-indicator';
    bubble.innerHTML = `
      <div class="chat-bubble chat-bubble-ai" style="padding: 10px 14px;">
        <div class="typing-indicator">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>
      </div>
    `;
    thread.appendChild(bubble);
    return bubble;
  }

  saveMessageToChat(chatId, msg) {
    const chats = storage.getChats();
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      chat.messages.push(msg);
      storage.saveChats(chats);
    }
  }

  scrollToBottom() {
    const scrollArea = this.container.querySelector('#chat-content-scroll');
    if (scrollArea) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
    }
  }

  destroy() {
    this.unsubscribes.forEach(unsub => unsub());
  }
}
