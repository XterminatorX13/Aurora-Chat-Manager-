import { writable, derived } from 'svelte/store';
import { applyAdvancedFilters, applyFuzzySearch } from '../domain/ConversationFilters.js';
import { groupConversationsByMonth } from '../utils.js';

function createConversationQueryStore() {
    const { subscribe, set, update } = writable({
        searchTerm: "",
        searchMode: "title", // 'title' or 'content'
        activeFolder: "__ALL__",
        showFilters: false,
        advancedFilters: {
            models: [],
            hasImageGen: null,
            hasWebSearch: null,
            isDeepResearch: null,
            isReasoning: null,
            hasCanvas: null,
            hasCode: null,
            dateFrom: null,
            dateTo: null,
        }
    });

    return {
        subscribe,
        set,
        update,
        setSearchTerm: (term) => update(s => ({ ...s, searchTerm: term })),
        setSearchMode: (mode) => update(s => ({ ...s, searchMode: mode })),
        setActiveFolder: (folder) => update(s => ({ ...s, activeFolder: folder })),
        toggleShowFilters: () => update(s => ({ ...s, showFilters: !s.showFilters })),
        setAdvancedFilters: (filters) => update(s => ({ ...s, advancedFilters: { ...s.advancedFilters, ...filters } })),
        clearFilters: () => update(s => ({
            ...s,
            advancedFilters: {
                models: [], hasImageGen: null, hasWebSearch: null, isDeepResearch: null,
                isReasoning: null, hasCanvas: null, hasCode: null, dateFrom: null, dateTo: null
            }
        }))
    };
}

export const conversationQuery = createConversationQueryStore();

export function createDerivedResults(conversationsStore, metadataStore) {
    return derived(
        [conversationsStore, metadataStore, conversationQuery],
        ([$conversations, $metadata, $query]) => {
            const filtered = applyAdvancedFilters(
                $conversations, 
                $metadata, 
                $query.activeFolder, 
                $query.advancedFilters, 
                $query.showFilters
            );
            
            const { items, searchResults } = applyFuzzySearch(filtered, $query.searchTerm, $query.searchMode);
            const groups = groupConversationsByMonth(items);
            
            return {
                list: items,
                groups,
                searchResults,
                hasActiveAdvancedFilters: (
                    $query.advancedFilters.models.length > 0 ||
                    $query.advancedFilters.hasImageGen ||
                    $query.advancedFilters.hasWebSearch ||
                    $query.advancedFilters.isDeepResearch ||
                    $query.advancedFilters.isReasoning ||
                    $query.advancedFilters.hasCanvas ||
                    $query.advancedFilters.hasCode ||
                    $query.advancedFilters.dateFrom ||
                    $query.advancedFilters.dateTo
                ),
                activeAdvancedFilterCount: (
                    $query.advancedFilters.models.length +
                    ($query.advancedFilters.hasImageGen ? 1 : 0) +
                    ($query.advancedFilters.hasWebSearch ? 1 : 0) +
                    ($query.advancedFilters.isDeepResearch ? 1 : 0) +
                    ($query.advancedFilters.isReasoning ? 1 : 0) +
                    ($query.advancedFilters.hasCanvas ? 1 : 0) +
                    ($query.advancedFilters.hasCode ? 1 : 0) +
                    ($query.advancedFilters.dateFrom || $query.advancedFilters.dateTo ? 1 : 0)
                )
            };
        }
    );
}
