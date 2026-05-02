export type SearchResult = { title: string; path: string; section: string; score: number; bm25_score: number; vector_score: number; snippet: string; chunk_id: string; };

export function finalScore(bm25: number, vector: number, metadataBoost: number) {
  return Number((0.55 * bm25 + 0.35 * vector + 0.10 * metadataBoost).toFixed(4));
}
