/**
 * Component Registry — Maps AI tool names to Svelte components
 * 
 * This is the "dictionary" the AI uses: each tool name corresponds
 * to a real, interactive Svelte component that gets rendered inline
 * in the chat via <svelte:component>.
 * 
 * Adding a new generative component:
 * 1. Create the .svelte component in src/lib/components/generative/
 * 2. Import it here and add to uiRegistry
 * 3. Add its JSON schema to toolSchemas
 * 4. The AI will automatically know it exists via the system prompt
 */

import DataTable from '$lib/components/generative/DataTable.svelte';
import InfoCard from '$lib/components/generative/InfoCard.svelte';
import CodeArtifact from '$lib/components/generative/CodeArtifact.svelte';
import Timeline from '$lib/components/generative/Timeline.svelte';

// ─────────────────────────────────────────────────────────
// Registry: toolName → Svelte Component
// ─────────────────────────────────────────────────────────

export const uiRegistry = {
  render_table:    DataTable,
  render_card:     InfoCard,
  render_code:     CodeArtifact,
  render_timeline: Timeline,
};

/**
 * Check if a tool name has a registered component
 * @param {string} toolName 
 * @returns {boolean}
 */
export function hasComponent(toolName) {
  return toolName in uiRegistry;
}

/**
 * Get the component for a tool name, or null
 * @param {string} toolName 
 * @returns {import('svelte').SvelteComponent | null}
 */
export function getComponent(toolName) {
  return uiRegistry[toolName] || null;
}

// ─────────────────────────────────────────────────────────
// Tool Schemas (sent to the AI via system prompt / tools param)
// ─────────────────────────────────────────────────────────

export const toolSchemas = [
  {
    type: "function",
    function: {
      name: "render_card",
      description: "Renderiza um card informativo com título, corpo em markdown, e ações opcionais. Use para resumos, definições, explicações curtas, ou alertas.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Título do card"
          },
          body: {
            type: "string",
            description: "Conteúdo do card em markdown"
          },
          variant: {
            type: "string",
            enum: ["info", "success", "warning", "danger"],
            description: "Estilo visual do card"
          },
          actions: {
            type: "array",
            description: "Botões de ação no rodapé do card",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                action: { type: "string", description: "Identificador da ação" }
              },
              required: ["label", "action"]
            }
          }
        },
        required: ["title", "body"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "render_table",
      description: "Renderiza uma tabela de dados interativa com sort e filtro. Use para dados estruturados, comparações, listas de itens com múltiplas propriedades.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Título da tabela"
          },
          headers: {
            type: "array",
            items: { type: "string" },
            description: "Nomes das colunas"
          },
          rows: {
            type: "array",
            items: {
              type: "array",
              items: { type: "string" }
            },
            description: "Linhas de dados (cada linha é um array de strings)"
          },
          caption: {
            type: "string",
            description: "Legenda opcional abaixo da tabela"
          }
        },
        required: ["headers", "rows"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "render_code",
      description: "Renderiza um bloco de código com syntax highlighting, nome do arquivo e botão de copiar. Use para snippets de código, configurações, scripts.",
      parameters: {
        type: "object",
        properties: {
          code: {
            type: "string",
            description: "O código fonte"
          },
          language: {
            type: "string",
            description: "Linguagem para syntax highlighting (javascript, python, css, etc.)"
          },
          filename: {
            type: "string",
            description: "Nome do arquivo opcional (ex: 'app.js')"
          },
          description: {
            type: "string",
            description: "Descrição breve do que o código faz"
          }
        },
        required: ["code", "language"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "render_timeline",
      description: "Renderiza uma timeline vertical com eventos ordenados. Use para cronogramas, históricos, etapas de processo, roadmaps.",
      parameters: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Título da timeline"
          },
          events: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string", description: "Título do evento" },
                description: { type: "string", description: "Detalhes do evento" },
                date: { type: "string", description: "Data ou rótulo temporal" },
                status: {
                  type: "string",
                  enum: ["completed", "current", "upcoming"],
                  description: "Estado do evento"
                }
              },
              required: ["label"]
            },
            description: "Lista de eventos na ordem cronológica"
          }
        },
        required: ["events"]
      }
    }
  }
];
