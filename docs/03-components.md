# 🎨 Shadcn-Style Components for Dark Aurora

## ✨ Overview

Integrei uma **biblioteca de componentes estilo shadcn/ui** mantendo 100% das **cores Dark Aurora** e toda a funcionalidade existente.

---

## 📦 Componentes Criados

### **Button** (`src/lib/components/Button.svelte`)

Botão reutilizável com variants:

```svelte
<Button variant="purple">Primary Action</Button>
<Button variant="outline">Secondary</Button>
<Button variant="ghost">Minimal</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="icon">🚀</Button>
```

**Variants:**
- `default` — Fundo cinza escuro
- `purple` — Accent roxo com glow
- `outline` — Apenas borda
- `ghost` — Sem fundo
- `destructive` — Vermelho para ações

**Sizes:**
- `sm` — Pequeno (h-8)
- `default` — Normal (h-9)
- `lg` — Grande (h-10)
- `icon` — Quadrado (h-9 w-9)

**Features:**
- Hover scale (1.05x)
- Focus ring com cor highlight
- Transições suaves
- Totalmente acessível

---

### **Input** (`src/lib/components/Input.svelte`)

Campo de texto estilizado:

```svelte
<Input bind:value placeholder="Enter text..." />
<Input className="w-full" />
```

**Features:**
- Focus ring roxo
- Placeholder text secundário
- Border highlight on focus
- Transições suaves

---

### **Card** (`src/lib/components/Card.svelte`)

Container para agrupar conteúdo:

```svelte
<Card variant="default">
  <h3>Title</h3>
  <p>Content</p>
</Card>
```

**Variants:**
- `default` — Layer 1 background
- `secondary` — Layer 2 background
- `outline` — Transparente com borda

**Features:**
- Hover shadow roxo
- Border radius consistente
- Padding padrão

---

### **Badge** (`src/lib/components/Badge.svelte`)

Tags e labels:

```svelte
<Badge variant="purple">#importante</Badge>
<Badge variant="outline">Status</Badge>
<Badge size="sm">Small</Badge>
```

**Variants:**
- `default` — Cinza
- `purple` — Roxo com glow
- `outline` — Apenas borda

**Sizes:**
- `sm` — Extra pequeno
- `default` — Padrão
- `lg` — Grande

---

### **Separator** (`src/lib/components/Separator.svelte`)

Divisor visual:

```svelte
<Separator />
<Separator orientation="vertical" />
```

---

## 🎨 Sistema de Cores Tailwind

Todas as cores Dark Aurora agora estão disponíveis como **classes Tailwind**:

### **Backgrounds**
```css
bg-bg-main       /* #000000 - Preto puro */
bg-bg-deep       /* #0A010D - Roxo muito escuro */
bg-bg-panel      /* #0C0210 - Roxo escuro */
bg-layer-1       /* #0A0A0A - Cinza muito escuro */
bg-layer-2       /* #141414 - Cinza escuro */
bg-layer-3       /* #1F1F1F - Cinza médio */
```

### **Text Colors**
```css
text-color-text-primary    /* #E5E5E5 - Branco suave */
text-color-text-secondary  /* #A0A0A0 - Cinza claro */
```

### **Borders**
```css
border-border        /* #2A2A2A - Cinza escuro */
border-border-light  /* #3A3A3A - Cinza médio */
```

### **Highlights & Accents**
```css
bg-highlight    /* #D96FFF - Roxo Google */
bg-accent-1     /* #3B0E4F - Roxo profundo */
bg-accent-2     /* #4F1366 - Roxo neon */

text-highlight  /* Texto roxo */
ring-highlight  /* Focus ring roxo */
```

### **Semantic (shadcn-style)**
```css
bg-primary      /* Equivalente ao highlight */
bg-secondary    /* Equivalente ao accent-2 */
bg-muted        /* Layer 2 */
bg-destructive  /* Vermelho para ações destrutivas */
```

---

## 🛠️ Utilitários

### **cn() helper** (`src/lib/cn.ts`)

Combina classes Tailwind de forma inteligente:

```typescript
import { cn } from "$lib/cn";

cn("base-class", condition && "conditional-class", customClassName)
// Merge e remove duplicatas automaticamente
```

### **formatDate / formatDateTime**

```typescript
import { formatDate, formatDateTime } from "$lib/cn";

formatDate(timestamp)      // "12/25/2024"
formatDateTime(timestamp)  // "12/25/2024, 10:30:00 AM"
```

---

## 📐 Design Tokens

### **Border Radius**
```css
rounded-lg  /* var(--radius) - 8px */
rounded-md  /* var(--radius) - 2px */
rounded-sm  /* var(--radius) - 4px */
```

### **Animations**
```css
animate-fadeIn    /* Entrada suave */
animate-slideDown /* Expansão vertical */
animate-pulse     /* Pulsar */
animate-float     /* Flutuar */
```

---

## 🚀 Como Usar

### 1. **Importar componentes**

```svelte
<script>
  import { Button, Input, Card, Badge } from "$lib/components";
</script>
```

### 2. **Usar com classes Tailwind**

```svelte
<Button variant="purple" className="w-full mt-4">
  Ação Principal
</Button>
```

### 3. **Combinar com cn()**

```svelte
<script>
  import { cn } from "$lib/cn";
  
  let isActive = true;
</script>

<div class={cn(
  "base-styles",
  isActive && "active-styles",
  "custom-override"
)}>
  Content
</div>
```

---

## 🎯 Benefícios

✅ **Consistência** — Design system unificado  
✅ **Reutilização** — Componentes DRY  
✅ **Acessibilidade** — Focus states, aria, roles  
✅ **Tipagem** — TypeScript para props  
✅ **Performance** — Tailwind JIT compile  
✅ **Manutenção** — Fácil de atualizar cores  
✅ **DX** — Autocomplete dos variants  

---

## 🔄 Migração

Para migrar componentes existentes:

**Antes:**
```svelte
<button style="background: var(--accent-1); color: #fff; ...">
  Click
</button>
```

**Depois:**
```svelte
<Button variant="purple">
  Click
</Button>
```

---

## ✅ Componentes Completos

Todos os componentes shadcn-style foram implementados!

### **Componentes Base**
- [x] Button — Botões com 5 variants
- [x] Input — Campos de texto
- [x] Card — Containers
- [x] Badge — Tags e labels
- [x] Separator — Divisores

### **Componentes Avançados**
- [x] **Dialog** — Modal/diálogo
- [x] **Tooltip** — Dicas contextuais
- [x] **Tabs** — Navegação em abas
- [x] **Toast** — Notificações temporárias
- [x] **DropdownMenu** — Menu dropdown

---

## 📖 Uso dos Novos Componentes

### **Dialog (Modal)**
```svelte
<script>
  import { Dialog, Button } from "$lib/components";
  let open = false;
</script>

<Button on:click={() => open = true}>Abrir Modal</Button>

<Dialog bind:open>
  <svelte:fragment slot="header">
    <h3>Título do Modal</h3>
  </svelte:fragment>
  
  <svelte:fragment slot="content">
    <p>Conteúdo do modal aqui...</p>
  </svelte:fragment>
  
  <svelte:fragment slot="footer">
    <Button variant="outline" on:click={() => open = false}>Cancelar</Button>
    <Button variant="purple">Confirmar</Button>
  </svelte:fragment>
</Dialog>
```

### **Tooltip**
```svelte
<script>
  import { Tooltip, Button } from "$lib/components";
</script>

<Tooltip text="Clique para copiar" position="top">
  <Button>📋</Button>
</Tooltip>
```

### **Tabs**
```svelte
<script>
  import { Tabs } from "$lib/components";
  
  let currentTab = "tab1";
  const tabs = [
    { id: "tab1", label: "Geral" },
    { id: "tab2", label: "Avançado" }
  ];
</script>

<Tabs bind:value={currentTab} {tabs} let:value>
  {#if value === "tab1"}
    <div>Conteúdo Geral</div>
  {:else if value === "tab2"}
    <div>Conteúdo Avançado</div>
  {/if}
</Tabs>
```

### **Toast (Notificações)**
```svelte
<script>
  import { writable } from 'svelte/store';
  import { Toast } from "$lib/components";
  
  const toasts = writable([]);
  
  function showToast(message, type = 'info') {
    const id = Date.now().toString();
    toasts.update(t => [...t, { id, message, type }]);
  }
</script>

<button on:click={() => showToast('Salvo com sucesso!', 'success')}>
  Mostrar Toast
</button>

<Toast {toasts} />
```

### **DropdownMenu**
```svelte
<script>
  import { DropdownMenu, Button } from "$lib/components";
  
  let open = false;
  const items = [
    { id: "edit", label: "Editar", icon: "✏️" },
    { id: "delete", label: "Deletar", icon: "🗑️" }
  ];
</script>

<div class="relative">
  <Button on:click={() => open = !open}>Menu</Button>
  <DropdownMenu bind:open {items} />
</div>
```


---

## 🎨 Customização

Para adicionar novos variants:

```svelte
<!-- Button.svelte -->
<script>
  const variants = {
    default: "...",
    purple: "...",
    yourVariant: "bg-custom text-custom ..." // Adicione aqui
  };
</script>
```

Para novas cores no Tailwind:

```javascript
// tailwind.config.js
theme: {
  extend: {
    colors: {
      "your-custom": "hsl(...)", // Adicione aqui
    }
  }
}
```

---

**Tudo pronto! Sistema de componentes shadcn-style com Dark Aurora integrado! 🎨✨**
