<script>
    import { createEventDispatcher } from "svelte";

    export let isOpen = false;
    export let title = "";
    export let placeholder = "";
    export let defaultValue = "";
    export let submitLabel = "OK";
    export let cancelLabel = "Cancelar";

    const dispatch = createEventDispatcher();

    let value = defaultValue;
    let inputEl;

    $: if (isOpen && inputEl) {
        value = defaultValue;
        setTimeout(() => inputEl?.focus(), 50);
    }

    function handleSubmit() {
        const val = value.trim();
        isOpen = false;
        dispatch("submit", { value: val });
    }

    function handleCancel() {
        dispatch("cancel");
        isOpen = false;
    }

    function handleKeydown(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        } else if (e.key === "Escape") {
            e.preventDefault();
            handleCancel();
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="modal-overlay" on:click={handleCancel}>
        <div class="modal-content" on:click|stopPropagation>
            <div class="modal-title">{title}</div>
            <input
                bind:this={inputEl}
                bind:value
                type="text"
                {placeholder}
                on:keydown={handleKeydown}
                class="modal-input"
            />
            <div class="modal-actions">
                <button class="modal-btn cancel" on:click={handleCancel}>
                    {cancelLabel}
                </button>
                <button class="modal-btn submit" on:click={handleSubmit}>
                    {submitLabel}
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
        backdrop-filter: blur(12px); /* Deep premium blur */
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .modal-content {
        background: rgba(26, 26, 36, 0.85);
        backdrop-filter: blur(24px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 20px;
        padding: 32px;
        min-width: 360px;
        max-width: 90vw;
        box-shadow:
            0 24px 80px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05); /* Inner Ring */
        animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        position: relative;
        overflow: hidden;
    }

    /* Top Shine Line */
    .modal-content::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(
            90deg,
            transparent,
            rgba(167, 139, 250, 0.4),
            transparent
        );
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(24px) scale(0.96);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .modal-title {
        font-size: 16px;
        font-weight: 600;
        color: #fff;
        margin-bottom: 24px;
        letter-spacing: -0.01em;
        text-align: center;
    }

    .modal-input {
        width: 100%;
        padding: 14px 18px;
        font-size: 15px;
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
        box-shadow:
            inset 0 2px 4px rgba(0, 0, 0, 0.2),
            0 0 0 3px rgba(157, 78, 221, 0.2);
    }

    .modal-input::placeholder {
        color: rgba(255, 255, 255, 0.3);
    }

    .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        margin-top: 24px;
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
</style>
