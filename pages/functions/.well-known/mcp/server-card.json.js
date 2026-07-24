/**
 * GET /.well-known/mcp/server-card.json
 * Smithery metadata
 */

export async function onRequestGet() {
  const card = {
    serverInfo: {
      name: "carbon-factor-matcher",
      version: "1.0.9",
    },
    endpoint: "/mcp",
    authentication: {
      required: true,
      schemes: ["bearer"],
    },
    tools: [
      {
        name: "factor_match",
        description:
          "Intelligent emission factor matching for carbon accounting and Life Cycle Assessment (LCA).",
        inputSchema: {
          type: "object",
          properties: {
            activity_data: { type: "string" },
            top_k: { type: "integer", default: 10 },
          },
          required: ["activity_data"],
        },
      },
      {
        name: "factor_search",
        description: "Keyword search over emission factor databases.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string" },
            category: { type: "string" },
            limit: { type: "integer", default: 10 },
          },
          required: ["query"],
        },
      },
      {
        name: "factor_detail",
        description: "Retrieve full metadata for a specific emission factor.",
        inputSchema: {
          type: "object",
          properties: {
            factor_id: { type: "string" },
          },
          required: ["factor_id"],
        },
      },
    ],
    resources: [],
    prompts: [],
  };

  return Response.json(card, {
    headers: {
      "Cache-Control": "public, max-age=3600",
    },
  });
}
