// Security Key Mobile - Dashboard JavaScript
const API_URL = '';
let token = localStorage.getItem('token');
let currentUser = null;
let categories = [];
let items = [];
let currentCategoryId = null;

// Initialization
async function initDashboard() {
    try {
        currentUser = await getProfile();
        document.getElementById('userName').textContent = currentUser.nome;
        document.getElementById('userNameHeader').textContent = currentUser.nome.split(' ')[0];
        document.getElementById('userEmail').textContent = currentUser.email;

        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');

        await loadCategories();
        await loadItems();
    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        window.logout();
    }
}

// Authentication Wrappers
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
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Erro ao criar conta');
    }
    return await res.json();
}

async function fetchAPI(url, options = {}) {
    if (token) {
        options.headers = { ...options.headers, 'Authorization': `Bearer ${token}` };
    }
    const response = await fetch(url, options);
    if (response.status === 401) {
        window.logout();
        throw new Error('Sessão expirada.');
    }
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
    window.location.reload();
};

// Modals
window.showRegister = function () {
    document.getElementById('registerModal').classList.remove('hidden');
};
window.hideRegister = function () {
    document.getElementById('registerModal').classList.add('hidden');
};

// Theme
window.toggleTheme = function () {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    html.classList.toggle('dark', !isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    updateThemeUI();
};

function updateThemeUI() {
    const isDark = document.documentElement.classList.contains('dark');
    const icon = document.getElementById('themeIcon');
    const text = document.getElementById('themeText');
    if (icon) icon.textContent = isDark ? 'light_mode' : 'dark_mode';
    if (text) text.textContent = isDark ? 'Modo Claro' : 'Modo Escuro';
}

// Tab Management
const tabs = ['vault', 'categories', 'settings'];
function switchTab(tabName) {
    tabs.forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        if (el) el.classList.toggle('hidden', t !== tabName);
    });

    // Update bottom nav icons
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

    // Toggle FAB
    const fab = document.getElementById('fab-add');
    if (fab) fab.classList.toggle('hidden', tabName !== 'vault');
}

// Categories
async function loadCategories() {
    const res = await fetchAPI(`${API_URL}/api/categorias`);
    categories = await res.json();
    renderCategories();
    renderCategoriesManagement();
    populateCategorySelect();
}

function renderCategories() {
    const nav = document.getElementById('categoriesNav');
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

function renderCategoriesManagement() {
    const list = document.getElementById('categoriesList');
    if (!list) return;

    list.innerHTML = categories.map(c => `
        <div class="flex items-center justify-between p-4 bg-white dark:bg-card-dark rounded-custom border border-slate-100 dark:border-white/5 shadow-sm">
            <div class="flex items-center gap-4">
                <div class="size-10 rounded-xl flex items-center justify-center text-white" style="background-color: ${c.cor}">
                    <span class="material-symbols-outlined text-lg">${getIcon(c.icone)}</span>
                </div>
                <div>
                    <h3 class="font-bold">${c.nome}</h3>
                    ${!c.usuario_id ? '<span class="text-[10px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-slate-500">Padrão</span>' : ''}
                </div>
            </div>
            ${c.usuario_id ? `
            <div class="flex items-center gap-2">
                <button onclick="editCategory('${c.id}')" class="size-9 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400"><span class="material-symbols-outlined text-xl">edit</span></button>
                <button onclick="deleteCategory('${c.id}')" class="size-9 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center text-red-400"><span class="material-symbols-outlined text-xl">delete</span></button>
            </div>
            ` : ''}
        </div>
    `).join('');
}

window.filterByCategory = function (catId) {
    currentCategoryId = catId;
    renderCategories();
    loadItems();
};

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

function populateCategorySelect() {
    const select = document.getElementById('itemCategoria');
    if (!select) return;
    select.innerHTML = '<option value="">Selecione...</option>' + categories.map(c => `<option value="${c.id}">${c.nome}</option>`).join('');
}

// Items
async function loadItems() {
    let url = `${API_URL}/api/itens`;
    if (currentCategoryId) url += `?categoria_id=${currentCategoryId}`;
    const res = await fetchAPI(url);
    items = await res.json();
    renderItems();
}

function renderItems() {
    const grid = document.getElementById('itemsGrid');
    if (!grid) return;
    const searchEl = document.getElementById('searchInput');
    const search = searchEl ? searchEl.value.toLowerCase() : '';
    const filtered = items.filter(i => i.titulo.toLowerCase().includes(search));

    let html = filtered.map(item => {
        const cat = categories.find(c => c.id === item.category_id);
        const iconColor = cat?.cor || '#f77c18';
        const isShared = item.user_id !== currentUser.id;

        return `
        <div class="group relative flex flex-col bg-white dark:bg-card-dark rounded-[24px] border border-slate-100 dark:border-white/5 shadow-sm active:scale-[0.99] transition-all duration-200 p-5">
            <div class="absolute top-4 right-4 flex gap-1">
                ${item.favorito ? '<span class="material-symbols-outlined filled text-primary text-[20px]">star</span>' : ''}
                ${!isShared ? `
                <button onclick="event.stopPropagation(); showShareModal('${item.id}')" class="size-8 flex items-center justify-center rounded-full text-slate-400 hover:text-primary" title="Compartilhar"><span class="material-symbols-outlined text-[18px]">share</span></button>
                <button onclick="event.stopPropagation(); editItem('${item.id}')" class="size-8 flex items-center justify-center rounded-full text-slate-400 hover:text-primary" title="Editar"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                <button onclick="event.stopPropagation(); deleteItem('${item.id}')" class="size-8 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500" title="Excluir"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                ` : (item.pode_editar ? `
                <button onclick="event.stopPropagation(); editItem('${item.id}')" class="size-8 flex items-center justify-center rounded-full text-slate-400 hover:text-primary" title="Editar"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                ` : '')}
            </div>
            
            <div class="flex items-center gap-4 mb-4 pr-32">
                <div class="flex items-center justify-center size-12 rounded-2xl shrink-0" style="background-color: ${iconColor}1a; color: ${iconColor}">
                    <span class="material-symbols-outlined">${getIcon(cat?.icone)}</span>
                </div>
                <div class="flex flex-col min-w-0">
                    <h3 class="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 leading-tight" title="${item.titulo}">
                        ${item.titulo.length > 15 ? item.titulo.substring(0, 15) + '<br>' + item.titulo.substring(15, 30) + (item.titulo.length > 30 ? '...' : '') : item.titulo}
                    </h3>
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
                ${(item.campos || []).map((c, idx) => {
            const fieldId = `field_${item.id}_${idx}`;
            const escapedValue = (c.value || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
            if (c.is_sensitive) {
                return `
                        <div class="flex items-center gap-2 text-sm border-b border-slate-100 dark:border-white/5 py-1.5 last:border-0">
                            <span class="text-slate-400 text-xs w-20 truncate shrink-0">${c.label}:</span>
                            <span id="${fieldId}" class="text-slate-700 dark:text-gray-200 truncate flex-1 font-medium" data-value="${escapedValue}" data-hidden="true">••••••••</span>
                            <button onclick="togglePassword('${fieldId}')" class="text-slate-400 hover:text-primary shrink-0">
                                <span id="${fieldId}_icon" class="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                            <button onclick="copyField('${escapedValue}')" class="text-slate-400 hover:text-primary shrink-0">
                                <span class="material-symbols-outlined text-[18px]">content_copy</span>
                            </button>
                        </div>`;
            } else {
                return `
                        <div class="flex items-center gap-2 text-sm border-b border-slate-100 dark:border-white/5 py-1.5 last:border-0">
                            <span class="text-slate-400 text-xs w-20 truncate shrink-0">${c.label}:</span>
                            <span class="text-slate-700 dark:text-gray-200 truncate flex-1 font-medium">${c.value || '-'}</span>
                            <button onclick="copyField('${escapedValue}')" class="text-slate-400 hover:text-primary shrink-0">
                                <span class="material-symbols-outlined text-[18px]">content_copy</span>
                            </button>
                        </div>`;
            }
        }).join('')}
            </div>
            ${item.nota_adicional ? `<p class="mt-3 pt-3 border-t border-slate-100 dark:border-white/5 text-[11px] text-slate-400 line-clamp-2">${item.nota_adicional}</p>` : ''}
        </div>`;
    }).join('');

    grid.innerHTML = html;
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
        field.textContent = '••••••••';
        field.setAttribute('data-hidden', 'true');
        icon.textContent = 'visibility';
    }
};

window.copyField = function (text) {
    navigator.clipboard.writeText(text);
    alert('Copiado!');
};

// Modals Interaction
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
};

window.hideItemModal = function () {
    const modal = document.getElementById('itemModal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

window.addField = function (field = null) {
    const container = document.getElementById('fieldsContainer');
    const div = document.createElement('div');
    div.className = 'grid grid-cols-12 gap-2 items-center';
    div.innerHTML = `
        <div class="col-span-11 grid grid-cols-2 gap-2">
            <input type="text" placeholder="Nome" value="${field?.label || ''}" class="px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs field-label"/>
            <input type="text" placeholder="Valor" value="${field?.value || ''}" class="px-3 py-2 rounded-lg bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs field-value"/>
            <label class="col-span-2 flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                <input type="checkbox" ${field?.is_sensitive ? 'checked' : ''} class="rounded text-primary focus:ring-primary field-sensitive"/> Sensível (Oculto por padrão)
            </label>
        </div>
        <button type="button" onclick="this.parentElement.remove()" class="col-span-1 text-red-400"><span class="material-symbols-outlined text-lg">delete</span></button>
    `;
    container.appendChild(div);
};

window.editItem = function (id) {
    const item = items.find(i => i.id === id);
    if (item) showItemModal(item);
};

window.deleteItem = async function (id) {
    if (!confirm('Deseja excluir este item?')) return;
    await fetchAPI(`${API_URL}/api/itens/${id}`, { method: 'DELETE' });
    loadItems();
};

// Categories Management
window.showCategoryModal = function () {
    document.getElementById('categoryModal').classList.remove('hidden');
    document.getElementById('categoryModal').classList.add('flex');
};

window.hideCategoryModal = function () {
    document.getElementById('categoryModal').classList.add('hidden');
    document.getElementById('categoryModal').classList.remove('flex');
};

window.prepareNewCategory = function () {
    document.getElementById('categoryFormTitle').textContent = 'Nova Categoria';
    document.getElementById('catId').value = '';
    document.getElementById('catNome').value = '';
    document.getElementById('catIcone').value = '';
    document.getElementById('catCor').value = '#f77c18';
    updateIconPreview();
    showCategoryModal();
};

window.editCategory = function (id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;
    document.getElementById('categoryFormTitle').textContent = 'Editar Categoria';
    document.getElementById('catId').value = cat.id;
    document.getElementById('catNome').value = cat.nome;
    document.getElementById('catIcone').value = cat.icone || '';
    document.getElementById('catCor').value = cat.cor || '#f77c18';
    updateIconPreview();
    showCategoryModal();
};

window.deleteCategory = async function (id) {
    if (!confirm('Excluir esta categoria?')) return;
    await fetchAPI(`${API_URL}/api/categorias/${id}`, { method: 'DELETE' });
    loadCategories();
};

window.updateIconPreview = function () {
    const icon = document.getElementById('catIcone').value || 'category';
    const color = document.getElementById('catCor').value;
    const preview = document.querySelector('#iconPreview span');
    preview.textContent = getIcon(icon);
    preview.style.color = color;
    document.getElementById('colorHex').textContent = color;
};

// Share
let allUsers = [];
window.showShareModal = async function (itemId) {
    document.getElementById('shareModal').classList.remove('hidden');
    document.getElementById('shareModal').classList.add('flex');
    document.getElementById('shareItemId').value = itemId;

    if (allUsers.length === 0) {
        const res = await fetchAPI(`${API_URL}/api/usuarios`);
        allUsers = await res.json();
    }

    await loadItemPermissions(itemId);
};

window.hideShareModal = function () {
    document.getElementById('shareModal').classList.add('hidden');
    document.getElementById('shareModal').classList.remove('flex');
};

async function loadItemPermissions(itemId) {
    const res = await fetchAPI(`${API_URL}/api/permissoes/item/${itemId}`);
    const permissions = await res.json();

    const listEl = document.getElementById('sharedUsersList');
    listEl.innerHTML = permissions.length ? permissions.map(p => `
        <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl">
            <div class="flex items-center gap-2">
                <span class="text-xs font-bold">${p.usuario_compartilhado?.nome || 'Usuário'}</span>
                <span class="text-[10px] opacity-50">${p.nivel_acesso}</span>
            </div>
            <button onclick="removeShare('${p.id}')" class="text-red-400"><span class="material-symbols-outlined text-sm">close</span></button>
        </div>
    `).join('') : '<p class="text-xs opacity-50 text-center">Ninguém com acesso.</p>';

    const sharedIds = permissions.map(p => p.shared_with_user_id);
    const available = allUsers.filter(u => !sharedIds.includes(u.id) && u.id !== currentUser.id);
    const selectEl = document.getElementById('shareUserSelect');
    selectEl.innerHTML = '<option value="">Selecionar...</option>' + available.map(u => `<option value="${u.id}">${u.nome}</option>`).join('');
}

window.addShare = async function () {
    const itemId = document.getElementById('shareItemId').value;
    const userId = document.getElementById('shareUserSelect').value;
    if (!userId) return;

    await fetchAPI(`${API_URL}/api/permissoes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            item_id: itemId,
            shared_with_user_id: userId,
            nivel_acesso: document.getElementById('shareAccessLevel').value
        })
    });
    loadItemPermissions(itemId);
};

window.removeShare = async function (id) {
    await fetchAPI(`${API_URL}/api/permissoes/${id}`, { method: 'DELETE' });
    loadItemPermissions(document.getElementById('shareItemId').value);
};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    updateThemeUI();

    // Bottom Nav Tabs
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    // Forms
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const err = document.getElementById('loginError');
        err.classList.add('hidden');
        try {
            await login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
            initDashboard();
        } catch (ex) {
            err.textContent = ex.message;
            err.classList.remove('hidden');
        }
    });

    document.getElementById('registerForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await register(
                document.getElementById('registerName').value,
                document.getElementById('registerEmail').value,
                document.getElementById('registerPassword').value
            );
            hideRegister();
            alert('Conta criada! Faça login.');
        } catch (ex) {
            alert(ex.message);
        }
    });

    document.getElementById('itemForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('itemId').value;
        const campos = [];
        document.querySelectorAll('#fieldsContainer > div').forEach(div => {
            const label = div.querySelector('.field-label').value;
            const value = div.querySelector('.field-value').value;
            const is_sensitive = div.querySelector('.field-sensitive').checked;
            if (label) campos.push({ label, value, is_sensitive, field_type: 'texto' });
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

    if (token) initDashboard();
});
