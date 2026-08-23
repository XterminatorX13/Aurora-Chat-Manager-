/**
 * AI Bridge — Electron Main Process
 * 
 * Handles AI streaming via OpenRouter using the openai SDK.
 * API key stays in the main process — never exposed to the renderer.
 * 
 * Flow:
 *   Renderer → IPC invoke('ai:stream') → ai-bridge → OpenRouter API
 *   OpenRouter API → SSE chunks → webContents.send('ai:chunk') → Renderer
 */
import OpenAI from 'openai';
import { app } from 'electron';
import path from 'path';
import fs from 'fs/promises';

// ─────────────────────────────────────────────────────────
// State
// ─────────────────────────────────────────────────────────

let aiSettings = {
  apiKey: null,
  baseURL: 'https://openrouter.ai/api/v1'
};
let activeAbortController = null;

const SETTINGS_FILE = 'ai-settings.json';

// ─────────────────────────────────────────────────────────
// Settings persistence (userData)
// ─────────────────────────────────────────────────────────

function getSettingsPath() {
  return path.join(app.getPath('userData'), SETTINGS_FILE);
}

export async function loadAISettings() {
  try {
    const content = await fs.readFile(getSettingsPath(), 'utf-8');
    const parsed = JSON.parse(content);
    
    // Merge with defaults
    aiSettings = {
      apiKey: parsed.apiKey || null,
      baseURL: parsed.baseURL || 'https://openrouter.ai/api/v1'
    };
    return aiSettings;
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('[AI Bridge] Error loading settings:', error);
    }
    return aiSettings;
  }
}

export async function saveAISettings(settings) {
  aiSettings = { ...aiSettings, ...settings };
  const settingsPath = getSettingsPath();
  
  await fs.writeFile(settingsPath, JSON.stringify(aiSettings, null, 2), 'utf-8');
  return aiSettings;
}

// ─────────────────────────────────────────────────────────
// OpenAI client (Dynamic Provider)
// ─────────────────────────────────────────────────────────

function createClient() {
  if (!aiSettings.apiKey && aiSettings.baseURL.includes('openrouter')) {
    throw new Error('API key not configured. Set it in Settings → AI.');
  }
  
  return new OpenAI({
    apiKey: aiSettings.apiKey || 'not-required',
    baseURL: aiSettings.baseURL,
    defaultHeaders: {
      'HTTP-Referer': 'https://umbra.app',
      'X-Title': 'Umbra',
    },
  });
}

/**
 * Fetch available models from the provider
 */
export async function fetchAvailableModels() {
  try {
    const client = createClient();
    const response = await client.models.list();
    // OpenAI standard is response.data
    return response.data || [];
  } catch (error) {
    console.error('[AI Bridge] Failed to fetch models:', error.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────
// Streaming handler
// ─────────────────────────────────────────────────────────

/**
 * Streams a chat completion to the renderer via IPC.
 * 
 * @param {Electron.BrowserWindow} mainWindow - The renderer window
 * @param {Object} params - Chat parameters
 * @param {Array} params.messages - Chat messages array
 * @param {string} params.model - Model identifier (e.g. 'meta-llama/llama-3.1-8b-instruct:free')
 * @param {Array} [params.tools] - Tool/function schemas for Generative UI
 * @param {number} [params.temperature] - Temperature (0-2)
 * @param {number} [params.maxTokens] - Max tokens in response
 */
export async function streamChat(mainWindow, params) {
  const { messages, model, tools, temperature = 0.7, maxTokens } = params;
  
  // Abort any existing stream
  if (activeAbortController) {
    activeAbortController.abort();
  }
  activeAbortController = new AbortController();
  
  try {
    const client = createClient();
    
    const requestParams = {
      model,
      messages,
      stream: true,
      temperature,
    };
    
    if (maxTokens) {
      requestParams.max_tokens = maxTokens;
    }
    
    // Only include tools if provided (not all models support them)
    if (tools && tools.length > 0) {
      requestParams.tools = tools;
      requestParams.tool_choice = 'auto';
    }
    
    const stream = await client.chat.completions.create(requestParams, {
      signal: activeAbortController.signal,
    });
    
    // Accumulate tool calls across chunks (they arrive in pieces)
    const pendingToolCalls = new Map();
    
    for await (const chunk of stream) {
      // Check if window was closed during streaming
      if (mainWindow.isDestroyed()) {
        activeAbortController.abort();
        return;
      }
      
      const choice = chunk.choices?.[0];
      if (!choice) continue;
      
      const delta = choice.delta;
      
      // ── Text content ──
      if (delta?.content) {
        mainWindow.webContents.send('ai:chunk', {
          type: 'text',
          content: delta.content,
        });
      }
      
      // ── Tool calls (arrive incrementally) ──
      if (delta?.tool_calls) {
        for (const tc of delta.tool_calls) {
          const idx = tc.index;
          
          if (!pendingToolCalls.has(idx)) {
            pendingToolCalls.set(idx, {
              id: tc.id || `tool_${idx}`,
              type: 'function',
              toolName: tc.function?.name || '',
              args: '',
            });
          }
          
          const pending = pendingToolCalls.get(idx);
          
          if (tc.function?.name) {
            pending.toolName = tc.function.name;
          }
          if (tc.function?.arguments) {
            pending.args += tc.function.arguments;
          }
        }
      }
      
      // ── Stream finished ──
      if (choice.finish_reason) {
        // Finalize and send any accumulated tool calls
        if (pendingToolCalls.size > 0) {
          const toolInvocations = [];
          
          for (const [, tc] of pendingToolCalls) {
            let parsedArgs = {};
            try {
              parsedArgs = JSON.parse(tc.args);
            } catch (e) {
              // Model produced invalid JSON — send error state
              console.warn('[AI Bridge] Invalid tool call JSON:', tc.args);
              mainWindow.webContents.send('ai:error', {
                type: 'tool_parse_error',
                toolName: tc.toolName,
                rawArgs: tc.args,
                message: `Falha ao parsear argumentos de ${tc.toolName}`,
              });
              continue;
            }
            
            toolInvocations.push({
              id: tc.id,
              toolName: tc.toolName,
              args: parsedArgs,
              state: 'result',
            });
          }
          
          if (toolInvocations.length > 0) {
            mainWindow.webContents.send('ai:toolCall', {
              type: 'tool_invocations',
              toolInvocations,
            });
          }
        }
        
        mainWindow.webContents.send('ai:done', {
          finishReason: choice.finish_reason,
        });
      }
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      mainWindow.webContents.send('ai:done', { finishReason: 'aborted' });
      return;
    }
    
    console.error('[AI Bridge] Stream error:', error);
    
    // Send structured error to renderer
    mainWindow.webContents.send('ai:error', {
      type: 'stream_error',
      message: error.message || 'Erro desconhecido na comunicação com a IA',
      status: error.status || null,
      code: error.code || null,
    });
  } finally {
    activeAbortController = null;
  }
}

/**
 * Abort the active stream.
 */
export function abortStream() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
}
