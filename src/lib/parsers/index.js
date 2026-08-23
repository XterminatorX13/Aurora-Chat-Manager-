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
import * as geminiJsonParser from './gemini-exporter.js';
import * as grokParser from './grok.js';
import * as memoryParser from './memory.js';
import * as genericParser from './generic.js';
import JSZip from 'jszip';
import WorkerUrl from './worker.js?worker';

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
  
  // Directly route JSON files to avoid allocating a massive string in the main thread!
  if (fileName.endsWith('.json')) {
    return parseJSONContent(file, onProgress, fileName);
  }
  
  const text = await readFileAsText(file);
  
  // Route by file extension first
  if (fileName.endsWith('.html') || fileName.endsWith('.htm')) {
    return parseHTMLContent(text, onProgress, fileName);
  }
  
  // Try to detect by content
  if (text.trim().startsWith('<') || text.includes('<!DOCTYPE') || text.includes('<html')) {
    return parseHTMLContent(text, onProgress, fileName);
  }
  
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    // Note: fallback detected JSON, but parseJSONContent expects a File object now
    // If it reached here, it didn't end in .json. We still need to pass the file object!
    return parseJSONContent(file, onProgress, fileName);
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
    platform: 'archive',
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
    
    if (!baseName.endsWith('.json') && !baseName.endsWith('.html') && !baseName.endsWith('.htm')) {
      i++;
      continue;
    }

    const content = await zipEntry.async('text');
    
    if (baseName.endsWith('.html') || baseName.endsWith('.htm')) {
      if (geminiHtmlParser.detectHTML(content)) {
        const conversations = geminiHtmlParser.parseHTML(content);
        result.conversations.push(...conversations);
        if (result.platform === 'archive') result.platform = 'gemini';
        else if (result.platform !== 'gemini') result.platform = 'mixed_archive';
      }
    } else if (baseName.endsWith('.json')) {
      let data;
      try {
        data = JSON.parse(content);
      } catch(e) {
        i++;
        continue; 
      }
      
      // Check if it's a ChatGPT conversations file
      if (chatgptParser.detect(data)) {
        const conversations = chatgptParser.parse(data);
        result.conversations.push(...conversations);
        if (result.platform === 'archive') result.platform = 'chatgpt_archive';
        else if (result.platform !== 'chatgpt_archive') result.platform = 'mixed_archive';
      }
      // Check for Claude
      else if (claudeParser.detect(data)) {
        const conversations = claudeParser.parse(data);
        result.conversations.push(...conversations);
        if (result.platform === 'archive') result.platform = 'claude';
        else if (result.platform !== 'claude') result.platform = 'mixed_archive';
      }
      // Check for Grok
      else if (grokParser.detect(data)) {
        const conversations = grokParser.parse(data);
        result.conversations.push(...conversations);
        if (result.platform === 'archive') result.platform = 'grok';
        else if (result.platform !== 'grok') result.platform = 'mixed_archive';
      }
      // Check for Gemini JSON
      else if (geminiJsonParser.detect(data)) {
        const conversations = geminiJsonParser.parse(data);
        result.conversations.push(...conversations);
        if (result.platform === 'archive') result.platform = 'gemini';
        else if (result.platform !== 'gemini') result.platform = 'mixed_archive';
      }
      
      // Check if it's a memory file (memory.json or user.json/user_settings containing memory)
      if (baseName.includes('memory') || baseName.includes('user') || memoryParser.detect(data)) {
        if (memoryParser.detect(data)) {
          const memoryProfile = memoryParser.parse(data);
          if (memoryProfile.facts) {
            result.memories.push(...memoryProfile.facts);
          }
        }
      }
    }
    i++;
  }
  
  if (result.platform === 'archive' && result.conversations.length === 0) {
    result.platform = 'chatgpt_archive'; // Default fallback
  }
  
  if (onProgress) onProgress(95, `Encontradas ${result.conversations.length} conversas e ${result.memories.length} memórias.`);
  return result;
}

/**
 * Parse HTML content (Gemini Takeout)
 */
function parseHTMLContent(text, onProgress, fileName = '') {
  if (geminiHtmlParser.detectHTML(text)) {
    if (onProgress) onProgress(20, 'Detectado: Google Gemini (Takeout HTML)');
    
    const progressWrapper = onProgress 
      ? (pct) => onProgress(20 + pct * 0.7, 'Parseando conversas do Gemini...')
      : null;
    
    const conversations = geminiHtmlParser.parseHTML(text, progressWrapper);
    
    if (onProgress) onProgress(95, `${conversations.length} conversas do Gemini encontradas`);
    
    return { platform: 'gemini', conversations };
  }
  
  // Ignorar arquivos conhecidos de metadados do Google Takeout
  const lowerName = fileName.toLowerCase();
  const ignoredFiles = ['archive_browser.html'];
  if (ignoredFiles.some(f => lowerName.endsWith(f))) {
    return { platform: 'ignored', conversations: [] };
  }
  
  throw new Error('Formato HTML não reconhecido. Esperado: Google Takeout (Gemini Apps)');
}

/**
 * Parse JSON content with auto-detection
 */
async function parseJSONContent(file, onProgress, fileName = '') {
  if (onProgress) onProgress(10, 'Iniciando parse em background...');
  
  // We use the worker to avoid main-thread freezes on huge JSONs
  const worker = new AsyncParserWorker();
  try {
      const conversations = [];
      await worker.parseJSON(text, 'chatgpt', (data) => {
          if (data.chunk) {
              conversations.push(...data.chunk);
          }
          if (onProgress && data.total > 0) {
              const pct = (data.processed / data.total) * 100;
              onProgress(Math.max(10, pct), `Processando: ${data.processed} de ${data.total}`);
          }
      });
      return { platform: 'chatgpt', conversations };
  } catch (e) {
      throw new Error('Falha no parse em background: ' + e.message);
  } finally {
      worker.terminate();
  }
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

/**
 * Async Web Worker Wrapper for high performance off-thread parsing
 */
export class AsyncParserWorker {
    constructor() {
        this.worker = new WorkerUrl();
        this.jobIdCounter = 0;
        this.pendingJobs = new Map();

        this.worker.addEventListener('message', (e) => {
            const { jobId, status, data, error } = e.data;
            const job = this.pendingJobs.get(jobId);

            if (!job) return;

            if (status === 'progress') {
                if (job.onProgress) job.onProgress(data);
            } else if (status === 'success') {
                job.resolve(data);
                this.pendingJobs.delete(jobId);
            } else if (status === 'error') {
                job.reject(new Error(error));
                this.pendingJobs.delete(jobId);
            }
        });
    }

    async parseJSON(file, source, onProgress) {
        return new Promise((resolve, reject) => {
            const jobId = ++this.jobIdCounter;
            this.pendingJobs.set(jobId, { resolve, reject, onProgress });

            this.worker.postMessage({
                action: 'PARSE_JSON',
                payload: { file, source },
                jobId
            });
        });
    }

    terminate() {
        this.worker.terminate();
    }
}
