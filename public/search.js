// Small client-side search over /search-index.json.
// No deps. Loads the index on first focus, filters as the user types.
(() => {
  const form = document.querySelector('[data-wiki-search]');
  if (!form) return;
  const input = form.querySelector('[data-wiki-search-input]');
  const list = form.querySelector('[data-wiki-search-results]');
  if (!input || !list) return;

  let index = null;
  let loading = null;

  async function loadIndex() {
    if (index) return index;
    if (loading) return loading;
    loading = fetch('/search-index.json')
      .then((r) => r.json())
      .then((data) => { index = data; return index; })
      .catch(() => { index = []; return index; });
    return loading;
  }

  function score(record, q) {
    const t = record.title.toLowerCase();
    const k = (record.kahu_tok || '').toLowerCase();
    const s = (record.summary || '').toLowerCase();
    if (t === q) return 1000;
    if (t.startsWith(q)) return 500;
    if (k === q) return 400;
    if (k.startsWith(q)) return 300;
    if (t.includes(q)) return 200;
    if (k.includes(q)) return 150;
    if (s.includes(q)) return 50;
    return 0;
  }

  function render(results) {
    if (results.length === 0) {
      list.hidden = true;
      list.innerHTML = '';
      return;
    }
    list.hidden = false;
    list.innerHTML = results.slice(0, 10).map((r) => `
      <li>
        <a href="${r.url}">
          <span class="search-name">${r.title}</span>
          <span class="search-collection">${r.collection}</span>
        </a>
      </li>
    `).join('');
  }

  function search() {
    const q = input.value.trim().toLowerCase();
    if (!q || !index) {
      render([]);
      return;
    }
    const results = index
      .map((r) => ({ r, s: score(r, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.r);
    render(results);
  }

  input.addEventListener('focus', () => { loadIndex().then(search); });
  input.addEventListener('input', () => { loadIndex().then(search); });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      render([]);
      input.blur();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== input && !/^(input|textarea|select)$/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      input.focus();
    }
  });
  document.addEventListener('click', (e) => {
    if (!form.contains(e.target)) render([]);
  });
  form.addEventListener('submit', (e) => e.preventDefault());
})();
