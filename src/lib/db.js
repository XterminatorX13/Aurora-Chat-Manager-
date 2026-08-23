/**
 * Dexie Database - IndexedDB wrapper for large data storage
 * Solves localStorage quota limitations
 */
import Dexie from 'dexie';

// Create database
export const db = new Dexie('ChatGPT_PKM');

// Define schema
// v1: original schema
db.version(1).stores({
    conversations: 'id, title, createTime, updateTime',
    metadata: 'id, folder, favorite, *tags'
});

// v2: add platform field for multi-AI support
db.version(2).stores({
    conversations: 'id, title, createTime, updateTime, platform',
    metadata: 'id, folder, favorite, *tags'
});

// v3: separate messages table to avoid loading huge conversation objects into memory
db.version(3).stores({
    conversations: 'id, title, createTime, updateTime, platform',
    metadata: 'id, folder, favorite, *tags',
    messages: '++id, conversationId, role, createTime'
});

/**
 * Save all conversations
 * @param {Array} conversations - Array of conversation objects
 */
export async function saveConversations(conversations) {
    try {
        const toSaveConvs = [];
        const toSaveMsgs = [];
        
        for (const conv of conversations) {
            const id = conv.id || conv.conversation_id;
            
            // Collect messages if any
            if (conv._messages && conv._messages.length > 0) {
                for (const msg of conv._messages) {
                    toSaveMsgs.push({
                        conversationId: id,
                        role: msg.author?.role || 'user',
                        createTime: msg.create_time || (Date.now() / 1000), // OpenAI uses seconds
                        content: msg
                    });
                }
            }
            
            // Delete _messages so we don't save duplicate data
            const raw = conv.raw || conv;
            delete raw._messages;

            toSaveConvs.push({
                id,
                title: conv.title,
                createTime: conv.create_time || conv.createTime,
                updateTime: conv.update_time || conv.updateTime,
                platform: conv.platform || 'chatgpt',
                data: raw
            });
        }
        
        await db.transaction('rw', db.conversations, db.messages, async () => {
            if (toSaveConvs.length > 0) await db.conversations.bulkPut(toSaveConvs);
            if (toSaveMsgs.length > 0) await db.messages.bulkPut(toSaveMsgs);
        });
        
        console.log(`💾 Saved ${toSaveConvs.length} conversations and ${toSaveMsgs.length} messages`);
        return true;
    } catch (error) {
        console.error('Error saving conversations:', error);
        throw error;
    }
}

/**
 * Load all conversations
 * @returns {Array} Array of conversation objects
 */
export async function loadConversations() {
    try {
        const rows = await db.conversations.toArray();
        console.log(`📂 Loaded ${rows.length} conversations from IndexedDB`);
        return rows.map(row => {
            const data = row.data || {};
            // Attach the persisted platform field back onto the data
            if (row.platform && !data.platform) {
                data.platform = row.platform;
            }
            return data;
        });
    } catch (error) {
        console.error('Error loading conversations:', error);
        return [];
    }
}

/**
 * Save metadata for a conversation
 * @param {string} id - Conversation ID
 * @param {Object} meta - Metadata object
 */
export async function saveMetadata(id, meta) {
    try {
        await db.metadata.put({ id, ...meta });
    } catch (error) {
        console.error('Error saving metadata:', error);
    }
}

/**
 * Load all metadata
 * @returns {Object} Map of id -> metadata
 */
export async function loadAllMetadata() {
    try {
        const rows = await db.metadata.toArray();
        const result = {};
        rows.forEach(row => {
            const { id, ...meta } = row;
            result[id] = meta;
        });
        console.log(`📂 Loaded ${rows.length} metadata entries from IndexedDB`);
        return result;
    } catch (error) {
        console.error('Error loading metadata:', error);
        return {};
    }
}

/**
 * Bulk save all metadata
 * @param {Object} metadata - Map of id -> metadata
 */
export async function saveAllMetadata(metadata) {
    try {
        const entries = Object.entries(metadata).map(([id, meta]) => ({
            id,
            ...meta
        }));
        await db.metadata.bulkPut(entries);
        console.log(`💾 Saved ${entries.length} metadata entries to IndexedDB`);
    } catch (error) {
        console.error('Error saving metadata:', error);
    }
}

/**
 * Migrate from localStorage to IndexedDB
 * Call this once on startup to migrate existing data
 */
export async function migrateFromLocalStorage() {
    try {
        // Check if migration needed
        const count = await db.conversations.count();
        if (count > 0) {
            console.log('✅ IndexedDB already has data, skipping migration');
            return false;
        }

        // Migrate conversations
        const savedConvs = localStorage.getItem('auto-saved-conversations');
        if (savedConvs) {
            const convs = JSON.parse(savedConvs);
            if (Array.isArray(convs) && convs.length > 0) {
                const toSave = convs.map(conv => ({
                    id: conv.id || conv.conversation_id || crypto.randomUUID(),
                    title: conv.title || '(Sem título)',
                    createTime: conv.create_time,
                    updateTime: conv.update_time,
                    data: conv
                }));
                await db.conversations.bulkPut(toSave);
                console.log(`✅ Migrated ${toSave.length} conversations to IndexedDB`);
            }
        }

        // Migrate metadata
        const savedMeta = localStorage.getItem('chatgpt-pkm-metadata');
        if (savedMeta) {
            const meta = JSON.parse(savedMeta);
            const entries = Object.entries(meta).map(([id, m]) => ({ id, ...m }));
            if (entries.length > 0) {
                await db.metadata.bulkPut(entries);
                console.log(`✅ Migrated ${entries.length} metadata entries to IndexedDB`);
            }
        }

        // Clear old localStorage after successful migration
        // localStorage.removeItem('auto-saved-conversations'); // Uncomment after testing
        console.log('🎉 Migration complete! (localStorage preserved for safety)');
        return true;
    } catch (error) {
        console.error('Migration error:', error);
        return false;
    }
}

/**
 * Get database stats
 */
export async function getDbStats() {
    const convCount = await db.conversations.count();
    const metaCount = await db.metadata.count();
    return { conversations: convCount, metadata: metaCount };
}

export default db;
