/**
 * Generic Parser
 * Attempts to parse unknown JSON formats from various browser extensions
 * (e.g. Save ChatGPT, Superpower ChatGPT, etc.)
 */

const PLATFORM = 'unknown_extension';

/**
 * Detect if the data has any recognizable conversation structure
 */
export function detect(data) {
  if (!data) return false;
  
  // Is it a flat array of messages?
  if (Array.isArray(data) && data.length > 0) {
    if (looksLikeMessageArray(data)) return true;
  }
  
  // Is it an object containing an array of messages?
  if (typeof data === 'object') {
    const keysToCheck = ['messages', 'conversation', 'chat', 'history', 'turns'];
    for (const key of keysToCheck) {
      if (Array.isArray(data[key]) && data[key].length > 0) {
        if (looksLikeMessageArray(data[key])) return true;
      }
    }
  }
  
  return false;
}

/**
 * Heuristics to check if an array looks like a list of chat messages
 */
function looksLikeMessageArray(arr) {
  // Check the first few items to see if they have role/author and text/content
  const sample = arr.slice(0, 3);
  return sample.some(msg => {
    if (!msg || typeof msg !== 'object') return false;
    const hasRole = msg.role || msg.author || msg.sender || msg.from;
    const hasText = msg.text || msg.content || msg.message || msg.body;
    return hasRole && hasText;
  });
}

/**
 * Parse generic export data into normalized conversations
 */
export function parse(data) {
  let title = '(Conversa Importada)';
  let messagesArray = [];
  
  if (Array.isArray(data)) {
    messagesArray = data;
  } else if (typeof data === 'object') {
    title = data.title || data.name || title;
    
    const keysToCheck = ['messages', 'conversation', 'chat', 'history', 'turns'];
    for (const key of keysToCheck) {
      if (Array.isArray(data[key]) && looksLikeMessageArray(data[key])) {
        messagesArray = data[key];
        break;
      }
    }
  }
  
  const createTime = new Date().getTime() / 1000;
  
  const messages = messagesArray
    .map((msg, idx) => {
      // Normalize role
      let rawRole = (msg.role || msg.author || msg.sender || msg.from || 'unknown').toLowerCase();
      let role = 'unknown';
      if (rawRole.includes('user') || rawRole.includes('human') || rawRole === 'me') role = 'user';
      else if (rawRole.includes('assistant') || rawRole.includes('gpt') || rawRole.includes('bot') || rawRole.includes('ai')) role = 'assistant';
      else if (rawRole.includes('system')) role = 'system';
      else role = rawRole; // fallback
      
      // Normalize text
      let text = msg.text || msg.content || msg.message || msg.body || '';
      if (typeof text !== 'string') {
        if (Array.isArray(text)) text = text.join('\n');
        else if (typeof text === 'object') text = JSON.stringify(text);
        else text = String(text);
      }
      
      return {
        id: msg.id || crypto.randomUUID(),
        role,
        textMarkdown: text,
        textPlain: text,
        timestamp: msg.timestamp || msg.created_at || (createTime + idx),
        attachments: msg.attachments || []
      };
    })
    .filter(msg => msg.textPlain.trim() !== '');
  
  const searchText = (title + ' ' + messages.map(m => m.textPlain).join(' ')).toLowerCase();
  const id = data.id || `ext_${crypto.randomUUID()}`;
  
  return [{
    id,
    platform: PLATFORM,
    raw: data,
    title,
    createTime: data.create_time || data.created_at || createTime,
    updateTime: data.update_time || data.updated_at || createTime,
    messages,
    searchText,
  }];
}
