<script>
    import { createEventDispatcher, onMount } from "svelte";
    import { X } from "lucide-svelte";

    export let isOpen = false;

    const dispatch = createEventDispatcher();

    let name = "";
    let selectedEmoji = "📁";
    let selectedColor = "#8b5cf6";
    let inputEl;
    let emojiPickerOpen = false;

    const colors = [
        "#3b82f6", // Blue
        "#8b5cf6", // Violet
        "#d946ef", // Fuchsia
        "#f43f5e", // Rose
        "#f97316", // Orange
        "#eab308", // Yellow
        "#22c55e", // Green
        "#14b8a6", // Teal
        "#64748b", // Slate
        "#78716c"  // Stone
    ];

    onMount(async () => {
        await import('emoji-picker-element');
    });

    $: if (isOpen && inputEl) {
        name = "";
        selectedEmoji = "📁";
        selectedColor = colors[Math.floor(Math.random() * colors.length)];
        emojiPickerOpen = false;
        setTimeout(() => inputEl?.focus(), 50);
    }

    function handleSubmit() {
        if (!name.trim()) return;
        const payload = { name: name.trim(), icon: selectedEmoji, color: selectedColor };
        isOpen = false;
        dispatch("submit", payload);
    }

    function handleCancel() {
        isOpen = false;
        dispatch("cancel");
    }

    function handleKeydown(e) {
        if (e.key === "Enter" && name.trim()) {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === "Escape") {
            if (emojiPickerOpen) {
                e.preventDefault();
                emojiPickerOpen = false;
            } else {
                e.preventDefault();
                handleCancel();
            }
        }
    }

    function handleEmojiSelect(event) {
        selectedEmoji = event.detail.unicode;
        emojiPickerOpen = false;
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-overlay" on:click={handleCancel}>
        <div class="modal-content" on:click|stopPropagation>
            <button class="close-btn" on:click={handleCancel}>
                <X size={18} />
            </button>
            
            <div class="modal-header">
                <div class="icon-picker-container">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div class="icon-preview interactive" style="background-color: {selectedColor}20; color: {selectedColor}" on:click={() => emojiPickerOpen = !emojiPickerOpen} title="Alterar ícone">
                        {selectedEmoji}
                    </div>
                    
                    {#if emojiPickerOpen}
                        <div class="emoji-popover">
                            <emoji-picker class="umbra-emoji-picker" on:emoji-click={handleEmojiSelect}></emoji-picker>
                        </div>
                    {/if}
                </div>
                <h2>Novo Projeto</h2>
            </div>
            
            <div class="input-group">
                <label for="project-name">Nome da Pasta</label>
                <input
                    id="project-name"
                    bind:this={inputEl}
                    bind:value={name}
                    type="text"
                    placeholder="Ex: Trabalho, Estudos, Pessoal..."
                    on:keydown={handleKeydown}
                    class="modal-input"
                    autocomplete="off"
                />
            </div>

            <div class="selection-section">
                <span class="section-label">Cor de destaque</span>
                <div class="color-grid">
                    {#each colors as color}
                        <button 
                            class="color-swatch" 
                            class:active={selectedColor === color}
                            style="background-color: {color};"
                            on:click={() => selectedColor = color}
                            title={color}
                        ></button>
                    {/each}
                    <label class="color-swatch custom-color" class:active={!colors.includes(selectedColor)} title="Cor personalizada">
                        <div class="custom-color-inner" style={!colors.includes(selectedColor) ? `background-color: ${selectedColor};` : ''}></div>
                        <input type="color" bind:value={selectedColor} />
                    </label>
                </div>
            </div>

            <div class="modal-actions">
                <button class="modal-btn cancel" on:click={handleCancel}>
                    Cancelar
                </button>
                <button 
                    class="modal-btn submit" 
                    class:disabled={!name.trim()} 
                    on:click={handleSubmit}
                >
                    Criar Projeto
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(12px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .modal-content {
        background: rgba(26, 26, 36, 0.85);
        backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 24px;
        width: 100%;
        max-width: 420px;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
        animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 24px;
        /* Permitir overflow para o emoji picker sair se necessário, mas manter borda redonda */
        overflow: visible;
    }

    .modal-content::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(167, 139, 250, 0.4), transparent);
        border-radius: 20px 20px 0 0;
    }

    @keyframes slideIn {
        from { opacity: 0; transform: translateY(24px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .close-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        background: transparent;
        border: none;
        color: var(--color-text-tertiary);
        cursor: pointer;
        padding: 4px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        z-index: 10;
    }

    .close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #fff;
    }

    .modal-header {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .icon-picker-container {
        position: relative;
    }

    .icon-preview {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        transition: all 0.2s;
    }
    
    .icon-preview.interactive {
        cursor: pointer;
    }
    
    .icon-preview.interactive:hover {
        transform: scale(1.05);
        border-color: rgba(255, 255, 255, 0.3);
    }
    
    .icon-preview.interactive:active {
        transform: scale(0.95);
    }

    .emoji-popover {
        position: absolute;
        top: 60px;
        left: 0;
        z-index: 100;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        overflow: hidden;
        animation: fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    /* Tema Customizado para o emoji-picker-element */
    .umbra-emoji-picker {
        --background: #1e1e28;
        --border-color: rgba(255, 255, 255, 0.05);
        --input-border-color: rgba(255, 255, 255, 0.1);
        --input-font-color: #fff;
        --input-background-color: rgba(0, 0, 0, 0.2);
        --category-font-color: var(--color-text-secondary);
        --button-hover-background: rgba(255, 255, 255, 0.05);
        --button-active-background: rgba(255, 255, 255, 0.1);
        --indicator-color: var(--highlight);
        --num-columns: 8;
        --emoji-size: 1.5rem;
        height: 300px;
        width: 320px;
    }

    .modal-header h2 {
        font-size: 20px;
        font-weight: 600;
        color: #fff;
        margin: 0;
        letter-spacing: -0.01em;
    }

    .input-group, .selection-section {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .input-group label, .selection-section .section-label, .selection-section label {
        font-size: 11px;
        font-weight: 600;
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .modal-input {
        width: 100%;
        padding: 14px 16px;
        font-size: 14px;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        color: #fff;
        outline: none;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .modal-input:focus {
        border-color: var(--highlight);
        background: rgba(0, 0, 0, 0.4);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 0 3px rgba(157, 78, 221, 0.2);
    }

    .modal-input::placeholder {
        color: rgba(255, 255, 255, 0.2);
    }

    .color-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .color-swatch {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 2px solid transparent;
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }

    .color-swatch:hover {
        transform: scale(1.15);
    }

    .color-swatch.active {
        border-color: #fff;
        transform: scale(1.15);
        box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
    }

    .color-swatch.custom-color {
        background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .custom-color-inner {
        position: absolute;
        inset: 3px;
        border-radius: 50%;
        background-color: transparent;
        pointer-events: none;
        transition: background-color 0.2s;
    }

    .color-swatch.custom-color.active {
        border-color: #fff;
        box-shadow: 0 0 16px rgba(255, 255, 255, 0.5);
    }

    .color-swatch.custom-color input[type="color"] {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
        border: none;
        padding: 0;
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 12px;
    }

    .modal-btn {
        padding: 10px 20px;
        font-size: 13px;
        font-weight: 600;
        border-radius: 10px;
        border: none;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .modal-btn.cancel {
        background: transparent;
        color: rgba(255, 255, 255, 0.5);
    }

    .modal-btn.cancel:hover {
        background: rgba(255, 255, 255, 0.05);
        color: #fff;
    }

    .modal-btn.submit {
        background: #fff;
        color: #000;
        box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
    }

    .modal-btn.submit:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(255, 255, 255, 0.3);
    }

    .modal-btn.submit.disabled {
        background: rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.2);
        box-shadow: none;
        transform: none;
        cursor: not-allowed;
    }
</style>
