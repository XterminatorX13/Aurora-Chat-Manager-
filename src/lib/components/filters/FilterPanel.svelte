<script>
    import { createEventDispatcher, onMount } from "svelte";
    import {
        Filter,
        X,
        Image as ImageIcon,
        Globe,
        Sparkles,
        Calendar as CalendarIcon,
        ChevronDown,
        Check,
        RotateCcw,
        FileText,
        Code,
        Brain,
    } from "lucide-svelte";
    import { fly, fade } from "svelte/transition";
    import { portal } from "$lib/actions/portal.js";
    import Calendar from "$lib/components/layout/Calendar.svelte";
    import { getModelName } from "$lib/utils/data.js";

    export let conversations = [];
    export let filters = {
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
    export let isOpen = false;

    // Calendar popover states
    let showCalendarFrom = false;
    let showCalendarTo = false;
    let calendarPos = { top: 0, left: 0 };

    function toggleCalendar(type, event) {
        const rect = event.currentTarget.getBoundingClientRect();
        const calendarHeight = 320;
        const calendarWidth = 260; // Slightly wider for better breathing room

        // Aurora Logic: Float to the RIGHT to avoid sidebar clipping, but check screen edge
        let left = rect.right + 16;
        let top = rect.top;

        // Vertical collision
        if (window.innerHeight - top < calendarHeight) {
            top = rect.bottom - calendarHeight;
            if (top < 16) top = 16;
        }

        // Horizontal collision
        if (left + calendarWidth > window.innerWidth) {
            left = rect.left - calendarWidth - 16; // Flip to left if no space
        }

        calendarPos = { top, left };

        if (type === "from") {
            showCalendarFrom = !showCalendarFrom;
            showCalendarTo = false;
        } else {
            showCalendarTo = !showCalendarTo;
            showCalendarFrom = false;
        }
    }

    const dispatch = createEventDispatcher();

    $: availableModels = [
        ...new Set(
            conversations
                .map((c) => c.filterMeta?.modelSlug)
                .filter(Boolean)
                .filter((m) => m !== "unknown"),
        ),
    ].sort();

    function toggleModel(model) {
        if (filters.models.includes(model)) {
            filters.models = filters.models.filter((m) => m !== model);
        } else {
            filters.models = [...filters.models, model];
        }
        dispatch("change", filters);
    }

    function toggleFeature(key) {
        filters[key] = filters[key] ? null : true;
        dispatch("change", filters);
    }

    function clearFilters() {
        filters = {
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
        showCalendarFrom = false;
        showCalendarTo = false;
        dispatch("change", filters);
    }

    function handleWindowClick(e) {
        if (!showCalendarFrom && !showCalendarTo) return;
        const target = e.target;
        if (
            target.closest(".calendar-fixed-wrapper") ||
            target.closest(".date-btn")
        )
            return;
        showCalendarFrom = false;
        showCalendarTo = false;
    }

    function close() {
        dispatch("close");
    }

    $: hasActiveFilters =
        filters.models.length > 0 ||
        filters.hasImageGen ||
        filters.hasWebSearch ||
        filters.isDeepResearch ||
        filters.hasCanvas ||
        filters.hasCode ||
        filters.dateFrom ||
        filters.dateTo;

    $: activeFilterCount =
        filters.models.length +
        (filters.hasImageGen ? 1 : 0) +
        (filters.hasWebSearch ? 1 : 0) +
        (filters.isDeepResearch ? 1 : 0) +
        (filters.hasCanvas ? 1 : 0) +
        (filters.hasCode ? 1 : 0) +
        (filters.dateFrom || filters.dateTo ? 1 : 0);

    let panelRef;
    function handleClickOutside(e) {
        if (panelRef && !panelRef.contains(e.target)) {
            close();
        }
    }

    onMount(() => {
        if (isOpen) {
            setTimeout(
                () => window.addEventListener("click", handleClickOutside),
                10,
            );
        }
        return () => window.removeEventListener("click", handleClickOutside);
    });
</script>

<svelte:window on:click={handleWindowClick} />

{#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="filter-popover"
        bind:this={panelRef}
        transition:fly={{ y: -8, duration: 250, opacity: 0 }}
        role="dialog"
        aria-modal="true"
        on:click|stopPropagation
        on:keydown|stopPropagation
    >
        <!-- Aurora Header -->
        <div class="popover-header">
            <div class="header-main">
                <Filter size={14} class="text-violet-400" />
                <span class="popover-title">Filtros Avançados</span>
            </div>

            <div class="header-actions">
                {#if hasActiveFilters}
                    <button
                        class="clear-btn"
                        on:click={clearFilters}
                        transition:fade
                    >
                        <RotateCcw size={11} />
                        Limpar
                    </button>
                    <div class="divider"></div>
                {/if}
                <button class="close-btn" on:click={close}>
                    <X size={15} />
                </button>
            </div>
        </div>

        <div class="popover-content custom-scrollbar">
            <!-- Models Section -->
            <div class="filter-group">
                <div class="group-label">
                    <Sparkles size={12} />
                    Modelos
                </div>
                <div class="pill-grid">
                    {#each availableModels as model}
                        <button
                            class="filter-pill"
                            class:active={filters.models.includes(model)}
                            on:click={() => toggleModel(model)}
                        >
                            <span
                                class="pill-dot"
                                class:active={filters.models.includes(model)}
                            ></span>
                            {getModelName(model)}
                        </button>
                    {/each}
                </div>
            </div>

            <!-- Features Section -->
            <div class="filter-group">
                <div class="group-label">
                    <Filter size={12} />
                    Ferramentas
                </div>
                <div class="feature-grid">
                    <!-- Feature: DALL-E -->
                    <button
                        class="feature-card"
                        class:active={filters.hasImageGen}
                        on:click={() => toggleFeature("hasImageGen")}
                    >
                        <div class="feature-icon-box pink">
                            <ImageIcon size={18} />
                        </div>
                        <div class="feature-info">
                            <span class="feature-name">DALL-E</span>
                            <span class="feature-desc">Geração de Imagens</span>
                        </div>
                        {#if filters.hasImageGen}
                            <div
                                class="check-badge"
                                transition:fade={{ duration: 150 }}
                            >
                                <Check size={12} />
                            </div>
                        {/if}
                    </button>

                    <!-- Feature: Deep Research -->
                    <button
                        class="feature-card"
                        class:active={filters.isDeepResearch}
                        on:click={() => toggleFeature("isDeepResearch")}
                    >
                        <div class="feature-icon-box emerald">
                            <Sparkles size={18} />
                        </div>
                        <div class="feature-info">
                            <span class="feature-name">S. Research</span>
                            <span class="feature-desc">Pesquisa Profunda</span>
                        </div>
                        {#if filters.isDeepResearch}
                            <div
                                class="check-badge"
                                transition:fade={{ duration: 150 }}
                            >
                                <Check size={12} />
                            </div>
                        {/if}
                    </button>

                    <!-- Feature: Reasoning -->
                    <button
                        class="feature-card"
                        class:active={filters.isReasoning}
                        on:click={() => toggleFeature("isReasoning")}
                    >
                        <div class="feature-icon-box purple">
                            <Brain size={18} />
                        </div>
                        <div class="feature-info">
                            <span class="feature-name">Reasoning</span>
                            <span class="feature-desc"
                                >Pensamento Extendido</span
                            >
                        </div>
                        {#if filters.isReasoning}
                            <div
                                class="check-badge"
                                transition:fade={{ duration: 150 }}
                            >
                                <Check size={12} />
                            </div>
                        {/if}
                    </button>

                    <!-- Feature: Web Browsing -->
                    <button
                        class="feature-card"
                        class:active={filters.hasWebSearch}
                        on:click={() => toggleFeature("hasWebSearch")}
                    >
                        <div class="feature-icon-box blue">
                            <Globe size={18} />
                        </div>
                        <div class="feature-info">
                            <span class="feature-name">Web Browse</span>
                            <span class="feature-desc">Acesso à Internet</span>
                        </div>
                        {#if filters.hasWebSearch}
                            <div
                                class="check-badge"
                                transition:fade={{ duration: 150 }}
                            >
                                <Check size={12} />
                            </div>
                        {/if}
                    </button>

                    <!-- Feature: Canvas -->
                    <button
                        class="feature-card"
                        class:active={filters.hasCanvas}
                        on:click={() => toggleFeature("hasCanvas")}
                    >
                        <div class="feature-icon-box purple">
                            <FileText size={18} />
                        </div>
                        <div class="feature-info">
                            <span class="feature-name">Canvas</span>
                            <span class="feature-desc">Documentos</span>
                        </div>
                        {#if filters.hasCanvas}
                            <div
                                class="check-badge"
                                transition:fade={{ duration: 150 }}
                            >
                                <Check size={12} />
                            </div>
                        {/if}
                    </button>

                    <!-- Feature: Code Interpreter -->
                    <button
                        class="feature-card"
                        class:active={filters.hasCode}
                        on:click={() => toggleFeature("hasCode")}
                    >
                        <div class="feature-icon-box orange">
                            <Code size={18} />
                        </div>
                        <div class="feature-info">
                            <span class="feature-name">Code</span>
                            <span class="feature-desc">Python / Análise</span>
                        </div>
                        {#if filters.hasCode}
                            <div
                                class="check-badge"
                                transition:fade={{ duration: 150 }}
                            >
                                <Check size={12} />
                            </div>
                        {/if}
                    </button>
                </div>
            </div>

            <!-- Date Section -->
            <div class="filter-group no-border">
                <div class="group-label">
                    <CalendarIcon size={12} />
                    Período
                </div>
                <div class="date-ranges">
                    <div class="date-field">
                        <span class="sub-label">De:</span>
                        <button
                            class="date-btn"
                            class:has-value={filters.dateFrom}
                            on:click|stopPropagation={(e) =>
                                toggleCalendar("from", e)}
                        >
                            {#if filters.dateFrom}
                                {filters.dateFrom.toLocaleDateString("pt-BR")}
                            {:else}
                                <span class="placeholder">Início</span>
                            {/if}
                            <CalendarIcon size={12} class="icon-right" />
                        </button>
                        {#if showCalendarFrom}
                            <div
                                class="calendar-fixed-wrapper"
                                style="top: {calendarPos.top}px; left: {calendarPos.left}px"
                                use:portal
                                transition:fade={{ duration: 100 }}
                            >
                                <Calendar
                                    value={filters.dateFrom}
                                    maxDate={filters.dateTo}
                                    on:select={(e) => {
                                        filters.dateFrom = e.detail;
                                        showCalendarFrom = false;
                                        dispatch("change", filters);
                                    }}
                                />
                            </div>
                        {/if}
                    </div>

                    <div class="date-field">
                        <span class="sub-label">Até:</span>
                        <button
                            class="date-btn"
                            class:has-value={filters.dateTo}
                            on:click|stopPropagation={(e) =>
                                toggleCalendar("to", e)}
                        >
                            {#if filters.dateTo}
                                {filters.dateTo.toLocaleDateString("pt-BR")}
                            {:else}
                                <span class="placeholder">Hoje</span>
                            {/if}
                            <CalendarIcon size={12} class="icon-right" />
                        </button>
                        {#if showCalendarTo}
                            <div
                                class="calendar-fixed-wrapper"
                                style="top: {calendarPos.top}px; left: {calendarPos.left}px"
                                use:portal
                                transition:fade={{ duration: 100 }}
                            >
                                <Calendar
                                    value={filters.dateTo}
                                    minDate={filters.dateFrom}
                                    on:select={(e) => {
                                        filters.dateTo = e.detail;
                                        showCalendarTo = false;
                                        dispatch("change", filters);
                                    }}
                                />
                            </div>
                        {/if}
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="popover-footer">
            <div class="footer-status">
                {#if activeFilterCount > 0}
                    <span class="status-active" transition:fade>
                        <span class="status-dot"></span>
                        {activeFilterCount}
                        {activeFilterCount === 1 ? "ativo" : "ativos"}
                    </span>
                {:else}
                    <span class="status-empty">Nenhum filtro</span>
                {/if}
            </div>
            <button
                class="apply-btn"
                on:click={() => {
                    dispatch("apply", filters);
                    close();
                }}
            >
                Aplicar
                <ChevronDown size={14} />
            </button>
        </div>
    </div>
{/if}

<style>
    /* Dark Aurora Variables */
    :global(:root) {
        --aurora-bg: #09090b;
        --aurora-surface: #18181b;
        --aurora-border: rgba(255, 255, 255, 0.08);
        --aurora-highlight: rgba(167, 139, 250, 0.1);
        --aurora-accent: #8b5cf6;
        --aurora-text: #e4e4e7;
        --aurora-text-dim: #a1a1aa;
    }

    .filter-popover {
        position: absolute;
        top: calc(100% + 10px);
        left: 0;
        right: 0;
        background: rgba(20, 20, 25, 0.65); /* Ultra glass */
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        z-index: 1000;
        backdrop-filter: blur(40px) saturate(150%); /* Heavy blur */
        box-shadow:
            0 20px 50px -12px rgba(0, 0, 0, 0.8),
            0 0 0 1px rgba(255, 255, 255, 0.08) inset,
            0 0 30px rgba(157, 78, 221, 0.15); /* subtle violet ambient glow */
        display: flex;
        flex-direction: column;
        max-height: 75vh;
        overflow: hidden;
        min-width: 320px;
    }

    .popover-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 14px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        background: rgba(255, 255, 255, 0.015);
    }

    .header-main {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #fff;
    }

    .popover-title {
        font-size: 13px;
        font-weight: 600;
        letter-spacing: -0.01em;
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .divider {
        width: 1px;
        height: 14px;
        background: rgba(255, 255, 255, 0.1);
    }

    .clear-btn {
        display: flex;
        align-items: center;
        gap: 5px;
        background: transparent;
        border: none;
        color: #a1a1aa;
        font-size: 11px;
        font-weight: 500;
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 6px;
        transition: all 0.2s;
    }

    .clear-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.08);
    }

    .close-btn {
        background: transparent;
        border: none;
        color: #71717a;
        cursor: pointer;
        padding: 4px;
        border-radius: 6px;
        display: flex;
        transition: all 0.2s;
    }

    .close-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
    }

    .popover-content {
        flex: 1;
        overflow-y: auto;
        padding: 4px 0;
    }

    .filter-group {
        padding: 16px 18px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }

    .filter-group.no-border {
        border-bottom: none;
    }

    .group-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 11px;
        font-weight: 700;
        color: #71717a;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 12px;
    }

    .pill-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .filter-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 500;
        color: #a1a1aa;
        cursor: pointer;
        transition: all 0.2s;
    }

    .filter-pill:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #fff;
    }

    .filter-pill.active {
        background: rgba(139, 92, 246, 0.15);
        border-color: rgba(139, 92, 246, 0.4);
        color: #fff;
        box-shadow: 0 0 15px rgba(139, 92, 246, 0.1);
    }

    .pill-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #3f3f46;
        transition: all 0.3s;
    }

    .filter-pill.active .pill-dot {
        background: #a78bfa;
        box-shadow: 0 0 8px #a78bfa;
    }

    .feature-grid {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .feature-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.2s;
        text-align: left;
        position: relative;
    }

    .feature-card:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
    }

    .feature-card.active {
        background: rgba(157, 78, 221, 0.1);
        border-color: rgba(157, 78, 221, 0.4);
        box-shadow: 0 0 15px rgba(157, 78, 221, 0.15) inset;
    }

    .feature-icon-box {
        width: 36px;
        height: 36px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.05);
        color: #71717a;
        transition: all 0.3s;
    }

    .feature-card.active .feature-icon-box.pink {
        background: rgba(236, 72, 153, 0.2);
        color: #f472b6;
    }
    .feature-card.active .feature-icon-box.emerald {
        background: rgba(16, 185, 129, 0.2);
        color: #34d399;
    }
    .feature-card.active .feature-icon-box.blue {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
    }
    .feature-card.active .feature-icon-box.purple {
        background: rgba(139, 92, 246, 0.2);
        color: #a78bfa;
    }
    .feature-card.active .feature-icon-box.orange {
        background: rgba(249, 115, 22, 0.2);
        color: #fb923c;
    }

    .feature-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .feature-name {
        font-size: 13px;
        font-weight: 500;
        color: #e4e4e7;
    }

    .feature-desc {
        font-size: 11px;
        color: #71717a;
    }

    .check-badge {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #8b5cf6;
        color: #000;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
    }

    .date-ranges {
        display: flex;
        gap: 12px;
    }

    .date-field {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    .sub-label {
        font-size: 11px;
        color: #71717a;
        margin-left: 4px;
    }

    .date-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        padding: 10px 12px;
        font-size: 12px;
        color: #e4e4e7;
        cursor: pointer;
        transition: all 0.2s;
    }

    .date-btn:hover {
        background: rgba(255, 255, 255, 0.06);
        border-color: rgba(255, 255, 255, 0.15);
    }

    .date-btn.has-value {
        background: rgba(139, 92, 246, 0.08);
        border-color: rgba(139, 92, 246, 0.3);
        color: #fff;
    }

    .placeholder {
        color: #52525b;
    }

    .popover-footer {
        padding: 16px 18px;
        background: rgba(0, 0, 0, 0.3);
        border-top: 1px solid rgba(255, 255, 255, 0.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .footer-status {
        font-size: 12px;
    }

    .status-empty {
        color: #52525b;
        font-style: italic;
    }

    .status-active {
        color: #a78bfa;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #a78bfa;
        box-shadow: 0 0 6px #a78bfa;
    }

    .apply-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #e4e4e7;
        color: #09090b;
        border: none;
        border-radius: 10px;
        padding: 8px 16px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
    }

    .apply-btn:hover {
        background: #fff;
        transform: translateY(-1px);
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.2);
    }

    .calendar-fixed-wrapper {
        position: fixed;
        z-index: 10001;
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
    }
</style>
