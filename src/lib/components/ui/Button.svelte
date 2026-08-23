<script lang="ts">
    import { cn } from "./cn";

    export let variant:
        | "default"
        | "purple"
        | "outline"
        | "ghost"
        | "destructive" = "default";
    export let size: "default" | "sm" | "lg" | "icon" = "default";
    export let className: string = "";

    const variants = {
        default:
            "bg-layer-2 text-color-text-primary border-border-light hover:bg-accent-2 hover:text-white",
        purple: "bg-accent-1 text-white border-highlight hover:bg-accent-2 shadow-[0_0_12px_rgba(217,111,255,0.3)]",
        outline:
            "border-border-light bg-transparent hover:bg-layer-2 text-color-text-secondary hover:text-color-text-primary",
        ghost: "hover:bg-layer-2 hover:text-color-text-primary",
        destructive: "bg-red-600 text-white hover:bg-red-700",
    };

    const sizes = {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
    };
</script>

<button
    on:click
    class={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-highlight disabled:pointer-events-none disabled:opacity-50 border cursor-pointer",
        variants[variant],
        sizes[size],
        "hover:scale-105",
        className,
    )}
    {...$$restProps}
>
    <slot />
</button>

<style>
    button {
        font-family: "Inter", system-ui, sans-serif;
    }
</style>
