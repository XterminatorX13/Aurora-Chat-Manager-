/**
 * Gemini Exporter Parser (.json files)
 * Parses the full raw JSON exports from the updated gemini-exporter script.
 */

const PLATFORM = 'gemini';

export function detect(data) {
  if (!data) return false;
  if (Array.isArray(data)) {
    if (data.length === 0) return false;
    const first = data[0];
    return first.cid !== undefined && Array.isArray(first.turns) && first.title !== undefined;
  }
  return data.cid !== undefined && Array.isArray(data.turns) && data.title !== undefined;
}

function parseSingle(data) {
  if (!data.title) {
    throw new Error("Missing title in Gemini data");
  }
  const title = data.title;

  if (!data.create_time) {
    throw new Error("Missing create_time in Gemini data");
  }
  let createTime = data.create_time;
  if (typeof createTime === 'string') {
    createTime = new Date(createTime).getTime() / 1000;
  }
  if (isNaN(createTime)) {
    throw new Error("Invalid create_time format in Gemini data");
  }
  const updateTime = createTime;
  
  let hasImageGen = false;
  let hasVideos = false;
  let hasDeepResearch = false;
  
  // Our python script uses model_dump(), so turns are in the original API order.
  // We reverse them to get chronological order (oldest to newest)
  const chronologicalTurns = [...data.turns].reverse();

  const messages = chronologicalTurns.map((turn, index) => {
    const isModel = turn.role.toLowerCase() !== 'user';
    
    // Extract genuine Gemini metadata
    const imageUrls = [];
    const videos = [];
    let deepResearchPlan = null;
    let thoughts = null;
    let hasThoughts = false;
    
    if (turn.model_output && turn.model_output.candidates && turn.model_output.candidates.length > 0) {
      const chosenIdx = turn.model_output.chosen || 0;
      const candidate = turn.model_output.candidates[chosenIdx] || turn.model_output.candidates[0];
      
      if (candidate.images && candidate.images.length > 0) {
        hasImageGen = true;
        candidate.images.forEach(img => {
          if (img.url) imageUrls.push(img.url);
        });
      }
      
      if (candidate.generated_videos && candidate.generated_videos.length > 0) {
        hasVideos = true;
        videos.push(...candidate.generated_videos);
      }
      
      if (candidate.deep_research_plan) {
        hasDeepResearch = true;
        deepResearchPlan = candidate.deep_research_plan;
      }

      if (candidate.thoughts) {
        hasThoughts = true;
        thoughts = candidate.thoughts;
      }
    }
    
    return {
      id: `gemini-msg-${index}`,
      role: isModel ? 'assistant' : 'user',
      textMarkdown: turn.text || '',
      textPlain: turn.text || '',
      timestamp: createTime + index,
      imageUrls: imageUrls,
      videos: videos,
      deepResearchPlan: deepResearchPlan,
      thoughts: thoughts,
      modelSlug: isModel ? 'gemini' : null,
      modelName: isModel ? 'Gemini' : null,
    };
  });

  const searchText = (title + ' ' + messages.map(m => m.textPlain).join(' ')).toLowerCase();

  return {
    id: data.cid,
    platform: PLATFORM,
    raw: data,
    title,
    createTime,
    updateTime,
    messages,
    searchText,
    filterMeta: {
      hasImageGen: hasImageGen,
      hasVideos: hasVideos,
      isDeepResearch: hasDeepResearch,
      modelSlug: 'gemini',
      modelName: 'Gemini'
    }
  };
}

export function parse(data) {
  if (Array.isArray(data)) {
    return data.map(parseSingle);
  }
  return [parseSingle(data)];
}
