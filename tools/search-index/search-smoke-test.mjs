import { readJson } from './shared.mjs';
const { chunks } = readJson('bm25-index.json');
const queries = [
  { query: 'build failure', expectedPaths: ['runbooks/build-failure.md', 'en/runbooks/build-failure.md'] },
  { query: 'dependency upgrade', expectedPaths: ['runbooks/dependency-upgrade.md', 'en/runbooks/dependency-upgrade.md'] },
  { query: 'CVE', expectedPaths: ['security/verified-risk-notes.md', 'security/dependency-vulnerability-triage.md', 'en/security/verified-risk-notes.md'] },
  { query: 'agent compatibility', expectedPaths: ['ai-guide/agent-readable-contract.md', 'getting-started/for-ai-agents.md', 'en/ai-guide/agent-readable-contract.md'] },
  { query: 'API auth', expectedPaths: ['api-map/auth-api.md', 'en/api-map/auth-api.md'] },
  { query: 'docker build', expectedPaths: ['build-and-test/docker-build.md', 'runbooks/docker-image-error.md', 'en/build-and-test/docker-build.md'] },
  { query: 'database migration', expectedPaths: ['runbooks/database-migration-error.md', 'architecture/database-and-migrations.md', 'en/runbooks/database-migration-error.md'] }
];
const failures = [];
for (const { query, expectedPaths } of queries) {
  const terms = query.toLowerCase().split(/\s+/);
  const hits = chunks.filter((chunk) => terms.some((term) => [chunk.title, chunk.heading, chunk.text, chunk.path].join(' ').toLowerCase().includes(term)));
  const expectedHit = hits.find((chunk) => expectedPaths.includes(chunk.path));
  if (!expectedHit) failures.push(`${query} expected one of ${expectedPaths.join(', ')}`);
  else console.log(query + ': ' + expectedHit.title + ' (' + expectedHit.path + ')');
}
if (failures.length) { console.error('missing search hits: ' + failures.join('; ')); process.exit(1); }
