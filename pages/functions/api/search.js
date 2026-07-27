/**
 * GET /api/search?q=...&limit=10&category=...&source=...
 * Keyword search emission factors
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").toLowerCase().trim();
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") || "10", 10) || 10, 1), 50);
  const category = (url.searchParams.get("category") || "").toLowerCase().trim();
  const source = (url.searchParams.get("source") || "").toLowerCase().trim();

  if (!q) {
    return Response.json({ error: "Missing query parameter 'q'" }, { status: 400 });
  }

  try {
    // Load factors from R2
    const obj = await env.CARBON_FACTORS.get("factors.json");
    if (!obj) {
      return Response.json({ error: "Database not available" }, { status: 500 });
    }

    const text = await obj.text();
    let factors = JSON.parse(text);

    // Filter by database source — supports comma-separated values (e.g. "elcd,us lci")
    if (source) {
      const allowed = new Set(source.split(",").map((s) => s.trim()));
      factors = factors.filter((f) => allowed.has((f.db_source || "").toLowerCase()));
    }

    // Detect CJK characters
    const hasCJK = /[一-鿿㐀-䶿]/.test(q);

    let results;
    if (hasCJK) {
      // CJK: substring match
      results = factors.map((f) => {
        const nameLower = (f.name || "").toLowerCase();
        const catLower = (f.category || "").toLowerCase();
        const appLower = (f.applicability || "").toLowerCase();
        let score = 0;
        if (nameLower.includes(q)) score = 5;
        else if (catLower.includes(q)) score = 3;
        else if (appLower.includes(q)) score = 1;
        return { factor: f, score };
      }).filter((r) => r.score > 0);
    } else {
      // Latin: word boundary matching
      const STOP_WORDS = new Set([
        "the", "a", "an", "in", "on", "at", "for", "to", "of", "by", "with",
        "from", "is", "are", "was", "were", "be", "been", "and", "or", "not",
        "this", "that", "it", "its", "or", "but", "if", "as", "do", "does",
        "did", "will", "would", "could", "should", "may", "can", "shall",
        "mix", "average", "technology", "process", "production", "consumption",
      ]);
      const UNITS = new Set([
        "kwh", "kwh", "kg", "mj", "m3", "m2", "t", "km", "g", "l", "ml",
        "ton", "tonne", "lb", "gal", "bq", "kbq", "co2", "co2e",
      ]);
      const words = q.split(/\s+/).filter((w) => {
        if (w.length <= 1) return false;
        if (/^\d+(\.\d+)?$/.test(w)) return false;
        if (STOP_WORDS.has(w)) return false;
        if (UNITS.has(w)) return false;
        return true;
      });
      const patterns = words.map((w) => {
        try { return new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"); }
        catch { return null; }
      }).filter(Boolean);

      results = factors.map((f) => {
        const nameLower = (f.name || "").toLowerCase();
        const catLower = (f.category || "").toLowerCase();
        const appLower = (f.applicability || "").toLowerCase();
        let nameHits = 0, catHits = 0, appHits = 0;
        for (const pat of patterns) {
          if (pat.test(nameLower)) nameHits++;
          else if (pat.test(catLower)) catHits++;
          else if (pat.test(appLower)) appHits++;
        }
        const score = nameHits * 5 + catHits * 2 + appHits * 0.5;
        return { factor: f, score };
      }).filter((r) => r.score > 0);
    }

    // Filter by category
    if (category) {
      results = results.filter((r) =>
        r.factor.category.toLowerCase().includes(category)
      );
    }

    results.sort((a, b) => b.score - a.score);
    const top = results.slice(0, limit).map((r) => ({
      id: r.factor.id,
      name: r.factor.name,
      category: r.factor.category,
      value: r.factor.value,
      unit: r.factor.unit,
      geography: r.factor.geography,
      source: r.factor.source,
      source_year: r.factor.source_year,
      db_source: r.factor.db_source,
      quality_technical: r.factor.quality_technical,
      quality_source: r.factor.quality_source,
      quality_geographical: r.factor.quality_geographical,
      quality_time: r.factor.quality_time,
      quality_fairness: r.factor.quality_fairness,
    }));

    return Response.json({ count: results.length, factors: top });
  } catch (e) {
    console.error("Search error:", e);
    return Response.json({ error: "Search failed" }, { status: 500 });
  }
}
