<script>
  import { parseMarkdown } from "$lib/utils/markdown.js";

  /** @type {string} */
  export let text = "";
  /** @type {boolean} */
  export let isStreaming = false;

  $: renderedText = text ? parseMarkdown(text) : "";
</script>

<div class="streaming-bubble" class:is-streaming={isStreaming} role="article">
  {#if text}
    <div class="streaming-bubble__content prose-invert">
      {@html renderedText}
    </div>
  {/if}

  {#if isStreaming}
    <span class="streaming-bubble__cursor" aria-hidden="true"></span>
  {/if}

  {#if isStreaming && !text}
    <div class="streaming-bubble__thinking">
      <span class="streaming-bubble__dot"></span>
      <span class="streaming-bubble__dot"></span>
      <span class="streaming-bubble__dot"></span>
    </div>
  {/if}
</div>

<style>
  .streaming-bubble {
    position: relative;
    min-height: 20px;
  }

  .streaming-bubble__content {
    font-size: 13px;
    line-height: 1.6;
    color: var(--color-text-primary);
  }

  .streaming-bubble__content :global(p:last-child) {
    display: inline;
  }

  /* Blinking cursor at end of streamed text */
  .streaming-bubble__cursor {
    display: inline-block;
    width: 2px;
    height: 16px;
    background: var(--highlight);
    margin-left: 2px;
    vertical-align: text-bottom;
    animation: cursorBlink 0.8s ease-in-out infinite;
  }

  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }

  /* Thinking dots (before any text arrives) */
  .streaming-bubble__thinking {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) 0;
  }

  .streaming-bubble__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-text-tertiary);
    animation: dotPulse 1.4s ease-in-out infinite;
  }

  .streaming-bubble__dot:nth-child(2) {
    animation-delay: 0.2s;
  }

  .streaming-bubble__dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes dotPulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .streaming-bubble__cursor {
      animation: none;
      opacity: 1;
    }
    .streaming-bubble__dot {
      animation: none;
      opacity: 0.6;
    }
  }
</style>
