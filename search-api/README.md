# Search API

Mock implementation for `POST /api/search/hybrid`. It loads `../data/bm25-index.json` and `../data/vector-index.json`, combines BM25, vector, and metadata boosts, and returns ranked chunks.

This is intentionally simple for the first version. Production deployments can replace the vector placeholder with sqlite-vec, Qdrant, or pgvector without changing the request/response contract.
