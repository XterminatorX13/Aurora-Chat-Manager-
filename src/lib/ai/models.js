/**
 * OpenRouter Models — Available models with metadata
 * 
 * Curated list of models available via OpenRouter.
 * Free models are prioritized for open-source accessibility.
 */

export const models = [
  // ── Free Models (no API key cost) ──
  {
    id: 'meta-llama/llama-3.1-8b-instruct:free',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    tier: 'free',
    contextWindow: 8192,
    supportsTools: true,
    description: 'Melhor modelo free para tool calling. Recomendado.',
  },
  {
    id: 'mistralai/mistral-7b-instruct:free',
    name: 'Mistral 7B',
    provider: 'Mistral',
    tier: 'free',
    contextWindow: 8192,
    supportsTools: true,
    description: 'Rápido e eficiente. Bom para respostas curtas.',
  },
  {
    id: 'google/gemma-2-9b-it:free',
    name: 'Gemma 2 9B',
    provider: 'Google',
    tier: 'free',
    contextWindow: 8192,
    supportsTools: false,
    description: 'Modelo Google. Sem suporte a tools — texto puro.',
  },
  
  // ── Paid Models (require API key with credits) ──
  {
    id: 'anthropic/claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    tier: 'paid',
    contextWindow: 200000,
    supportsTools: true,
    description: 'Excelente para código e raciocínio complexo.',
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    tier: 'paid',
    contextWindow: 128000,
    supportsTools: true,
    description: 'Multimodal, rápido, forte em tool calling.',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    tier: 'paid',
    contextWindow: 1000000,
    supportsTools: true,
    description: 'Context window massivo. Ideal para documentos longos.',
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    tier: 'paid',
    contextWindow: 131072,
    supportsTools: true,
    description: 'Versão robusta do Llama. Excelente custo-benefício.',
  },
];

/**
 * Get models filtered by tier
 * @param {'free' | 'paid' | 'all'} tier
 * @returns {Array}
 */
export function getModelsByTier(tier = 'all') {
  if (tier === 'all') return models;
  return models.filter(m => m.tier === tier);
}

/**
 * Get a model by its ID
 * @param {string} id
 * @returns {Object | undefined}
 */
export function getModelById(id) {
  return models.find(m => m.id === id);
}

/**
 * Get default model
 * @returns {Object}
 */
export function getDefaultModel() {
  return models.find(m => m.id === 'google/gemini-2.5-flash') || models[0]; // Gemini 2.5 Flash as default
}
