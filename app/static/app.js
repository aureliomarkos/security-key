// Security Key - Unified Dashboard JavaScript
const API_URL = '';
let token = localStorage.getItem('token');
let currentUser = null;
let categories = [];
let items = [];
let currentCategoryId = null;
let allUsers = [];

// ===== HELPERS =====
function isMobile() { return window.innerWidth < 768; }

function getIcon(name) {
    if (!name) return 'folder';
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, '_');
    const icons = {
        bank: 'account_balance', file: 'description', heart: 'favorite',
        briefcase: 'work', share: 'share', mail: 'mail',
        tv: 'tv', folder: 'folder', social: 'public',
        password: 'key', login: 'login', card: 'credit_card'
    };
    return icons[cleanName] || cleanName;
}

// ===== THEME =====
window.toggleTheme = function () {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    html.classList.toggle('dark', !isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    updateThemeUI();
};

function updateThemeUI() {
    const isDark = document.documentElement.classList.contains('dark');
    document.querySelectorAll('#themeIcon, #themeIconHeader, #themeIconMobile').forEach(el => {
        if (el) el.textContent = isDark ? 'light_mode' : 'dark_mode';
    });
    document.querySelectorAll('#themeText, #themeTextMobile').forEach(el => {
        if (el) el.textContent = isDark ? 'Modo Claro' : 'Modo Escuro';
    });
}

// ===== AUTH =====
async function login(email, password) {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData
    });
    if (!res.ok) throw new Error('Email ou senha incorretos');
    const data = await res.json();
    token = data.access_token;
    localStorage.setItem('token', token);
    return data;
}

async function register(nome, email, password) {
    const res = await fetch(`${API_URL}/api/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, password })
    });
    if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Erro ao criar conta'); }
    return await res.json();
}

async function fetchAPI(url, options = {}) {
    if (token) { options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` }; }
    const response = await fetch(url, options);
    if (response.status === 401) { window.logout(); throw new Error('Sessao expirada.'); }
    return response;
}

async function getProfile() {
    const res = await fetchAPI(`${API_URL}/api/auth/me`);
    if (!res.ok) throw new Error('Falha ao carregar perfil');
    return await res.json();
}

window.logout = function () {
    localStorage.removeItem('token');
    token = null;
    currentUser = null;
    if (isMobile()) {
        window.location.reload();
    } else {
        document.getElementById('dashboard').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('flex');
        document.getElementById('loginScreen').classList.remove('hidden');
    }
};

// ===== REGISTER MODAL =====
window.showRegister = function () {
    const modal = document.getElementById('registerModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};
window.hideRegister = function () {
    const modal = document.getElementById('registerModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

// ===== TAB MANAGEMENT (mobile) =====
const tabs = ['vault', 'categories', 'settings'];
function switchTab(tabName) {
    tabs.forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        if (el) el.classList.toggle('hidden', t !== tabName);
    });
    document.querySelectorAll('.nav-btn').forEach(btn => {
        const btnTab = btn.getAttribute('data-tab');
        const isActive = btnTab === tabName;
        const iconContainer = btn.querySelector('.nav-icon-container');
        const icon = btn.querySelector('.material-symbols-outlined');
        const text = btn.querySelector('.nav-text');
        if (isActive) {
            iconContainer.classList.remove('text-slate-400', 'dark:text-white/40');
            iconContainer.classList.add('bg-primary/10', 'text-primary');
            icon.classList.add('filled');
            text.classList.remove('text-slate-400', 'dark:text-white/40');
            text.classList.add('text-slate-900', 'dark:text-white');
        } else {
            iconContainer.classList.add('text-slate-400', 'dark:text-white/40');
            iconContainer.classList.remove('bg-primary/10', 'text-primary');
            icon.classList.remove('filled');
            text.classList.add('text-slate-400', 'dark:text-white/40');
            text.classList.remove('text-slate-900', 'dark:text-white');
        }
    });
    const fab = document.getElementById('fab-add');
    if (fab) fab.classList.toggle('hidden', tabName !== 'vault');
}

// ===== CATEGORIES =====
async function loadCategories() {
    const res = await fetchAPI(`${API_URL}/api/categorias`);
    categories = await res.json();
    renderCategoriesDesktop();
    renderCategoriesMobile();
    renderCategoriesListDesktop();
    renderCategoriesListMobile();
    populateCategorySelect();
}

function renderCategoriesDesktop() {
    const nav = document.getElementById('categoriesNav');
    if (!nav) return;
    let html = `<a href="#" onclick="filterByCategory(null); return false;" class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${!currentCategoryId ? 'bg-primary/10 text-primary' : 'text-[#5c4a3d] dark:text-gray-400 hover:bg-[#f5f2f0] dark:hover:bg-white/5'} transition-colors">
        <span class="material-symbols-outlined ${!currentCategoryId ? 'fill' : ''}">home</span>
        <span class="text-sm font-${!currentCategoryId ? 'bold' : 'medium'}">Todos</span>
    </a>`;
    categories.forEach(c => {
        const active = currentCategoryId === c.id;
        html += `<a href="#" onclick="filterByCategory('${c.id}'); return false;" class="flex items-center gap-3 px-3 py-2.5 rounded-lg ${active ? 'bg-primary/10 text-primary' : 'text-[#5c4a3d] dark:text-gray-400 hover:bg-[#f5f2f0] dark:hover:bg-white/5'} transition-colors">
            <span class="material-symbols-outlined ${active ? 'fill' : ''}" style="color: ${c.cor}">${getIcon(c.icone)}</span>
            <span class="text-sm font-${active ? 'bold' : 'medium'}">${c.nome}</span>
        </a>`;
    });
    html += `<div class="mt-4 pt-4 border-t border-[#f5f2f0] dark:border-white/5">
        <button onclick="showCategoryModal()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#5c4a3d] dark:text-gray-400 hover:bg-[#f5f2f0] dark:hover:bg-white/5 transition-colors group">
            <span class="material-symbols-outlined group-hover:text-primary transition-colors">settings</span>
            <span class="text-sm font-medium group-hover:text-primary transition-colors">Gerenciar Categorias</span>
        </button>
    </div>`;
    nav.innerHTML = html;
}

function renderCategoriesMobile() {
    const nav = document.getElementById('categoriesNavMobile');
    if (!nav) return;
    let html = `<button onclick="filterByCategory(null)" class="flex h-10 shrink-0 items-center justify-center px-5 gap-2 rounded-full ${!currentCategoryId ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60'} transition-all active:scale-95">
        <span class="material-symbols-outlined text-[20px]">grid_view</span>
        <span class="text-sm font-semibold">Todos</span>
    </button>`;
    categories.forEach(c => {
        const isActive = currentCategoryId === c.id;
        html += `<button onclick="filterByCategory('${c.id}')" class="flex h-10 shrink-0 items-center justify-center px-5 gap-2 rounded-full ${isActive ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-white dark:bg-card-dark border border-slate-200 dark:border-white/5 text-slate-600 dark:text-white/60'} transition-all active:scale-95">
            <span class="material-symbols-outlined text-[20px]" style="${!isActive ? 'color:' + c.cor : ''}">${getIcon(c.icone)}</span>
            <span class="text-sm ${isActive ? 'font-semibold' : 'font-medium'}">${c.nome}</span>
        </button>`;
    });
    nav.innerHTML = html;
}

function renderCategoriesListDesktop() {
    const list = document.getElementById('categoriesListDesktop');
    if (!list) return;
    list.innerHTML = categories.map(c => {
        const isGlobal = !c.usuario_id;
        return `<div class="flex items-center justify-between p-2 rounded-lg hover:bg-[#f8f7f5] dark:hover:bg-white/5 group border border-transparent hover:border-[#e6e0db] dark:hover:border-white/10 transition-all">
            <div class="flex items-center gap-2 overflow-hidden">
                <div class="size-6 rounded-md flex items-center justify-center text-white" style="background-color: ${c.cor}">
                    <span class="material-symbols-outlined text-[14px]">${getIcon(c.icone)}</span>
                </div>
                <span class="text-sm truncate max-w-[120px]">${c.nome}</span>
                ${isGlobal ? '<span class="text-[10px] bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500">Padrao</span>' : ''}
            </div>
            ${!isGlobal ? `<div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onclick="editCategory('${c.id}')" class="p-1 text-[#8c735f] hover:text-primary rounded hover:bg-white dark:hover:bg-white/10" title="Editar"><span class="material-symbols-outlined text-[16px]">edit</span></button>
                <button onclick="deleteCategory('${c.id}')" class="p-1 text-[#8c735f] hover:text-red-500 rounded hover:bg-white dark:hover:bg-white/10" title="Excluir"><span class="material-symbols-outlined text-[16px]">delete</span></button>
            </div>` : ''}
        </div>`;
    }).join('');
}

function renderCategoriesListMobile() {
    const list = document.getElementById('categoriesListMobile');
    const listManage = document.getElementById('categoriesListMobileManage');
    [list, listManage].forEach(el => {
        if (!el) return;
        el.innerHTML = categories.map(c => `
            <div class="flex items-center justify-between p-4 bg-white dark:bg-card-dark rounded-custom border border-slate-100 dark:border-white/5 shadow-sm">
                <div class="flex items-center gap-4">
                    <div class="size-10 rounded-xl flex items-center justify-center text-white" style="background-color: ${c.cor}">
                        <span class="material-symbols-outlined text-lg">${getIcon(c.icone)}</span>
                    </div>
                    <div>
                        <h3 class="font-bold">${c.nome}</h3>
                        ${!c.usuario_id ? '<span class="text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500">Padrao</span>' : ''}
                    </div>
                </div>
                ${c.usuario_id ? `<div class="flex items-center gap-2">
                    <button onclick="editCategory('${c.id}')" class="size-9 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400"><span class="material-symbols-outlined text-xl">edit</span></button>
                    <button onclick="deleteCategory('${c.id}')" class="size-9 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-red-400"><span class="material-symbols-outlined text-xl">delete</span></button>
                </div>` : ''}
            </div>
        `).join('');
    });
}

window.filterByCategory = function (catId) {
    currentCategoryId = catId;
    const cat = categories.find(c => c.id === catId);
    const el = document.getElementById('currentCategory');
    if (el) el.textContent = cat?.nome || 'Todos os Itens';
    renderCategoriesDesktop();
    renderCategoriesMobile();
    loadItems();
};

window.filterItems = function () { renderItems(); };

function populateCategorySelect() {
    const selects = document.querySelectorAll('#itemCategoria');
    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = '<option value="">Selecione...</option>' + categories.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
    });
}

// ===== CATEGORY MODALS =====
window.showCategoryModal = function () {
    const modal = document.getElementById('categoryModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    renderCategoriesListDesktop();
    renderCategoriesListMobile();
    prepareNewCategory();
};

window.hideCategoryModal = function () {
    const modal = document.getElementById('categoryModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    loadCategories();
};

window.prepareNewCategory = function () {
    document.getElementById('categoryFormTitle').textContent = 'Nova Categoria';
    const idEl = document.getElementById('catId');
    const idMobileEl = document.getElementById('catIdMobile');
    if (idEl) idEl.value = '';
    if (idMobileEl) idMobileEl.value = '';
    const nomeEl = document.getElementById('catNome');
    const nomeMobileEl = document.getElementById('catNomeMobile');
    if (nomeEl) nomeEl.value = '';
    if (nomeMobileEl) nomeMobileEl.value = '';
    const iconeEl = document.getElementById('catIcone');
    const iconeMobileEl = document.getElementById('catIconeMobile');
    if (iconeEl) iconeEl.value = '';
    if (iconeMobileEl) iconeMobileEl.value = '';
    const corEl = document.getElementById('catCor');
    const corMobileEl = document.getElementById('catCorMobile');
    if (corEl) corEl.value = '#f77c18';
    if (corMobileEl) corMobileEl.value = '#f77c18';
    updateIconPreview();
    updateIconPreviewMobile();
};

window.editCategory = function (id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    document.getElementById('categoryFormTitle').textContent = 'Editar Categoria';
    const idEl = document.getElementById('catId');
    const idMobileEl = document.getElementById('catIdMobile');
    if (idEl) idEl.value = cat.id;
    if (idMobileEl) idMobileEl.value = cat.id;
    const nomeEl = document.getElementById('catNome');
    const nomeMobileEl = document.getElementById('catNomeMobile');
    if (nomeEl) nomeEl.value = cat.nome;
    if (nomeMobileEl) nomeMobileEl.value = cat.nome;
    const iconeEl = document.getElementById('catIcone');
    const iconeMobileEl = document.getElementById('catIconeMobile');
    if (iconeEl) iconeEl.value = cat.icone || '';
    if (iconeMobileEl) iconeMobileEl.value = cat.icone || '';
    const corEl = document.getElementById('catCor');
    const corMobileEl = document.getElementById('catCorMobile');
    if (corEl) corEl.value = cat.cor || '#f77c18';
    if (corMobileEl) corMobileEl.value = cat.cor || '#f77c18';
    updateIconPreview();
    updateIconPreviewMobile();
};

window.deleteCategory = async function (id) {
    if (!confirm('Excluir esta categoria?')) return;
    await fetchAPI(`${API_URL}/api/categorias/${id}`, { method: 'DELETE' });
    loadCategories();
};

window.updateIconPreview = function () {
    const icon = document.getElementById('catIcone')?.value || 'category';
    const color = document.getElementById('catCor')?.value || '#f77c18';
    const preview = document.querySelector('#iconPreview span');
    if (preview) { preview.textContent = getIcon(icon); preview.style.color = color; }
    const hex = document.getElementById('colorHex');
    if (hex) hex.textContent = color;
};

window.updateIconPreviewMobile = function () {
    const icon = document.getElementById('catIconeMobile')?.value || 'category';
    const color = document.getElementById('catCorMobile')?.value || '#f77c18';
    const preview = document.querySelector('#iconPreviewMobile span');
    if (preview) { preview.textContent = getIcon(icon); preview.style.color = color; }
    const hex = document.getElementById('colorHexMobile');
    if (hex) hex.textContent = color;
};

// ===== ITEMS =====
async function loadItems() {
    let url = `${API_URL}/api/itens`;
    if (currentCategoryId) url += `?categoria_id=${currentCategoryId}`;
    const res = await fetchAPI(url);
    items = await res.json();
    renderItems();
}

function renderItems() {
    const searchEl = document.getElementById('searchInput') || document.getElementById('searchInputMobile');
    const search = searchEl ? searchEl.value.toLowerCase() : '';
    const filtered = items.filter(i => i.titulo.toLowerCase().includes(search));

    // Desktop grid
    const desktopGrid = document.getElementById('itemsGrid');
    if (desktopGrid && !isMobile()) {
        desktopGrid.innerHTML = buildDesktopItemsHTML(filtered);
    }

    // Mobile list
    const mobileGrid = document.getElementById('itemsGridMobile');
    if (mobileGrid && isMobile()) {
        mobileGrid.innerHTML = buildMobileItemsHTML(filtered);
    }
}

function buildDesktopItemsHTML(filtered) {
    let html = filtered.map(item => {
        const cat = categories.find(c => c.id === item.category_id);
        const isShared = item.user_id !== currentUser.id;
        return `<div onclick="showItemDetailModal('${item.id}')" class="group relative flex flex-col bg-white dark:bg-card-dark border border-[#e6e0db] dark:border-white/10 rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer">
            <div class="absolute top-4 right-4 flex gap-2">
                ${item.favorito ? '<span class="material-symbols-outlined fill text-primary text-[20px]">star</span>' : ''}
                ${!isShared ? `
                <button onclick="event.stopPropagation(); showShareModal('${item.id}')" class="text-[#8c735f] hover:text-primary" title="Compartilhar"><span class="material-symbols-outlined text-[20px]">share</span></button>
                <button onclick="event.stopPropagation(); editItem('${item.id}')" class="text-[#8c735f] hover:text-primary" title="Editar"><span class="material-symbols-outlined text-[20px]">edit</span></button>
                <button onclick="event.stopPropagation(); deleteItem('${item.id}')" class="text-[#8c735f] hover:text-red-500" title="Excluir"><span class="material-symbols-outlined text-[20px]">delete</span></button>
                ` : (item.pode_editar ? `<button onclick="event.stopPropagation(); editItem('${item.id}')" class="text-[#8c735f] hover:text-primary" title="Editar"><span class="material-symbols-outlined text-[20px]">edit</span></button>` : '')}
            </div>
            <div class="flex items-center gap-4 mb-4">
                <div class="size-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background: ${cat?.cor || '#6366f1'}20">
                    <span class="material-symbols-outlined" style="color: ${cat?.cor || '#6366f1'}">${getIcon(cat?.icone)}</span>
                </div>
                <div class="flex-1 min-w-0 pr-20">
                    <h3 class="text-sm font-semibold line-clamp-2 leading-tight mb-0.5" title="${item.titulo}">${item.titulo}</h3>
                    <p class="text-[11px] text-[#8c735f] dark:text-gray-400 truncate">${cat?.nome || 'Sem categoria'}</p>
                    ${isShared ? `<p class="text-[10px] text-primary font-bold mt-1">Dono: ${item.dono_nome}</p>` : ''}
                </div>
            </div>
            <div class="space-y-2 flex-1 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                ${(item.campos || []).slice(0, 3).map((c, idx) => buildFieldHTML(item.id, c, idx, false)).join('')}
                ${(item.campos || []).length > 3 ? `<p class="text-xs text-primary font-medium">+${item.campos.length - 3} campos...</p>` : ''}
            </div>
            ${item.nota_adicional ? `<p class="mt-3 pt-3 border-t border-[#f5f2f0] dark:border-white/5 text-xs text-[#8c735f] line-clamp-2">${item.nota_adicional}</p>` : ''}
        </div>`;
    }).join('');
    html += `<div onclick="showItemModal()" class="flex flex-col items-center justify-center bg-[#f8f7f5] dark:bg-white/5 border-2 border-dashed border-[#e6e0db] dark:border-white/10 rounded-xl p-5 hover:border-primary cursor-pointer transition-all min-h-[200px]">
        <div class="size-14 rounded-full bg-white dark:bg-white/10 flex items-center justify-center mb-3">
            <span class="material-symbols-outlined text-primary text-2xl">add</span>
        </div>
        <h3 class="text-base font-bold">Novo Item</h3>
    </div>`;
    return html;
}

function buildMobileItemsHTML(filtered) {
    return filtered.map(item => {
        const cat = categories.find(c => c.id === item.category_id);
        const iconColor = cat?.cor || '#f77c18';
        const isShared = item.user_id !== currentUser.id;
        return `<div onclick="showItemDetailModal('${item.id}')" class="group relative flex flex-col bg-white dark:bg-card-dark rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm active:scale-[0.99] transition-all duration-200 p-5 cursor-pointer">
            <div class="absolute top-4 right-4 flex gap-1">
                ${item.favorito ? '<span class="material-symbols-outlined filled text-primary text-[20px]">star</span>' : ''}
                ${!isShared ? `
                <button onclick="event.stopPropagation(); showShareModal('${item.id}')" class="size-8 flex items-center justify-center rounded-full text-slate-400 hover:text-primary" title="Compartilhar"><span class="material-symbols-outlined text-[18px]">share</span></button>
                <button onclick="event.stopPropagation(); editItem('${item.id}')" class="size-8 flex items-center justify-center rounded-full text-slate-400 hover:text-primary" title="Editar"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                <button onclick="event.stopPropagation(); deleteItem('${item.id}')" class="size-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500" title="Excluir"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                ` : (item.pode_editar ? `<button onclick="event.stopPropagation(); editItem('${item.id}')" class="size-8 flex items-center justify-center rounded-full text-slate-400 hover:text-primary" title="Editar"><span class="material-symbols-outlined text-[18px]">edit</span></button>` : '')}
            </div>
            <div class="flex items-center gap-4 mb-4 pr-32">
                <div class="flex items-center justify-center size-12 rounded-2xl shrink-0" style="background-color: ${iconColor}1a; color: ${iconColor}">
                    <span class="material-symbols-outlined">${getIcon(cat?.icone)}</span>
                </div>
                <div class="flex flex-col min-w-0">
                    <h3 class="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight" title="${item.titulo}">${item.titulo}</h3>
                    <div class="flex flex-col gap-0.5">
                        <div class="flex items-center gap-2">
                            <span class="size-1.5 rounded-full" style="background-color: ${iconColor}"></span>
                            <span class="text-xs font-medium text-slate-500 dark:text-white/50">${cat?.nome || 'Sem categoria'}</span>
                        </div>
                        ${isShared ? `<span class="text-[10px] text-primary font-bold">Respon: ${item.dono_nome}</span>` : ''}
                    </div>
                </div>
            </div>
            <div class="space-y-2 flex-1 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                ${(item.campos || []).slice(0, 2).map((c, idx) => buildFieldHTML(item.id, c, idx, true)).join('')}
                ${(item.campos || []).length > 2 ? `<p class="text-xs text-primary font-medium">+${item.campos.length - 2} campos...</p>` : ''}
            </div>
            ${item.nota_adicional ? `<p class="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400 line-clamp-2">${item.nota_adicional}</p>` : ''}
        </div>`;
    }).join('');
}

function buildFieldHTML(itemId, c, idx, mobile) {
    const fieldId = `field_${itemId}_${idx}`;
    const escapedValue = (c.value || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
    const baseClass = mobile ? 'text-slate-400 text-xs' : 'text-[#8c735f]';
    const valueClass = mobile ? 'text-slate-700 dark:text-gray-200 font-medium' : 'text-[#181411] dark:text-gray-200';
    const borderClass = mobile ? 'border-b border-slate-100 dark:border-white/5 py-1.5 last:border-0' : '';
    if (c.is_sensitive) {
        return `<div class="flex items-center gap-2 text-sm ${borderClass}">
            <span class="${baseClass} w-20 truncate shrink-0">${c.label}:</span>
            <span id="${fieldId}" class="${valueClass} truncate flex-1" data-value="${escapedValue}" data-hidden="true">&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;</span>
            <button onclick="togglePassword('${fieldId}')" class="${baseClass} hover:text-primary shrink-0"><span id="${fieldId}_icon" class="material-symbols-outlined text-[16px]">visibility</span></button>
            <button onclick="copyField('${escapedValue}')" class="${baseClass} hover:text-primary shrink-0"><span class="material-symbols-outlined text-[16px]">content_copy</span></button>
        </div>`;
    } else {
        return `<div class="flex items-center gap-2 text-sm ${borderClass}">
            <span class="${baseClass} w-20 truncate shrink-0">${c.label}:</span>
            <span class="${valueClass} truncate flex-1">${c.value || '-'}</span>
            ${mobile ? `<button onclick="copyField('${escapedValue}')" class="${baseClass} hover:text-primary shrink-0"><span class="material-symbols-outlined text-[16px]">content_copy</span></button>` : ''}
        </div>`;
    }
}

window.togglePassword = function (fieldId) {
    const field = document.getElementById(fieldId);
    const icon = document.getElementById(fieldId + '_icon');
    if (!field || !icon) return;
    const isHidden = field.getAttribute('data-hidden') === 'true';
    const value = field.getAttribute('data-value');
    if (isHidden) {
        field.textContent = value;
        field.setAttribute('data-hidden', 'false');
        icon.textContent = 'visibility_off';
    } else {
        field.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
        field.setAttribute('data-hidden', 'true');
        icon.textContent = 'visibility';
    }
};

window.copyField = function (text) {
    navigator.clipboard.writeText(text);
    alert('Copiado!');
};

// ===== ITEM MODAL =====
window.showItemModal = function (item = null) {
    const modal = document.getElementById('itemModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('itemModalTitle').textContent = item ? 'Editar Item' : 'Novo Item';
    document.getElementById('itemId').value = item?.id || '';
    document.getElementById('itemTitulo').value = item?.titulo || '';
    document.getElementById('itemCategoria').value = item?.category_id || '';
    document.getElementById('itemFavorito').checked = item?.favorito || false;
    document.getElementById('itemNota').value = item?.nota_adicional || '';
    const container = document.getElementById('fieldsContainer');
    container.innerHTML = '';
    if (item?.campos) item.campos.forEach(c => addField(c));
    else addField();
    updateFieldsScroll();
};

window.hideItemModal = function () {
    const modal = document.getElementById('itemModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

window.addField = function (field = null) {
    const container = document.getElementById('fieldsContainer');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-start';
    div.innerHTML = `
        <input type="text" placeholder="Nome" value="${field?.label || ''}" class="flex-1 px-3 py-2 rounded-lg bg-[#f8f7f5] dark:bg-white/5 border border-[#e6e0db] dark:border-white/10 text-sm outline-none field-label"/>
        <input type="text" placeholder="Valor" value="${field?.value || ''}" class="flex-1 px-3 py-2 rounded-lg bg-[#f8f7f5] dark:bg-white/5 border border-[#e6e0db] dark:border-white/10 text-sm outline-none field-value"/>
        <label class="flex items-center gap-1 text-xs text-[#8c735f] whitespace-nowrap">
            <input type="checkbox" ${field?.is_sensitive ? 'checked' : ''} class="rounded border-[#e6e0db] text-primary focus:ring-primary field-sensitive"/>
            Sensivel
        </label>
        <button type="button" onclick="removeField(this)" class="text-red-500 hover:text-red-700"><span class="material-symbols-outlined text-[20px]">remove</span></button>
    `;
    container.appendChild(div);
    updateFieldsScroll();
};

function updateFieldsScroll() {
    const container = document.getElementById('fieldsContainer');
    if (!container) return;

    const hasMoreThanTwoFields = container.children.length > 2;
    container.style.maxHeight = hasMoreThanTwoFields ? '112px' : '';
    container.style.overflowY = hasMoreThanTwoFields ? 'auto' : 'visible';
}

window.removeField = function (button) {
    button.parentElement.remove();
    updateFieldsScroll();
};

// ===== ITEM DETAIL MODAL =====
let currentDetailItem = null;

window.showItemDetailModal = function (itemId) {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    
    currentDetailItem = item;
    const cat = categories.find(c => c.id === item.category_id);
    const modal = document.getElementById('itemDetailModal');
    
    // Set icon
    const iconContainer = document.getElementById('detailIcon');
    iconContainer.style.backgroundColor = (cat?.cor || '#6366f1') + '20';
    iconContainer.querySelector('span').style.color = cat?.cor || '#6366f1';
    iconContainer.querySelector('span').textContent = getIcon(cat?.icone);
    
    // Set title and category
    document.getElementById('detailTitle').textContent = item.titulo;
    document.getElementById('detailCategory').textContent = cat?.nome || 'Sem categoria';
    
    // Set notes
    const notesSection = document.getElementById('detailNotesSection');
    if (item.nota_adicional) {
        notesSection.classList.remove('hidden');
        document.getElementById('detailNotes').textContent = item.nota_adicional;
    } else {
        notesSection.classList.add('hidden');
    }
    
    // Set fields - show ALL fields with full values
    const fieldsContainer = document.getElementById('detailFields');
    fieldsContainer.innerHTML = (item.campos || []).map(c => {
        if (c.is_sensitive) {
            return `
                <div class="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <span class="text-xs font-semibold text-slate-400">${c.label}</span>
                    <div class="flex items-center gap-2">
                        <span class="detail-field-value text-sm font-medium flex-1" data-value="${(c.value || '').replace(/"/g, '&quot;')}" data-hidden="true">&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;</span>
                        <button onclick="toggleDetailFieldPassword(this)" class="text-slate-400 hover:text-primary">
                            <span class="material-symbols-outlined text-lg">visibility</span>
                        </button>
                        <button onclick="copyField('${(c.value || '').replace(/'/g, "\\'")}')" class="text-slate-400 hover:text-primary">
                            <span class="material-symbols-outlined text-lg">content_copy</span>
                        </button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="flex flex-col gap-1 p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <span class="text-xs font-semibold text-slate-400">${c.label}</span>
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-medium flex-1 break-words">${c.value || '-'}</span>
                        <button onclick="copyField('${(c.value || '').replace(/'/g, "\\'")}')" class="text-slate-400 hover:text-primary shrink-0">
                            <span class="material-symbols-outlined text-lg">content_copy</span>
                        </button>
                    </div>
                </div>
            `;
        }
    }).join('');
    
    // Show modal
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.hideItemDetailModal = function () {
    const modal = document.getElementById('itemDetailModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    currentDetailItem = null;
};

window.toggleDetailFieldPassword = function (btn) {
    const field = btn.parentElement.querySelector('.detail-field-value');
    const icon = btn.querySelector('span');
    const isHidden = field.getAttribute('data-hidden') === 'true';
    const value = field.getAttribute('data-value');
    
    if (isHidden) {
        field.textContent = value;
        field.setAttribute('data-hidden', 'false');
        icon.textContent = 'visibility_off';
    } else {
        field.textContent = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';
        field.setAttribute('data-hidden', 'true');
        icon.textContent = 'visibility';
    }
};

window.editItemFromDetail = function () {
    if (currentDetailItem) {
        const itemId = currentDetailItem.id;
        hideItemDetailModal();
        editItem(itemId);
    }
};

window.deleteItemFromDetail = async function () {
    if (!currentDetailItem) return;
    if (!confirm('Excluir este item?')) return;
    await fetchAPI(`${API_URL}/api/itens/${currentDetailItem.id}`, { method: 'DELETE' });
    hideItemDetailModal();
    loadItems();
};

window.editItem = function (id) {
    const item = items.find(i => i.id === id);
    if (item) showItemModal(item);
};

window.deleteItem = async function (id) {
    if (!confirm('Excluir este item?')) return;
    await fetchAPI(`${API_URL}/api/itens/${id}`, { method: 'DELETE' });
    loadItems();
};

// ===== SHARE =====
async function loadAllUsers() {
    try {
        const res = await fetchAPI(`${API_URL}/api/usuarios`);
        allUsers = await res.json();
    } catch (err) { allUsers = []; }
}

window.showShareModal = async function (itemId) {
    const modal = document.getElementById('shareModal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.getElementById('shareItemId').value = itemId;
    if (allUsers.length === 0) await loadAllUsers();
    await loadItemPermissions(itemId);
};

window.hideShareModal = function () {
    const modal = document.getElementById('shareModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

async function loadItemPermissions(itemId) {
    const listEl = document.getElementById('sharedUsersList');
    const selectEl = document.getElementById('shareUserSelect');
    try {
        const res = await fetchAPI(`${API_URL}/api/permissoes/item/${itemId}`);
        const permissions = await res.json();
        if (permissions.length === 0) {
            listEl.innerHTML = '<p class="text-sm text-slate-400 text-center">Nenhuma pessoa com acesso ainda.</p>';
        } else {
            listEl.innerHTML = permissions.map(p => `
                <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-bold">${p.usuario_compartilhado?.nome || 'Usuario'}</span>
                        <span class="text-[10px] opacity-50">${p.nivel_acesso}</span>
                    </div>
                    <button onclick="removeShare('${p.id}')" class="text-red-400"><span class="material-symbols-outlined text-sm">close</span></button>
                </div>
            `).join('');
        }
        const sharedIds = permissions.map(p => p.shared_with_user_id);
        const available = allUsers.filter(u => !sharedIds.includes(u.id) && u.id !== currentUser.id);
        selectEl.innerHTML = '<option value="">Selecionar...</option>' + available.map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
    } catch (err) {
        listEl.innerHTML = '<p class="text-sm text-red-500 text-center">Erro ao carregar permissoes.</p>';
    }
}

window.addShare = async function () {
    const itemId = document.getElementById('shareItemId').value;
    const userId = document.getElementById('shareUserSelect').value;
    const accessLevel = document.getElementById('shareAccessLevel').value;
    if (!userId) { alert('Selecione um usuario para compartilhar.'); return; }
    try {
        const res = await fetchAPI(`${API_URL}/api/permissoes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ item_id: itemId, shared_with_user_id: userId, nivel_acesso: accessLevel })
        });
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Erro ao compartilhar'); }
        await loadItemPermissions(itemId);
    } catch (err) { alert(err.message); }
};

window.removeShare = async function (permissionId) {
    if (!confirm('Remover acesso desta pessoa?')) return;
    const itemId = document.getElementById('shareItemId').value;
    try {
        await fetchAPI(`${API_URL}/api/permissoes/${permissionId}`, { method: 'DELETE' });
        await loadItemPermissions(itemId);
    } catch (err) { alert('Erro ao remover permissao.'); }
};

// ===== INIT =====
async function initDashboard() {
    try {
        currentUser = await getProfile();
        // Desktop elements
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        if (userName) userName.textContent = currentUser.nome;
        if (userEmail) userEmail.textContent = currentUser.email;
        // Mobile elements
        const userNameHeader = document.getElementById('userNameHeader');
        const userNameMobile = document.getElementById('userNameMobile');
        const userEmailMobile = document.getElementById('userEmailMobile');
        if (userNameHeader) userNameHeader.textContent = currentUser.nome.split(' ')[0];
        if (userNameMobile) userNameMobile.textContent = currentUser.nome;
        if (userEmailMobile) userEmailMobile.textContent = currentUser.email;

        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        if (!isMobile()) {
            document.getElementById('dashboard').classList.add('flex');
        }

        await loadCategories();
        await loadItems();
    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        window.logout();
    }
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', function () {
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    updateThemeUI();

    // Bottom Nav Tabs
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    // Login form
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('loginError');
        err.classList.add('hidden');
        try {
            await login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
            await initDashboard();
        } catch (ex) {
            err.textContent = ex.message;
            err.classList.remove('hidden');
        }
    });

    // Register form
    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('registerError');
        err.classList.add('hidden');
        try {
            await register(
                document.getElementById('registerName').value,
                document.getElementById('registerEmail').value,
                document.getElementById('registerPassword').value
            );
            hideRegister();
            alert('Conta criada! Faca login.');
        } catch (ex) {
            err.textContent = ex.message;
            err.classList.remove('hidden');
        }
    });

    // Item form
    document.getElementById('itemForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('itemId').value;
        const campos = [];
        document.querySelectorAll('#fieldsContainer > div').forEach(div => {
            const label = div.querySelector('.field-label').value;
            const value = div.querySelector('.field-value').value;
            const is_sensitive = div.querySelector('.field-sensitive').checked;
            if (label) campos.push({ label, value, is_sensitive, field_type: is_sensitive ? 'senha' : 'texto' });
        });
        const data = {
            titulo: document.getElementById('itemTitulo').value,
            category_id: document.getElementById('itemCategoria').value || null,
            favorito: document.getElementById('itemFavorito').checked,
            nota_adicional: document.getElementById('itemNota').value,
            campos
        };
        await fetchAPI(`${API_URL}/api/itens${id ? '/' + id : ''}`, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        hideItemModal();
        loadItems();
    });

    // Category form (desktop)
    document.getElementById('categoryForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('catId').value;
        const data = {
            nome: document.getElementById('catNome').value,
            icone: document.getElementById('catIcone').value,
            cor: document.getElementById('catCor').value,
            descricao: ''
        };
        await fetchAPI(`${API_URL}/api/categorias${id ? '/' + id : ''}`, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        hideCategoryModal();
        loadCategories();
    });

    // Category form (mobile)
    document.getElementById('categoryFormMobile')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('catIdMobile').value;
        const data = {
            nome: document.getElementById('catNomeMobile').value,
            icone: document.getElementById('catIconeMobile').value,
            cor: document.getElementById('catCorMobile').value,
            descricao: ''
        };
        await fetchAPI(`${API_URL}/api/categorias${id ? '/' + id : ''}`, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        hideCategoryModal();
        loadCategories();
    });

    // Auto-init if token exists
    if (token) initDashboard();
});
