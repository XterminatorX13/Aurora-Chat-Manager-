<script lang="ts">
    import { cn } from "$lib/cn.ts";
    import { createEventDispatcher } from "svelte";

    export let open = false;
    export let className: string = "";

    const dispatch = createEventDispatcher();

    function handleClose() {
        open = false;
        dispatch("close");
    }

    function handleBackdropClick(e: MouseEvent) {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && open) {
            handleClose();
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
    <!-- Backdrop -->
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div
        class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm animate-fadeIn"
        on:click={handleBackdropClick}
        role="presentation"
    >
        <!-- Dialog -->
        <div
            class="fixed left-[50%] top-[50%] z-50 translate-x-[-50%] translate-y-[-50%] animate-fadeIn"
            role="dialog"
            aria-modal="true"
        >
            <div
                class={cn(
                    "w-full max-w-lg rounded-lg border border-border bg-bg-panel p-6 shadow-[0_8px_30px_rgba(217,111,255,0.4)]",
                    "max-h-[85vh] overflow-y-auto",
                    className,
                )}
            >
                <slot />
            </div>
        </div>
    </div>
{/if}

<!-- Header slot -->
<div class="flex items-center justify-between mb-4">
    <slot name="header" />
    <button
        on:click={handleClose}
        aria-label="Close dialog"
        class="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-highlight focus-visible:ring-offset-2"
    >
        <span class="text-2xl leading-none">×</span>
    </button>
</div>

<!-- Content -->
<div class="py-4">
    <slot name="content" />
</div>

<!-- Footer -->
{#if $$slots.footer}
    <div class="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
        <slot name="footer" />
    </div>
{/if}
