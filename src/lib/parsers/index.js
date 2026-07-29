/**
 * Parser Orchestrator
 * Detects file format and routes to the correct platform parser.
 * 
 * Supports:
 * - ChatGPT (.json) — tree-based mapping structure
 * - Claude (.json) — chat_messages array
 * - Gemini (.html) — Google Takeout HTML
 * - Grok (.json) — simple messages array
 */

import * as chatgptParser from './chatgpt.js';
import * as claudeParser from './claude.js';
import * as geminiHtmlParser from './gemini-html.js';
import * as grokParser from './grok.js';
import * as memoryParser from './memory.js';
import * as genericParser from './generic.js';
import JSZip from 'jszip';

/**
 * Parse a file and return normalized conversations with platform detection
 * 
 * @param {File} file - The file to parse
 * @param {function} onProgress - Optional progress callback(percent, message)
 * @returns {Promise<{ platform: string, conversations: Array }>}
 */
export async function parseFile(file, onProgress = null) {
  const fileName = file.name.toLowerCase();
  
  if (onProgress) onProgress(10, `Lendo ${file.name}...`);

  if (fileName.endsWith('.zip')) {
    return parseZipArchive(file, onProgress);
  }
  
  const text = await readFileAsText(file);
  
  // Route by file extension first
  if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
    return parseHTMLContent(text, onProgress);
  }
  
  if (fileName.endsWith('.json')) {
    return parseJSONContent(text, onProgress, fileName);
  }
  
  // Try to detect by content
  if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html')) {
    return parseHTMLContent(text, onProgress);
  }
  
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    return parseJSONContent(text, onProgress, fileName);
  }
  
  throw new Error(`Formato de arquivo não reconhecido: ${file.name}`);
}

/**
 * Parse a ZIP archive (e.g. ChatGPT Export)
 */
async function parseZipArchive(file, onProgress) {
  if (onProgress) onProgress(20, 'Descompactando arquivo ZIP...');
  const zip = new JSZip();
  const zipData = await zip.loadAsync(file);
  
  const result = {
    platform: 'chatgpt_archive',
    conversations: [],
    memories: [],
    fileName: file.name
  };

  const filesToProcess = Object.keys(zipData.files).filter(k => !zipData.files[k].dir);
  
  let i = 0;
  for (const relativePath of filesToProcess) {
    const zipEntry = zipData.files[relativePath];
    const baseName = relativePath.split('/').pop().toLowerCase();
    
    if (onProgress) onProgress(20 + (i / filesToProcess.length) * 60, `Analisando: ${baseName}`);
    
    const content = await zipEntry.async('text');
    let data;
    try {
      data = JSON.parse(content);
    } catch(e) {
      // Skip non-json or malformed
      i++;
      continue; 
    }
    
    // Check if it's the main conversations file
    if (baseName === 'conversations.json' && chatgptParser.detect(data)) {
      result.conversations = chatgptParser.parse(data);
    }
    
    // Check if it's a memory file (memory.json or user.json/user_settings containing memory)
    if (baseName.includes('memory') || baseName.includes('user') || memoryParser.detect(data)) {
      if (memoryParser.detect(data)) {
        const memoryProfile = memoryParser.parse(data);
        result.memories = memoryProfile.facts || [];
      }
    }
    i++;
  }
  
  if (onProgress) onProgress(95, `Encontradas ${result.conversations.length} conversas e ${result.memories.length} memórias.`);
  return result;
}

/**
 * Parse HTML content (Gemini Takeout)
 */
function parseHTMLContent(text, onProgress) {
  if (geminiHtmlParser.detectHTML(text)) {
    if (onProgress) onProgress(20, 'Detectado: Google Gemini (Takeout HTML)');
    
    const progressWrapper = onProgress 
      ? (pct) => onProgress(20 + pct * 0.7, 'Parseando conversas do Gemini...')
      : null;
    
    const conversations = geminiHtmlParser.parseHTML(text, progressWrapper);
    
    if (onProgress) onProgress(95, `${conversations.length} conversas do Gemini encontradas`);
    
    return { platform: 'gemini', conversations };
  }
  
  throw new Error('Formato HTML não reconhecido. Esperado: Google Takeout (Gemini Apps)');
}

/**
 * Parse JSON content with auto-detection
 */
function parseJSONContent(text, onProgress, fileName = '') {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error('JSON inválido: ' + e.message);
  }
  
  if (onProgress) onProgress(30, 'Detectando plataforma...');
  
  // Detection order matters — most specific first
  
  // 1. Claude: has chat_messages with sender field
  if (claudeParser.detect(data)) {
    if (onProgress) onProgress(40, 'Detectado: Claude (Anthropic)');
    const conversations = claudeParser.parse(data);
    if (onProgress) onProgress(95, `${conversations.length} conversas do Claude encontradas`);
    return { platform: 'claude', conversations };
  }
  
  // 2. ChatGPT: has mapping tree structure
  if (chatgptParser.detect(data)) {
    if (onProgress) onProgress(40, 'Detectado: ChatGPT (OpenAI)');
    const conversations = chatgptParser.parse(data);
    if (onProgress) onProgress(95, `${conversations.length} conversas do ChatGPT encontradas`);
    return { platform: 'chatgpt', conversations };
  }
  
  // 3. Grok: has messages array with content field (must check AFTER ChatGPT)
  if (grokParser.detect(data)) {
    if (onProgress) onProgress(40, 'Detectado: Grok (xAI)');
    const conversations = grokParser.parse(data);
    if (onProgress) onProgress(95, `${conversations.length} conversas do Grok encontradas`);
    return { platform: 'grok', conversations };
  }
  
  // 4. Fallback: Generic Extension parser (tries to find arrays of messages)
  if (genericParser.detect(data)) {
    if (onProgress) onProgress(40, 'Detectado: Exportação de Extensão (Genérico)');
    const conversations = genericParser.parse(data);
    if (onProgress) onProgress(95, `${conversations.length} conversas de extensão encontradas`);
    return { platform: 'unknown_extension', conversations };
  }
  
  // Ignorar arquivos conhecidos que não são conversas e avisar no console em vez de falhar
  const lowerName = fileName.toLowerCase();
  const ignoredFiles = [
    'user.json', 'message_feedback.json', 'model_comparisons.json',
    'shared_conversations.json', 'shopping.json', 'voice_interactions.json', 'status.json'
  ];
  if (ignoredFiles.some(f => lowerName.endsWith(f))) {
    return { platform: 'ignored', conversations: [] };
  }
  
  throw new Error(
    'Formato JSON não reconhecido. Formatos suportados:\n' +
    '• ChatGPT (conversations.json do OpenAI)\n' +
    '• Claude (conversations.json do Anthropic)\n' +
    '• Grok (export do xAI)\n' +
    '• Gemini (arquivo HTML do Google Takeout)\n' +
    '• Extensões de terceiros (com array de mensagens)'
  );
}

/**
 * Parse multiple files at once
 * @param {FileList|Array<File>} files 
 * @param {function} onProgress
 * @returns {Promise<Array<{ platform, conversations }>>}
 */
export async function parseFiles(files, onProgress = null) {
  const results = [];
  const totalFiles = files.length;
  
  for (let i = 0; i < totalFiles; i++) {
    const file = files[i];
    const fileProgress = (pct, msg) => {
      if (onProgress) {
        const overall = ((i + pct / 100) / totalFiles) * 100;
        onProgress(overall, `[${i + 1}/${totalFiles}] ${msg}`);
      }
    };
    
    try {
      const result = await parseFile(file, fileProgress);
      results.push(result);
    } catch (err) {
      console.error(`Error parsing ${file.name}:`, err);
      results.push({ 
        platform: 'unknown', 
        conversations: [], 
        error: err.message,
        fileName: file.name,
      });
    }
  }
  
  return results;
}

/**
 * Read a File as text
 */
function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(new Error('Erro ao ler arquivo: ' + e.target.error));
    reader.readAsText(file, 'utf-8');
  });
}
