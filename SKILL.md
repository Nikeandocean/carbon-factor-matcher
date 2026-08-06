---
name: carbon-factor-matcher
description: Intelligent emission factor matching for carbon accounting. Uses hybrid search (keyword + embedding) with quality-based ranking to find the best emission factors from ELCD, US LCI, USDA LCA Commons, and ecoinvent databases.
---

# Carbon Factor Matcher

Intelligent emission factor matching for carbon accounting. Uses hybrid search (keyword + embedding) with quality-based ranking to find the best emission factors from ELCD, US LCI, USDA LCA Commons, and ecoinvent databases.

## Features

- **Hybrid Matching** — Keyword scoring + embedding similarity + quality-based ranking
- **Multi-Database** — ELCD + US LCI + USDA LCA Commons + ecoinvent 3.10 (8,400+ factors)
- **Data Quality Rating** — 5-dimension quality assessment (technology, geography, source, time, factor type)
- **Zero Config** — Works out of the box, no API keys required
- **MCP Compatible** — Works with any MCP client (Claude, Cursor, etc.)

## Install

```bash
npx @anthropic-ai/claude-code add nikeandocean/carbon-factor-matcher
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `CARBON_FACTOR_DATA_DIR` | Path to factor database | `data/factors` |
| `CARBON_FACTOR_LICENSE_KEY` | Your license key | (empty = Free) |
| `EMBEDDING_MODEL` | Embedding model | `shibing624/text2vec-base-chinese` |

## Databases

| Database | Factors | Coverage | Free |
|----------|---------|----------|------|
| ELCD | ~500 | European reference data | ✅ |
| US LCI | ~500 | US industrial processes | ✅ |
| USDA LCA Commons | ~1,500 | US agriculture & forestry | ✅ |
| ecoinvent 3.10 | ~5,800 | Global, all sectors | Pro |

## License Tiers

| Feature | Free | Pro ($5 one-time) |
|---------|------|---------------------|
| ELCD database | ✅ | ✅ |
| US LCI database | ✅ | ✅ |
| USDA LCA Commons | ✅ | ✅ |
| ecoinvent database | ❌ | ✅ |
| Basic keyword search | ✅ | ✅ |
| Hybrid matching | ❌ | ✅ |
| Data quality rating | ❌ | ✅ |
| Results per query | Top 3 | Unlimited |

**Get Pro License:** [Buy Pro License](https://nikeandocean.github.io/carbon-factor-matcher)

## Tools

### `factor_match`

Match activity data to emission factors using hybrid search + quality ranking. Returns ranked candidates for the calling agent to select from.

```json
{
  "activity_data": "Factory in Shenzhen, 10kV industrial electricity, 2024",
  "top_k": 10
}
```

### `factor_search`

Search emission factors by keyword.

```json
{
  "query": "diesel",
  "category": "fuel",
  "limit": 10
}
```

### `factor_detail`

Get full metadata for a specific factor.

```json
{
  "factor_id": "elcd-123"
}
```

## Tech Stack

- Python 3.11+
- MCP SDK
- Sentence Transformers (local embedding, CPU)
- SQLite (usage tracking)

## License

Proprietary.
