import { DashboardPage } from './pages/DashboardPage.js';
import { storage } from './services/storage.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log("Lumen Frontend Application Bootstrapped.");
  
  // Set up some initial mock data if this is the first time the app is run
  initializeMockData();

  // Initialize and run the Dashboard Page
  const dashboard = new DashboardPage();
  try {
    await dashboard.init();
  } catch (err) {
    console.error("Critical error during dashboard initialization:", err);
  }
});

/**
 * Populates some initial chats and documents in local storage to demonstrate calendar filtering
 * and history out of the box if storage is empty.
 */
function initializeMockData() {
  const currentChats = storage.getChats();
  const currentDocs = storage.getDocuments();

  if (currentChats.length === 0) {
    console.log("Writing initial demonstration chat transcripts to storage.");
    
    // Create pre-dated mock chats (one yesterday, one today)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const today = new Date();
    
    const demoChats = [
      {
        id: 'chat-demo-1',
        title: 'Q3 product roadmap',
        dateCreated: today.toISOString(),
        messages: [
          {
            id: 'm1',
            sender: 'user',
            text: 'Summarize last week\'s product roadmap discussion.',
            timestamp: new Date(today.setMinutes(today.getMinutes() - 5)).toISOString()
          },
          {
            id: 'm2',
            sender: 'ai',
            text: 'Last week you locked in three priorities: **onboarding redesign**, **billing v2**, and a **unified search** experience. The team agreed to ship onboarding first, with a draft by July 5.',
            timestamp: new Date(today.setMinutes(today.getMinutes() + 1)).toISOString(),
            sources: ['product_roadmap.md']
          }
        ]
      },
      {
        id: 'chat-demo-2',
        title: 'Research notes - diffusion',
        dateCreated: yesterday.toISOString(),
        messages: [
          {
            id: 'm3',
            sender: 'user',
            text: 'What are the main findings in the diffusion models paper?',
            timestamp: new Date(yesterday.setMinutes(yesterday.getMinutes() - 10)).toISOString()
          },
          {
            id: 'm4',
            sender: 'ai',
            text: 'The paper details that classifier-free guidance significantly improves sample quality at the cost of diversity. Inception scores increased by 25% on ImageNet tasks when utilizing a guidance scale of 3.0.',
            timestamp: new Date(yesterday.setMinutes(yesterday.getMinutes() + 2)).toISOString(),
            sources: ['diffusion_research.pdf']
          }
        ]
      }
    ];
    
    storage.saveChats(demoChats);
    storage.setCurrentChatId(demoChats[0].id);
  }

  if (currentDocs.length === 0) {
    console.log("Writing initial demonstration document indexes to storage.");
    const demoDocs = [
      {
        id: 'doc-demo-1',
        name: 'product_roadmap.md',
        size: 1042,
        type: 'MD',
        uploadDate: new Date().toISOString(),
        status: 'indexed'
      },
      {
        id: 'doc-demo-2',
        name: 'diffusion_research.pdf',
        size: 348210,
        type: 'PDF',
        uploadDate: new Date(Date.now() - 86400000).toISOString(),
        status: 'indexed'
      }
    ];
    storage.saveDocuments(demoDocs);
  }
}
