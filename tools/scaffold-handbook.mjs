import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const verified = '2026-05-02';
const docsRoot = path.join(root, 'docs-site', 'src', 'content', 'docs');
const parent = path.resolve(root, '..');

const buildNames = new Set([
  'pom.xml',
  'build.gradle',
  'gradle.properties',
  'package.json',
  'yarn.lock',
  'bower.json',
  'go.mod',
  'Godeps',
  'Godeps.json',
  'glide.yaml',
  'Dockerfile',
  'docker-compose.yml',
  'Makefile',
  'Jenkinsfile'
]);

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function write(file, content) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content.replace(/\n/g, '\r\n'));
}

function slugTitle(slug) {
  return slug
    .split(/[/-]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function walk(dir, visitor, depth = 0) {
  if (depth > 8) return;
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'vendor' || entry.name === 'target' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, visitor, depth + 1);
    else visitor(full, entry.name);
  }
}

function findRepos() {
  return fs.readdirSync(parent, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith('rancher-1.6-'))
    .map((entry) => {
      const dir = path.join(parent, entry.name);
      const info = {
        name: entry.name,
        path: path.relative(root, dir).replaceAll('\\', '/'),
        buildFiles: [],
        tests: [],
        ci: [],
        licenses: [],
        upstreamHints: [],
        dependencies: []
      };
      walk(dir, (file, name) => {
        const rel = path.relative(dir, file).replaceAll('\\', '/');
        if (buildNames.has(name) || rel.includes('/.github/workflows/')) info.buildFiles.push(rel);
        if (/test|spec/i.test(rel) && !rel.includes('/vendor/')) info.tests.push(rel);
        if (rel.includes('.github/workflows') || name === 'Jenkinsfile' || rel.includes('/ci/')) info.ci.push(rel);
        if (/^license/i.test(name)) info.licenses.push(rel);
        if (/upstream|rancher\/|github.com\/rancher/i.test(readSmall(file))) info.upstreamHints.push(rel);
        collectDependencies(file, rel, info);
      });
      return info;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

function readSmall(file) {
  try {
    const stat = fs.statSync(file);
    if (stat.size > 500_000) return '';
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function collectDependencies(file, rel, info) {
  const name = path.basename(file);
  const text = readSmall(file);
  if (!text) return;
  if (name === 'package.json') {
    try {
      const json = JSON.parse(text);
      for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
        for (const [dep, version] of Object.entries(json[section] || {})) {
          info.dependencies.push({ ecosystem: 'node', name: dep, version: String(version), path: rel, risk: nodeRisk(dep, version) });
        }
      }
    } catch {}
  }
  if (name === 'bower.json') {
    try {
      const json = JSON.parse(text);
      for (const [dep, version] of Object.entries(json.dependencies || {})) {
        info.dependencies.push({ ecosystem: 'bower', name: dep, version: String(version), path: rel, risk: 'high' });
      }
    } catch {}
  }
  if (name === 'pom.xml') {
    const matches = [...text.matchAll(/<dependency>[\s\S]*?<groupId>(.*?)<\/groupId>[\s\S]*?<artifactId>(.*?)<\/artifactId>[\s\S]*?(?:<version>(.*?)<\/version>)?[\s\S]*?<\/dependency>/g)];
    for (const match of matches.slice(0, 120)) {
      info.dependencies.push({ ecosystem: 'maven', name: `${match[1]}:${match[2]}`, version: match[3] || 'managed/TODO', path: rel, risk: mavenRisk(match[1], match[2], match[3]) });
    }
  }
  if (name === 'go.mod') {
    for (const line of text.split(/\r?\n/)) {
      const m = line.trim().match(/^([^\s]+)\s+(v[^\s]+)/);
      if (m) info.dependencies.push({ ecosystem: 'go', name: m[1], version: m[2], path: rel, risk: goRisk(m[1]) });
    }
  }
  if (name === 'glide.yaml') {
    for (const m of text.matchAll(/package:\s*([^\s]+)/g)) {
      info.dependencies.push({ ecosystem: 'glide', name: m[1], version: 'locked/TODO', path: rel, risk: goRisk(m[1]) });
    }
  }
  if (name === 'Dockerfile') {
    for (const m of text.matchAll(/^FROM\s+([^\s]+)/gmi)) {
      info.dependencies.push({ ecosystem: 'docker', name: m[1].split(':')[0], version: m[1].split(':')[1] || 'latest/TODO', path: rel, risk: 'high' });
    }
  }
}

function nodeRisk(dep, version) {
  const text = `${dep} ${version}`;
  if (/bower|ember|gulp|grunt|phantom|node-sass|request|coffee/i.test(text)) return 'high';
  return 'medium';
}

function mavenRisk(group, artifact, version = '') {
  const text = `${group} ${artifact} ${version}`;
  if (/log4j|spring|jetty|mysql|mariadb|jackson|commons|jooq|liquibase/i.test(text)) return 'high';
  return 'medium';
}

function goRisk(dep) {
  if (/docker|rancher|gorilla|jwt|crypto|x\/net/i.test(dep)) return 'high';
  return 'medium';
}

const repos = findRepos();
const inventory = {
  generated_at: new Date().toISOString(),
  source_root: parent.replaceAll('\\', '/'),
  repo_count: repos.length,
  repos
};
write(path.join(root, 'data', 'repository-inventory.json'), JSON.stringify(inventory, null, 2));

const repoRows = repos.map((repo) => `| ${repo.name} | ${repo.buildFiles.slice(0, 4).join('<br>') || 'TODO scan deeper'} | ${repo.tests.length} | ${repo.ci.slice(0, 3).join('<br>') || 'Not found'} | ${repo.licenses.slice(0, 2).join('<br>') || 'Check upstream'} |`).join('\n');
const depRows = repos.flatMap((repo) => repo.dependencies.slice(0, 20).map((dep) => ({ repo: repo.name, ...dep })));
const riskRows = depRows.slice(0, 160).map((dep) => `| ${dep.name} | ${dep.ecosystem} | ${dep.repo} / ${dep.path} | ${dep.version} | TODO query upstream | ${dep.risk} | ${/auth|jwt|crypto|ssl|secret|mysql|mariadb|docker|net|spring|jetty/i.test(dep.name) ? 'yes' : 'review'} | no | likely | targeted build + regression test |`).join('\n');

const docs = [
  ['overview/what-is-this', 'What Is This', 'Defines the handbook mission and maintenance boundaries.'],
  ['overview/project-scope', 'Project Scope', 'Maps which Rancher 1.6 forks and maintenance surfaces belong in scope.'],
  ['overview/non-goals', 'Non Goals', 'Clarifies what this legacy handbook does not promise.'],
  ['overview/legal-and-license', 'Legal And License', 'Preserves original license and attribution expectations.'],
  ['overview/glossary', 'Glossary', 'Explains Cattle, stack, service, host, agent, metadata, and legacy terms.'],
  ['getting-started/for-human-maintainers', '給人類維護者', '給剛接手 Rancher 1.6 維護工作的第一週學習路徑。'],
  ['getting-started/for-ai-agents', 'For AI Agents', 'Entry contract and safe workflow for Codex CLI and AI maintainers.'],
  ['getting-started/local-dev-environment', 'Local Dev Environment', 'Documents Java, Go, Node, Docker, and OS assumptions.'],
  ['getting-started/repository-map', 'Repository Map', 'Inventory of related Rancher 1.6 repositories and build surfaces.'],
  ['getting-started/first-build', 'First Build', 'Guides the first reproducible build attempt and evidence capture.'],
  ['architecture/rancher-1-6-overview', 'Rancher 1.6 Overview', 'High-level architecture of the legacy Cattle platform.'],
  ['architecture/cattle-components', 'Cattle Components', 'Explains core Cattle modules and their responsibilities.'],
  ['architecture/api-server', 'API Server', 'Describes API server request handling and compatibility risk.'],
  ['architecture/agent-architecture', 'Agent Architecture', 'Explains host agent communication and upgrade constraints.'],
  ['architecture/ui-architecture', 'UI Architecture', 'Documents the legacy UI stack and build risks.'],
  ['architecture/database-and-migrations', 'Database And Migrations', 'Explains schema migrations and rollback posture.'],
  ['architecture/networking', 'Networking', 'Maps rancher-net, DNS, metadata, and scheduler responsibilities.'],
  ['architecture/authentication-and-authorization', 'Authentication And Authorization', 'Documents auth-service and local/external auth risk.'],
  ['architecture/external-services', 'External Services', 'Lists service discovery, catalog, registries, cloud providers, and image dependencies.'],
  ['dependency-map/index', '依賴地圖', 'Dependency map entry point and maintenance rules.'],
  ['dependency-map/java-dependencies', 'Java Dependencies', 'Maven and Java dependency inventory guidance.'],
  ['dependency-map/go-dependencies', 'Go Dependencies', 'Go, Glide, and GOPATH-era dependency guidance.'],
  ['dependency-map/node-dependencies', 'Node Dependencies', 'Node, npm, Bower, and UI dependency guidance.'],
  ['dependency-map/docker-images', 'Docker Images', 'Docker base image and runtime image inventory.'],
  ['dependency-map/archived-upstream-projects', 'Archived Upstream Projects', 'Tracks repos and packages with inactive upstreams.'],
  ['dependency-map/risk-matrix', 'Risk Matrix', 'Initial dependency risk matrix from workspace scan.'],
  ['build-and-test/build-prerequisites', 'Build Prerequisites', 'Required local tools and version strategy.'],
  ['build-and-test/build-rancher-server', 'Build Rancher Server', 'Build workflow for the server repo.'],
  ['build-and-test/build-agent', 'Build Agent', 'Build workflow for Rancher agent.'],
  ['build-and-test/build-ui', 'Build UI', 'Build workflow for legacy UI assets.'],
  ['build-and-test/docker-build', 'Docker Build', 'Docker build and image compatibility checks.'],
  ['build-and-test/test-strategy', 'Test Strategy', 'Test pyramid and targeted regression policy.'],
  ['build-and-test/ci-pipeline', 'CI Pipeline', 'CI expectations and artifact policy.'],
  ['maintenance/maintenance-policy', 'Maintenance Policy', 'Legacy support policy and compatibility rules.'],
  ['maintenance/branch-strategy', 'Branch Strategy', 'Branch naming, release tags, and hotfix structure.'],
  ['maintenance/issue-triage', 'Issue Triage', 'Bug source classification and prioritization.'],
  ['maintenance/patch-workflow', 'Patch Workflow', 'Operational workflow for safe Rancher 1.6 patches.'],
  ['maintenance/code-review-checklist', 'Code Review Checklist', 'Review checklist for legacy compatibility.'],
  ['maintenance/release-checklist', 'Release Checklist', 'Release readiness and rollback checklist.'],
  ['security/security-overview', 'Security Overview', 'Source-backed security posture and verification workflow.'],
  ['security/verified-risk-notes', '風險查證記錄', 'Source-backed security and operational risk notes.'],
  ['security/dependency-vulnerability-triage', 'Dependency Vulnerability Triage', 'CVE 分流 flow for old dependencies.'],
  ['security/secrets-handling', 'Secrets Handling', 'Secrets storage, transport, and logging precautions.'],
  ['security/threat-model', 'Threat Model', 'Threat model and isolation recommendations.'],
  ['security/security-patch-process', 'Security Patch Process', 'Security patch workflow and disclosure notes.'],
  ['ai-guide/index', 'AI Guide', 'AI agent entry point and operating contract.'],
  ['ai-guide/codex-cli-goal-guide', 'Codex CLI Goal Guide', 'How to use /goal for large maintenance tasks.'],
  ['ai-guide/agent-readable-contract', 'Agent Readable Contract', 'Machine-readable safety contract for AI changes.'],
  ['ai-guide/safe-editing-rules', 'Safe Editing Rules', 'Forbidden actions and required checks before code changes.'],
  ['ai-guide/prompt-library', 'Prompt Library', 'Copyable prompts for common maintenance tasks.'],
  ['ai-guide/task-breakdown-template', 'Task Breakdown Template', 'Template for splitting risky maintenance work.'],
  ['ai-guide/verification-checklist', 'Verification Checklist', 'Required final audit checklist for AI tasks.'],
  ['runbooks/build-failure', 'Build Failure', 'Runbook for build failures.'],
  ['runbooks/dependency-upgrade', 'Dependency Upgrade', 'Runbook for safe single-dependency upgrades.'],
  ['runbooks/broken-api', 'Broken API', 'Runbook for API 行為 regressions.'],
  ['runbooks/ui-build-error', 'UI Build Error', 'Runbook for legacy UI build failures.'],
  ['runbooks/docker-image-error', 'Docker Image Error', 'Runbook for image and runtime failures.'],
  ['runbooks/database-migration-error', 'Database Migration Error', 'Runbook for schema migration failures.'],
  ['runbooks/release-failure', 'Release Failure', 'Runbook for failed releases and rollback.'],
  ['api-map/index', 'API Map', 'API map entry point.'],
  ['api-map/cattle-api-overview', 'Cattle API Overview', 'Cattle API structure and compatibility policy.'],
  ['api-map/auth-api', 'Auth API', 'Auth API lifecycle and risk.'],
  ['api-map/environment-api', 'Environment API', 'Environment/project request behavior.'],
  ['api-map/project-api', 'Project API', 'Project model and compatibility notes.'],
  ['api-map/service-api', 'Service API', 'Service lifecycle and event flow.'],
  ['api-map/stack-api', 'Stack API', 'Stack lifecycle and compose executor relationship.'],
  ['search/index', 'Search', 'Search entry point for maintainers and AI agents.'],
  ['search/search-architecture', 'Search Architecture', 'BM25 plus vector hybrid search design.'],
  ['search/bm25-search', 'BM25 Search', 'Keyword and exact-match search behavior.'],
  ['search/vector-search', 'Vector Search', 'Vector search design and future database options.'],
  ['search/hybrid-ranking', 'Hybrid Ranking', 'Ranking formula and metadata boosts.'],
  ['search/indexing-pipeline', 'Indexing Pipeline', 'Chunking and index build flow.'],
  ['search/search-api', 'Search API', 'Hybrid search API request and response contract.'],
  ['search/search-maintenance', 'Search Maintenance', 'Search index freshness and smoke test rules.'],
  ['site-maintenance/index', 'Site Maintenance', 'Site maintenance entry point.'],
  ['site-maintenance/content-style-guide', 'Content Style Guide', 'Style rules for clear human and AI-readable docs.'],
  ['site-maintenance/information-architecture', 'Information Architecture', 'Navigation and section ownership rules.'],
  ['site-maintenance/add-new-page', 'Add New Page', 'Workflow for adding a page.'],
  ['site-maintenance/update-existing-page', 'Update Existing Page', 'Workflow for updating a page.'],
  ['site-maintenance/diagram-guidelines', 'Diagram Guidelines', 'Mermaid and figure caption requirements.'],
  ['site-maintenance/search-index-maintenance', 'Search Index Maintenance', 'How to rebuild and verify search indexes.'],
  ['site-maintenance/release-docs-site', 'Release Docs Site', 'Docs release process.'],
  ['site-maintenance/broken-link-check', 'Broken Link Check', 'Broken link validation process.'],
  ['site-maintenance/visual-regression', 'Visual Regression', 'Frontend regression and screenshot review process.'],
  ['site-maintenance/ai-maintained-docs-workflow', 'AI Maintained Docs Workflow', 'AI workflow for maintaining this site.'],
  ['changelog/index', 'Changelog', 'Documentation changelog entry point.'],
  ['changelog/migration-notes', 'Migration Notes', 'Notes for future framework or dependency migrations.'],
  ['changelog/upstream-history', 'Upstream History', 'Timeline for upstream Rancher 1.6 behavior and fork notes.']
];

function frontmatter(title, description, slug) {
  const section = slug.split('/')[0];
  const priority = /for-ai-agents|codex-cli|safe-editing|risk-matrix|patch-workflow|verified-risk|dependency-upgrade|repository-map|search-architecture|search-index-maintenance/.test(slug) ? 'high' : 'normal';
  return `---\ntitle: "${title}"\ndescription: "${description}"\naudience:\n  - human-maintainer\n  - ai-agent\ntags:\n  - rancher-1.6\n  - maintenance\n  - ${section}\ndiagram_required: true\nsearch_priority: ${priority}\nlast_verified: "${verified}"\n---\n\n`;
}

function diagramFor(title, slug) {
  const section = slug.split('/')[0];
  const label = `${title} Flow`;
  if (section === 'architecture') {
    return `\`\`\`mermaid\nflowchart LR\n  User[Human or AI maintainer] --> Docs[Handbook]\n  Docs --> Server[Rancher Server]\n  Server --> Cattle[Cattle Core]\n  Server --> DB[(Database)]\n  Server --> Agent[Agent]\n  Agent --> Host[Docker Host]\n  Server --> Metadata[Metadata and DNS]\n\`\`\`\n\n圖名：${label}\n用途：說明 ${title} 在 Rancher 1.6 維護知識中的位置。\nAI 用途：AI Agent 可先定位元件，再決定是否能安全修改。\n維護注意：若 repository map 或元件責任改變，必須同步更新此圖。\n`;
  }
  if (section === 'search') {
    return `\`\`\`mermaid\nflowchart LR\n  Query[Query] --> Pagefind[BM25 / Pagefind]\n  Query --> API[Hybrid Search API]\n  API --> Vector[Vector Index]\n  Pagefind --> Ranker[Ranker]\n  Vector --> Ranker\n  Ranker --> Results[Ranked Results]\n\`\`\`\n\n圖名：${label}\n用途：說明文件站如何結合精準字串搜尋與語意搜尋。\nAI 用途：AI Agent 可依錯誤訊息用 BM25，依任務語意用 vector search。\n維護注意：若替換 Pagefind、sqlite-vec、Qdrant 或 ranking formula，必須更新此圖。\n`;
  }
  if (section === 'runbooks') {
    return `\`\`\`mermaid\nflowchart TD\n  A[Symptom observed] --> B[First checks]\n  B --> C{Scope known?}\n  C -- No --> D[Collect logs and versions]\n  C -- Yes --> E[Apply smallest fix]\n  D --> B\n  E --> F[Verify]\n  F --> G{Pass?}\n  G -- No --> H[Rollback or escalate]\n  G -- Yes --> I[Document evidence]\n\`\`\`\n\n圖名：${label}\n用途：提供可重複的 troubleshooting decision tree。\nAI 用途：AI Agent 必須先做 first checks，再小步修正與驗證。\n維護注意：新增常見原因或 rollback 方式時要同步更新此圖。\n`;
  }
  return `\`\`\`mermaid\nflowchart TD\n  A[Read this page] --> B[Identify affected repo]\n  B --> C[Check compatibility policy]\n  C --> D[Plan smallest safe action]\n  D --> E[Run verification commands]\n  E --> F[Record evidence]\n\`\`\`\n\n圖名：${label}\n用途：把 ${title} 轉成可執行的維護流程。\nAI 用途：AI Agent 可依此拆解任務、驗證結果並回報。\n維護注意：若流程、指令或禁止事項改變，必須同步更新此圖。\n`;
}

function genericDoc(slug, title, description) {
  const isRunbook = slug.startsWith('runbooks/');
  const contract = `## AI Agent Contract\n\n### Must read first\n- \`README.md\`\n- \`AGENTS.md\`\n- \`docs-site/src/content/docs/ai-guide/index.md\`\n- \`docs-site/src/content/docs/getting-started/repository-map.md\`\n- \`docs-site/src/content/docs/dependency-map/risk-matrix.md\`\n\n### Allowed actions\n- Inspect files and build metadata.\n- Propose small scoped edits.\n- Update documentation, diagrams, and verification evidence.\n\n### Forbidden actions\n- Do not remove source-backed security notes.\n- Do not perform broad formatting churn.\n- Do not change major dependencies without an explicit compatibility plan.\n- Do not delete tests to make a build pass.\n\n### Required checks\n- Inspect git status before editing.\n- Identify affected repos and legacy compatibility surface.\n- Run the narrowest relevant validation commands.\n\n### Verification\nUse the commands below as placeholders until a repo-specific command is proven.\n\n### Rollback\nRevert only your own changes, preserve user work, and document why rollback was needed.\n\n### Output format\nReturn changed files, summary, tests run, tests not run and why, known risks, and next steps.\n`;
  const runbook = `## Symptoms\n- Build, runtime, API, or release behavior differs from the expected Rancher 1.6 compatibility contract.\n\n## Scope\n- Identify the exact repo, branch, artifact, Docker image, API route, and dependency involved.\n\n## First checks\n- Confirm current branch and dirty state.\n- Capture exact command, error output, and environment versions.\n- Compare with upstream Rancher 1.6 behavior when possible.\n\n## Safe commands\n\`\`\`powershell\ngit status --short\nrg --files -g package.json -g pom.xml -g go.mod -g Dockerfile\nnpm run search:smoke\n\`\`\`\n\n## Common causes\n- Dependency or image behavior changed across environments.\n- Java, Go, Node, Docker, or database version mismatch.\n- Hidden compatibility contract between server, agent, metadata, and catalog.\n\n## Investigation flow\n1. Reproduce the failure with the smallest command.\n2. Locate the owning repo and build file.\n3. Search dependency and API docs.\n4. Patch one variable at a time.\n5. Verify legacy compatibility before documenting success.\n\n## Fix strategy\nPrefer compatibility shims, pinned versions, narrow patches, and additional tests over broad dependency jumps.\n\n## Verification\n\`\`\`powershell\nnpm run verify\n# plus repo-specific build/test command recorded in the PR\n\`\`\`\n\n## Rollback\nRevert the specific patch, restore the previous image or artifact, and note any database or API state that cannot be automatically rolled back.\n\n## AI agent notes\nFollow \`AGENTS.md\`; never mask a real failure with mocks or skipped checks.\n\n## Human maintainer notes\nRequire reproducible evidence before merging and preserve release notes for operators.\n`;
  const body = isRunbook ? runbook : `## Intended Audience\nThis page serves human maintainers who need a practical starting point and AI agents that need explicit safety boundaries.\n\n## Purpose\n${description} It should be updated whenever the related repository, dependency, or workflow changes.\n\n## Human Maintainer Checklist\n- Confirm the affected Rancher 1.6 repository and branch.\n- Compare the change against legacy behavior and API compatibility.\n- Capture exact build, test, Docker, and database evidence.\n- Update release notes when user-visible behavior changes.\n\n## AI Agent Checklist\n- Read \`AGENTS.md\` before editing.\n- Produce a task summary with scope, risk, verification, and rollback.\n- Prefer the smallest patch and avoid unrelated formatting changes.\n- Keep source-backed risk notes intact.\n\n## Verification Commands Placeholder\n\`\`\`powershell\ngit status --short\nnpm run validate:frontmatter\nnpm run search:smoke\nnpm run build\n\`\`\`\n\n## Risks\n- Rancher 1.6 risk status must be verified against actual dependencies, images, CVEs, and official sources before being stated.\n- Modern Java, Go, Node, Docker, and database behavior can break old assumptions.\n- Server, agent, metadata, DNS, catalog, and UI compatibility must be preserved.\n\n## Next Reading\n- [Repository Map](/getting-started/repository-map/)\n- [Risk Matrix](/dependency-map/risk-matrix/)\n- [Safe Editing Rules](/ai-guide/safe-editing-rules/)\n\n${contract}`;
  return `${frontmatter(title, description, slug)}${body}\n\n## 圖表\n\n${diagramFor(title, slug)}\n`;
}

function repositoryMapDoc() {
  return `${frontmatter('Repository Map', 'Inventory of related Rancher 1.6 repositories and build surfaces.', 'getting-started/repository-map')}## Summary\n\nThe workspace scan found **${repos.length}** \`rancher-1.6-*\` repositories under \`${parent.replaceAll('\\', '/')}\`. This map is an initial inventory for maintainers and AI agents; it must be refreshed after pulling new forks or changing branches.\n\n## Repository Inventory\n\n| Repository | Build files | Test path count | CI hints | License hints |\n| --- | --- | ---: | --- | --- |\n${repoRows}\n\n## Main Modules\n\n- \`rancher-1.6-rancher\`: server packaging, launch scripts, docs, and Cattle integration.\n- \`rancher-1.6-cattle\`: Java platform framework, API, DB access, service discovery, and process engine.\n- \`rancher-1.6-agent\`, \`host-api\`, \`metadata\`, \`dns\`, \`net\`, \`scheduler\`: runtime services that keep hosts, networking, metadata, and scheduling coherent.\n- \`rancher-1.6-rancher-catalog\`, \`compose-executor\`, \`storage\`, \`go-machine-service\`, \`rancher-auth-service\`: supporting catalogs, orchestration, storage, provisioning, and auth surfaces.\n\n## Human Maintainer Checklist\n\n- Pull every related fork before making cross-repo conclusions.\n- Record branch names and release tags for the exact evidence you used.\n- Treat missing CI or license hints as follow-up work, not proof of absence.\n\n## AI Agent Checklist\n\n- Inspect this map and \`dependency-map/risk-matrix\` before changing code.\n- Do not assume one repo owns a behavior until searching sibling repos.\n- Include repo/path evidence in final output.\n\n## Verification Commands Placeholder\n\n\`\`\`powershell\nGet-ChildItem .. -Directory -Filter 'rancher-1.6-*'\nrg --files ..\\rancher-1.6-* -g pom.xml -g package.json -g go.mod -g Dockerfile -g Makefile\nnpm run search:rebuild\n\`\`\`\n\n## Risks\n\n- The GitHub repositories are maintenance mirrors, not necessarily formal GitHub forks.\n- Some repos use historical build systems such as Bower, Glide, old Maven plugins, or legacy Docker base images.\n- Cross-repo behavior may depend on tags rather than current default branch state.\n\n## Next Reading\n\n- [依賴地圖](/dependency-map/)\n- [Risk Matrix](/dependency-map/risk-matrix/)\n- [Patch Workflow](/maintenance/patch-workflow/)\n\n## 圖表\n\n\`\`\`mermaid\nflowchart LR\n  Server[rancher-1.6-rancher] --> Cattle[rancher-1.6-cattle]\n  Server --> Agent[rancher-1.6-agent]\n  Server --> Catalog[rancher-catalog]\n  Server --> Auth[rancher-auth-service]\n  Server --> GMS[go-machine-service]\n  Agent --> HostAPI[host-api]\n  Agent --> Net[rancher-net]\n  Agent --> DNS[rancher-dns]\n  Agent --> Metadata[rancher-metadata]\n  Net --> Scheduler[scheduler]\n  Server --> Storage[storage]\n\`\`\`\n\n圖名：Rancher 1.6 repository relationship map\n用途：協助維護者理解多 repo 關聯，不把 server repo 誤當成唯一來源。\nAI 用途：AI Agent 在修改前可用此圖定位可能受影響的 sibling repo。\n維護注意：新增 fork、改名或移除 repo 時，必須重跑 inventory 並更新此圖。\n`;
}

function riskMatrixDoc() {
  return `${frontmatter('Risk Matrix', 'Initial dependency risk matrix from workspace scan.', 'dependency-map/risk-matrix')}## Summary\n\nThis is the first dependency risk matrix generated from the local \`rancher-1.6-*\` workspace. \`latest available version\` remains TODO until each dependency is checked against an authoritative registry or upstream release page.\n\n## Risk Rules\n\n- **High**: security-sensitive, runtime-facing, auth/network/database-related, Docker base image, Bower-era UI, or known old framework family.\n- **Medium**: build-time or library dependency that may still affect compatibility.\n- **Low**: only after a maintainer proves it is isolated and covered by tests.\n\n## Dependency Matrix\n\n| Name | Ecosystem | Repo / path | Current version | Latest available | Risk | Security sensitive | Direct upgrade | Compatibility shim | Verification |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n${riskRows || '| TODO | TODO | TODO | TODO | TODO | high | review | no | likely | targeted build |'}\n\n## Human Maintainer Checklist\n\n- Verify each TODO latest version from Maven Central, npm, Go module proxy, Docker Hub, or official upstream release pages.\n- Never upgrade multiple high-risk dependencies in one patch unless the change is a dedicated migration branch.\n- Require rollback evidence for server, agent, database, and Docker image changes.\n\n## AI Agent Checklist\n\n- Treat this matrix as inventory, not permission to upgrade.\n- Before editing, answer whether API compatibility, DB schema, Docker image, old agents, or catalog behavior can be affected.\n- Add verification evidence next to any dependency entry you update.\n\n## Verification Commands Placeholder\n\n\`\`\`powershell\nrg --files ..\\rancher-1.6-* -g pom.xml -g package.json -g bower.json -g go.mod -g glide.yaml -g Dockerfile\nnpm run search:smoke\n\`\`\`\n\n## Risks\n\nDependency vulnerability and upgrade safety must be verified against actual versions, official sources, and compatibility tests before being stated as conclusions.\n\n## Next Reading\n\n- [Dependency Upgrade Runbook](/runbooks/dependency-upgrade/)\n- [風險查證記錄](/security/verified-risk-notes/)\n- [Patch Workflow](/maintenance/patch-workflow/)\n\n## 圖表\n\n\`\`\`mermaid\nflowchart TD\n  A[Dependency found] --> B{Security sensitive?}\n  B -- Yes --> C[High risk triage]\n  B -- No --> D{Runtime path?}\n  D -- Yes --> C\n  D -- No --> E[Medium risk review]\n  C --> F{Direct upgrade safe?}\n  F -- No --> G[Compatibility shim or pin]\n  F -- Yes --> H[Single dependency patch]\n  E --> H\n  G --> I[Targeted tests and rollback]\n  H --> I\n\`\`\`\n\n圖名：依賴升級 decision tree\n用途：避免把所有老 dependency 都視為可直接升級。\nAI 用途：AI Agent 必須先判定風險與 compatibility shim，再提出修改。\n維護注意：風險規則改變時，要同步更新此圖與表格欄位。\n`;
}

function codexGoalDoc() {
  const prompts = [
    ['建立 repository map', '盤點目前工作區所有 rancher-1.6-* repo，找出 build files、測試、CI、license、upstream reference，更新 repository-map 與 dependency-map/index。'],
    ['分析 dependency risk', '掃描 pom.xml、package.json、bower.json、go.mod、glide.yaml、Dockerfile，產生 risk matrix，但不要升級任何 dependency。'],
    ['修復 build failure', '先重現 build failure，定位最小 repo/path，提出最小修補，保留完整錯誤與驗證指令。'],
    ['升級單一 dependency', '只升級一個 dependency，先回答相容性、DB、Docker、agent 影響，再補測試與 rollback。'],
    ['修補 CVE', '分析 CVE 是否可利用、受影響路徑、可替代修補方式與隔離部署建議。'],
    ['建立 compatibility shim', '在不改變 legacy API 的前提下建立 shim，補充對照測試與 migration note。'],
    ['補測試', '針對指定 bug 補最小 regression test，不重構無關程式碼。'],
    ['產生 release checklist', '根據本次 changed files 產生 release checklist、artifact 清單與 rollback plan。'],
    ['對照 upstream 行為', '比較 chen21019 fork 與 upstream Rancher 1.6 相關檔案差異，整理行為差異與風險。'],
    ['重構但保持 API 相容', '先列出 public API、DB schema、Docker image、old agent compatibility，再分小 PR 重構。']
  ];
  return `${frontmatter('Codex CLI Goal Guide', 'How to use /goal for large maintenance tasks.', 'ai-guide/codex-cli-goal-guide')}## What Is /goal\n\n` + '`/goal`' + ` is a Codex CLI mode for long-running, auditable work. Use it when the task spans multiple repos, requires inventory before edits, or needs a final completion audit.\n\n## When To Use /goal\n\nUse it for dependency modernization, security triage, build reproducibility, release readiness, repository mapping, or documentation site maintenance. Do not use it to hide uncertainty; the final answer must still show evidence.\n\n## How To Break Down Large Maintenance Work\n\n1. Inventory repos, branches, build files, tests, CI, and licenses.\n2. Map the affected component and legacy compatibility contract.\n3. Select the smallest safe edit.\n4. Run narrow tests first, then broader checks.\n5. Update docs, diagrams, search index, and release notes.\n6. Audit every explicit requirement before declaring completion.\n\n## Ask AI To Inventory Before Editing\n\nA good prompt requires the agent to inspect current state, preserve dirty user work, and explain risk before touching code.\n\n## Ask AI To Verify Every Step\n\nRequire exact commands and evidence. Passing a build is not enough unless it covers the requested behavior.\n\n## Ask AI To Avoid One Large Rewrite\n\nTell the agent to split code changes by repo and ownership boundary, especially for Cattle, server, agent, and database work.\n\n## Copyable /goal Prompts\n\n${prompts.map(([title, body], index) => `### ${index + 1}. ${title}\n\n\`\`\`text\n/goal\n${body}\n完成前請輸出 changed files、summary、tests run、tests not run、known risks、rollback、next steps，並且做 prompt-to-artifact completion audit。\n\`\`\``).join('\n\n')}\n\n## AI Agent Contract\n\n### Must read first\n- \`AGENTS.md\`\n- [Repository Map](/getting-started/repository-map/)\n- [Risk Matrix](/dependency-map/risk-matrix/)\n\n### Allowed actions\n- Inventory, scoped edits, tests, docs updates, and release notes.\n\n### Forbidden actions\n- Broad formatting, hidden major upgrades, deleting tests, removing source-backed risk notes, or using unlicensed images.\n\n### Required checks\n- Git status, repo ownership, compatibility risk, verification, rollback.\n\n### Verification\n\`\`\`powershell\nnpm run verify\n\`\`\`\n\n### Rollback\nRevert only the agent's changes and preserve user work.\n\n### Output format\nChanged files, summary, tests run, tests not run and why, known risks, next steps.\n\n## 圖表\n\n${diagramFor('Codex CLI Goal Guide', 'ai-guide/codex-cli-goal-guide')}\n`;
}

function verifiedRiskDoc() {
  return `${frontmatter('風險查證記錄', 'Source-backed security and operational risk notes.', 'security/verified-risk-notes')}## Usage Rule\n\nThis page records source-backed risks and verification tasks only. Content without a source, repo/path, version, tag, or log evidence must stay marked as needs verification.\n\n## Verification Table\n\n| Category | Target | Required Evidence | Status |\n| --- | --- | --- | --- |\n| Dependency | Maven, Go, Node, and Bower packages | package files, lock/vendor data, official registry, or upstream release notes | needs verification |\n| Image | Dockerfiles and base image tags | Dockerfile path, registry tag, image digest, or release notes | needs verification |\n| API / DB | rancher-1.6-cattle and rancher-1.6-rancher | endpoint, migration, schema, or test evidence | needs verification |\n| Runtime | agent, host-api, network, metadata, DNS | affected path, reproduction steps, logs, and test command | needs verification |\n\n## Writing Rules\n\n- It is acceptable to write needs verification, check the official registry, or only local files were inspected.\n- Do not state support status, CVE status, or production risk as a conclusion without a source.\n- Any new risk entry must include repo/path, version or tag, verification source, and update date.\n\n## Human Maintainer Checklist\n\n- Confirm that every risk statement has a traceable source before merging.\n- Track dependency, image, API, DB, and agent behavior separately.\n- Convert speculation into a verification task.\n\n## AI Agent Checklist\n\n- Do not independently assert support status, CVE status, production safety, or unsupported status.\n- Do not treat a passing build as a security conclusion.\n- Report verification sources; mark missing sources as needs verification.\n\n## Verification Commands Placeholder\n\n\`\`\`powershell\nrg -n \"needs verification|CVE|security|image|registry\" docs-site/src/content/docs\nnpm run search:smoke\n\`\`\`\n\n## 圖表\n\n\`\`\`mermaid\nflowchart TD\n  A[Risk statement found] --> B{Has source?}\n  B -- No --> C[Mark as needs verification]\n  B -- Yes --> D[Record repo/path and version]\n  D --> E{Has reproducible evidence?}\n  E -- No --> C\n  E -- Yes --> F[Write verified risk note]\n  C --> G[Track follow-up verification]\n  F --> H[Update search index and docs]\n\`\`\`\n\n圖名：Verified risk workflow\n用途：Prevents unsupported assumptions from becoming documentation conclusions.\nAI 用途：AI Agent must verify sources before changing security or dependency risk content.\n維護注意：Update the verification table when new risk categories are added.\n`;
}

function indexDoc() {
  return `${frontmatter('Rancher 1.6 維護手冊', '給人類維護者與 AI Agent 使用的 Cattle 平台維護入口。', 'index')}<div class="hero-grid">\n  <div class="mascot-panel"><img src="/mascot-placeholder.svg" alt="櫻花粉工程師角色插圖" /></div>\n  <div class="hero-copy">\n    <h1>Rancher 1.6 維護手冊</h1>\n    <p>給人類維護者與 AI Agent 使用的 Cattle 平台維護入口；所有風險判斷都必須保留證據，不用臆測取代查證。</p>\n    <div class="hero-actions">\n      <a href="/getting-started/for-human-maintainers/">開始學習</a>\n      <a href="/ai-guide/">AI 維護指南</a>\n      <a href="/dependency-map/">依賴地圖</a>\n      <a href="/search/">搜尋文件</a>\n    </div>\n  </div>\n</div>\n\n## 快速入口\n\n<div class="quick-grid">\n  <div class="quick-card"><strong>第一次維護</strong><br />先看學習路徑、儲存庫地圖與第一次建置。</div>\n  <div class="quick-card"><strong>正在修建置失敗</strong><br />使用建置失敗處理手冊，保留完整環境與錯誤證據。</div>\n  <div class="quick-card"><strong>準備升級依賴</strong><br />先讀風險矩陣，不要直接改版本。</div>\n  <div class="quick-card"><strong>檢查安全風險</strong><br />從風險查證、威脅模型與修補流程開始。</div>\n  <div class="quick-card"><strong>我是 AI Agent</strong><br />先讀 AGENTS.md、儲存庫地圖與安全編輯規則。</div>\n  <div class="quick-card"><strong>準備發版</strong><br />依照發版檢查表補齊文件、驗證與回復方案。</div>\n</div>\n\n## 搜尋入口\n\n<div class="search-panel">\n  <input aria-label="搜尋文件" placeholder="搜尋錯誤訊息、依賴、API、處理手冊或 AI 任務" />\n  <div class="search-chips">\n    <span class="search-chip">建置失敗</span>\n    <span class="search-chip">依賴升級</span>\n    <span class="search-chip">CVE 分流</span>\n    <span class="search-chip">Agent 相容性</span>\n    <span class="search-chip">API 行為</span>\n    <span class="search-chip">發版檢查</span>\n  </div>\n</div>\n\n## 狀態卡片\n\n<div class="status-grid">\n  <div class="status-card"><strong>Build 證據</strong><br />等待 CI 發佈已驗證 artifact。</div>\n  <div class="status-card"><strong>Java / Go / Node</strong><br />各 repo 版本矩陣待補。</div>\n  <div class="status-card"><strong>Docker 狀態</strong><br />發版前必須追蹤 base image 風險。</div>\n  <div class="status-card"><strong>待查風險</strong><br />只呈現有來源或明確標為待查證的風險。</div>\n  <div class="status-card"><strong>風險矩陣</strong><br />已由本機掃描產生初版。</div>\n</div>\n\n## 維護路線圖\n\n<div class="roadmap-grid">\n  <div class="roadmap-phase"><strong>階段 1：盤點</strong><br />儲存庫、依賴與建置檔。</div>\n  <div class="roadmap-phase"><strong>階段 2：可重現建置</strong><br />固定指令與建置產物。</div>\n  <div class="roadmap-phase"><strong>階段 3：安全分流</strong><br />CVE 影響範圍與緩解。</div>\n  <div class="roadmap-phase"><strong>階段 4：依賴現代化</strong><br />小步修補與相容性補丁。</div>\n  <div class="roadmap-phase"><strong>階段 5：相容性測試</strong><br />Server、agent、API、DB 與 Docker 檢查。</div>\n  <div class="roadmap-phase"><strong>階段 6：發版流程</strong><br />發版說明、回復方案與文件產物。</div>\n</div>\n\n## 圖表\n\n\`\`\`mermaid\nflowchart LR\n  Maintainer[人類維護者] --> Handbook[維護手冊]\n  Agent[AI Agent] --> Handbook\n  Handbook --> RepoMap[儲存庫地圖]\n  Handbook --> Risk[依賴風險矩陣]\n  Handbook --> Guides[處理手冊]\n  Handbook --> Search[BM25 與向量搜尋]\n  Handbook --> Security[風險查證記錄]\n\`\`\`\n\n圖名：手冊首頁閱讀路徑\n用途：連結新維護者、AI Agent、儲存庫地圖、處理手冊、搜尋與風險查證記錄。\nAI 用途：AI Agent 可依首頁入口決定要先讀哪一類文件。\n維護注意：首頁快速入口或路線圖改變時，要同步更新此圖。\n`;
}

const special = new Map([
  ['getting-started/repository-map', repositoryMapDoc()],
  ['dependency-map/risk-matrix', riskMatrixDoc()],
  ['ai-guide/codex-cli-goal-guide', codexGoalDoc()],
  ['security/verified-risk-notes', verifiedRiskDoc()]
]);

write(path.join(docsRoot, 'index.md'), indexDoc());
for (const [slug, title, description] of docs) {
  const content = special.get(slug) || genericDoc(slug, title, description);
  write(path.join(docsRoot, `${slug}.md`), content);
}

write(path.join(root, 'AGENTS.md'), `# AGENTS.md\n\n## Project Goal\n\nBuild and maintain the Rancher 1.6 Maintenance Handbook for human maintainers and AI agents. The site documents compatibility checks, dependency inventory, build workflows, source-backed security notes, runbooks, API map, and search index maintenance.\n\n## Modification Principles\n\n- Preserve Rancher 1.6 behavior unless a migration note and tests explicitly say otherwise.\n- Prefer small scoped changes with clear verification and rollback.\n- Keep documentation useful for first-time maintainers and AI agents.\n- Update diagrams, frontmatter, last_verified, and search index when content changes.\n\n## Forbidden Actions\n\n- Do not perform broad formatting churn across unrelated repos.\n- Do not change licenses or remove original author credit.\n- Do not silently upgrade major dependencies.\n- Do not delete tests or mock away real failures.\n- Do not add unexplained external services.\n- Do not disable security checks just to make builds pass.\n- Do not remove source-backed risk or security notes.\n- Do not use unlicensed anime or mascot images.\n\n## Common Checks\n\n\`\`\`powershell\ngit status --short\nnpm run validate:frontmatter\nnpm run search:rebuild\nnpm run build\nnpm --prefix search-api test\n\`\`\`\n\n## Commit And PR Summary Format\n\n- Summary\n- Changed files\n- Compatibility impact\n- Tests run\n- Tests not run and why\n- Known risks\n- Rollback plan\n\n## Test Requirements\n\nRun the narrowest relevant repo tests first, then docs verification for documentation changes. For dependency changes, include build, runtime, and rollback evidence.\n\n## Dependency Upgrade Rules\n\nUpgrade one dependency at a time unless a dedicated migration plan explains why a group change is required. Record current version, latest checked version, risk, support status, security sensitivity, direct-upgrade safety, compatibility shim need, and verification.\n\n## Security Patch Rules\n\nSecurity work must include threat model, affected path, exploitability, mitigation, verification, rollback, and operator warning. Rancher 1.6 remains unchanged in overall support status unless a cited source proves otherwise.\n\n## Rancher 1.6 Compatibility Policy\n\nDo not break agents, public Cattle API 行為, database migrations, Docker image expectations, catalog behavior, metadata/DNS assumptions, or service discovery flows without explicit migration notes and tests.\n\n## Compatibility Preservation Policy\n\nWhen modernizing, compare with upstream Rancher 1.6 behavior and prefer compatibility shims over broad rewrites.\n\n## Documentation Site Rules\n\nEvery new page requires frontmatter, intended audience, human checklist, AI checklist, verification placeholder, risks, next reading, Mermaid diagram, and caption. Important pages require an AI Agent Contract.\n\n## Search Index Rules\n\nAfter content changes run:\n\n\`\`\`powershell\nnpm run search:rebuild\n\`\`\`\n\nEvery chunk must keep stable chunk_id, source path, heading, audience, tags, and updated metadata.\n\n## Mermaid Rules\n\nEvery main section needs at least one Mermaid diagram. Diagrams must include a caption with figure name, purpose, AI usage, and maintenance note.\n\n## Image Licensing Rules\n\nUse original, generated with rights, open-license with attribution, or placeholder assets only. The current mascot is an original SVG placeholder.\n`);

write(path.join(root, '.github', 'workflows', 'docs.yml'), `name: docs\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n\njobs:\n  docs:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v5\n      - uses: actions/setup-node@v5\n        with:\n          node-version: 22\n          cache: npm\n          cache-dependency-path: |\n            package-lock.json\n            docs-site/package-lock.json\n            search-api/package-lock.json\n      - run: npm install\n      - run: npm --prefix docs-site install\n      - run: npm --prefix search-api install\n      - run: npm run validate:frontmatter\n      - run: npm run search:rebuild\n      - run: npm --prefix search-api test\n      - run: npm run build\n      - uses: actions/upload-artifact@v5\n        with:\n          name: cattle-handbook-docs-site\n          path: docs-site/dist\n`);

write(path.join(root, 'docs-site', 'src', 'components', 'AgentNotice.astro'), `---\nconst { title = 'AI Agent Notice' } = Astro.props;\n---\n<aside class=\"agent-notice\"><strong>{title}</strong><slot /></aside>\n`);
write(path.join(root, 'docs-site', 'src', 'components', 'RiskBadge.astro'), `---\nconst { label = 'Risk' } = Astro.props;\n---\n<span class=\"risk-badge\"><strong>{label}</strong><slot /></span>\n`);
write(path.join(root, 'docs-site', 'src', 'components', 'RunbookChecklist.astro'), `---\nconst { title = 'Runbook Checklist' } = Astro.props;\n---\n<section class=\"runbook-checklist\"><strong>{title}</strong><slot /></section>\n`);
write(path.join(root, 'docs-site', 'src', 'components', 'HeroMascot.astro'), `<div class=\"mascot-panel\"><img src=\"/mascot-placeholder.svg\" alt=\"Original pastel engineer mascot placeholder\" /></div>\n`);
write(path.join(root, 'docs-site', 'src', 'components', 'SearchBox.astro'), `<div class=\"search-panel\"><input aria-label=\"搜尋文件\" placeholder=\"搜尋錯誤訊息、依賴、API、處理手冊或 AI 任務\" /></div>\n`);

write(path.join(root, 'search-api', 'package.json'), `{\n  \"name\": \"cattle-handbook-search-api\",\n  \"version\": \"0.1.0\",\n  \"private\": true,\n  \"type\": \"module\",\n  \"scripts\": {\n    \"dev\": \"tsx src/index.ts\",\n    \"test\": \"vitest run\"\n  },\n  \"dependencies\": {\n    \"@types/node\": \"^22.18.10\",\n    \"tsx\": \"^4.20.6\",\n    \"typescript\": \"^5.9.3\",\n    \"vitest\": \"^4.0.0\"\n  }\n}\n`);
write(path.join(root, 'search-api', 'README.md'), `# Search API\n\nMock implementation for \`POST /api/search/hybrid\`. It loads \`../data/bm25-index.json\` and \`../data/vector-index.json\`, combines BM25, vector, and metadata boosts, and returns ranked chunks.\n\nThis is intentionally simple for the first version. Production deployments can replace the vector placeholder with sqlite-vec, Qdrant, or pgvector without changing the request/response contract.\n`);
write(path.join(root, 'search-api', 'src', 'search', 'ranker.ts'), `export type SearchResult = { title: string; path: string; section: string; score: number; bm25_score: number; vector_score: number; snippet: string; chunk_id: string; };\n\nexport function finalScore(bm25: number, vector: number, metadataBoost: number) {\n  return Number((0.55 * bm25 + 0.35 * vector + 0.10 * metadataBoost).toFixed(4));\n}\n`);
write(path.join(root, 'search-api', 'src', 'routes', 'hybrid-search.ts'), `import fs from 'node:fs';\nimport path from 'node:path';\nimport { finalScore, type SearchResult } from '../search/ranker.js';\n\ntype Query = { query: string; limit?: number; filters?: { section?: string; audience?: string } };\n\nfunction tokenize(value: string) {\n  return value.toLowerCase().split(/[^a-z0-9\\u4e00-\\u9fff_.-]+/).filter(Boolean);\n}\n\nexport function hybridSearch(input: Query): { query: string; results: SearchResult[] } {\n  const dataFile = path.resolve(process.cwd(), '..', 'data', 'bm25-index.json');\n  const raw = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile, 'utf8')) : { chunks: [] };\n  const terms = tokenize(input.query);\n  const results = raw.chunks\n    .filter((chunk: any) => !input.filters?.section || chunk.section === input.filters.section)\n    .filter((chunk: any) => !input.filters?.audience || chunk.audience?.includes(input.filters.audience))\n    .map((chunk: any) => {\n      const haystack = tokenize([chunk.title, chunk.heading, chunk.text, chunk.path].join(' '));\n      const hits = terms.filter((term) => haystack.some((word) => word.includes(term))).length;\n      const bm25 = terms.length ? hits / terms.length : 0;\n      const vector = Math.min(1, bm25 * 0.82 + (chunk.search_priority === 'high' ? 0.12 : 0.04));\n      const metadata = (chunk.title.toLowerCase().includes(input.query.toLowerCase()) ? 0.4 : 0) + (chunk.search_priority === 'high' ? 0.3 : 0.1);\n      return {\n        title: chunk.title,\n        path: chunk.url,\n        section: chunk.section,\n        score: finalScore(bm25, vector, metadata),\n        bm25_score: Number(bm25.toFixed(4)),\n        vector_score: Number(vector.toFixed(4)),\n        snippet: chunk.text.slice(0, 180),\n        chunk_id: chunk.chunk_id\n      };\n    })\n    .filter((result: SearchResult) => result.score > 0)\n    .sort((a: SearchResult, b: SearchResult) => b.score - a.score)\n    .slice(0, input.limit || 10);\n  return { query: input.query, results };\n}\n`);
write(path.join(root, 'search-api', 'src', 'index.ts'), `import { createServer } from 'node:http';\nimport { hybridSearch } from './routes/hybrid-search.js';\n\nconst server = createServer(async (req, res) => {\n  if (req.method === 'POST' && req.url === '/api/search/hybrid') {\n    let body = '';\n    req.on('data', (chunk) => { body += chunk; });\n    req.on('end', () => {\n      const result = hybridSearch(JSON.parse(body || '{}'));\n      res.writeHead(200, { 'content-type': 'application/json' });\n      res.end(JSON.stringify(result));\n    });\n    return;\n  }\n  res.writeHead(404);\n  res.end('not found');\n});\n\nserver.listen(8787, '127.0.0.1', () => {\n  console.log('Search API listening on http://127.0.0.1:8787');\n});\n`);
write(path.join(root, 'search-api', 'tests', 'hybrid-search.test.ts'), `import { describe, expect, it } from 'vitest';\nimport { finalScore } from '../src/search/ranker.js';\n\ndescribe('hybrid ranking', () => {\n  it('uses bm25, vector, and metadata weights', () => {\n    expect(finalScore(0.82, 0.88, 0.5)).toBe(0.81);\n  });\n});\n`);

write(path.join(root, 'tools', 'search-index', 'README.md'), `# Search Index Tools\n\nPipeline:\n\n1. \`chunk-docs.mjs\` scans \`docs-site/src/content/docs/**/*.md\`, parses frontmatter, preserves heading hierarchy, and writes stable chunks.\n2. \`build-bm25-index.mjs\` builds a lightweight BM25-like keyword index for local smoke tests and the mock API.\n3. \`build-vector-index.mjs\` writes deterministic placeholder vectors until sqlite-vec/Qdrant/pgvector is enabled.\n4. \`validate-search-index.mjs\` checks required fields and chunk size.\n5. \`search-smoke-test.mjs\` tests build failure, dependency upgrade, CVE, agent compatibility, API auth, docker build, and database migration queries.\n`);
write(path.join(root, 'tools', 'search-index', 'shared.mjs'), `import fs from 'node:fs';\nimport path from 'node:path';\n\nexport const root = path.resolve(new URL('../../', import.meta.url).pathname);\nexport const docsRoot = path.join(root, 'docs-site', 'src', 'content', 'docs');\nexport const dataRoot = path.join(root, 'data');\n\nexport function ensureData() { fs.mkdirSync(dataRoot, { recursive: true }); }\nexport function readJson(name) { return JSON.parse(fs.readFileSync(path.join(dataRoot, name), 'utf8')); }\nexport function writeJson(name, value) { ensureData(); fs.writeFileSync(path.join(dataRoot, name), JSON.stringify(value, null, 2)); }\nexport function listMarkdown(dir = docsRoot) {\n  const out = [];\n  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {\n    const full = path.join(dir, entry.name);\n    if (entry.isDirectory()) out.push(...listMarkdown(full));\n    if (entry.isFile() && /\\.mdx?$/.test(entry.name)) out.push(full);\n  }\n  return out;\n}\nexport function parseFrontmatter(text) {\n  const m = text.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n/);\n  const fm = {};\n  if (!m) return { fm, body: text };\n  const lines = m[1].split(/\\r?\\n/);\n  let key = null;\n  for (const line of lines) {\n    const kv = line.match(/^([a-zA-Z0-9_]+):\\s*(.*)$/);\n    if (kv) { key = kv[1]; fm[key] = kv[2].replace(/^\"|\"$/g, ''); if (fm[key] === '') fm[key] = []; continue; }\n    const item = line.match(/^\\s+-\\s+(.*)$/);\n    if (item && key) { if (!Array.isArray(fm[key])) fm[key] = []; fm[key].push(item[1]); }\n  }\n  return { fm, body: text.slice(m[0].length) };\n}\nexport function stableId(value) {\n  let hash = 2166136261;\n  for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24); }\n  return (hash >>> 0).toString(16);\n}\n`);
write(path.join(root, 'tools', 'search-index', 'chunk-docs.mjs'), `import path from 'node:path';\nimport fs from 'node:fs';\nimport { docsRoot, listMarkdown, parseFrontmatter, stableId, writeJson } from './shared.mjs';\n\nconst chunks = [];\nfor (const file of listMarkdown()) {\n  const rel = path.relative(docsRoot, file).replaceAll('\\\\', '/');\n  const slug = rel.replace(/\\.mdx?$/, '').replace(/(^|\\/)index$/, '$1').replace(/\\/$/, '') || 'index';\n  const text = fs.readFileSync(file, 'utf8');\n  const { fm, body } = parseFrontmatter(text);\n  const sections = body.split(/\\n(?=##\\s+)/g);\n  sections.forEach((section, index) => {\n    const heading = section.match(/^##\\s+(.+)$/m)?.[1] || fm.title || slug;\n    const clean = section.replace(new RegExp('\`\`\`[\\\\s\\\\S]*?\`\`\`', 'g'), ' code block ').replace(/<[^>]+>/g, ' ').replace(/\\s+/g, ' ').trim();\n    if (!clean) return;\n    const chunkBase = [rel, heading, index].join(':');\n    chunks.push({\n      chunk_id: slug.replaceAll('/', '-') + '-' + stableId(chunkBase),\n      title: fm.title || slug,\n      heading,\n      path: rel,\n      url: '/' + (slug === 'index' ? '' : slug + '/'),\n      section: slug.split('/')[0],\n      audience: Array.isArray(fm.audience) ? fm.audience : ['human-maintainer', 'ai-agent'],\n      tags: Array.isArray(fm.tags) ? fm.tags : [],\n      search_priority: fm.search_priority || 'normal',\n      updated_at: fm.last_verified || '',\n      text: clean.slice(0, 4200)\n    });\n  });\n}\nwriteJson('chunks.json', { generated_at: new Date().toISOString(), chunks });\nconsole.log('chunked ' + chunks.length + ' docs chunks');\n`);
write(path.join(root, 'tools', 'search-index', 'build-bm25-index.mjs'), `import { readJson, writeJson } from './shared.mjs';\nconst source = readJson('chunks.json');\nconst docs = source.chunks.map((chunk) => ({ ...chunk, terms: chunk.text.toLowerCase().split(/[^a-z0-9\\u4e00-\\u9fff_.-]+/).filter(Boolean) }));\nwriteJson('bm25-index.json', { generated_at: new Date().toISOString(), chunks: docs });\nconsole.log('indexed ' + docs.length + ' chunks for bm25');\n`);
write(path.join(root, 'tools', 'search-index', 'build-vector-index.mjs'), `import { readJson, stableId, writeJson } from './shared.mjs';\nconst source = readJson('chunks.json');\nconst vectors = source.chunks.map((chunk) => {\n  const seed = stableId(chunk.chunk_id + chunk.text);\n  const values = Array.from({ length: 16 }, (_, index) => Number((((parseInt(seed, 16) + index * 2654435761) % 1000) / 1000).toFixed(3)));\n  return { chunk_id: chunk.chunk_id, model: 'placeholder-deterministic-vector-v1', values };\n});\nwriteJson('vector-index.json', { generated_at: new Date().toISOString(), note: 'Placeholder vectors; replace with sqlite-vec, Qdrant, or pgvector embeddings before production semantic search.', vectors });\nconsole.log('built ' + vectors.length + ' placeholder vectors');\n`);
write(path.join(root, 'tools', 'search-index', 'validate-search-index.mjs'), `import { readJson } from './shared.mjs';\nconst { chunks } = readJson('chunks.json');\nconst bm25 = readJson('bm25-index.json');\nconst vector = readJson('vector-index.json');\nconst vectorIds = new Set(vector.vectors.map((item) => item.chunk_id));\nconst errors = [];\nfor (const chunk of chunks) {\n  for (const key of ['chunk_id', 'title', 'path', 'url', 'section', 'text']) if (!chunk[key]) errors.push((chunk.chunk_id || chunk.path) + ': missing ' + key);\n  if (!vectorIds.has(chunk.chunk_id)) errors.push(chunk.chunk_id + ': missing vector');\n  if (chunk.text.length > 4200) errors.push(chunk.chunk_id + ': chunk too large');\n}\nif (bm25.chunks.length !== chunks.length) errors.push('bm25 chunk count mismatch');\nif (errors.length) { console.error(errors.join('\\n')); process.exit(1); }\nconsole.log('validated ' + chunks.length + ' chunks');\n`);
write(path.join(root, 'tools', 'search-index', 'search-smoke-test.mjs'), `import { readJson } from './shared.mjs';\nconst { chunks } = readJson('bm25-index.json');\nconst queries = ['build failure', 'dependency upgrade', 'CVE', 'agent compatibility', 'API auth', 'docker build', 'database migration'];\nconst failures = [];\nfor (const query of queries) {\n  const terms = query.toLowerCase().split(/\\s+/);\n  const hits = chunks.filter((chunk) => terms.some((term) => [chunk.title, chunk.heading, chunk.text, chunk.path].join(' ').toLowerCase().includes(term)));\n  if (!hits.length) failures.push(query);\n  else console.log(query + ': ' + hits[0].title + ' (' + hits[0].path + ')');\n}\nif (failures.length) { console.error('missing search hits: ' + failures.join(', ')); process.exit(1); }\n`);
write(path.join(root, 'tools', 'search-index', 'validate-frontmatter.mjs'), `import fs from 'node:fs';\nimport { listMarkdown, parseFrontmatter } from './shared.mjs';\nconst required = ['title', 'description', 'audience', 'tags', 'diagram_required', 'search_priority', 'last_verified'];\nconst errors = [];\nfor (const file of listMarkdown()) {\n  const { fm, body } = parseFrontmatter(fs.readFileSync(file, 'utf8'));\n  for (const key of required) if (!(key in fm)) errors.push(file + ': missing ' + key);\n  if (!/\`\`\`mermaid/.test(body)) errors.push(file + ': missing mermaid diagram');\n  if (!/圖名：/.test(body)) errors.push(file + ': missing figure caption');\n  if (!/Human Maintainer Checklist|Quick Entrances/.test(body)) errors.push(file + ': missing human maintainer checklist');\n  if (!/AI Agent Checklist|AI Agent Contract|AI 維護指南/.test(body)) errors.push(file + ': missing AI checklist/contract');\n}\nif (errors.length) { console.error(errors.join('\\n')); process.exit(1); }\nconsole.log('validated frontmatter and diagrams for ' + listMarkdown().length + ' docs');\n`);

console.log(`Generated handbook with ${docs.length + 1} documentation pages and ${repos.length} scanned Rancher repos.`);
