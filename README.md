# Cattle Handbook

Rancher 1.6 Legacy Maintenance Handbook is a human-friendly and AI-agent-ready documentation site for maintaining the classic Cattle platform.

## Structure

- `docs-site/`: Astro Starlight documentation site with a sakura pastel engineering theme.
- `search-api/`: mockable hybrid search API design for BM25 plus vector search.
- `tools/search-index/`: local index pipeline for chunks, BM25 data, vector placeholders, validation, and smoke tests.
- `AGENTS.md`: operating contract for Codex CLI and other AI agents.

## Quick Start

```powershell
npm run bootstrap
npm run search:rebuild
npm run build
npm run dev
```

The documentation site runs from `docs-site/`. The repository inventory is generated from sibling `../rancher-1.6-*` repositories.

## Maintenance Warnings

Rancher 1.6 is legacy/EOL software. This handbook documents risk reduction, reproducible builds, compatibility preservation, and careful patch workflow. It does not claim that Rancher 1.6 can be made equivalent to a modern supported security platform.
