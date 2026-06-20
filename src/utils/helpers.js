/**
 * Generates a standard random short identifier
 * @returns {string}
 */
export function generateUUID() {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
}

/**
 * Formats a date string into readable text (e.g. "Jun 20, 2026")
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export function formatDate(dateVal) {
  const date = new Date(dateVal);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Returns a short timestamp (e.g., "15:45")
 * @param {string|Date} dateVal 
 * @returns {string}
 */
export function formatTime(dateVal) {
  const date = new Date(dateVal);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Basic HTML escaping to prevent XSS injection
 * @param {string} text 
 * @returns {string}
 */
export function escapeHTML(text) {
  const div = document.createElement('div');
  div.innerText = text;
  return div.innerHTML;
}

/**
 * Simple markdown translator (handles bold, code snippets, lists, and sources)
 * @param {string} text 
 * @returns {string}
 */
export function renderMarkdown(text) {
  let html = escapeHTML(text);
  
  // Replace bold syntax **word**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Replace inline code blocks `code`
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Replace bullet point lines starting with "- " or "* "
  html = html.split('\n').map(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ')) {
      return `<li>${trimmed.substring(2)}</li>`;
    }
    return line;
  }).join('\n');
  
  // Wrap li groups in ul tags
  html = html.replace(/(<li>.*?<\/li>)/gs, '<ul>$1</ul>');
  
  // Convert double line breaks to paragraphs
  html = html.replace(/\n\n/g, '<br><br>');
  
  return html;
}
