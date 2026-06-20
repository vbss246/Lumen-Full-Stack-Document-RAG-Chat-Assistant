import { hooks, EVENTS } from '../../hooks/customHooks.js';
import { storage } from '../../services/storage.js';
import { api } from '../../services/api.js';
import { generateUUID } from '../../utils/helpers.js';

export class ChatAreaUploader {
  /**
   * @param {HTMLElement} parentContainer 
   */
  constructor(parentContainer) {
    this.container = parentContainer;
  }

  init() {
    this.setupDropzone();
    this.renderDashboardDocs();
  }

  setupDropzone() {
    const dropzone = this.container.querySelector('#dashboard-dropzone');
    const fileInput = this.container.querySelector('#dashboard-file-input');
    
    dropzone?.addEventListener('click', () => fileInput?.click());
    fileInput?.addEventListener('change', (e) => this.handleFileUpload(e.target.files));
    
    ['dragenter', 'dragover'].forEach(name => {
      dropzone?.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });
    });
    
    ['dragleave', 'drop'].forEach(name => {
      dropzone?.addEventListener(name, (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        if (name === 'drop') this.handleFileUpload(e.dataTransfer.files);
      });
    });
  }

  /**
   * Handle uploading doc vector flow
   */
  async handleFileUpload(files) {
    if (!files || files.length === 0) return;
    const docs = storage.getDocuments();

    for (const file of files) {
      const docId = generateUUID();
      const newDoc = {
        id: docId,
        name: file.name,
        size: file.size,
        type: file.name.split('.').pop().toUpperCase(),
        uploadDate: new Date().toISOString(),
        status: 'indexing'
      };

      docs.unshift(newDoc);
      storage.saveDocuments(docs);
      hooks.emit(EVENTS.DOCUMENT_UPLOADED, newDoc);

      // Trigger simulated RAG vector extraction
      api.uploadDocument(file).then(() => {
        const currentDocs = storage.getDocuments();
        const found = currentDocs.find(d => d.id === docId);
        if (found) {
          found.status = 'indexed';
          storage.saveDocuments(currentDocs);
          hooks.emit(EVENTS.DOCUMENT_UPLOADED, found);
        }
      });
    }
  }

  /**
   * Render file list in pre-chat view
   */
  renderDashboardDocs() {
    const listEl = this.container.querySelector('#dashboard-docs-list');
    const countEl = this.container.querySelector('#dashboard-doc-count');
    if (!listEl) return;

    const docs = storage.getDocuments();
    if (countEl) countEl.innerText = `${docs.length} file${docs.length !== 1 ? 's' : ''}`;
    
    if (docs.length === 0) {
      listEl.innerHTML = `
        <div class="no-docs-placeholder">
          No documents uploaded yet. Upload reference material to start querying.
        </div>`;
      return;
    }

    listEl.innerHTML = '';
    docs.forEach(doc => {
      listEl.appendChild(this.createDocItemDOM(doc));
    });
  }

  createDocItemDOM(doc) {
    const el = document.createElement('div');
    el.className = 'doc-item-card';
    el.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span class="text-xs font-bold" style="color: var(--primary-color); background: rgba(99,102,241,0.1); padding: 4px 8px; border-radius: 4px;">${doc.type}</span>
        <span class="text-sm font-semibold" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${doc.name}</span>
        <span class="doc-status-tag ${doc.status}">${doc.status}</span>
      </div>
      <button class="doc-item-delete" style="color: var(--text-muted); cursor: pointer;" title="Delete Document">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    `;
    
    el.querySelector('.doc-item-delete').addEventListener('click', () => {
      let docs = storage.getDocuments();
      docs = docs.filter(d => d.id !== doc.id);
      storage.saveDocuments(docs);
      hooks.emit(EVENTS.DOCUMENT_DELETED, doc.id);
    });

    return el;
  }
}
