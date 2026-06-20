import { STORAGE_KEYS } from '../utils/constants.js';

export const storage = {
  /**
   * Fetch all saved chats
   * @returns {Array}
   */
  getChats() {
    const data = localStorage.getItem(STORAGE_KEYS.CHATS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Save the complete chats collection
   * @param {Array} chats 
   */
  saveChats(chats) {
    localStorage.setItem(STORAGE_KEYS.CHATS, JSON.stringify(chats));
  },

  /**
   * Fetch the current active chat identifier
   * @returns {string|null}
   */
  getCurrentChatId() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CHAT_ID);
  },

  /**
   * Save the current active chat identifier
   * @param {string} id 
   */
  setCurrentChatId(id) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CHAT_ID, id);
  },

  /**
   * Fetch all uploaded documents
   * @returns {Array}
   */
  getDocuments() {
    const data = localStorage.getItem(STORAGE_KEYS.UPLOADED_DOCUMENTS);
    return data ? JSON.parse(data) : [];
  },

  /**
   * Save the list of uploaded documents
   * @param {Array} docs 
   */
  saveDocuments(docs) {
    localStorage.setItem(STORAGE_KEYS.UPLOADED_DOCUMENTS, JSON.stringify(docs));
  }
};
