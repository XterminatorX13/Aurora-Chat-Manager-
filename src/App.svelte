<script>
    import { onMount, onDestroy } from "svelte";
    import Sidebar from "$lib/components/layout/Sidebar.svelte";
    import ChatView from "$lib/components/chat/ChatView.svelte";
    import LibraryView from "$lib/components/library/LibraryView.svelte";
    import DebugPanel from "$lib/components/base/DebugPanel.svelte";
    import ImportDialog from "$lib/components/importer/ImportDialog.svelte";
    import ExportGuide from "$lib/components/importer/ExportGuide.svelte";
    import MemoryViewer from "$lib/components/chat/MemoryViewer.svelte";
    import CommandPalette from "$lib/components/layout/CommandPalette.svelte";
    import GlitchButton from "$lib/components/base/GlitchButton.svelte";
    import { normalizeConversation, getConvKey } from "./lib/utils.js";
    import { parseFile } from "./lib/parsers/index.js";
    import {
        loadConversations,
        saveConversations,
        loadAllMetadata,
        saveAllMetadata,
        migrateFromLocalStorage,
        getDbStats,
    } from "./lib/db.js";

    let allConversations = [];
    let allMemories = [];
    let metadata = {};
    let activeId = null;
    let activeFolder = "__ALL__";
    let activeView = "chat"; // 'chat' or 'library'
    let folderMeta = {};
    let showWelcome = true;
    let showImportDialog = false;
    let showExportGuide = false;
    let showMemoryViewer = false;
    let memoryLastUpdated = new Date().toISOString();

    const FOLDER_META_KEY = "pkm_folder_meta_v1";

    $: activeConversation = activeId
        ? allConversations.find((c) => getConvKey(c) === activeId)
        : null;
    $: activeMeta = activeId ? metadata[activeId] || {} : {};

    onMount(async () => {
        // First, try to migrate from localStorage to IndexedDB
        await migrateFromLocalStorage();

        // Load conversations from IndexedDB
        try {
            const convs = await loadConversations();
            if (convs.length > 0) {
                allConversations = convs.map(normalizeConversation);
                showWelcome = false;
                console.log(
                    `📂 Loaded ${allConversations.length} conversations`,
                );
            }
        } catch (e) {
            console.error("Error loading conversations:", e);
        }

        // Load metadata from IndexedDB
        try {
            metadata = await loadAllMetadata();
        } catch (e) {
            console.error("Error loading metadata:", e);
        }

        // Load folder metadata (keep in localStorage - small data)
        try {
            const saved = localStorage.getItem(FOLDER_META_KEY);
            if (saved) folderMeta = JSON.parse(saved);
            
            const savedMemories = localStorage.getItem("umbra_memories");
            if (savedMemories) allMemories = JSON.parse(savedMemories);
            
            const savedDate = localStorage.getItem("umbra_memories_date");
            if (savedDate) memoryLastUpdated = savedDate;
        } catch (e) {
            console.error("Error loading folder meta/memories:", e);
        }

        // Log DB stats
        const stats = await getDbStats();
        console.log(
            `📊 DB Stats: ${stats.conversations} conversations, ${stats.metadata} metadata`,
        );
    });

    async function handleFileInput(e) {
        const files = Array.from(e.target.files || []);
        if (!files.length) return;

        for (const file of files) {
            try {
                const result = await parseFile(file);
                const normalized = result.conversations.map(normalizeConversation);
                allConversations = [...allConversations, ...normalized];
            } catch (err) {
                console.error(`Erro ao importar ${file.name}:`, err);
                alert(`Erro ao importar ${file.name}: ${err.message}`);
            }
        }

        if (allConversations.length > 0) {
            showWelcome = false;
            saveConversations(allConversations).catch((e) =>
                console.warn("Could not save conversations:", e),
            );
        }
    }

    function handleImportFromDialog(event) {
        const { conversations, memories } = event.detail;
        
        if (conversations && conversations.length > 0) {
            const normalized = conversations.map(normalizeConversation);
            allConversations = [...allConversations, ...normalized];
            saveConversations(allConversations).catch((e) =>
                console.warn("Could not save conversations:", e),
            );
        }
        
        if (memories && memories.length > 0) {
            allMemories = memories;
            memoryLastUpdated = new Date().toISOString();
            localStorage.setItem("umbra_memories", JSON.stringify(allMemories));
            localStorage.setItem("umbra_memories_date", memoryLastUpdated);
        }

        showWelcome = false;
        showImportDialog = false;
    }

    function handleSelect(event) {
        activeId = event.detail.id;
        activeView = 'chat'; // Force view back to chat when a conversation is selected
    }

    function handleUpdateMeta(event) {
        const { id, ...rest } = event.detail;
        if (!metadata[id]) metadata[id] = {};

        metadata[id] = {
            ...metadata[id],
            ...rest,
        };

        metadata = { ...metadata };
        saveMetadata();
    }

    function handleToggleFav(event) {
        const { id } = event.detail;
        if (!metadata[id]) metadata[id] = {};
        metadata[id].favorite = !metadata[id].favorite;
        metadata = { ...metadata };
        saveMetadata();
    }

    function handleBulkFavorite(event) {
        const { id } = event.detail;
        if (!metadata[id]) metadata[id] = {};
        metadata[id].favorite = true;
        metadata = { ...metadata };
        saveMetadata();
    }

    function handleBulkMove(event) {
        const { id, folder } = event.detail;
        if (!metadata[id]) metadata[id] = {};
        metadata[id].folder = folder;
        metadata = { ...metadata };
        saveMetadata();
    }

    function handleBulkDelete(event) {
        const { id } = event.detail;
        if (!metadata[id]) metadata[id] = {};
        metadata[id].deleted = true;
        metadata = { ...metadata };
        saveMetadata();
    }

    function handleMetadataChanged() {
        metadata = { ...metadata };
        saveMetadata();
    }

    async function saveMetadata() {
        // Save to IndexedDB instead of localStorage
        await saveAllMetadata(metadata);
    }

    function exportAllMetadata() {
        const blob = new Blob([JSON.stringify(metadata, null, 2)], {
            type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `metadata-export-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function importMetadata() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    metadata = { ...metadata, ...data };
                    saveMetadata();
                    alert("Metadata importada com sucesso!");
                } catch (err) {
                    alert("Erro ao importar metadata: " + err.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function clearAllData() {
        if (
            !confirm(
                "ATENÇÃO: Isso vai deletar TODAS as conversas e metadados. Tem certeza?",
            )
        )
            return;
        allConversations = [];
        metadata = {};
        activeId = null;
        showWelcome = true;
        localStorage.removeItem("auto-saved-conversations");
        localStorage.setItem(METADATA_FILENAME, "{}");
    }

    // Global hotkeys
    function handleKeydown(e) {
        // Ctrl/Cmd + E = Export metadata
        if ((e.ctrlKey || e.metaKey) && e.key === "e") {
            e.preventDefault();
            exportAllMetadata();
        }
        // Ctrl/Cmd + I = Import metadata
        if ((e.ctrlKey || e.metaKey) && e.key === "i") {
            e.preventDefault();
            importMetadata();
        }
        // Arrow keys for navigation
        if (allConversations.length > 0 && activeId) {
            const currentIndex = allConversations.findIndex(
                (c) => getConvKey(c) === activeId,
            );
            if (e.key === "ArrowUp" && currentIndex > 0) {
                e.preventDefault();
                activeId = getConvKey(allConversations[currentIndex - 1]);
            }
            if (
                e.key === "ArrowDown" &&
                currentIndex < allConversations.length - 1
            ) {
                e.preventDefault();
                activeId = getConvKey(allConversations[currentIndex + 1]);
            }
        }
    }

    onMount(() => {
        window.addEventListener("keydown", handleKeydown);
    });

    onDestroy(() => {
        window.removeEventListener("keydown", handleKeydown);
    });
</script>

<!-- 2-column layout: Sidebar + ChatView -->
<div
    style="display: grid; grid-template-columns: 260px 1fr; height: 100vh; width: 100vw; background: var(--bg-main); position: relative;"
>

    <Sidebar
        bind:activeFolder
        conversations={allConversations}
        {metadata}
        {activeId}
        on:select={handleSelect}
        on:updateMeta={handleUpdateMeta}
        on:metadataChanged={handleMetadataChanged}
        on:openFilePicker={() => (showImportDialog = true)}
        on:navigate={(e) => {
            const route = e.detail.route;
            if (route === "library") activeView = "library";
            else if (route === "favorites") activeFolder = "__FAV__";
            else if (route === "all") activeFolder = "__ALL__";
        }}
    />

    <!-- Right: Chat viewer -->
    <div style="display: flex; flex-direction: column; overflow: hidden;">

        {#if activeView === "library"}
            <LibraryView 
                conversations={allConversations}
                {metadata}
                on:openChat={(e) => {
                    activeId = e.detail.id;
                    activeView = "chat";
                }}
            />
        {:else}
            <ChatView
                conversation={activeConversation}
                meta={activeMeta}
                on:updateMeta={handleUpdateMeta}
                on:toggleFav={handleToggleFav}
                on:deselect={() => (activeId = null)}
                on:openFilePicker={() => (showImportDialog = true)}
                on:openSearch={() => {
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
                }}
                on:navigate={(e) => {
                    const action = e.detail.route;
                    if (action === "favorites") activeFolder = "__FAV__";
                    else if (action === "all") activeFolder = "__ALL__";
                    else if (action === "stats") console.log("Open stats");
                }}
            />
        {/if}
    </div>
</div>

<!-- Dialogs -->
<ImportDialog bind:show={showImportDialog} on:import={handleImportFromDialog} />
<ExportGuide bind:show={showExportGuide} />
<MemoryViewer bind:show={showMemoryViewer} memories={allMemories} lastUpdated={memoryLastUpdated} />

<!-- Debug Panel (Ctrl+Shift+D to toggle) -->
<DebugPanel />

<!-- Command Palette (Ctrl+K) -->
<CommandPalette
    conversations={allConversations}
    on:select={handleSelect}
    on:action={(e) => {
        const action = e.detail.action;
        if (action === "favorites") activeFolder = "__FAV__";
        else if (action === "all") activeFolder = "__ALL__";
        else if (action === "stats") console.log("Open stats");
    }}
/>

<style>
    /* ===== PERFORMANCE OPTIMIZATIONS ===== */
    /* Baseado no ARQUIVO.HTML mobile-first */

    /* Optimizações removidas temporariamente - causaram bug no scroll */

    /* ===== ANIMATIONS ===== */
    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes float {
        0%,
        100% {
            transform: translateY(0);
        }
        50% {
            transform: translateY(-20px);
        }
    }

    label:hover {
        transform: scale(1.05);
        box-shadow: 0 12px 40px rgba(217, 111, 255, 0.6) !important;
    }

    button:hover {
        transform: scale(1.05);
        background: var(--accent-2) !important;
        color: #fff !important;
    }
</style>
