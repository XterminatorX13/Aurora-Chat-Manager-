<script lang="ts">
    import { cn } from "$lib/cn.ts";

    export let text: string = "";
    export let className: string = "";
    export let position: "top" | "bottom" | "left" | "right" = "top";

    let visible = false;
</script>

<div class="relative inline-block">
    <!-- Trigger -->
    <div
        on:mouseenter={() => (visible = true)}
        on:mouseleave={() => (visible = false)}
        on:focus={() => (visible = true)}
        on:blur={() => (visible = false)}
    >
        <slot />
    </div>

    <!-- Tooltip -->
    {#if visible && text}
        <div
            class={cn(
                "absolute z-50 px-3 py-1.5 text-xs font-medium text-white bg-accent-2 rounded-md shadow-lg animate-fadeIn pointer-events-none whitespace-nowrap",
                position === "top" &&
                    "bottom-full left-1/2 -translate-x-1/2 mb-2",
                position === "bottom" &&
                    "top-full left-1/2 -translate-x-1/2 mt-2",
                position === "left" &&
                    "right-full top-1/2 -translate-y-1/2 mr-2",
                position === "right" &&
                    "left-full top-1/2 -translate-y-1/2 ml-2",
                className,
            )}
        >
            {text}
            <!-- Arrow -->
            <div
                class={cn(
                    "absolute w-2 h-2 bg-accent-2 transform rotate-45",
                    position === "top" &&
                        "bottom-[-4px] left-1/2 -translate-x-1/2",
                    position === "bottom" &&
                        "top-[-4px] left-1/2 -translate-x-1/2",
                    position === "left" &&
                        "right-[-4px] top-1/2 -translate-y-1/2",
                    position === "right" &&
                        "left-[-4px] top-1/2 -translate-y-1/2",
                )}
            />
        </div>
    {/if}
</div>
