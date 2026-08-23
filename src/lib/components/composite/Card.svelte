<script lang="ts">
    import { cn } from "$lib/cn.ts";

    export let className: string = "";
    export let variant: "default" | "secondary" | "outline" = "default";
</script>

<div
    class={cn(
        "rounded-lg border p-4 shadow-sm transition-all",
        variant === "default" && "border-border bg-layer-1",
        variant === "secondary" && "border-border bg-layer-2",
        variant === "outline" && "border-border-light bg-transparent",
        "hover:shadow-[0_4px_20px_rgba(217,111,255,0.2)]",
        className,
    )}
>
    <slot />
</div>
