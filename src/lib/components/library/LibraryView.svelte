<script>
    import { createEventDispatcher } from "svelte";
    import { formatDate, getConvKey, groupConversationsByMonth, formatBytes } from "$lib/utils";
    import { Code, Image as ImageIcon, Globe, Brain, PenTool, ChevronDown, ChevronRight, File, List, LayoutGrid, ImageOff } from "lucide-svelte";

    export let conversations = [];
    export let metadata = {};

    const dispatch = createEventDispatcher();

    let activeTab = "tudo"; // 'tudo', 'openai', 'anthropic', 'google', 'xai'
    let mainMode = "historico"; // 'historico' | 'arquivos'
    let resourceViewType = "list"; // 'list' | 'gallery'

    // Feature Filters
    let filters = {
        canvas: false,
        code: false,
        reasoning: false,
        webSearch: false,
        imageGen: false
    };

    const tabs = [
        { id: "tudo", label: "Timeline" },
        { id: "openai", label: "OpenAI / ChatGPT" },
        { id: "anthropic", label: "Anthropic / Claude" },
        { id: "google", label: "Google / Gemini" },
        { id: "xai", label: "xAI / Grok" }
    ];

    function getModelBrand(modelSlug, modelName) {
        const str = (modelSlug || modelName || "").toLowerCase();
        if (str.includes("gpt") || str.includes("openai")) return "openai";
        if (str.includes("claude") || str.includes("anthropic")) return "anthropic";
        if (str.includes("gemini") || str.includes("google")) return "google";
        if (str.includes("grok") || str.includes("xai")) return "xai";
        return "unknown";
    }

    function getBrandLogo(brand) {
        switch(brand) {
            case "openai": return "/src/lib/assets/logos/openai.svg";
            case "anthropic": return "/src/lib/assets/logos/anthropic.svg";
            case "google": return "/src/lib/assets/logos/gemini.svg";
            case "xai": return "/src/lib/assets/logos/x.svg";
            default: return null;
        }
    }

    // Lazy load logic similar to Sidebar for performance
    let renderLimit = 50;
    function handleScroll(e) {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight >= scrollHeight - 200) {
            renderLimit += 50;
        }
    }

    $: filteredConversations = (() => {
        let result = conversations.filter(c => {
            const key = getConvKey(c);
            const meta = metadata[key] ?? {};
            if (meta.deleted) return false;
            
            const brand = getModelBrand(c.filterMeta?.modelSlug, c.filterMeta?.modelName);
            if (activeTab !== "tudo" && brand !== activeTab) return false;
            
            if (filters.canvas && !c.filterMeta?.hasCanvas) return false;
            if (filters.code && !c.filterMeta?.hasCode) return false;
            if (filters.reasoning && !c.filterMeta?.reasoningTime) return false;
            if (filters.webSearch && !c.filterMeta?.hasWebSearch) return false;
            if (filters.imageGen && !c.filterMeta?.hasImageGen) return false;

            return true;
        });
        
        // Ensure they are sorted by date (newest first)
        result.sort((a, b) => {
            const dateA = a.filterMeta?.createDate ? new Date(a.filterMeta.createDate) : new Date(a.createTime || 0);
            const dateB = b.filterMeta?.createDate ? new Date(b.filterMeta.createDate) : new Date(b.createTime || 0);
            return dateB - dateA;
        });
        
        return result;
    })();

    let groupStates = {};
    $: groupedFiltered = (() => {
        const result = groupConversationsByMonth(filteredConversations);
        for (let i = 0; i < result.length; i++) {
            const g = result[i];
            if (groupStates[g.key] === undefined) {
                groupStates[g.key] = i < 2; // Default open first 2
            }
            g.isOpen = groupStates[g.key];
        }
        return result;
    })();

    function toggleGroup(key) {
        groupStates[key] = !groupStates[key];
        groupStates = { ...groupStates };
    }

    function toggleAllGroups(collapse) {
        for (const key of Object.keys(groupStates)) {
            groupStates[key] = !collapse;
        }
        groupStates = { ...groupStates };
    }

    $: allResources = (() => {
        let resources = [];
        for (const c of filteredConversations) {
            if (!c.messages) continue;
            for (const msg of c.messages) {
                const ts = (msg.timestamp || c.createTime || 0);
                
                if (msg.attachments && msg.attachments.length > 0) {
                    for (const att of msg.attachments) {
                        resources.push({
                            type: 'attachment',
                            name: att.name || att.id || 'Arquivo',
                            url: att.url || null,
                            timestamp: ts,
                            size: att.size ? formatBytes(att.size) : '-',
                            conv: c
                        });
                    }
                }
                
                if (msg.imageUrls && msg.imageUrls.length > 0) {
                    msg.imageUrls.forEach((url, i) => {
                        resources.push({
                            type: 'image',
                            name: `Imagem DALL-E ${i+1}`,
                            url: url,
                            timestamp: ts,
                            size: '-',
                            conv: c
                        });
                    });
                }
                
                if (msg.canvasContent) {
                    resources.push({
                        type: 'canvas',
                        name: msg.canvasContent.name || 'Canvas',
                        url: null,
                        timestamp: ts,
                        size: '-',
                        conv: c
                    });
                }
            }
        }
        return resources.sort((a, b) => b.timestamp - a.timestamp);
    })();

    $: if (activeTab) renderLimit = 50;

    function openChat(conv) {
        dispatch("openChat", { id: getConvKey(conv) });
    }

    function getSnippet(conv) {
        if (!conv.messages || conv.messages.length === 0) return "Sem conteúdo.";
        const userMsg = conv.messages.find(m => m.author === "user");
        if (userMsg) {
            const text = userMsg.textPlain || userMsg.textMarkdown || "";
            return text.length > 150 ? text.slice(0, 150) + "..." : text;
        }
        return "Conversa...";
    }
</script>

<div class="library-container">
    <div class="library-header">
        <div class="header-top-row">
            <div class="header-title">
                <h1>Biblioteca de IA</h1>
                <p>Acesse seu histórico de conversas e arquivos extraídos.</p>
            </div>
            
            <div class="main-mode-toggle">
                <button class:active={mainMode === 'historico'} on:click={() => mainMode = 'historico'}>Histórico</button>
                <button class:active={mainMode === 'arquivos'} on:click={() => mainMode = 'arquivos'}>Arquivos</button>
            </div>
        </div>
        
        <div class="tabs-container">
            {#each tabs as tab}
                <button 
                    class="tab-btn" 
                    class:active={activeTab === tab.id}
                    on:click={() => activeTab = tab.id}
                >
                    {#if tab.id !== "tudo"}
                        <img src={getBrandLogo(tab.id)} alt={tab.id} class="tab-logo" />
                    {/if}
                    {tab.label}
                </button>
            {/each}
        </div>
        
        <div class="filters-pills">
            <button class="pill icon-only" on:click={() => toggleAllGroups(true)} title="Colapsar Todos">
                <ChevronRight size={14} class="rotate-up" />
            </button>
            <button class="pill icon-only" on:click={() => toggleAllGroups(false)} title="Expandir Todos">
                <ChevronDown size={14} />
            </button>
            <div class="pill-divider"></div>

            <button class="pill" class:active={filters.canvas} on:click={() => filters.canvas = !filters.canvas}>
                <PenTool size={12} /> Canvas
            </button>
            <button class="pill" class:active={filters.code} on:click={() => filters.code = !filters.code}>
                <Code size={12} /> Code
            </button>
            <button class="pill" class:active={filters.reasoning} on:click={() => filters.reasoning = !filters.reasoning}>
                <Brain size={12} /> Raciocínio
            </button>
            <button class="pill" class:active={filters.webSearch} on:click={() => filters.webSearch = !filters.webSearch}>
                <Globe size={12} /> Web
            </button>
            <button class="pill" class:active={filters.imageGen} on:click={() => filters.imageGen = !filters.imageGen}>
                <ImageIcon size={12} /> Imagens
            </button>
            
            {#if mainMode === 'arquivos'}
                <div class="pill-divider"></div>
                <button class="pill icon-only" class:active={resourceViewType === 'list'} on:click={() => resourceViewType = 'list'} title="Lista">
                    <List size={14} />
                </button>
                <button class="pill icon-only" class:active={resourceViewType === 'gallery'} on:click={() => resourceViewType = 'gallery'} title="Galeria">
                    <LayoutGrid size={14} />
                </button>
            {/if}
        </div>
    </div>

    {#if mainMode === 'historico'}
        <div class="timeline-container custom-scrollbar" on:scroll={handleScroll}>
            <div class="timeline-line"></div>
            
            <div class="cards-grid">
            {#each groupedFiltered as group (group.key)}
                <div class="time-group">
                    <button class="group-header" on:click={() => toggleGroup(group.key)}>
                        <span class="group-title">{group.title}</span>
                        <div class="group-line"></div>
                        {#if group.isOpen}
                            <ChevronDown size={16} />
                        {:else}
                            <ChevronRight size={16} />
                        {/if}
                    </button>
                    
                    {#if group.isOpen}
                        <div class="group-items">
                            {#each group.items.slice(0, renderLimit) as conv (getConvKey(conv))}
                                {@const brand = getModelBrand(conv.filterMeta?.modelSlug, conv.filterMeta?.modelName)}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <!-- svelte-ignore a11y-no-static-element-interactions -->
                                <div class="timeline-node">
                                    <div class="node-dot">
                                        {#if getBrandLogo(brand)}
                                            <img src={getBrandLogo(brand)} alt={brand} class="node-logo" />
                                        {:else}
                                            <div class="node-circle"></div>
                                        {/if}
                                    </div>
                                    <div class="card" on:click={() => openChat(conv)}>
                                        <div class="card-header">
                                            <h3 class="truncate">{conv.title || "(Sem título)"}</h3>
                                            <span class="date">{formatDate(conv.filterMeta?.createDate || conv.createTime)}</span>
                                        </div>
                                        <div class="card-body">
                                            <p>{getSnippet(conv)}</p>
                                        </div>
                                        <div class="card-footer">
                                            <div class="meta-tags">
                                                {#if conv.filterMeta?.modelName}
                                                    <span class="meta-tag model-tag">{conv.filterMeta.modelName}</span>
                                                {/if}
                                                {#if conv.filterMeta?.reasoningTime}
                                                    <span class="meta-tag">🧠 {conv.filterMeta.reasoningTime}s</span>
                                                {/if}
                                                {#if conv.filterMeta?.hasCanvas}
                                                    <span class="meta-tag">📝 Canvas</span>
                                                {/if}
                                                {#if conv.filterMeta?.hasCode}
                                                    <span class="meta-tag">💻 Code</span>
                                                {/if}
                                                <span class="meta-tag messages-count">💬 {conv.messages?.length || 0} msgs</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    {/if}
                </div>
            {/each}
            {#if renderLimit < filteredConversations.length}
                <div class="loading-more">Carregando o passado...</div>
            {/if}
            {#if filteredConversations.length === 0}
                <div class="empty-state">
                    Nenhuma conversa encontrada para este modelo.
                </div>
            {/if}
        </div>
    </div>
    {:else}
        <div class="resources-container custom-scrollbar">
            {#if resourceViewType === 'list'}
                <table class="resources-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Tipo</th>
                            <th>Modificado</th>
                            <th>Tamanho</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each allResources as res}
                            <tr on:click={() => openChat(res.conv)}>
                                <td class="res-name-cell">
                                    {#if res.type === 'image'}
                                        <ImageIcon size={14} class="res-icon img" />
                                    {:else if res.type === 'canvas'}
                                        <PenTool size={14} class="res-icon canvas" />
                                    {:else}
                                        <File size={14} class="res-icon file" />
                                    {/if}
                                    <span>{res.name}</span>
                                </td>
                                <td>{res.type === 'image' ? 'Imagem' : res.type === 'canvas' ? 'Canvas' : 'Arquivo'}</td>
                                <td>{formatDate(res.timestamp)}</td>
                                <td class="res-size">{res.size}</td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            {:else}
                <div class="resources-gallery">
                    {#each allResources as res}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div class="gallery-card" on:click={() => openChat(res.conv)}>
                            <div class="gallery-preview">
                                {#if res.type === 'image' && res.url}
                                    <img src={res.url} alt={res.name} on:error={(e) => { e.target.style.display = 'none'; e.target.nextElementSibling.style.display = 'flex'; }} />
                                    <div class="fallback-preview" style="display: none;">
                                        <ImageOff size={32} class="res-icon img" />
                                    </div>
                                {:else if res.type === 'image'}
                                    <div class="fallback-preview">
                                        <ImageIcon size={32} class="res-icon img" />
                                    </div>
                                {:else if res.type === 'canvas'}
                                    <div class="fallback-preview">
                                        <PenTool size={32} class="res-icon canvas" />
                                    </div>
                                {:else}
                                    <div class="fallback-preview">
                                        <File size={32} class="res-icon file" />
                                    </div>
                                {/if}
                            </div>
                            <div class="gallery-info">
                                <div class="gallery-name truncate" title={res.name}>{res.name}</div>
                                <div class="gallery-meta">{formatDate(res.timestamp)} &bull; {res.size}</div>
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
            
            {#if allResources.length === 0}
                <div class="empty-state" style="border:none">Nenhum arquivo encontrado nestas conversas.</div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .library-container {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: var(--bg-main);
        color: var(--color-text-primary);
        overflow: hidden;
    }

    .library-header {
        padding: 40px 48px 24px 48px;
        background: var(--bg-panel);
        border-bottom: 1px solid var(--border);
        flex-shrink: 0;
        z-index: 10;
        position: relative;
    }

    .header-title h1 {
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.02em;
        margin-bottom: 8px;
        background: var(--gradient-primary);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
    }

    .header-title p {
        color: var(--color-text-secondary);
        font-size: 14px;
        margin-bottom: 24px;
    }

    .tabs-container {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 8px; /* For scrollbar */
    }

    .tab-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: var(--layer-1);
        border: 1px solid var(--border-light);
        border-radius: 20px;
        color: var(--color-text-secondary);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        white-space: nowrap;
    }

    .tab-btn:hover {
        background: var(--layer-2);
        color: var(--color-text-primary);
    }

    .tab-btn.active {
        background: var(--layer-3);
        border-color: var(--border-focus);
        color: var(--color-text-primary);
        box-shadow: 0 0 12px rgba(157, 78, 221, 0.15);
    }

    .tab-logo {
        width: 14px;
        height: 14px;
        filter: invert(1);
        opacity: 0.8;
    }

    .tab-btn.active .tab-logo {
        opacity: 1;
    }

    .filters-pills {
        display: flex;
        gap: 8px;
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid rgba(255,255,255,0.05);
        align-items: center;
    }

    .pill-divider {
        width: 1px;
        height: 16px;
        background: rgba(255,255,255,0.1);
        margin: 0 4px;
    }

    .pill.icon-only {
        padding: 6px;
        border-radius: 8px;
    }

    .rotate-up {
        transform: rotate(-90deg);
    }

    .pill {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: transparent;
        border: 1px solid var(--border-light);
        border-radius: 16px;
        color: var(--color-text-secondary);
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .pill:hover {
        background: rgba(255,255,255,0.05);
        color: var(--color-text-primary);
    }

    .pill.active {
        background: rgba(157, 78, 221, 0.15);
        border-color: rgba(157, 78, 221, 0.5);
        color: #d8b4fe; /* Light violet */
        box-shadow: 0 0 10px rgba(157, 78, 221, 0.1);
    }

    /* Timeline Area */
    .timeline-container {
        flex: 1;
        overflow-y: auto;
        padding: 32px 48px;
        position: relative;
    }

    .timeline-line {
        position: absolute;
        left: 64px; /* 48px padding + 16px half of node */
        top: 0;
        bottom: 0;
        width: 2px;
        background: linear-gradient(to bottom, transparent 0%, var(--border) 5%, var(--border) 95%, transparent 100%);
        z-index: 1;
    }

    .cards-grid {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding-bottom: 60px;
    }

    .time-group {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 12px;
        position: relative;
    }

    .group-header {
        display: flex;
        align-items: center;
        gap: 16px;
        background: transparent;
        border: none;
        padding: 4px 0 4px 38px; /* padding to align with timeline cards */
        color: var(--color-text-tertiary);
        cursor: pointer;
        transition: color 0.2s;
        z-index: 2;
    }

    .group-title {
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        white-space: nowrap;
    }

    .group-line {
        flex: 1;
        height: 1px;
        background: rgba(255,255,255,0.05);
    }

    .group-header:hover {
        color: var(--color-text-secondary);
    }

    .group-items {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .timeline-node {
        display: flex;
        gap: 16px;
        position: relative;
    }

    .node-dot {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--layer-2);
        border: 1px solid var(--border-focus);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        margin-top: 16px;
        z-index: 3;
        box-shadow: 0 0 10px rgba(0,0,0,0.5);
    }

    .node-logo {
        width: 16px;
        height: 16px;
        filter: invert(1);
    }

    .node-circle {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--highlight);
    }

    /* Card styling */
    .card {
        flex: 1;
        background: rgba(24, 21, 36, 0.6);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        padding: 14px 16px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        backdrop-filter: blur(10px);
    }

    .card:hover {
        background: rgba(32, 28, 46, 0.8);
        border-color: var(--border-focus);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 32px;
    }

    .header-top-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        margin-bottom: 24px;
    }

    .header-title h1 {
        font-size: 28px;
        font-weight: 700;
        margin: 0 0 8px 0;
        color: var(--color-text-primary);
        letter-spacing: -0.02em;
    }

    .header-title p {
        margin: 0;
        color: var(--color-text-secondary);
        font-size: 14px;
    }

    .main-mode-toggle {
        display: flex;
        background: var(--layer-2);
        padding: 4px;
        border-radius: 10px;
        border: 1px solid var(--border-light);
    }

    .main-mode-toggle button {
        background: transparent;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        color: var(--color-text-secondary);
        font-weight: 600;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s;
    }

    .main-mode-toggle button.active {
        background: var(--layer-4);
        color: var(--color-text-primary);
        box-shadow: var(--shadow-sm);
    }

    .tabs-container {
        display: flex;
        gap: 16px;
    }

    .card-header h3 {
        font-size: 15px;
        font-weight: 600;
        margin: 0;
        color: var(--color-text-primary);
        max-width: 80%;
    }

    .card-header .date {
        font-size: 12px;
        color: var(--color-text-secondary);
        white-space: nowrap;
    }

    .card-body {
        font-size: 14px;
        color: var(--color-text-secondary);
        line-height: 1.5;
        margin-bottom: 16px;
    }

    .card-footer {
        display: flex;
        justify-content: flex-start;
        border-top: 1px solid var(--border);
        padding-top: 12px;
    }

    .meta-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
    }

    .meta-tag {
        font-size: 10px;
        padding: 4px 8px;
        border-radius: 4px;
        font-weight: 600;
        background: var(--layer-1);
        color: var(--color-text-secondary);
        border: 1px solid transparent;
    }

    .meta-tag.messages-count {
        background: rgba(255, 255, 255, 0.05);
        color: var(--color-text-secondary);
        border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .meta-tag.model-tag {
        background: rgba(255, 255, 255, 0.05);
        color: #e4e4e7;
    }

    /* Resources Table Styles */
    .resources-container {
        flex: 1;
        overflow-y: auto;
        padding-right: 8px;
    }

    .resources-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
    }

    .resources-table th {
        text-align: left;
        padding: 12px 16px;
        color: var(--color-text-tertiary);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        font-size: 11px;
        border-bottom: 1px solid var(--border-light);
    }

    .resources-table td {
        padding: 14px 16px;
        color: var(--color-text-secondary);
        border-bottom: 1px solid var(--border-light);
        cursor: pointer;
        transition: background 0.2s;
    }

    .resources-table tr:hover td {
        background: var(--layer-1);
        color: var(--color-text-primary);
    }

    .res-name-cell {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--color-text-primary) !important;
        font-weight: 500;
    }

    .res-icon {
        opacity: 0.8;
    }
    
    .res-icon.img { color: #ec4899; }
    .res-icon.canvas { color: #8b5cf6; }
    .res-icon.file { color: #3b82f6; }

    .res-size {
        font-variant-numeric: tabular-nums;
    }

    /* Gallery View Styles */
    .resources-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 16px;
        padding: 16px;
    }

    .gallery-card {
        background: var(--layer-1);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
    }

    .gallery-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
        border-color: rgba(255, 255, 255, 0.15);
    }

    .gallery-preview {
        width: 100%;
        aspect-ratio: 16/10;
        background: var(--layer-2);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-bottom: 1px solid var(--border-light);
    }

    .gallery-preview img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .fallback-preview {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
    }

    .gallery-info {
        padding: 12px;
    }

    .gallery-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-primary);
        margin-bottom: 4px;
    }

    .gallery-meta {
        font-size: 11px;
        color: var(--color-text-tertiary);
    }

    .loading-more, .empty-state {
        text-align: center;
        padding: 32px;
        color: var(--color-text-tertiary);
        font-size: 13px;
    }
</style>
