import { readJson } from './shared.mjs';
const { chunks } = readJson('chunks.json');
const bm25 = readJson('bm25-index.json');
const vector = readJson('vector-index.json');
const vectorIds = new Set(vector.vectors.map((item) => item.chunk_id));
const errors = [];
for (const chunk of chunks) {
  for (const key of ['chunk_id', 'title', 'path', 'url', 'section', 'text']) if (!chunk[key]) errors.push((chunk.chunk_id || chunk.path) + ': missing ' + key);
  if (!vectorIds.has(chunk.chunk_id)) errors.push(chunk.chunk_id + ': missing vector');
  if (chunk.text.length > 4200) errors.push(chunk.chunk_id + ': chunk too large');
}
if (bm25.chunks.length !== chunks.length) errors.push('bm25 chunk count mismatch');
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('validated ' + chunks.length + ' chunks');
