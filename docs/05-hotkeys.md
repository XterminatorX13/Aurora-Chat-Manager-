# 🎹 PKM ChatGPT 2.0 — Hotkeys & Features Guide

## ⌨️ Atalhos de Teclado Globais

### Navegação
- `↑` / `↓` — Navegar entre conversas
- `Ctrl/Cmd + 1` — Modo Lista
- `Ctrl/Cmd + 2` — Modo Galeria
- `Ctrl/Cmd + 3` — Modo Busca
- `Ctrl/Cmd + K` — Focar no campo de busca
- `Esc` — Limpar seleção (modo bulk)

### Gerenciamento de Dados
- `Ctrl/Cmd + S` — Salvar metadados
- `Ctrl/Cmd + E` — Exportar metadata
- `Ctrl/Cmd + I` — Importar metadata
- `Ctrl/Cmd + Shift + C` — Copiar conversa inteira
- `Ctrl/Cmd + A` — Selecionar todas (modo bulk)

### Favoritos & Pastas
- `Ctrl/Cmd + Shift + F` — Alternar para Favoritos
- `Ctrl/Cmd + Shift + S` — Mostrar/Ocultar Estatísticas

### Visualização
- `Ctrl/Cmd + +` — Aumentar tamanho da fonte
- `Ctrl/Cmd + -` — Diminuir tamanho da fonte

---

## ✨ Funcionalidades Principais

### 🗂️ Sidebar (Coluna Esquerda)

#### **Seções**
- **GERAL**
  - 📚 Todas as conversas (mostra contador)
  - ⭐ Favoritos (mostra contador)

- **PASTAS** (customizáveis)
  - Clique para abrir
  - Clique direito para editar (ícone + cor)
  - Duplo clique para deletar
  - Cada pasta mostra quantidade de conversas

#### **Busca Rápida**
- Campo de busca instantânea
- Filtra por título da conversa

#### **Estatísticas** 📊
- Total de conversas
- Favoritos
- Com notas
- Número de pastas

#### **Criação de Pastas**
- Botão "+ Pasta"
- Define ícone emoji
- Define cor em HEX
- Salvo no localStorage

---

### 📋 Área Central (Lista/Galeria/Busca)

#### **Barra de Ferramentas**
- **Busca Global** — 🔍 Busca em títulos e conteúdo
- **Seletor de View** — Lista / Galeria / Busca
- **Ordenação** — Data, Título, Nº Mensagens (↑↓)
- **Modo Seleção** — ☑️ Ativa bulk actions

#### **Modo Lista** 📋
- Cards animados com fade-in
- Mostra: título, data, tags, pasta, favorito
- Hover com efeito elevação
- Selection mode com checkboxes
- Indicador visual de conversa ativa (glow roxo)

#### **Modo Galeria** 🎨
- Grid responsivo (4 colunas)
- Cards com ícone da pasta + cor
- Preview do texto
- Hover com scale + shadow
- Contador de mensagens
- Badge da pasta com cor

#### **Modo Busca** 🔍
- Busca em tempo real no conteúdo das mensagens
- Highlights nos resultados
- Snippets contextualizados
- Mostra role (user/assistant) e timestamp
- Até 100 resultados

#### **Bulk Actions** (Modo Seleção)
- ⭐ **Favoritar** — Marca como favorito
- 📁 **Mover** — Move para pasta
- 💾 **Exportar** — Exporta JSON das selecionadas
- 🗑️ **Deletar** — Marca como deletada
- ✕ **Limpar** — Remove seleção

---

### 💬 Chat Viewer (Coluna Direita)

#### **Header**
- Título da conversa
- Contador de mensagens
- Data de criação
- Ações:
  - **A-/A+** — Controle de fonte
  - **📋** — Copiar conversa (texto puro)
  - **💾** — Exportar JSON
  - **★** — Favoritar

#### **Painel de Metadados** (editável)
- 📁 Pasta
- 🏷️ Tags (separadas por vírgula)
- Botão "Salvar Metadados"

#### **Mensagens**
- Bolhas diferenciadas:
  - **User** — Gradiente cinza à direita
  - **Assistant** — Gradiente escuro à esquerda
  - **System** — Centralizado, transparente
- Animação de entrada sequencial
- Hover com elevação
- Markdown renderizado:
  - `código` inline
  - **negrito**
  - *itálico*
  - Links
- Tamanho de fonte ajustável (10-20px)

#### **Notas Privadas** 📝
- Área expansível
- Suporta Markdown
- Auto-save on blur
- Preview renderizado
- Contador de caracteres

#### **Footer**
- Atalhos de teclado visíveis
- Dicas de uso

---

## 🎨 Recursos Visuais

### **Animações**
- `fadeIn` — Entrada de elementos
- `slideDown` — Expansão de painéis
- `slideIn` — Bulk actions
- `messageIn` — Mensagens em sequência
- `float` — Ícone de boas-vindas
- `pulse` — Placeholder vazio

### **Efeitos Hover**
- Scale (1.05x) em botões
- Elevação (translateY) em cards
- Glow roxo em elementos ativos
- Border highlight

### **Temas**
- **Dark Aurora** (padrão)
  - Background: #000000
  - Highlight: #D96FFF (roxo Google)
  - Accents: #3B0E4F, #4F1366
  - Layers: gradientes sutis
- Scrollbars customizadas (roxas)

---

## 💾 Persistência de Dados

### **LocalStorage**
- `pkm_metadata_v2` — Metadata (pastas, tags, notas, favoritos)
- `pkm_folder_meta_v1` — Config de pastas (ícone, cor)
- `auto-saved-conversations` — Conversas carregadas
- `chat-font-size` — Preferência de fonte

### **Electron (se disponível)**
- `chatviewer_metadata_v1.json` — Metadata em arquivo
- IPC para leitura/escrita

### **Export/Import**
- Metadata individual por conversa
- Export bulk de conversas selecionadas
- Import/merge de metadata
- Formato JSON padrão

---

## 🚀 Funcionalidades Avançadas

### **Auto-Save**
- Conversas carregadas são salvas automaticamente
- Metadata salva ao modificar
- Recarrega ao abrir app

### **Busca Inteligente**
- Busca em títulos e conteúdo
- Highlights contextuais
- Snippets com +/- 40 chars ao redor

### **Estatísticas**
- Contador em tempo real
- Animação de slide
- Grid responsivo

### **Multi-File Upload**
- Suporta múltiplos JSONs
- Parser robusto (array ou {conversations: []})
- Normalização automática

### **Keyboard First**
- Navegação completa por teclado
- Hints visuais de atalhos
- Esc para cancelar ações

---

## 🎯 Próximas Melhorias Possíveis

- [ ] Drag & drop para organizar pastas
- [ ] Themes (light/dark toggle)
- [ ] Timeline view
- [ ] Graph view (relacionamentos)
- [ ] Export para Markdown
- [ ] Sync com cloud (Dropbox/Google Drive)
- [ ] Tags autocomplete
- [ ] Comandos rápidos (Cmd+P)
- [ ] Full-text search com regex
- [ ] Backup automático

---

## 🐛 Solução de Problemas

### Metadata não salva
- Verifique localStorage do navegador
- Ou verifique permissões do Electron

### Conversas não aparecem
- Confirme formato do JSON exportado
- Deve ter array ou {conversations: []}

### Hotkeys não funcionam
- Verifique se não há conflito com navegador/SO
- Recarregue a página

---

**Desenvolvido com ❤️ usando Svelte + Dark Aurora Design**
