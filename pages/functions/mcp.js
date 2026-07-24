/**
 * POST /mcp
 * MCP protocol handler (JSON-RPC 2.0)
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonRpcError(null, -32700, "Parse error");
  }

  const { jsonrpc, id, method, params } = body;

  if (jsonrpc !== "2.0") {
    return jsonRpcError(id, -32600, "Invalid Request: jsonrpc must be '2.0'");
  }

  try {
    switch (method) {
      case "initialize":
        return jsonRpcResult(id, {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "carbon-factor-matcher", version: "1.0.9" },
        });

      case "notifications/initialized":
        return new Response(null, { status: 204 });

      case "tools/list":
        return jsonRpcResult(id, { tools: getMcpTools() });

      case "tools/call":
        return await handleMcpToolCall(id, params, env);

      case "ping":
        return jsonRpcResult(id, {});

      default:
        return jsonRpcError(id, -32601, `Method not found: ${method}`);
    }
  } catch (e) {
    console.error("MCP error:", e);
    return jsonRpcError(id, -32603, `Internal error: ${e.message}`);
  }
}

function getMcpTools() {
  return [
    {
      name: "factor_match",
      description:
        "Intelligent emission factor matching for carbon accounting and Life Cycle Assessment (LCA). " +
        "Takes a natural-language description of an industrial activity or material and returns " +
        "the best-matching emission factor with CO2-equivalent intensity, confidence score, and reasoning. " +
        "Free tier uses keyword search over ELCD database (~600 European factors). " +
        "Pro tier adds embedding-based semantic search + quality-based ranking over ecoinvent (~21,000 global factors) " +
        "with 5-dimension data quality assessment.",
      inputSchema: {
        type: "object",
        properties: {
          activity_data: {
            type: "string",
            description:
              "Natural-language description of the activity, material, or process to match. " +
              "Examples: 'Factory in Shenzhen, 10kV industrial electricity, 2024, semiconductor fab', " +
              "'diesel combustion for freight transport, EU', 'cement production, rotary kiln'. " +
              "IMPORTANT: The database is in English. If the user input is in another language, " +
              "translate to English keywords before querying.",
          },
          top_k: {
            type: "integer",
            default: 10,
            description: "Number of candidate factors to consider (1-50). Default: 10.",
          },
        },
        required: ["activity_data"],
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    {
      name: "factor_search",
      description:
        "Keyword search over emission factor databases. Returns matching factors with metadata " +
        "including emission value (kgCO2e per unit), unit, geographic scope, source database, " +
        "and publication year. Supports optional category filtering.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search keyword — material name, process, or activity (in English).",
          },
          category: {
            type: "string",
            description: "Optional category filter (e.g. 'electricity', 'fuel', 'transport').",
          },
          limit: {
            type: "integer",
            default: 10,
            description: "Maximum results (1-50). Default: 10.",
          },
        },
        required: ["query"],
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    {
      name: "factor_detail",
      description:
        "Retrieve full metadata for a specific emission factor by its unique identifier. " +
        "Returns emission intensity, unit, geographic scope, and (Pro) 5-dimension quality ratings.",
      inputSchema: {
        type: "object",
        properties: {
          factor_id: {
            type: "string",
            description: "The unique identifier of the emission factor.",
          },
        },
        required: ["factor_id"],
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
  ];
}

async function handleMcpToolCall(id, params, env) {
  const { name, arguments: args } = params || {};

  if (!name) {
    return jsonRpcError(id, -32602, "Missing tool name");
  }

  let result;
  switch (name) {
    case "factor_match":
    case "factor_search": {
      const query = args?.activity_data || args?.query;
      if (!query) {
        return jsonRpcError(id, -32602, `Missing required parameter: ${name === "factor_match" ? "activity_data" : "query"}`);
      }
      const limit = Math.min(Math.max(args?.top_k || args?.limit || 10, 1), 50);
      const category = args?.category || "";
      const source = args?.source || "elcd";
      const sourceParam = source === "all" ? "" : source;

      // Call internal search
      const searchUrl = new URL(`https://x/api/search?q=${encodeURIComponent(query)}&limit=${limit}&category=${encodeURIComponent(category)}&source=${encodeURIComponent(sourceParam)}`);
      const fakeContext = {
        request: new Request(searchUrl),
        env,
      };
      const { onRequestGet } = await import("./api/search.js");
      const searchResult = await onRequestGet(fakeContext);
      const searchData = await searchResult.json();
      result = { data: searchData };
      break;
    }
    case "factor_detail": {
      const factorId = args?.factor_id;
      if (!factorId) {
        return jsonRpcError(id, -32602, "Missing required parameter: factor_id");
      }
      const fakeContext = {
        params: { id: factorId },
        env,
      };
      const { onRequestGet } = await import("./api/factor/[id].js");
      const detailResult = await onRequestGet(fakeContext);
      const detailData = await detailResult.json();
      result = { data: detailData };
      break;
    }
    default:
      return jsonRpcError(id, -32601, `Unknown tool: ${name}`);
  }

  return jsonRpcResult(id, {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
  });
}

function jsonRpcResult(id, result) {
  return Response.json({ jsonrpc: "2.0", id, result });
}

function jsonRpcError(id, code, message) {
  return Response.json({ jsonrpc: "2.0", id, error: { code, message } });
}
