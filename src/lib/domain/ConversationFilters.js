import Fuse from 'fuse.js';
import { getConvKey } from '../utils.js';

export function applyAdvancedFilters(conversations, metadata, activeFolder, advancedFilters, showFilters) {
    return conversations.filter((c) => {
        const key = getConvKey(c);
        const meta = metadata[key] ?? {};
        if (meta.deleted) return false;

        if (showFilters && advancedFilters) {
            const fm = c.filterMeta || {};
            const { models, hasImageGen, hasWebSearch, isDeepResearch, isReasoning, hasCanvas, hasCode, dateFrom, dateTo } = advancedFilters;

            if (models && models.length > 0 && !models.includes(fm.modelSlug)) return false;

            const hasImage = fm.hasImageGen || fm.hasImages;
            const hasVideos = fm.hasVideos;
            const isDeepRes = fm.isDeepResearch;
            const isReason = fm.reasoningTime > 0;
            
            if (hasImageGen && !hasImage) return false;
            if (hasWebSearch && !hasVideos) return false;
            if (isDeepResearch && !isDeepRes) return false;
            if (isReasoning && !isReason) return false;
            if (hasCanvas && !fm.hasCanvas) return false;
            if (hasCode && !fm.hasCode) return false;
            
            if (dateFrom && fm.createDate && fm.createDate < new Date(dateFrom)) return false;
            if (dateTo && fm.createDate) {
                const endOfDay = new Date(dateTo);
                endOfDay.setHours(23, 59, 59, 999);
                if (fm.createDate > endOfDay) return false;
            }
        }

        if (activeFolder === "__FAV__") return !!meta.favorite;
        if (activeFolder !== "__ALL__" && activeFolder !== "__FAV__") return meta.folder === activeFolder;
        
        return true;
    });
}

export function applyFuzzySearch(list, searchTerm, searchMode) {
    if (!searchTerm || !searchTerm.trim()) {
        return { items: list, searchResults: [] };
    }

    if (searchMode === "title") {
        const fuse = new Fuse(list, {
            keys: ['title'],
            threshold: 0.4,
            ignoreLocation: true
        });
        return { items: fuse.search(searchTerm).map(r => r.item), searchResults: [] };
    } else {
        // Deep search across content
        const fuse = new Fuse(list, {
            keys: ['searchText'],
            threshold: 0.3,
            ignoreLocation: true,
            includeMatches: true
        });
        
        const fuseResults = fuse.search(searchTerm);
        const searchResults = [];
        const items = [];
        
        for (const res of fuseResults) {
            const conv = res.item;
            const text = conv.searchText || "";
            let snippet = "";
            let matchIndex = -1;
            
            if (res.matches && res.matches.length > 0) {
                const match = res.matches[0];
                if (match.indices && match.indices.length > 0) {
                    const [startIdx] = match.indices[0];
                    matchIndex = startIdx;
                    const start = Math.max(0, startIdx - 40);
                    const end = Math.min(text.length, startIdx + searchTerm.length + 60);
                    snippet = text.slice(start, end);
                    if (start > 0) snippet = "..." + snippet;
                    if (end < text.length) snippet = snippet + "...";
                }
            }
            searchResults.push({ conversation: conv, snippet, matchIndex });
            items.push(conv);
        }
        
        return { items, searchResults };
    }
}
