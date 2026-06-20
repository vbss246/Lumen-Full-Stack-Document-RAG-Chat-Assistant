export const STORAGE_KEYS = {
  CHATS: 'lumen_chats_list',
  CURRENT_CHAT_ID: 'lumen_current_chat_id',
  UPLOADED_DOCUMENTS: 'lumen_uploaded_documents'
};

export const API_CONFIG = {
  BASE_URL: 'http://localhost:5000/api', // Where the Python RAG API will run
  MOCK_DELAY: 1200
};

export const CHAT_EMPTY_STATE_GREETING = "Hi! Ask me anything about your notes — I'll pull the relevant context.";

export const MOCK_RAG_ANSWERS = {
  "default": "Based on the documents provided, I couldn't find a direct match for your query. Please make sure the context is present in your uploaded files.",
  "hello": "Hello! I am your RAG Assistant. Please make sure to upload files (PDF, TXT, or MD) so I can help answer queries based strictly on them.",
  "summarize": "Based on the uploaded roadmap and meeting notes:\n- **Priorities Lock**: Onboarding redesign, Billing v2, Unified Search.\n- **Timeline**: Onboarding redesign will be shipped first (draft by July 5).\n- **Agreement**: The team aligned to prioritize user onboarding flow modifications to reduce initial drop-off by 15%.",
  "onboarding": "According to the product roadmap document, the **onboarding redesign** is top priority. The team intends to ship a complete draft by **July 5**. The goal is to streamline signup and user setup.",
  "billing": "The billing documents state that **Billing v2** is scheduled for development after the onboarding redesign. It targets modernizing the payment gateway and adding support for multi-currency invoicing.",
  "unified search": "Unified Search is marked as the third priority in the roadmap notes. It seeks to index all workspace entities (docs, chats, notes) into a single command palette search bar."
};
