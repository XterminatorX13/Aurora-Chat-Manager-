/**
 * Agnostic Memory Parser
 * Parses memory summaries or lists from data exports into a standardized Umbra format.
 */

/**
 * Detect if the JSON data represents a memory profile or summary
 */
export function detect(data) {
  if (!data) return false;
  
  // It could be an array of memory objects
  if (Array.isArray(data)) {
    if (data.length > 0 && (data[0].content || data[0].memory || data[0].text)) {
      return true;
    }
    return false;
  }
  
  // Or it could be an object with memory-related keys
  const keys = Object.keys(data).map(k => k.toLowerCase());
  return keys.some(k => k.includes('memory') || k.includes('profile') || k.includes('summary'));
}

/**
 * Parse memory data into a standardized Umbra Memory Profile
 */
export function parse(data) {
  const profile = {
    type: 'memory_profile',
    platform: 'agnostic',
    lastUpdated: new Date().toISOString(),
    facts: []
  };

  if (Array.isArray(data)) {
    // Handling list of memories (e.g., from an MCP output or older style)
    profile.facts = data.map((item, i) => {
      if (typeof item === 'string') {
        return { id: `mem_${i}`, category: 'General', content: item };
      }
      return {
        id: item.id || `mem_${i}`,
        category: item.category || item.topic || 'General',
        content: item.content || item.text || item.memory || JSON.stringify(item),
        date: item.createdAt || item.updatedAt || null
      };
    });
  } else if (typeof data === 'object') {
    // Handling structured summary object
    // E.g., { "Visão Geral": "Você é uma pessoa...", "Tecnologia": "..." }
    let idCounter = 0;
    
    // Look for nested memory objects
    const memoryObj = data.memory || data.memories || data.summary || data;
    
    if (Array.isArray(memoryObj)) {
        return parse(memoryObj); // recursively parse if nested array
    }

    for (const [key, value] of Object.entries(memoryObj)) {
      if (typeof value === 'string') {
        profile.facts.push({
          id: `mem_struct_${idCounter++}`,
          category: key, // e.g., "Visão Geral"
          content: value
        });
      } else if (typeof value === 'object' && value !== null) {
        // Fallback for deeply nested strings
        profile.facts.push({
          id: `mem_struct_${idCounter++}`,
          category: key,
          content: JSON.stringify(value, null, 2)
        });
      }
    }
  }

  return profile;
}
