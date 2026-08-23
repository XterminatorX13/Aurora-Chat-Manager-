<script>
  import { createEventDispatcher } from "svelte";
  import { parseMarkdown } from "$lib/utils/markdown.js";

  /** @type {string} */
  export let title = "";
  /** @type {string} */
  export let body = "";
  /** @type {'info' | 'success' | 'warning' | 'danger'} */
  export let variant = "info";
  /** @type {Array<{label: string, action: string}>} */
  export let actions = [];

  const dispatch = createEventDispatcher();

  const variantConfig = {
    info: {
      border: "var(--accent-2)",
      bg: "rgba(157, 78, 221, 0.06)",
      icon: "ℹ",
      accentText: "var(--highlight)",
    },
    success: {
      border: "var(--color-success)",
      bg: "rgba(16, 185, 129, 0.06)",
      icon: "✓",
      accentText: "#6ee7b7",
    },
    warning: {
      border: "var(--color-warning)",
      bg: "rgba(245, 158, 11, 0.06)",
      icon: "⚠",
      accentText: "#fbbf24",
    },
    danger: {
      border: "var(--color-error)",
      bg: "rgba(239, 68, 68, 0.06)",
      icon: "✕",
      accentText: "#fca5a5",
    },
  };

  $: config = variantConfig[variant] || variantConfig.info;
  $: renderedBody = parseMarkdown(body);

  function handleAction(action) {
    dispatch("action", { action });
  }
</script>

<div
  class="info-card"
  style="
    --card-border: {config.border};
    --card-bg: {config.bg};
    --card-accent: {config.accentText};
  "
  role="article"
  aria-label={title}
>
  <div class="info-card__header">
    <span class="info-card__icon" aria-hidden="true">{config.icon}</span>
    <h4 class="info-card__title">{title}</h4>
  </div>

  <div class="info-card__body prose-invert">
    {@html renderedBody}
  </div>

  {#if actions.length > 0}
    <div class="info-card__actions">
      {#each actions as act}
        <button
          class="info-card__action"
          on:click={() => handleAction(act.action)}
        >
          {act.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .info-card {
    background: var(--card-bg);
    border: 1px solid color-mix(in srgb, var(--card-border) 25%, transparent);
    border-left: 3px solid var(--card-border);
    border-radius: var(--radius);
    padding: var(--space-4) var(--space-5);
    font-family: var(--font-primary);
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
    contain: content;
  }

  .info-card:hover {
    border-color: color-mix(in srgb, var(--card-border) 45%, transparent);
    box-shadow: 0 0 20px color-mix(in srgb, var(--card-border) 8%, transparent);
  }

  .info-card__header {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .info-card__icon {
    font-size: 14px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-small);
    background: color-mix(in srgb, var(--card-border) 15%, transparent);
    color: var(--card-accent);
    flex-shrink: 0;
  }

  .info-card__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
    letter-spacing: -0.01em;
  }

  .info-card__body {
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-text-secondary);
  }

  .info-card__body :global(p) {
    margin: 0 0 var(--space-2) 0;
  }

  .info-card__body :global(p:last-child) {
    margin-bottom: 0;
  }

  .info-card__actions {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-4);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
  }

  .info-card__action {
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font-primary);
    color: var(--card-accent);
    background: color-mix(in srgb, var(--card-border) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--card-border) 20%, transparent);
    border-radius: var(--radius-small);
    padding: var(--space-1) var(--space-3);
    cursor: pointer;
    transition: all 0.15s ease;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .info-card__action:hover {
    background: color-mix(in srgb, var(--card-border) 20%, transparent);
    border-color: color-mix(in srgb, var(--card-border) 40%, transparent);
  }

  .info-card__action:focus-visible {
    outline: 2px solid var(--card-border);
    outline-offset: 2px;
  }

  .info-card__action:active {
    transform: scale(0.97);
  }

  @media (prefers-reduced-motion: reduce) {
    .info-card,
    .info-card__action {
      transition: none;
    }
    .info-card__action:active {
      transform: none;
    }
  }
</style>
