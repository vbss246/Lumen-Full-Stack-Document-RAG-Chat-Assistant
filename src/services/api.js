import { API_CONFIG, MOCK_RAG_ANSWERS } from '../utils/constants.js';

export const api = {
  /**
   * Sends a user query to the RAG backend or processes a local mock streaming answer.
   * @param {string} queryText 
   * @param {Array} uploadedDocs List of active docs for context matching
   * @param {function} onChunk Stream handler for incremental text
   * @returns {Promise<{text: string, sources: Array}>}
   */
  async queryRAG(queryText, uploadedDocs = [], onChunk = null) {
    try {
      // Attempt real fetch if backend is active
      const response = await fetch(`${API_CONFIG.BASE_URL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryText })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (onChunk && data.response) {
          // Stream mock chunking of the real response
          await this._simulateStream(data.response, onChunk);
        }
        return {
          text: data.response || '',
          sources: data.sources || []
        };
      }
    } catch (e) {
      console.warn("Backend server not reached. Falling back to mock RAG answers.", e);
    }

    // Mock RAG simulation
    return new Promise((resolve) => {
      setTimeout(async () => {
        const queryLower = queryText.toLowerCase();
        let answer = MOCK_RAG_ANSWERS.default;
        let matchedSources = [];

        // Simple mock matching
        for (const key of Object.keys(MOCK_RAG_ANSWERS)) {
          if (queryLower.includes(key) && key !== 'default') {
            answer = MOCK_RAG_ANSWERS[key];
            
            // Link to mock documents if uploaded
            if (uploadedDocs.length > 0) {
              const docIndex = Math.floor(Math.random() * uploadedDocs.length);
              matchedSources.push(uploadedDocs[docIndex].name);
            } else {
              matchedSources.push("product_roadmap.md");
            }
            break;
          }
        }

        if (onChunk) {
          await this._simulateStream(answer, onChunk);
        }

        resolve({
          text: answer,
          sources: matchedSources
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  },

  /**
   * Simulates document upload indexing
   * @param {File|Object} file 
   * @returns {Promise<Object>}
   */
  async uploadDocument(file) {
    // Attempt real upload
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn("Backend server not reached. Simulating document vectorization.", e);
    }

    // Mock response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          name: file.name,
          size: file.size,
          type: file.name.split('.').pop()
        });
      }, API_CONFIG.MOCK_DELAY);
    });
  },

  /**
   * Simulate a character/word stream for premium UI feeling
   */
  async _simulateStream(text, onChunk) {
    const words = text.split(' ');
    let currentText = '';
    for (let i = 0; i < words.length; i++) {
      currentText += (i === 0 ? '' : ' ') + words[i];
      onChunk(currentText);
      await new Promise(r => setTimeout(r, 45));
    }
  }
};
