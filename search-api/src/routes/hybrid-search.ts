import fs from 'node:fs';
import path from 'node:path';
import { finalScore, type SearchResult } from '../search/ranker.js';

type Query = { query: string; limit?: number; filters?: { section?: string; audience?: string } };

function tokenize(value: string) {
  return value.toLowerCase().split(/[^a-z0-9\u4e00-\u9fff_.-]+/).filter(Boolean);
}

export function hybridSearch(input: Query): { query: string; results: SearchResult[] } {
  const dataFile = path.resolve(process.cwd(), '..', 'data', 'bm25-index.json');
  const raw = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : { chunks: [] };
  const terms = tokenize(input.query);
  const results = raw.chunks
    .filter((chunk: any) => !input.filters?.section || chunk.section === input.filters.section)
    .filter((chunk: any) => !input.filters?.audience || chunk.audience?.includes(input.filters.audience))
    .map((chunk: any) => {
      const haystack = tokenize([chunk.title, chunk.heading, chunk.text, chunk.path].join(' '));
      const hits = terms.filter((term) => haystack.some((word) => word.includes(term))).length;
      const bm25 = terms.length ? hits / terms.length : 0;
      const vector = Math.min(1, bm25 * 0.82 + (chunk.search_priority === 'high' ? 0.12 : 0.04));
      const metadata = (chunk.title.toLowerCase().includes(input.query.toLowerCase()) ? 0.4 : 0) + (chunk.search_priority === 'high' ? 0.3 : 0.1);
      return {
        title: chunk.title,
        path: chunk.url,
        section: chunk.section,
        score: finalScore(bm25, vector, metadata),
        bm25_score: Number(bm25.toFixed(4)),
        vector_score: Number(vector.toFixed(4)),
        snippet: chunk.text.slice(0, 180),
        chunk_id: chunk.chunk_id
      };
    })
    .filter((result: SearchResult) => result.score > 0)
    .sort((a: SearchResult, b: SearchResult) => b.score - a.score)
    .slice(0, input.limit || 10);
  return { query: input.query, results };
}
