---
name: carbon-factor-matcher
description: MCP server for intelligent emission factor matching from ELCD and ecoinvent databases. Supports carbon accounting, LCA, and ESG reporting with hybrid keyword + embedding retrieval.
metadata:
  openclaw:
    requires:
      bins: ["npx"]
    homepage: "https://zerocarbonlogic.com"
---

# Carbon Factor Matcher

An MCP server connecting AI agents with 600+ ELCD and 6,000+ ecoinvent emission factors for carbon accounting and Life Cycle Assessment (LCA).

## Features

- **Hybrid Matching** — Keyword scoring + embedding similarity + quality-based ranking
- **Multi-Database** — ELCD + ecoinvent 3.10 support
- **Data Quality Rating** — 5-dimension quality assessment (technology, geography, source, time, factor type)
- **Zero Config** — Works out of the box, no API keys required
- **MCP Compatible** — Works with any MCP client (Claude, Cursor, etc.)

## Quick Start

```bash
# Free tier (no license key needed)
npx -y @nikeandocean/carbon-factor-matcher
```

## Available Tools

### factor_match
Intelligent emission factor matching. Takes a natural-language description and returns the best-matching factor with CO2e intensity.

### factor_search
Keyword search over emission factor databases.

### factor_detail
Retrieve full metadata for a specific emission factor by ID.

## License

Free tier available. Pro license at [zerocarbonlogic.com](https://zerocarbonlogic.com/).
