<script>
    import { createEventDispatcher } from "svelte";
    import { getConvKey, formatDate } from "$lib/utils.js";
    import BorderBeam from "$lib/components/base/BorderBeam.svelte";

    export let title = "";
    export let icon = "📁";
    export let conversations = [];
    export let metadata = {};
    export let activeId = null;
    export let defaultOpen = false;
    export let getSnippet = null; // Function to get search snippet for a conversation
    export let searchTerm = ""; // Current search term for highlighting

    const dispatch = createEventDispatcher();

    let isOpen = defaultOpen;

    function toggle() {
        isOpen = !isOpen;
    }

    function select(key) {
        dispatch("select", { id: key });
    }

    let renderLimit = 50;
    function handleScroll(e) {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollTop + clientHeight > scrollHeight - 50) {
            renderLimit += 50;
        }
    }

    // Reset limit when category changes or closes
    $: if (!isOpen) renderLimit = 50;

    // Highlight search term in snippet
    function highlightSnippet(text, term) {
        if (!term || !text) return text;
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`(${escaped})`, "gi");
        return text.replace(
            regex,
            '<mark style="background: var(--highlight); color: #fff; padding: 0 2px; border-radius: 2px;">$1</mark>',
        );
    }
</script>

<div style="margin: 4px 8px;">
    <!-- Header com toggle + BorderBeam animation -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <BorderBeam duration={2.5} size={150}>
        <div on:click={toggle} class="category-header" class:is-open={isOpen}>
            <span class="chevron">{isOpen ? "▼" : "▶"}</span>
            <span class="icon">{icon}</span>
            <span class="title">{title}</span>
            <span class="count">{conversations.length}</span>
        </div>
    </BorderBeam>

    <!-- Lista de conversas com Lazy Rendering -->
    {#if isOpen && conversations.length > 0}
        <div
            on:scroll={handleScroll}
            class="conversation-list custom-scrollbar"
        >
            {#each conversations.slice(0, renderLimit) as conv (getConvKey(conv))}
                {@const key = getConvKey(conv)}
                {@const meta = metadata[key] ?? {}}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    on:click={() => select(key)}
                    class="conv-row"
                    class:active={activeId === key}
                >
                    <div class="conv-title">
                        {conv.title || "(Sem título)"}
                    </div>

                    <div class="conv-meta">
                        <span>💬 {conv.messages.length}</span>
                        {#if conv.createTime}
                            <span style="opacity:0.6"
                                >• {formatDate(conv.createTime)}</span
                            >
                        {/if}
                        {#if meta.favorite}<span class="fav-icon">★</span>{/if}
                        {#if meta.folder}<span>📁 {meta.folder}</span>{/if}
                    </div>

                    <!-- Tags / Badges -->
                    {#if conv.filterMeta}
                        <div class="conv-tags">
                            {#if conv.filterMeta.modelName}
                                <span class="tag tag-model">{conv.filterMeta.modelName}</span>
                            {/if}
                            {#if conv.filterMeta.reasoningTime}
                                <span class="tag tag-reasoning">🧠 Pensou {conv.filterMeta.reasoningTime}s</span>
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

                    {#if getSnippet}
                        {@const snippet = getSnippet(key)}
                        {#if snippet}
                            <div class="conv-snippet">
                                {@html highlightSnippet(snippet, searchTerm)}
                            </div>
                        {/if}
                    {/if}

                    <!-- Active Glow Effect -->
                    {#if activeId === key}
                        <div class="active-glow"></div>
                    {/if}
                </div>
            {/each}
            {#if renderLimit < conversations.length}
                <div class="loading-indicator">Carregando mais...</div>
            {/if}
        </div>
    {/if}

    {#if isOpen && conversations.length === 0}
        <div class="empty-msg">Nenhuma conversa</div>
    {/if}
</div>

<style>
    /* List Container */
    .conversation-list {
        margin-top: 4px;
        margin-left: 4px; /* Tighter align */
        max-height: 300px;
        overflow-y: auto;
        contain: content; /* Performance Boost */
        padding-right: 4px;
    }

    /* Premium Category Header */
    .category-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        cursor: pointer;
        background: linear-gradient(135deg, var(--layer-2), var(--layer-1));
        border-radius: var(--radius-small);
        border: 1px solid var(--border-light);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
        overflow: hidden;
    }

    .category-header:hover {
        background: linear-gradient(135deg, var(--layer-3), var(--layer-2));
        border-color: rgba(157, 78, 221, 0.3);
        transform: translateY(-1px);
        box-shadow: var(--shadow-sm);
    }

    .category-header::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.03),
            transparent
        );
        transform: translateX(-100%);
        transition: transform 0.5s;
    }

    .category-header:hover::after {
        transform: translateX(100%);
    }

    .category-header .chevron {
        font-size: 10px;
        color: var(--color-text-secondary);
        width: 14px;
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .category-header.is-open .chevron {
        transform: rotate(90deg); /* Standard chevron rotation */
    }

    .category-header .icon {
        font-size: 16px;
        filter: drop-shadow(0 0 8px rgba(157, 78, 221, 0.2));
    }

    .category-header .title {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-primary);
        flex: 1;
        letter-spacing: -0.01em;
    }

    .category-header .count {
        font-size: 10px;
        font-weight: 700;
        padding: 2px 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 10px;
        color: var(--color-text-secondary);
        border: 1px solid var(--border);
    }

    /* Conversation Row - Glass Cockpit Style */
    .conv-row {
        position: relative;
        padding: 10px 14px;
        margin: 2px 0;
        cursor: pointer;
        background: transparent;
        border-radius: var(--radius-small);
        border: 1px solid transparent; /* Reserve space */
        transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
        overflow: hidden;
    }

    .conv-row:hover {
        background: rgba(255, 255, 255, 0.03);
    }

    /* Active State */
    .conv-row.active {
        background: linear-gradient(
            90deg,
            rgba(157, 78, 221, 0.15) 0%,
            transparent 100%
        );
        border-color: rgba(157, 78, 221, 0.3);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }

    .active-glow {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--highlight);
        box-shadow: 0 0 10px var(--highlight);
        border-radius: 0 4px 4px 0;
    }

    .conv-title {
        font-size: 13px;
        font-weight: 500;
        color: var(--color-text-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        transition: color 0.2s;
    }

    .conv-row:hover .conv-title {
        color: var(--color-text-primary);
    }

    .conv-row.active .conv-title {
        color: #fff;
        font-weight: 600;
        text-shadow: 0 0 12px rgba(157, 78, 221, 0.5);
    }

    .conv-meta {
        font-size: 10px;
        color: var(--color-text-tertiary);
        margin-top: 4px;
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .conv-row.active .conv-meta {
        color: rgba(255, 255, 255, 0.6);
    }

    .fav-icon {
        color: var(--highlight);
        filter: drop-shadow(0 0 5px var(--highlight));
    }

    .conv-snippet {
        font-size: 10px;
        color: var(--color-text-secondary);
        margin-top: 6px;
        padding: 6px 8px;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 4px;
        border: 1px solid var(--border);
        line-height: 1.4;
    }

    .loading-indicator {
        padding: 12px;
        text-align: center;
        font-size: 10px;
        color: var(--color-text-tertiary);
        font-style: italic;
    }

    .empty-msg {
        padding: 20px;
        text-align: center;
        font-size: 11px;
        color: var(--color-text-tertiary);
        font-style: italic;
        background: rgba(255, 255, 255, 0.01);
        border-radius: var(--radius-small);
        margin-left: 12px;
        margin-top: 4px;
    }

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
</style>
