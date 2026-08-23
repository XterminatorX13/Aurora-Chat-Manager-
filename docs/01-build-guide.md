# 🏗️ Build Guide - Criando o .EXE

## 📦 Como Gerar o Executável do Windows

### **Passo 1: Build do Vite + Electron**

```bash
npm run electron:build:win
```

Isso vai:
1. Compilar o Svelte app (`vite build`)
2. Criar o instalador NSIS (`.exe`) 
3. Criar versão portable (`.exe` standalone)

---

### **Opções de Build**

#### **Instalador Completo (NSIS)**
```bash
npm run electron:build:win
```
- Cria instalador com setup wizard
- Registra no Windows (Add/Remove Programs)
- Cria atalho no Desktop + Menu Iniciar
- Local: `release/ChatGPT PKM 2.0 Setup 2.0.0.exe`

#### **Versão Portable**
```bash
npm run electron:build:portable
```
- Executável standalone (não precisa instalar)
- Pode rodar de qualquer pasta/USB
- Local: `release/ChatGPT PKM 2.0 2.0.0.exe`

#### **Build Genérico**
```bash
npm run electron:build
```
- Cria ambos (instalador + portable)

---

## 📁 Estrutura Após Build

```
release/
├── ChatGPT PKM 2.0 Setup 2.0.0.exe    # Instalador (NSIS)
├── ChatGPT PKM 2.0 2.0.0.exe          # Portable
├── win-unpacked/                       # Arquivos descompactados
│   ├── ChatGPT PKM 2.0.exe
│   ├── resources/
│   └── ...
└── builder-debug.yml                   # Log do build
```

---

## ⚙️ Configuração (package.json)

### **Build Settings**

```json
{
  "build": {
    "appId": "com.chatgpt-pkm.app",
    "productName": "ChatGPT PKM 2.0",
    "win": {
      "target": ["nsis", "portable"],
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true
    },
    "directories": {
      "output": "release"
    },
    "asar": true,
    "compression": "maximum"
  }
}
```

---

## 🎨 Adicionando Ícone Personalizado

### **Criar pasta `build/`**
```bash
mkdir build
```

### **Adicionar ícone**
1. Crie/baixe um ícone `.ico` (256x256px ou maior)
2. Salve como `build/icon.ico`
3. Rebuild: `npm run electron:build:win`

### **Tool para criar .ico**
- [ICO Convert](https://icoconvert.com/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

**Ou use um gerador online:**
```
PNG → upload → download como .ico
```

---

## 📊 Tamanho do Build

### **Estimativa**
- **Instalador NSIS**: ~80-100 MB
- **Portable**: ~120-150 MB
- **Instalado**: ~150-200 MB

### **Componentes**
- Electron runtime: ~50 MB
- Chromium: ~70 MB
- Node.js: ~15 MB
- App code: ~5-10 MB

---

## 🚀 Primeiro Build

### **Checklist**

1. ✅ Instale dependências
   ```bash
   npm install
   ```

2. ✅ Teste em dev
   ```bash
   npm run dev
   ```

3. ✅ Build de produção
   ```bash
   npm run build
   ```

4. ✅ Verifique dist/
   ```bash
   dir dist
   ```

5. ✅ Crie o executável
   ```bash
   npm run electron:build:win
   ```

6. ⏳ Aguarde (~2-5 minutos)

7. ✅ Teste o .exe
   ```bash
   cd release
   "ChatGPT PKM 2.0 Setup 2.0.0.exe"
   ```

---

## 🐛 Troubleshooting

### **Erro: "Cannot find module"**
```bash
npm install
npm run build
npm run electron:build:win
```

### **Erro: "ENOENT: icon.ico"**
Crie a pasta `build/` ou remova `"icon"` do package.json:
```json
"win": {
  "target": ["nsis", "portable"]
  // Remove: "icon": "build/icon.ico"
}
```

### **Build muito lento**
Normal! Primeiro build demora ~5 min. Subsequentes ~2 min.

### **Antivírus bloqueia**
Adicione exceção para:
- `node_modules/`
- `release/`
- Electron.exe

---

## 📦 Distribuição

### **Compartilhar o App**

#### **Opção 1: Portable**
- Envie `ChatGPT PKM 2.0 2.0.0.exe`
- Usuário clica e roda (sem instalação)
- ~120 MB

#### **Opção 2: Instalador**
- Envie `ChatGPT PKM 2.0 Setup 2.0.0.exe`
- Usuário instala normalmente
- Registra no Windows
- ~80 MB

#### **Opção 3: ZIP**
- Compacte `win-unpacked/`
- Usuário descompacta e roda
- Menor download se zipado

---

## 🔐 Code Signing (Opcional)

Para evitar "Publisher: Unknown":

1. Compre certificado de code signing (~$100-400/ano)
2. Configure no package.json:
   ```json
   "win": {
     "certificateFile": "path/to/cert.p12",
     "certificatePassword": "password"
   }
   ```

**Ou** use auto-assinado (apenas para testes):
```bash
# Windows SDK required
signtool sign /f certificate.pfx /p password app.exe
```

---

## ⚡ Otimizações

### **Reduzir Tamanho**

```json
"build": {
  "asar": true,
  "compression": "maximum",
  "files": [
    "dist/**/*",
    "electron/**/*",
    "!node_modules/**/{test,tests}/**",
    "!node_modules/**/*.md"
  ]
}
```

### **Multi-Platform**

```json
"scripts": {
  "build:all": "vite build && electron-builder -mwl",
  "build:mac": "vite build && electron-builder --mac",
  "build:linux": "vite build && electron-builder --linux"
}
```

---

## 🎯 Quick Start

```bash
# 1. Build
npm run electron:build:win

# 2. Teste
cd release
"ChatGPT PKM 2.0 2.0.0.exe"

# 3. Distribua
# Envie o .exe para usuários!
```

---

**Pronto para gerar o .exe! 🚀**

Execute: `npm run electron:build:win` e aguarde ~3-5 minutos.



# 🚀 Como Rodar SEM npm run dev

## ✅ **SOLUÇÃO SIMPLES - 3 Opções**

---

### **Opção 1: Duplo Clique (MAIS FÁCIL)** ⭐

1. Duplo clique em **`RUN-NODE.bat`**
2. Aguarde abrir o navegador automaticamente
3. Pronto! App rodando em `http://localhost:8080`

**Como parar:** Feche o terminal ou `Ctrl+C`

---

### **Opção 2: Python (se tiver instalado)**

1. Duplo clique em **`RUN.bat`**
2. Abra `http://localhost:8080` no navegador
3. Pronto!

---

### **Opção 3: Abrir index.html Direto**

⚠️ **LIMITAÇÃO:** Não funciona com `file://` por causa do CORS

**Solução:** Use uma das opções acima (servidor HTTP local)

---

## 📁 **Estrutura Após Build**

```
chatgpt-pkm/
├── dist/                    ← Arquivos compilados
│   ├── index.html          ← HTML principal
│   ├── assets/
│   │   ├── index-xxx.js    ← JavaScript compilado
│   │   └── index-xxx.css   ← CSS compilado
├── RUN.bat                 ← Servidor Python
├── RUN-NODE.bat            ← Servidor Node ⭐ USE ESTE
└── package.json
```

---

## ⚡ **Uso Diário**

### **Rodar o App:**
```bash
# Duplo clique em:
RUN-NODE.bat
```

### **Atualizar o Build:**
```bash
npm run build
```

### **Desenvolvimento:**
```bash
npm run dev
```

---

## 🎯 **Qual Usar?**

| Método | Facilidade | Requisito | Recomendado |
|--------|------------|-----------|-------------|
| `RUN-NODE.bat` | ⭐⭐⭐⭐⭐ | Node.js | ✅ SIM |
| `RUN.bat` | ⭐⭐⭐⭐ | Python | Se tiver Python |
| `npm run dev` | ⭐⭐⭐ | Node.js | Para desenvolvimento |

---

## 📝 **Notas**

### **Persistência de Dados**
- ✅ Metadata salvo em `localStorage` do navegador
- ✅ Conversas auto-salvam ao carregar
- ✅ Funciona 100% offline

### **Sem Electron**
- ✅ Mais leve (~70KB vs ~150MB)
- ✅ Atualiza instantaneamente (`npm run build`)
- ✅ Funciona em qualquer navegador
- ❌ Não tem janela nativa (roda no Chrome/Edge)
- ❌ FileSystem API limitada (mas funciona!)

---

## 🔧 **Troubleshooting**

### **"http-server não encontrado"**
```bash
npm install -g http-server
```

### **Porta 8080 em uso**
Edite `RUN-NODE.bat` e troque `8080` por `3000`:
```bash
npx -y http-server dist -p 3000 -o
```

### **Quer HTTPS?**
```bash
npx -y http-server dist -p 8080 -S -o
```

---

## 🎊 **PRONTO!**

**Agora é só:**
1. Duplo clique em `RUN-NODE.bat`
2. Usar o app!

**Sem Electron, sem complicação!** 🚀
