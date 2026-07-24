[![smithery badge](https://smithery.ai/badge/nikeandocean/carbon-factor-matcher)](https://smithery.ai/servers/nikeandocean/carbon-factor-matcher)

# Carbon Factor Matcher — MCP Server for Carbon Accounting

An MCP (Model Context Protocol) server that connects AI agents with carbon emission factor databases. It provides intelligent emission factor matching for carbon accounting, LCA (Life Cycle Assessment), and ESG reporting applications.

## What is this MCP?

Carbon Factor Matcher helps AI agents find the most appropriate emission factors from standardized environmental databases. It uses a hybrid search algorithm:

1. **Keyword + Embedding retrieval** — Field-weighted keyword scoring and semantic similarity to find candidate factors
2. **Quality-based ranking** — 5-dimension data quality assessment to rank candidates

The calling AI agent selects the best match from the ranked candidates. No external LLM API needed.

### Supported Databases

- **ELCD** — European Reference Life Cycle Database (~600 factors, included in Free tier)
- **ecoinvent 3.10** — Swiss Centre for Life Cycle Inventories (~21,000 factors, Pro license required)

### Key Features

- 5-dimension data quality rating (technology, geography, source, time, factor type)
- Multi-language support (Chinese/English activity descriptions)
- Zero configuration — works out of the box after installation
- MCP-compatible — works with Claude, Cursor, Windsurf, Cline, Continue, and any MCP client

## Installation

### Claude Code

```bash
claude mcp add carbon-factor-matcher -- npx -y @nikeandocean/carbon-factor-matcher
```

### Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "carbon-factor-matcher": {
      "command": "npx",
      "args": ["-y", "@nikeandocean/carbon-factor-matcher"]
    }
  }
}
```

Config file locations:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

### Cursor

Add to `.cursor/mcp.json` (project) or `~/.cursor/mcp.json` (global):

```json
{
  "mcpServers": {
    "carbon-factor-matcher": {
      "command": "npx",
      "args": ["-y", "@nikeandocean/carbon-factor-matcher"]
    }
  }
}
```

Or via Cursor UI: **Settings → MCP → Add new global MCP server**.

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "carbon-factor-matcher": {
      "command": "npx",
      "args": ["-y", "@nikeandocean/carbon-factor-matcher"]
    }
  }
}
```

Or via Windsurf UI: **Settings → Cascade → MCP Servers → Add**.

### Cline (VS Code Extension)

Add to Cline MCP settings (click **MCP Servers** icon in Cline panel):

```json
{
  "mcpServers": {
    "carbon-factor-matcher": {
      "command": "npx",
      "args": ["-y", "@nikeandocean/carbon-factor-matcher"]
    }
  }
}
```

### Continue (VS Code / JetBrains)

Add to `~/.continue/config.yaml`:

```yaml
mcpServers:
  - name: carbon-factor-matcher
    command: npx
    args:
      - "-y"
      - "@nikeandocean/carbon-factor-matcher"
```

### Smithery.ai (One-Click Install)

```bash
npx -y smithery mcp add nikeandocean/carbon-factor-matcher
```

Or visit [smithery.ai/server/@nikeandocean/carbon-factor-matcher](https://smithery.ai/server/@nikeandocean/carbon-factor-matcher) for hosted endpoint.

## Pro License

The Free tier works immediately after installation (300 queries/day, ELCD database, keyword search). To unlock the full experience:

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | ELCD database (~600 factors), keyword search, 300 queries/day |
| **Pro** | $5 (one-time) | ELCD + ecoinvent (~21,000 factors), hybrid matching with quality rating, unlimited queries |

### Purchase License Key

👉 **[Buy Pro License](https://nikeandocean.github.io/carbon-factor-matcher)**

After purchase, you'll receive a license key via email. Set it as an environment variable in your MCP config:

```json
{
  "mcpServers": {
    "carbon-factor-matcher": {
      "command": "npx",
      "args": ["-y", "@nikeandocean/carbon-factor-matcher"],
      "env": {
        "CARBON_FACTOR_LICENSE_KEY": "PRO-xxxx-xxxx"
      }
    }
  }
}
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `CARBON_FACTOR_LICENSE_KEY` | Your license key (empty = Free tier) | — |
| `CARBON_FACTOR_DATA_DIR` | Path to local factor database | `data/factors` |

Note: No external LLM API configuration needed. The calling AI agent handles final factor selection.

## Available Tools

### `factor_match`

Match activity data to emission factors. Free tier uses keyword search; Pro tier uses hybrid embedding + quality ranking. Returns ranked candidates for the calling agent to select from.

**Input:**
```json
{
  "activity_data": "Factory in Shenzhen, 10kV industrial electricity, 2024, semiconductor fab",
  "top_k": 10
}
```

**Output (Pro tier):**
```json
{
  "candidates": [
    {
      "id": "elec-cn-south-10kv-2024",
      "name": "Electricity, 10kV, South China Grid",
      "value": 0.6101,
      "unit": "kgCO2e/kWh",
      "hybrid_score": 0.85,
      "quality_ratings": {"tech_representativeness": 1, "source_reliability": 1, "...": "..."},
      "quality_score": 0.9,
      "final_score": 0.875
    }
  ],
  "selection_guidance": "从候选列表中选择最匹配的排放因子..."
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

## Demo

👉 **[Try the Live Demo](https://nikeandocean.github.io/carbon-factor-matcher/demo.html)** — Search 30+ emission factors directly in your browser (no installation needed).

## System Requirements

- Node.js 18+ (for `npx`)
- Python 3.11+ (auto-installed via pip)

## Support

- **Email:** tao.yan@zju.edu.cn
- **Issues:** https://github.com/nikeandocean/carbon-factor-matcher/issues

## License

This is proprietary software. See [LICENSE](LICENSE) for details.

---

© 2024 Carbon Factor Matcher. All rights reserved.
