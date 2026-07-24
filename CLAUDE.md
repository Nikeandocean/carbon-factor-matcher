# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Carbon Factor Matcher is an MCP (Model Context Protocol) server that connects AI agents with carbon emission factor databases (ELCD ~600 factors, ecoinvent ~6,000+ factors). It provides `factor_match`, `factor_search`, and `factor_detail` tools for carbon accounting and LCA applications.

## Architecture

**Dual-language design**: Node.js launcher + Python core.

- `index.js` — npm entry point. Checks Python is available, auto-installs/upgrades the Python package from PyPI, then spawns `python -m carbon_factor_matcher`.
- `src/carbon_factor_matcher/` — Python MCP server package (published to PyPI). Entry point: `carbon_factor_matcher.server:main`.
  - `activity_processor.py` — Inventory data processor: deduplication, missing data substitution, sensitivity analysis. Imports from `.config`, `.models` (compiled modules).
  - `adapters/` — Database adapters (ecoinvent, etc.)
- `pages/` — Cloudflare Pages deployment (static site + Functions API)
  - `pages/functions/` — API endpoints (`/api/match`, `/api/search`, `/api/factor/[id]`, `/api/stats`, `/mcp`, `/checkout`, `/webhook`)
  - `pages/public/` — Static frontend
- `workers/` — Embedding computation scripts and pre-computed data
  - `compute_embeddings.py` — Pre-computes factor embeddings via DashScope API
  - `factors.json`, `embeddings.json`, `embeddings.bin`, `embeddings_index.json` — Pre-computed factor data
- `data/factors/` — ELCD database (zip + extracted JSON files)
- `tests/` — pytest test suite
- `figures/` — Experiment scripts and R visualization code
- `site/` — Built static site for GitHub Pages

## Git Branches

- `main` — Default branch on GitHub. Hosts public files (site, docs, SKILL.md). Used by Smithery.ai and GitHub Pages (via Actions workflow).
- `master` — Local only, no remote tracking. Contains core source code. **Never push to GitHub.**

⚠️ **Core code (`src/`, `tests/`, `workers/`, `data/`) must NOT be committed to `main` branch.** The `.gitignore` enforces this.

## Common Commands

```bash
# Install in development mode
pip install -e ".[dev]"

# Run tests
python -m pytest tests/ -v
python -m pytest tests/test_activity_processor.py -v  # single test file

# Build wheel
python -m build --wheel

# Publish to PyPI
twine upload dist/*

# Publish npm (auto-syncs from PyPI)
npm publish

# Compute embeddings (requires DASHSCOPE_API_KEY)
python workers/compute_embeddings.py

# Run Cloudflare Pages locally
npx wrangler pages dev pages/public --r2 CARBON_FACTORS
```

## Key Dependencies

- `mcp>=1.0.0` — MCP protocol SDK
- `sentence-transformers>=3.0.0` — Embedding model for semantic search
- `numpy>=1.24.0` — Numerical operations
- `openpyxl>=3.1.0` — Excel file support

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CARBON_FACTOR_LICENSE_KEY` | Pro license key (empty = Free tier) |
| `CARBON_FACTOR_DATA_DIR` | Path to factor data directory (default: `data/factors`) |
| `DASHSCOPE_API_KEY` | For computing embeddings (workers only) |

## Publishing Flow

1. Code changes → commit to local `master`
2. Build wheel: `pip wheel . --no-deps -w dist/`
3. Publish to PyPI: `twine upload dist/*`
4. npm auto-syncs from PyPI (launcher installs latest Python package)
5. GitHub Pages: push site files to `main` branch (auto-deploys via GitHub Actions)
6. Cloudflare Pages: `wrangler pages deploy site --project-name carbon-factor-matcher --branch public`

## Testing

Tests use pytest with `asyncio_mode = "auto"`. The `ActivityDataProcessor` tests use `skip_embedding=True` to avoid loading the sentence-transformers model in unit tests.
