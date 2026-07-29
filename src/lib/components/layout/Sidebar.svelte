<script>
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import { getConvKey, formatDate } from "$lib/utils";
    import InputModal from "$lib/components/base/InputModal.svelte";
    import FilterPanel from "$lib/components/filters/FilterPanel.svelte";
    import {
        Plus,
        MessageSquare,
        FolderOpen,
        Star,
        BarChart2,
        Settings,
        Search,
        ChevronsLeft,
        ChevronDown,
        ChevronRight,
        Download,
        Library
    } from "lucide-svelte";

    export let conversations = [];
    export let metadata = {};
    export let activeId = null;
    export let activeFolder = "__ALL__";

    const dispatch = createEventDispatcher();

    let showingStats = false;
    let searchTerm = "";
    let searchMode = "title"; // 'title' or 'content'
    let searchResults = [];

    // Advanced filter state
    let showFilters = false;
    let advancedFilters = {
        models: [],
        hasImageGen: null,
        hasWebSearch: null,
        isDeepResearch: null,
        isReasoning: null,
        hasCanvas: null,
        hasCode: null,
        dateFrom: null,
        dateTo: null,
    };

    // Modal state for folder management
    let modalOpen = false;
    let modalTitle = "";
    let modalPlaceholder = "";
    let modalDefault = "";
    let modalStep = ""; 
    let pendingFolderName = "";
    let pendingFolderIcon = "";
    let editingFolderName = "";

    const FOLDER_META_KEY = "pkm_folder_meta_v1";
    let folderMeta = {};

    try {
        const saved = localStorage.getItem(FOLDER_META_KEY);
        if (saved) folderMeta = JSON.parse(saved);
    } catch (e) {}

    function saveFolderMeta() {
        localStorage.setItem(FOLDER_META_KEY, JSON.stringify(folderMeta));
    }

    function randomFolderColor() {
        const palette = ["#4F1366", "#3B0E4F", "#5E1A72", "#7A1E8A", "#9D3BB0", "#C850C0", "#FF6EC7"];
        return palette[Math.floor(Math.random() * palette.length)];
    }

    function getFolderMeta(name) {
        if (!folderMeta[name]) {
            folderMeta[name] = { icon: "📁", color: randomFolderColor() };
            folderMeta = { ...folderMeta };
            saveFolderMeta();
        }
        return folderMeta[name];
    }

    $: foldersSet = new Set(
        conversations.map((c) => metadata[getConvKey(c)]?.folder).filter(Boolean)
    );
    $: folders = Array.from(foldersSet).sort();

    $: hasActiveAdvancedFilters =
        advancedFilters.models.length > 0 ||
        advancedFilters.hasImageGen ||
        advancedFilters.hasWebSearch ||
        advancedFilters.isDeepResearch ||
        advancedFilters.isReasoning ||
        advancedFilters.hasCanvas ||
        advancedFilters.hasCode ||
        advancedFilters.dateFrom ||
        advancedFilters.dateTo;

    $: activeAdvancedFilterCount =
        advancedFilters.models.length +
        (advancedFilters.hasImageGen ? 1 : 0) +
        (advancedFilters.hasWebSearch ? 1 : 0) +
        (advancedFilters.isDeepResearch ? 1 : 0) +
        (advancedFilters.isReasoning ? 1 : 0) +
        (advancedFilters.hasCanvas ? 1 : 0) +
        (advancedFilters.hasCode ? 1 : 0) +
        (advancedFilters.dateFrom || advancedFilters.dateTo ? 1 : 0);

    $: filtered = (() => {
        const { models, hasImageGen, hasWebSearch, isDeepResearch, isReasoning, hasCanvas, hasCode, dateFrom, dateTo } = advancedFilters;

        if (searchMode === "content" && searchTerm && searchResults.length > 0) {
            return searchResults.map((r) => r.conversation).filter((c) => {
                const fm = c.filterMeta;
                if (!fm) return true;
                if (models.length > 0 && !models.includes(fm.modelSlug)) return false;
                if (hasImageGen && !fm.hasImageGen) return false;
                if (hasWebSearch && !fm.hasWebSearch) return false;
                if (isDeepResearch && !fm.isDeepResearch) return false;
                if (isReasoning && !fm.isReasoning) return false;
                if (hasCanvas && !fm.hasCanvas) return false;
                if (hasCode && !fm.hasCode) return false;
                if (dateFrom && fm.createDate && fm.createDate < dateFrom) return false;
                if (dateTo && fm.createDate) {
                    const endOfDay = new Date(dateTo);
                    endOfDay.setHours(23, 59, 59, 999);
                    if (fm.createDate > endOfDay) return false;
                }
                return true;
            });
        }

        return conversations.filter((c) => {
            const key = getConvKey(c);
            const meta = metadata[key] ?? {};
            if (meta.deleted) return false;

            const fm = c.filterMeta;
            if (fm) {
                if (models.length > 0 && !models.includes(fm.modelSlug)) return false;
                if (hasImageGen && !fm.hasImageGen) return false;
                if (hasWebSearch && !fm.hasWebSearch) return false;
                if (isDeepResearch && !fm.isDeepResearch) return false;
                if (isReasoning && !fm.isReasoning) return false;
                if (hasCanvas && !fm.hasCanvas) return false;
                if (hasCode && !fm.hasCode) return false;
                if (dateFrom && fm.createDate && fm.createDate < dateFrom) return false;
                if (dateTo && fm.createDate) {
                    const endOfDay = new Date(dateTo);
                    endOfDay.setHours(23, 59, 59, 999);
                    if (fm.createDate > endOfDay) return false;
                }
            }

            if (activeFolder === "__ALL__") {
                if (searchTerm && searchMode === "title") {
                    const q = searchTerm.toLowerCase();
                    return (c.title || "").toLowerCase().includes(q);
                }
                return true;
            }
            if (activeFolder === "__FAV__") return !!meta.favorite;
            return meta.folder === activeFolder;
        });
    })();

    function getSnippetForConv(convId) {
        const result = searchResults.find((r) => getConvKey(r.conversation) === convId);
        return result?.snippet || null;
    }

    function performDeepSearch(query) {
        if (!query || query.length < 2) {
            searchResults = [];
            return;
        }
        const q = query.toLowerCase();
        const results = [];
        for (const conv of conversations) {
            const key = getConvKey(conv);
            const meta = metadata[key] ?? {};
            if (meta.deleted) continue;

            const messages = conv.messages || [];
            for (const msg of messages) {
                const text = msg.textPlain || msg.textMarkdown || "";
                const lowerText = text.toLowerCase();
                const idx = lowerText.indexOf(q);
                if (idx !== -1) {
                    const start = Math.max(0, idx - 40);
                    const end = Math.min(text.length, idx + query.length + 60);
                    let snippet = text.slice(start, end);
                    if (start > 0) snippet = "..." + snippet;
                    if (end < text.length) snippet = snippet + "...";
                    results.push({ conversation: conv, snippet, matchIndex: idx });
                    break;
                }
            }
        }
        searchResults = results;
    }

    let searchTimeout = null;
    $: {
        if (searchMode === "content" && searchTerm) {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => performDeepSearch(searchTerm), 300);
        } else {
            searchResults = [];
        }
    }

    $: stats = {
        total: conversations.filter((c) => !metadata[getConvKey(c)]?.deleted).length,
        favorites: conversations.filter((c) => metadata[getConvKey(c)]?.favorite).length,
        withNotes: conversations.filter((c) => metadata[getConvKey(c)]?.notes?.trim()).length,
        folders: folders.length,
    };

    function setActiveFolder(folderId) {
        activeFolder = folderId;
        dispatch("folderChange", { folder: folderId });
    }

    function createNewFolder() {
        modalStep = "newFolderName";
        modalTitle = "Nome da nova pasta";
        modalPlaceholder = "Ex.: Trabalho";
        modalDefault = "";
        modalOpen = true;
    }

    function handleModalSubmit(event) {
        const value = event.detail.value;
        if (modalStep === "newFolderName") {
            if (!value) return;
            pendingFolderName = value;
            modalStep = "newFolderIcon";
            modalTitle = `Ícone para "${value}" (emoji)`;
            modalDefault = "📁";
            modalPlaceholder = "📁 ou outro emoji";
            modalOpen = true;
        } else if (modalStep === "newFolderIcon") {
            pendingFolderIcon = value || "📁";
            modalStep = "newFolderColor";
            modalTitle = `Cor para "${pendingFolderName}"`;
            modalDefault = randomFolderColor();
            modalPlaceholder = "#hex ou nome";
            modalOpen = true;
        } else if (modalStep === "newFolderColor") {
            const color = value || randomFolderColor();
            folderMeta[pendingFolderName] = { icon: pendingFolderIcon, color };
            folderMeta = { ...folderMeta };
            saveFolderMeta();
            pendingFolderName = "";
            pendingFolderIcon = "";
        }
    }

    function select(key) {
        dispatch("select", { id: key });
    }

    let scrollContainer;
    let renderLimit = 50;

    function handleScroll(e) {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            renderLimit += 50;
        }
    }

    $: if (activeFolder || searchTerm || advancedFilters) renderLimit = 50;

    function highlightSnippet(text, term) {
        if (!term || !text) return text;
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escaped})`, "gi");
        return text.replace(
            regex,
            '<mark style="background: var(--highlight); color: #fff; padding: 0 2px; border-radius: 2px;">$1</mark>'
        );
    }

    let isCollapsed = false;
    let showProjects = false;

    function getModelLogo(modelSlug, modelName) {
        const str = (modelSlug || modelName || "").toLowerCase();
        if (str.includes("gpt") || str.includes("openai")) return "/src/lib/assets/logos/openai.svg";
        if (str.includes("claude") || str.includes("anthropic")) return "/src/lib/assets/logos/anthropic.svg";
        if (str.includes("gemini") || str.includes("google")) return "/src/lib/assets/logos/gemini.svg";
        if (str.includes("grok") || str.includes("xai")) return "/src/lib/assets/logos/x.svg";
        return null;
    }
</script>

<aside class="sidebar-wrapper" class:collapsed={isCollapsed}>
    {#if !isCollapsed}
        <!-- ZONA 1: Header -->
        <div class="sidebar-header">
            <div class="logo">Umbra</div>
            <button class="collapse-btn" on:click={() => isCollapsed = true}>
                <ChevronsLeft size={16} />
            </button>
        </div>

        <!-- ZONA 2: Nav Global -->
        <nav class="sidebar-nav">
            <button class="nav-item primary-action" on:click={() => {
                dispatch("openFilePicker");
            }}>
                <Plus size={16} strokeWidth={2.5}/> Novo Chat
            </button>

            <button class="nav-item" class:active={activeFolder === "__ALL__"} on:click={() => {
                dispatch("navigate", { route: "all" });
            }}>
                <MessageSquare size={16} /> Conversas
            </button>

            <button class="nav-item" on:click={() => dispatch("navigate", { route: "library" })}>
                <Library size={16} /> Biblioteca
            </button>

            <div class="nav-group">
                <button class="nav-item justify-between" class:active={showProjects || (activeFolder !== "__ALL__" && activeFolder !== "__FAV__")} on:click={() => showProjects = !showProjects}>
                    <div class="flex items-center gap-2">
                        <FolderOpen size={16} /> Projetos
                    </div>
                    {#if showProjects}
                        <ChevronDown size={14} />
                    {:else}
                        <ChevronRight size={14} />
                    {/if}
                </button>
                {#if showProjects}
                    <div class="nav-subgroup">
                        {#each folders as folderName}
                            <button class="nav-item sub-item" class:active={activeFolder === folderName} on:click={() => setActiveFolder(folderName)}>
                                <span class="emoji-icon">{getFolderMeta(folderName).icon}</span> {folderName}
                            </button>
                        {/each}
                        <button class="nav-item sub-item add-btn" on:click={createNewFolder}>
                            <Plus size={14} /> Novo projeto
                        </button>
                    </div>
                {/if}
            </div>

            <button class="nav-item" class:active={activeFolder === "__FAV__"} on:click={() => setActiveFolder("__FAV__")}>
                <Star size={16} /> Favoritos
            </button>
        </nav>

        <div class="divider"></div>

        <!-- ZONA 3: Recentes / Histórico -->
        <div class="recents-header">
            <span>{activeFolder === '__ALL__' ? 'Recentes' : activeFolder === '__FAV__' ? 'Favoritos' : activeFolder}</span>
            <button class="filter-btn" class:active={showFilters || hasActiveAdvancedFilters} on:click={() => showFilters = !showFilters}>
                <Search size={14} />
                {#if activeAdvancedFilterCount > 0}
                    <span class="badge">{activeAdvancedFilterCount}</span>
                {/if}
            </button>
            <FilterPanel
                {conversations}
                bind:filters={advancedFilters}
                isOpen={showFilters}
                on:change={(e) => (advancedFilters = { ...e.detail })}
                on:apply={(e) => {
                    advancedFilters = { ...e.detail };
                    showFilters = false;
                }}
                on:close={() => (showFilters = false)}
            />
        </div>

        {#if showFilters || hasActiveAdvancedFilters}
            <div class="search-box">
                <input type="text" bind:value={searchTerm} placeholder={searchMode === "title" ? "Buscar título..." : "Buscar conteúdo..."} />
                <button class="toggle-mode" on:click={() => searchMode = searchMode === "title" ? "content" : "title"}>
                    {searchMode === "title" ? "T" : "C"}
                </button>
            </div>
        {/if}

        <div class="sidebar-recents custom-scrollbar" on:scroll={handleScroll} bind:this={scrollContainer}>
            {#each filtered.slice(0, renderLimit) as conv (getConvKey(conv))}
                {@const key = getConvKey(conv)}
                {@const meta = metadata[key] ?? {}}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div class="conv-row" class:active={activeId === key} on:click={() => select(key)}>
                    <div class="conv-title truncate">
                        {#if meta.favorite}<Star size={12} class="inline mr-1 text-yellow-400" />{/if}
                        {conv.title || "(Sem título)"}
                    </div>
                    
                    <!-- Tags / Badges -->
                    {#if conv.filterMeta}
                        <div class="conv-tags">
                            {#if conv.filterMeta.modelName}
                                <span class="tag tag-model">
                                    {#if getModelLogo(conv.filterMeta.modelSlug, conv.filterMeta.modelName)}
                                        <img src={getModelLogo(conv.filterMeta.modelSlug, conv.filterMeta.modelName)} alt="Logo" class="model-logo" />
                                    {/if}
                                    {conv.filterMeta.modelName}
                                </span>
                            {/if}
                            {#if conv.filterMeta.reasoningTime}
                                <span class="tag tag-reasoning">🧠 {conv.filterMeta.reasoningTime}s</span>
                            {/if}
                            {#if conv.filterMeta.hasCanvas}
                                <span class="tag tag-canvas">📝 Canvas</span>
                            {/if}
                            {#if conv.filterMeta.hasCode}
                                <span class="tag tag-code">💻 Code</span>
                            {/if}
                            {#if conv.filterMeta.isDeepResearch}
                                <span class="tag tag-research">🔍 Research</span>
                            {/if}
                            {#if conv.filterMeta.hasImageGen}
                                <span class="tag tag-image">🖼️ Imagem</span>
                            {/if}
                            {#if conv.filterMeta.hasWebSearch}
                                <span class="tag tag-web">🌐 Web</span>
                            {/if}
                        </div>
                    {/if}
                    
                    <div class="conv-meta">
                        <span>🗓️ {formatDate(conv.created)}</span>
                        {#if meta.folder}<span>📁 {meta.folder}</span>{/if}
                    </div>

                    {#if searchMode === "content" && getSnippetForConv(key)}
                        <div class="conv-snippet">
                            {@html highlightSnippet(getSnippetForConv(key), searchTerm)}
                        </div>
                    {/if}
                </div>
            {/each}
            {#if renderLimit < filtered.length}
                <div class="loading-more">Carregando mais...</div>
            {/if}
        </div>

        <div class="divider"></div>

        <!-- ZONA 4: Footer -->
        <div class="sidebar-footer">
            <div class="user-profile">
                <div class="avatar">V</div>
                <div class="user-name">Victor</div>
            </div>
            <button class="footer-btn" on:click={() => showingStats = !showingStats}>
                <BarChart2 size={16} />
            </button>
            <button class="footer-btn">
                <Settings size={16} />
            </button>
        </div>

    {:else}
        <!-- Collapsed state -->
        <div class="collapsed-nav">
            <button class="collapse-btn centered" on:click={() => isCollapsed = false}>
                <ChevronRight size={16} />
            </button>
            <button class="nav-icon primary" on:click={() => dispatch("openFilePicker")}>
                <Plus size={16} />
            </button>
            <button class="nav-icon" class:active={activeFolder === "__ALL__"} on:click={() => setActiveFolder("__ALL__")}>
                <MessageSquare size={16} />
            </button>
            <button class="nav-icon" class:active={activeFolder === "__FAV__"} on:click={() => setActiveFolder("__FAV__")}>
                <Star size={16} />
            </button>
        </div>
    {/if}
</aside>

<InputModal bind:isOpen={modalOpen} title={modalTitle} placeholder={modalPlaceholder} defaultValue={modalDefault} on:submit={handleModalSubmit} />

<style>
    /* Claude-inspired Minimalism */
    .sidebar-wrapper {
        display: flex;
        flex-direction: column;
        width: 260px;
        height: 100%;
        background: var(--bg-deep); /* Darker than panel */
        border-right: 1px solid var(--border);
        transition: width 0.2s ease;
        -webkit-app-region: drag;
        overflow: hidden;
    }
    .sidebar-wrapper.collapsed {
        width: 64px;
    }

    /* ZONA 1: Header */
    .sidebar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 16px 16px 8px 16px;
    }
    .logo {
        font-weight: 600;
        font-size: 14px;
        letter-spacing: 0.05em;
        color: var(--color-text-primary);
    }
    .collapse-btn {
        background: transparent;
        border: none;
        color: var(--color-text-tertiary);
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        -webkit-app-region: no-drag;
    }
    .collapse-btn:hover {
        background: var(--layer-1);
        color: var(--color-text-primary);
    }
    .collapsed-nav {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 16px 0;
        gap: 16px;
        -webkit-app-region: no-drag;
    }
    .centered {
        margin-bottom: 8px;
    }
    .nav-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: transparent;
        border: none;
        color: var(--color-text-secondary);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
    }
    .nav-icon:hover {
        background: var(--layer-1);
        color: var(--color-text-primary);
    }
    .nav-icon.active {
        background: var(--layer-2);
        color: var(--color-text-primary);
    }
    .nav-icon.primary {
        color: var(--highlight);
        background: rgba(199, 125, 255, 0.05);
    }
    .nav-icon.primary:hover {
        background: rgba(199, 125, 255, 0.1);
    }

    /* ZONA 2: Nav */
    .sidebar-nav {
        padding: 0 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        -webkit-app-region: no-drag;
        flex-shrink: 0;
    }
    .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 12px;
        border-radius: 8px;
        background: transparent;
        border: none;
        color: var(--color-text-secondary);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
    }
    .nav-item:hover {
        background: var(--layer-1);
        color: var(--color-text-primary);
    }
    .nav-item.active {
        background: var(--layer-2);
        color: var(--color-text-primary);
    }
    .nav-item.primary-action {
        color: var(--color-text-primary);
        background: var(--layer-2);
        margin-bottom: 8px;
    }
    .nav-item.primary-action:hover {
        background: var(--layer-3);
    }
    .justify-between {
        justify-content: space-between;
    }
    .flex { display: flex; }
    .items-center { align-items: center; }
    .gap-2 { gap: 8px; }
    
    .nav-group {
        display: flex;
        flex-direction: column;
    }
    .nav-subgroup {
        display: flex;
        flex-direction: column;
        padding-left: 24px;
        margin-top: 2px;
    }
    .sub-item {
        padding: 6px 12px;
        font-size: 12px;
    }
    .emoji-icon {
        font-size: 12px;
    }
    .add-btn {
        color: var(--color-text-tertiary);
    }

    .divider {
        height: 1px;
        background: var(--border-light);
        margin: 8px 16px;
        flex-shrink: 0;
    }

    /* ZONA 3: Recents */
    .recents-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 16px 8px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--color-text-tertiary);
        letter-spacing: 0.05em;
        -webkit-app-region: drag;
        flex-shrink: 0;
    }
    .filter-btn {
        background: transparent;
        border: none;
        color: var(--color-text-tertiary);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        display: flex;
        position: relative;
    }
    .filter-btn:hover {
        color: var(--color-text-primary);
        background: var(--layer-1);
    }
    .filter-btn.active {
        color: var(--highlight);
    }
    .badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background: var(--highlight);
        color: #000;
        font-size: 9px;
        font-weight: bold;
        padding: 0 4px;
        border-radius: 4px;
    }

    .search-box {
        display: flex;
        padding: 0 12px 8px 12px;
        gap: 4px;
        -webkit-app-region: no-drag;
        flex-shrink: 0;
    }
    .search-box input {
        flex: 1;
        background: var(--layer-1);
        border: 1px solid var(--border-light);
        color: var(--color-text-primary);
        padding: 6px 10px;
        border-radius: 6px;
        font-size: 12px;
        outline: none;
    }
    .search-box input:focus {
        border-color: var(--border-focus);
    }
    .toggle-mode {
        background: var(--layer-1);
        border: 1px solid var(--border-light);
        color: var(--color-text-secondary);
        border-radius: 6px;
        padding: 0 8px;
        font-size: 10px;
        font-weight: bold;
        cursor: pointer;
    }

    .sidebar-recents {
        flex: 1;
        overflow-y: auto;
        padding: 0 8px 24px 8px;
        -webkit-app-region: no-drag;
        min-height: 0;
        contain: content;
    }
    
    .conv-row {
        padding: 8px 12px;
        border-radius: 8px;
        cursor: pointer;
        color: var(--color-text-secondary);
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 2px;
    }
    .conv-row:hover {
        background: var(--layer-1);
        color: var(--color-text-primary);
    }
    .conv-row.active {
        background: var(--layer-2);
        color: var(--color-text-primary);
        font-weight: 500;
    }
    .truncate {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 13px;
    }
    .conv-snippet {
        font-size: 11px;
        color: var(--color-text-tertiary);
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        line-height: 1.4;
    }
    .loading-more {
        padding: 12px;
        text-align: center;
        font-size: 11px;
        color: var(--color-text-tertiary);
        border-top: 1px solid var(--border);
    }

    /* Conversation Tags */
    .conv-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin-top: 6px;
    }

    .tag {
        font-size: 9px;
        padding: 3px 6px;
        border-radius: 4px;
        font-weight: 600;
        letter-spacing: 0.02em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 140px;
        display: inline-block;
    }

    .tag-model {
        background: rgba(255, 255, 255, 0.1);
        color: #e4e4e7;
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .model-logo {
        width: 10px;
        height: 10px;
        filter: invert(1);
        opacity: 0.8;
    }

    .tag-reasoning {
        background: rgba(168, 85, 247, 0.15);
        color: #d8b4fe;
        border: 1px solid rgba(168, 85, 247, 0.3);
    }

    .tag-canvas {
        background: rgba(59, 130, 246, 0.15);
        color: #93c5fd;
    }

    .tag-code {
        background: rgba(249, 115, 22, 0.15);
        color: #fdba74;
    }

    .tag-research {
        background: rgba(16, 185, 129, 0.15);
        color: #6ee7b7;
    }

    .tag-image {
        background: rgba(236, 72, 153, 0.15);
        color: #f9a8d4;
    }

    .tag-web {
        background: rgba(14, 165, 233, 0.15);
        color: #7dd3fc;
    }
    
    /* ZONA 4: Footer */
    .sidebar-footer {
        display: flex;
        align-items: center;
        padding: 12px 16px;
        gap: 8px;
        -webkit-app-region: no-drag;
        flex-shrink: 0;
    }
    .user-profile {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }
    .avatar {
        width: 24px;
        height: 24px;
        border-radius: 12px;
        background: linear-gradient(135deg, var(--accent-1), var(--accent-2));
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 11px;
        font-weight: 600;
    }
    .conv-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-primary);
        line-height: 1.4;
    }
    
    .conv-meta {
        font-size: 10px;
        color: var(--color-text-tertiary);
        margin-top: 4px;
        display: flex;
        gap: 8px;
        align-items: center;
    }
    .user-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-primary);
    }
    .footer-btn {
        background: transparent;
        border: none;
        color: var(--color-text-tertiary);
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    .footer-btn:hover {
        color: var(--color-text-primary);
        background: var(--layer-1);
    }
</style>
