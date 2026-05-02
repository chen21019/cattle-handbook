import { describe, expect, it } from 'vitest';
import { finalScore } from '../src/search/ranker.js';

describe('hybrid ranking', () => {
  it('uses bm25, vector, and metadata weights', () => {
    expect(finalScore(0.82, 0.88, 0.5)).toBe(0.809);
  });
});
