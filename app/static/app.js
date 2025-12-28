// Security Key - Dashboard JavaScript
const API_URL = '';
let token = localStorage.getItem('token');
let currentUser = null;
let categories = [];
let items = [];
let currentCategoryId = null;

// Theme
window.toggleTheme = function () {
    const html = document.documentElement;
    const isDark = html.classList.contains('dark');
    html.classList.toggle('dark', !isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
    updateThemeIcons();
};

function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    const icons = document.querySelectorAll('#themeIcon, #themeIconHeader');
    icons.forEach(i => { if (i) i.textContent = isDark ? 'light_mode' : 'dark_mode'; });
    const text = document.getElementById('themeText');
    if (text) text.textContent = isDark ? 'Modo Claro' : 'Modo Escuro';
}

// Auth
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

// Authenticated fetch wrapper
async function fetchAPI(url, options = {}) {
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`
        };
    }

    const response = await fetch(url, options);

    if (response.status === 401) {
        console.log('Token expirado ou inválido. Redirecionando para login...');
        window.logout();
        throw new Error('Sessão expirada. Por favor, faça login novamente.');
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
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('flex');
    document.getElementById('loginScreen').classList.remove('hidden');
};

// Register Modal
window.showRegister = function () {
    document.getElementById('registerModal').classList.remove('hidden');
    document.getElementById('registerModal').classList.add('flex');
};

window.hideRegister = function () {
    document.getElementById('registerModal').classList.add('hidden');
    document.getElementById('registerModal').classList.remove('flex');
};

// Categories
async function loadCategories() {
    const res = await fetchAPI(`${API_URL}/api/categorias`);
    categories = await res.json();
    renderCategories();
    populateCategorySelect();
}

function renderCategories() {
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

    // Botão de Gerenciar
    html += `<div class="mt-4 pt-4 border-t border-[#f5f2f0] dark:border-white/5">
        <button onclick="showCategoryModal()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#5c4a3d] dark:text-gray-400 hover:bg-[#f5f2f0] dark:hover:bg-white/5 transition-colors group">
            <span class="material-symbols-outlined group-hover:text-primary transition-colors">settings</span>
            <span class="text-sm font-medium group-hover:text-primary transition-colors">Gerenciar Categorias</span>
        </button>
    </div>`;

    nav.innerHTML = html;
}

// Category Management
window.showCategoryModal = function () {
    document.getElementById('categoryModal').classList.remove('hidden');
    document.getElementById('categoryModal').classList.add('flex');
    renderCategoriesList();
    prepareNewCategory();
};

window.hideCategoryModal = function () {
    document.getElementById('categoryModal').classList.add('hidden');
    document.getElementById('categoryModal').classList.remove('flex');
    loadCategories(); // Reload to refresh sidebar
};

function renderCategoriesList() {
    const list = document.getElementById('categoriesList');
    if (!list) return;

    // Filter only user categories or show all but mark globals?
    // Let's show all but actions disabled for globals

    list.innerHTML = categories.map(c => {
        // Se usuario_id for nulo/undefined, é global. Se tiver valor, é do usuário.
        const isGlobal = !c.usuario_id;
        console.log('Category:', c.nome, 'ID:', c.id, 'User:', c.usuario_id, 'Global:', isGlobal);
        return `
            <div class="flex items-center justify-between p-2 rounded-lg hover:bg-[#f8f7f5] dark:hover:bg-white/5 group border border-transparent hover:border-[#e6e0db] dark:hover:border-white/10 transition-all">
                <div class="flex items-center gap-2 overflow-hidden">
                    <div class="size-6 rounded-md flex items-center justify-center text-white" style="background-color: ${c.cor}">
                        <span class="material-symbols-outlined text-[14px]">${getIcon(c.icone)}</span>
                    </div>
                    <span class="text-sm text-[#181411] dark:text-white truncate max-w-[120px]">${c.nome}</span>
                    ${isGlobal ? '<span class="text-[10px] bg-gray-100 dark:bg-white/10 px-1.5 py-0.5 rounded text-gray-500">Padrão</span>' : ''}
                </div>
                ${!isGlobal ? `
                <div class="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="editCategory('${c.id}')" class="p-1 text-[#8c735f] hover:text-primary rounded hover:bg-white dark:hover:bg-white/10" title="Editar">
                         <span class="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <button onclick="deleteCategory('${c.id}')" class="p-1 text-[#8c735f] hover:text-red-500 rounded hover:bg-white dark:hover:bg-white/10" title="Excluir">
                         <span class="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

window.prepareNewCategory = function () {
    document.getElementById('categoryFormTitle').textContent = 'Nova Categoria';
    document.getElementById('catId').value = '';
    document.getElementById('catNome').value = '';
    document.getElementById('catIcone').value = '';
    document.getElementById('catCor').value = '#6366f1';
    document.getElementById('colorHex').textContent = '#6366f1';
    updateIconPreview();
};

window.editCategory = function (id) {
    const cat = categories.find(c => c.id === id);
    if (!cat) return;

    document.getElementById('categoryFormTitle').textContent = 'Editar Categoria';
    document.getElementById('catId').value = cat.id;
    document.getElementById('catNome').value = cat.nome;
    document.getElementById('catIcone').value = cat.icone || '';
    document.getElementById('catCor').value = cat.cor || '#6366f1';
    document.getElementById('colorHex').textContent = cat.cor || '#6366f1';
    updateIconPreview();
};

window.deleteCategory = async function (id) {
    if (!confirm('Tem certeza? Isso não apagará os itens, mas eles ficarão sem categoria.')) return;

    try {
        const res = await fetchAPI(`${API_URL}/api/categorias/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Erro ao excluir');

        // Refresh local list
        categories = categories.filter(c => c.id !== id);
        renderCategoriesList();

    } catch (err) {
        alert(err.message);
    }
};

window.updateIconPreview = function () {
    const icon = document.getElementById('catIcone').value || 'category';
    const preview = document.querySelector('#iconPreview span');
    if (preview) preview.textContent = icon;

    const color = document.getElementById('catCor').value;
    document.getElementById('colorHex').textContent = color;
    document.querySelector('#iconPreview span').style.color = color;
};

function getIcon(name) {
    const icons = { bank: 'account_balance', share: 'share', file: 'description', heart: 'favorite', mail: 'mail', briefcase: 'work', tv: 'tv', folder: 'folder' };
    return icons[name] || 'folder';
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
        return `<div class="group relative flex flex-col bg-white dark:bg-[#1a120b] border border-[#e6e0db] dark:border-white/10 rounded-xl p-5 hover:border-primary/50 hover:shadow-lg transition-all">
            <div class="absolute top-4 right-4 flex gap-2">
                ${item.favorito ? '<span class="material-symbols-outlined fill text-primary text-[20px]">star</span>' : ''}
                <button onclick="showShareModal('${item.id}')" class="text-[#8c735f] hover:text-primary" title="Compartilhar"><span class="material-symbols-outlined text-[20px]">share</span></button>
                <button onclick="editItem('${item.id}')" class="text-[#8c735f] hover:text-primary" title="Editar"><span class="material-symbols-outlined text-[20px]">edit</span></button>
                <button onclick="deleteItem('${item.id}')" class="text-[#8c735f] hover:text-red-500" title="Excluir"><span class="material-symbols-outlined text-[20px]">delete</span></button>
            </div>
            <div class="flex items-center gap-4 mb-4">
                <div class="size-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background: ${cat?.cor || '#6366f1'}20">
                    <span class="material-symbols-outlined" style="color: ${cat?.cor || '#6366f1'}">${getIcon(cat?.icone)}</span>
                </div>
                <div class="flex-1 min-w-0 pr-20">
                    <h3 class="text-sm font-semibold text-[#181411] dark:text-white line-clamp-2 leading-tight mb-0.5" title="${item.titulo}">${item.titulo}</h3>
                    <p class="text-[11px] text-[#8c735f] dark:text-gray-400 truncate">${cat?.nome || 'Sem categoria'}</p>
                </div>
            </div>
            <div class="space-y-2 flex-1 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                ${(item.campos || []).map((c, idx) => {
            const fieldId = `field_${item.id}_${idx}`;
            const escapedValue = (c.value || '').replace(/'/g, "\\'").replace(/"/g, "&quot;");
            if (c.is_sensitive) {
                return `
                        <div class="flex items-center gap-2 text-sm">
                            <span class="text-[#8c735f] w-20 truncate">${c.label}:</span>
                            <span id="${fieldId}" class="text-[#181411] dark:text-gray-200 truncate flex-1" data-value="${escapedValue}" data-hidden="true">••••••••</span>
                            <button onclick="togglePassword('${fieldId}')" class="text-[#8c735f] hover:text-primary" title="Visualizar">
                                <span id="${fieldId}_icon" class="material-symbols-outlined text-[16px]">visibility</span>
                            </button>
                            <button onclick="copyField('${escapedValue}')" class="text-[#8c735f] hover:text-primary" title="Copiar">
                                <span class="material-symbols-outlined text-[16px]">content_copy</span>
                            </button>
                        </div>`;
            } else {
                return `
                        <div class="flex items-center gap-2 text-sm">
                            <span class="text-[#8c735f] w-20 truncate">${c.label}:</span>
                            <span class="text-[#181411] dark:text-gray-200 truncate flex-1">${c.value || '-'}</span>
                        </div>`;
            }
        }).join('')}
            </div>
            ${item.nota_adicional ? `<p class="mt-3 pt-3 border-t border-[#f5f2f0] dark:border-white/5 text-xs text-[#8c735f]">${item.nota_adicional}</p>` : ''}
        </div>`;
    }).join('');

    html += `<div onclick="showItemModal()" class="flex flex-col items-center justify-center bg-[#f8f7f5] dark:bg-white/5 border-2 border-dashed border-[#e6e0db] dark:border-white/10 rounded-xl p-5 hover:border-primary cursor-pointer transition-all min-h-[200px]">
        <div class="size-14 rounded-full bg-white dark:bg-white/10 flex items-center justify-center mb-3">
            <span class="material-symbols-outlined text-primary text-2xl">add</span>
        </div>
        <h3 class="text-base font-bold text-[#181411] dark:text-white">Novo Item</h3>
    </div>`;

    grid.innerHTML = html;
}

// Toggle password visibility
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

window.filterByCategory = function (catId) {
    currentCategoryId = catId;
    const cat = categories.find(c => c.id === catId);
    const el = document.getElementById('currentCategory');
    if (el) el.textContent = cat?.nome || 'Todos os Itens';
    renderCategories();
    loadItems();
};

window.filterItems = function () { renderItems(); };

window.copyField = function (value) {
    navigator.clipboard.writeText(value);
    alert('Copiado!');
};

// Item Modal
window.showItemModal = function (item = null) {
    document.getElementById('itemModal').classList.remove('hidden');
    document.getElementById('itemModal').classList.add('flex');
    document.getElementById('itemModalTitle').textContent = item ? 'Editar Item' : 'Novo Item';
    document.getElementById('itemId').value = item?.id || '';
    document.getElementById('itemTitulo').value = item?.titulo || '';
    document.getElementById('itemCategoria').value = item?.category_id || '';
    document.getElementById('itemFavorito').checked = item?.favorito || false;
    document.getElementById('itemNota').value = item?.nota_adicional || '';
    document.getElementById('fieldsContainer').innerHTML = '';
    if (item?.campos) item.campos.forEach(c => window.addField(c));
    else window.addField();
};

window.hideItemModal = function () {
    document.getElementById('itemModal').classList.add('hidden');
    document.getElementById('itemModal').classList.remove('flex');
};

window.addField = function (field = null) {
    const container = document.getElementById('fieldsContainer');
    if (!container) return;
    const div = document.createElement('div');
    div.className = 'flex gap-2 items-start';
    div.innerHTML = `
        <input type="text" placeholder="Nome" value="${field?.label || ''}" class="flex-1 px-3 py-2 rounded-lg bg-[#f8f7f5] dark:bg-white/5 border border-[#e6e0db] dark:border-white/10 text-sm text-[#181411] dark:text-white outline-none field-label"/>
        <input type="text" placeholder="Valor" value="${field?.value || ''}" class="flex-1 px-3 py-2 rounded-lg bg-[#f8f7f5] dark:bg-white/5 border border-[#e6e0db] dark:border-white/10 text-sm text-[#181411] dark:text-white outline-none field-value"/>
        <label class="flex items-center gap-1 text-xs text-[#8c735f] whitespace-nowrap">
            <input type="checkbox" ${field?.is_sensitive ? 'checked' : ''} class="rounded border-[#e6e0db] text-primary focus:ring-primary field-sensitive"/>
            Sensível
        </label>
        <button type="button" onclick="this.parentElement.remove()" class="text-red-500 hover:text-red-700"><span class="material-symbols-outlined text-[20px]">remove</span></button>
    `;
    container.appendChild(div);
};

window.editItem = async function (id) {
    const item = items.find(i => i.id === id);
    if (item) window.showItemModal(item);
};

window.deleteItem = async function (id) {
    if (!confirm('Excluir este item?')) return;
    await fetchAPI(`${API_URL}/api/itens/${id}`, {
        method: 'DELETE'
    });
    loadItems();
};

// Share functions
let allUsers = [];

async function loadAllUsers() {
    try {
        const res = await fetchAPI(`${API_URL}/api/usuarios`);
        allUsers = await res.json();
    } catch (err) {
        console.error('Erro ao carregar usuários:', err);
        allUsers = [];
    }
}

window.showShareModal = async function (itemId) {
    document.getElementById('shareModal').classList.remove('hidden');
    document.getElementById('shareModal').classList.add('flex');
    document.getElementById('shareItemId').value = itemId;

    // Carrega usuários se ainda não carregou
    if (allUsers.length === 0) {
        await loadAllUsers();
    }

    // Carrega permissões do item
    await loadItemPermissions(itemId);
};

window.hideShareModal = function () {
    document.getElementById('shareModal').classList.add('hidden');
    document.getElementById('shareModal').classList.remove('flex');
};

async function loadItemPermissions(itemId) {
    const listEl = document.getElementById('sharedUsersList');
    const selectEl = document.getElementById('shareUserSelect');

    try {
        const res = await fetchAPI(`${API_URL}/api/permissoes/item/${itemId}`);
        const permissions = await res.json();

        // Renderiza lista de usuários com acesso
        if (permissions.length === 0) {
            listEl.innerHTML = '<p class="text-sm text-[#8c735f]">Nenhuma pessoa com acesso ainda.</p>';
        } else {
            listEl.innerHTML = permissions.map(p => `
                <div class="flex items-center justify-between p-2 bg-[#f8f7f5] dark:bg-white/5 rounded-lg">
                    <div class="flex items-center gap-2">
                        <div class="size-8 rounded-full bg-primary/20 flex items-center justify-center">
                            <span class="material-symbols-outlined text-primary text-[16px]">person</span>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-[#181411] dark:text-white">${p.usuario_compartilhado?.nome || 'Usuário'}</p>
                            <p class="text-xs text-[#8c735f]">${p.nivel_acesso === 'editar' ? 'Pode editar' : 'Apenas visualizar'}</p>
                        </div>
                    </div>
                    <button onclick="removeShare('${p.id}')" class="text-[#8c735f] hover:text-red-500" title="Remover acesso">
                        <span class="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            `).join('');
        }

        // Atualiza select de usuários (remove os que já têm acesso)
        const sharedUserIds = permissions.map(p => p.shared_with_user_id);
        const availableUsers = allUsers.filter(u => !sharedUserIds.includes(u.id) && u.id !== currentUser.id);

        selectEl.innerHTML = '<option value="">Selecione um usuário...</option>' +
            availableUsers.map(u => `<option value="${u.id}">${u.nome} (${u.email})</option>`).join('');

    } catch (err) {
        console.error('Erro ao carregar permissões:', err);
        listEl.innerHTML = '<p class="text-sm text-red-500">Erro ao carregar permissões.</p>';
    }
}

window.addShare = async function () {
    const itemId = document.getElementById('shareItemId').value;
    const userId = document.getElementById('shareUserSelect').value;
    const accessLevel = document.getElementById('shareAccessLevel').value;

    if (!userId) {
        alert('Selecione um usuário para compartilhar.');
        return;
    }

    try {
        const res = await fetchAPI(`${API_URL}/api/permissoes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                item_id: itemId,
                shared_with_user_id: userId,
                nivel_acesso: accessLevel
            })
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || 'Erro ao compartilhar');
        }

        await loadItemPermissions(itemId);
    } catch (err) {
        alert(err.message);
    }
};

window.removeShare = async function (permissionId) {
    if (!confirm('Remover acesso desta pessoa?')) return;

    const itemId = document.getElementById('shareItemId').value;

    try {
        await fetchAPI(`${API_URL}/api/permissoes/${permissionId}`, {
            method: 'DELETE'
        });

        await loadItemPermissions(itemId);
    } catch (err) {
        alert('Erro ao remover permissão.');
    }
};

// Init
async function initDashboard() {
    try {
        console.log('Iniciando dashboard...');
        currentUser = await getProfile();
        console.log('Usuário:', currentUser);
        document.getElementById('userName').textContent = currentUser.nome;
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        document.getElementById('dashboard').classList.add('flex');
        await loadCategories();
        await loadItems();
        console.log('Dashboard carregado com sucesso!');
    } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        window.logout();
    }
}

// Setup forms after DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    // Login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const err = document.getElementById('loginError');
            err.classList.add('hidden');
            try {
                console.log('Tentando login...');
                await login(document.getElementById('loginEmail').value, document.getElementById('loginPassword').value);
                console.log('Login realizado, token:', token);
                await initDashboard();
            } catch (ex) {
                console.error('Erro no login:', ex);
                err.textContent = ex.message;
                err.classList.remove('hidden');
            }
        });
    }

    // Register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const err = document.getElementById('registerError');
            err.classList.add('hidden');
            try {
                await register(
                    document.getElementById('registerName').value,
                    document.getElementById('registerEmail').value,
                    document.getElementById('registerPassword').value
                );
                window.hideRegister();
                alert('Conta criada! Faça login.');
            } catch (ex) {
                err.textContent = ex.message;
                err.classList.remove('hidden');
            }
        });
    }

    // Item form
    const itemForm = document.getElementById('itemForm');
    if (itemForm) {
        itemForm.addEventListener('submit', async (e) => {
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
            if (id) {
                await fetchAPI(`${API_URL}/api/itens/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            } else {
                await fetchAPI(`${API_URL}/api/itens`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
            }
            window.hideItemModal();
            loadItems();
        });
    }

    // Apply theme
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    updateThemeIcons();

    // Category form
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('catId').value;
            const data = {
                nome: document.getElementById('catNome').value,
                icone: document.getElementById('catIcone').value,
                cor: document.getElementById('catCor').value,
                descricao: ''
            };

            try {
                let res;
                if (id) {
                    res = await fetchAPI(`${API_URL}/api/categorias/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } else {
                    res = await fetchAPI(`${API_URL}/api/categorias`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                }

                if (!res.ok) {
                    const err = await res.json();
                    throw new Error(err.detail || 'Erro ao salvar categoria');
                }

                // Refresh list
                const cat = await res.json();

                // Update local items
                if (id) {
                    const idx = categories.findIndex(c => c.id === id);
                    if (idx !== -1) categories[idx] = cat;
                } else {
                    categories.push(cat);
                }

                renderCategoriesList();
                prepareNewCategory();
                alert('Categoria salva!');

            } catch (ex) {
                alert(ex.message);
            }
        });
    }

    // Color picker listener
    const colorInput = document.getElementById('catCor');
    if (colorInput) {
        colorInput.addEventListener('input', updateIconPreview);
    }

    // Auto-login if token exists
    if (token) {
        initDashboard();
    }
});
