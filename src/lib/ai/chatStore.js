/**
 * Chat Store — Svelte reactive state for live AI chat
 * 
 * Manages the complete lifecycle of a live conversation:
 * messages, streaming state, tool invocations, and errors.
 */
import { writable, derived, get } from 'svelte/store';
import { buildMessages } from './systemPrompt.js';
import { toolSchemas } from './componentRegistry.js';
import { saveConversations } from '../db.js';

// ─────────────────────────────────────────────────────────
// Core stores
// ─────────────────────────────────────────────────────────

/** @type {import('svelte/store').Writable<Array<{role: string, content: string, toolInvocations?: Array}>>} */
export const messages = writable([]);

/** @type {import('svelte/store').Writable<string|null>} */
export const liveChatId = writable(null);

/** @type {import('svelte/store').Writable<boolean>} */
export const isStreaming = writable(false);

/** @type {import('svelte/store').Writable<string>} */
export const currentModel = writable(
  localStorage.getItem('ai-model') || 'google/gemini-2.5-flash'
);

/** @type {import('svelte/store').Writable<{type: string, message: string} | null>} */
export const error = writable(null);

/** @type {import('svelte/store').Writable<string>} */
export const streamingText = writable('');

/** @type {import('svelte/store').Writable<{hasKey: boolean, baseURL: string}>} */
export const aiSettings = writable({ hasKey: false, baseURL: 'https://openrouter.ai/api/v1' });

/** @type {import('svelte/store').Writable<Array<Object>>} */
export const availableModels = writable([]);

// ─────────────────────────────────────────────────────────
// Derived stores
// ─────────────────────────────────────────────────────────

/** Whether the chat has any messages */
export const hasMessages = derived(messages, $m => $m.length > 0);

/** The last assistant message (for context display) */
export const lastAssistantMessage = derived(messages, $m => 
  [...$m].reverse().find(m => m.role === 'assistant') || null
);

// ─────────────────────────────────────────────────────────
// Persist model preference
// ─────────────────────────────────────────────────────────

currentModel.subscribe(model => {
  if (model) {
    localStorage.setItem('ai-model', model);
  }
});

// ─────────────────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────────────────

/** IPC cleanup functions (set during init) */
let cleanupFns = [];

/**
 * Initialize IPC listeners for AI streaming.
 * Call once when the chat component mounts.
 * Returns a cleanup function for onDestroy.
 */
export function initChatListeners() {
  if (typeof window === 'undefined' || !window.electronAPI) {
    console.warn('[Chat Store] No electronAPI available — running in browser mode');
    return () => {};
  }

  // Text chunks
  const cleanupChunk = window.electronAPI.onAiChunk((data) => {
    if (data.type === 'text') {
      streamingText.update(t => t + data.content);
    }
  });

  // Tool call invocations
  const cleanupToolCall = window.electronAPI.onAiToolCall((data) => {
    if (data.type === 'tool_invocations') {
      // Finalize the streaming text as a message, attach tool invocations
      const text = get(streamingText);
      
      messages.update(msgs => {
        const updated = [...msgs];
        // Find or create the assistant message being streamed
        const lastIdx = updated.length - 1;
        if (lastIdx >= 0 && updated[lastIdx].role === 'assistant' && updated[lastIdx]._streaming) {
          updated[lastIdx] = {
            ...updated[lastIdx],
            content: text,
            toolInvocations: [
              ...(updated[lastIdx].toolInvocations || []),
              ...data.toolInvocations,
            ],
          };
        }
        return updated;
      });
    }
  });

  // Stream completed
  const cleanupDone = window.electronAPI.onAiDone(async (data) => {
    const text = get(streamingText);
    
    messages.update(msgs => {
      const updated = [...msgs];
      const lastIdx = updated.length - 1;
      if (lastIdx >= 0 && updated[lastIdx].role === 'assistant' && updated[lastIdx]._streaming) {
        updated[lastIdx] = {
          ...updated[lastIdx],
          content: text,
          _streaming: false,
        };
      }
      return updated;
    });
    
    streamingText.set('');
    isStreaming.set(false);

    // Save to Dexie
    await persistLiveChat();
  });

  // Error handling
  const cleanupError = window.electronAPI.onAiError((data) => {
    error.set(data);
    isStreaming.set(false);
    streamingText.set('');
    
    // Auto-clear error after 8 seconds
    setTimeout(() => error.set(null), 8000);
  });

  cleanupFns = [cleanupChunk, cleanupToolCall, cleanupDone, cleanupError];

  // Load initial settings
  loadAISettings();

  return () => {
    cleanupFns.forEach(fn => fn && fn());
    cleanupFns = [];
  };
}

/**
 * Send a user message and start streaming the response.
 * @param {string} text - The user's message
 */
export async function sendMessage(text) {
  if (!text.trim()) return;
  if (get(isStreaming)) return;

  const model = get(currentModel);
  
  // Add user message
  messages.update(msgs => [
    ...msgs,
    { role: 'user', content: text.trim() },
  ]);

  // Add placeholder assistant message (will be filled by streaming)
  messages.update(msgs => [
    ...msgs,
    { role: 'assistant', content: '', _streaming: true, toolInvocations: [] },
  ]);

  // Reset state
  error.set(null);
  isStreaming.set(true);
  streamingText.set('');

  // Build messages with system prompt
  const currentMsgs = get(messages)
    .filter(m => !m._streaming)
    .map(({ role, content }) => ({ role, content }));

  const fullMessages = buildMessages(currentMsgs);

  try {
    await window.electronAPI.streamChat({
      messages: fullMessages,
      model,
      tools: toolSchemas,
    });
  } catch (err) {
    error.set({ type: 'send_error', message: err.message });
    isStreaming.set(false);
  }
}

/**
 * Abort the current stream.
 */
export async function abortStream() {
  if (!get(isStreaming)) return;
  
  try {
    await window.electronAPI.abortChat();
  } catch {
    // Ignore abort errors
  }
  isStreaming.set(false);
  streamingText.set('');
}

/**
 * Add a system message to provide context (e.g., from component interactions).
 * @param {string} content - The system message content
 */
export function addSystemContext(content) {
  messages.update(msgs => [
    ...msgs,
    { role: 'system', content },
  ]);
}

/**
 * Clear all messages and reset state.
 */
export function clearChat() {
  messages.set([]);
  liveChatId.set(null);
  streamingText.set('');
  isStreaming.set(false);
  error.set(null);
}

/**
 * Persist the current LiveChat session to Dexie.
 */
export async function persistLiveChat() {
  let id = get(liveChatId);
  const msgs = get(messages);
  
  if (msgs.length === 0) return;
  
  if (!id) {
    id = crypto.randomUUID();
    liveChatId.set(id);
  }
  
  // Extract title from first user message
  const firstUserMsg = msgs.find(m => m.role === 'user');
  let title = '(Sem título)';
  if (firstUserMsg && firstUserMsg.content) {
    title = firstUserMsg.content.slice(0, 40);
    if (firstUserMsg.content.length > 40) title += '...';
  }

  const conversation = {
    id,
    title,
    createTime: new Date().getTime() / 1000,
    updateTime: new Date().getTime() / 1000,
    platform: 'umbra-live',
    messages: msgs
  };

  try {
    await saveConversations([conversation]);
  } catch (err) {
    console.error('[Chat Store] Failed to persist LiveChat:', err);
  }
}

/**
 * Load AI settings from the main process.
 */
export async function loadAISettings() {
  if (typeof window !== 'undefined' && window.electronAPI) {
    const settings = await window.electronAPI.getSettings();
    aiSettings.set(settings);
    await loadModels();
  }
}

/**
 * Fetch available models from the provider (via main process).
 */
export async function loadModels() {
  if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      const models = await window.electronAPI.getModels();
      if (models && Array.isArray(models)) {
        availableModels.set(models);
      }
    } catch (err) {
      console.error('[Chat Store] Failed to load models:', err);
      availableModels.set([]);
    }
  }
}

/**
 * Save AI settings securely in Electron userData.
 * @param {Object} settings - { apiKey?: string, baseURL?: string }
 */
export async function saveAISettings(settings) {
  if (typeof window !== 'undefined' && window.electronAPI) {
    await window.electronAPI.saveSettings(settings);
    await loadAISettings(); // Reload to get updated state and fetch models
  }
}
