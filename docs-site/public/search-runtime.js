(function () {
  const indexUrl = '/search-index/chunks.json';
  let indexPromise;

  const uiText = {
    zh: {
      loading: '正在載入搜尋索引...',
      ready: '輸入關鍵字搜尋 18 個 Rancher 1.6 fork 的維護文件。',
      empty: '請輸入錯誤訊息、repo、依賴、API 或 runbook 關鍵字。',
      none: '找不到結果。請換成 repo 名稱、檔案名或英文錯誤訊息再試一次。',
      results: (count, query) => `找到 ${count} 筆與「${query}」相關的結果。`,
      open: '開啟文件'
    },
    en: {
      loading: 'Loading search index...',
      ready: 'Search the maintenance docs for the 18 Rancher 1.6 forks.',
      empty: 'Type an error, repo, dependency, API, or runbook keyword.',
      none: 'No results. Try a repo name, file name, or exact error text.',
      results: (count, query) => `Found ${count} results for "${query}".`,
      open: 'Open document'
    }
  };

  function localeFor(form) {
    return form.dataset.searchLocale || ((document.documentElement.lang || '').startsWith('en') ? 'en' : 'zh');
  }

  function tokenize(value) {
    const lower = value.toLowerCase();
    const ascii = lower.match(/[a-z0-9_.:/@+-]+/g) || [];
    const cjk = Array.from(lower.matchAll(/[\u3400-\u9fff]{2,}/g)).flatMap((match) => {
      const text = match[0];
      const out = [text];
      for (let i = 0; i < text.length - 1; i += 1) out.push(text.slice(i, i + 2));
      return out;
    });
    return Array.from(new Set([...ascii, ...cjk])).filter((token) => token.length > 1);
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function highlight(value, tokens) {
    let safe = escapeHtml(value);
    for (const token of tokens.slice(0, 8)) {
      safe = safe.replace(new RegExp(`(${escapeRegExp(escapeHtml(token))})`, 'ig'), '<mark>$1</mark>');
    }
    return safe;
  }

  function snippet(text, tokens) {
    const source = text.replace(/\s+/g, ' ').trim();
    const lower = source.toLowerCase();
    const hit = tokens.map((token) => lower.indexOf(token)).filter((index) => index >= 0).sort((a, b) => a - b)[0] || 0;
    const start = Math.max(0, hit - 72);
    const excerpt = source.slice(start, start + 240);
    return `${start > 0 ? '...' : ''}${excerpt}${start + 240 < source.length ? '...' : ''}`;
  }

  function loadIndex() {
    if (!indexPromise) {
      indexPromise = fetch(indexUrl)
        .then((response) => {
          if (!response.ok) throw new Error(`Search index returned ${response.status}`);
          return response.json();
        })
        .then((payload) => payload.chunks || []);
    }
    return indexPromise;
  }

  function scoreChunk(chunk, query, tokens) {
    const title = (chunk.title || '').toLowerCase();
    const heading = (chunk.heading || '').toLowerCase();
    const path = (chunk.path || '').toLowerCase();
    const text = (chunk.text || '').toLowerCase();
    const tags = (chunk.tags || []).join(' ').toLowerCase();
    const haystack = `${title} ${heading} ${path} ${tags} ${text}`;

    let score = haystack.includes(query) ? 22 : 0;
    for (const token of tokens) {
      if (title.includes(token)) score += 14;
      if (heading.includes(token)) score += 9;
      if (path.includes(token)) score += 7;
      if (tags.includes(token)) score += 6;
      if (text.includes(token)) score += 2;
    }
    if (chunk.search_priority === 'high') score *= 1.22;
    if ((chunk.section || '').includes('runbooks')) score += 2;
    return score;
  }

  function renderResults(form, results, query, tokens) {
    const locale = localeFor(form);
    const text = uiText[locale];
    const status = form.querySelector('[data-search-status]');
    const output = form.querySelector('[data-search-results]');
    if (!output) return;

    if (!query) {
      output.innerHTML = '';
      if (status) status.textContent = text.empty;
      return;
    }

    if (!results.length) {
      output.innerHTML = `<div class="search-empty">${text.none}</div>`;
      if (status) status.textContent = text.none;
      return;
    }

    if (status) status.textContent = text.results(results.length, query);
    output.innerHTML = results.slice(0, 12).map(({ chunk, score }) => {
      const url = chunk.url || '/';
      const meta = [chunk.section, chunk.updated_at].filter(Boolean).join(' · ');
      const tags = (chunk.tags || []).slice(0, 5).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
      return `
        <article class="search-result">
          <div class="search-result-score">${Math.round(score)}</div>
          <div>
            <a class="search-result-title" href="${escapeHtml(url)}">${highlight(chunk.title || url, tokens)}</a>
            <div class="search-result-heading">${highlight(chunk.heading || chunk.path || '', tokens)}</div>
            <p>${highlight(snippet(chunk.text || '', tokens), tokens)}</p>
            <div class="search-result-meta">${escapeHtml(meta || chunk.path || '')}</div>
            <div class="search-result-tags">${tags}<a href="${escapeHtml(url)}">${text.open}</a></div>
          </div>
        </article>
      `;
    }).join('');
  }

  async function runInlineSearch(form) {
    const input = form.querySelector('input[type="search"], input[name="q"], input');
    if (!input) return;
    const query = input.value.trim().toLowerCase();
    const tokens = tokenize(query);
    const chunks = await loadIndex();
    const results = query
      ? chunks
          .map((chunk) => ({ chunk, score: scoreChunk(chunk, query, tokens) }))
          .filter((item) => item.score > 0)
          .sort((a, b) => b.score - a.score)
      : [];
    renderResults(form, results, query, tokens);
  }

  function initForm(form) {
    if (form.dataset.searchReady === 'true') return;
    form.dataset.searchReady = 'true';
    const locale = localeFor(form);
    const text = uiText[locale];
    const input = form.querySelector('input[type="search"], input[name="q"], input');
    const status = form.querySelector('[data-search-status]');
    const mode = form.dataset.searchMode || 'inline';
    if (!input) return;

    if (status) status.textContent = text.loading;
    loadIndex().then(() => {
      if (status) status.textContent = text.ready;
      const params = new URLSearchParams(window.location.search);
      const urlQuery = params.get('q');
      if (urlQuery && mode === 'inline') {
        input.value = urlQuery;
        runInlineSearch(form);
      }
    }).catch((error) => {
      if (status) status.textContent = error.message;
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const query = input.value.trim();
      if (mode === 'redirect') {
        const target = new URL(form.getAttribute('action') || '/search/', window.location.origin);
        if (query) target.searchParams.set('q', query);
        window.location.href = target.pathname + target.search;
        return;
      }
      runInlineSearch(form);
    });

    input.addEventListener('input', () => {
      if (mode !== 'inline') return;
      window.clearTimeout(form._searchTimer);
      form._searchTimer = window.setTimeout(() => runInlineSearch(form), 140);
    });

    form.querySelectorAll('[data-search-query]').forEach((button) => {
      button.addEventListener('click', () => {
        input.value = button.getAttribute('data-search-query') || button.textContent.trim();
        if (mode === 'redirect') form.requestSubmit();
        else runInlineSearch(form);
      });
    });
  }

  function initSearch() {
    document.querySelectorAll('[data-handbook-search]').forEach(initForm);
  }

  document.addEventListener('DOMContentLoaded', initSearch);
  document.addEventListener('astro:page-load', initSearch);
  initSearch();
})();
