import { Sidebar } from '../components/Sidebar/Sidebar.js';
import { Header } from '../components/Header/Header.js';
import { ChatArea } from '../components/ChatArea/ChatArea.js';
import { RightSidebar } from '../components/RightSidebar/RightSidebar.js';
import { UploadModal } from '../components/UploadModal/UploadModal.js';
import { SettingsModal } from '../components/SettingsModal/SettingsModal.js';

export class DashboardPage {
  constructor() {
    this.components = {};
  }

  /**
   * Initializes all dashboard layout subcomponents
   */
  async init() {
    console.log("Initializing Dashboard Page Components...");
    
    // Create instances
    this.components.sidebar = new Sidebar('sidebar-root');
    this.components.header = new Header('header-root');
    this.components.chatArea = new ChatArea('chat-area-root');
    this.components.rightSidebar = new RightSidebar('right-sidebar-root');
    this.components.uploadModal = new UploadModal('modal-root');
    this.components.settingsModal = new SettingsModal('modal-root');

    // Run component initializations in parallel
    await Promise.all([
      this.components.sidebar.init(),
      this.components.header.init(),
      this.components.chatArea.init(),
      this.components.rightSidebar.init(),
      this.components.uploadModal.init(),
      this.components.settingsModal.init()
    ]);
    
    console.log("All sub-components successfully loaded.");
  }

  /**
   * Cleans up all event listeners and timers in child components
   */
  destroy() {
    Object.values(this.components).forEach(comp => {
      if (typeof comp.destroy === 'function') {
        comp.destroy();
      }
    });
  }
}
