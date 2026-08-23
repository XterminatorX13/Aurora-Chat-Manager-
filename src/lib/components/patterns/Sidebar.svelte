<script>
    import { onMount, onDestroy } from "svelte";
    import { getConvKey, formatDate, groupConversationsByMonth } from "$lib/utils";
    import { writable } from 'svelte/store';
    import { conversationQuery, createDerivedResults } from "$lib/stores/ConversationQuery.js";
    import FilterPanel from "$lib/components/filters/FilterPanel.svelte";
    import PlatformBadge from "$lib/components/chat/PlatformBadge.svelte";
    import ProjectModal from "$lib/components/base/ProjectModal.svelte";
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
        Library,
        Sparkles,
        Brain,
        PenTool,
        Code2,
        Folder
    } from "lucide-svelte";

    let {
        conversations = [],
        metadata = {},
        activeId = null,
        activeFolder = $bindable('__ALL__'),
        activeView = "chat",
        onnavigate,
        onfolderChange,
        onselect,
        onopenFilePicker
    } = $props();

    let showingStats = $state(false);
    let searchResults = $state([]);

    const conversationsStore = writable([]);
    const metadataStore = writable({});
    
    $effect(() => {
        conversationsStore.set(conversations);
    });
    $effect(() => {
        metadataStore.set(metadata);
    });
    
    const queryResults = createDerivedResults(conversationsStore, metadataStore);
    
    // Bind UI state to the query store
    let searchTerm = $derived($conversationQuery.searchTerm);
    let searchMode = $derived($conversationQuery.searchMode);
    $effect(() => { activeFolder = $conversationQuery.activeFolder; });
    let showFilters = $derived($conversationQuery.showFilters);
    let advancedFilters = $derived($conversationQuery.advancedFilters);
    
    let filtered = $derived($queryResults.list);
    let groupedFiltered = $derived($queryResults.groups);
    $effect(() => {
        searchResults = $queryResults.searchResults;
    });
    let hasActiveAdvancedFilters = $derived($queryResults.hasActiveAdvancedFilters);
    let activeAdvancedFilterCount = $derived($queryResults.activeAdvancedFilterCount);

    const FOLDER_META_KEY = "pkm_folder_meta_v1";
    let folderMeta = $state({});
    let projectModalOpen = $state(false);

    onMount(() => {
        try {
            const saved = localStorage.getItem(FOLDER_META_KEY);
            if (saved) folderMeta = JSON.parse(saved);
        } catch (e) {}
    });

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
            saveFolderMeta();
        }
        return folderMeta[name];
    }

    let foldersSet = $derived(new Set([
        ...Object.keys(folderMeta),
        ...conversations.map((c) => metadata[getConvKey(c)]?.folder).filter(Boolean)
    ]));
    let folders = $derived(Array.from(foldersSet).sort());

    let groupStates = $state({});
    let displayGroupedFiltered = $derived(groupedFiltered.map(g => ({ ...g, isOpen: groupStates[g.key] !== undefined ? groupStates[g.key] : g.isOpen })));
    $effect(() => { console.log('displayGroupedFiltered updated:', displayGroupedFiltered, 'groupedFiltered:', groupedFiltered, 'conversations:', conversations.length); });

    function toggleGroup(key) {
        groupStates[key] = !groupStates[key];
    }

    function toggleAllGroups(collapse) {
        for (const key of Object.keys(groupStates)) {
            groupStates[key] = !collapse;
        }
    }

    function getSnippetForConv(convId) {
        const result = searchResults.find((r) => getConvKey(r.conversation) === convId);
        return result?.snippet || null;
    }

    let stats = $derived({
        total: conversations.filter((c) => !metadata[getConvKey(c)]?.deleted).length,
        favorites: conversations.filter((c) => metadata[getConvKey(c)]?.favorite).length,
        withNotes: conversations.filter((c) => metadata[getConvKey(c)]?.notes?.trim()).length,
        folders: folders.length,
    });

    function setActiveFolder(folderId) {
        if (onfolderChange) onfolderChange({ folder: folderId });
    }

    function createNewFolder() {
        projectModalOpen = true;
    }

    function handleProjectSubmit(event) {
        const { name, icon, color } = event.detail;
        folderMeta[name] = { icon, color };
        saveFolderMeta();
    }

    function select(key) {
        if (onselect) onselect({ id: key });
    }

    let scrollContainer = $state();
    let renderLimit = $state(50);

    function handleScroll(e) {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            renderLimit += 50;
        }
    }

    $effect(() => {
        if (activeFolder || searchTerm || advancedFilters) renderLimit = 50;
    });

    function highlightSnippet(text, term) {
        if (!term || !text) return text;
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escaped})`, "gi");
        return text.replace(
            regex,
            '<mark style="background: var(--highlight); color: #fff; padding: 0 2px; border-radius: 2px;">$1</mark>'
        );
    }

    let isPinned = $state(false);
    let isCollapsed = $derived(!isPinned);
    let showProjects = $state(false);

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
    <div class="sidebar-full" class:hide-content={isCollapsed}>
        <!-- ZONA 1: Header -->
        <div class="sidebar-header">
            <div class="logo">Umbra</div>
            <button class="collapse-btn" onclick={() => isPinned = false} title="Desafixar Sidebar">
                <ChevronsLeft size={16} />
            </button>
        </div>

        <!-- ZONA 2: Nav Global -->
        <nav class="sidebar-nav">
            <button class="nav-item primary-action" onclick={() => {
                if (onopenFilePicker) onopenFilePicker();
            }}>
                <Plus size={16} strokeWidth={2.5}/> Novo Chat
            </button>

            <button class="nav-item" class:active={activeFolder === "__ALL__" && activeView !== "live"} onclick={() => {
                if (onnavigate) onnavigate({ detail: { route: "all" } });
            }}>
                <MessageSquare size={16} /> Conversas
            </button>

            <button class="nav-item" class:active={activeView === "live"} onclick={() => { if (onnavigate) onnavigate({ route: "live" }) } }>
                <Sparkles size={16} style="color: var(--highlight);" /> Live AI
            </button>

            <button class="nav-item" class:active={activeView === "library"} onclick={() => { if (onnavigate) onnavigate({ route: "library" }) } }>
                <Library size={16} /> Biblioteca
            </button>

            <div class="nav-group">
                <button class="nav-item justify-between" class:active={showProjects || (activeFolder !== "__ALL__" && activeFolder !== "__FAV__")} onclick={() => showProjects = !showProjects}>
                    <div class="flex items-center gap-2">
                        <FolderOpen size={16} /> Projetos
                    </div>
                    <div class="chevron-icon" class:rotated={showProjects}>
                        <ChevronRight size={14} />
                    </div>
                </button>
                {#if showProjects}
                    <div class="nav-subgroup">
                        {#each folders as folderName}
                            <button class="nav-item sub-item" class:active={activeFolder === folderName} onclick={() => setActiveFolder(folderName)}>
                                <Folder size={14} class="inline mr-2" /> {folderName}
                            </button>
                        {/each}
                        <button class="nav-item sub-item add-btn" onclick={createNewFolder}>
                            <Plus size={14} /> Novo projeto
                        </button>
                    </div>
                {/if}
            </div>

            <button class="nav-item" class:active={activeFolder === "__FAV__"} onclick={() => setActiveFolder("__FAV__")}>
                <Star size={16} /> Favoritos
            </button>
        </nav>

        <div class="divider"></div>

        <!-- ZONA 3: Recentes / Histórico -->
        <div class="recents-header">
            <span>{activeFolder === '__ALL__' ? 'Recentes' : activeFolder === '__FAV__' ? 'Favoritos' : activeFolder}</span>
            <div class="header-action-group">
                <button class="filter-btn" onclick={() => toggleAllGroups(true)} title="Colapsar Todos">
                    <ChevronsLeft size={14} class="rotate-up" />
                </button>
                <button class="filter-btn" onclick={() => toggleAllGroups(false)} title="Expandir Todos">
                    <ChevronDown size={14} />
                </button>
                <button class="filter-btn" class:active={showFilters || hasActiveAdvancedFilters} onclick={() => conversationQuery.toggleShowFilters()}>
                    <Search size={14} />
                    {#if activeAdvancedFilterCount > 0}
                        <span class="badge">{activeAdvancedFilterCount}</span>
                    {/if}
                </button>
            </div>
            <FilterPanel
                {conversations}
                filters={advancedFilters}
                isOpen={showFilters}
                onchange={(newFilters) => {
                    advancedFilters = { ...newFilters };
                    conversationQuery.setAdvancedFilters(newFilters);
                }}
                onapply={(newFilters) => {
                    advancedFilters = { ...newFilters };
                    conversationQuery.update(s => ({...s, showFilters: false}));
                }}
                onclose={() => (conversationQuery.update(s => ({...s, showFilters: false})))}
            />
        </div>

        {#if showFilters || hasActiveAdvancedFilters}
            <div class="search-box">
                <input type="text" value={searchTerm} oninput={(e) => conversationQuery.setSearchTerm(e.target.value)} placeholder={searchMode === "title" ? "Buscar título..." : "Buscar conteúdo..."} />
                <button class="toggle-mode" onclick={() => conversationQuery.setSearchMode(searchMode === "title" ? "content" : "title")}>
                    {searchMode === "title" ? "T" : "C"}
                </button>
            </div>
        {/if}

        <div style="color: white; padding: 10px;">Debug: {conversations.length} convs | {displayGroupedFiltered.length} groups</div>
        <div class="sidebar-recents custom-scrollbar" onscroll={handleScroll} bind:this={scrollContainer}>
            {#each displayGroupedFiltered as group (group.key)}
                <div class="time-group">
                    <button class="group-header" onclick={() => toggleGroup(group.key)}>
                        <span>{group.title}</span>
                        {#if group.isOpen}
                            <ChevronDown size={14} />
                        {:else}
                            <ChevronRight size={14} />
                        {/if}
                    </button>
                    
                    {#if group.isOpen}
                        <div class="group-items">
                            {#each group.items.slice(0, renderLimit) as conv, idx (getConvKey(conv) + '-' + idx)}
                                {@const key = getConvKey(conv)}
                                {@const meta = metadata[key] ?? {}}
                                <!-- svelte-ignore a11y_click_events_have_key_events -->
                                <!-- svelte-ignore a11y_no_static_element_interactions -->
                                <div
                                    onclick={() => select(key)}
                                    class="conv-row"
                                    class:active={activeId === key}
                                >
                                    <div class="conv-title">
                                        {#if searchMode === "title" && searchTerm}
                                            {@html highlightSnippet(conv.title || "(Sem título)", searchTerm)}
                                        {:else}
                                            {conv.title || "(Sem título)"}
                                        {/if}
                                    </div>

                                    <!-- Tags / Badges -->
                                    {#if conv.filterMeta || conv.platform}
                                        <div class="conv-tags">
                                            {#if conv.platform}
                                                <div style="display: flex; align-items: center; margin-right: 2px;">
                                                    <PlatformBadge platform={conv.platform} size={16} showLabel={false} />
                                                </div>
                                            {/if}
                                            {#if conv.filterMeta}
                                                {#if conv.filterMeta.modelName}
                                                    <span class="tag tag-model">
                                                        {#if getModelLogo(conv.filterMeta.modelSlug, conv.filterMeta.modelName)}
                                                            <img src={getModelLogo(conv.filterMeta.modelSlug, conv.filterMeta.modelName)} alt="Logo" class="model-logo" />
                                                        {/if}
                                                        {conv.filterMeta.modelName}
                                                    </span>
                                                {/if}
                                                {#if conv.filterMeta.reasoningTime}
                                                    <span class="tag tag-reasoning"><Brain size={12} class="inline mr-1" /> {conv.filterMeta.reasoningTime}s</span>
                                                {/if}
                                                {#if conv.filterMeta?.hasCanvas}
                                                    <span class="tag tag-canvas"><PenTool size={12} class="inline mr-1" /> Canvas</span>
                                                {/if}
                                                {#if conv.filterMeta?.hasCode}
                                                    <span class="tag tag-code"><Code2 size={12} class="inline mr-1" /> Code</span>
                                                {/if}
                                            {/if}
                                        </div>
                                    {/if}

                                    <!-- Metadata footer -->
                                    <div class="conv-meta">
                                        {#if metadata[getConvKey(conv)]?.favorite}
                                            <span class="fav-icon"><Star size={12} fill="currentColor" class="inline" /></span>
                                        {/if}
                                        <span><MessageSquare size={12} class="inline mr-1" /> {conv.messages?.length || 0}</span>
                                        <span class="date-dot">•</span>
                                        <span>{formatDate(conv.createTime || conv.updateTime)}</span>
                                        {#if meta.folder}
                                            <span class="folder-badge" style="background: {getFolderMeta(meta.folder).color}">
                                                {meta.folder}
                                            </span>
                                        {/if}
                                    </div>

                                    {#if searchMode === "deep" && searchTerm}
                                        {@const snippet = getSnippetForConv(key)}
                                        {#if snippet}
                                            <div class="search-snippet">
                                                {@html highlightSnippet(snippet, searchTerm)}
                                            </div>
                                        {/if}
                                    {/if}
                                </div>
                            {/each}
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
            <button class="footer-btn" onclick={() => showingStats = !showingStats}>
                <BarChart2 size={16} />
            </button>
            <button class="footer-btn">
                <Settings size={16} />
            </button>
        </div>
    </div>

    <!-- Collapsed state -->
    <div class="sidebar-collapsed" class:show-content={isCollapsed}>
        <!-- Top Actions Pill -->
        <div class="floating-pill">
            <button class="collapse-btn centered" onclick={() => isPinned = true} title="Fixar Sidebar" style="margin-bottom: 4px;">
                <ChevronRight size={16} />
            </button>
            <button class="nav-icon primary" onclick={() => { if (onopenFilePicker) onopenFilePicker() }} title="Novo Chat">
                <Plus size={16} />
            </button>
        </div>
        
        <!-- Nav Pill -->
        <div class="floating-pill">
            <button class="nav-icon" class:active={activeFolder === "__ALL__"} onclick={() => setActiveFolder("__ALL__")} title="Conversas">
                <MessageSquare size={16} />
            </button>
            <button class="nav-icon" class:active={activeFolder === "__FAV__"} onclick={() => setActiveFolder("__FAV__")} title="Favoritos">
                <Star size={16} />
            </button>
        </div>
    </div>
</aside>

<ProjectModal bind:isOpen={projectModalOpen} on:submit={handleProjectSubmit} />

<style>
    /* Claude-inspired Minimalism */
    .sidebar-wrapper {
        position: relative;
        z-index: 50;
        display: flex;
        flex-direction: column;
        width: 260px;
        height: 100%;
        background: var(--bg-deep); /* Darker than panel */
        border: none;
        transition: width 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.35s ease;
        overflow: hidden;
        box-shadow: 8px 0 32px rgba(0, 0, 0, 0.45);
    }
    .sidebar-wrapper.collapsed {
        width: 64px;
        box-shadow: none;
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
    .sidebar-full {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 260px;
        transition: opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), visibility 0.3s;
        opacity: 1;
        transform: translateX(0);
        flex-shrink: 0;
        visibility: visible;
    }
    .sidebar-full.hide-content {
        opacity: 0;
        transform: translateX(-15px);
        pointer-events: none;
        visibility: hidden;
    }

    .sidebar-collapsed {
        position: absolute;
        top: 0;
        left: 0;
        width: 64px;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 40px 0 16px 0; /* Arredado um pouco pra baixo */
        gap: 12px;
        -webkit-app-region: no-drag;
        transition: opacity 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1), visibility 0.3s;
        opacity: 0;
        transform: scale(0.9);
        pointer-events: none;
        visibility: hidden;
    }
    .sidebar-collapsed.show-content {
        opacity: 1;
        transform: scale(1);
        pointer-events: auto;
        visibility: visible;
    }
    .floating-pill {
        display: flex;
        flex-direction: column;
        align-items: center;
        background: var(--layer-1);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        padding: 6px;
        gap: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
    .chevron-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    .chevron-icon.rotated {
        transform: rotate(90deg);
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
        flex-shrink: 0;
    }
    .header-action-group {
        display: flex;
        align-items: center;
        gap: 2px;
        -webkit-app-region: no-drag;
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
    
    .time-group {
        margin-bottom: 8px;
    }

    .group-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        background: transparent;
        border: none;
        padding: 6px 12px;
        color: var(--color-text-tertiary);
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        cursor: pointer;
        transition: color 0.2s;
    }

    .group-header:hover {
        color: var(--color-text-secondary);
    }

    .group-items {
        display: flex;
        flex-direction: column;
        gap: 1px;
    }

    .conv-row {
        padding: 6px 10px;
        border-radius: 8px;
        cursor: pointer;
        color: var(--color-text-secondary);
        transition: all 0.2s;
        display: flex;
        flex-direction: column;
        gap: 3px;
        margin-bottom: 1px;
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



