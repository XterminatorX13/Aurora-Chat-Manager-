<script>
    import { createEventDispatcher } from "svelte";
    import { formatDate, getConvKey } from "$lib/utils";

    export let conversations = [];
    export let metadata = {};

    const dispatch = createEventDispatcher();

    let activeTab = "tudo"; // 'tudo', 'openai', 'anthropic', 'google', 'xai'

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
        <div class="header-title">
            <h1>Biblioteca de IA</h1>
            <p>Histórico transversal de todas as suas interações, separado por modelo.</p>
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
    </div>

    <div class="timeline-container custom-scrollbar" on:scroll={handleScroll}>
        <div class="timeline-line"></div>
        
        <div class="cards-grid">
            {#each filteredConversations.slice(0, renderLimit) as conv (getConvKey(conv))}
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
        display: flex;
        flex-direction: column;
        gap: 24px;
        max-width: 900px;
        margin: 0 auto;
        position: relative;
        z-index: 2;
    }

    .timeline-node {
        display: flex;
        gap: 24px;
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
        padding: 20px;
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
        margin-bottom: 12px;
    }

    .card-header h3 {
        font-size: 16px;
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

    .meta-tag.model-tag {
        background: rgba(255, 255, 255, 0.05);
        color: #e4e4e7;
    }

    .loading-more, .empty-state {
        text-align: center;
        padding: 32px;
        color: var(--color-text-tertiary);
        font-size: 13px;
    }
</style>
