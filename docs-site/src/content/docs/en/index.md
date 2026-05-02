---
title: "Rancher 1.6 Legacy Maintenance Handbook"
description: "A human-friendly and AI-agent-ready Rancher 1.6 / Cattle maintenance handbook."
audience:
  - human-maintainer
  - ai-agent
tags:
  - rancher-1.6
  - maintenance
  - index
diagram_required: true
search_priority: normal
last_verified: "2026-05-02"
---

<div class="hero-grid">
  <div class="mascot-panel">
    <span class="tape tape-one"></span>
    <span class="tape tape-two"></span>
    <img src="/assets/cattle-chan.png" alt="AI-generated original sakura maintenance heroine Cattle-chan" />
    <div class="mascot-caption">Cattle-chan: a sakura maintenance heroine guarding Rancher 1.6 builds, dependencies, and release checks.</div>
  </div>
  <div class="hero-copy">
    <div class="kicker">Sakura Ops Heroine</div>
    <p class="hero-title">Rancher 1.6 Legacy Maintenance Handbook</p>
    <p class="hero-lede">A multilingual, AI-readable Rancher 1.6 maintenance handbook. The sakura-inspired visual system keeps the site approachable while warnings, commands, and risk guidance stay high-contrast and easy to scan.</p>
    <div class="hero-actions">
      <a href="/en/getting-started/for-human-maintainers/">Start Learning</a>
      <a href="/en/ai-guide/">AI Maintenance Guide</a>
      <a href="/en/dependency-map/">Dependency Map</a>
      <a href="/en/search/">Search Docs</a>
    </div>
  </div>
</div>

## Quick Entrances

<div class="quick-grid">
  <div class="quick-card tone-mint"><span class="card-mark">New</span><strong>I am new to Rancher 1.6</strong><br />Start with the learning path, repo map, and first build.</div>
  <div class="quick-card tone-blue"><span class="card-mark">Build</span><strong>I am fixing a build</strong><br />Use the build failure runbook and preserve environment evidence.</div>
  <div class="quick-card tone-butter"><span class="card-mark">Deps</span><strong>I am upgrading dependencies</strong><br />Read the risk matrix before changing versions.</div>
  <div class="quick-card tone-coral"><span class="card-mark">CVE</span><strong>I am reviewing security risk</strong><br />Start with EOL risks, threat models, and patch process.</div>
  <div class="quick-card tone-lavender"><span class="card-mark">AI</span><strong>I am an AI Agent</strong><br />Read AGENTS.md, the repo map, and safe editing rules first.</div>
  <div class="quick-card tone-rose"><span class="card-mark">RC</span><strong>I am preparing a release</strong><br />Follow release checklist, verification, and rollback evidence.</div>
</div>

## Search Entrance

<div class="search-panel">
  <div class="panel-label">Find the right document before touching code</div>
  <input id="home-doc-search-en" name="home-doc-search-en" aria-label="Search docs" placeholder="Search errors, dependencies, API behavior, runbooks, or AI tasks" />
  <div class="search-chips">
    <span class="search-chip">Build failure</span>
    <span class="search-chip">Dependency upgrade</span>
    <span class="search-chip">CVE triage</span>
    <span class="search-chip">Agent compatibility</span>
    <span class="search-chip">API behavior</span>
    <span class="search-chip">Release checklist</span>
  </div>
</div>

## Status Cards

<div class="status-grid">
  <div class="status-card"><span>Build</span><strong>Evidence first</strong><br />CI should publish verified artifacts.</div>
  <div class="status-card"><span>Runtime</span><strong>Java / Go / Node</strong><br />Repo-specific version matrix still needs owner review.</div>
  <div class="status-card"><span>Images</span><strong>Docker status</strong><br />Base image risk must be tracked before release.</div>
  <div class="status-card status-danger"><span>EOL</span><strong>Known risk</strong><br />This card must remain visible to avoid false confidence.</div>
  <div class="status-card"><span>Deps</span><strong>Risk matrix</strong><br />Initial inventory was generated from local repos.</div>
</div>

## Maintenance Roadmap

<div class="roadmap-grid">
  <div class="roadmap-phase"><strong>Phase 1: Inventory</strong><br />Repos, dependencies, and build files.</div>
  <div class="roadmap-phase"><strong>Phase 2: Reproducible build</strong><br />Pinned commands and artifacts.</div>
  <div class="roadmap-phase"><strong>Phase 3: Security triage</strong><br />CVE scope and mitigation.</div>
  <div class="roadmap-phase"><strong>Phase 4: Dependency modernization</strong><br />Small patches and compatibility shims.</div>
  <div class="roadmap-phase"><strong>Phase 5: Compatibility testing</strong><br />Server, agent, API, DB, and Docker checks.</div>
  <div class="roadmap-phase"><strong>Phase 6: Release process</strong><br />Release notes, rollback, and docs artifacts.</div>
</div>

## Diagram

```mermaid
flowchart LR
  Maintainer[Human maintainer] --> Handbook[Handbook]
  Agent[AI agent] --> Handbook
  Handbook --> RepoMap[Repository Map]
  Handbook --> Risk[Dependency Risk Matrix]
  Handbook --> Runbooks[Runbooks]
  Handbook --> Search[BM25 + Vector Search]
  Handbook --> Security[EOL Security Guidance]
```

圖名：Handbook first-viewport journey
Purpose: Connect new maintainers, AI agents, the repo map, runbooks, search, and security guidance.
AI use: AI agents can use the homepage entrances to decide which document family to read first.
Maintenance note: update this diagram whenever homepage entrances or roadmap phases change.
