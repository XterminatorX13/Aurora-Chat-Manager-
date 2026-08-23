<script>
    import { createEventDispatcher, onMount, onDestroy } from "svelte";
    import {
        Search,
        Star,
        Folder,
        FileText,
        Command as CommandIcon,
    } from "lucide-svelte";

    export let conversations = [];

    const dispatch = createEventDispatcher();

    let isOpen = false;
    let query = "";
    let inputEl;
    let selectedIndex = 0;

    // Actions available in the palette
    const actions = [
        { id: "favorites", label: "Ver Favoritos", icon: "⭐", shortcut: "F" },
        { id: "all", label: "Ver Todas", icon: "📚", shortcut: "A" },
        { id: "new-folder", label: "Nova Pasta", icon: "📁", shortcut: "N" },
        { id: "stats", label: "Estatísticas", icon: "📊", shortcut: "S" },
    ];

    // Filter conversations by logical query
    $: filteredConversations = query.trim()
        ? conversations
              .filter((c) => {
                  const q = query.toLowerCase();
                  // Parse logical tags
                  const hasCanvas = q.includes("has:canvas");
                  const hasCode = q.includes("has:code");
                  const hasReasoning = q.includes("has:reasoning");
                  const hasWeb = q.includes("has:web");
                  const hasImage = q.includes("has:image");

                  // Parse model tag
                  const modelMatch = q.match(/model:([a-z0-9-]+)/);
                  const reqModel = modelMatch ? modelMatch[1] : null;

                  // Clean query for text search
                  let textQ = q.replace(/has:[a-z]+/g, "").replace(/model:[a-z0-9-]+/g, "").trim();

                  // Apply logical filters
                  if (hasCanvas && !c.filterMeta?.hasCanvas) return false;
                  if (hasCode && !c.filterMeta?.hasCode) return false;
                  if (hasReasoning && !c.filterMeta?.reasoningTime) return false;
                  if (hasWeb && !c.filterMeta?.hasWebSearch) return false;
                  if (hasImage && !c.filterMeta?.hasImageGen) return false;

                  if (reqModel) {
                      const brandStr = (c.filterMeta?.modelSlug || c.filterMeta?.modelName || "").toLowerCase();
                      if (!brandStr.includes(reqModel)) return false;
                  }

                  // Apply text search if anything remains
                  if (textQ && !(c.title || "").toLowerCase().includes(textQ)) {
                      return false;
                  }

                  return true;
              })
              .slice(0, 8)
        : [];

    // Combined results (actions first if no query, else conversations)
    $: results = query.trim()
        ? filteredConversations.map((c) => ({ type: "conv", ...c }))
        : actions.map((a) => ({ type: "action", ...a }));

    $: if (selectedIndex >= results.length)
        selectedIndex = Math.max(0, results.length - 1);

    function open() {
        isOpen = true;
        query = "";
        selectedIndex = 0;
        setTimeout(() => inputEl?.focus(), 50);
    }

    function close() {
        isOpen = false;
        query = "";
    }

    function handleKeydown(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === "k") {
            e.preventDefault();
            isOpen ? close() : open();
        }

        if (!isOpen) return;

        if (e.key === "Escape") {
            e.preventDefault();
            close();
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            selectedIndex = Math.max(selectedIndex - 1, 0);
        } else if (e.key === "Enter") {
            e.preventDefault();
            selectItem(results[selectedIndex]);
        }
    }

    function selectItem(item) {
        if (!item) return;

        if (item.type === "conv") {
            dispatch("select", { id: item.id });
        } else if (item.type === "action") {
            dispatch("action", { action: item.id });
        }
        close();
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeydown);
    });
</script>

{#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="overlay" on:click={close}>
        <div class="palette" on:click|stopPropagation>
            <!-- Search Input -->
            <div class="search-box">
                <Search size={18} />
                <input
                    bind:this={inputEl}
                    bind:value={query}
                    type="text"
                    placeholder="Buscar conversas ou ações..."
                    autocomplete="off"
                />
                <kbd>ESC</kbd>
            </div>

            <!-- Results -->
            <div class="results">
                {#if results.length === 0}
                    <div class="empty">Nenhum resultado encontrado</div>
                {:else}
                    {#each results as item, i}
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <!-- svelte-ignore a11y-no-static-element-interactions -->
                        <div
                            class="result-item"
                            class:selected={i === selectedIndex}
                            on:click={() => selectItem(item)}
                            on:mouseenter={() => (selectedIndex = i)}
                        >
                            <span class="icon">
                                {#if item.type === "conv"}
                                    💬
                                {:else}
                                    {item.icon}
                                {/if}
                            </span>
                            <span class="label">
                                {item.type === "conv" ? item.title : item.label}
                            </span>
                            {#if item.shortcut}
                                <kbd>{item.shortcut}</kbd>
                            {/if}
                        </div>
                    {/each}
                {/if}
            </div>

            <!-- Footer Hint -->
            <div class="footer">
                <span>↑↓ Navegar</span>
                <span>↵ Selecionar</span>
                <span>ESC Fechar</span>
            </div>
        </div>
    </div>
{/if}

<style>
    .overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px); /* Lighter blur for minimalism */
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 15vh;
        z-index: 9999;
        animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .palette {
        width: 100%;
        max-width: 480px; /* Smaller, focused width */
        background: var(--bg-panel);
        border: 1px solid var(--border-light); 
        border-radius: 12px; 
        box-shadow:
            0 16px 40px -10px rgba(0, 0, 0, 0.6),
            0 0 0 1px rgba(255, 255, 255, 0.05);
        overflow: hidden;
        animation: slideDown 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        display: flex;
        flex-direction: column;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-16px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .search-box {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 18px 24px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .search-box input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 20px; /* Larger font */
        color: #fff;
        font-weight: 500;
        height: 100%;
    }

    .search-box input::placeholder {
        color: rgba(255, 255, 255, 0.3);
        font-weight: 400;
    }

    .search-box kbd {
        padding: 4px 8px;
        font-size: 11px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
        color: rgba(255, 255, 255, 0.5);
    }

    .results {
        max-height: 440px;
        overflow-y: auto;
        padding: 12px;
    }

    /* Custom Scrollbar */
    .results::-webkit-scrollbar {
        width: 8px;
    }
    .results::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }

    .result-item {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 12px 14px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.05s;
        border-left: 3px solid transparent;
        margin-bottom: 2px;
    }

    .result-item:hover {
        background: rgba(255, 255, 255, 0.03);
    }

    .result-item.selected {
        background: rgba(255, 255, 255, 0.08); /* More subtle selection */
        border-left-color: var(--highlight);
    }

    .result-item .icon {
        font-size: 18px;
        width: 24px;
        text-align: center;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.5);
    }

    .result-item.selected .icon {
        color: #fff;
    }

    .result-item .label {
        flex: 1;
        font-size: 15px;
        color: rgba(255, 255, 255, 0.8);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .result-item.selected .label {
        color: #fff;
    }

    .result-item kbd {
        padding: 3px 6px;
        font-size: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 4px;
        color: rgba(255, 255, 255, 0.4);
    }

    .empty {
        text-align: center;
        padding: 40px;
        color: rgba(255, 255, 255, 0.3);
        font-size: 14px;
    }

    .footer {
        display: flex;
        justify-content: flex-end; /* Align to right like Raycast */
        gap: 20px;
        padding: 10px 24px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        background: rgba(0, 0, 0, 0.2);
        font-size: 11px;
        color: rgba(255, 255, 255, 0.4);
    }

    .footer span {
        display: flex;
        align-items: center;
        gap: 6px;
    }
</style>
