# AGENTS.md

## Project Goal

Build and maintain the Rancher 1.6 Legacy Maintenance Handbook for human maintainers and AI agents. The site documents legacy compatibility, dependency risk, build workflows, security posture, runbooks, API map, and search index maintenance.

## Modification Principles

- Preserve Rancher 1.6 legacy behavior unless a migration note explicitly says otherwise.
- Prefer small scoped changes with clear verification and rollback.
- Keep documentation useful for first-time maintainers and AI agents.
- Update diagrams, frontmatter, last_verified, and search index when content changes.

## Forbidden Actions

- Do not perform broad formatting churn across unrelated repos.
- Do not change licenses or remove original author credit.
- Do not silently upgrade major dependencies.
- Do not delete tests or mock away real failures.
- Do not add unexplained external services.
- Do not disable security checks just to make builds pass.
- Do not remove source-backed risk or security notes.
- Do not use unlicensed anime or mascot images.

## Common Checks

```powershell
git status --short
npm run validate:frontmatter
npm run search:rebuild
npm run build
npm --prefix search-api test
```

## Commit And PR Summary Format

- Summary
- Changed files
- Compatibility impact
- Tests run
- Tests not run and why
- Known risks
- Rollback plan

## Test Requirements

Run the narrowest relevant repo tests first, then docs verification for documentation changes. For dependency changes, include build, runtime, and rollback evidence.

## Dependency Upgrade Rules

Upgrade one dependency at a time unless a dedicated migration plan explains why a group change is required. Record current version, latest checked version, risk, security sensitivity, direct-upgrade safety, compatibility shim need, and verification source.

## Security Patch Rules

Security work must include threat model, affected path, exploitability, mitigation, verification, rollback, and source-backed operator notes. Do not state support status unless a cited source proves it.

## Rancher 1.6 Compatibility Policy

Do not break old agents, public Cattle API behavior, database migrations, Docker image expectations, catalog behavior, metadata/DNS assumptions, or service discovery flows without explicit migration notes.

## Legacy Behavior Preservation Policy

When modernizing, compare with upstream Rancher 1.6 behavior and prefer compatibility shims over broad rewrites.

## Documentation Site Rules

Every new page requires frontmatter, intended audience, human checklist, AI checklist, verification placeholder, risks, next reading, Mermaid diagram, and caption. Important pages require an AI Agent Contract.

## Search Index Rules

After content changes run:

```powershell
npm run search:rebuild
```

Every chunk must keep stable chunk_id, source path, heading, audience, tags, and updated metadata.

## Mermaid Rules

Every main section needs at least one Mermaid diagram. Diagrams must include a caption with figure name, purpose, AI usage, and maintenance note.

## Image Licensing Rules

Use original, generated with rights, open-license with attribution, or placeholder assets only. The current mascot is an original SVG placeholder.
