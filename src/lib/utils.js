/**
 * Utility functions for conversation normalization
 * 
 * Now supports multi-platform conversations:
 * - If conv already has `platform` and `messages` (from parsers), it's returned as-is
 * - Legacy ChatGPT format (raw mapping) is normalized for backwards compatibility
 */

import { normalizeConversation as chatgptNormalize } from './utils/data.js';

export function normalizeConversation(conv) {
    // If the conversation already came from a parser (has platform + messages),
    // just ensure it has searchText and return it
    if (conv.platform && Array.isArray(conv.messages) && conv.messages.length > 0) {
        return {
            ...conv,
            id: conv.id || getConvKey(conv),
            platform: conv.platform,
            raw: conv.raw || conv,
            title: conv.title || '(Sem título)',
            createTime: conv.createTime || conv.create_time || null,
            updateTime: conv.updateTime || conv.update_time || null,
            messages: conv.messages,
            searchText: conv.searchText || buildSearchText(conv.title, conv.messages),
        };
    }

    // Legacy path: raw ChatGPT format with mapping
    const normalized = chatgptNormalize(conv);
    normalized.platform = 'chatgpt';
    return normalized;
}

export function getConvKey(conv) {
    // Direct id from conversation object
    if (conv.id && typeof conv.id === 'string' && conv.id.length > 0) {
        // Avoid returning the id if it looks like a getConvKey-generated one
        // to prevent double-wrapping
        if (!conv.id.includes('@@') || conv.raw) {
            return conv.id;
        }
    }
    const raw = conv.raw || {};
    const externalId = raw.id || null;
    const title = conv.title || '';
    const ctime = conv.createTime || 0;
    if (externalId) return externalId;
    return `${title}@@${ctime}`;
}

function buildSearchText(title, messages) {
    return (
        (title || '') + ' ' + (messages || []).map(m => m.textPlain || '').join(' ')
    ).toLowerCase();
}

export function formatDate(timestamp) {
    if (!timestamp) return "";
    const d = new Date(timestamp * (timestamp < 100000000000 ? 1000 : 1));
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Intl.DateTimeFormat("pt-BR", options).format(d);
}

/**
 * Groups an array of conversations by Month/Year
 * Returns an array of group objects: [{ key: "2026-07", title: "Julho de 2026", isOpen: true, items: [...] }]
 */
export function groupConversationsByMonth(conversations) {
    const map = new Map();
    for (const c of conversations) {
        const timestamp = c.filterMeta?.createDate ? c.filterMeta.createDate : (c.createTime ? c.createTime * 1000 : 0);
        const date = new Date(timestamp);
        
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const key = `${yyyy}-${mm}`;
        
        if (!map.has(key)) {
            const monthName = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
            // Capitalize first letter of month
            const title = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            map.set(key, { key, title, isOpen: false, items: [] });
        }
        map.get(key).items.push(c);
    }
    
    // Sort keys descending (newest first)
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    const result = sortedKeys.map(k => map.get(k));
    
    // Open the first two groups by default
    if (result.length > 0) result[0].isOpen = true;
    if (result.length > 1) result[1].isOpen = true;
    
    return result;
}

export function formatBytes(bytes, decimals = 2) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
