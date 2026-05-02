import { readJson, writeJson } from './shared.mjs';
const source = readJson('chunks.json');
const docs = source.chunks.map((chunk) => ({ ...chunk, terms: chunk.text.toLowerCase().split(/[^a-z0-9\u4e00-\u9fff_.-]+/).filter(Boolean) }));
writeJson('bm25-index.json', { generated_at: new Date().toISOString(), chunks: docs });
console.log('indexed ' + docs.length + ' chunks for bm25');
