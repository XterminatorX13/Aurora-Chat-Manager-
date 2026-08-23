<script lang="ts">
    import { writable } from "svelte/store";
    import { cn } from "$lib/cn.ts";

    export let toasts = writable<
        Array<{
            id: string;
            message: string;
            type: "success" | "error" | "info" | "warning";
        }>
    >([]);

    function removeToast(id: string) {
        toasts.update((t) => t.filter((toast) => toast.id !== id));
    }

    // Auto-remove after 5 seconds
    $: $toasts.forEach((toast) => {
        setTimeout(() => removeToast(toast.id), 5000);
    });
</script>

<!-- Toast Container -->
<div class="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
    {#each $toasts as toast (toast.id)}
        <div
            class={cn(
                "flex items-center gap-3 p-4 rounded-lg border shadow-lg animate-fadeIn",
                toast.type === "success" &&
                    "bg-green-900/90 border-green-700 text-green-100",
                toast.type === "error" &&
                    "bg-red-900/90 border-red-700 text-red-100",
                toast.type === "warning" &&
                    "bg-yellow-900/90 border-yellow-700 text-yellow-100",
                toast.type === "info" &&
                    "bg-accent-1/90 border-highlight text-white",
            )}
        >
            <!-- Icon -->
            <div class="text-2xl">
                {#if toast.type === "success"}✓{/if}
                {#if toast.type === "error"}✕{/if}
                {#if toast.type === "warning"}⚠{/if}
                {#if toast.type === "info"}ℹ{/if}
            </div>

            <!-- Message -->
            <div class="flex-1 text-sm font-medium">
                {toast.message}
            </div>

            <!-- Close -->
            <button
                on:click={() => removeToast(toast.id)}
                class="text-white/70 hover:text-white transition-colors"
            >
                ×
            </button>
        </div>
    {/each}
</div>
