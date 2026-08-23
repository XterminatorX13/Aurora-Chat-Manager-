# Umbra - Agent Rules

## About Victor (The User)

### Learning Profile
- Victor learns non-linearly. He has broad exposure across many domains (philosophy, design, architecture, programming, AI, security, psychology, business) but his knowledge is fragmented — he knows the terms and can connect concepts, but often feels he has "a working approximation" rather than deep mastery.
- He reconstructs concepts in real-time during conversations, linking analogies and experiences rather than recalling memorized definitions. This makes him *seem* like he knows more than he feels he does.
- His internal bar for "knowing" something is extremely high: understanding what it is, how it works, why it exists, its limits, trade-offs, when to use it, and how to integrate it with other concepts.
- When he asks for help learning, he does NOT want more definitions or concept lists. He wants progressive, hierarchical, integrated knowledge — turning familiarity into deep understanding.
- **Never assume mastery just because he uses technical terms or connects different areas.** Treat his knowledge as someone with significant exposure who wants to consolidate it structurally.

### Work Context
- Works CLT (formal employment in Brazil), which severely limits his time, energy, and capacity for exploration.
- Every decision carries high cognitive cost. He naturally evaluates: time cost, cognitive cost, maintenance cost, financial cost, opportunity cost, and future cost.
- Because his knowledge is fragmented, he often needs to reconstruct the entire structure before making a decision. This happens across ALL domains, not just programming.

## Engineering Standards

### Zero Tolerance for Vibe-Coding
- **Never generate placeholder data, mock values, or hardcoded fallbacks.** If data is unavailable, throw an error or surface the gap explicitly.
- **Always read the SDK/source code** of any library or API before writing integration code. Never guess at type shapes, field names, or available properties.
- **Never apply patterns from one platform to another** (e.g., ChatGPT's Canvas/DALL-E concepts do not exist in Gemini). Each platform parser must be built from its own native data structures.
- **Research before coding.** Read the actual files, types, and documentation. Do not hallucinate APIs or properties.

### Code Quality
- No `Date.now()` as fake timestamps. No `'unknown'` or `'Sem título'` as silent fallbacks. If the data doesn't have it, fail loudly.
- Preserve all existing comments and docstrings unrelated to changes.
- When building parsers or integrations, map ONLY what the source actually provides. Leave fields absent rather than filling them with false values.

### Version Control
- **Conventional Commits**: All commit messages MUST follow the Conventional Commits specification.
  - Format: `<type>(<scope>): <description>`
  - Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `perf`, `test`.
  - Always provide a clear, imperative description of what the commit does.

### Production Architecture & Planning
- **Spec-Driven Development**: For any major feature or architectural change, write a technical specification (inspired by GitHub `spec-kit`) before writing code. Specs should define the Problem, Proposed Solution, and Alternatives to minimize cognitive cost and rework.
- **SOLID Principles**: All code must adhere to SOLID principles. 
  - Refuse to write "God Objects". Break down complex files (like orchestrators) into single-responsibility modules.
  - Ensure boundaries are clear (e.g., separating UI, state management, and data persistence).
