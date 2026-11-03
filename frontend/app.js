const $ = (id) => document.getElementById(id);
const viewNames = { dashboard: 'Dashboard', search: 'Search Library', documents: 'All Documents', add: 'Add Document', manage: 'Manage Documents', about: 'About System' };
let allDocuments = [];
let statistics = { total: 0, categories: [] };
let searchTimer;

async function api(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok || data.ok === false) throw new Error(data.error || 'The library service returned an error.');
  return data;
}
function escapeHtml(value = '') { return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]); }
function preview(value = '') { const clean = value.replace(/\s+/g, ' ').trim(); return clean ? `${clean.slice(0, 160)}${clean.length > 160 ? '…' : ''}` : 'No text preview is available for this resource.'; }
function showToast(message, error = false) { const toast = $('toast'); toast.textContent = message; toast.className = `toast visible${error ? ' error' : ''}`; setTimeout(() => { toast.className = 'toast'; }, 3200); }

function setView(view) {
  const nextView = viewNames[view] ? view : 'dashboard';
  document.querySelectorAll('.view').forEach((element) => element.classList.toggle('active', element.id === `view-${nextView}`));
  document.querySelectorAll('[data-view]').forEach((element) => element.classList.toggle('active', element.dataset.view === nextView));
  history.replaceState(null, '', nextView === 'dashboard' ? '#' : `#${nextView}`);
  if (nextView === 'documents') loadDocuments('', true);
  if (nextView === 'manage') loadDocuments('', true);
  if (nextView === 'search') loadDocuments($('query').value.trim());
}
function renderStats() {
  const books = statistics.categories.find((category) => category.name === 'Books')?.count || 0;
  const papers = statistics.categories.find((category) => category.name === 'Research Papers')?.count || 0;
  const cards = [['Total Documents', statistics.total, 'Catalogue records', '▤'], ['Categories', statistics.categories.length, 'Resource types', '▰'], ['Books', books, 'Academic and reference', '▣'], ['Research Papers', papers, 'Published research', '✦']];
  $('statGrid').innerHTML = cards.map(([label, value, note, icon]) => `<article class="stat-card"><div><span>${icon}</span><small>${escapeHtml(label)}</small></div><strong>${escapeHtml(value)}</strong><em>${escapeHtml(note)}</em></article>`).join('');
}
function renderCategories() {
  const colors = ['blue', 'gold', 'coral', 'green', 'slate'];
  const highest = Math.max(...statistics.categories.map((category) => Number(category.count)), 1);
  $('categoryChart').innerHTML = statistics.categories.map((category, index) => { const width = Math.round((Number(category.count) / highest) * 100); return `<div class="category-item"><div><span class="category-dot ${colors[index % colors.length]}"></span><span>${escapeHtml(category.name)}</span><strong>${escapeHtml(category.count)}</strong></div><div class="category-bar"><i class="${colors[index % colors.length]}" style="width:${width}%"></i></div></div>`; }).join('');
}
function renderResults(documents) {
  const query = $('query').value.trim(); $('searchSummary').textContent = query ? `Search Results for “${query}”` : 'Search Results'; $('searchCount').textContent = `${documents.length} found`;
  $('results').innerHTML = documents.map((document) => `<article class="result-row"><div class="file-icon">▤</div><div class="result-main"><h3>${escapeHtml(document.title)}</h3><p>Author: ${escapeHtml(document.author)} <span>|</span> Year: ${escapeHtml(document.year)} <span>|</span> Category: ${escapeHtml(document.category)}</p><small>${escapeHtml(preview(document.content))}</small></div><button class="outline-button" data-preview-id="${escapeHtml(document.id)}" type="button">View Details</button></article>`).join('');
  $('searchState').hidden = documents.length > 0; if (!documents.length) $('searchState').textContent = query ? 'No resources matched your search.' : 'No documents are available.';
}
function renderTable(target, documents, manage = false) {
  target.innerHTML = documents.map((document) => `<tr><td>${escapeHtml(document.id)}</td><td class="title-cell">${escapeHtml(document.title)}</td><td>${escapeHtml(document.author)}</td><td><span class="table-tag">${escapeHtml(document.category)}</span></td><td>${escapeHtml(document.year)}</td>${manage ? `<td><button class="edit-button" data-edit-id="${escapeHtml(document.id)}" type="button">Edit</button><button class="delete-button" data-delete-id="${escapeHtml(document.id)}" type="button">Delete</button></td>` : ''}</tr>`).join('');
}
async function loadStatistics() { try { statistics = await api('/api/stats'); renderStats(); renderCategories(); } catch (error) { $('statGrid').innerHTML = `<div class="state-panel">${escapeHtml(error.message)}</div>`; } }
async function loadDocuments(query = '', includeAll = false) {
  const mode = $('mode').value; const sort = $('sort').value; const direction = $('dir').value;
  if (!includeAll) { $('results').innerHTML = '<div class="loading-state">Searching the live collection...</div>'; }
  try {
    const data = await api(`/api/documents?q=${encodeURIComponent(query)}&mode=${encodeURIComponent(mode)}&sort=${encodeURIComponent(sort)}&dir=${encodeURIComponent(direction)}`); allDocuments = data.documents || [];
    if ($('view-search').classList.contains('active')) renderResults(allDocuments);
    if ($('view-documents').classList.contains('active')) { renderTable($('documentsTable'), allDocuments); $('documentsCount').textContent = `${allDocuments.length} documents`; $('documentsState').hidden = allDocuments.length > 0; }
    if ($('view-manage').classList.contains('active')) renderManage(); renderStats();
  } catch (error) { if ($('view-search').classList.contains('active')) { $('results').innerHTML = ''; $('searchState').hidden = false; $('searchState').textContent = error.message; } else showToast(error.message, true); }
}
function renderManage() { const filter = $('manageCategory').value; const documents = filter === 'All' ? allDocuments : allDocuments.filter((document) => document.category === filter); renderTable($('manageTable'), documents, true); $('manageState').hidden = documents.length > 0; if (!documents.length) $('manageState').textContent = 'No documents match this category.'; }
function resetForm() { $('documentForm').reset(); $('docId').value = ''; $('formTitle').textContent = 'Document details'; $('year').value = new Date().getFullYear(); }
function fillForm(document) { $('docId').value = document.id; $('title').value = document.title; $('author').value = document.author; $('category').value = document.category; $('year').value = document.year; $('content').value = document.content || ''; $('formTitle').textContent = `Edit document ${document.id}`; setView('add'); }
async function saveDocument(event) { event.preventDefault(); const id = $('docId').value; const payload = { title: $('title').value.trim(), author: $('author').value.trim(), category: $('category').value, year: Number($('year').value), content: $('content').value }; try { await api(id ? `/api/documents/${id}` : '/api/documents', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); showToast(id ? 'Document updated successfully.' : 'Document added successfully.'); await loadStatistics(); setView('manage'); } catch (error) { showToast(error.message, true); } }
async function deleteDocument(id) { const document = allDocuments.find((item) => Number(item.id) === Number(id)); if (!document || !window.confirm(`Delete “${document.title}”? This cannot be undone.`)) return; try { await api(`/api/documents/${id}`, { method: 'DELETE' }); showToast('Document deleted successfully.'); await loadStatistics(); await loadDocuments('', true); } catch (error) { showToast(error.message, true); } }
function openPreview(id) { const document = allDocuments.find((item) => Number(item.id) === Number(id)); if (!document) return; $('previewTitle').textContent = document.title; $('previewMeta').textContent = `${document.author}  ·  ${document.category}  ·  ${document.year}`; $('previewContent').textContent = document.content || 'No text content was added for this document.'; $('previewDialog').showModal(); }

document.querySelectorAll('[data-view]').forEach((element) => element.addEventListener('click', () => { if (element.dataset.view === 'add') resetForm(); setView(element.dataset.view); }));
$('query').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => loadDocuments($('query').value.trim()), 220); });
$('searchButton').addEventListener('click', () => loadDocuments($('query').value.trim())); $('query').addEventListener('keydown', (event) => { if (event.key === 'Enter') loadDocuments($('query').value.trim()); });
$('mode').addEventListener('change', () => loadDocuments($('query').value.trim())); $('sort').addEventListener('change', () => loadDocuments($('query').value.trim())); $('dir').addEventListener('change', () => loadDocuments($('query').value.trim())); $('manageCategory').addEventListener('change', renderManage); $('documentForm').addEventListener('submit', saveDocument); $('clearForm').addEventListener('click', resetForm); $('closePreview').addEventListener('click', () => $('previewDialog').close());
$('results').addEventListener('click', (event) => { const button = event.target.closest('[data-preview-id]'); if (button) openPreview(button.dataset.previewId); }); $('manageTable').addEventListener('click', (event) => { const edit = event.target.closest('[data-edit-id]'); const remove = event.target.closest('[data-delete-id]'); if (edit) { const document = allDocuments.find((item) => Number(item.id) === Number(edit.dataset.editId)); if (document) fillForm(document); } if (remove) deleteDocument(remove.dataset.deleteId); });
const initialView = window.location.hash.slice(1); setView(viewNames[initialView] ? initialView : 'dashboard'); loadStatistics(); loadDocuments('', true);