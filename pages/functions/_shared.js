/**
 * Shared utilities for Pages Functions
 * Extracted from paddle-webhook.js
 */

// In-memory factor cache
let factorsCache = null;
let factorsById = null;

export async function loadFactors(env) {
  if (factorsCache) return factorsCache;

  const obj = await env.CARBON_FACTORS.get("factors.json");
  if (!obj) {
    throw new Error("factors.json not found in R2");
  }

  const text = await obj.text();
  factorsCache = JSON.parse(text);
  factorsById = new Map(factorsCache.map((f) => [f.id, f]));

  return factorsCache;
}

export function getFactorById(id) {
  return factorsById?.get(id) || null;
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleCors(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }
  return null;
}
