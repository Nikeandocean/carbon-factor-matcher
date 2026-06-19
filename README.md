[![smithery badge](https://smithery.ai/badge/nikeandocean/carbon-factor-matcher)](https://smithery.ai/servers/nikeandocean/carbon-factor-matcher)

# Carbon Factor Matcher — MCP Server for Carbon Accounting

An MCP (Model Context Protocol) server that connects LLMs with carbon footprint databases. It provides intelligent emission factor matching for carbon accounting, LCA (Life Cycle Assessment), and ESG reporting applications.

## What is this MCP?

Carbon Factor Matcher helps AI agents and LLM-based applications find the most appropriate emission factors from standardized environmental databases. It uses a two-stage hybrid search algorithm:

1. **Embedding-based rough filtering** — Semantic similarity to find candidate factors
2. **LLM-based fine ranking** — AI-powered selection with reasoning and confidence scores

### Supported Databases

- **ELCD** — European Reference Life Cycle Database (~600 factors, included in Free tier)
- **ecoinvent 3.10** — Swiss Centre for Life Cycle Inventories (~21,000 factors, Pro license required)

### Key Features

- 5-dimension data quality rating (technology, geography, source, time, factor type)
- Multi-language support (Chinese/English activity descriptions)
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
| **Pro** | $5 (one-time) | ELCD + ecoinvent (~21,000 factors), LLM-powered matching, unlimited queries, data quality rating |

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
        "CARBON_FACTOR_LICENSE_KEY": "PRO-xxxx-xxxx",
        "LLM_API_KEY": "sk-xxxx",
        "LLM_BASE_URL": "https://api.deepseek.com",
        "LLM_MODEL": "deepseek-chat"
      }
    }
  }
}
```

## Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `CARBON_FACTOR_LICENSE_KEY` | Your license key (empty = Free tier) | — |
| `LLM_API_KEY` | LLM API key for Pro matching (DeepSeek/OpenAI) | — |
| `LLM_BASE_URL` | LLM endpoint URL | `https://api.deepseek.com` |
| `LLM_MODEL` | LLM model name | `deepseek-chat` |
| `CARBON_FACTOR_DATA_DIR` | Path to local factor database | `data/factors` |

## Available Tools

### `factor_match`

Match activity data to the best emission factor. Free tier uses keyword search; Pro tier uses hybrid embedding + LLM matching with quality assessment.

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

## Demo

👉 **[Try the Live Demo](https://nikeandocean.github.io/carbon-factor-matcher/demo.html)** — Search 30+ emission factors directly in your browser (no installation needed).

## System Requirements

- Node.js 18+ (for `npx`)
- Python 3.11+ (auto-installed via pip)
- LLM API key (Pro tier only — DeepSeek recommended)

## Support

- **Email:** tao.yan@zju.edu.cn
- **Issues:** https://github.com/nikeandocean/carbon-factor-matcher/issues

## License

This is proprietary software. See [LICENSE](LICENSE) for details.

---

© 2024 Carbon Factor Matcher. All rights reserved.
