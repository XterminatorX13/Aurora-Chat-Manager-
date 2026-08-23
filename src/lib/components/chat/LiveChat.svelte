<script>
  import { onMount, onDestroy } from "svelte";
  import { Bot, User, Send, Square, Settings, Sparkles } from "lucide-svelte";
  import { parseMarkdown } from "$lib/utils/markdown.js";
  import { uiRegistry } from "$lib/ai/componentRegistry.js";
  import { getModelById } from "$lib/ai/models.js"; // Only for fallback description
  import {
    messages,
    isStreaming,
    currentModel,
    error,
    streamingText,
    aiSettings,
    availableModels,
    initChatListeners,
    sendMessage,
    abortStream,
    clearChat,
    addSystemContext,
    saveAISettings,
    loadAISettings,
  } from "$lib/ai/chatStore.js";
  import StreamingBubble from "./StreamingBubble.svelte";
  import ToolCallBadge from "./ToolCallBadge.svelte";

  let inputText = "";
  let chatContainer;
  let showSettings = false;
  let cleanup;
  
  // Settings state for the form
  let inputApiKey = "";
  let inputBaseUrl = "";
  let useCustomModel = false;
  let customModelInput = "";
  let isModelDropdownOpen = false;

  // ── Lifecycle ──
  onMount(() => {
    cleanup = initChatListeners();
  });

  onDestroy(() => {
    if (cleanup) cleanup();
  });

  // ── Auto-scroll ──
  $: if ($messages.length || $streamingText) {
    scrollToBottom();
  }

  function scrollToBottom() {
    if (chatContainer) {
      requestAnimationFrame(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      });
    }
  }

  // ── Send message ──
  function handleSend() {
    if (!inputText.trim() || $isStreaming) return;
    sendMessage(inputText);
    inputText = "";
  }

  function handleKeydown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Component action handler (bidirectional) ──
  function handleComponentAction(event, tool) {
    addSystemContext(
      `Usuário interagiu com ${tool.toolName}: ${JSON.stringify(event.detail)}`
    );
  }

  // ── Settings sync ──
  $: if (showSettings) {
    inputApiKey = ""; // Never show the actual key
    inputBaseUrl = $aiSettings.baseURL;
    
    // Check if current model is custom
    const foundModel = $availableModels.find(m => m.id === $currentModel);
    useCustomModel = !foundModel && $currentModel && $availableModels.length > 0;
    if (useCustomModel) {
      customModelInput = $currentModel;
    }
  }

  // ── API key / settings save ──
  async function saveSettings() {
    const newSettings = { baseURL: inputBaseUrl.trim() };
    if (inputApiKey.trim()) {
      newSettings.apiKey = inputApiKey.trim();
    }
    
    if (useCustomModel && customModelInput.trim()) {
      $currentModel = customModelInput.trim();
    }
    
    await saveAISettings(newSettings);
    inputApiKey = "";
    showSettings = false;
  }

  $: selectedModel = $availableModels.find(m => m.id === $currentModel) || { id: $currentModel, name: $currentModel || 'Modelo Customizado', tier: 'custom' };
</script>

<div class="live-chat">
  <!-- Messages area -->
  <div class="live-chat__messages" bind:this={chatContainer}>
    {#if !$aiSettings.hasKey && !showSettings && $aiSettings.baseURL.includes('openrouter')}
      <div class="live-chat__setup">
        <div class="live-chat__setup-icon">
          <Sparkles size={32} />
        </div>
        <h3>Configurar IA</h3>
        <p>
          Configure sua chave da API ou altere o provedor (como 9Router, LMStudio) para começar.
        </p>
        <button
          class="live-chat__setup-btn"
          on:click={() => (showSettings = true)}
        >
          <Settings size={14} />
          Configurações
        </button>
      </div>
    {:else if $messages.length === 0}
      <div class="live-chat__empty">
        <div class="live-chat__empty-icon">
          <Sparkles size={24} />
        </div>
        <p>Comece uma conversa. A IA pode gerar interfaces interativas.</p>
      </div>
    {/if}

    {#each $messages as msg, i}
      {#if msg.role === "user"}
        <div class="live-chat__msg live-chat__msg--user">
          <div class="live-chat__avatar live-chat__avatar--user">
            <User size={14} />
          </div>
          <div class="live-chat__bubble live-chat__bubble--user">
            {msg.content}
          </div>
        </div>
      {:else if msg.role === "assistant"}
        <div class="live-chat__msg live-chat__msg--assistant">
          <div class="live-chat__avatar live-chat__avatar--assistant">
            <Bot size={14} />
          </div>
          <div class="live-chat__bubble live-chat__bubble--assistant">
            {#if msg._streaming}
              <StreamingBubble
                text={$streamingText}
                isStreaming={$isStreaming}
              />
            {:else if msg.content}
              <div class="prose-invert">
                {@html parseMarkdown(msg.content)}
              </div>
            {/if}

            <!-- Generative UI: Tool Invocations → Svelte Components -->
            {#if msg.toolInvocations?.length}
              <div class="live-chat__tools">
                {#each msg.toolInvocations as tool}
                  {#if uiRegistry[tool.toolName]}
                    <div class="live-chat__gen-ui">
                      <svelte:component
                        this={uiRegistry[tool.toolName]}
                        {...tool.args}
                        on:action={(e) => handleComponentAction(e, tool)}
                      />
                    </div>
                  {:else}
                    <ToolCallBadge
                      toolCalls={[
                        {
                          name: tool.toolName,
                          type: "function",
                          arguments: tool.args,
                        },
                      ]}
                    />
                  {/if}
                {/each}
              </div>
            {/if}
          </div>
        </div>
      {/if}
    {/each}

    {#if $error}
      <div class="live-chat__error">
        <span>⚠ {$error.message}</span>
      </div>
    {/if}
  </div>

  <!-- Settings panel -->
  {#if showSettings}
    <div class="live-chat__settings">
      <div class="live-chat__settings-header">
        <h4>Configurações da IA</h4>
        <button
          class="live-chat__settings-close"
          on:click={() => (showSettings = false)}
          aria-label="Fechar configurações"
        >
          ✕
        </button>
      </div>

      <div class="live-chat__settings-field">
        <label for="base-url-input">Base URL (Provider Endpoint)</label>
        <input
          id="base-url-input"
          type="url"
          bind:value={inputBaseUrl}
          placeholder="https://openrouter.ai/api/v1"
          class="live-chat__input-field"
          on:keydown={(e) => e.key === "Enter" && saveSettings()}
        />
        <p class="live-chat__settings-hint">
          Padrão: OpenRouter. Altere para usar proxys locais como 9Router, LiteLLM ou LMStudio.
        </p>
      </div>

      <div class="live-chat__settings-field">
        <label for="api-key-input">API Key</label>
        <input
          id="api-key-input"
          type="password"
          bind:value={inputApiKey}
          placeholder={$aiSettings.hasKey ? "(Chave configurada - digite para alterar)" : "sk-..."}
          class="live-chat__input-field"
          on:keydown={(e) => e.key === "Enter" && saveSettings()}
        />
        <p class="live-chat__settings-hint">
          A chave é armazenada localmente no dispositivo. Alguns provedores locais não exigem chave.
        </p>
      </div>

      <div class="live-chat__settings-field">
        <label for="model-select">Modelo</label>
        
        {#if !useCustomModel}
          <!-- Custom Glass Dropdown -->
          <div class="live-chat__custom-dropdown" tabindex="0" role="combobox" aria-expanded={isModelDropdownOpen} aria-controls="model-list" on:blur={() => setTimeout(() => isModelDropdownOpen = false, 200)}>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div class="live-chat__dropdown-selected" on:click={() => isModelDropdownOpen = !isModelDropdownOpen}>
              <span>{selectedModel?.name || 'Selecione um modelo'}</span>
              <span class="chevron" class:rotated={isModelDropdownOpen}>▼</span>
            </div>
            
            {#if isModelDropdownOpen}
              <div class="live-chat__dropdown-list">
                {#each $availableModels as model}
                  <button 
                    class="live-chat__dropdown-item" 
                    class:active={$currentModel === model.id}
                    on:click={() => {
                      $currentModel = model.id;
                      isModelDropdownOpen = false;
                    }}
                  >
                    {model.name || model.id}
                  </button>
                {/each}
                <div class="live-chat__dropdown-divider"></div>
                <button 
                  class="live-chat__dropdown-item live-chat__dropdown-item--custom"
                  on:click={() => {
                    useCustomModel = true;
                    $currentModel = customModelInput;
                    isModelDropdownOpen = false;
                  }}
                >
                  ✦ Inserir Modelo Customizado...
                </button>
              </div>
            {/if}
          </div>
        {:else}
          <div style="display: flex; gap: 8px;">
            <input
              type="text"
              bind:value={customModelInput}
              placeholder="Ex: meta-llama/llama-3-8b-instruct"
              class="live-chat__input-field"
              style="flex: 1;"
            />
            <button class="live-chat__icon-btn" on:click={() => { useCustomModel = false; $currentModel = $availableModels[0]?.id || ''; }} title="Voltar à lista">
              ✕
            </button>
          </div>
        {/if}

        {#if selectedModel && !useCustomModel && selectedModel.description}
          <p class="live-chat__settings-hint">
            {selectedModel.description}
            {selectedModel.supportsTools === false ? " ⚠ Sem suporte a ferramentas." : ""}
          </p>
        {/if}
      </div>
      
      <button class="live-chat__save-key" on:click={saveSettings} style="margin-top: 8px;">
        Salvar Configurações
      </button>
    </div>
  {/if}

  <!-- Input bar -->
  <div class="live-chat__inputbar">
    <div class="live-chat__inputbar-inner">
      <button
        class="live-chat__icon-btn"
        on:click={() => (showSettings = !showSettings)}
        aria-label="Configurações"
        title="Configurações"
      >
        <Settings size={16} />
      </button>

      <textarea
        class="live-chat__textarea"
        bind:value={inputText}
        on:keydown={handleKeydown}
        placeholder="Mensagem..."
        rows="1"
        disabled={$isStreaming}
        aria-label="Mensagem para a IA"
      ></textarea>

      {#if $isStreaming}
        <button
          class="live-chat__icon-btn live-chat__icon-btn--stop"
          on:click={abortStream}
          aria-label="Parar geração"
          title="Parar"
        >
          <Square size={14} />
        </button>
      {:else}
        <button
          class="live-chat__icon-btn live-chat__icon-btn--send"
          on:click={handleSend}
          disabled={!inputText.trim()}
          aria-label="Enviar mensagem"
          title="Enviar"
        >
          <Send size={16} />
        </button>
      {/if}
    </div>

    {#if selectedModel}
      <div class="live-chat__model-tag">
        {selectedModel.name}
        {#if selectedModel.tier === "free"}
          <span class="live-chat__free-badge">FREE</span>
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .live-chat {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: var(--font-primary);
    background: var(--bg-main);
  }

  /* ── Messages area ── */
  .live-chat__messages {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-5);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  .live-chat__msg {
    display: flex;
    gap: var(--space-3);
    animation: msgIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) backwards;
  }

  @keyframes msgIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .live-chat__msg--user {
    flex-direction: row-reverse;
  }

  /* ── Avatars ── */
  .live-chat__avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .live-chat__avatar--user {
    background: var(--layer-2);
    color: var(--color-text-secondary);
    border: 1px solid var(--border);
  }

  .live-chat__avatar--assistant {
    background: rgba(157, 78, 221, 0.12);
    color: var(--highlight);
    border: 1px solid rgba(157, 78, 221, 0.2);
  }

  /* ── Bubbles ── */
  .live-chat__bubble {
    max-width: 80%;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius);
    font-size: 13px;
    line-height: 1.6;
  }

  .live-chat__bubble--user {
    background: var(--layer-1);
    border: 1px solid var(--border-light);
    border-top-right-radius: 2px;
    color: var(--color-text-primary);
  }

  .live-chat__bubble--assistant {
    background: rgba(18, 16, 24, 0.85);
    border: 1px solid rgba(139, 92, 246, 0.12);
    border-top-left-radius: 2px;
    color: var(--color-text-primary);
  }

  /* ── Generative UI wrapper ── */
  .live-chat__tools {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-top: var(--space-3);
  }

  .live-chat__gen-ui {
    border-top: 1px solid var(--border);
    padding-top: var(--space-3);
  }

  /* ── Empty / Setup states ── */
  .live-chat__empty,
  .live-chat__setup {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex: 1;
    text-align: center;
    color: var(--color-text-tertiary);
    gap: var(--space-3);
    padding: var(--space-8);
  }

  .live-chat__empty-icon,
  .live-chat__setup-icon {
    color: var(--accent-2);
    opacity: 0.4;
  }

  .live-chat__empty p,
  .live-chat__setup p {
    font-size: 13px;
    max-width: 300px;
    line-height: 1.5;
  }

  .live-chat__setup h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .live-chat__setup-btn {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font-primary);
    color: var(--highlight);
    background: rgba(157, 78, 221, 0.1);
    border: 1px solid rgba(157, 78, 221, 0.2);
    border-radius: var(--radius);
    padding: var(--space-2) var(--space-4);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .live-chat__setup-btn:hover {
    background: rgba(157, 78, 221, 0.2);
    border-color: rgba(157, 78, 221, 0.35);
  }

  .live-chat__setup-btn:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  /* ── Error ── */
  .live-chat__error {
    font-size: 12px;
    color: var(--color-error);
    background: rgba(239, 68, 68, 0.06);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: var(--radius-small);
    padding: var(--space-2) var(--space-3);
    animation: msgIn 0.2s ease;
  }

  /* ── Settings panel (Liquid Glass + Frosted Subtle) ── */
  .live-chat__settings {
    padding: var(--space-4);
    background: rgba(20, 20, 25, 0.4);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    position: relative;
    z-index: 10;
  }

  .live-chat__settings-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .live-chat__settings-header h4 {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
    margin: 0;
  }

  .live-chat__settings-close {
    font-size: 14px;
    color: var(--color-text-tertiary);
    background: transparent;
    border: none;
    cursor: pointer;
    padding: var(--space-1);
  }

  .live-chat__settings-close:hover {
    color: var(--color-text-primary);
  }

  .live-chat__settings-close:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  .live-chat__settings-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .live-chat__settings-field label {
    font-size: 10px;
    font-weight: 700;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .live-chat__input-field {
    font-size: 12px;
    font-family: var(--font-primary);
    color: var(--color-text-primary);
    background: rgba(10, 10, 15, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-small);
    padding: var(--space-2) var(--space-3);
    outline: none;
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .live-chat__input-field:focus {
    border-color: rgba(157, 78, 221, 0.5);
    background: rgba(157, 78, 221, 0.05);
    box-shadow: 0 0 0 1px rgba(157, 78, 221, 0.2);
  }

  /* Custom Glass Dropdown */
  .live-chat__custom-dropdown {
    position: relative;
    width: 100%;
    outline: none;
  }
  
  .live-chat__dropdown-selected {
    font-size: 12px;
    font-family: var(--font-primary);
    color: var(--color-text-primary);
    background: rgba(10, 10, 15, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-small);
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s ease;
  }
  
  .live-chat__custom-dropdown:focus .live-chat__dropdown-selected,
  .live-chat__dropdown-selected:hover {
    border-color: rgba(157, 78, 221, 0.5);
    background: rgba(157, 78, 221, 0.05);
  }
  
  .live-chat__dropdown-selected .chevron {
    font-size: 8px;
    color: var(--color-text-tertiary);
    transition: transform 0.2s ease;
  }
  
  .live-chat__dropdown-selected .chevron.rotated {
    transform: rotate(180deg);
  }
  
  .live-chat__dropdown-list {
    position: absolute;
    bottom: calc(100% + 4px);
    left: 0;
    width: 100%;
    max-height: 200px;
    overflow-y: auto;
    background: rgba(25, 25, 32, 0.85);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--radius-small);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    display: flex;
    flex-direction: column;
    padding: var(--space-1) 0;
    z-index: 20;
    animation: dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }
  
  @keyframes dropdownIn {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .live-chat__dropdown-item {
    font-size: 12px;
    font-family: var(--font-primary);
    color: var(--color-text-secondary);
    background: transparent;
    border: none;
    padding: var(--space-2) var(--space-3);
    text-align: left;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  
  .live-chat__dropdown-item:hover,
  .live-chat__dropdown-item.active {
    background: rgba(157, 78, 221, 0.15);
    color: var(--color-text-primary);
  }
  
  .live-chat__dropdown-item--custom {
    color: var(--highlight);
    font-style: italic;
  }
  
  .live-chat__dropdown-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.05);
    margin: var(--space-1) 0;
  }

  .live-chat__save-key {
    align-self: flex-start;
    font-size: 11px;
    font-weight: 600;
    font-family: var(--font-primary);
    color: var(--highlight);
    background: rgba(157, 78, 221, 0.1);
    border: 1px solid rgba(157, 78, 221, 0.2);
    border-radius: var(--radius-small);
    padding: var(--space-1) var(--space-3);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .live-chat__save-key:hover {
    background: rgba(157, 78, 221, 0.2);
  }

  .live-chat__save-key:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  .live-chat__settings-hint {
    font-size: 10px;
    color: var(--color-text-tertiary);
    line-height: 1.4;
    margin: 0;
  }

  /* ── Input bar ── */
  .live-chat__inputbar {
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--border);
    background: var(--bg-panel);
  }

  .live-chat__inputbar-inner {
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);
    background: var(--layer-1);
    border: 1px solid var(--border-light);
    border-radius: var(--radius);
    padding: var(--space-2);
    transition: border-color 0.15s ease;
  }

  .live-chat__inputbar-inner:focus-within {
    border-color: var(--border-focus);
  }

  .live-chat__textarea {
    flex: 1;
    font-size: 13px;
    font-family: var(--font-primary);
    color: var(--color-text-primary);
    background: transparent;
    border: none;
    outline: none;
    resize: none;
    padding: var(--space-1) var(--space-2);
    min-height: 24px;
    max-height: 120px;
    line-height: 1.5;
  }

  .live-chat__textarea::placeholder {
    color: var(--color-text-tertiary);
  }

  .live-chat__textarea:disabled {
    opacity: 0.5;
  }

  .live-chat__icon-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: var(--radius-small);
    background: transparent;
    border: none;
    color: var(--color-text-tertiary);
    cursor: pointer;
    transition: all 0.15s ease;
    flex-shrink: 0;
  }

  .live-chat__icon-btn:hover {
    color: var(--color-text-primary);
    background: var(--layer-2);
  }

  .live-chat__icon-btn:focus-visible {
    outline: 2px solid var(--accent-2);
    outline-offset: 2px;
  }

  .live-chat__icon-btn--send {
    color: var(--highlight);
  }

  .live-chat__icon-btn--send:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .live-chat__icon-btn--send:not(:disabled):hover {
    background: rgba(157, 78, 221, 0.12);
  }

  .live-chat__icon-btn--stop {
    color: var(--color-error);
  }

  .live-chat__icon-btn--stop:hover {
    background: rgba(239, 68, 68, 0.1);
  }

  .live-chat__model-tag {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--color-text-tertiary);
    margin-top: var(--space-1);
    padding-left: var(--space-1);
  }

  .live-chat__free-badge {
    font-size: 9px;
    font-weight: 700;
    color: var(--color-success);
    background: rgba(16, 185, 129, 0.1);
    padding: 1px 4px;
    border-radius: 3px;
    letter-spacing: 0.05em;
  }

  @media (prefers-reduced-motion: reduce) {
    .live-chat__msg,
    .live-chat__error,
    .live-chat__inputbar-inner,
    .live-chat__icon-btn,
    .live-chat__setup-btn,
    .live-chat__save-key {
      transition: none;
    }
    .live-chat__msg {
      animation: none;
    }
  }
</style>
