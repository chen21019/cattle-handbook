import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsDir = path.join(root, 'docs-site', 'src', 'content', 'docs');
const enDir = path.join(docsDir, 'en');
const today = '2026-05-02';

const titles = new Map(Object.entries({
  'overview/what-is-this.md': '這是什麼',
  'overview/project-scope.md': '專案範圍',
  'overview/non-goals.md': '非目標',
  'overview/legal-and-license.md': '法律與授權',
  'overview/glossary.md': '術語表',
  'getting-started/for-human-maintainers.md': '給人類維護者',
  'getting-started/for-ai-agents.md': '給 AI Agent',
  'getting-started/local-dev-environment.md': '本機開發環境',
  'getting-started/repository-map.md': 'Repository 地圖',
  'getting-started/first-build.md': '第一次建置',
  'architecture/rancher-1-6-overview.md': 'Rancher 1.6 架構總覽',
  'architecture/cattle-components.md': 'Cattle 元件',
  'architecture/api-server.md': 'API Server',
  'architecture/agent-architecture.md': 'Agent 架構',
  'architecture/ui-architecture.md': 'UI 架構',
  'architecture/database-and-migrations.md': '資料庫與 Migration',
  'architecture/networking.md': '網路架構',
  'architecture/authentication-and-authorization.md': '認證與授權',
  'architecture/external-services.md': '外部服務',
  'dependency-map/index.md': '依賴地圖',
  'dependency-map/java-dependencies.md': 'Java 依賴',
  'dependency-map/go-dependencies.md': 'Go 依賴',
  'dependency-map/node-dependencies.md': 'Node 依賴',
  'dependency-map/docker-images.md': 'Docker 映像',
  'dependency-map/archived-upstream-projects.md': '已封存的上游專案',
  'dependency-map/risk-matrix.md': '風險矩陣',
  'build-and-test/build-prerequisites.md': '建置前置需求',
  'build-and-test/build-rancher-server.md': '建置 Rancher Server',
  'build-and-test/build-agent.md': '建置 Agent',
  'build-and-test/build-ui.md': '建置 UI',
  'build-and-test/docker-build.md': 'Docker 建置',
  'build-and-test/test-strategy.md': '測試策略',
  'build-and-test/ci-pipeline.md': 'CI 流程',
  'maintenance/maintenance-policy.md': '維護政策',
  'maintenance/branch-strategy.md': 'Branch 策略',
  'maintenance/issue-triage.md': 'Issue 分流',
  'maintenance/patch-workflow.md': 'Patch 工作流程',
  'maintenance/code-review-checklist.md': 'Code Review 檢查清單',
  'maintenance/release-checklist.md': 'Release 檢查清單',
  'security/security-overview.md': '安全總覽',
  'security/known-eol-risks.md': '已知 EOL 風險',
  'security/dependency-vulnerability-triage.md': '依賴弱點分流',
  'security/secrets-handling.md': 'Secrets 處理',
  'security/threat-model.md': '威脅模型',
  'security/security-patch-process.md': '安全修補流程',
  'ai-guide/index.md': 'AI 維護指南',
  'ai-guide/codex-cli-goal-guide.md': 'Codex CLI /goal 指南',
  'ai-guide/agent-readable-contract.md': 'AI Agent 可讀契約',
  'ai-guide/safe-editing-rules.md': '安全編輯規則',
  'ai-guide/prompt-library.md': 'Prompt 範本庫',
  'ai-guide/task-breakdown-template.md': '任務拆解範本',
  'ai-guide/verification-checklist.md': '驗證檢查清單',
  'runbooks/build-failure.md': '建置失敗 Runbook',
  'runbooks/dependency-upgrade.md': '依賴升級 Runbook',
  'runbooks/broken-api.md': 'API 異常 Runbook',
  'runbooks/ui-build-error.md': 'UI 建置錯誤 Runbook',
  'runbooks/docker-image-error.md': 'Docker 映像錯誤 Runbook',
  'runbooks/database-migration-error.md': '資料庫 Migration 錯誤 Runbook',
  'runbooks/release-failure.md': 'Release 失敗 Runbook',
  'api-map/index.md': 'API 地圖',
  'api-map/cattle-api-overview.md': 'Cattle API 總覽',
  'api-map/auth-api.md': 'Auth API',
  'api-map/environment-api.md': 'Environment API',
  'api-map/project-api.md': 'Project API',
  'api-map/service-api.md': 'Service API',
  'api-map/stack-api.md': 'Stack API',
  'search/index.md': '搜尋',
  'search/search-architecture.md': '搜尋架構',
  'search/bm25-search.md': 'BM25 搜尋',
  'search/vector-search.md': '向量搜尋',
  'search/hybrid-ranking.md': '混合排序',
  'search/indexing-pipeline.md': '索引流程',
  'search/search-api.md': '搜尋 API',
  'search/search-maintenance.md': '搜尋維護',
  'site-maintenance/index.md': '文件站維護',
  'site-maintenance/content-style-guide.md': '內容風格指南',
  'site-maintenance/information-architecture.md': '資訊架構',
  'site-maintenance/add-new-page.md': '新增頁面',
  'site-maintenance/update-existing-page.md': '更新既有頁面',
  'site-maintenance/diagram-guidelines.md': '圖表指南',
  'site-maintenance/search-index-maintenance.md': '搜尋索引維護',
  'site-maintenance/release-docs-site.md': '發布文件站',
  'site-maintenance/broken-link-check.md': 'Broken Link 檢查',
  'site-maintenance/visual-regression.md': '視覺回歸檢查',
  'site-maintenance/ai-maintained-docs-workflow.md': 'AI 維護文件流程',
  'changelog/index.md': '變更紀錄',
  'changelog/migration-notes.md': 'Migration Notes',
  'changelog/upstream-history.md': '上游歷史'
}));

const phraseReplacements = [
  ['## Intended Audience', '## 適用讀者'],
  ['## Purpose', '## 目的'],
  ['## Human Maintainer Checklist', '## 人類維護者檢查清單'],
  ['## AI Agent Checklist', '## AI Agent 檢查清單'],
  ['## Verification Commands Placeholder', '## 驗證指令佔位'],
  ['## Risks', '## 風險'],
  ['## Next Reading', '## 下一步閱讀'],
  ['## Diagram', '## 圖表'],
  ['## Position', '## 定位'],
  ['## Production Warning', '## Production 使用警告'],
  ['## Known Risk Families', '## 已知風險類型'],
  ['## Support Scope', '## 支援範圍'],
  ['## Threat Model Requirements', '## 威脅模型需求'],
  ['### Must read first', '### 必須先讀'],
  ['### Allowed actions', '### 允許動作'],
  ['### Forbidden actions', '### 禁止動作'],
  ['### Required checks', '### 必要檢查'],
  ['### Verification', '### 驗證'],
  ['### Rollback', '### 回滾'],
  ['### Output format', '### 輸出格式'],
  ['This page serves human maintainers who need a practical starting point and AI agents that need explicit safety boundaries.', '本頁服務需要實用起點的人類維護者，以及需要明確安全邊界的 AI Agent。'],
  ['It should be updated whenever the related repository, dependency, or workflow changes.', '相關 repository、依賴或工作流程改變時，必須同步更新本頁。'],
  ['Confirm the affected Rancher 1.6 repository and branch.', '確認受影響的 Rancher 1.6 repository 與 branch。'],
  ['Compare the change against legacy behavior and API compatibility.', '對照 legacy 行為與 API 相容性。'],
  ['Capture exact build, test, Docker, and database evidence.', '保留明確的 build、test、Docker 與 database 驗證證據。'],
  ['Update release notes when user-visible behavior changes.', '若有使用者可見行為變更，必須更新 release notes。'],
  ['Read `AGENTS.md` before editing.', '編輯前先閱讀 `AGENTS.md`。'],
  ['Produce a task summary with scope, risk, verification, and rollback.', '先產出包含範圍、風險、驗證與 rollback 的任務摘要。'],
  ['Prefer the smallest patch and avoid unrelated formatting changes.', '優先採用最小 patch，避免無關格式化變更。'],
  ['Keep EOL and production-risk warnings intact.', '保留 EOL 與 production 風險警告。'],
  ['Rancher 1.6 is legacy/EOL and may contain unpatched CVEs.', 'Rancher 1.6 屬於 legacy/EOL，可能仍有未修補 CVE。'],
  ['Modern Java, Go, Node, Docker, and database behavior can break old assumptions.', '現代 Java、Go、Node、Docker 與資料庫行為可能破壞舊版假設。'],
  ['Server, agent, metadata, DNS, catalog, and UI compatibility must be preserved.', '必須保留 server、agent、metadata、DNS、catalog 與 UI 相容性。'],
  ['Inspect files and build metadata.', '檢查檔案與 build metadata。'],
  ['Propose small scoped edits.', '提出小範圍修改。'],
  ['Update documentation, diagrams, and verification evidence.', '更新文件、圖表與驗證證據。'],
  ['Do not remove EOL/security disclaimers.', '不可移除 EOL / security disclaimer。'],
  ['Do not perform broad formatting churn.', '不可進行大規模格式化 churn。'],
  ['Do not change major dependencies without an explicit compatibility plan.', '沒有明確相容性計畫時，不可更動 major dependencies。'],
  ['Do not delete tests to make a build pass.', '不可為了讓 build 通過而刪除測試。'],
  ['Inspect git status before editing.', '編輯前檢查 git status。'],
  ['Identify affected repos and legacy compatibility surface.', '識別受影響 repo 與 legacy 相容性範圍。'],
  ['Run the narrowest relevant validation commands.', '執行最窄且相關的驗證指令。'],
  ['Use the commands below as placeholders until a repo-specific command is proven.', '在 repo-specific 指令被驗證前，先使用下方指令作為佔位。'],
  ['Revert only your own changes, preserve user work, and document why rollback was needed.', '只回滾自己的變更，保留使用者工作，並記錄需要 rollback 的原因。'],
  ['Return changed files, summary, tests run, tests not run and why, known risks, and next steps.', '回報 changed files、summary、tests run、tests not run and why、known risks 與 next steps。']
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    const rel = path.relative(docsDir, full).replaceAll(path.sep, '/');
    if (name === 'en') return [];
    return statSync(full).isDirectory() ? walk(full) : rel.endsWith('.md') ? [rel] : [];
  });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function zhDescription(rel, title) {
  const section = rel.split('/')[0];
  const sectionMap = {
    overview: '說明 Rancher 1.6 維護手冊的定位、邊界與閱讀起點。',
    'getting-started': '協助第一次接觸 Rancher 1.6 的維護者安全開始。',
    architecture: '整理 Rancher 1.6 / Cattle 的元件關係與架構脈絡。',
    'dependency-map': '記錄依賴、風險、升級限制與驗證方式。',
    'build-and-test': '整理建置、測試、CI 與可重現驗證流程。',
    maintenance: '定義 legacy 維護、patch、review 與 release 流程。',
    security: '說明 EOL 風險、安全分流、威脅模型與修補流程。',
    'ai-guide': '提供 AI Agent 安全維護 Rancher 1.6 的操作契約。',
    runbooks: '提供問題排查、修補、驗證與 rollback 的可操作 runbook。',
    'api-map': '整理 Rancher 1.6 API 行為、相容性與檢查重點。',
    search: '說明 BM25、向量搜尋、混合排序與索引維護。',
    'site-maintenance': '說明文件站本身的新增、更新、驗證與發布流程。',
    changelog: '記錄維護歷史、migration notes 與上游對照。'
  };
  return `${title}：${sectionMap[section] ?? 'Rancher 1.6 維護文件。'}`;
}

function copyEnglishSource(files) {
  if (existsSync(enDir)) return;
  for (const rel of files) {
    const src = path.join(docsDir, rel);
    const dest = path.join(enDir, rel);
    mkdirSync(path.dirname(dest), { recursive: true });
    cpSync(src, dest);
  }
}

function localizeFile(rel) {
  if (rel === 'index.md') return;
  const file = path.join(docsDir, rel);
  let text = readFileSync(file, 'utf8');
  const title = titles.get(rel);
  if (title) {
    text = text.replace(/^title:\s*".*?"$/m, `title: "${title}"`);
    text = text.replace(/^description:\s*".*?"$/m, `description: "${zhDescription(rel, title)}"`);
  }
  text = text.replace(/^last_verified:\s*".*?"$/m, `last_verified: "${today}"`);
  for (const [from, to] of phraseReplacements) {
    text = text.replaceAll(from, to);
  }
  text = text.replace(/Defines the handbook mission and maintenance boundaries\./g, '定義本維護手冊的使命與維護邊界。');
  text = text.replace(/This page documents (.+?) for Rancher 1\.6 maintenance\./g, '本頁記錄 Rancher 1.6 維護中的 $1。');
  text = text.replace(/It provides a practical skeleton for maintainers and AI agents\./g, '它提供人類維護者與 AI Agent 都能使用的實用骨架。');
  text = text.replace(/圖名：(.+?) Flow/g, '圖名：$1 流程');
  text = text.replace(/用途：把 (.+?) 轉成可執行的維護流程。/g, '用途：把 $1 轉成可執行的維護流程。');
  writeFileSync(file, text);
}

const files = walk(docsDir);
copyEnglishSource(files);
for (const rel of files) {
  localizeFile(rel);
}

console.log(`Localized ${files.length} root docs and preserved ${files.length} English docs under ${path.relative(root, enDir)}.`);
