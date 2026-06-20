import { hooks, EVENTS } from '../../hooks/customHooks.js';

export class UploadModal {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.unsubscribes = [];
    this.activeUploads = new Map();
  }

  async init() {
    await this.render();
    this.setupUIHandlers();
    this.setupListeners();
  }

  async render() {
    try {
      const response = await fetch('src/components/UploadModal/UploadModal.html');
      const text = await response.text();
      const div = document.createElement('div');
      div.id = 'upload-modal-wrapper';
      div.innerHTML = text;
      this.container.appendChild(div);
    } catch {
      console.error("Failed to load UploadModal template.");
    }
  }

  setupUIHandlers() {
    const overlay = this.container.querySelector('#upload-modal-overlay');
    const closeBtn = this.container.querySelector('#upload-modal-close');
    
    closeBtn?.addEventListener('click', () => this.hideModal());
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.hideModal();
    });
  }

  setupListeners() {
    const unsubDoc = hooks.on(EVENTS.DOCUMENT_UPLOADED, (doc) => this.handleDocUploadedEvent(doc));
    this.unsubscribes.push(unsubDoc);
  }

  /**
   * Handle document events to show progress in modal
   */
  handleDocUploadedEvent(doc) {
    // If it's a new upload (status = 'indexing')
    if (doc.status === 'indexing' && !this.activeUploads.has(doc.id)) {
      this.showModal();
      this.addUploadRow(doc);
    } 
    // If indexing finished
    else if (doc.status === 'indexed' && this.activeUploads.has(doc.id)) {
      this.completeUploadRow(doc.id);
    }
  }

  showModal() {
    const overlay = this.container.querySelector('#upload-modal-overlay');
    overlay?.classList.add('active');
  }

  hideModal() {
    const overlay = this.container.querySelector('#upload-modal-overlay');
    overlay?.classList.remove('active');
    
    // Clear list after fadeout animation
    setTimeout(() => {
      const list = this.container.querySelector('#modal-upload-list');
      if (list) list.innerHTML = '';
      this.activeUploads.clear();
    }, 300);
  }

  /**
   * Adds progress bar layout row
   */
  addUploadRow(doc) {
    const list = this.container.querySelector('#modal-upload-list');
    if (!list) return;

    const row = document.createElement('div');
    row.className = 'modal-upload-row';
    row.id = `modal-upload-${doc.id}`;
    row.innerHTML = `
      <div class="modal-upload-info">
        <span class="modal-upload-name">${doc.name}</span>
        <span class="modal-upload-percent" id="percent-${doc.id}">0%</span>
      </div>
      <div class="modal-progress-bar-bg">
        <div class="modal-progress-bar-fill" id="fill-${doc.id}"></div>
      </div>
    `;
    list.appendChild(row);

    // Simulate steady progress increase until indexed
    let progress = 0;
    const interval = setInterval(() => {
      if (progress < 90) {
        progress += Math.floor(Math.random() * 15) + 5;
        this.updateProgressDOM(doc.id, Math.min(progress, 90));
      }
    }, 150);

    this.activeUploads.set(doc.id, { interval, progress: 0 });
  }

  updateProgressDOM(id, val) {
    const percent = this.container.querySelector(`#percent-${id}`);
    const fill = this.container.querySelector(`#fill-${id}`);
    
    if (percent) percent.innerText = `${val}%`;
    if (fill) fill.style.width = `${val}%`;
  }

  /**
   * Complete indexing animation
   */
  completeUploadRow(id) {
    const upload = this.activeUploads.get(id);
    if (!upload) return;

    clearInterval(upload.interval);
    this.updateProgressDOM(id, 100);
    
    const percent = this.container.querySelector(`#percent-${id}`);
    if (percent) {
      percent.innerHTML = '<span style="color: #10b981; font-weight: 600;">Indexed</span>';
    }

    // Check if all uploads in modal are done
    let allFinished = true;
    this.activeUploads.delete(id); // remove completed key
    
    if (this.activeUploads.size === 0) {
      setTimeout(() => {
        this.hideModal();
      }, 1500);
    }
  }

  destroy() {
    this.unsubscribes.forEach(unsub => unsub());
    this.activeUploads.forEach(val => clearInterval(val.interval));
  }
}
