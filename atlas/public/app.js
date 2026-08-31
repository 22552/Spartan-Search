const form = document.querySelector('#search-form');
const input = document.querySelector('#query');
const results = document.querySelector('#results');
const stats = document.querySelector('#stats');

const params = new URLSearchParams(location.search);
const initialQuery = params.get('q') || '';
input.value = initialQuery;

loadStats();
if (initialQuery) runSearch(initialQuery);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = input.value.trim();
  const next = new URL(location.href);

  if (query) next.searchParams.set('q', query);
  else next.searchParams.delete('q');

  history.pushState({}, '', next);
  runSearch(query);
});

window.addEventListener('popstate', () => {
  const query = new URLSearchParams(location.search).get('q') || '';
  input.value = query;
  runSearch(query);
});

async function loadStats() {
  try {
    const response = await fetch('/api/stats');
    if (!response.ok) throw new Error('stats failed');
    const data = await response.json();
    const pages = Number(data.pages || 0).toLocaleString();
    const hosts = Number(data.hosts || 0).toLocaleString();
    stats.textContent = `${pages} pages across ${hosts} hosts`;
  } catch {
    stats.textContent = 'Spartan index';
  }
}

async function runSearch(query) {
  if (!query) {
    results.replaceChildren();
    return;
  }

  results.innerHTML = '<p class="state">Searching…</p>';

  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'search failed');

    if (!data.results.length) {
      results.innerHTML = '<p class="state">No pages found.</p>';
      return;
    }

    const fragment = document.createDocumentFragment();
    const meta = document.createElement('p');
    meta.className = 'result-meta';
    meta.textContent = `${data.results.length} results · ${data.mode}`;
    fragment.append(meta);

    for (const item of data.results) {
      const article = document.createElement('article');
      article.className = 'result';

      const address = document.createElement('div');
      address.className = 'address';
      address.textContent = item.url;

      const title = document.createElement('h2');
      const link = document.createElement('a');
      link.href = toGatewayUrl(item.url);
      link.target = '_blank';
      link.rel = 'noreferrer';
      link.textContent = item.title || item.url;
      title.append(link);

      const snippet = document.createElement('p');
      snippet.className = 'snippet';
      snippet.textContent = compact(item.snippet || '');

      article.append(address, title, snippet);
      fragment.append(article);
    }

    results.replaceChildren(fragment);
  } catch (error) {
    const message = document.createElement('p');
    message.className = 'state error';
    message.textContent = error.message || 'Search failed.';
    results.replaceChildren(message);
  }
}

function compact(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function toGatewayUrl(url) {
  return `https://portal.mozz.us/gemini/${encodeURIComponent(url)}`;
}
