<script lang="ts">
    import { cn } from "$lib/cn.ts";

    export let className: string = "";
    export let value: string = "";
    export let placeholder: string = "";
</script>

<input
    type="text"
    bind:value
    {placeholder}
    on:input
    on:focus
    on:blur
    class={cn(
        "flex h-9 w-full rounded-md border border-border-light bg-layer-1 px-3 py-1 text-sm text-color-text-primary shadow-sm transition-all",
        "placeholder:text-color-text-secondary",
        "focus:outline-none focus:ring-1 focus:ring-highlight focus:border-highlight",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
    )}
    {...$$restProps}
/>

<style>
    input {
        font-family: "Inter", system-ui, sans-serif;
    }
</style>
