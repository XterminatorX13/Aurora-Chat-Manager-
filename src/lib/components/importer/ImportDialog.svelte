<script>
  import { createEventDispatcher } from 'svelte';
  import { parseFiles } from '$lib/parsers/index.js';
  import { PLATFORMS } from '$lib/platforms.js';
  import PlatformBadge from "$lib/components/chat/PlatformBadge.svelte";

  export let show = false;

  const dispatch = createEventDispatcher();

  let isDragging = false;
  let progress = 0;
  let progressMessage = '';
  let isProcessing = false;
  let results = null;
  let error = null;
  let fileInput;

  function handleDragOver(e) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDrop(e) {
    e.preventDefault();
    isDragging = false;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) processFiles(files);
  }

  function handleFileSelect(e) {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) processFiles(files);
  }

  async function processFiles(files) {
    isProcessing = true;
    progress = 0;
    progressMessage = 'Iniciando...';
    error = null;
    results = null;

    try {
      const parseResults = await parseFiles(files, (pct, msg) => {
        progress = pct;
        progressMessage = msg;
      });

      // Aggregate results
      const allConversations = [];
      const allMemories = [];
      const platformCounts = {};
      const errors = [];

      for (const r of parseResults) {
        if (r.error) {
          errors.push(`${r.fileName}: ${r.error}`);
          continue;
        }
        allConversations.push(...(r.conversations || []));
        if (r.memories) {
          allMemories.push(...r.memories);
        }
        platformCounts[r.platform] = (platformCounts[r.platform] || 0) + (r.conversations ? r.conversations.length : 0);
      }

      results = { allConversations, allMemories, platformCounts, errors };
      progress = 100;
      progressMessage = 'Concluído!';

      if (errors.length > 0) {
        error = errors.join('\n');
      }
    } catch (err) {
      error = err.message;
      progress = 0;
      progressMessage = '';
    }

    isProcessing = false;
  }

  function confirmImport() {
    if (results && (results.allConversations.length > 0 || results.allMemories?.length > 0)) {
      dispatch('import', { 
        conversations: results.allConversations,
        memories: results.allMemories
      });
    }
    close();
  }

  function close() {
    show = false;
    results = null;
    error = null;
    progress = 0;
    progressMessage = '';
    isProcessing = false;
    dispatch('close');
  }
</script>

{#if show}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="overlay" on:click|self={close}>
    <div class="dialog">
      <!-- Header -->
      <div class="dialog-header">
        <h2>📥 Importar Conversas</h2>
        <button class="close-btn" on:click={close}>✕</button>
      </div>

      <!-- Supported platforms -->
      <div class="platforms-row">
        {#each Object.entries(PLATFORMS) as [key, p]}
          <div class="platform-chip" style="--chip-color: {p.color}; --chip-bg: {p.bgSubtle}; --chip-border: {p.borderColor};">
            <PlatformBadge platform={key} size={14} />
            <span>{p.name}</span>
          </div>
        {/each}
      </div>

      <!-- Drop Zone -->
      {#if !results}
        <div
          class="drop-zone"
          class:dragging={isDragging}
          class:processing={isProcessing}
          on:dragover={handleDragOver}
          on:dragleave={handleDragLeave}
          on:drop={handleDrop}
        >
          {#if isProcessing}
            <div class="processing-view">
              <div class="spinner"></div>
              <div class="progress-bar-container">
                <div class="progress-bar" style="width: {progress}%;"></div>
              </div>
              <p class="progress-text">{progressMessage}</p>
              <p class="progress-pct">{Math.round(progress)}%</p>
            </div>
          {:else}
            <div class="drop-content">
              <div class="drop-icon">📂</div>
              <p class="drop-title">Arraste arquivos aqui</p>
              <p class="drop-subtitle">ou clique para selecionar</p>
              <p class="drop-formats">.json · .html · .zip</p>
              <input
                bind:this={fileInput}
                type="file"
                accept=".json,.html,.htm,.zip"
                multiple
                on:change={handleFileSelect}
                class="file-input"
              />
            </div>
          {/if}
        </div>
      {/if}

      <!-- Results -->
      {#if results}
        <div class="results">
          <div class="results-header">
            <span class="results-icon">✅</span>
            <span class="results-title">
              {results.allConversations.length} conversa{results.allConversations.length !== 1 ? 's' : ''} encontrada{results.allConversations.length !== 1 ? 's' : ''}
              {#if results.allMemories && results.allMemories.length > 0}
                <br />
                <span style="color: var(--highlight, #d96fff); font-size: 13px; font-weight: normal; margin-top: 4px; display: inline-block;">
                  ✨ {results.allMemories.length} blocos de memória extraídos
                </span>
              {/if}
            </span>
          </div>

          <div class="results-breakdown">
            {#each Object.entries(results.platformCounts) as [platform, count]}
              <div class="result-row">
                <PlatformBadge {platform} size={16} showLabel={true} />
                <span class="result-count">{count} conversa{count !== 1 ? 's' : ''}</span>
              </div>
            {/each}
          </div>

          {#if results.errors.length > 0}
            <div class="result-errors">
              <p class="error-title">⚠️ Erros:</p>
              {#each results.errors as err}
                <p class="error-text">{err}</p>
              {/each}
            </div>
          {/if}

          <div class="results-actions">
            <button class="btn-secondary" on:click={() => { results = null; }}>
              ← Importar mais
            </button>
            <button class="btn-primary" on:click={confirmImport}>
              ✓ Confirmar Importação
            </button>
          </div>
        </div>
      {/if}

      <!-- Error -->
      {#if error && !results}
        <div class="error-box">
          <p>❌ {error}</p>
          <button class="btn-secondary" on:click={() => { error = null; }}>Tentar novamente</button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease;
  }

  .dialog {
    background: var(--bg-panel, #1a1a2e);
    border: 1px solid var(--border, #333);
    border-radius: 16px;
    width: 560px;
    max-width: 90vw;
    max-height: 85vh;
    overflow-y: auto;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(217, 111, 255, 0.15);
    animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .dialog-header {
    padding: 20px 24px 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .dialog-header h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary, #fff);
    margin: 0;
  }

  .close-btn {
    background: none;
    border: none;
    color: var(--color-text-secondary, #888);
    font-size: 18px;
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: var(--layer-2, #2a2a3e) !important;
    color: #fff !important;
    transform: none !important;
  }

  .platforms-row {
    display: flex;
    gap: 8px;
    padding: 0 24px 16px;
    flex-wrap: wrap;
  }

  .platform-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 999px;
    background: var(--chip-bg);
    border: 1px solid var(--chip-border);
    font-size: 11px;
    color: var(--chip-color);
    font-weight: 500;
  }

  .drop-zone {
    margin: 0 24px 24px;
    border: 2px dashed var(--border-light, #444);
    border-radius: 12px;
    padding: 48px 24px;
    text-align: center;
    transition: all 0.3s;
    cursor: pointer;
    position: relative;
  }

  .drop-zone:hover, .drop-zone.dragging {
    border-color: var(--highlight, #d96fff);
    background: rgba(217, 111, 255, 0.05);
    box-shadow: inset 0 0 40px rgba(217, 111, 255, 0.08);
  }

  .drop-zone.processing {
    cursor: default;
    border-style: solid;
    border-color: var(--highlight, #d96fff);
  }

  .drop-content {
    position: relative;
  }

  .drop-icon {
    font-size: 48px;
    margin-bottom: 12px;
    animation: float 3s ease-in-out infinite;
  }

  .drop-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary, #fff);
    margin: 0 0 4px;
  }

  .drop-subtitle {
    font-size: 13px;
    color: var(--color-text-secondary, #888);
    margin: 0 0 12px;
  }

  .drop-formats {
    font-size: 11px;
    color: var(--color-text-secondary, #666);
    letter-spacing: 0.1em;
    margin: 0;
  }

  .file-input {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }

  .processing-view {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid var(--border-light, #444);
    border-top-color: var(--highlight, #d96fff);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .progress-bar-container {
    width: 100%;
    max-width: 300px;
    height: 6px;
    background: var(--layer-1, #222);
    border-radius: 999px;
    overflow: hidden;
  }

  .progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-1, #d96fff), var(--accent-2, #9b59b6));
    border-radius: 999px;
    transition: width 0.3s ease;
  }

  .progress-text {
    font-size: 12px;
    color: var(--color-text-secondary, #888);
    margin: 0;
  }

  .progress-pct {
    font-size: 20px;
    font-weight: 700;
    color: var(--highlight, #d96fff);
    margin: 0;
  }

  .results {
    padding: 0 24px 24px;
  }

  .results-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding: 12px 16px;
    background: rgba(46, 204, 113, 0.1);
    border: 1px solid rgba(46, 204, 113, 0.2);
    border-radius: 10px;
  }

  .results-icon {
    font-size: 24px;
  }

  .results-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text-primary, #fff);
  }

  .results-breakdown {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .result-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--layer-1, #1e1e30);
    border-radius: 8px;
    border: 1px solid var(--border-light, #333);
  }

  .result-count {
    font-size: 13px;
    color: var(--color-text-secondary, #888);
    font-weight: 500;
  }

  .result-errors {
    padding: 12px;
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.2);
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .error-title {
    font-size: 13px;
    font-weight: 600;
    color: #e74c3c;
    margin: 0 0 4px;
  }

  .error-text {
    font-size: 12px;
    color: var(--color-text-secondary, #888);
    margin: 2px 0;
  }

  .results-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .error-box {
    margin: 0 24px 24px;
    padding: 16px;
    background: rgba(231, 76, 60, 0.1);
    border: 1px solid rgba(231, 76, 60, 0.3);
    border-radius: 10px;
    text-align: center;
  }

  .error-box p {
    font-size: 13px;
    color: #e74c3c;
    margin: 0 0 12px;
    white-space: pre-line;
  }

  .btn-primary {
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 600;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--accent-1, #d96fff), var(--accent-2, #9b59b6));
    color: #fff;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 20px rgba(217, 111, 255, 0.3);
  }

  .btn-primary:hover {
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 30px rgba(217, 111, 255, 0.5) !important;
    background: linear-gradient(135deg, var(--accent-1, #d96fff), var(--accent-2, #9b59b6)) !important;
    color: #fff !important;
  }

  .btn-secondary {
    padding: 10px 20px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid var(--border-light, #444);
    border-radius: 10px;
    background: var(--layer-2, #2a2a3e);
    color: var(--color-text-secondary, #888);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    border-color: var(--highlight, #d96fff) !important;
    color: var(--color-text-primary, #fff) !important;
    transform: none !important;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-8px); }
  }
</style>
