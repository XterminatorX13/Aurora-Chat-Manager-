# 🌌 Umbra — Dark Aurora

**Sistema de Gerenciamento Pessoal de Conhecimento para conversas do ChatGPT**

![Version](https://img.shields.io/badge/version-2.0.0-purple)
![License](https://img.shields.io/badge/license-MIT-blue)
![Electron](https://img.shields.io/badge/Electron-28-47848F?logo=electron)
![Svelte](https://img.shields.io/badge/Svelte-4-FF3E00?logo=svelte)

---

## ✨ **Features**

### **🗂️ Organização Avançada**
- 📁 **Pastas Customizáveis** — Ícones emoji + cores personalizadas
- 🏷️ **Tags Ilimitadas** — Sistema de tags flexível
- ⭐ **Favoritos** — Marque conversas importantes
- 🔍 **Busca Poderosa** — Busca em títulos e conteúdo
- 📝 **Notas Privadas** — Anotações com suporte Markdown

### **🎨 Interface Premium**
- 🌌 **Dark Aurora Theme** — Design roxo profissional
- 3️⃣ **Três Colunas** — Sidebar, Lista/Galeria/Busca, Chat
- 🎨 **3 Modos de Visualização** — Lista, Galeria, Busca
- ✨ **Animações Suaves** — Transições e efeitos polished
- 📊 **Estatísticas** — Dashboard com métricas

### **⌨️ Produtividade**
- 🚀 **15+ Hotkeys** — Navegação rápida por teclado
- ☑️ **Bulk Actions** — Seleção múltipla e ações em massa
- 💾 **Auto-Save** — Salva automaticamente suas alterações
- 📤 **Export/Import** — Backup e restauração de metadata
- 🔄 **Sincronização** — Metadata persistente

---

## 🚀 **Quick Start**

### **Instalação**

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/chatgpt-pkm.git

# Entre no diretório
cd chatgpt-pkm

# Instale dependências
npm install

# Execute em modo desenvolvimento
npm run dev
```

### **Build para Produção**

```bash
# Gerar instalador Windows (.exe)
npm run electron:build:win

# Gerar versão portable
npm run electron:build:portable

# Arquivos estarão em: release/
```

---

## 📖 **Como Usar**

1. **Exportar do ChatGPT**
   - Acesse ChatGPT → Settings → Data Controls
   - Clique "Export Data"
   - Baixe o arquivo `conversations.json`

2. **Carregar no PKM**
   - Abra o app
   - Clique em "Carregar Arquivos" ou arraste o JSON
   - Suas conversas aparecerão organizadas

3. **Organizar**
   - Crie pastas customizadas
   - Adicione tags
   - Escreva notas
   - Marque favoritos

4. **Buscar**
   - Use `Ctrl+K` para busca rápida
   - Ou troque para modo Busca
   - Resultados com highlights

---

## ⌨️ **Hotkeys**

| Atalho | Ação |
|--------|------|
| `Ctrl+K` | Busca rápida |
| `Ctrl+1/2/3` | Mudar visualização |
| `↑` / `↓` | Navegar conversas |
| `Ctrl+S` | Salvar metadados |
| `Ctrl+Shift+C` | Copiar conversa |
| `Ctrl+E` | Exportar metadata |
| `Ctrl+Shift+F` | Toggle favoritos |
| `Ctrl++/-` | Zoom da fonte |
| `Esc` | Cancelar/Limpar |

[Ver lista completa →](HOTKEYS.md)

---

## 🎨 **Screenshots**

### **Lista View**
Interface limpa com conversas organizadas

### **Galeria View**
Cards visuais com ícones de pastas

### **Busca**
Resultados com highlights e snippets

---

## 🛠️ **Tecnologias**

- **Frontend**: Svelte 4 + Tailwind CSS
- **Desktop**: Electron 28
- **Build**: Vite 5
- **Markdown**: Marked
- **Components**: shadcn-style (custom)

---

## 📦 **Componentes**

Sistema de design shadcn-style customizado:

```svelte
<script>
  import { Button, Card, Badge, Tooltip } from "$lib/components";
</script>

<Button variant="purple">Ação Principal</Button>
<Card><p>Container</p></Card>
<Badge variant="purple">#tag</Badge>
<Tooltip text="Ajuda"><Button>?</Button></Tooltip>
```

**10 componentes disponíveis:**
- Button, Input, Card, Badge, Separator
- Dialog, Tooltip, Tabs, Toast, DropdownMenu

[Ver documentação →](COMPONENTS.md)

---

## 📚 **Documentação**

- [01. Build Guide & Quick Run](docs/01-build-guide.md)
- [02. Design System Architecture](docs/02-architecture.md)
- [03. Component System](docs/03-components.md)
- [04. Shadcn Integration](docs/04-shadcn-integration.md)
- [05. Hotkeys](docs/05-hotkeys.md)
- [06. Performance & Memory Leaks](docs/06-memory-leaks.md)
- [07. Design Decisions & Final Summary](docs/07-design-decisions.md)

---

## 🐛 **Troubleshooting**

### **App não abre**
```bash
npm install
npm run dev
```

### **Build falha**
```bash
npm run build
npm run electron:build:win
```

### **Conversas não aparecem**
- Verifique formato do JSON
- Deve ter `{conversations: [...]}` ou `[...]`

---

## 🤝 **Contribuindo**

Contribuições são bem-vindas!

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 **License**

MIT License - veja [LICENSE](LICENSE) para detalhes

---

## ✨ **Características Técnicas**

- ✅ Zero memory leaks
- ✅ Performance otimizada
- ✅ TypeScript support
- ✅ Accessible (A11y)
- ✅ Responsive design
- ✅ Auto-save
- ✅ Offline-first
- ✅ 150MB installed size

---

## 🎯 **Roadmap**

- [ ] Sync com Cloud (Dropbox/Google Drive)
- [ ] Export para Markdown
- [ ] Timeline View
- [ ] Graph View (relacionamentos)
- [ ] Temas personalizáveis
- [ ] Mobile app (Tauri)
- [ ] Backup automático
- [ ] Comandos rápidos (Cmd+P)

---

## 💝 **Agradecimentos**

- **Svelte** — Framework incrível
- **Electron** — Desktop apps com web tech
- **shadcn/ui** — Inspiração para componentes
- **Tailwind CSS** — Styling utility-first

---

## 📬 **Contato**

- GitHub: [@seu-usuario](https://github.com/seu-usuario)
- Email: seu-email@example.com

---

**Feito com ❤️ usando Svelte + Electron + Dark Aurora Design**

⭐ Star este projeto se ele te ajudou!
