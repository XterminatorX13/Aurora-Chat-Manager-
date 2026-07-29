<script>
    import { createEventDispatcher } from "svelte";

    export let disabled = false;
    export let className = "";
    export let size = "md"; // sm, md, lg
    export let variant = "primary"; // primary, secondary, ghost, danger

    const dispatch = createEventDispatcher();

    function handleClick(e) {
        if (!disabled) {
            dispatch("click", e);
        }
    }
</script>

<button
    {disabled}
    on:click={handleClick}
    class="glitch-btn {className} size-{size} variant-{variant}"
    class:disabled
>
    <span class="glitch-text">
        <slot />
    </span>
    <span class="glitch-effect"></span>
</button>

<style>
    .glitch-btn {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-weight: 500;
        color: var(--color-text-primary);
        border: 1px solid transparent;
        border-radius: var(--radius-small);
        cursor: pointer;
        overflow: hidden;
        transition: all 0.2s ease;
        user-select: none;
        letter-spacing: 0.01em;
        -webkit-app-region: no-drag;
    }

    /* Sizes */
    .size-sm {
        padding: 4px 10px;
        font-size: 11px;
        height: 28px;
    }

    .size-md {
        padding: 8px 16px;
        font-size: 13px;
        height: 36px;
    }

    .size-lg {
        padding: 12px 24px;
        font-size: 14px;
        height: 44px;
    }

    /* Variants */
    .variant-primary {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
    }
    .variant-primary:hover {
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.2);
        color: #fff;
    }

    .variant-secondary {
        background: transparent;
        border-color: transparent;
        color: var(--color-text-secondary);
    }
    .variant-secondary:hover {
        background: rgba(255, 255, 255, 0.05);
        border-color: rgba(255, 255, 255, 0.1);
        color: var(--color-text-primary);
    }

    .variant-ghost {
        background: transparent;
        border-color: transparent;
        color: var(--color-text-secondary);
    }
    .variant-ghost:hover {
        color: var(--color-text-primary);
    }

    .variant-danger {
        background: transparent;
        border-color: transparent;
        color: #ff453a;
    }
    .variant-danger:hover {
        background: rgba(255, 69, 58, 0.1);
        border-color: rgba(255, 69, 58, 0.2);
    }

    /* Disabled */
    .disabled {
        opacity: 0.4;
        cursor: not-allowed;
        pointer-events: none;
    }

    /* Clean Effect (Removed Glitch) */
    .glitch-text {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 6px;
    }

</style>
