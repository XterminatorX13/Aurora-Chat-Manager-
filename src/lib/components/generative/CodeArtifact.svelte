<script>
  import { createEventDispatcher } from "svelte";
  import hljs from "highlight.js";

  /** @type {string} */
  export let code = "";
  /** @type {string} */
  export let language = "plaintext";
  /** @type {string} */
  export let filename = "";
  /** @type {string} */
  export let description = "";

  const dispatch = createEventDispatcher();

  let copied = false;

  $: highlightedCode = (() => {
    const lang = hljs.getLanguage(language) ? language : "plaintext";
    return hljs.highlight(code, { language: lang }).value;
  })();

  $: lineCount = code.split("\n").length;

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      // Fallback for environments without clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = code;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      copied = true;
      setTimeout(() => (copied = false), 2000);
    }
  }
</script>

<div
  class="code-artifact"
  role="region"
  aria-label={filename || "Bloco de código"}
>
  <div class="code-artifact__header">
    <div class="code-artifact__meta">
      {#if filename}
        <span class="code-artifact__filename">{filename}</span>
      {/if}
      <span class="code-artifact__lang">{language}</span>
      <span class="code-artifact__lines">{lineCount} linhas</span>
    </div>
    <button
      class="code-artifact__copy"
      on:click={copyCode}
      aria-label="Copiar código"
    >
      {copied ? "✓ Copiado" : "Copiar"}
    </button>
  </div>

  {#if description}
    <div class="code-artifact__description">{description}</div>
  {/if}

  <div class="code-artifact__body">
    <pre><code class="hljs language-{language}">{@html highlightedCode}</code></pre>
  </div>
</div>

<style>
  .code-artifact {
    background: var(--bg-deep);
    border: 1px solid var(--border-light);
    border-radius: var(--radius);
    overflow: hidden;
    font-family: var(--font-primary);
    contain: content;
  }

  .code-artifact__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--space-3);
    background: var(--layer-1);
    border-bottom: 1px solid var(--border);
  }

  .code-artifact__meta {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .code-artifact__filename {
    font-size: 12px;
    font-weight: 600;
    font-family: var(--font-mono);
    color: var(--color-text-primary);
  }

  .code-artifact__lang {
    font-size: 10px;
    font-weight: 600;
    font-family: var(--font-mono);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--highlight);
    background: rgba(157, 78, 221, 0.1);
    padding: 2px var(--space-2);
    border-radius: var(--radius-small);
  }

  .code-artifact__lines {
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-text-tertiary);
  }

  .code-artifact__copy {
    font-size: 11px;
    font-weight: 500;
    font-family: var(--font-mono);
    color: var(--color-text-secondary);
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--radius-small);
    padding: var(--space-1) var(--space-2);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .code-artifact__copy:hover {
    color: var(--color-text-primary);
    background: var(--layer-2);
    border-color: var(--border-light);
  }

  .code-artifact__copy:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  .code-artifact__description {
    font-size: 12px;
    color: var(--color-text-secondary);
    padding: var(--space-2) var(--space-3);
    border-bottom: 1px solid var(--border);
    line-height: 1.5;
  }

  .code-artifact__body {
    overflow-x: auto;
    padding: var(--space-3) var(--space-4);
  }

  .code-artifact__body pre {
    margin: 0;
  }

  .code-artifact__body code {
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.6;
    tab-size: 2;
  }

  @media (prefers-reduced-motion: reduce) {
    .code-artifact__copy {
      transition: none;
    }
  }
</style>
