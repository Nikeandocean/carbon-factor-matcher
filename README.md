# Carbon Factor Matcher — MCP Server for Carbon Accounting

An MCP server that connects LLMs with carbon emission factor databases. It finds the best emission factors for carbon accounting, LCA (Life Cycle Assessment), and ESG reporting.

## Features

- **Smart matching** — Two-stage search: semantic retrieval + LLM fine ranking
- **Multi-database** — ELCD (included) + ecoinvent 3.10 (Pro)
- **5-dimension data quality rating** — technology, geography, source reliability, time, factor type
- **Bilingual** — Supports Chinese and English activity descriptions
- **MCP-compatible** — Works with Claude, Cursor, and any MCP client

## Installation

**Free — no license key needed.** Just set your LLM API key:

```json
{
  "mcpServers": {
    "carbon-factor-matcher": {
      "command": "npx",
      "args": ["-y", "@nikeandocean/carbon-factor-matcher"],
      "env": {
        "LLM_API_KEY": "your-api-key",
        "LLM_BASE_URL": "https://api.deepseek.com",
        "LLM_MODEL": "deepseek-chat"
      }
    }
  }
}
```

Pro users add `"CARBON_FACTOR_LICENSE_KEY": "PRO-xxx"` to the `env` block.

## Try the Demo

👉 **[Free Online Demo](https://Nikeandocean.github.io/carbon-factor-matcher/demo.html)** — Search 30+ emission factors directly in your browser. No signup needed.

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | ELCD database, basic keyword search, 300 queries/day |
| **Pro** | $5 (one-time, lifetime) | ELCD + ecoinvent (21,000+ factors), AI matching, unlimited queries, data quality rating |

👉 **[Buy Pro License](https://Nikeandocean.github.io/carbon-factor-matcher)**

After purchase, you will receive a license key via email.

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_API_KEY` | LLM API key (DeepSeek or OpenAI-compatible) | — (required) |
| `LLM_BASE_URL` | LLM endpoint URL | `https://api.deepseek.com` |
| `LLM_MODEL` | LLM model name | `deepseek-chat` |
| `CARBON_FACTOR_LICENSE_KEY` | Pro license key (omit for Free tier) | — |
| `CARBON_FACTOR_DATA_DIR` | Path to factor database | `data/factors` |

## Available Tools

### `factor_match`

Match activity data to the best emission factor.

```json
{
  "activity_data": "Factory in Shenzhen, 10kV industrial electricity, 2024, semiconductor fab",
  "top_k": 10
}
```

### `factor_search`

Search emission factors by keyword with optional category filter.

```json
{
  "query": "diesel",
  "category": "fuel",
  "limit": 10
}
```

### `factor_detail`

Get full metadata for a specific factor by its ID.

```json
{
  "factor_id": "elec-cn-south-10kv-2024"
}
```

## Support

- **Email:** nikeandocean@gmail.com
- **Issues:** https://github.com/Nikeandocean/carbon-factor-matcher/issues

## License

Proprietary. See [LICENSE](LICENSE) for details.
