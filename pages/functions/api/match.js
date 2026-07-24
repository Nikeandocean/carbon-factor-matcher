/**
 * POST /api/match
 * Server-side hybrid matching: keyword + embedding.
 * Uses in-memory cached embeddings (loaded once per isolate).
 *
 * Request body: { query, top_k?, source? }
 * Response: { candidates: [...], selection_guidance: "..." }
 */

import { loadFactors, loadEmbeddings, getFactorEmbeddings } from "../_shared.js";

const DASHSCOPE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-v4";

// Hybrid retrieval weights
const KEYWORD_WEIGHT = 0.3;
const EMBEDDING_WEIGHT = 0.7;

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { query, top_k = 10, source = "" } = body;
  if (!query || typeof query !== "string") {
    return Response.json({ error: "Missing required field 'query'" }, { status: 400 });
  }

  const limit = Math.min(Math.max(top_k, 1), 50);

  try {
    // Load factors + embeddings from shared cache (R2 read only on first call per isolate)
    const [factors, embData] = await Promise.all([
      loadFactors(env),
      loadEmbeddings(env),
    ]);

    // Filter by source
    const filtered = source
      ? factors.filter((f) => (f.db_source || "").toLowerCase() === source.toLowerCase())
      : factors;

    // Stage 1: Keyword scoring
    const keywordResults = filtered.map((f, idx) => ({
      idx,
      factor: f,
      score: keywordScore(f, query),
    }));

    keywordResults.sort((a, b) => b.score - a.score);
    const maxKw = keywordResults[0]?.score || 1.0;

    // Stage 2: Embedding similarity for top candidates
    const keywordTopN = 200;
    const narrowed = keywordResults.slice(0, keywordTopN);

    // Compute query embedding via DashScope
    let queryEmb = null;
    const dashscopeKey = env.DASHSCOPE_API_KEY;
    if (dashscopeKey && embData) {
      try {
        queryEmb = await computeQueryEmbedding(query, dashscopeKey);
      } catch (e) {
        console.error("Embedding failed, keyword-only:", e.message);
      }
    }

    // Get factor embeddings from cache (no R2 reads — already in memory)
    let factorEmbMap = new Map();
    if (queryEmb && embData) {
      factorEmbMap = getFactorEmbeddings(narrowed.map(({ factor }) => factor.id));
    }

    // Score candidates
    const scored = [];
    for (const { factor, score: rawKwScore } of narrowed) {
      const kwScore = maxKw > 0 ? rawKwScore / maxKw : 0;

      let hybrid;
      let embScore = 0;
      if (queryEmb && factorEmbMap.has(factor.id)) {
        embScore = cosineSimilarity(queryEmb, factorEmbMap.get(factor.id));
        hybrid = KEYWORD_WEIGHT * kwScore + EMBEDDING_WEIGHT * embScore;
      } else {
        hybrid = kwScore;
      }

      scored.push({
        factor,
        keyword_score: round(kwScore, 4),
        embedding_score: round(embScore, 4),
        hybrid_score: round(hybrid, 4),
        final_score: round(hybrid, 4),
      });
    }

    scored.sort((a, b) => b.final_score - a.final_score);
    const candidates = scored.slice(0, limit).map((c) => ({
      id: c.factor.id,
      name: c.factor.name,
      value: c.factor.value,
      unit: c.factor.unit,
      category: c.factor.category,
      geography: c.factor.geography,
      applicability: c.factor.applicability,
      source: c.factor.source,
      source_year: c.factor.source_year,
      db_source: c.factor.db_source,
      keyword_score: c.keyword_score,
      embedding_score: c.embedding_score,
      hybrid_score: c.hybrid_score,
      final_score: c.final_score,
    }));

    return Response.json({
      candidates,
      selection_guidance:
        "从候选列表中选择最匹配的排放因子。选择原则：" +
        "1) 地理位置匹配（优先同国家/地区）；" +
        "2) 技术规格匹配（电压等级、温度、压力等）；" +
        "3) 查看 applicability 字段了解适用条件；" +
        "4) final_score 越高表示与查询越相关。",
    });
  } catch (e) {
    console.error("Match error:", e);
    return Response.json({ error: `Match failed: ${e.message}` }, { status: 500 });
  }
}

async function computeQueryEmbedding(query, apiKey) {
  const resp = await fetch(DASHSCOPE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: [query] }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`DashScope HTTP ${resp.status}: ${text}`);
  }

  const data = await resp.json();
  return data.data[0].embedding;
}

// --- Keyword scoring ---

const STOP_WORDS = new Set([
  "the", "a", "an", "in", "on", "at", "for", "to", "of", "by", "with",
  "from", "is", "are", "was", "were", "be", "been", "and", "or", "not",
  "this", "that", "it", "its", "but", "if", "as", "do", "does",
]);

// Generic terms that cause false positives when matched alone (e.g. "gas" matching "blast furnace gas")
const GENERIC_TERMS = new Set([
  "gas", "fuel", "energy", "heat", "power", "oil", "air", "water", "steam",
  "mix", "average", "technology", "process", "production", "consumption",
]);

const UNITS = new Set([
  "kwh", "kg", "mj", "m3", "m2", "t", "km", "g", "l", "ml",
  "ton", "tonne", "lb", "gal", "bq", "kbq", "co2", "co2e",
]);

function keywordScore(factor, query) {
  const q = query.toLowerCase();
  const nameLower = (factor.name || "").toLowerCase();
  const catLower = (factor.category || "").toLowerCase();
  const appLower = (factor.applicability || "").toLowerCase();
  const geoLower = Object.values(factor.geography || {})
    .filter((v) => typeof v === "string")
    .join(" ")
    .toLowerCase();

  if (q === nameLower) return 1.0;

  // Extract meaningful terms: keep abbreviations (LDPE, PE, PVC), filter stop words and units
  const terms = q.split(/\s+/).filter((w) => {
    if (w.length <= 1) return false;
    if (/^\d+(\.\d+)?$/.test(w)) return false;
    if (STOP_WORDS.has(w)) return false;
    if (UNITS.has(w)) return false;
    return true;
  });
  if (!terms.length) return 0.0;

  // Extract 2-word phrases for compound matching (e.g. "natural gas", "blast furnace")
  const phrases = [];
  for (let i = 0; i < terms.length - 1; i++) {
    const phrase = terms[i] + " " + terms[i + 1];
    phrases.push(phrase);
  }

  // Score: phrase matches in name get highest weight
  let score = 0;
  let nameTermHits = 0;
  let matchedTerms = new Set();

  // Check phrase matches first (e.g. "natural gas" as one unit)
  for (const phrase of phrases) {
    if (nameLower.includes(phrase)) {
      score += 10; // phrases are very specific
      // Mark both terms as matched
      const parts = phrase.split(" ");
      parts.forEach(p => matchedTerms.add(p));
    }
  }

  // Check individual term matches
  for (const t of terms) {
    if (matchedTerms.has(t)) continue; // already matched via phrase
    const isGeneric = GENERIC_TERMS.has(t);

    if (nameLower.includes(t)) {
      // Generic terms in name get reduced weight; specific terms get full weight
      score += isGeneric ? 1 : 5;
      nameTermHits++;
      matchedTerms.add(t);
    } else if (catLower.includes(t)) {
      score += isGeneric ? 0.5 : 2;
      matchedTerms.add(t);
    } else if (geoLower.includes(t)) {
      score += 2;
      matchedTerms.add(t);
    } else if (appLower.includes(t)) {
      score += isGeneric ? 0.25 : 0.5;
      matchedTerms.add(t);
    }
  }

  // Normalize: max possible score = all specific terms match name (5 each) + all phrases match (10 each)
  const specificTermCount = terms.filter(t => !GENERIC_TERMS.has(t)).length;
  const phraseCount = phrases.length;
  const maxScore = Math.max(specificTermCount * 5 + phraseCount * 10, 1);

  return Math.min(score / maxScore, 1.0);
}

// --- Utils ---

function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

function round(v, decimals) {
  const m = 10 ** decimals;
  return Math.round(v * m) / m;
}
