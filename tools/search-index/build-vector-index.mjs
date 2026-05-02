import { readJson, stableId, writeJson } from './shared.mjs';
const source = readJson('chunks.json');
const vectors = source.chunks.map((chunk) => {
  const seed = stableId(chunk.chunk_id + chunk.text);
  const values = Array.from({ length: 16 }, (_, index) => Number((((parseInt(seed, 16) + index * 2654435761) % 1000) / 1000).toFixed(3)));
  return { chunk_id: chunk.chunk_id, model: 'placeholder-deterministic-vector-v1', values };
});
writeJson('vector-index.json', { generated_at: new Date().toISOString(), note: 'Placeholder vectors; replace with sqlite-vec, Qdrant, or pgvector embeddings before production semantic search.', vectors });
console.log('built ' + vectors.length + ' placeholder vectors');
