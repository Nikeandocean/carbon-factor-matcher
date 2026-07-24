/**
 * GET /api/factor/:id
 * Get factor by ID
 */

export async function onRequestGet(context) {
  const { params, env } = context;
  const factorId = decodeURIComponent(params.id);

  if (!factorId) {
    return Response.json({ error: "Missing factor ID" }, { status: 400 });
  }

  try {
    const obj = await env.CARBON_FACTORS.get("factors.json");
    if (!obj) {
      return Response.json({ error: "Database not available" }, { status: 500 });
    }

    const text = await obj.text();
    const factors = JSON.parse(text);
    const factor = factors.find((f) => f.id === factorId);

    if (!factor) {
      return Response.json({ error: "Factor not found" }, { status: 404 });
    }

    return Response.json(factor);
  } catch (e) {
    console.error("Factor detail error:", e);
    return Response.json({ error: "Failed to load factor" }, { status: 500 });
  }
}
