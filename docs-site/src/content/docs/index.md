---
title: "Rancher 1.6 Legacy 維護手冊"
description: "給人類工程師與 AI Agent 使用的 Rancher 1.6 / Cattle 平台繁體中文維護手冊。"
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
    <img src="/assets/cattle-chan.png" alt="AI 生成的原創櫻花系維護妹子 Cattle-chan" />
    <div class="mascot-caption">Cattle-chan：櫻花系維護妹子，負責守住 Rancher 1.6 的 build、依賴與發版檢查。</div>
  </div>
  <div class="hero-copy">
    <div class="kicker">Sakura Ops Heroine</div>
    <p class="hero-title">Rancher 1.6 Legacy 維護手冊</p>
    <p class="hero-lede">繁體中文、多語系、AI 可讀的 Rancher 1.6 維護手冊。用櫻花系視覺降低閱讀壓力，但所有警告、指令與風險說明都保持高對比、清楚可掃描。</p>
    <div class="hero-actions">
      <a href="/getting-started/for-human-maintainers/">開始學習</a>
      <a href="/ai-guide/">AI 維護指南</a>
      <a href="/dependency-map/">依賴地圖</a>
      <a href="/search/">搜尋文件</a>
    </div>
  </div>
</div>

## 快速入口

<div class="quick-grid">
  <div class="quick-card tone-mint"><span class="card-mark">新手</span><strong>第一次維護 Rancher 1.6</strong><br />先看學習路徑、repo map 與第一次 build。</div>
  <div class="quick-card tone-blue"><span class="card-mark">Build</span><strong>正在修建置失敗</strong><br />使用 build failure runbook，保留完整環境與錯誤證據。</div>
  <div class="quick-card tone-butter"><span class="card-mark">Deps</span><strong>準備升級依賴</strong><br />先讀風險矩陣，不要直接改版本。</div>
  <div class="quick-card tone-coral"><span class="card-mark">CVE</span><strong>檢查安全風險</strong><br />從 EOL 風險、威脅模型與修補流程開始。</div>
  <div class="quick-card tone-lavender"><span class="card-mark">AI</span><strong>我是 AI Agent</strong><br />先讀 AGENTS.md、repo map 與 safe editing rules。</div>
  <div class="quick-card tone-rose"><span class="card-mark">RC</span><strong>準備發版</strong><br />依照 release checklist 補齊文件、驗證與 rollback。</div>
</div>

## 搜尋入口

<div class="search-panel">
  <div class="panel-label">先找到文件，再碰程式碼</div>
  <input id="home-doc-search" name="home-doc-search" aria-label="搜尋文件" placeholder="搜尋錯誤訊息、dependency、API、runbook 或 AI task" />
  <div class="search-chips">
    <span class="search-chip">建置失敗</span>
    <span class="search-chip">依賴升級</span>
    <span class="search-chip">CVE 分流</span>
    <span class="search-chip">Agent 相容性</span>
    <span class="search-chip">API 行為</span>
    <span class="search-chip">發版檢查</span>
  </div>
</div>

## 狀態卡片

<div class="status-grid">
  <div class="status-card"><span>Build</span><strong>證據優先</strong><br />等待 CI 發佈已驗證 artifact。</div>
  <div class="status-card"><span>Runtime</span><strong>Java / Go / Node</strong><br />各 repo 版本矩陣待補。</div>
  <div class="status-card"><span>Images</span><strong>Docker 狀態</strong><br />發版前必須追蹤 base image 風險。</div>
  <div class="status-card status-danger"><span>EOL</span><strong>已知風險</strong><br />這張卡不能移除，避免錯誤安全感。</div>
  <div class="status-card"><span>Deps</span><strong>風險矩陣</strong><br />已由本機掃描產生初版。</div>
</div>

## 維護路線圖

<div class="roadmap-grid">
  <div class="roadmap-phase"><strong>Phase 1：盤點</strong><br />Repo、依賴與 build files。</div>
  <div class="roadmap-phase"><strong>Phase 2：可重現建置</strong><br />固定指令與 artifact。</div>
  <div class="roadmap-phase"><strong>Phase 3：安全分流</strong><br />CVE 影響範圍與緩解。</div>
  <div class="roadmap-phase"><strong>Phase 4：依賴現代化</strong><br />小步修補與 compatibility shim。</div>
  <div class="roadmap-phase"><strong>Phase 5：相容性測試</strong><br />Server、agent、API、DB 與 Docker 檢查。</div>
  <div class="roadmap-phase"><strong>Phase 6：發版流程</strong><br />Release notes、rollback 與 docs artifact。</div>
</div>

## 圖表

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
用途：連結新維護者、AI Agent、repo map、runbook、search 與 security guidance。
AI 用途：AI Agent 可依首頁入口決定要先讀哪一類文件。
維護注意：首頁快速入口或路線圖改變時，要同步更新此圖。
