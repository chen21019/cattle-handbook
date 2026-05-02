import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const docsRoot = path.join(root, 'docs-site', 'src', 'content', 'docs');
export const dataRoot = path.join(root, 'data');

export function ensureData() { fs.mkdirSync(dataRoot, { recursive: true }); }
export function readJson(name) { return JSON.parse(fs.readFileSync(path.join(dataRoot, name), 'utf8')); }
export function writeJson(name, value) { ensureData(); fs.writeFileSync(path.join(dataRoot, name), JSON.stringify(value, null, 2)); }
export function listMarkdown(dir = docsRoot) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listMarkdown(full));
    if (entry.isFile() && /\.mdx?$/.test(entry.name)) out.push(full);
  }
  return out;
}
export function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  const fm = {};
  if (!m) return { fm, body: text };
  const lines = m[1].split(/\r?\n/);
  let key = null;
  for (const line of lines) {
    const kv = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (kv) { key = kv[1]; fm[key] = kv[2].replace(/^"|"$/g, ''); if (fm[key] === '') fm[key] = []; continue; }
    const item = line.match(/^\s+-\s+(.*)$/);
    if (item && key) { if (!Array.isArray(fm[key])) fm[key] = []; fm[key].push(item[1]); }
  }
  return { fm, body: text.slice(m[0].length) };
}
export function stableId(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24); }
  return (hash >>> 0).toString(16);
}
