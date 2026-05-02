import path from 'node:path';
import fs from 'node:fs';
import { docsRoot, listMarkdown, parseFrontmatter, stableId, writeJson } from './shared.mjs';

const chunks = [];
for (const file of listMarkdown()) {
  const rel = path.relative(docsRoot, file).replaceAll('\\', '/');
  const slug = rel.replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '$1').replace(/\/$/, '') || 'index';
  const text = fs.readFileSync(file, 'utf8');
  const { fm, body } = parseFrontmatter(text);
  const sections = body.split(/\n(?=##\s+)/g);
  sections.forEach((section, index) => {
    const heading = section.match(/^##\s+(.+)$/m)?.[1] || fm.title || slug;
    const clean = section.replace(new RegExp('```[\\s\\S]*?```', 'g'), ' code block ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!clean) return;
    const chunkBase = [rel, heading, index].join(':');
    chunks.push({
      chunk_id: slug.replaceAll('/', '-') + '-' + stableId(chunkBase),
      title: fm.title || slug,
      heading,
      path: rel,
      url: '/' + (slug === 'index' ? '' : slug + '/'),
      section: slug.split('/')[0],
      audience: Array.isArray(fm.audience) ? fm.audience : ['human-maintainer', 'ai-agent'],
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      search_priority: fm.search_priority || 'normal',
      updated_at: fm.last_verified || '',
      text: clean.slice(0, 4200)
    });
  });
}
writeJson('chunks.json', { generated_at: new Date().toISOString(), chunks });
console.log('chunked ' + chunks.length + ' docs chunks');
