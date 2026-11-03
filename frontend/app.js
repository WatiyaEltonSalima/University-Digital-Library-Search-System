const $ = (id) => document.getElementById(id);

const viewNames = {
  dashboard: 'Dashboard',
  search: 'Search Library',
  documents: 'All Documents',
  add: 'Add Document',
  manage: 'Manage Documents'
};

let allDocuments = [];
let statistics = { total: 0, categories: [] };
let searchTimer;

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || 'The library service returned an error.');
  return data;
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function preview(value = '') {
  const clean = value.replace(/\s+/g, ' ').trim();
  return clean ? `${clean.slice(0, 170)}${clean.length > 170 ? '…' : ''}` : 'No text preview is available for this resource.';
}

function setView(view) {
  const nextView = viewNames[view] ? view : 'dashboard';
  document.querySelectorAll('.view').forEach((element) => element.classList.toggle('active', element.id === `view-${nextView}`));
  document.querySelectorAll('[data-view]').forEach((element) => element.classList.toggle('active', element.dataset.view === nextView));
  $('breadcrumbCurrent').textContent = viewNames[nextView];
  history.replaceState(null, '', nextView === 'dashboard' ? '#' : `#${nextView}`);
  if (nextView === 'search') loadDocuments();
}

function renderStats() {
  const categoryCount = statistics.categories.length;
  const cards = [
    ['Total documents', statistics.total, 'Resources in the catalogue', '▤'],
    ['Categories', categoryCount, 'Academic resource types', '◫'],
    ['Latest publication year', allDocuments.reduce((latest, document) => Math.max(latest, Number(document.year) || 0), 0) || '—', 'Based on catalogue metadata', '◷']
  ];
  $('statGrid').innerHTML = cards.map(([label, value, note, icon]) => `<article class="stat-card"><div class="stat-top"><span>${escapeHtml(label)}</span><span class="stat-icon">${icon}</span></div><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></article>`).join('');
}

function renderCategories() {
  const highest = Math.max(...statistics.categories.map((category) => Number(category.count)), 1);
  $('categoryList').innerHTML = statistics.categories.map((category) => {
    const width = Math.round((Number(category.count) / highest) * 100);
    return `<div class="category-row"><div class="category-meta"><span>${escapeHtml(category.name)}</span><strong>${escapeHtml(category.count)}</strong></div><div class="bar-track"><span style="width:${width}%"></span></div></div>`;
  }).join('');
}

function renderDocuments(documents) {
  $('searchSummary').textContent = $('query').value.trim() ? `Results for “${$('query').value.trim()}”` : 'All resources';
  $('searchCount').textContent = `${documents.length} resource${documents.length === 1 ? '' : 's'}`;
  $('results').innerHTML = documents.map((document) => `<article class="result-card"><div class="result-top"><span class="category-tag">${escapeHtml(document.category)}</span><span class="document-id">ID ${escapeHtml(document.id)}</span></div><h2>${escapeHtml(document.title)}</h2><p class="result-author">${escapeHtml(document.author)}</p><p class="result-preview">${escapeHtml(preview(document.content))}</p><div class="result-footer"><span><strong>Publication year</strong> ${escapeHtml(document.year)}</span><button class="text-button" type="button" data-preview-id="${escapeHtml(document.id)}">View preview <span aria-hidden="true">→</span></button></div></article>`).join('');
  $('searchState').hidden = documents.length > 0;
  if (!documents.length) $('searchState').textContent = $('query').value.trim() ? 'No resources matched your search. Try fewer terms or switch to “any term”.' : 'No documents are available in the collection.';
}

async function loadStatistics() {
  try {
    statistics = await api('/api/stats');
    renderStats();
    renderCategories();
  } catch (error) {
    $('statGrid').innerHTML = `<div class="state-panel inline-state">${escapeHtml(error.message)}</div>`;
    $('categoryList').innerHTML = '';
  }
}

async function loadDocuments() {
  const query = $('query').value.trim();
  const mode = $('mode').value;
  const sort = $('sort').value;
  const direction = $('dir').value;
  $('searchState').hidden = true;
  $('results').innerHTML = '<div class="loading-state">Searching the live collection…</div>';
  try {
    const data = await api(`/api/documents?q=${encodeURIComponent(query)}&mode=${encodeURIComponent(mode)}&sort=${encodeURIComponent(sort)}&dir=${encodeURIComponent(direction)}`);
    allDocuments = data.documents || [];
    renderDocuments(allDocuments);
    renderStats();
  } catch (error) {
    $('results').innerHTML = '';
    $('searchState').hidden = false;
    $('searchState').textContent = error.message;
  }
}

function scheduleSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(loadDocuments, 220);
}

document.querySelectorAll('[data-view]').forEach((element) => element.addEventListener('click', () => setView(element.dataset.view)));
$('query').addEventListener('input', scheduleSearch);
$('query').addEventListener('keydown', (event) => { if (event.key === 'Enter') loadDocuments(); });
$('mode').addEventListener('change', loadDocuments);
$('sort').addEventListener('change', loadDocuments);
$('dir').addEventListener('change', loadDocuments);

const initialView = window.location.hash.slice(1);
setView(viewNames[initialView] ? initialView : 'dashboard');
loadStatistics();
loadDocuments();