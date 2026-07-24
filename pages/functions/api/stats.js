/**
 * GET /api/stats?source=...
 * Database statistics
 */

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const source = (url.searchParams.get("source") || "").toLowerCase().trim();

  try {
    const obj = await env.CARBON_FACTORS.get("factors.json");
    if (!obj) {
      return Response.json({ error: "Database not available" }, { status: 500 });
    }

    const text = await obj.text();
    let factors = JSON.parse(text);

    // Filter by database source
    if (source) {
      factors = factors.filter((f) => (f.db_source || "").toLowerCase() === source);
    }

    const categories = {};
    const geographies = {};
    for (const f of factors) {
      const cat = f.category.split("/")[0] || "Unknown";
      categories[cat] = (categories[cat] || 0) + 1;
      const geo = f.geography?.location || "Unknown";
      geographies[geo] = (geographies[geo] || 0) + 1;
    }

    return Response.json({
      total_factors: factors.length,
      source_filter: source || "all",
      top_categories: Object.entries(categories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
      top_geographies: Object.entries(geographies)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count })),
    });
  } catch (e) {
    console.error("Stats error:", e);
    return Response.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
