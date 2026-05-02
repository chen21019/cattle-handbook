# Search Index Tools

Pipeline:

1. `chunk-docs.mjs` scans `docs-site/src/content/docs/**/*.md`, parses frontmatter, preserves heading hierarchy, and writes stable chunks.
2. `build-bm25-index.mjs` builds a lightweight BM25-like keyword index for local smoke tests and the mock API.
3. `build-vector-index.mjs` writes deterministic placeholder vectors until sqlite-vec/Qdrant/pgvector is enabled.
4. `validate-search-index.mjs` checks required fields and chunk size.
5. `search-smoke-test.mjs` tests build failure, dependency upgrade, CVE, agent compatibility, API auth, docker build, and database migration queries.
