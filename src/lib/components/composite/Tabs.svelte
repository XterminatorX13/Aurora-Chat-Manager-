<script lang="ts">
    import { cn } from "$lib/cn.ts";

    export let value: string;
    export let tabs: Array<{ id: string; label: string }> = [];
    export let className: string = "";
</script>

<div class={cn("w-full", className)}>
    <!-- Tab List -->
    <div class="flex border-b border-border">
        {#each tabs as tab}
            <button
                on:click={() => (value = tab.id)}
                class={cn(
                    "px-4 py-2 text-sm font-medium transition-all relative",
                    value === tab.id
                        ? "text-highlight"
                        : "text-color-text-secondary hover:text-color-text-primary",
                )}
            >
                {tab.label}
                {#if value === tab.id}
                    <div
                        class="absolute bottom-0 left-0 right-0 h-0.5 bg-highlight shadow-[0_0_8px_rgba(217,111,255,0.6)]"
                    />
                {/if}
            </button>
        {/each}
    </div>

    <!-- Tab Content -->
    <div class="mt-4">
        <slot {value} />
    </div>
</div>
