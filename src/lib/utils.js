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
    if (conv.id && typeof conv.id === 'string' && conv.id.length > 0) {
        const isGeneratedKey = conv.id.includes('@@');
        if (!isGeneratedKey || conv.raw) {
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

const MILLISECONDS_PER_SECOND = 1000;
const MIN_MS_TIMESTAMP = 100000000000;

function getValidDate(timestamp) {
    if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp);
        return isNaN(parsed.valueOf()) ? null : parsed;
    }
    if (typeof timestamp === 'number' && !isNaN(timestamp)) {
        const isSeconds = timestamp < MIN_MS_TIMESTAMP;
        const msTimestamp = isSeconds ? timestamp * MILLISECONDS_PER_SECOND : timestamp;
        const parsed = new Date(msTimestamp);
        return isNaN(parsed.valueOf()) ? null : parsed;
    }
    return null;
}

export function formatDate(timestamp) {
    if (!timestamp) return "";
    
    const validDate = getValidDate(timestamp);
    if (validDate) {
        const options = { year: "numeric", month: "short", day: "numeric" };
        return validDate.toLocaleDateString("pt-BR", options);
    }
    
    return "";
}

/**
 * Groups an array of conversations by Month/Year
 * Returns an array of group objects: [{ key: "2026-07", title: "Julho de 2026", isOpen: true, items: [...] }]
 */
function getConversationDate(conv) {
    const timestamp = conv.filterMeta?.createDate 
        ? conv.filterMeta.createDate 
        : (conv.createTime ? conv.createTime * MILLISECONDS_PER_SECOND : 0);
    return new Date(timestamp);
}

function buildMonthTitle(date) {
    const monthName = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
}

export function groupConversationsByMonth(conversations) {
    const map = new Map();
    for (const c of conversations) {
        const date = getConversationDate(c);
        
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const key = `${yyyy}-${mm}`;
        
        if (!map.has(key)) {
            map.set(key, { key, title: buildMonthTitle(date), isOpen: false, items: [] });
        }
        map.get(key).items.push(c);
    }
    
    const sortedKeys = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));
    const result = sortedKeys.map(k => map.get(k));
    
    if (result.length > 0) result[0].isOpen = true;
    if (result.length > 1) result[1].isOpen = true;
    
    return result;
}

const BYTES_PER_KILOBYTE = 1024;
const BYTE_SIZES = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0 || isNaN(bytes)) return '0 Bytes';
    const dm = decimals < 0 ? 0 : decimals;
    const exponent = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_KILOBYTE));
    const value = parseFloat((bytes / Math.pow(BYTES_PER_KILOBYTE, exponent)).toFixed(dm));
    return `${value} ${BYTE_SIZES[exponent]}`;
}

export function deduplicateConversations(conversations) {
    const seen = new Set();
    const result = [];
    
    // Sort to prioritize keeping the most recently updated versions
    const sorted = [...conversations].sort((a, b) => {
        const timeA = a.updateTime || a.createTime || 0;
        const timeB = b.updateTime || b.createTime || 0;
        return timeB - timeA;
    });

    for (const c of sorted) {
        const key = getConvKey(c);
        if (!seen.has(key)) {
            seen.add(key);
            result.push(c);
        }
    }
    return result;
}
