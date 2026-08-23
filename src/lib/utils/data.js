// Known model aliases (for special formatting)
const MODEL_ALIASES = {
    'research': 'Deep Research',
};

/**
 * Dynamically formats model slugs to readable names.
 * Instead of hardcoding, this auto-detects patterns like:
 * - "gpt-5" → "GPT-5"
 * - "gpt-5.2" → "GPT-5.2"
 * - "o4-mini" → "o4 Mini"
 * - "research" → "Deep Research"
 * - Any new model → Formatted automatically
 */
function getModelName(slug) {
    if (!slug) return 'Unknown';

    // Handle "auto" mode specifically
    if (slug === 'auto') return 'Auto (Dynamic Mode)';

    // Check known aliases first
    if (MODEL_ALIASES[slug]) return MODEL_ALIASES[slug];

    // Auto-format pattern: gpt-X.X → GPT-X.X (preserve dots!)
    if (slug.startsWith('gpt-')) {
        // Get version part after "gpt-", keeping dots for versions like 5.2 or 5.3
        const version = slug.slice(4);
        return 'GPT-' + version;
    }

    // Auto-format pattern: oX-mini → oX Mini
    if (slug.match(/^o\d+/)) {
        return slug.replace(/-/g, ' ').replace(/mini/gi, 'Mini');
    }

    // Fallback: capitalize and humanize
    return slug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Export for use in components
export { getModelName };

/**
 * Parses image generation structured output from DALL-E.
 * Detects JSON like: {"prompt": "...", "size": "1024x1024"}
 * @returns {Object|null} { prompt, size } or null if not an image gen prompt
 */
export function parseImageGenPrompt(text) {
    if (!text) return null;
    const trimmed = text.trim();

    // Check if it looks like a JSON image prompt
    if (!trimmed.startsWith('{') || !trimmed.includes('"prompt"')) return null;

    try {
        const parsed = JSON.parse(trimmed);
        if (parsed.prompt && typeof parsed.prompt === 'string') {
            return {
                prompt: parsed.prompt,
                size: parsed.size || '1024x1024'
            };
        }
    } catch (e) {
        // Not valid JSON
    }
    return null;
}

export function normalizeConversation(conv) {
    const title = conv.title || '(Sem título)';
    const createTime = conv.create_time || null;
    const updateTime = conv.update_time || null;
    const mapping = conv.mapping || {};
    const safeUrls = conv.safe_urls || []; // Deep Research URLs
    const messages = extractMessagesFromMapping(mapping, createTime, safeUrls);
    const searchText = (title + ' ' + messages.map(m => m.textPlain).join(' ')).toLowerCase();

    // Ensure we have a stable ID. 
    const id = getConvKey({ raw: conv, title, createTime });

    // Extract model/conversation metadata
    const modelInfo = {
        modelSlug: conv.default_model_slug || 'unknown',
        isDeepResearch: conv.default_model_slug === 'research',
        isStudyMode: conv.is_study_mode || false,
        memoryScope: conv.memory_scope || null,
    };
    modelInfo.modelName = getModelName(modelInfo.modelSlug);

    // ════════════════════════════════════════════════════════════════════════
    let rawHasCanvas = false;
    let rawHasCode = false;
    let rawHasWebSearch = false;
    let rawHasImageGen = false;

    // Model Detection tracking
    const foundModels = new Set();
    let computedModelSlug = conv.default_model_slug;
    let lastMessageModel = null;
    let isReasoningParams = false;

    // Reasoning tracking
    let totalReasoningTime = 0; // in seconds

    for (const key in mapping) {
        const node = mapping[key];
        if (!node?.message) continue;
        const msg = node.message;
        const meta = msg.metadata || {};
        const authorName = msg.author?.name || '';
        const role = msg.author?.role;
        const recipient = msg.recipient || '';

        // Model Info Extraction (Prioritize message-level model slug)
        if (msg.metadata?.model_slug && role === 'assistant') {
            foundModels.add(msg.metadata.model_slug);
            lastMessageModel = msg.metadata.model_slug;

            // Check for explicit reasoning flag or "thinking" suffix
            if (msg.metadata?.reasoning_status ||
                msg.metadata?.model_slug?.includes('thinking') ||
                msg.metadata?.model_slug?.startsWith('o')) {
                isReasoningParams = true;
            }
        }

        // Reasoning Duration Tracking
        if (meta.reasoning_status === 'reasoning_ended' && meta.finished_duration_sec) {
            totalReasoningTime += meta.finished_duration_sec;
        }

        // Canvas detection (multiple signals)
        if (meta.canvas || authorName.startsWith('canmore') || recipient.startsWith('canmore')) {
            rawHasCanvas = true;
        }

        // Code Interpreter detection
        if (authorName === 'python' || authorName === 'code_interpreter' ||
            meta.content_type === 'execution_output' || msg.content?.content_type === 'execution_output') {
            rawHasCode = true;
        }

        // Web Search detection
        if (authorName === 'web.run' || authorName.startsWith('web.') ||
            meta.search_result_groups || meta.real_author === 'tool:web') {
            rawHasWebSearch = true;
        }

        // DALL-E / Image Gen detection
        if (meta.dalle || authorName.startsWith('t2uay3k') || authorName === 'dalle.text2im') {
            rawHasImageGen = true;
        }
    }

    // Logic: If default is "auto" or missing/unknown, use the last detected model from messages if available
    if ((!computedModelSlug || computedModelSlug === 'auto' || computedModelSlug === 'unknown') && lastMessageModel) {
        computedModelSlug = lastMessageModel;
    }

    // Update modelInfo with the final computed values
    modelInfo.modelSlug = computedModelSlug;
    modelInfo.modelName = getModelName(computedModelSlug);

    // Identify Reasoning based on generic "starts with o" rule (o1, o3, etc), thinking suffix, or specific flag
    const slug = computedModelSlug || '';
    const isReasoningModel = isReasoningParams ||
        slug.startsWith('o') ||
        slug.includes('reasoning') ||
        slug.includes('thinking') ||
        totalReasoningTime > 0;

    // Aggregate filter metadata at conversation level
    const filterMeta = {
        hasImageGen: rawHasImageGen || messages.some(m => m.imageGen !== null && m.imageGen !== undefined),
        hasWebSearch: rawHasWebSearch || messages.some(m => m.tools?.some(t => t.type === 'web_search' || t.type === 'web_results' || t.type === 'browser')),
        hasCanvas: rawHasCanvas || messages.some(m => m.canvasContent || m.tools?.some(t => t.type === 'canvas')),
        hasCode: rawHasCode || messages.some(m => m.tools?.some(t => t.type === 'code' || t.type === 'code_output') || m.toolCalls?.some(tc => tc.name === 'python' || tc.name === 'code_interpreter')),
        hasSources: messages.some(m => m.sources?.length > 0),
        modelSlug: computedModelSlug,
        modelName: getModelName(computedModelSlug),
        isDeepResearch: modelInfo.isDeepResearch,
        isReasoning: isReasoningModel,
        reasoningTime: totalReasoningTime, // Total time in seconds
        createDate: createTime ? new Date(createTime * 1000) : null
    };

    // DEBUG: Log filterMeta for conversations with Canvas/Code
    if (filterMeta.hasCanvas || filterMeta.hasCode) {
        console.log(`[FilterMeta] ${title}: Canvas=${filterMeta.hasCanvas}, Code=${filterMeta.hasCode}`);
    }

    return {
        id,
        raw: conv,
        title,
        createTime,
        updateTime,
        messages,
        searchText,
        modelInfo,
        filterMeta
    };
}

export function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000); // timestamp is usually seconds in ChatGPT export
    // If year is current year, show "DD/MM", else "DD/MM/YYYY"
    const now = new Date();
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

export function getConvKey(conv) {
    const raw = conv.raw || {};
    const externalId = raw.id || null;
    const title = conv.title || '';
    const ctime = conv.createTime || 0;
    if (externalId) return externalId;
    return `${title}@@${ctime}`;
}

/**
 * Silently deduplicates conversations.
 * Returns only new conversations that don't exist in the current set.
 * 
 * @param {Array} existingConversations - Currently loaded conversations
 * @param {Array} newConversations - Newly imported conversations
 * @returns {Object} { unique: [...], stats: { total, new, duplicates, updated } }
 */
export function deduplicateConversations(existingConversations, newConversations) {
    // Build a map of existing conversations by ID
    const existingMap = new Map();
    for (const conv of existingConversations) {
        const key = getConvKey(conv);
        existingMap.set(key, conv);
    }

    const unique = [];
    const updated = [];
    let duplicates = 0;

    for (const newConv of newConversations) {
        const key = getConvKey(newConv);

        if (existingMap.has(key)) {
            const existing = existingMap.get(key);

            // Check if the new version has more recent updates
            const existingUpdate = existing.updateTime || existing.createTime || 0;
            const newUpdate = newConv.updateTime || newConv.createTime || 0;

            if (newUpdate >= existingUpdate) {
                // Newer version found - update
                unique.push(newConv);
                updated.push({ title: newConv.title, key });
            } else {
                // Exact duplicate - skip
                duplicates++;
            }
        } else {
            // Completely new conversation
            unique.push(newConv);
        }
    }

    return {
        unique,
        stats: {
            total: newConversations.length,
            new: unique.length - updated.length,
            duplicates,
            updated: updated.length
        }
    };
}

function extractMessagesFromMapping(mapping, fallbackTime, safeUrls = []) {
    const msgs = [];
    for (const key in mapping) {
        const node = mapping[key];
        if (!node || !node.message) continue;

        const msg = node.message;
        const author = msg.author || {};
        const role = author.role || 'unknown';

        if (role === 'tool') continue;
        if (msg.metadata && msg.metadata.is_visually_hidden_from_conversation) continue;

        const contentObj = msg.content || {};
        const ctype = contentObj.content_type;

        if (ctype && String(ctype).startsWith('tether_')) continue;

        let text = '';

        if (ctype === 'text' && Array.isArray(contentObj.parts)) {
            const citations = msg.metadata ? (msg.metadata.citations || []) : [];
            const contentRefs = msg.metadata?.content_references || [];
            text = cleanChatGPTArtifacts(contentObj.parts.join('\n\n'), citations, safeUrls, contentRefs);
        } else if (ctype === 'user_editable_context') {
            continue;
        } else {
            continue;
        }

        const ts = msg.create_time != null ? msg.create_time : (fallbackTime || 0);

        // Detect Tools Used (Offline/No-API)
        const tools = detectTools(msg);

        // ═══════════════════════════════════════════════════════════════
        // NEW: Detect tool_calls explicitly for assistant messages
        // ═══════════════════════════════════════════════════════════════
        const rawToolCalls = msg.tool_calls || [];
        const hasToolCall = rawToolCalls.length > 0;
        const contentIsNull = !text.trim() && hasToolCall;

        // Parse tool calls into structured format
        const toolCalls = rawToolCalls.map(tc => ({
            id: tc.id || 'unknown',
            type: tc.type || 'function',
            name: tc.function?.name || tc.tool?.name || 'desconhecida',
            arguments: tc.function?.arguments || tc.tool?.arguments || '{}'
        }));

        if (hasToolCall) {
            tools.push({
                type: 'tool_call',
                label: `${toolCalls.length} chamada(s) de ferramenta`,
                icon: 'function',
                details: toolCalls
            });
            if (contentIsNull) {
                text = '(Resposta gerada via ferramenta - sem texto direto do assistente)';
            }
        }

        // Skip empty text messages (but allow tool call placeholders)
        if (!text.trim() && !hasToolCall) continue;

        // Extract per-message sources from content_references
        const contentRefs = msg.metadata?.content_references || [];
        const sources = extractSourcesFromRefs(contentRefs);

        // Extract per-message model info
        const msgModelSlug = msg.metadata?.model_slug || null;
        const modelName = msgModelSlug ? (getModelName(msgModelSlug) || msgModelSlug) : null;

        // Detect DALL-E image generation prompts (structured output)
        const imageGenPrompt = parseImageGenPrompt(text);

        // ═══════════════════════════════════════════════════════════════
        // NEW: Detect Canvas/TextDoc content (canmore.create_textdoc)
        // ═══════════════════════════════════════════════════════════════
        let canvasContent = null;
        const recipient = msg.recipient || '';
        if (recipient.startsWith('canmore.') && role === 'assistant') {
            try {
                // Canvas content is sent as JSON in the message
                const parsed = JSON.parse(text);
                if (parsed.content && parsed.name) {
                    canvasContent = {
                        name: parsed.name,
                        type: parsed.type || 'document',
                        content: parsed.content,
                        textdocId: null // Will be filled by subsequent tool response
                    };
                    // Override text display for canvas messages
                    text = `📄 Canvas: ${parsed.name}`;
                }
            } catch (e) {
                // Not valid JSON, keep as regular message
            }
        }

        // Extract image URLs from content_references (for DALL-E/multimodal)
        let imageUrls = [];
        if (contentRefs.some(ref => ref.type === 'image_group')) {
            imageUrls = contentRefs
                .filter(ref => ref.type === 'image_group' && ref.images)
                .flatMap(ref => ref.images
                    .filter(img => img.image_result?.content_url)
                    .map(img => img.image_result.content_url)
                );
        }

        msgs.push({
            id: msg.id || key,
            role,
            textMarkdown: imageGenPrompt ? null : text,
            textPlain: imageGenPrompt ? imageGenPrompt.prompt : text,
            timestamp: ts,
            tools,
            sources,
            modelSlug: msgModelSlug,
            modelName: modelName,
            imageGen: imageGenPrompt,
            toolCalls,       // Array of parsed tool calls
            hasToolCall,     // Boolean flag
            contentIsNull,   // Flag for null content with tool calls
            imageUrls,       // Array of image URLs
            canvasContent,   // Canvas/TextDoc content object
            attachments: msg.metadata?.attachments || [], // File attachments
            // Normalized for Generative UI component registry
            toolInvocations: toolCalls.map(tc => ({
                toolName: tc.name,
                args: (() => {
                    try {
                        return typeof tc.arguments === 'string'
                            ? JSON.parse(tc.arguments)
                            : tc.arguments;
                    } catch {
                        return {};
                    }
                })(),
                state: 'result',
            })),
        });
    }

    msgs.sort((a, b) => a.timestamp - b.timestamp);
    return msgs;
}

/**
 * Detects which internal tools were used in this message based on metadata/author.
 * Recognizes ChatGPT's internal tool signatures from export JSON.
 */
function detectTools(msg) {
    const tools = [];
    const meta = msg.metadata || {};
    const author = msg.author || {};
    const authorName = author.name || '';
    const authorRole = author.role || '';

    // ═══════════════════════════════════════════════════════════════
    // 1. WEB SEARCH / BROWSING (web.run, browser, sonicberry)
    // ═══════════════════════════════════════════════════════════════
    if (authorRole === 'tool' && (authorName === 'web.run' || authorName.startsWith('web.'))) {
        tools.push({ type: 'web_search', label: 'Web Search', icon: 'globe' });
    }
    if (authorName === 'browser' || authorName === 'tether_browsing_display' || meta.real_author === 'tool:web') {
        tools.push({ type: 'browser', label: 'Browsing', icon: 'globe' });
    }
    // Check for search results in metadata
    if (meta.search_result_groups && meta.search_result_groups.length > 0) {
        const totalResults = meta.search_result_groups.reduce((sum, g) => sum + (g.entries?.length || 0), 0);
        tools.push({
            type: 'web_results',
            label: `${totalResults} Web Results`,
            icon: 'globe',
            resultCount: totalResults
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. DEEP RESEARCH (async research tasks)
    // ═══════════════════════════════════════════════════════════════
    if (meta.async_task_type === 'research') {
        tools.push({
            type: 'deep_research',
            label: 'Deep Research',
            icon: 'search',
            taskId: meta.async_task_id
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. CANVAS / TEXTDOCS (canmore)
    // ═══════════════════════════════════════════════════════════════
    if (authorName.startsWith('canmore') || meta.canvas) {
        const canvasTitle = meta.canvas?.title || 'Document';
        tools.push({
            type: 'canvas',
            label: `Canvas: ${canvasTitle.slice(0, 20)}...`,
            icon: 'file-text',
            textdocId: meta.canvas?.textdoc_id
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. IMAGE GENERATION (DALL-E / t2uay3k / ChatGPT Image)
    // ═══════════════════════════════════════════════════════════════
    if (meta.dalle || authorName.startsWith('t2uay3k') || authorName === 'dalle.text2im') {
        tools.push({ type: 'image_gen', label: 'Image Generation', icon: 'image' });
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. CODE INTERPRETER / PYTHON
    // ═══════════════════════════════════════════════════════════════
    if (authorName === 'python' || authorName === 'code_interpreter') {
        tools.push({ type: 'code', label: 'Code Interpreter', icon: 'code' });
    }
    const ctype = msg.content?.content_type || '';
    if (ctype === 'execution_output') {
        tools.push({ type: 'code_output', label: 'Python Output', icon: 'terminal' });
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. CITATIONS / SOURCES (content_references)
    // ═══════════════════════════════════════════════════════════════
    const contentRefs = meta.content_references || [];
    if (contentRefs.length > 0) {
        const uniqueUrls = new Set(contentRefs.map(r => r.url).filter(Boolean));
        if (uniqueUrls.size > 0) {
            tools.push({
                type: 'citation',
                label: `${uniqueUrls.size} Sources`,
                icon: 'book',
                sourceCount: uniqueUrls.size
            });
        }
    }

    // ═══════════════════════════════════════════════════════════════
    // 7. FILE UPLOADS / ATTACHMENTS
    // ═══════════════════════════════════════════════════════════════
    if (meta.attachments && meta.attachments.length > 0) {
        tools.push({
            type: 'attachment',
            label: `${meta.attachments.length} File(s)`,
            icon: 'paperclip'
        });
    }

    return tools;
}

/**
 * Extracts unique sources from content_references metadata.
 * Returns array of { url, title, snippet, domain }
 */
function extractSourcesFromRefs(refs) {
    if (!refs || !Array.isArray(refs)) return [];

    const seen = new Set();
    const sources = [];

    for (const ref of refs) {
        if (!ref.url || seen.has(ref.url)) continue;
        seen.add(ref.url);

        let domain = '';
        try {
            domain = new URL(ref.url).hostname.replace('www.', '');
        } catch { domain = ref.attribution || ''; }

        sources.push({
            url: ref.url,
            title: ref.title || domain,
            snippet: ref.snippet || '',
            domain: domain,
            attribution: ref.attribution || domain
        });
    }

    return sources;
}

/**
 * Cleans ChatGPT internal artifacts/tools syntax and resolves citations.
 * 
 * HYBRID APPROACH:
 * 1. Priority: Use content_references metadata (official OpenAI data)
 * 2. Fallback: Regex patterns for older exports without content_references
 * 
 * Handles:
 * - citeturn0view0 → Clickable citation link
 * - entity["software","ChatGPT",0] → Just "ChatGPT"
 * - entity_metadata[...] → Hidden (removed)
 * - image_group{...} → Image URLs
 * - 【17†source】 → Resolved citation
 */
function cleanChatGPTArtifacts(text, citations = [], safeUrls = [], contentReferences = []) {
    if (!text) return text;

    // ═══════════════════════════════════════════════════════════════════
    // PRIORITY 1: Use content_references (Official OpenAI metadata)
    // ═══════════════════════════════════════════════════════════════════
    if (contentReferences && contentReferences.length > 0) {
        text = applyContentReferences(text, contentReferences);
        // Also apply regex cleanup as safety for any missed tokens
        text = cleanWithRegexFallback(text);
    } else {
        // ═══════════════════════════════════════════════════════════════════
        // FALLBACK: Regex cleanup for older exports
        // ═══════════════════════════════════════════════════════════════════
        text = cleanWithRegexFallback(text);
    }

    // ═══════════════════════════════════════════════════════════════════
    // Common cleanup (applies to all exports)
    // ═══════════════════════════════════════════════════════════════════

    // 1. Remove :::contextList ... ::: blocks (keep content inside)
    text = text.replace(/:::contextList\s*/gi, '');
    text = text.replace(/:::\s*/g, '');

    // 2. Remove 【{\"image_fetch\": \"...\"}】 commands
    text = text.replace(/【\s*\{[^】]*"image_fetch"[^】]*\}\s*】/g, '');

    // 3. Remove video markers: video...turn#search# (e.g., videoComo...turn0search6)
    text = text.replace(/video[^\s]*turn\d+search\d+/gi, '');

    // 4. Resolve Bracket Citations: 【17†source】 using safe_urls
    text = text.replace(/【(\d+)(?:†[^】]*)?】/g, (match, indexStr) => {
        const index = parseInt(indexStr, 10);

        // Try safe_urls first (Deep Research)
        if (safeUrls && safeUrls[index]) {
            const url = safeUrls[index];
            try {
                const domain = new URL(url).hostname.replace('www.', '');
                return ` [${domain}](${url})`;
            } catch {
                return ` [Source ${index}](${url})`;
            }
        }

        // Fallback to citations array
        if (citations && citations[index]) {
            const cit = citations[index];
            const url = cit.metadata ? (cit.metadata.url || cit.metadata.source_url) : null;
            if (url) {
                try {
                    const domain = new URL(url).hostname.replace('www.', '');
                    return ` [${domain}](${url})`;
                } catch {
                    return ` [Source](${url})`;
                }
            }
        }

        // Clean removal if no URL found
        return '';
    });

    // 5. Clean up excessive whitespace from removals
    text = text.replace(/\n{3,}/g, '\n\n');
    text = text.replace(/  +/g, ' ');

    return text.trim();
}

/**
 * Applies content_references substitutions from OpenAI metadata.
 * This is the OFFICIAL way to resolve ChatGPT tokens.
 * 
 * Each reference contains:
 * - matched_text: The exact token in the text (e.g., "citeturn0view0")
 * - alt: What to replace it with (e.g., "([OpenAI](url))")
 * - type: The reference type (grouped_webpages, alt_text, hidden, image_group)
 */
function applyContentReferences(text, refs) {
    if (!refs || !Array.isArray(refs) || refs.length === 0) return text;

    // Sort by start_idx descending to replace from end to start
    // This prevents index shifting issues
    const sortedRefs = [...refs].sort((a, b) => (b.start_idx || 0) - (a.start_idx || 0));

    for (const ref of sortedRefs) {
        const matchedText = ref.matched_text;
        if (!matchedText) continue;

        let replacement = '';

        switch (ref.type) {
            case 'hidden':
                // Remove completely (entity_metadata, etc.)
                replacement = '';
                break;

            case 'alt_text':
                // Entity references: just use the alt text
                replacement = ref.alt || '';
                break;

            case 'grouped_webpages':
                // Citation references: use alt or build from items
                if (ref.alt) {
                    replacement = ref.alt;
                } else if (ref.items && ref.items.length > 0) {
                    const item = ref.items[0];
                    replacement = item.url ? ` ([${item.attribution || 'Source'}](${item.url}))` : '';
                }
                break;

            case 'image_group':
                // Image groups: render as HTML gallery container
                if (ref.images && ref.images.length > 0) {
                    const validImages = ref.images.filter(img => img.image_result?.content_url);

                    if (validImages.length > 0) {
                        const galleryClass = validImages.length === 1 ? 'image-gallery single-image' : 'image-gallery';
                        const imageMarkdown = validImages
                            .map(img => {
                                const url = img.image_result.content_url;
                                const title = img.image_result.title || 'Image';
                                return `![${title}](${url})`;
                            })
                            .join('\n\n');

                        // Wrap in gallery div for styling (will be rendered as HTML)
                        replacement = `\n\n${imageMarkdown}\n\n`;
                    } else {
                        replacement = ref.alt || '';
                    }
                } else if (ref.alt) {
                    replacement = ref.alt;
                }
                break;

            case 'sources_footnote':
                // Footer sources: remove or keep minimal
                replacement = '';
                break;

            default:
                // Unknown type: use alt if available, or remove
                replacement = ref.alt || '';
        }

        // Replace the matched text
        // Use start_idx and end_idx for precision if available
        if (typeof ref.start_idx === 'number' && typeof ref.end_idx === 'number') {
            const before = text.substring(0, ref.start_idx);
            const after = text.substring(ref.end_idx);
            text = before + replacement + after;
        } else {
            // Fallback: simple string replace (first occurrence only)
            text = text.replace(matchedText, replacement);
        }
    }

    return text;
}

/**
 * Regex fallback for older ChatGPT exports without content_references.
 * Less accurate but works for basic cleanup.
 */
function cleanWithRegexFallback(text) {
    // 1. Remove citeturn markers: citeturn0view0, citeturn1search3, etc.
    text = text.replace(/\s*(?:cite)?turn\d+(?:view|search)\d+\s*/gi, ' ');

    // 2. Replace entity["type","name",n] → extracted name
    //    Handles escaped quotes inside: entity[\"software\",\"ChatGPT\",0]
    text = text.replace(/entity\[([^\]]+)\]/g, (match, content) => {
        try {
            // Handle both escaped and unescaped quotes
            const cleanContent = content.replace(/\\"/g, '"');
            const parsed = JSON.parse('[' + cleanContent + ']');
            if (Array.isArray(parsed) && parsed.length >= 2) {
                return parsed[1]; // Return the name (second element)
            }
            return '';
        } catch (e) {
            // Fallback: try to extract name manually
            const nameMatch = content.match(/["\"]([^"\"]+)["\"]/g);
            if (nameMatch && nameMatch.length >= 2) {
                return nameMatch[1].replace(/["\\"]/g, '');
            }
            return '';
        }
    });

    // 3. Remove entity_metadata[...] completely (can have nested content)
    text = text.replace(/entity_metadata\[[^\]]*\]/g, '');

    // 4. Remove image_group{...} with nested JSON
    //    This regex matches from image_group{ until the matching closing }
    text = text.replace(/image_group\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '');

    // 4b. Fallback for complex nested JSON - greedy match to end of line
    text = text.replace(/image_group\{.*?\}(?:\s*\})?/g, '');

    // 5. Remove residual turn markers
    text = text.replace(/\s*(?:cite)?turn\d+search\d+\s*/gi, ' ');

    // 6. Remove any remaining malformed entity patterns
    text = text.replace(/entity\[[^\]]*\]/g, '');

    // 7. Remove any remaining image_group with simple pattern
    text = text.replace(/image_group\s*\{[^}]+/g, '');

    return text;
}
