<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { Search, Download, BarChart3 } from "lucide-svelte";
    import GlitchButton from "$lib/components/base/GlitchButton.svelte";

    const dispatch = createEventDispatcher();

    let greeting = "Bem-vindo";

    onMount(() => {
        const hour = new Date().getHours();
        if (hour < 12) greeting = "Bom dia";
        else if (hour < 18) greeting = "Boa tarde";
        else greeting = "Boa noite";
    });

    function openSearch() {
        // Dispatch event for App to open Command Palette
        dispatch("openSearch");
    }

    function openFilePicker() {
        dispatch("openFilePicker");
    }

    function goToStats() {
        dispatch("navigate", { route: "stats" });
    }
</script>

<div class="empty-state">
    <div class="content animate-slide-up">
        <h1 class="greeting">{greeting}, Victor</h1>
        
        <!-- Raycast-like Search Trigger -->
        <button class="search-bar" on:click={openSearch}>
            <Search size={20} class="search-icon" />
            <span class="placeholder">Buscar conversas...</span>
            <span class="shortcut">Ctrl K</span>
        </button>

        <div class="quick-actions">
            <button class="quick-pill" on:click={openFilePicker}>
                <Download size={14} /> Importar Backup
            </button>
            <button class="quick-pill" on:click={goToStats}>
                <BarChart3 size={14} /> Ver Estatísticas
            </button>
        </div>
    </div>
</div>

<style>
    .empty-state {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-deep);
        overflow: hidden;
    }

    .content {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        max-width: 560px;
        z-index: 10;
    }

    .greeting {
        font-size: 28px;
        font-weight: 500;
        color: var(--color-text-primary);
        margin-bottom: 32px;
        letter-spacing: -0.02em;
    }

    .search-bar {
        width: 100%;
        display: flex;
        align-items: center;
        background: rgba(255, 255, 255, 0.03);
        border: none;
        border-radius: 9999px;
        padding: 16px 24px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), inset 0 0 0 1px rgba(255,255,255,0.05);
        margin-bottom: 32px;
    }

    .search-bar:hover {
        background: rgba(255, 255, 255, 0.06);
        box-shadow: 0 12px 40px rgba(157, 78, 221, 0.15), inset 0 0 0 1px rgba(157, 78, 221, 0.3);
        transform: translateY(-2px);
    }

    .search-bar :global(.search-icon) {
        color: var(--color-text-secondary);
        margin-right: 12px;
    }

    .placeholder {
        flex: 1;
        text-align: left;
        font-size: 16px;
        color: var(--color-text-tertiary);
    }

    .shortcut {
        font-size: 12px;
        font-family: var(--font-mono);
        color: var(--color-text-tertiary);
        background: rgba(255, 255, 255, 0.05);
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid var(--border);
    }

    .quick-actions {
        display: flex;
        gap: 16px;
    }

    .quick-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255,255,255,0.03);
        border: none;
        color: var(--color-text-secondary);
        padding: 10px 20px;
        border-radius: 9999px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
    }

    .quick-pill:hover {
        background: var(--layer-2);
        color: var(--color-text-primary);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2), inset 0 0 0 1px var(--border-focus);
        transform: scale(1.05);
    }

    .animate-slide-up {
        animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }

    @keyframes slideUp {
        0% { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
    }
</style>
