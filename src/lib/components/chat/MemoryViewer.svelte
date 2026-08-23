<script>
  import { createEventDispatcher } from 'svelte';
  export let show = false;
  export let memories = [];
  export let lastUpdated = new Date().toISOString();

  const dispatch = createEventDispatcher();

  function close() {
    show = false;
    dispatch('close');
  }
</script>

{#if show}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="overlay" on:click|self={close}>
    <div class="dialog">
      <div class="dialog-header">
        <div>
          <h2>Resumo da memória</h2>
          <span class="last-updated">Atualizado em {new Date(lastUpdated).toLocaleDateString()}</span>
        </div>
        <button class="close-btn" on:click={close}>✕</button>
      </div>

      <div class="dialog-content">
        {#if memories.length === 0}
          <div class="empty-state">
            <p>Nenhuma memória extraída ainda.</p>
          </div>
        {:else}
          {#each memories as mem}
            <div class="memory-section">
              <h3>{mem.category}</h3>
              <p>{mem.content}</p>
            </div>
          {/each}
        {/if}
      </div>
      
      <div class="dialog-footer">
        <button class="btn-primary" on:click={close}>Fechar</button>
      </div>
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
    width: 600px;
    max-width: 90vw;
    max-height: 85vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(217, 111, 255, 0.15);
    animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .dialog-header {
    padding: 24px 24px 16px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    border-bottom: 1px solid var(--border-light, #333);
  }

  .dialog-header h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--color-text-primary, #fff);
    margin: 0 0 4px;
  }

  .last-updated {
    font-size: 13px;
    color: var(--color-text-secondary, #888);
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
    background: var(--layer-2, #2a2a3e);
    color: #fff;
  }

  .dialog-content {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .memory-section h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary, #fff);
    margin: 0 0 12px;
  }

  .memory-section p {
    font-size: 14.5px;
    line-height: 1.6;
    color: var(--color-text-secondary, #b3b3b3);
    margin: 0;
  }

  .empty-state {
    text-align: center;
    padding: 48px 0;
    color: var(--color-text-secondary, #888);
  }

  .dialog-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border-light, #333);
    display: flex;
    justify-content: flex-end;
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
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(217, 111, 255, 0.5);
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
</style>
