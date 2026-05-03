---
title: "API Server"
description: "Describes API server request handling and compatibility risk."
audience:
  - human-maintainer
  - ai-agent
tags:
  - rancher-1.6
  - maintenance
  - architecture
diagram_required: true
search_priority: normal
last_verified: "2026-05-02"
---

## Intended Audience
This page serves human maintainers who need a practical starting point and AI agents that need explicit safety boundaries.

## Purpose
Describes API server request handling and compatibility risk. It should be updated whenever the related repository, dependency, or workflow changes.

## Human Maintainer Checklist
- Confirm the affected Rancher 1.6 repository and branch.
- Compare the change against legacy behavior and API compatibility.
- Capture exact build, test, Docker, and database evidence.
- Update release notes when user-visible behavior changes.

## AI Agent Checklist
- Read `AGENTS.md` before editing.
- Produce a task summary with scope, risk, verification, and rollback.
- Prefer the smallest patch and avoid unrelated formatting changes.
- Keep source-backed risk notes intact.

## Verification Commands
```powershell
git status --short
npm run validate:frontmatter
npm run search:smoke
npm run build
```

## Risks
- Rancher 1.6 risk status must be verified against actual dependencies, images, CVEs, and official sources before being stated.
- Modern Java, Go, Node, Docker, and database behavior can break old assumptions.
- Server, agent, metadata, DNS, catalog, and UI compatibility must be preserved.

## Next Reading
- [Repository Map](/getting-started/repository-map/)
- [Risk Matrix](/dependency-map/risk-matrix/)
- [Safe Editing Rules](/ai-guide/safe-editing-rules/)

## AI Agent Contract

### Must read first
- `README.md`
- `AGENTS.md`
- `docs-site/src/content/docs/ai-guide/index.md`
- `docs-site/src/content/docs/getting-started/repository-map.md`
- `docs-site/src/content/docs/dependency-map/risk-matrix.md`

### Allowed actions
- Inspect files and build metadata.
- Propose small scoped edits.
- Update documentation, diagrams, and verification evidence.

### Forbidden actions
- Do not remove source-backed security notes.
- Do not perform broad formatting churn.
- Do not change major dependencies without an explicit compatibility plan.
- Do not delete tests to make a build pass.

### Required checks
- Inspect git status before editing.
- Identify affected repos and legacy compatibility surface.
- Run the narrowest relevant validation commands.

### Verification
Add repo-specific commands for code changes; the commands below only verify the docs site and indexes.

### Rollback
Revert only your own changes, preserve user work, and document why rollback was needed.

### Output format
Return changed files, summary, tests run, tests not run and why, known risks, and next steps.


## Diagram

```mermaid
flowchart LR
  User[Human or AI maintainer] --> Docs[Handbook]
  Docs --> Server[Rancher Server]
  Server --> Cattle[Cattle Core]
  Server --> DB[(Database)]
  Server --> Agent[Agent]
  Agent --> Host[Docker Host]
  Server --> Metadata[Metadata and DNS]
```

圖名：API Server Flow
用途：說明 API Server 在 Rancher 1.6 維護知識中的位置。
AI 用途：AI Agent 可先定位元件，再決定是否能安全修改。
維護注意：若 repository map 或元件責任改變，必須同步更新此圖。
