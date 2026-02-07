/* Admin Dashboard - Vanilla JS
   Property Management Data Tables + CRUD + History + Detail Panels
   With smooth animations, month filtering, and URL param support */

// ============================================
// Configuration
// ============================================
const API_BASE = window.ADMIN_API_BASE || '/admin/api';

// ============================================
// Toast Notifications
// ============================================
const Toast = {
    container: null,
    init() {
        this.container = document.createElement('div');
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },
    show(message, type = 'success') {
        const icon = type === 'success' ? '\u2713' : '\u2717';
        const el = document.createElement('div');
        el.className = `toast toast-${type}`;
        el.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        this.container.appendChild(el);
        setTimeout(() => {
            el.style.opacity = '0';
            el.style.transform = 'translateX(40px)';
            el.style.transition = 'all 300ms ease';
            setTimeout(() => el.remove(), 300);
        }, 4000);
    }
};

// ============================================
// Confirm Dialog
// ============================================
function confirmAction(title, message) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="actions">
                    <button class="btn btn-secondary" data-action="cancel">Cancelar</button>
                    <button class="btn btn-danger" data-action="confirm">Eliminar</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector('[data-action="cancel"]').onclick = () => { overlay.remove(); resolve(false); };
        overlay.querySelector('[data-action="confirm"]').onclick = () => { overlay.remove(); resolve(true); };
    });
}

// ============================================
// API Client
// ============================================
const api = {
    _handleResponse(res) {
        if (res.status === 401) {
            window.location.href = '/admin/login?redirect=' + encodeURIComponent(window.location.pathname);
            throw new Error('Unauthorized');
        }
        if (!res.ok) { return res.json().catch(() => ({})).then(e => { throw new Error(e.error || res.statusText); }); }
        return res.json();
    },
    async get(path) {
        const res = await fetch(`${API_BASE}${path}`);
        return this._handleResponse(res);
    },
    async post(path, data) {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        return this._handleResponse(res);
    },
    async put(path, data) {
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data)
        });
        return this._handleResponse(res);
    },
    async del(path) {
        const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
        return this._handleResponse(res);
    }
};

// ============================================
// Utility: Format Values
// ============================================
function formatCurrency(val) {
    if (val == null) return '-';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(num);
}

function formatDate(val) {
    if (!val) return '-';
    try {
        const d = new Date(val);
        return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return val; }
}

function timeAgo(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d`;
    return formatDate(dateStr);
}

function daysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function statusBadge(estado, type) {
    const map = {
        activo: { 'Alquilado': 'green', 'Ocupado': 'amber', 'Libre': 'gray', 'En reforma': 'blue', 'Reservado': 'blue' },
        contabilidad: { 'Pagado': 'green', 'Parcial': 'amber', 'Sin pagar': 'red', 'ingreso': 'green', 'gasto': 'red' },
        contrato: { 'Activo': 'green', 'Iniciado': 'blue', 'Finalizado': 'gray', 'Suspendido': 'red' },
        deposito: { 'Depositado': 'green', 'Pagado': 'green', 'Pendiente': 'amber', 'Devuelto': 'blue', 'Organo oficial': 'gray' },
        incidencia: { 'Abierta': 'red', 'En progreso': 'amber', 'Resuelta': 'green', 'Cerrada': 'gray', 'Urgente': 'red', 'Alta': 'red', 'Media': 'amber', 'Baja': 'blue' },
        contrato_documento: { 'contrato': 'blue', 'prorroga': 'green', 'anexo': 'amber', 'addendum': 'gray' },
        contrato_detalle: { 'price': 'green', 'ipc': 'blue', 'garantia': 'amber', 'descuento_1': 'gray', 'descuento_2': 'gray', 'descuento_3': 'gray', 'incremento_pct': 'amber', 'fin_contrato': 'red', 'ibi': 'blue', 'extras': 'gray' }
    };
    const color = (map[type] || {})[estado] || 'gray';
    return `<span class="badge badge-${color}">${escapeHtml(estado)}</span>`;
}

function computeEstado(row) {
    const total = parseFloat(row.total) || 0;
    const pagado = parseFloat(row.pagado) || 0;
    if (total <= 0) return row.estado || 'Sin pagar';
    if (pagado >= total) return 'Pagado';
    if (pagado > 0) return 'Parcial';
    return 'Sin pagar';
}

function progressBar(pct, color = 'green') {
    const clamped = Math.min(100, Math.max(0, pct));
    return `<div class="progress-bar"><div class="progress-fill progress-${color}" style="width:${clamped}%"></div></div>`;
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = ((hash % 360) + 360) % 360;
    return `hsl(${h}, 45%, 45%)`;
}

// ============================================
// Period Helper — compute date range for period filter
// ============================================
// Generate comma-separated MM/YYYY period strings matching DB fecha format
function getPeriodMonths(period) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth(); // 0-based
    const pad = (n) => String(n).padStart(2, '0');

    function monthStr(year, month) { return `${pad(month + 1)}/${year}`; }
    function monthRange(count) {
        const months = [];
        for (let i = 0; i < count; i++) {
            let mm = m - i;
            let yy = y;
            while (mm < 0) { mm += 12; yy--; }
            months.push(monthStr(yy, mm));
        }
        return months.join(',');
    }

    switch (period) {
        case 'this_month': return monthStr(y, m);
        case 'last_month': return monthStr(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1);
        case 'last_3': return monthRange(3);
        case 'last_6': return monthRange(6);
        case 'this_year': return Array.from({length: m + 1}, (_, i) => monthStr(y, i)).join(',');
        case 'last_year': return Array.from({length: 12}, (_, i) => monthStr(y - 1, i)).join(',');
        default: return null;
    }
}

// ============================================
// DataTable Class
// ============================================
class DataTable {
    constructor(container, config) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.config = config; // { entity, columns, filters, apiPath, onAction, onRowClick, showPeriodFilter }
        this.data = [];
        this.sortField = null;
        this.sortDir = 'asc';
        this.page = 1;
        this.perPage = 0;
        this.searchQuery = '';
        this.filterValues = {};
        this.selected = new Set();

        // Read URL params for pre-filtering
        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams.entries()) {
            if (key === 'page') { this.page = parseInt(value, 10) || 1; }
            else if (key === 'per_page') { this.perPage = parseInt(value, 10); }
            else if (key === 'search') { this.searchQuery = value; }
            else { this.filterValues[key] = value; }
        }

        this.render();
        this.load();
    }

    render() {
        const periodFilter = this.config.showPeriodFilter ? `
            <select class="period-select" data-filter="_period">
                <option value="">Todo</option>
                <option value="this_month">Este mes</option>
                <option value="last_month">Mes anterior</option>
                <option value="last_3">Últimos 3 meses</option>
                <option value="last_6">Últimos 6 meses</option>
                <option value="this_year">Este año</option>
                <option value="last_year">Año anterior</option>
            </select>` : '';

        this.container.innerHTML = `
            <div class="toolbar">
                <input type="text" class="search-input" placeholder="Buscar ${this.config.entity}..." value="${escapeHtml(this.searchQuery)}">
                ${periodFilter}
                ${(this.config.filters || []).map(f =>
                    f.type === 'text'
                    ? `<input type="text" class="filter-text search-input" data-filter="${f.key}" placeholder="${f.label}..." value="${escapeHtml(this.filterValues[f.key] || '')}" style="min-width:140px;flex:0;">`
                    : `<select class="filter-select${f.asyncOptions ? ' async-filter' : ''}" data-filter="${f.key}"${f.asyncOptions ? ` data-async-url="${f.asyncOptions}"` : ''}>
                        <option value="">Todos</option>
                        ${(f.options || []).map(o => `<option value="${o}" ${this.filterValues[f.key] === o ? 'selected' : ''}>${o}</option>`).join('')}
                    </select>`
                ).join('')}
                ${this.config.exportPath ? '<button class="btn btn-secondary" data-action="export">\u2913 Exportar CSV</button>' : ''}
                <button class="btn btn-primary" data-action="create">+ Nuevo</button>
            </div>
            <div class="table-container" style="position:relative;">
                <table class="data-table">
                    <thead><tr></tr></thead>
                    <tbody></tbody>
                    <tfoot></tfoot>
                </table>
                <div class="pagination">
                    <div class="pagination-info">
                        <span class="row-count"></span>
                        <select class="per-page-select">
                            <option value="25" ${this.perPage === 25 ? 'selected' : ''}>25</option>
                            <option value="50" ${this.perPage === 50 ? 'selected' : ''}>50</option>
                            <option value="100" ${this.perPage === 100 ? 'selected' : ''}>100</option>
                            <option value="0" ${this.perPage === 0 ? 'selected' : ''}>All</option>
                        </select>
                        <span>por página</span>
                    </div>
                    <div class="pagination-controls"></div>
                </div>
            </div>`;

        // Event: search
        const searchInput = this.container.querySelector('.search-input');
        let debounce;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => { this.searchQuery = searchInput.value; this.page = 1; this.load(); }, 300);
        });

        // Event: period filter
        const periodSelect = this.container.querySelector('.period-select');
        if (periodSelect) {
            periodSelect.addEventListener('change', () => {
                const period = periodSelect.value;
                const periodoStr = getPeriodMonths(period);
                this.filterValues.periodo = periodoStr || undefined;
                // Clear date range filters when using period
                delete this.filterValues.fecha_from;
                delete this.filterValues.fecha_to;
                this.page = 1;
                this.load();
            });
        }

        // Event: filters (select)
        this.container.querySelectorAll('.filter-select').forEach(sel => {
            sel.addEventListener('change', () => {
                this.filterValues[sel.dataset.filter] = sel.value || undefined;
                this.page = 1;
                this.load();
            });
        });

        // Event: filters (text input)
        this.container.querySelectorAll('.filter-text').forEach(input => {
            let filterDebounce;
            input.addEventListener('input', () => {
                clearTimeout(filterDebounce);
                filterDebounce = setTimeout(() => {
                    this.filterValues[input.dataset.filter] = input.value || undefined;
                    this.page = 1;
                    this.load();
                }, 300);
            });
        });

        // Load async filter options
        this.container.querySelectorAll('.async-filter').forEach(sel => {
            const url = sel.dataset.asyncUrl;
            if (url) {
                api.get(url).then(options => {
                    const current = this.filterValues[sel.dataset.filter];
                    sel.innerHTML = '<option value="">Todos</option>' +
                        options.map(o => `<option value="${o}" ${current === o ? 'selected' : ''}>${o}</option>`).join('');
                }).catch(() => {});
            }
        });

        // Event: export
        const exportBtn = this.container.querySelector('[data-action="export"]');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const params = new URLSearchParams();
                if (this.searchQuery) params.set('search', this.searchQuery);
                Object.entries(this.filterValues).forEach(([k, v]) => {
                    if (v && k !== '_period') params.set(k, v);
                });
                const qs = params.toString();
                window.open(`${API_BASE}${this.config.exportPath}${qs ? '?' + qs : ''}`, '_blank');
            });
        }

        // Event: create
        this.container.querySelector('[data-action="create"]').addEventListener('click', () => {
            if (this.config.onAction) this.config.onAction('create', null);
        });

        // Event: per page
        this.container.querySelector('.per-page-select').addEventListener('change', (e) => {
            this.perPage = parseInt(e.target.value, 10);
            this.page = 1;
            this.load();
        });
    }

    async load() {
        const params = new URLSearchParams();
        params.set('page', this.page);
        params.set('per_page', this.perPage);
        if (this.searchQuery) params.set('search', this.searchQuery);
        if (this.sortField) { params.set('sort', this.sortField); params.set('order', this.sortDir); }
        Object.entries(this.filterValues).forEach(([k, v]) => {
            if (v && k !== '_period') params.set(k, v);
        });

        try {
            const result = await api.get(`${this.config.apiPath}?${params}`);
            this.data = result.data || [];
            this.total = result.total || 0;
            this.totals = result.totals || null;
            this.renderTable();
        } catch (e) {
            Toast.show(e.message, 'error');
        }
    }

    renderTable() {
        const thead = this.container.querySelector('thead tr');
        const tbody = this.container.querySelector('tbody');
        const tfoot = this.container.querySelector('tfoot');
        // Hide columns where all rows have empty/null values
        const cols = this.data.length > 0
            ? this.config.columns.filter(col => this.data.some(row => row[col.key] != null && row[col.key] !== ''))
            : this.config.columns;

        // Header
        thead.innerHTML = cols.map(col => {
            const sorted = this.sortField === col.key;
            const icon = sorted ? (this.sortDir === 'asc' ? '\u25B2' : '\u25BC') : '\u25B4';
            return `<th data-sort="${col.key}" class="${sorted ? 'sorted' : ''}">
                ${col.label} <span class="sort-icon">${icon}</span>
            </th>`;
        }).join('') + '<th>Acciones</th>';

        // Sort click
        thead.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                if (this.sortField === field) {
                    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortField = field;
                    this.sortDir = 'asc';
                }
                this.load();
            });
        });

        // Body
        if (this.data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${cols.length + 1}" class="empty-state">No se encontraron registros</td></tr>`;
        } else {
            tbody.innerHTML = this.data.map(row => {
                const id = row.id;
                return `<tr data-id="${escapeHtml(id)}" class="clickable-row">
                    ${cols.map(col => {
                        let val = row[col.key];
                        let cls = '';
                        if (col.type === 'currency') { val = formatCurrency(val); cls = 'numeric'; }
                        else if (col.type === 'date') { val = formatDate(val); cls = 'date'; }
                        else if (col.type === 'status') {
                            if (this.config.entity === 'contabilidad' && col.key === 'estado') val = computeEstado(row);
                            val = statusBadge(val, this.config.entity);
                        }
                        else if (col.type === 'tags' && Array.isArray(val)) { val = val.map(t => `<span class="badge badge-blue">${escapeHtml(t)}</span>`).join(' '); }
                        else if (col.type === 'badge_count') { val = val > 0 ? `<span class="badge badge-green">${val} ${col.suffix || ''}</span>` : '-'; }
                        else if (col.type === 'thumbnail') { val = val ? `<img class="table-thumbnail" src="${escapeHtml(val)}" alt="" loading="lazy">` : '<span class="table-thumbnail-empty">-</span>'; cls = 'thumbnail-cell'; }
                        else { val = escapeHtml(val); }
                        return `<td class="${cls}">${val || '-'}</td>`;
                    }).join('')}
                    <td class="actions">
                        ${this.config.onRowClick ? `<button class="btn btn-sm btn-view" data-action="view" data-id="${escapeHtml(id)}" title="Ver detalles">Ver</button>` : ''}
                        ${row.imagen_carpeta ? `<button class="btn-gallery" data-action="gallery" data-id="${escapeHtml(id)}" title="Ver fotos">&#128247;</button>` : ''}
                        <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${escapeHtml(id)}">Editar</button>
                        <button class="btn btn-sm btn-secondary" data-action="history" data-id="${escapeHtml(id)}">Historial</button>
                        <button class="btn btn-sm btn-danger" data-action="delete" data-id="${escapeHtml(id)}">Eliminar</button>
                    </td>
                </tr>`;
            }).join('');
        }

        // Row click
        tbody.querySelectorAll('tr.clickable-row').forEach(tr => {
            tr.addEventListener('click', (e) => {
                if (e.target.closest('button')) return;
                const id = tr.dataset.id;
                const row = this.data.find(r => r.id === id);
                if (row && this.config.onRowClick) this.config.onRowClick(row);
            });
        });

        // Action button events
        tbody.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                const id = btn.dataset.id;
                const row = this.data.find(r => r.id === id);
                if (action === 'view') {
                    if (row && this.config.onRowClick) this.config.onRowClick(row);
                } else {
                    if (this.config.onAction) this.config.onAction(action, row);
                }
            });
        });

        // Totals row
        if (this.totals && this.data.length > 0) {
            tfoot.innerHTML = `<tr>${cols.map(col => {
                if (col.type === 'currency' && this.totals[col.key] != null) {
                    return `<td class="numeric">${formatCurrency(this.totals[col.key])}</td>`;
                }
                if (col === cols[0]) {
                    return `<td>Total</td>`;
                }
                return `<td></td>`;
            }).join('')}<td class="actions"></td></tr>`;
        } else {
            tfoot.innerHTML = '';
        }

        this.renderPagination();
    }

    sortLocally() {
        const field = this.sortField;
        const dir = this.sortDir === 'asc' ? 1 : -1;
        this.data.sort((a, b) => {
            let va = a[field], vb = b[field];
            if (va == null) return 1;
            if (vb == null) return -1;
            if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
            return String(va).localeCompare(String(vb), 'es') * dir;
        });
    }

    renderPagination() {
        const info = this.container.querySelector('.row-count');
        const controls = this.container.querySelector('.pagination-controls');
        const totalPages = Math.max(1, Math.ceil(this.total / this.perPage));

        info.textContent = `${this.total} registro${this.total !== 1 ? 's' : ''}`;

        controls.innerHTML = `
            <button ${this.page <= 1 ? 'disabled' : ''} data-page="${this.page - 1}">\u2190 Ant</button>
            <span class="current-page">${this.page} / ${totalPages}</span>
            <button ${this.page >= totalPages ? 'disabled' : ''} data-page="${this.page + 1}">Sig \u2192</button>
        `;

        controls.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.page = parseInt(btn.dataset.page, 10);
                this.load();
            });
        });
    }
}

// ============================================
// Animated Panel Base — shared open/close logic
// ============================================
function openPanel(instance, title) {
    // Only close if a panel is currently open
    if (instance.panel || instance.overlay) {
        // Synchronously remove old panel to avoid race condition
        if (instance.overlay && instance.overlay.parentNode) instance.overlay.remove();
        if (instance.panel && instance.panel.parentNode) instance.panel.remove();
        instance.overlay = null;
        instance.panel = null;
        instance._closing = false;
    }

    instance.overlay = document.createElement('div');
    instance.overlay.className = 'panel-overlay';

    instance.panel = document.createElement('div');
    instance.panel.className = 'side-panel';
    instance.panel.innerHTML = `
        <div class="panel-header">
            <h2>${title}</h2>
            <button class="panel-close">\u00D7</button>
        </div>
        <div class="panel-body">
            <div style="text-align:center;padding:48px;"><div class="loading-spinner"></div></div>
        </div>`;

    instance.panel.addEventListener('click', e => e.stopPropagation());
    instance.panel.querySelector('.panel-close').addEventListener('click', () => instance.close());
    instance.overlay.addEventListener('click', (e) => {
        if (e.target === instance.overlay) instance.close();
    });

    document.body.appendChild(instance.overlay);
    document.body.appendChild(instance.panel);

    // Trigger animation on next frame
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            if (instance.overlay) instance.overlay.classList.add('open');
            if (instance.panel) instance.panel.classList.add('open');
        });
    });
}

function closePanel(instance) {
    if (instance._closing) return;
    if (!instance.panel && !instance.overlay) return;
    instance._closing = true;
    if (instance.panel) instance.panel.classList.remove('open');
    if (instance.overlay) instance.overlay.classList.remove('open');
    setTimeout(() => {
        if (instance.overlay && instance.overlay.parentNode) { instance.overlay.remove(); }
        if (instance.panel && instance.panel.parentNode) { instance.panel.remove(); }
        instance.overlay = null;
        instance.panel = null;
        instance._closing = false;
    }, 350);
}

// ============================================
// FormPanel Class
// ============================================
class FormPanel {
    constructor(config) {
        this.config = config; // { title, fields, onSubmit, onClose }
        this.overlay = null;
        this.panel = null;
        this._closing = false;
    }

    open(data = null) {
        // Synchronously remove old panel to avoid race condition
        if (this.panel || this.overlay) {
            if (this.overlay && this.overlay.parentNode) this.overlay.remove();
            if (this.panel && this.panel.parentNode) this.panel.remove();
            this.overlay = null;
            this.panel = null;
            this._closing = false;
        }
        const isEdit = data != null;
        const title = isEdit ? `Editar ${this.config.title}` : `Nuevo/a ${this.config.title}`;

        this.overlay = document.createElement('div');
        this.overlay.className = 'panel-overlay';

        this.panel = document.createElement('div');
        this.panel.className = 'side-panel';
        this.panel.innerHTML = `
            <div class="panel-header">
                <h2>${title}</h2>
                <button class="panel-close">\u00D7</button>
            </div>
            <div class="panel-body">
                <form id="entity-form">
                    ${this.config.fields.map(f => this.renderField(f, data)).join('')}
                </form>
            </div>
            <div class="panel-footer">
                <button class="btn btn-secondary" data-action="cancel">Cancelar</button>
                <button class="btn btn-primary" data-action="save">${isEdit ? 'Guardar' : 'Crear'}</button>
            </div>`;

        this.panel.addEventListener('click', e => e.stopPropagation());
        this.panel.querySelector('.panel-close').addEventListener('click', () => this.close());
        this.panel.querySelector('[data-action="cancel"]').addEventListener('click', () => this.close());
        this.panel.querySelector('[data-action="save"]').addEventListener('click', () => this.submit(isEdit, data));
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.panel);

        // Animate in on next frame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.overlay.classList.add('open');
                this.panel.classList.add('open');
            });
        });

        // Focus first input after animation
        const first = this.panel.querySelector('input, select, textarea');
        if (first) setTimeout(() => first.focus(), 400);
    }

    renderField(field, data) {
        const val = data ? (data[field.key] ?? '') : (field.default ?? '');
        const displayVal = Array.isArray(val) ? val.join(', ') : val;

        if (field.type === 'select') {
            return `<div class="form-group">
                <label>${field.label}</label>
                <select name="${field.key}">
                    ${(field.options || []).map(o =>
                        `<option value="${o}" ${o === val ? 'selected' : ''}>${o}</option>`
                    ).join('')}
                </select>
            </div>`;
        }

        if (field.type === 'textarea') {
            return `<div class="form-group">
                <label>${field.label}</label>
                <textarea name="${field.key}">${escapeHtml(displayVal)}</textarea>
            </div>`;
        }

        const inputType = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text';
        const step = field.type === 'number' ? 'step="0.01"' : '';
        return `<div class="form-group">
            <label>${field.label}</label>
            <input type="${inputType}" name="${field.key}" value="${escapeHtml(displayVal)}" ${step}
                ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}">
        </div>`;
    }

    submit(isEdit, originalData) {
        const form = this.panel.querySelector('#entity-form');
        const formData = {};
        this.config.fields.forEach(f => {
            let val = form.querySelector(`[name="${f.key}"]`)?.value;
            if (val === '' || val === undefined) {
                if (!isEdit) return;
                val = null;
            } else if (f.type === 'number' && val) {
                val = val;
            } else if (f.key === 'etiquetas' && val) {
                val = val.split(',').map(s => s.trim()).filter(Boolean);
            }
            if (isEdit && val !== null && originalData && val === String(originalData[f.key] ?? '')) {
                return;
            }
            formData[f.key] = val;
        });

        if (this.config.onSubmit) {
            this.config.onSubmit(formData, isEdit, originalData);
        }
        this.close();
    }

    close() {
        if (this._closing) return;
        if (!this.panel && !this.overlay) return;
        this._closing = true;
        if (this.panel) this.panel.classList.remove('open');
        if (this.overlay) this.overlay.classList.remove('open');
        setTimeout(() => {
            if (this.overlay) { this.overlay.remove(); this.overlay = null; }
            if (this.panel) { this.panel.remove(); this.panel = null; }
            this._closing = false;
            if (this.config.onClose) this.config.onClose();
        }, 350);
    }
}

// ============================================
// HistoryPanel Class
// ============================================
class HistoryPanel {
    constructor() {
        this.overlay = null;
        this.panel = null;
        this._closing = false;
    }

    async open(entityType, entityId) {
        openPanel(this, 'Historial de cambios');

        try {
            const entries = await api.get(`/audit/${entityType}/${entityId}`);
            this.renderTimeline(entries);
        } catch {
            this.panel.querySelector('.panel-body').innerHTML =
                `<div class="empty-state">Sin historial disponible</div>`;
        }
    }

    renderTimeline(entries) {
        if (!this.panel) return;
        const body = this.panel.querySelector('.panel-body');
        if (!entries || entries.length === 0) {
            body.innerHTML = '<div class="empty-state">Sin cambios registrados</div>';
            return;
        }

        body.innerHTML = `<div class="timeline">
            ${entries.map(e => `
                <div class="timeline-entry action-${e.action}">
                    <div class="timeline-meta">
                        <span class="timeline-action">${e.action}</span>
                        &mdash; ${timeAgo(e.created_at)}
                    </div>
                    ${this.renderDiff(e)}
                </div>
            `).join('')}
        </div>`;
    }

    renderDiff(entry) {
        if (entry.action === 'create') {
            return '<div class="timeline-diff"><span class="diff-new">Registro creado</span></div>';
        }
        if (entry.action === 'delete') {
            return '<div class="timeline-diff"><span class="diff-old">Registro eliminado</span></div>';
        }
        if (!entry.changed_fields || entry.changed_fields.length === 0) {
            return '<div class="timeline-diff">Campos actualizados</div>';
        }
        return `<div class="timeline-diff">
            ${entry.changed_fields.map(field => {
                const oldVal = entry.old_values ? entry.old_values[field] : null;
                const newVal = entry.new_values ? entry.new_values[field] : null;
                return `<div class="diff-field">
                    <span class="field-name">${field}</span>
                    ${oldVal != null ? `<span class="diff-old">${escapeHtml(oldVal)}</span>` : ''}
                    <span class="diff-new">${escapeHtml(newVal)}</span>
                </div>`;
            }).join('')}
        </div>`;
    }

    close() { closePanel(this); }
}

// ============================================
// DetailPanel Class
// ============================================
class DetailPanel {
    constructor() {
        this.overlay = null;
        this.panel = null;
        this._closing = false;
    }

    async openActivo(id) {
        openPanel(this, 'Detalle del activo');

        try {
            const data = await api.get(`/activos/${id}/detail`);
            if (!this.panel) return;
            const a = data.activo;
            const f = data.financial;
            const invoices = data.invoices || [];
            const images = data.images || [];

            let html = '';

            // Image preview strip
            if (images.length > 0) {
                html += `
                <div class="detail-image-strip">
                    ${images.slice(0, 4).map(img => `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename)}" loading="lazy">`).join('')}
                </div>`;
                html += `<button class="detail-view-gallery-btn" onclick="window.PropertyPresentation.open('${id}')">&#128247; Ver activo (${images.length} fotos)</button>`;
            }

            html += `
                <div class="detail-section">
                    <h3>${escapeHtml(a.activo)}</h3>
                    <div class="detail-grid">
                        <div class="detail-field"><span class="detail-label">Dirección</span><span class="detail-value">${escapeHtml(a.direccion)}</span></div>
                        <div class="detail-field"><span class="detail-label">Estado</span><span class="detail-value">${statusBadge(a.estado, 'activo')}</span></div>
                        <div class="detail-field"><span class="detail-label">Contrato</span><span class="detail-value">${escapeHtml(a.contrato) || '-'}</span></div>
                        <div class="detail-field"><span class="detail-label">Alquiler mensual</span><span class="detail-value">${formatCurrency(a.alquiler)}</span></div>
                        <div class="detail-field"><span class="detail-label">Inicio contrato</span><span class="detail-value">${formatDate(a.fecha_inicio)}</span></div>
                        <div class="detail-field"><span class="detail-label">Fin contrato</span><span class="detail-value">${formatDate(a.fecha_fin)}</span></div>
                        ${a.etiquetas && a.etiquetas.length ? `<div class="detail-field"><span class="detail-label">Etiquetas</span><span class="detail-value">${a.etiquetas.map(t => `<span class="badge badge-blue">${escapeHtml(t)}</span>`).join(' ')}</span></div>` : ''}
                    </div>
                </div>`;

            if (f) {
                const facturado = parseFloat(f.total_facturado || 0);
                const cobrado = parseFloat(f.total_cobrado || 0);
                const pendiente = parseFloat(f.total_pendiente || 0);
                const rate = facturado > 0 ? (cobrado / facturado * 100) : 0;

                html += `
                <div class="detail-section">
                    <h4>Resumen financiero</h4>
                    <div class="financial-cards">
                        <div class="mini-card">
                            <span class="mini-label">Facturado</span>
                            <span class="mini-value">${formatCurrency(facturado)}</span>
                        </div>
                        <div class="mini-card success">
                            <span class="mini-label">Cobrado</span>
                            <span class="mini-value">${formatCurrency(cobrado)}</span>
                        </div>
                        <div class="mini-card ${pendiente > 0 ? 'error' : ''}">
                            <span class="mini-label">Pendiente</span>
                            <span class="mini-value">${formatCurrency(pendiente)}</span>
                        </div>
                    </div>
                    <div style="margin-top:14px;">
                        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);margin-bottom:6px;">
                            <span>Tasa de cobro</span><span>${rate.toFixed(1)}%</span>
                        </div>
                        ${progressBar(rate, rate > 80 ? 'green' : rate > 50 ? 'amber' : 'red')}
                    </div>
                </div>`;
            }

            if (invoices.length > 0) {
                html += `
                <div class="detail-section">
                    <h4>Facturas recientes (${invoices.length})</h4>
                    <div class="table-container" style="max-height:300px;overflow:auto;">
                        <table class="data-table">
                            <thead><tr><th>Ref</th><th>Concepto</th><th>Estado</th><th>Total</th><th>Pagado</th><th>Fecha</th></tr></thead>
                            <tbody>
                                ${invoices.map(inv => `
                                    <tr>
                                        <td>${escapeHtml(inv.referencia)}</td>
                                        <td>${escapeHtml(inv.concepto)}</td>
                                        <td>${statusBadge(inv.estado, 'contabilidad')}</td>
                                        <td class="numeric">${formatCurrency(inv.total)}</td>
                                        <td class="numeric">${formatCurrency(inv.pagado)}</td>
                                        <td class="date">${escapeHtml(inv.fecha)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>`;
            }

            this.panel.querySelector('.panel-body').innerHTML = html;
        } catch (e) {
            if (this.panel) {
                this.panel.querySelector('.panel-body').innerHTML =
                    `<div class="empty-state">Error al cargar detalles: ${escapeHtml(e.message)}</div>`;
            }
        }
    }

    async openContrato(row) {
        openPanel(this, 'Detalle del contrato');
        if (!this.panel) return;

        const fields = [
            ['Ref. contrato', row.contrato],
            ['Activo', row.activo],
            ['Dirección', row.direccion],
            ['Inquilino', row.inquilino],
        ];
        const financial = [
            ['Alquiler mensual', formatCurrency(row.alquiler)],
            ['Valor total', formatCurrency(row.total)],
        ];
        const dates = [
            ['Fecha inicio', formatDate(row.fecha_inicio)],
            ['Fecha fin', formatDate(row.fecha_fin)],
        ];

        const days = daysUntil(row.fecha_fin);
        const daysInfo = days != null
            ? `<div class="detail-section">
                <div class="mini-card ${days < 30 ? 'error' : days < 90 ? '' : 'success'}">
                    <span class="mini-label">Días restantes</span>
                    <span class="mini-value">${days}</span>
                </div>
               </div>`
            : '';

        const section = (title, items) => `
            <div class="detail-section">
                <h4>${title}</h4>
                <div class="detail-grid">
                    ${items.map(([label, value]) =>
                        `<div class="detail-field"><span class="detail-label">${label}</span><span class="detail-value">${escapeHtml(value)}</span></div>`
                    ).join('')}
                </div>
            </div>`;

        let html = `
            <div class="detail-section">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                    <h3 style="margin:0;">${escapeHtml(row.contrato)}</h3>
                    ${statusBadge(row.estado, 'contrato')}
                </div>
            </div>
            ${section('Identificación', fields)}
            ${section('Financiero', financial)}
            ${section('Fechas', dates)}
            ${daysInfo}
            ${row.etiquetas && row.etiquetas.length ? `<div class="detail-section"><h4>Etiquetas</h4><div>${row.etiquetas.map(t => `<span class="badge badge-blue">${escapeHtml(t)}</span>`).join(' ')}</div></div>` : ''}`;

        // Fetch detail endpoint for documents and structured data
        try {
            const detail = await api.get(`/contratos/${row.id}/detail`);

            // Render documents
            if (detail.documentos && detail.documentos.length > 0) {
                html += `<div class="detail-section"><h4>Documentos (${detail.documentos.length})</h4>`;
                detail.documentos.forEach(doc => {
                    html += `<div style="padding:8px 0;border-bottom:1px solid var(--border-color);">
                        <div style="display:flex;align-items:center;justify-content:space-between;">
                            <div style="font-weight:500;">${escapeHtml(doc.nombre)}</div>
                            ${doc.archivo_texto ? `<button class="btn btn-sm btn-secondary doc-view-btn" data-doc-id="${escapeHtml(doc.id)}" style="white-space:nowrap;">Ver texto</button>` : ''}
                        </div>
                        <div style="font-size:12px;color:var(--text-secondary);margin-top:2px;">
                            <span class="badge badge-blue">${escapeHtml(doc.tipo)}</span>
                            ${doc.fecha_documento ? ` ${formatDate(doc.fecha_documento)}` : ''}
                        </div>
                        ${doc.notas ? `<div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">${escapeHtml(doc.notas)}</div>` : ''}
                    </div>`;
                });
                html += `</div>`;
            }

            // Render structured details grouped by category
            if (detail.detalles && detail.detalles.length > 0) {
                const catLabels = {
                    price: 'Precio', ipc: 'IPC', garantia: 'Garantía',
                    descuento_1: 'Descuento 1', descuento_2: 'Descuento 2', descuento_3: 'Descuento 3',
                    incremento_pct: 'Incremento %', fin_contrato: 'Fin contrato', ibi: 'IBI', extras: 'Extras'
                };
                html += `<div class="detail-section"><h4>Datos extraídos</h4>`;
                html += `<table style="width:100%;font-size:13px;border-collapse:collapse;">
                    <thead><tr style="text-align:left;border-bottom:2px solid var(--border-color);">
                        <th style="padding:6px 4px;">Categoría</th>
                        <th style="padding:6px 4px;">Valor</th>
                        <th style="padding:6px 4px;">Importe</th>
                        <th style="padding:6px 4px;">Periodo</th>
                    </tr></thead><tbody>`;
                detail.detalles.forEach(d => {
                    const cat = catLabels[d.categoria] || d.categoria;
                    const label = d.etiqueta ? ` (${escapeHtml(d.etiqueta)})` : '';
                    html += `<tr style="border-bottom:1px solid var(--border-color);">
                        <td style="padding:6px 4px;"><span class="badge badge-blue">${escapeHtml(cat)}</span>${label}</td>
                        <td style="padding:6px 4px;">${d.valor ? escapeHtml(d.valor) : '-'}</td>
                        <td style="padding:6px 4px;">${d.valor_numerico ? formatCurrency(d.valor_numerico) : '-'}</td>
                        <td style="padding:6px 4px;font-size:12px;">${formatDate(d.fecha_inicio)} → ${formatDate(d.fecha_fin)}</td>
                    </tr>`;
                });
                html += `</tbody></table></div>`;
            }
        } catch (e) {
            // Silently ignore if detail fetch fails
        }

        this.panel.querySelector('.panel-body').innerHTML = html;

        // Wire up document view buttons
        this.panel.querySelectorAll('.doc-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openDocumentModal(btn.dataset.docId);
            });
        });
    }

    async openContabilidad(row) {
        openPanel(this, 'Detalle de factura');
        if (!this.panel) return;

        const fields = [
            ['Referencia', row.referencia],
            ['Concepto', row.concepto],
            ['Contrato', row.contrato],
            ['Activo', row.activo],
            ['Pagador', row.pagador],
            ['Receptor', row.receptor],
        ];
        const amounts = [
            ['Total', formatCurrency(row.total)],
            ['Pagado', formatCurrency(row.pagado)],
            ['IVA', formatCurrency(row.vat)],
            ['Descuento', formatCurrency(row.descuento)],
            ['Descuento %', row.descuento_pct ? `${row.descuento_pct}%` : '-'],
        ];
        const dates = [
            ['Fecha factura', row.fecha || '-'],
            ['Fecha de pago', formatDate(row.fecha_de_pago)],
        ];
        const payment = [
            ['Método de pago', row.metodo_pago || '-'],
            ['Cuenta pagador', row.cuenta_pagador || '-'],
        ];

        const section = (title, items) => `
            <div class="detail-section">
                <h4>${title}</h4>
                <div class="detail-grid">
                    ${items.map(([label, value]) =>
                        `<div class="detail-field"><span class="detail-label">${label}</span><span class="detail-value">${escapeHtml(value)}</span></div>`
                    ).join('')}
                </div>
            </div>`;

        let html = `
            <div class="detail-section">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
                    <h3 style="margin:0;">${escapeHtml(row.referencia)}</h3>
                    ${statusBadge(computeEstado(row), 'contabilidad')}
                </div>
            </div>
            ${section('Identificación', fields)}
            ${section('Importes', amounts)}
            ${section('Fechas', dates)}
            ${section('Pago', payment)}
            ${row.notas ? `<div class="detail-section"><h4>Notas</h4><p style="color:var(--text-secondary);font-size:14px;">${escapeHtml(row.notas)}</p></div>` : ''}`;

        this.panel.querySelector('.panel-body').innerHTML = html;
    }

    close() { closePanel(this); }
}

// ============================================
// Dashboard Renderer
// ============================================
async function renderDashboard(container) {
    try {
        const data = await api.get('/dashboard');
        const el = typeof container === 'string' ? document.querySelector(container) : container;

        const rate = data.collection_rate || 0;
        const rateColor = rate > 80 ? 'green' : rate > 50 ? 'amber' : 'red';

        const alquilado = data.activos_by_estado.find(e => e.estado === 'Alquilado')?.count || 0;
        const libre = data.activos_by_estado.find(e => e.estado === 'Libre')?.count || 0;

        let html = `
            <!-- KPI Cards -->
            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="label">Total activos</div>
                    <div class="value">${data.total_activos}</div>
                    <div class="kpi-subtitle">${alquilado} alquilados, ${libre} libres</div>
                </div>
                <div class="stat-card">
                    <div class="label">Total facturado</div>
                    <div class="value currency">${formatCurrency(data.total_facturado).replace(/[^\d.,]/g, '')}</div>
                    <div class="kpi-subtitle">Todos los activos</div>
                </div>
                <div class="stat-card success">
                    <div class="label">Cobrado</div>
                    <div class="value currency">${formatCurrency(data.total_cobrado).replace(/[^\d.,]/g, '')}</div>
                    <div class="kpi-subtitle">${rate.toFixed(1)}% tasa de cobro</div>
                    <div style="margin-top:8px;">${progressBar(rate, rateColor)}</div>
                </div>
                <div class="stat-card ${data.pending_count > 0 ? 'error' : ''}">
                    <div class="label">Pendiente</div>
                    <div class="value currency">${formatCurrency(data.total_pendiente).replace(/[^\d.,]/g, '')}</div>
                    <div class="kpi-subtitle">${data.pending_count} factura${data.pending_count !== 1 ? 's' : ''} sin pagar</div>
                </div>
            </div>`;

        // Alerts
        const hasOverdue = data.overdue_invoices && data.overdue_invoices.length > 0;
        const hasExpiring = data.expiring_leases && data.expiring_leases.length > 0;

        if (hasOverdue || hasExpiring) {
            html += '<div class="alerts-row">';

            if (hasOverdue) {
                html += `
                <div class="alert-section alert-danger">
                    <h3>Pagos atrasados (${data.overdue_invoices.length})</h3>
                    <div class="alert-list">
                        ${data.overdue_invoices.map(inv => `
                            <div class="alert-item">
                                <div class="alert-item-main">
                                    <span class="alert-item-title">${escapeHtml(inv.activo)}</span>
                                    <span class="alert-item-subtitle">${escapeHtml(inv.referencia)} &mdash; ${escapeHtml(inv.concepto)}</span>
                                </div>
                                <div class="alert-item-value">${formatCurrency(parseFloat(inv.total || 0) - parseFloat(inv.pagado || 0))}</div>
                            </div>
                        `).join('')}
                    </div>
                    <a href="/overdue" class="alert-link">Ver todos los impagos &rarr;</a>
                </div>`;
            }

            if (hasExpiring) {
                html += `
                <div class="alert-section alert-warning">
                    <h3>Contratos por vencer (${data.expiring_leases.length})</h3>
                    <div class="alert-list">
                        ${data.expiring_leases.map(a => {
                            const days = daysUntil(a.fecha_fin);
                            return `
                            <div class="alert-item">
                                <div class="alert-item-main">
                                    <span class="alert-item-title">${escapeHtml(a.activo)}</span>
                                    <span class="alert-item-subtitle">${escapeHtml(a.direccion)}</span>
                                </div>
                                <div class="alert-item-value">${days != null ? `${days}d` : '-'}<br><small>${formatDate(a.fecha_fin)}</small></div>
                            </div>`;
                        }).join('')}
                    </div>
                    <a href="/activos" class="alert-link">Ver todos los activos &rarr;</a>
                </div>`;
            }

            html += '</div>';
        }

        // Two-column: Status + Activity
        html += '<div class="dashboard-two-col">';

        // Properties by Status
        html += `
            <div>
                <h2 class="section-title" id="status-section">Activos por estado</h2>
                <div class="table-container">
                    <table class="data-table">
                        <thead><tr><th>Estado</th><th>Cantidad</th><th>Distribución</th></tr></thead>
                        <tbody>
                            ${data.activos_by_estado.map(e => {
                                const pct = data.total_activos > 0 ? (e.count / data.total_activos * 100) : 0;
                                const color = {'Alquilado':'green','Ocupado':'amber','Libre':'gray','En reforma':'blue','Reservado':'blue'}[e.estado] || 'gray';
                                return `
                                <tr class="clickable-row" onclick="window.location.href='/activos'">
                                    <td>${statusBadge(e.estado, 'activo')}</td>
                                    <td>${e.count}</td>
                                    <td style="min-width:120px;">${progressBar(pct, color)} <small style="color:var(--text-muted);">${pct.toFixed(0)}%</small></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;

        // Recent Activity
        if (data.recent_activity && data.recent_activity.length > 0) {
            html += `
            <div>
                <h2 class="section-title" id="activity-section">Actividad reciente</h2>
                <div class="activity-feed">
                    ${data.recent_activity.map(a => {
                        const actionIcon = {'create': '\u002B', 'update': '\u270E', 'delete': '\u2212'}[a.action] || '\u2022';
                        const actionColor = {'create': 'green', 'update': 'amber', 'delete': 'red'}[a.action] || 'gray';
                        return `
                        <div class="activity-item">
                            <span class="activity-icon activity-${actionColor}">${actionIcon}</span>
                            <div class="activity-content">
                                <span class="activity-text"><strong>${a.action}</strong> ${escapeHtml(a.entity_type)} <span style="color:var(--text-muted);">${escapeHtml(a.entity_id?.substring(0,8))}...</span></span>
                                <span class="activity-time">${timeAgo(a.created_at)}</span>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>`;
        }

        html += '</div>';

        // Financial by Receptor
        if (data.financial_by_receptor && data.financial_by_receptor.length > 0) {
            html += `
            <h2 class="section-title" id="financial-section">Resumen financiero por receptor</h2>
            <div class="table-container" style="margin-bottom:32px;">
                <table class="data-table">
                    <thead><tr>
                        <th>Receptor</th><th class="numeric">Activos</th><th class="numeric">Facturado</th><th class="numeric">Cobrado</th><th class="numeric">Pendiente</th>
                    </tr></thead>
                    <tbody>
                        ${data.financial_by_receptor.map(r => `
                            <tr>
                                <td>${escapeHtml(r.receptor)}</td>
                                <td class="numeric">${r.num_activos || 0}</td>
                                <td class="numeric">${formatCurrency(r.total_facturado)}</td>
                                <td class="numeric">${formatCurrency(r.total_cobrado)}</td>
                                <td class="numeric" style="${parseFloat(r.total_pendiente || 0) > 0 ? 'color:var(--danger);font-weight:600;' : ''}">${formatCurrency(r.total_pendiente)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
        }

        // Financial by Property
        if (data.financial_by_activo.length > 0) {
            const totalInvoices = data.financial_by_activo.reduce((s, a) => s + (a.num_facturas || 0), 0);
            const overallRate = data.collection_rate || 0;
            const overallRateColor = overallRate > 80 ? 'green' : overallRate > 50 ? 'amber' : 'red';
            html += `
            <h2 class="section-title">Resumen financiero por activo</h2>
            <div class="table-container" style="margin-bottom:32px;">
                <table class="data-table">
                    <thead><tr>
                        <th>Activo</th><th class="numeric">Facturado</th><th class="numeric">Cobrado</th><th class="numeric">Pendiente</th><th class="rate-col">% Cobro</th><th class="numeric">Facturas</th>
                    </tr></thead>
                    <tbody>
                        ${data.financial_by_activo.map(a => {
                            const f = parseFloat(a.total_facturado || 0);
                            const c = parseFloat(a.total_cobrado || 0);
                            const p = parseFloat(a.total_pendiente || 0);
                            const r = f > 0 ? (c / f * 100) : 0;
                            const avatarColor = stringToColor(a.activo);
                            const initial = (a.activo || '?').charAt(0).toUpperCase();
                            return `
                            <tr class="clickable-row" onclick="window.location.href='/contabilidad?search=${encodeURIComponent(a.activo)}'">
                                <td><div class="property-cell"><div class="property-avatar" style="background:${avatarColor}">${initial}</div><span class="property-name">${escapeHtml(a.activo)}</span></div></td>
                                <td class="numeric">${formatCurrency(f)}</td>
                                <td class="numeric">${formatCurrency(c)}</td>
                                <td class="numeric" style="${p > 0 ? 'color:var(--danger);font-weight:600;' : ''}">${formatCurrency(p)}</td>
                                <td class="rate-col">${progressBar(r, r > 80 ? 'green' : r > 50 ? 'amber' : 'red')} <small>${r.toFixed(0)}%</small></td>
                                <td class="numeric"><a href="/contabilidad?search=${encodeURIComponent(a.activo)}" class="invoice-link" onclick="event.stopPropagation()">${a.num_facturas || 0}</a></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="summary-row">
                            <td><strong>Todos los activos (${data.financial_by_activo.length})</strong></td>
                            <td class="numeric"><strong>${formatCurrency(data.total_facturado)}</strong></td>
                            <td class="numeric"><strong>${formatCurrency(data.total_cobrado)}</strong></td>
                            <td class="numeric" style="${parseFloat(data.total_pendiente) > 0 ? 'color:var(--danger);' : ''}"><strong>${formatCurrency(data.total_pendiente)}</strong></td>
                            <td class="rate-col">${progressBar(overallRate, overallRateColor)} <small><strong>${overallRate.toFixed(0)}%</strong></small></td>
                            <td class="numeric"><strong>${totalInvoices}</strong></td>
                        </tr>
                    </tfoot>
                </table>
            </div>`;
        }

        el.innerHTML = html;
    } catch (e) {
        Toast.show('Error al cargar el panel: ' + e.message, 'error');
    }
}

// ============================================
// Overdue Page Renderer
// ============================================
async function renderOverdue(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;

    try {
        const [morosidad, sinPagarResult, parcialResult] = await Promise.all([
            api.get('/reports/morosidad'),
            api.get('/contabilidad?estado=Sin+pagar&per_page=200'),
            api.get('/contabilidad?estado=Parcial&per_page=200')
        ]);

        const allInvoices = [
            ...(sinPagarResult.data || []),
            ...(parcialResult.data || [])
        ];

        // KPIs from morosidad
        const totalOverdue = morosidad.reduce((sum, m) => sum + parseFloat(m.total_owed || 0), 0);
        const numDebtors = morosidad.length;
        const avgDays = numDebtors > 0
            ? Math.round(morosidad.reduce((sum, m) => sum + (m.days_overdue || 0), 0) / numDebtors)
            : 0;
        const maxDays = morosidad.reduce((max, m) => Math.max(max, m.days_overdue || 0), 0);
        const totalInvoices = morosidad.reduce((sum, m) => sum + (m.num_invoices || 0), 0);

        let html = '';

        // KPI Cards
        html += `
            <div class="dashboard-grid">
                <div class="stat-card ${totalOverdue > 0 ? 'error' : ''}">
                    <div class="label">Total impagos</div>
                    <div class="value">${formatCurrency(totalOverdue)}</div>
                    <div class="kpi-subtitle">${totalInvoices} factura${totalInvoices !== 1 ? 's' : ''} sin pagar</div>
                </div>
                <div class="stat-card ${numDebtors > 0 ? 'warning' : ''}">
                    <div class="label">Deudores</div>
                    <div class="value">${numDebtors}</div>
                    <div class="kpi-subtitle">Grupos pagador / activo</div>
                </div>
                <div class="stat-card">
                    <div class="label">Días media impago</div>
                    <div class="value">${avgDays}</div>
                    <div class="kpi-subtitle">Todos los grupos</div>
                </div>
                <div class="stat-card ${maxDays > 90 ? 'error' : maxDays > 30 ? 'warning' : ''}">
                    <div class="label">Máx días impago</div>
                    <div class="value">${maxDays}</div>
                    <div class="kpi-subtitle">Factura más antigua</div>
                </div>
            </div>`;

        // Morosidad Summary Table
        if (morosidad.length > 0) {
            html += `
                <h2 class="section-title">Morosidad por pagador</h2>
                <div class="table-container" style="margin-bottom:32px;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Pagador</th>
                                <th>Activo</th>
                                <th class="numeric">Importe adeudado</th>
                                <th class="numeric">Facturas</th>
                                <th>Factura más antigua</th>
                                <th class="numeric">Días</th>
                                <th>Severidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${morosidad.map(m => {
                                const days = m.days_overdue || 0;
                                const sev = days > 90 ? 'red' : days > 30 ? 'amber' : 'gray';
                                const sevLabel = days > 90 ? 'Crítico' : days > 30 ? 'Alerta' : 'Reciente';
                                return `
                                <tr>
                                    <td>${escapeHtml(m.pagador)}</td>
                                    <td>${escapeHtml(m.activo)}</td>
                                    <td class="numeric" style="color:var(--danger);font-weight:600;">${formatCurrency(m.total_owed)}</td>
                                    <td class="numeric">${m.num_invoices}</td>
                                    <td>${formatDate(m.oldest_fecha)}</td>
                                    <td class="numeric" style="font-weight:600;">${days}</td>
                                    <td><span class="badge badge-${sev}">${sevLabel}</span></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>`;
        } else {
            html += `
                <div style="text-align:center;padding:48px;color:var(--text-muted);">
                    Sin impagos. Todas las facturas están pagadas.
                </div>`;
        }

        // Individual Invoices
        if (allInvoices.length > 0) {
            allInvoices.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

            html += `
                <h2 class="section-title">Facturas impagadas (${allInvoices.length})</h2>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Referencia</th>
                                <th>Concepto</th>
                                <th>Activo</th>
                                <th>Pagador</th>
                                <th class="numeric">Pendiente</th>
                                <th>Estado</th>
                                <th>Fecha</th>
                                <th class="numeric">Días</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${allInvoices.map(inv => {
                                const outstanding = parseFloat(inv.total || 0) - parseFloat(inv.pagado || 0);
                                const daysSince = Math.floor((Date.now() - new Date(inv.fecha).getTime()) / 86400000);
                                return `
                                <tr class="clickable-row" onclick="window.location.href='/contabilidad?search=${encodeURIComponent(inv.referencia)}'">
                                    <td>${escapeHtml(inv.referencia)}</td>
                                    <td>${escapeHtml(inv.concepto)}</td>
                                    <td>${escapeHtml(inv.activo)}</td>
                                    <td>${escapeHtml(inv.pagador)}</td>
                                    <td class="numeric" style="color:var(--danger);font-weight:600;">${formatCurrency(outstanding)}</td>
                                    <td>${statusBadge(inv.estado, 'contabilidad')}</td>
                                    <td>${formatDate(inv.fecha)}</td>
                                    <td class="numeric" style="font-weight:600;">${daysSince}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>`;
        }

        el.innerHTML = html;
    } catch (e) {
        Toast.show('Error al cargar datos de impagos: ' + e.message, 'error');
        el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text-muted);">Error al cargar datos de impagos.</div>';
    }
}

// ============================================
// Financial Analytics Page Renderer
// ============================================
async function renderFinancial(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;

    try {
        const [dashboard, rentabilidad] = await Promise.all([
            api.get('/dashboard'),
            api.get('/reports/rentabilidad')
        ]);

        let html = '';

        // KPI Cards
        const rate = dashboard.collection_rate || 0;
        const rateColor = rate > 80 ? 'green' : rate > 50 ? 'amber' : 'red';

        html += `
            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="label">Total facturado</div>
                    <div class="value currency">${formatCurrency(dashboard.total_facturado).replace(/[^\d.,]/g, '')}</div>
                    <div class="kpi-subtitle">Todos los activos</div>
                </div>
                <div class="stat-card success">
                    <div class="label">Total cobrado</div>
                    <div class="value currency">${formatCurrency(dashboard.total_cobrado).replace(/[^\d.,]/g, '')}</div>
                    <div class="kpi-subtitle">${rate.toFixed(1)}% tasa de cobro</div>
                    <div style="margin-top:8px;">${progressBar(rate, rateColor)}</div>
                </div>
                <div class="stat-card ${dashboard.pending_count > 0 ? 'error' : ''}">
                    <div class="label">Total pendiente</div>
                    <div class="value currency">${formatCurrency(dashboard.total_pendiente).replace(/[^\d.,]/g, '')}</div>
                    <div class="kpi-subtitle">${dashboard.pending_count} factura${dashboard.pending_count !== 1 ? 's' : ''} sin pagar</div>
                </div>
                <div class="stat-card">
                    <div class="label">Tasa de cobro</div>
                    <div class="value">${rate.toFixed(1)}%</div>
                    <div class="kpi-subtitle">${rateColor === 'green' ? 'Saludable' : rateColor === 'amber' ? 'Requiere atención' : 'Crítico'}</div>
                </div>
            </div>`;

        // Profitability by Property
        if (rentabilidad.length > 0) {
            rentabilidad.sort((a, b) => parseFloat(b.neto || 0) - parseFloat(a.neto || 0));
            html += `
                <h2 class="section-title">Rentabilidad por activo</h2>
                <div class="table-container" style="margin-bottom:32px;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Activo</th>
                                <th class="numeric">Ingresos</th>
                                <th class="numeric">Gastos</th>
                                <th class="numeric">Beneficio neto</th>
                                <th class="rate-col">Margen</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rentabilidad.map(r => {
                                const neto = parseFloat(r.neto || 0);
                                const margin = r.margen_pct != null ? r.margen_pct : 0;
                                const marginColor = margin > 50 ? 'green' : margin > 20 ? 'amber' : 'red';
                                return `
                                <tr>
                                    <td><div class="property-cell"><div class="property-avatar" style="background:${stringToColor(r.activo)}">${(r.activo || '?').charAt(0).toUpperCase()}</div><span class="property-name">${escapeHtml(r.activo)}</span></div></td>
                                    <td class="numeric">${formatCurrency(r.total_ingresos)}</td>
                                    <td class="numeric">${formatCurrency(r.total_gastos)}</td>
                                    <td class="numeric" style="${neto < 0 ? 'color:var(--danger);font-weight:600;' : neto > 0 ? 'color:var(--success);font-weight:600;' : ''}">${formatCurrency(neto)}</td>
                                    <td class="rate-col">${progressBar(Math.max(0, margin), marginColor)} <small>${margin.toFixed(1)}%</small></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>`;
        }

        // Financial Summary by Recipient
        if (dashboard.financial_by_receptor && dashboard.financial_by_receptor.length > 0) {
            html += `
                <h2 class="section-title">Resumen financiero por receptor</h2>
                <div class="table-container" style="margin-bottom:32px;">
                    <table class="data-table">
                        <thead><tr>
                            <th>Receptor</th><th class="numeric">Activos</th><th class="numeric">Facturado</th><th class="numeric">Cobrado</th><th class="numeric">Pendiente</th>
                        </tr></thead>
                        <tbody>
                            ${dashboard.financial_by_receptor.map(r => `
                                <tr>
                                    <td>${escapeHtml(r.receptor)}</td>
                                    <td class="numeric">${r.num_activos || 0}</td>
                                    <td class="numeric">${formatCurrency(r.total_facturado)}</td>
                                    <td class="numeric">${formatCurrency(r.total_cobrado)}</td>
                                    <td class="numeric" style="${parseFloat(r.total_pendiente || 0) > 0 ? 'color:var(--danger);font-weight:600;' : ''}">${formatCurrency(r.total_pendiente)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>`;
        }

        // Financial Summary by Property
        if (dashboard.financial_by_activo.length > 0) {
            const totalInvoices = dashboard.financial_by_activo.reduce((s, a) => s + (a.num_facturas || 0), 0);
            const overallRate = dashboard.collection_rate || 0;
            const overallRateColor = overallRate > 80 ? 'green' : overallRate > 50 ? 'amber' : 'red';
            html += `
                <h2 class="section-title">Resumen financiero por activo</h2>
                <div class="table-container" style="margin-bottom:32px;">
                    <table class="data-table">
                        <thead><tr>
                            <th>Activo</th><th class="numeric">Facturado</th><th class="numeric">Cobrado</th><th class="numeric">Pendiente</th><th class="rate-col">Tasa</th><th class="numeric">Facturas</th>
                        </tr></thead>
                        <tbody>
                            ${dashboard.financial_by_activo.map(a => {
                                const f = parseFloat(a.total_facturado || 0);
                                const c = parseFloat(a.total_cobrado || 0);
                                const p = parseFloat(a.total_pendiente || 0);
                                const r = f > 0 ? (c / f * 100) : 0;
                                return `
                                <tr class="clickable-row" onclick="window.location.href='/contabilidad?search=${encodeURIComponent(a.activo)}'">
                                    <td><div class="property-cell"><div class="property-avatar" style="background:${stringToColor(a.activo)}">${(a.activo || '?').charAt(0).toUpperCase()}</div><span class="property-name">${escapeHtml(a.activo)}</span></div></td>
                                    <td class="numeric">${formatCurrency(f)}</td>
                                    <td class="numeric">${formatCurrency(c)}</td>
                                    <td class="numeric" style="${p > 0 ? 'color:var(--danger);font-weight:600;' : ''}">${formatCurrency(p)}</td>
                                    <td class="rate-col">${progressBar(r, r > 80 ? 'green' : r > 50 ? 'amber' : 'red')} <small>${r.toFixed(0)}%</small></td>
                                    <td class="numeric"><a href="/contabilidad?search=${encodeURIComponent(a.activo)}" class="invoice-link" onclick="event.stopPropagation()">${a.num_facturas || 0}</a></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                        <tfoot>
                            <tr class="summary-row">
                                <td><strong>Todos los activos (${dashboard.financial_by_activo.length})</strong></td>
                                <td class="numeric"><strong>${formatCurrency(dashboard.total_facturado)}</strong></td>
                                <td class="numeric"><strong>${formatCurrency(dashboard.total_cobrado)}</strong></td>
                                <td class="numeric" style="${parseFloat(dashboard.total_pendiente) > 0 ? 'color:var(--danger);' : ''}"><strong>${formatCurrency(dashboard.total_pendiente)}</strong></td>
                                <td class="rate-col">${progressBar(overallRate, overallRateColor)} <small><strong>${overallRate.toFixed(0)}%</strong></small></td>
                                <td class="numeric"><strong>${totalInvoices}</strong></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>`;
        }

        // Expense Breakdown by Property
        try {
            const gastos = await api.get('/contabilidad?tipo=gasto&per_page=500');
            const items = gastos.data || [];
            if (items.length > 0) {
                const byActivo = {};
                items.forEach(inv => {
                    const key = inv.activo || 'Desconocido';
                    if (!byActivo[key]) byActivo[key] = { total: 0, count: 0, paid: 0 };
                    byActivo[key].total += parseFloat(inv.total || 0);
                    byActivo[key].paid += parseFloat(inv.pagado || 0);
                    byActivo[key].count += 1;
                });
                const sorted = Object.entries(byActivo).sort((a, b) => b[1].total - a[1].total);
                const grandTotal = sorted.reduce((s, [, v]) => s + v.total, 0);

                html += `
                    <h2 class="section-title">Desglose de gastos por activo</h2>
                    <div class="table-container">
                        <table class="data-table">
                            <thead><tr>
                                <th>Activo</th><th class="numeric">Total gastos</th><th class="numeric">Pagado</th><th class="numeric">Facturas</th><th class="rate-col">Proporción</th>
                            </tr></thead>
                            <tbody>
                                ${sorted.map(([activo, v]) => {
                                    const pct = grandTotal > 0 ? (v.total / grandTotal * 100) : 0;
                                    return `
                                    <tr>
                                        <td><div class="property-cell"><div class="property-avatar" style="background:${stringToColor(activo)}">${activo.charAt(0).toUpperCase()}</div><span class="property-name">${escapeHtml(activo)}</span></div></td>
                                        <td class="numeric">${formatCurrency(v.total)}</td>
                                        <td class="numeric">${formatCurrency(v.paid)}</td>
                                        <td class="numeric">${v.count}</td>
                                        <td class="rate-col">${progressBar(pct, 'amber')} <small>${pct.toFixed(0)}%</small></td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>`;
            }
        } catch (_) {
            // Expense breakdown is optional
        }

        el.innerHTML = html;
    } catch (e) {
        Toast.show('Error al cargar datos financieros: ' + e.message, 'error');
        el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text-muted);">Error al cargar datos financieros.</div>';
    }
}

// ============================================
// Audit Trail Page Renderer
// ============================================
async function renderAudit(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;

    try {
        const entries = await api.get('/audit/recent?limit=500');

        // Compute summary stats
        const total = entries.length;
        const byAction = { create: 0, update: 0, delete: 0 };
        const byEntity = {};
        entries.forEach(e => {
            byAction[e.action] = (byAction[e.action] || 0) + 1;
            byEntity[e.entity_type] = (byEntity[e.entity_type] || 0) + 1;
        });

        let html = '';

        // KPI Cards
        html += `
            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="label">Total registros</div>
                    <div class="value">${total}</div>
                    <div class="kpi-subtitle">Registros de auditoría</div>
                </div>
                <div class="stat-card success">
                    <div class="label">Creaciones</div>
                    <div class="value">${byAction.create || 0}</div>
                    <div class="kpi-subtitle">${total > 0 ? ((byAction.create || 0) / total * 100).toFixed(0) : 0}% del total</div>
                </div>
                <div class="stat-card">
                    <div class="label">Actualizaciones</div>
                    <div class="value">${byAction.update || 0}</div>
                    <div class="kpi-subtitle">${total > 0 ? ((byAction.update || 0) / total * 100).toFixed(0) : 0}% del total</div>
                </div>
                <div class="stat-card error">
                    <div class="label">Eliminaciones</div>
                    <div class="value">${byAction.delete || 0}</div>
                    <div class="kpi-subtitle">${total > 0 ? ((byAction.delete || 0) / total * 100).toFixed(0) : 0}% del total</div>
                </div>
            </div>`;

        // Entity type breakdown
        const entityTypes = Object.entries(byEntity).sort((a, b) => b[1] - a[1]);
        if (entityTypes.length > 0) {
            html += `
                <h2 class="section-title">Actividad por tipo de entidad</h2>
                <div class="table-container" style="margin-bottom:32px;">
                    <table class="data-table">
                        <thead><tr><th>Tipo de entidad</th><th class="numeric">Cantidad</th><th class="rate-col">Distribución</th></tr></thead>
                        <tbody>
                            ${entityTypes.map(([type, count]) => {
                                const pct = total > 0 ? (count / total * 100) : 0;
                                return `
                                <tr>
                                    <td><span class="badge badge-blue">${escapeHtml(type)}</span></td>
                                    <td class="numeric">${count}</td>
                                    <td class="rate-col">${progressBar(pct, 'blue')} <small>${pct.toFixed(0)}%</small></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>`;
        }

        // Filters
        const entityTypeOptions = Object.keys(byEntity).sort();
        html += `
            <h2 class="section-title">Línea temporal</h2>
            <div class="toolbar" style="margin-bottom:16px;">
                <select class="filter-select" id="audit-entity-filter">
                    <option value="">Todos los tipos</option>
                    ${entityTypeOptions.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
                <select class="filter-select" id="audit-action-filter">
                    <option value="">Todas las acciones</option>
                    <option value="create">Crear</option>
                    <option value="update">Actualizar</option>
                    <option value="delete">Eliminar</option>
                </select>
                <span id="audit-filter-count" style="font-size:var(--text-sm);color:var(--text-tertiary);margin-left:auto;"></span>
            </div>`;

        // Timeline container
        html += '<div id="audit-timeline"></div>';

        el.innerHTML = html;

        // Render timeline and bind filters
        function renderTimeline(items) {
            const timeline = document.getElementById('audit-timeline');
            const countEl = document.getElementById('audit-filter-count');
            countEl.textContent = `${items.length} de ${total} registros`;

            if (items.length === 0) {
                timeline.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text-muted);">No hay registros con los filtros seleccionados.</div>';
                return;
            }

            timeline.innerHTML = `
                <div class="activity-feed" style="max-height:none;">
                    ${items.map(e => {
                        const actionIcon = {'create': '+', 'update': '\u270E', 'delete': '\u2212'}[e.action] || '\u2022';
                        const actionColor = {'create': 'green', 'update': 'amber', 'delete': 'red'}[e.action] || 'gray';
                        const shortId = e.entity_id ? e.entity_id.substring(0, 8) : '';

                        let diffHtml = '';
                        if (e.action === 'create') {
                            diffHtml = '<div style="margin-top:6px;"><span class="badge badge-green">Registro creado</span></div>';
                        } else if (e.action === 'delete') {
                            diffHtml = '<div style="margin-top:6px;"><span class="badge badge-red">Registro eliminado</span></div>';
                        } else if (e.changed_fields && e.changed_fields.length > 0) {
                            diffHtml = '<div style="margin-top:8px;">' +
                                e.changed_fields.map(field => {
                                    const oldVal = e.old_values ? e.old_values[field] : null;
                                    const newVal = e.new_values ? e.new_values[field] : null;
                                    return '<div style="display:flex;align-items:center;gap:8px;padding:2px 0;font-size:var(--text-xs);">' +
                                        '<span style="color:var(--text-tertiary);min-width:100px;">' + escapeHtml(field) + '</span>' +
                                        (oldVal != null ? '<span style="color:var(--danger);text-decoration:line-through;">' + escapeHtml(String(oldVal)) + '</span> ' : '') +
                                        '<span style="color:var(--success);">' + escapeHtml(String(newVal)) + '</span>' +
                                    '</div>';
                                }).join('') +
                            '</div>';
                        }

                        return `
                        <div class="activity-item" style="align-items:flex-start;">
                            <span class="activity-icon activity-${actionColor}">${actionIcon}</span>
                            <div class="activity-content" style="flex:1;">
                                <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                                    <span class="badge badge-blue">${escapeHtml(e.entity_type)}</span>
                                    <span class="badge badge-${actionColor}">${escapeHtml(e.action)}</span>
                                    <span style="color:var(--text-tertiary);font-size:var(--text-xs);font-family:monospace;">${escapeHtml(shortId)}...</span>
                                    <span class="activity-time" style="margin-left:auto;">${timeAgo(e.created_at)}</span>
                                </div>
                                ${diffHtml}
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;
        }

        function applyFilters() {
            const entityFilter = document.getElementById('audit-entity-filter').value;
            const actionFilter = document.getElementById('audit-action-filter').value;
            const filtered = entries.filter(e => {
                if (entityFilter && e.entity_type !== entityFilter) return false;
                if (actionFilter && e.action !== actionFilter) return false;
                return true;
            });
            renderTimeline(filtered);
        }

        document.getElementById('audit-entity-filter').addEventListener('change', applyFilters);
        document.getElementById('audit-action-filter').addEventListener('change', applyFilters);

        // Initial render
        renderTimeline(entries);
    } catch (e) {
        Toast.show('Error al cargar datos de auditoría: ' + e.message, 'error');
        el.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text-muted);">Error al cargar datos de auditoría.</div>';
    }
}

// ============================================
// Property Presentation (Gallery + Lightbox)
// ============================================
const PropertyPresentation = {
    overlay: null,
    lightbox: null,
    images: [],
    currentIndex: 0,
    _keyHandler: null,

    async open(activoId) {
        try {
            const data = await api.get(`/activos/${activoId}/detail`);
            const a = data.activo;
            const f = data.financial;
            const images = data.images || [];
            this.images = images;
            this.currentIndex = 0;

            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'presentation-overlay';
            overlay.innerHTML = `
                <div class="presentation-modal">
                    <div class="presentation-header">
                        <h2>${escapeHtml(a.activo)}</h2>
                        ${statusBadge(a.estado, 'activo')}
                        <button class="presentation-close">&times;</button>
                    </div>
                    <div class="presentation-content">
                        <div class="presentation-gallery">
                            ${this._renderGallery(images)}
                        </div>
                        <div class="presentation-details">
                            ${this._renderDetails(a, f)}
                        </div>
                    </div>
                </div>`;

            document.body.appendChild(overlay);
            this.overlay = overlay;

            // Animate in
            requestAnimationFrame(() => overlay.classList.add('active'));

            // Bind events
            overlay.querySelector('.presentation-close').addEventListener('click', () => this.close());
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.close();
            });

            // Thumbnail clicks
            overlay.querySelectorAll('.gallery-thumbnail').forEach((img, i) => {
                img.addEventListener('click', () => this.openLightbox(i));
            });

            // Keyboard
            this._keyHandler = (e) => this._handleKey(e);
            document.addEventListener('keydown', this._keyHandler);
        } catch (e) {
            Toast.show('Error al cargar el activo: ' + e.message, 'error');
        }
    },

    _renderGallery(images) {
        if (images.length === 0) {
            return '<div class="gallery-empty">Sin fotos disponibles</div>';
        }
        return `
            <div class="gallery-grid">
                ${images.map((img, i) => `<img class="gallery-thumbnail" src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename)}" loading="lazy" data-index="${i}">`).join('')}
            </div>
            <div class="gallery-count">${images.length} foto${images.length !== 1 ? 's' : ''}</div>`;
    },

    _renderDetails(a, f) {
        let html = '';

        // Address
        html += `<div class="presentation-info-group">
            <h4>Ubicación</h4>
            <div class="presentation-info-row"><span class="label">Dirección</span><span class="value">${escapeHtml(a.direccion)}</span></div>
            ${a.referencia_catastral ? `<div class="presentation-info-row"><span class="label">Ref. catastral</span><span class="value">${escapeHtml(a.referencia_catastral)}</span></div>` : ''}
        </div>`;

        // Physical stats
        const hasStats = a.superficie || a.habitaciones || a.anio_construccion;
        if (hasStats) {
            html += `<div class="presentation-stats">
                ${a.superficie ? `<div class="presentation-stat"><div class="stat-value">${a.superficie}</div><div class="stat-label">m&sup2;</div></div>` : ''}
                ${a.habitaciones ? `<div class="presentation-stat"><div class="stat-value">${a.habitaciones}</div><div class="stat-label">Habitaciones</div></div>` : ''}
                ${a.anio_construccion ? `<div class="presentation-stat"><div class="stat-value">${a.anio_construccion}</div><div class="stat-label">Año</div></div>` : ''}
            </div>`;
        }

        // Lease info
        if (a.contrato || a.alquiler) {
            html += `<div class="presentation-info-group">
                <h4>Contrato</h4>
                ${a.contrato ? `<div class="presentation-info-row"><span class="label">Contrato</span><span class="value">${escapeHtml(a.contrato)}</span></div>` : ''}
                ${a.alquiler ? `<div class="presentation-info-row"><span class="label">Alquiler mensual</span><span class="value">${formatCurrency(a.alquiler)}</span></div>` : ''}
                ${a.fecha_inicio ? `<div class="presentation-info-row"><span class="label">Inicio</span><span class="value">${formatDate(a.fecha_inicio)}</span></div>` : ''}
                ${a.fecha_fin ? `<div class="presentation-info-row"><span class="label">Fin</span><span class="value">${formatDate(a.fecha_fin)}</span></div>` : ''}
            </div>`;
        }

        // Financial
        if (f) {
            const facturado = parseFloat(f.total_facturado || 0);
            const cobrado = parseFloat(f.total_cobrado || 0);
            const pendiente = parseFloat(f.total_pendiente || 0);

            html += `<div class="presentation-info-group">
                <h4>Resumen financiero</h4>
                <div class="presentation-financial-cards">
                    <div class="presentation-financial-card billed"><div class="fin-value">${formatCurrency(facturado)}</div><div class="fin-label">Facturado</div></div>
                    <div class="presentation-financial-card collected"><div class="fin-value">${formatCurrency(cobrado)}</div><div class="fin-label">Cobrado</div></div>
                    <div class="presentation-financial-card pending"><div class="fin-value">${formatCurrency(pendiente)}</div><div class="fin-label">Pendiente</div></div>
                </div>
            </div>`;
        }

        // Tags
        if (a.etiquetas && a.etiquetas.length) {
            html += `<div class="presentation-info-group">
                <h4>Etiquetas</h4>
                <div class="presentation-tags">
                    ${a.etiquetas.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
                </div>
            </div>`;
        }

        return html;
    },

    openLightbox(index) {
        this.currentIndex = index;
        const img = this.images[index];
        if (!img) return;

        const lb = document.createElement('div');
        lb.className = 'lightbox-overlay';
        lb.innerHTML = `
            <button class="lightbox-close">&times;</button>
            ${this.images.length > 1 ? `<button class="lightbox-nav prev">&#8249;</button><button class="lightbox-nav next">&#8250;</button>` : ''}
            <img class="lightbox-image" src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename)}">
            <div class="lightbox-counter">${index + 1} / ${this.images.length}</div>`;

        document.body.appendChild(lb);
        this.lightbox = lb;
        requestAnimationFrame(() => lb.classList.add('active'));

        lb.querySelector('.lightbox-close').addEventListener('click', () => this.closeLightbox());
        lb.addEventListener('click', (e) => {
            if (e.target === lb) this.closeLightbox();
        });

        const prevBtn = lb.querySelector('.lightbox-nav.prev');
        const nextBtn = lb.querySelector('.lightbox-nav.next');
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigateLightbox(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateLightbox(1));
    },

    navigateLightbox(dir) {
        if (!this.lightbox || this.images.length === 0) return;
        this.currentIndex = (this.currentIndex + dir + this.images.length) % this.images.length;
        const img = this.images[this.currentIndex];
        this.lightbox.querySelector('.lightbox-image').src = img.url;
        this.lightbox.querySelector('.lightbox-counter').textContent = `${this.currentIndex + 1} / ${this.images.length}`;
    },

    closeLightbox() {
        if (!this.lightbox) return;
        this.lightbox.classList.remove('active');
        setTimeout(() => {
            if (this.lightbox) {
                this.lightbox.remove();
                this.lightbox = null;
            }
        }, 250);
    },

    close() {
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }
        this.closeLightbox();
        if (!this.overlay) return;
        this.overlay.classList.remove('active');
        setTimeout(() => {
            if (this.overlay) {
                this.overlay.remove();
                this.overlay = null;
            }
        }, 350);
    },

    _handleKey(e) {
        if (e.key === 'Escape') {
            if (this.lightbox) {
                this.closeLightbox();
            } else {
                this.close();
            }
        } else if (this.lightbox) {
            if (e.key === 'ArrowLeft') this.navigateLightbox(-1);
            if (e.key === 'ArrowRight') this.navigateLightbox(1);
        }
    }
};

window.PropertyPresentation = PropertyPresentation;

// ============================================
// Exports for HTML pages
// ============================================
// Document text modal
async function openDocumentModal(docId) {
    try {
        const data = await api.get(`/contrato_documentos/${docId}/text`);
        const overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay active';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center;';
        const modal = document.createElement('div');
        modal.style.cssText = 'background:var(--surface-color,#fff);border-radius:12px;width:90%;max-width:800px;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.3);';
        modal.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-bottom:1px solid var(--border-color);">
                <h3 style="margin:0;font-size:16px;">${escapeHtml(data.nombre)}</h3>
                <button style="background:none;border:none;font-size:24px;cursor:pointer;color:var(--text-secondary);line-height:1;" class="doc-modal-close">&times;</button>
            </div>
            <div style="padding:24px;overflow-y:auto;flex:1;font-family:var(--font-mono,'Menlo',monospace);font-size:13px;line-height:1.7;white-space:pre-wrap;color:var(--text-primary);">${escapeHtml(data.content)}</div>`;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        modal.querySelector('.doc-modal-close').addEventListener('click', () => overlay.remove());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
        document.addEventListener('keydown', function handler(e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', handler); } });
    } catch (e) {
        Toast.show('Error al cargar documento: ' + e.message, 'error');
    }
}

window.AdminApp = { DataTable, FormPanel, HistoryPanel, DetailPanel, Toast, api, renderDashboard, renderOverdue, renderFinancial, renderAudit, confirmAction, formatCurrency, formatDate, statusBadge, PropertyPresentation, openDocumentModal };
