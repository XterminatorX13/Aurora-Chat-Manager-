<script lang="ts">
    import { cn } from "$lib/cn.ts";

    export let className: string = "";
    export let variant: "default" | "purple" | "outline" = "default";
    export let size: "sm" | "default" | "lg" = "default";
</script>

<span
    class={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" &&
            "border-transparent bg-layer-2 text-color-text-primary",
        variant === "purple" &&
            "border-transparent bg-accent-2 text-white shadow-[0_0_8px_rgba(217,111,255,0.4)]",
        variant === "outline" &&
            "border-border-light bg-transparent text-color-text-secondary",
        size === "sm" && "text-[10px] px-2 py-0.5",
        size === "lg" && "text-sm px-3 py-1",
        className,
    )}
>
    <slot />
</span>
