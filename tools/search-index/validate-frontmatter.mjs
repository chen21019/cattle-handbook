import fs from 'node:fs';
import { listMarkdown, parseFrontmatter } from './shared.mjs';
const required = ['title', 'description', 'audience', 'tags', 'diagram_required', 'search_priority', 'last_verified'];
const errors = [];
for (const file of listMarkdown()) {
  const { fm, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));
  for (const key of required) if (!(key in fm)) errors.push(file + ': missing ' + key);
  if (!/```mermaid/.test(body)) errors.push(file + ': missing mermaid diagram');
  if (!/圖名：/.test(body)) errors.push(file + ': missing figure caption');
  if (!/Human Maintainer Checklist|人類維護者檢查清單|Quick Entrances|快速入口/.test(body)) errors.push(file + ': missing human maintainer checklist');
  if (!/AI Agent Checklist|AI Agent 檢查清單|AI Agent Contract|AI Agent 作業契約|AI Maintenance Guide|AI 維護指南/.test(body)) errors.push(file + ': missing AI checklist/contract');
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log('validated frontmatter and diagrams for ' + listMarkdown().length + ' docs');
