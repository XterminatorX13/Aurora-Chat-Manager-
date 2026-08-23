<script lang="ts">
    import { cn } from "$lib/cn.ts";

    export let open = false;
    export let items: Array<{ id: string; label: string; icon?: string }> = [];
    export let className: string = "";

    let el: HTMLElement;

    function handleKeydown(e: KeyboardEvent) {
        if (e.key === "Escape" && open) {
            open = false;
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if open}
    <div
        bind:this={el}
        class={cn(
            "absolute z-50 mt-1 min-w-[8rem] rounded-md border border-border bg-bg-panel p-1 shadow-[0_8px_20px_rgba(217,111,255,0.3)] animate-fadeIn",
            className,
        )}
        role="menu"
        aria-orientation="vertical"
    >
        {#each items as item}
            <button
                role="menuitem"
                on:click={() => {
                    open = false;
                    // Dispatch event
                }}
                class="relative flex w-full cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-layer-2 hover:text-highlight focus-visible:bg-layer-2 focus-visible:text-highlight focus-visible:ring-2 focus-visible:ring-highlight"
            >
                {#if item.icon}
                    <span class="mr-2 text-base">{item.icon}</span>
                {/if}
                <span>{item.label}</span>
            </button>
        {/each}
    </div>
{/if}
