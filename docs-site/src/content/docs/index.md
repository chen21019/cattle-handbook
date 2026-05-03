---
title: "Rancher 1.6 舊版維護手冊"
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
    <img src="/assets/cattle-chan-v2.png" alt="AI 生成的原創櫻花系維護妹子 Cattle-chan" />
    <div class="mascot-caption">Cattle-chan：櫻花系維護妹子，負責守住 Rancher 1.6 的建置、依賴與發版檢查。</div>
  </div>
  <div class="hero-copy">
    <div class="kicker">櫻花維護女主角</div>
    <p class="hero-title">Rancher 1.6 舊版維護手冊</p>
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
  <div class="quick-card tone-mint"><span class="card-mark">新手</span><strong>第一次維護 Rancher 1.6</strong><br />先看學習路徑、儲存庫地圖與第一次建置。</div>
  <div class="quick-card tone-blue"><span class="card-mark">建置</span><strong>正在修建置失敗</strong><br />使用建置失敗處理手冊，保留完整環境與錯誤證據。</div>
  <div class="quick-card tone-butter"><span class="card-mark">依賴</span><strong>準備升級依賴</strong><br />先讀風險矩陣，不要直接改版本。</div>
  <div class="quick-card tone-coral"><span class="card-mark">CVE</span><strong>檢查安全風險</strong><br />從風險查證、威脅模型與修補流程開始。</div>
  <div class="quick-card tone-lavender"><span class="card-mark">AI</span><strong>我是 AI Agent</strong><br />先讀 AGENTS.md、儲存庫地圖與安全編輯規則。</div>
  <div class="quick-card tone-rose"><span class="card-mark">發版</span><strong>準備發版</strong><br />依照發版檢查表補齊文件、驗證與回復方案。</div>
</div>

## 搜尋入口

<form class="search-panel handbook-home-search" data-handbook-search data-search-mode="redirect" data-search-locale="zh" action="/search/">
  <div class="panel-label">先找到文件，再碰程式碼</div>
  <input id="home-doc-search" name="q" type="search" aria-label="搜尋文件" placeholder="搜尋錯誤訊息、依賴、API、處理手冊或 AI 任務" />
  <button class="search-submit" type="submit">搜尋</button>
  <div class="search-status" data-search-status aria-live="polite"></div>
  <div class="search-chips">
    <button class="search-chip" type="button" data-search-query="建置失敗">建置失敗</button>
    <button class="search-chip" type="button" data-search-query="依賴升級">依賴升級</button>
    <button class="search-chip" type="button" data-search-query="CVE 分流">CVE 分流</button>
    <button class="search-chip" type="button" data-search-query="Agent 相容性">Agent 相容性</button>
    <button class="search-chip" type="button" data-search-query="API 行為">API 行為</button>
    <button class="search-chip" type="button" data-search-query="發版檢查">發版檢查</button>
  </div>
</form>

## 狀態卡片

<div class="status-grid">
  <div class="status-card"><span>建置</span><strong>證據優先</strong><br />等待 CI 發佈已驗證產物。</div>
  <div class="status-card"><span>執行</span><strong>Java / Go / Node</strong><br />各儲存庫版本矩陣待補。</div>
  <div class="status-card"><span>映像</span><strong>Docker 狀態</strong><br />發版前必須追蹤基礎映像風險。</div>
  <div class="status-card status-danger"><span>查證</span><strong>待查風險</strong><br />只呈現有來源或明確標為待查證的風險。</div>
  <div class="status-card"><span>依賴</span><strong>風險矩陣</strong><br />已由本機掃描產生初版。</div>
</div>

## 維護路線圖

<div class="roadmap-grid">
  <div class="roadmap-phase"><strong>階段 1：盤點</strong><br />儲存庫、依賴與建置檔。</div>
  <div class="roadmap-phase"><strong>階段 2：可重現建置</strong><br />固定指令與建置產物。</div>
  <div class="roadmap-phase"><strong>階段 3：安全分流</strong><br />CVE 影響範圍與緩解。</div>
  <div class="roadmap-phase"><strong>階段 4：依賴現代化</strong><br />小步修補與相容性補丁。</div>
  <div class="roadmap-phase"><strong>階段 5：相容性測試</strong><br />Server、agent、API、DB 與 Docker 檢查。</div>
  <div class="roadmap-phase"><strong>階段 6：發版流程</strong><br />發版說明、回復方案與文件產物。</div>
</div>

## 圖表

```mermaid
flowchart LR
  Maintainer[人類維護者] --> Handbook[維護手冊]
  Agent[AI Agent] --> Handbook
  Handbook --> RepoMap[儲存庫地圖]
  Handbook --> Risk[依賴風險矩陣]
  Handbook --> Guides[處理手冊]
  Handbook --> Search[BM25 與向量搜尋]
  Handbook --> Security[風險查證記錄]
```

圖名：手冊首頁閱讀路徑
用途：連結新維護者、AI Agent、儲存庫地圖、處理手冊、搜尋與風險查證記錄。
AI 用途：AI Agent 可依首頁入口決定要先讀哪一類文件。
維護注意：首頁快速入口或路線圖改變時，要同步更新此圖。
