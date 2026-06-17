# Carbon Factor Matcher — MCP Server for Carbon Accounting

An MCP (Model Context Protocol) server that connects LLMs with carbon footprint databases. It provides intelligent emission factor matching for carbon accounting, LCA (Life Cycle Assessment), and ESG reporting applications.

## What is this MCP?

Carbon Factor Matcher helps AI agents and LLM-based applications find the most appropriate emission factors from standardized environmental databases. It uses a two-stage hybrid search algorithm:

1. **Embedding-based rough filtering** — Semantic similarity to find candidate factors
2. **LLM-based fine ranking** — AI-powered selection with reasoning and confidence scores

### Supported Databases

- **ELCD** — European Reference Life Cycle Database (included)
- **ecoinvent 3.10** — Swiss Centre for Life Cycle Inventories (Pro license required)

### Key Features

- 5-dimension data quality rating (technology, geography, source, time, factor type)
- Multi-language support (Chinese/English activity descriptions)
- MCP-compatible — works with Claude, Cursor, and any MCP client

## Installation

### Option 1: Smithery.ai (Recommended)

```bash
npx @anthropic-ai/claude-code add nikeandocean/carbon-factor-matcher
```

### Option 2: Manual Configuration

Add to your MCP settings (`claude_desktop_config.json` or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "carbon-factor-matcher": {
      "command": "npx",
      "args": ["-y", "@nikeandocean/carbon-factor-matcher"],
      "env": {
        "CARBON_FACTOR_LICENSE_KEY": "your-license-key",
        "LLM_API_KEY": "your-api-key",
        "LLM_BASE_URL": "https://api.deepseek.com",
        "LLM_MODEL": "deepseek-chat"
      }
    }
  }
}
```

## Pricing

This is a **commercial MCP server**. You can purchase the access license key via PayPro Global.

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | ELCD database, basic search, top 3 results |
| **Pro** | $5 (one-time) | ELCD + ecoinvent, hybrid matching, unlimited results, data quality rating |

### Purchase License Key

👉 **[Buy Pro License on PayPro Global](https://payproglobal.com/your-product-link)**

After purchase, you will receive a license key via email. Set it as the `CARBON_FACTOR_LICENSE_KEY` environment variable.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `CARBON_FACTOR_LICENSE_KEY` | Your license key (empty = Free tier) | — |
| `LLM_API_KEY` | LLM API key (DeepSeek/OpenAI) | — |
| `LLM_BASE_URL` | LLM endpoint URL | `https://api.deepseek.com` |
| `LLM_MODEL` | LLM model name | `deepseek-chat` |
| `CARBON_FACTOR_DATA_DIR` | Path to factor database | `data/factors` |

## Available Tools

### `factor_match`

Match activity data to the best emission factor using semantic search.

**Input:**
```json
{
  "activity_data": "Factory in Shenzhen, 10kV industrial electricity, 2024, semiconductor fab",
  "top_k": 10
}
```

**Output:**
```json
{
  "selected_factor": {
    "id": "elec-cn-south-10kv-2024",
    "name": "Electricity, 10kV, South China Grid",
    "value": 0.6101,
    "unit": "kgCO2e/kWh"
  },
  "confidence": 0.92,
  "reason": "Best match for industrial electricity in South China region",
  "alternatives": [...]
}
```

### `factor_search`

Search emission factors by keyword with optional filters.

**Input:**
```json
{
  "query": "diesel",
  "category": "fuel",
  "limit": 10
}
```

### `factor_detail`

Get full metadata for a specific factor.

**Input:**
```json
{
  "factor_id": "elec-cn-south-10kv-2024"
}
```

## System Requirements

- Python 3.11+
- LLM API key (DeepSeek recommended, or any OpenAI-compatible endpoint)
- 2GB+ RAM for embedding model

## Tech Stack

- **MCP SDK** — Model Context Protocol implementation
- **Sentence Transformers** — Semantic embedding (shibing624/text2vec-base-chinese)
- **DeepSeek/OpenAI** — LLM-based factor ranking
- **SQLite** — Usage tracking
- **Python 3.11+** — Runtime

## Support

- **Email:** tao.yan@zju.edu.cn
- **Issues:** https://github.com/tra121vel/carbon-factor-matcher/issues

## License

This is proprietary software. See [LICENSE](LICENSE) for details.

---

© 2024 Carbon Factor Matcher. All rights reserved.
