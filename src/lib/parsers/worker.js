// src/lib/parsers/worker.js
// Web Worker for offloading heavy JSON parsing and processing

self.addEventListener('message', async (e) => {
    const { action, payload, jobId } = e.data;
    
    try {
        switch (action) {
            case 'PARSE_JSON': {
                const { file, source } = payload;
                // Read the file directly in the background thread to prevent UI freezing on 1GB files!
                const fileContent = await file.text();
                const parsed = JSON.parse(fileContent);
                
                // Assuming ChatGPT export format for now
                // We'll normalize the data to our DB schema
                let conversations = Array.isArray(parsed) ? parsed : [];
                
                const total = conversations.length;
                let processed = 0;
                
                // Send back in chunks to prevent IPC blocking
                const CHUNK_SIZE = 500;
                
                for (let i = 0; i < total; i += CHUNK_SIZE) {
                    const chunk = conversations.slice(i, i + CHUNK_SIZE).map(conv => ({
                        id: conv.id || conv.conversation_id || crypto.randomUUID(),
                        title: conv.title || '(Sem título)',
                        createTime: conv.create_time,
                        updateTime: conv.update_time,
                        platform: source || 'chatgpt',
                        // Meta extraction for Library scalability (US3)
                        snippet: (() => {
                            const msgs = Object.values(conv.mapping || {}).map(n => n.message).filter(Boolean);
                            const userMsg = msgs.find(m => m.author?.role === 'user');
                            if (!userMsg) return null;
                            const text = userMsg.content?.parts?.find(p => typeof p === 'string') || '';
                            return text.length > 150 ? text.slice(0, 150) + "..." : text;
                        })(),
                        messageCount: Object.values(conv.mapping || {}).length,
                        resources: Object.values(conv.mapping || {})
                            .map(n => n.message)
                            .filter(Boolean)
                            .flatMap(m => {
                                const r = [];
                                // Extract images/files for the library
                                if (m.author?.role === 'user' && m.content?.parts) {
                                    m.content.parts.forEach(p => {
                                        if (typeof p === 'object') r.push({ type: 'attachment', data: p });
                                    });
                                }
                                return r;
                            }),
                        // Extract messages to separate table
                        _messages: Object.values(conv.mapping || {}).map(node => node.message).filter(Boolean)
                    }));
                    
                    processed += chunk.length;
                    
                    self.postMessage({ 
                        jobId, 
                        status: 'progress', 
                        data: { chunk, processed, total } 
                    });
                }

                self.postMessage({ jobId, status: 'success', data: null });
                break;
            }
            default:
                throw new Error(`Unknown action: ${action}`);
        }
    } catch (error) {
        self.postMessage({ jobId, status: 'error', error: error.message });
    }
});
