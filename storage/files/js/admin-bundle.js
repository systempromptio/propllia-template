const API_BASE = window.ADMIN_API_BASE || '/admin/api';

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

function confirmAction(title, message) {
    return new Promise(resolve => {
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.innerHTML = `
            <div class="confirm-dialog">
                <h3>${title}</h3>
                <p>${message}</p>
                <div class="actions">
                    <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                    <button class="btn btn-danger" data-action="confirm">Delete</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);
        ScrollLock.lock();
        overlay.querySelector('[data-action="cancel"]').onclick = () => { overlay.remove(); ScrollLock.unlock(); resolve(false); };
        overlay.querySelector('[data-action="confirm"]').onclick = () => { overlay.remove(); ScrollLock.unlock(); resolve(true); };
    });
}

const api = {
    _handleResponse(res) {
        if (res.status === 401) {
            window.location.href = AdminApp.loginUrl(window.location.pathname);
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
    },
    async uploadFile(path, file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}${path}`, {
            method: 'POST',
            body: formData
        });
        return this._handleResponse(res);
    }
};

function getUserInfo() {
    try {
        const cookie = document.cookie.split('; ').find(c => c.startsWith('access_token='));
        if (!cookie) return null;
        const token = cookie.split('=').slice(1).join('=');
        const payload = JSON.parse(atob(token.split('.')[1]));
        return { username: payload.username || '', email: payload.email || '' };
    } catch { return null; }
}

function getUserInitials(username) {
    if (!username) return '?';
    const parts = username.trim().split(/[\s._-]+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return username[0].toUpperCase();
}

function initSidebar() {
    const toggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.getElementById('admin-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const closeBtn = sidebar ? sidebar.querySelector('.sidebar-close-btn') : null;
    if (!toggle || !sidebar) return;

    function openSidebar() {
        sidebar.classList.add('open');
        if (overlay) overlay.classList.add('open');
        toggle.setAttribute('aria-expanded', 'true');
        ScrollLock.lock();
    }

    function closeSidebar() {
        sidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        ScrollLock.unlock();
        toggle.focus();
    }

    toggle.addEventListener('click', () => {
        sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
    });

    if (overlay) overlay.addEventListener('click', closeSidebar);
    if (closeBtn) closeBtn.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) closeSidebar();
    });

    sidebar.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', closeSidebar);
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
} else {
    initSidebar();
}

document.addEventListener('click', (e) => {
    if (e.target.closest('button, input, a, select, textarea')) return;
    const el = e.target.closest('[data-href]');
    if (el) window.location.href = el.dataset.href;
    const gallery = e.target.closest('[data-gallery-id]');
    if (gallery && window.PropertyPresentation) window.PropertyPresentation.open(gallery.dataset.galleryId);
});

const ScrollLock = {
    _count: 0,
    lock() { this._count++; if (this._count === 1) document.body.style.overflow = 'hidden'; },
    unlock() { this._count = Math.max(0, this._count - 1); if (this._count === 0) document.body.style.overflow = ''; }
};

const user = getUserInfo();
window.AdminApp = { API_BASE, Toast, api, confirmAction, user, getUserInitials, initSidebar, ScrollLock };
(function(AdminApp) {

const ADMIN_BASE = '/admin';

const LIST_ROUTES = {
    dashboard:      '/',
    properties:     '/properties',
    contracts:      '/contracts',
    invoices:       '/invoices',
    billing:        '/billing',
    expenses:       '/expenses',
    rentals:        '/rentals',
    tenants:        '/tenants',
    owners:         '/owners',
    deposits:       '/deposits',
    issues:         '/issues',
    sepa_batches:   '/sepa_batches',
    leads:          '/leads',
    contacts:       '/contacts',
    reminders:      '/reminders',
    overdue:        '/overdue',
    financial:      '/financial',
    audit:          '/audit',
    import:         '/import',
    insurance:      '/insurance',
};

const DETAIL_ROUTES = {
    property:       '/property_detail/',
    contract:       '/contract_detail/',
    invoice:        '/invoice_detail/',
    tenant:         '/tenant_detail/',
    owner:          '/owner_detail/',
    deposit:        '/deposit_detail/',
    issue:          '/issue_detail/',
    sepa_batch:     '/sepa_batch_detail/',
    lead:           '/lead_detail/',
};

function listUrl(entityKey, params) {
    const base = ADMIN_BASE + (LIST_ROUTES[entityKey] || '/' + entityKey);
    if (!params) return base;
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v != null && v !== '') qs.set(k, v);
    });
    const str = qs.toString();
    return str ? base + '?' + str : base;
}

function detailUrl(entityKey, id) {
    const path = DETAIL_ROUTES[entityKey];
    if (!path) return null;
    return ADMIN_BASE + path + '?id=' + encodeURIComponent(id);
}

function navigateTo(entityKey, id) {
    if (id) {
        const url = detailUrl(entityKey, id);
        if (url) window.location.href = url;
    } else {
        window.location.href = listUrl(entityKey);
    }
}

function breadcrumb(entityKey, listLabel, currentLabel) {
    return `<nav class="detail-breadcrumb">
        <a href="${listUrl(entityKey)}">${AdminApp.escapeHtml(listLabel)}</a>
        <span class="sep">&rsaquo;</span>
        <span>${AdminApp.escapeHtml(currentLabel)}</span>
    </nav>`;
}

function entitySearchLink(name, entityKey) {
    if (!name) return '-';
    const url = listUrl(entityKey, { search: name });
    return `<a href="${url}" class="link-accent">${AdminApp.escapeHtml(name)}</a>`;
}

function loginUrl(redirect) {
    const base = ADMIN_BASE + '/login';
    if (!redirect) return base;
    return base + '?redirect=' + encodeURIComponent(redirect);
}

Object.assign(AdminApp, {
    ADMIN_BASE, LIST_ROUTES, DETAIL_ROUTES,
    listUrl, detailUrl, navigateTo, breadcrumb,
    entitySearchLink, loginUrl
});

})(window.AdminApp);
(function(AdminApp) {

function formatCurrency(val) {
    if (val == null) return '-';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(num);
}

function formatCurrencyValue(val) {
    return formatCurrency(val).replace(/[^\d.,]/g, '');
}

function formatDate(val) {
    if (!val) return '-';
    try {
        const d = new Date(val);
        return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return val; }
}

function timeAgo(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'now';
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

function statusBadge(value, type) {
    const map = {
        property: { 'Rented': 'green', 'Occupied': 'amber', 'Vacant': 'gray', 'Under Renovation': 'blue', 'Reserved': 'blue' },
        invoice: { 'Paid': 'green', 'Partial': 'amber', 'Unpaid': 'red', 'income': 'green', 'expense': 'red' },
        rental: { 'Paid': 'green', 'Partial': 'amber', 'Unpaid': 'red' },
        billing: { 'Paid': 'green', 'Partial': 'amber', 'Unpaid': 'red' },
        expense: { 'Paid': 'green', 'Partial': 'amber', 'Unpaid': 'red' },
        contract: { 'Active': 'green', 'Pending': 'blue', 'Ended': 'gray', 'Suspended': 'red' },
        deposit: { 'Paid': 'green', 'Pending': 'amber', 'Returned': 'blue', 'Official body': 'gray' },
        issue: { 'Open': 'red', 'In Progress': 'amber', 'Resolved': 'green', 'Closed': 'gray', 'High': 'red', 'Medium': 'amber', 'Low': 'blue' },
        contract_document: { 'contract': 'blue', 'extension': 'green', 'annex': 'amber', 'addendum': 'gray' },
        contract_detail: { 'price': 'green', 'index': 'blue', 'guarantee': 'amber', 'discount_1': 'gray', 'discount_2': 'gray', 'discount_3': 'gray', 'increase_pct': 'amber', 'end_contract': 'red', 'council_tax': 'blue', 'extras': 'gray' },
        // Legacy aliases for compatibility
        activo: { 'Rented': 'green', 'Occupied': 'amber', 'Vacant': 'gray', 'Under Renovation': 'blue', 'Reserved': 'blue' },
        contabilidad: { 'Paid': 'green', 'Partial': 'amber', 'Unpaid': 'red', 'income': 'green', 'expense': 'red' },
        contrato: { 'Active': 'green', 'Pending': 'blue', 'Ended': 'gray', 'Suspended': 'red' },
        deposito: { 'Paid': 'green', 'Pending': 'amber', 'Returned': 'blue', 'Official body': 'gray' },
        incidencia: { 'Open': 'red', 'In Progress': 'amber', 'Resolved': 'green', 'Closed': 'gray', 'High': 'red', 'Medium': 'amber', 'Low': 'blue' },
    };
    const color = (map[type] || {})[value] || 'gray';
    return `<span class="badge badge-${color}">${escapeHtml(value)}</span>`;
}

function computeStatus(row) {
    const total = parseFloat(row.total) || 0;
    const paid = parseFloat(row.paid) || 0;
    if (total <= 0) return row.status || 'Unpaid';
    if (paid >= total) return 'Paid';
    if (paid > 0) return 'Partial';
    return 'Unpaid';
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

function rateColor(pct) {
    return pct > 80 ? 'green' : pct > 50 ? 'amber' : 'red';
}

function getPeriodMonths(period) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
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

function detailSection(title, items) {
    return `
        <div class="detail-section">
            <h4>${title}</h4>
            <div class="detail-grid">
                ${items.map(([label, value]) =>
                    `<div class="detail-field"><span class="detail-label">${label}</span><span class="detail-value">${escapeHtml(value)}</span></div>`
                ).join('')}
            </div>
        </div>`;
}

Object.assign(AdminApp, {
    formatCurrency, formatCurrencyValue, formatDate, timeAgo, daysUntil,
    escapeHtml, statusBadge, computeStatus, computeEstado: computeStatus, progressBar, stringToColor,
    rateColor, getPeriodMonths, detailSection
});

})(window.AdminApp);
(function(AdminApp) {

function openPanel(instance, title) {
    if (instance.panel || instance.overlay) {
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
            <div class="panel-loading"><div class="loading-spinner"></div></div>
        </div>`;

    instance.panel.addEventListener('click', e => e.stopPropagation());
    instance.panel.querySelector('.panel-close').addEventListener('click', () => instance.close());
    instance.overlay.addEventListener('click', (e) => {
        if (e.target === instance.overlay) instance.close();
    });

    document.body.appendChild(instance.overlay);
    document.body.appendChild(instance.panel);
    AdminApp.ScrollLock.lock();

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
        AdminApp.ScrollLock.unlock();
    }, 350);
}

Object.assign(AdminApp, { openPanel, closePanel });

})(window.AdminApp);
(function(AdminApp) {

const { escapeHtml } = AdminApp;

function renderActionPopup(row, config) {
    const id = escapeHtml(row.id);
    return `<td class="actions col-actions">
        <button class="btn-actions-trigger" data-id="${id}" aria-label="Acciones" aria-haspopup="true" aria-expanded="false" type="button">&#8942;</button>
    </td>`;
}

function _buildPopupHtml(id, config, row) {
    return `
        ${config.onRowClick ? `<button class="actions-popup-item" data-action="view" data-id="${id}" role="menuitem"><span class="popup-icon">&#9654;</span>View details</button>` : ''}
        ${row.imagen_carpeta ? `<button class="actions-popup-item" data-action="gallery" data-id="${id}" role="menuitem"><span class="popup-icon">&#128247;</span>View photos</button>` : ''}
        ${config.hasPdf ? `<button class="actions-popup-item" data-action="pdf" data-id="${id}" role="menuitem"><span class="popup-icon">&#128196;</span>Download PDF</button>` : ''}
        <button class="actions-popup-item" data-action="edit" data-id="${id}" role="menuitem"><span class="popup-icon">&#9998;</span>Edit</button>
        <button class="actions-popup-item" data-action="history" data-id="${id}" role="menuitem"><span class="popup-icon">&#128337;</span>History</button>
        <div class="actions-popup-separator"></div>
        <button class="actions-popup-item actions-popup-item--danger" data-action="delete" data-id="${id}" role="menuitem"><span class="popup-icon">&#10005;</span>Delete</button>`;
}

function closeAllPopups() {
    const popup = document.getElementById('actions-popup-portal');
    if (popup) {
        popup.classList.remove('open');
        const triggerId = popup.dataset.triggerId;
        if (triggerId) {
            const trigger = document.querySelector(`.btn-actions-trigger[data-id="${triggerId}"]`);
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
                trigger.classList.remove('active');
            }
        }
    }
}

function _getOrCreatePortal() {
    let portal = document.getElementById('actions-popup-portal');
    if (!portal) {
        portal = document.createElement('div');
        portal.id = 'actions-popup-portal';
        portal.className = 'actions-popup';
        portal.setAttribute('role', 'menu');
        portal.setAttribute('aria-label', 'Actions');
        document.body.appendChild(portal);
    }
    return portal;
}

function bindActionPopupEvents(tbody, dataTable) {
    tbody.querySelectorAll('.btn-actions-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = trigger.dataset.id;
            const portal = _getOrCreatePortal();
            const isOpen = portal.classList.contains('open') && portal.dataset.triggerId === id;
            closeAllPopups();
            if (!isOpen) {
                const row = dataTable.data.find(r => r.id === id);
                if (!row) return;
                portal.innerHTML = _buildPopupHtml(id, dataTable.config, row);
                portal.dataset.triggerId = id;
                portal.classList.add('open');
                trigger.setAttribute('aria-expanded', 'true');
                trigger.classList.add('active');
                const rect = trigger.getBoundingClientRect();
                const popupH = portal.offsetHeight || 240;
                const spaceBelow = window.innerHeight - rect.bottom;
                if (spaceBelow < popupH) {
                    portal.style.top = `${rect.top - popupH}px`;
                } else {
                    portal.style.top = `${rect.bottom + 4}px`;
                }
                const popupW = portal.offsetWidth || 180;
                if (window.innerWidth < popupW + 16) {
                    portal.style.left = '8px';
                    portal.style.right = '8px';
                } else {
                    portal.style.right = `${window.innerWidth - rect.right}px`;
                    portal.style.left = '';
                }

                portal.querySelectorAll('.actions-popup-item').forEach(item => {
                    item.addEventListener('click', (ev) => {
                        ev.stopPropagation();
                        const action = item.dataset.action;
                        const itemId = item.dataset.id;
                        const itemRow = dataTable.data.find(r => r.id === itemId);
                        closeAllPopups();
                        if (action === 'view') {
                            if (itemRow && dataTable.config.onRowClick) dataTable.config.onRowClick(itemRow);
                        } else {
                            if (dataTable.config.onAction) dataTable.config.onAction(action, itemRow);
                        }
                    });
                });

                portal.addEventListener('keydown', function onKey(ev) {
                    const items = [...portal.querySelectorAll('.actions-popup-item')];
                    const idx = items.indexOf(document.activeElement);
                    if (ev.key === 'ArrowDown') { ev.preventDefault(); (items[idx + 1] || items[0]).focus(); }
                    else if (ev.key === 'ArrowUp') { ev.preventDefault(); (items[idx - 1] || items[items.length - 1]).focus(); }
                    else if (ev.key === 'Escape') {
                        closeAllPopups();
                        trigger.focus();
                        portal.removeEventListener('keydown', onKey);
                    }
                });

                const firstItem = portal.querySelector('.actions-popup-item');
                if (firstItem) firstItem.focus();
            }
        });
    });
}

function setupPopupDismissHandlers(container) {
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.btn-actions-trigger') && !e.target.closest('#actions-popup-portal')) {
            closeAllPopups();
        }
    });

    const tableScroll = container.querySelector('.table-scroll');
    if (tableScroll) {
        tableScroll.addEventListener('scroll', () => {
            closeAllPopups();
        });
    }
}

Object.assign(AdminApp, {
    renderActionPopup,
    bindActionPopupEvents,
    setupPopupDismissHandlers,
    closeAllPopups
});

})(window.AdminApp);
(function(AdminApp) {

const { escapeHtml, getPeriodMonths } = AdminApp;

function renderFilterBar(config, filterValues, searchQuery, perPage) {
    const hasFilters = (config.filters && config.filters.length > 0) || config.showPeriodFilter;

    const periodFilter = config.showPeriodFilter ? `
        <div class="filter-group">
            <label class="filter-label">Per\u00edodo</label>
            <select class="period-select" data-filter="_period">
                <option value="">All</option>
                <option value="this_month">This month</option>
                <option value="last_month">Last month</option>
                <option value="last_3">\Last 3 months</option>
                <option value="last_6">\Last 6 months</option>
                <option value="this_year">This year</option>
                <option value="last_year">Last year</option>
                <option value="custom">Custom</option>
            </select>
        </div>` : '';

    const dateRangeFilter = config.showPeriodFilter ? `
        <div class="date-range-filter hidden">
            <div class="filter-group">
                <label class="filter-label">From</label>
                <input type="date" class="date-range-input" data-filter="fecha_from" value="${escapeHtml(filterValues.fecha_from || '')}">
            </div>
            <div class="filter-group">
                <label class="filter-label">To</label>
                <input type="date" class="date-range-input" data-filter="fecha_to" value="${escapeHtml(filterValues.fecha_to || '')}">
            </div>
        </div>` : '';

    const filterInputs = (config.filters || []).map(f =>
        f.type === 'text'
        ? `<div class="filter-group"><label class="filter-label">${f.label}</label><input type="text" class="filter-text filter-input" data-filter="${f.key}" placeholder="${f.label}..." value="${escapeHtml(filterValues[f.key] || '')}" class="filter-min-width"></div>`
        : `<div class="filter-group"><label class="filter-label">${f.label}</label><select class="filter-select${f.asyncOptions ? ' async-filter' : ''}" data-filter="${f.key}"${f.asyncOptions ? ` data-async-url="${f.asyncOptions}"` : ''}>
            <option value="">All</option>
            ${(f.options || []).map(o => `<option value="${o}" ${filterValues[f.key] === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select></div>`
    ).join('');

    const filterToggleBtn = hasFilters ? `
        <button class="btn btn-sm btn-secondary filter-toggle" aria-expanded="true" type="button">
            <span class="filter-toggle-icon">\u25BC</span> Filtros
            <span class="filter-toggle-count"></span>
        </button>` : '';

    const toolbar = `
        ${config.showCheckboxes ? '<div class="selection-bar hidden"><span class="selection-count"></span><slot name="selection-actions"></slot></div>' : ''}
        <div class="toolbar">
            <input type="text" class="search-input" placeholder="Search ${config.entity}..." value="${escapeHtml(searchQuery)}">
            ${filterToggleBtn}
            ${config.exportPath ? '<button class="btn btn-secondary" data-action="export">\u2913 Export CSV</button>' : ''}
            ${config.readOnly ? '' : '<button class="btn btn-primary" data-action="create">+ New</button>'}
        </div>
        ${hasFilters ? `<div class="filter-row">
            ${periodFilter}
            ${dateRangeFilter}
            ${filterInputs}
        </div>` : ''}
        <div class="filter-chips hidden">
            <div class="filter-chips-list"></div>
            <button class="btn btn-sm btn-secondary filter-chips-clear">Clear filters</button>
        </div>`;

    const table = `
        <div class="table-container">
            <div class="table-scroll">
                <table class="data-table">
                    <thead><tr></tr></thead>
                    <tbody></tbody>
                    <tfoot></tfoot>
                </table>
            </div>
            <div class="pagination">
                <div class="pagination-info">
                    <span class="row-count"></span>
                    <select class="per-page-select">
                        <option value="50" ${perPage === 50 ? 'selected' : ''}>50</option>
                        <option value="100" ${perPage === 100 ? 'selected' : ''}>100</option>
                        <option value="200" ${perPage === 200 ? 'selected' : ''}>200</option>
                        <option value="0" ${perPage === 0 ? 'selected' : ''}>All</option>
                    </select>
                    <span>por p\u00e1gina</span>
                </div>
                <div class="pagination-controls"></div>
            </div>
        </div>`;

    return toolbar + table;
}

function bindFilterEvents(container, dt) {
    const searchInput = container.querySelector('.toolbar > .search-input');
    let debounce;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => { dt.searchQuery = searchInput.value; dt.page = 1; dt.clearSelection(); dt.load(); }, 300);
    });

    const filterToggle = container.querySelector('.filter-toggle');
    const filterRow = container.querySelector('.filter-row');
    if (filterToggle && filterRow) {
        filterToggle.addEventListener('click', () => {
            const expanded = filterToggle.getAttribute('aria-expanded') === 'true';
            filterToggle.setAttribute('aria-expanded', String(!expanded));
            filterRow.classList.toggle('filter-row--collapsed', expanded);
        });
    }

    const periodSelect = container.querySelector('.period-select');
    const dateRangeEl = container.querySelector('.date-range-filter');
    if (periodSelect) {
        if (dt.filterValues.fecha_from || dt.filterValues.fecha_to) {
            periodSelect.value = 'custom';
            if (dateRangeEl) dateRangeEl.classList.remove('hidden');
        }
        periodSelect.addEventListener('change', () => {
            const period = periodSelect.value;
            if (period === 'custom') {
                if (dateRangeEl) dateRangeEl.classList.remove('hidden');
                delete dt.filterValues.periodo;
            } else {
                if (dateRangeEl) dateRangeEl.classList.add('hidden');
                const periodoStr = getPeriodMonths(period);
                dt.filterValues.periodo = periodoStr || undefined;
                delete dt.filterValues.fecha_from;
                delete dt.filterValues.fecha_to;
                dt.page = 1;
                dt.clearSelection();
                dt.load();
            }
        });
    }

    if (dateRangeEl) {
        dateRangeEl.querySelectorAll('.date-range-input').forEach(input => {
            input.addEventListener('change', () => {
                dt.filterValues[input.dataset.filter] = input.value || undefined;
                delete dt.filterValues.periodo;
                dt.page = 1;
                dt.clearSelection();
                dt.load();
            });
        });
    }

    container.querySelectorAll('.filter-select').forEach(sel => {
        sel.addEventListener('change', () => {
            dt.filterValues[sel.dataset.filter] = sel.value || undefined;
            dt.page = 1;
            dt.clearSelection();
            dt.load();
        });
    });

    container.querySelectorAll('.filter-text').forEach(input => {
        let filterDebounce;
        input.addEventListener('input', () => {
            clearTimeout(filterDebounce);
            filterDebounce = setTimeout(() => {
                dt.filterValues[input.dataset.filter] = input.value || undefined;
                dt.page = 1;
                dt.clearSelection();
                dt.load();
            }, 300);
        });
    });

    const clearBtn = container.querySelector('.filter-chips-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => { dt._clearAllFilters(); });
    }

    const exportBtn = container.querySelector('[data-action="export"]');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const params = dt._buildParams();
            params.delete('page');
            params.delete('per_page');
            const qs = params.toString();
            window.open(`${AdminApp.API_BASE}${dt.config.exportPath}${qs ? '?' + qs : ''}`, '_blank');
        });
    }

    const createBtn = container.querySelector('[data-action="create"]');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            if (dt.config.onAction) dt.config.onAction('create', null);
        });
    }

    container.querySelector('.per-page-select').addEventListener('change', (e) => {
        dt.perPage = parseInt(e.target.value, 10);
        dt.page = 1;
        dt.load();
    });
}

Object.assign(AdminApp, { renderFilterBar, bindFilterEvents });

})(window.AdminApp);
(function(AdminApp) {

const { escapeHtml } = AdminApp;

function loadAsyncFilters(container, dt) {
    container.querySelectorAll('.async-filter').forEach(sel => {
        const url = sel.dataset.asyncUrl;
        if (!url) return;
        const filterKey = sel.dataset.filter;
        const filterCfg = (dt.config.filters || []).find(f => f.key === filterKey);
        const valKey = filterCfg?.optionValue;
        const lblKey = filterCfg?.optionLabel;
        (async () => {
            try {
                const options = await AdminApp.api.get(url);
                const current = dt.filterValues[filterKey];
                if (valKey && lblKey && options.length > 0 && typeof options[0] === 'object') {
                    const labelMap = {};
                    options.forEach(o => { labelMap[String(o[valKey])] = o[lblKey]; });
                    dt._asyncOptionLabels[filterKey] = labelMap;
                    sel.innerHTML = '<option value="">All</option>' +
                        options.map(o => `<option value="${o[valKey]}" ${current === String(o[valKey]) ? 'selected' : ''}>${o[lblKey]}</option>`).join('');
                } else {
                    sel.innerHTML = '<option value="">All</option>' +
                        options.map(o => `<option value="${o}" ${current === o ? 'selected' : ''}>${o}</option>`).join('');
                }
                dt._renderChips();
            } catch (_) { }
        })();
    });
}

function clearAllFilters(dt) {
    dt.searchQuery = '';
    const searchInput = dt.container.querySelector('.toolbar > .search-input');
    if (searchInput) searchInput.value = '';
    const defaults = dt.config.defaultFilters || {};
    dt.filterValues = { ...defaults };
    dt.container.querySelectorAll('.filter-select').forEach(sel => { sel.value = ''; });
    dt.container.querySelectorAll('.filter-text').forEach(input => { input.value = ''; });
    const periodSelect = dt.container.querySelector('.period-select');
    if (periodSelect) periodSelect.value = '';
    const dateRangeEl = dt.container.querySelector('.date-range-filter');
    if (dateRangeEl) {
        dateRangeEl.classList.add('hidden');
        dateRangeEl.querySelectorAll('.date-range-input').forEach(input => { input.value = ''; });
    }
    dt.page = 1;
    dt.clearSelection();
    dt.load();
}

function removeFilter(dt, key) {
    if (key === '_search') {
        dt.searchQuery = '';
        const searchInput = dt.container.querySelector('.toolbar > .search-input');
        if (searchInput) searchInput.value = '';
    } else if (key === 'periodo') {
        delete dt.filterValues.periodo;
        const periodSelect = dt.container.querySelector('.period-select');
        if (periodSelect) periodSelect.value = '';
    } else if (key === 'fecha_from' || key === 'fecha_to') {
        delete dt.filterValues.fecha_from;
        delete dt.filterValues.fecha_to;
        const dateRangeEl = dt.container.querySelector('.date-range-filter');
        if (dateRangeEl) {
            dateRangeEl.classList.add('hidden');
            dateRangeEl.querySelectorAll('.date-range-input').forEach(input => { input.value = ''; });
        }
        const periodSelect = dt.container.querySelector('.period-select');
        if (periodSelect) periodSelect.value = '';
    } else {
        delete dt.filterValues[key];
        const sel = dt.container.querySelector(`.filter-select[data-filter="${key}"]`);
        if (sel) sel.value = '';
        const input = dt.container.querySelector(`.filter-text[data-filter="${key}"]`);
        if (input) input.value = '';
    }
    dt.page = 1;
    dt.clearSelection();
    dt.load();
}

function renderChips(dt) {
    const chipsContainer = dt.container.querySelector('.filter-chips');
    const chipsList = dt.container.querySelector('.filter-chips-list');
    if (!chipsContainer || !chipsList) return;
    const chips = [];
    const defaults = dt.config.defaultFilters || {};
    const filters = dt.config.filters || [];
    if (dt.searchQuery) {
        chips.push({ key: '_search', label: 'Search', value: dt.searchQuery });
    }
    for (const [key, value] of Object.entries(dt.filterValues)) {
        if (!value || key === '_period') continue;
        if (defaults[key] === value) continue;
        if (key === 'fecha_to' && dt.filterValues.fecha_from) continue;
        let label = key;
        let displayValue = value;
        const filterCfg = filters.find(f => f.key === key);
        if (filterCfg) {
            label = filterCfg.label;
            if (dt._asyncOptionLabels[key] && dt._asyncOptionLabels[key][value]) {
                displayValue = dt._asyncOptionLabels[key][value];
            }
        } else if (key === 'periodo') {
            label = 'Per\u00edodo';
        } else if (key === 'fecha_from') {
            label = 'Range';
            const from = dt.filterValues.fecha_from || '';
            const to = dt.filterValues.fecha_to || '';
            displayValue = from + (to ? ' \u2013 ' + to : '+');
        }
        chips.push({ key, label, value: displayValue });
    }
    if (chips.length === 0) {
        chipsContainer.classList.add('hidden');
        return;
    }
    chipsContainer.classList.remove('hidden');
    chipsList.innerHTML = chips.map(c =>
        `<span class="filter-chip">
            <span class="filter-chip-label">${escapeHtml(c.label)}:</span>
            ${escapeHtml(c.value)}
            <button class="chip-remove" data-chip-key="${c.key}" type="button" aria-label="Remove filter ${escapeHtml(c.label)}">&times;</button>
        </span>`
    ).join('');
    chipsList.querySelectorAll('.chip-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFilter(dt, btn.dataset.chipKey);
        });
    });
    const countBadge = dt.container.querySelector('.filter-toggle-count');
    if (countBadge) {
        const count = dt._activeFilterCount();
        countBadge.textContent = count > 0 ? count : '';
    }
}

Object.assign(AdminApp, { loadAsyncFilters, clearAllFilters, removeFilter, renderChips });

})(window.AdminApp);
(function(AdminApp) {
const { api, Toast, escapeHtml, formatCurrency, formatDate, statusBadge, computeEstado } = AdminApp;
class DataTable {
    constructor(container, config) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.config = config;
        this.data = [];
        this.sortField = null;
        this.sortDir = 'asc';
        this.page = 1;
        this.perPage = 200;
        this.searchQuery = '';
        this.filterValues = {};
        this.selected = new Set();
        this._asyncOptionLabels = {};

        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams.entries()) {
            if (key === 'page') { this.page = parseInt(value, 10) || 1; }
            else if (key === 'per_page') { this.perPage = parseInt(value, 10); }
            else if (key === 'search') { this.searchQuery = value; }
            else { this.filterValues[key] = value; }
        }

        this.container.innerHTML = AdminApp.renderFilterBar(this.config, this.filterValues, this.searchQuery, this.perPage);
        AdminApp.bindFilterEvents(this.container, this);
        AdminApp.loadAsyncFilters(this.container, this);
        AdminApp.setupPopupDismissHandlers(this.container);
        this.load();
    }
    _hasFilters() {
        return (this.config.filters && this.config.filters.length > 0) || this.config.showPeriodFilter;
    }
    _isDefaultFilter(key) {
        return this.config.defaultFilters && key in this.config.defaultFilters;
    }
    _activeFilterCount() {
        let count = 0;
        for (const [k, v] of Object.entries(this.filterValues)) {
            if (v && k !== '_period' && !this._isDefaultFilter(k)) count++;
        }
        return count;
    }

    _clearAllFilters() { AdminApp.clearAllFilters(this); }
    _removeFilter(key) { AdminApp.removeFilter(this, key); }
    _renderChips() { AdminApp.renderChips(this); }
    _buildParams() {
        const params = new URLSearchParams();
        params.set('page', this.page);
        params.set('per_page', this.perPage);
        if (this.searchQuery) params.set('search', this.searchQuery);
        if (this.sortField) { params.set('sort', this.sortField); params.set('order', this.sortDir); }
        Object.entries(this.filterValues).forEach(([k, v]) => {
            if (v && k !== '_period') params.set(k, v);
        });
        if (this.config.defaultFilters) {
            Object.entries(this.config.defaultFilters).forEach(([k, v]) => {
                if (v) params.set(k, v);
            });
        }
        return params;
    }

    _syncUrl() {
        const params = this._buildParams();
        params.delete('page');
        params.delete('per_page');
        const qs = params.toString();
        const url = new URL(window.location);
        url.search = qs ? '?' + qs : '';
        window.history.replaceState(null, '', url);
    }

    async load() {
        const params = this._buildParams();
        try {
            const result = await api.get(`${this.config.apiPath}?${params}`);
            this.data = result.data || [];
            this.total = result.total || 0;
            this.totals = result.totals || null;
            this.renderTable();
            this._renderChips();
            this._syncUrl();
            if (this.config.onDataLoaded) this.config.onDataLoaded(this.data, this);
        } catch (e) {
            Toast.show(e.message, 'error');
        }
    }

    renderTable() {
        const thead = this.container.querySelector('thead tr');
        const tbody = this.container.querySelector('tbody');
        const tfoot = this.container.querySelector('tfoot');
        const cols = this.data.length > 0
            ? this.config.columns.filter(col => this.data.some(row => row[col.key] != null && row[col.key] !== ''))
            : this.config.columns;
        const showCb = this.config.showCheckboxes;
        const allChecked = this.data.length > 0 && this.data.every(r => this.selected.has(r.id));

        thead.innerHTML = this._renderHeader(cols, showCb, allChecked);
        this._bindHeaderEvents(thead, showCb);
        tbody.innerHTML = this._renderBody(cols, showCb);
        this._bindBodyEvents(thead, tbody, showCb);
        AdminApp.bindActionPopupEvents(tbody, this);
        tfoot.innerHTML = this._renderFooter(cols, showCb);
        this.renderPagination();
        this.updateSelectionBar();
    }

    _renderHeader(cols, showCb, allChecked) {
        const cbHeader = showCb ? `<th class="col-checkbox"><input type="checkbox" class="select-all-cb" ${allChecked ? 'checked' : ''}></th>` : '';
        return cbHeader + cols.map(col => {
            const sorted = this.sortField === col.key;
            const icon = sorted ? (this.sortDir === 'asc' ? '\u25B2' : '\u25BC') : '\u25B4';
            const typeCls = col.type ? `col-${col.type}` : 'col-text';
            const sortedCls = sorted ? ' sorted' : '';
            const widthAttr = col.width ? ` style="width:${col.width}"` : '';
            return `<th data-sort="${col.key}" class="${typeCls}${sortedCls}"${widthAttr}>
                ${col.label} <span class="sort-icon">${icon}</span>
            </th>`;
        }).join('') + (this.config.readOnly ? '' : '<th class="col-actions"Actions</th>');
    }

    _bindHeaderEvents(thead, showCb) {
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
        if (showCb) {
            const selectAllCb = thead.querySelector('.select-all-cb');
            if (selectAllCb) {
                selectAllCb.addEventListener('change', () => {
                    if (selectAllCb.checked) {
                        this.data.forEach(r => this.selected.add(r.id));
                    } else {
                        this.selected.clear();
                    }
                    this.renderTable();
                    this._fireSelectionChange();
                });
            }
        }
    }

    _renderBody(cols, showCb) {
        if (this.data.length === 0) {
            const colSpan = cols.length + 1 + (showCb ? 1 : 0);
            return `<tr><td colspan="${colSpan}" class="empty-state">No records found</td></tr>`;
        }
        return this.data.map(row => {
            const id = row.id;
            const isSelected = this.selected.has(id);
            const cbTd = showCb ? `<td class="col-checkbox"><input type="checkbox" class="row-cb" data-id="${escapeHtml(id)}" ${isSelected ? 'checked' : ''}></td>` : '';
            return `<tr data-id="${escapeHtml(id)}" class="clickable-row${isSelected ? ' selected' : ''}">
                ${cbTd}
                ${cols.map(col => this._renderCell(col, row)).join('')}
                ${this.config.readOnly ? '' : AdminApp.renderActionPopup(row, this.config)}
            </tr>`;
        }).join('');
    }

    _renderCell(col, row) {
        let val = row[col.key];
        let cls = '';
        if (col.render) {
            val = col.render(val, row);
            return `<td class="${col.type ? `col-${col.type}` : 'col-custom'}">${val}</td>`;
        }
        if (col.type === 'multiline') {
            const primary = escapeHtml(val);
            const secondary = col.subKey ? escapeHtml(row[col.subKey]) : '';
            val = `<div class="cell-primary">${primary || '-'}</div>${secondary ? `<div class="cell-secondary">${secondary}</div>` : ''}`;
            return `<td class="col-multiline">${val}</td>`;
        }
        if (col.type === 'currency') { val = formatCurrency(val); cls = 'numeric'; }
        else if (col.type === 'date') { val = formatDate(val); cls = 'date'; }
        else if (col.type === 'status') {
            if ((this.config.entity === 'contabilidad' || this.config.entity === 'facturacion' || this.config.entity === 'alquileres' || this.config.entity === 'costes') && col.key === 'estado') val = computeEstado(row);
            val = statusBadge(val, this.config.entity);
        }
        else if (col.type === 'tags' && Array.isArray(val)) { val = val.map(t => `<span class="badge badge-blue">${escapeHtml(t)}</span>`).join(' '); }
        else if (col.type === 'badge_count') { val = val > 0 ? `<span class="badge badge-green">${val} ${col.suffix || ''}</span>` : '-'; }
        else if (col.type === 'boolean') { val = val ? `<span class="badge badge-blue">${col.trueLabel || 'Si'}</span>` : ''; }
        else if (col.type === 'thumbnail') { val = val ? `<img class="table-thumbnail" src="${escapeHtml(val)}" alt="" loading="lazy">` : '<span class="table-thumbnail-empty">-</span>'; cls = 'thumbnail-cell'; }
        else { val = escapeHtml(val); }
        const colTypeCls = col.type ? `col-${col.type}` : 'col-text';
        const tdCls = cls ? `${cls} ${colTypeCls}` : colTypeCls;
        return `<td class="${tdCls}">${val || '-'}</td>`;
    }

    _bindBodyEvents(thead, tbody, showCb) {
        if (showCb) {
            tbody.querySelectorAll('.row-cb').forEach(cb => {
                cb.addEventListener('click', (e) => { e.stopPropagation(); });
                cb.addEventListener('change', () => {
                    const rowId = cb.dataset.id;
                    if (cb.checked) this.selected.add(rowId);
                    else this.selected.delete(rowId);
                    this.updateSelectionBar();
                    this._fireSelectionChange();
                    const tr = cb.closest('tr');
                    if (tr) tr.classList.toggle('selected', cb.checked);
                    const selectAllCb = thead.querySelector('.select-all-cb');
                    if (selectAllCb) selectAllCb.checked = this.data.every(r => this.selected.has(r.id));
                });
            });
        }
        tbody.querySelectorAll('tr.clickable-row').forEach(tr => {
            tr.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('input[type="checkbox"]')) return;
                const id = tr.dataset.id;
                const row = this.data.find(r => r.id === id);
                if (row && this.config.onRowClick) this.config.onRowClick(row);
            });
        });
    }

    _renderFooter(cols, showCb) {
        if (!this.totals || this.data.length === 0) return '';
        const cbTd = showCb ? '<td class="col-checkbox"></td>' : '';
        return `<tr>${cbTd}${cols.map(col => {
            const colTypeCls = col.type ? `col-${col.type}` : 'col-text';
            if (col.type === 'currency' && this.totals[col.key] != null) {
                return `<td class="numeric ${colTypeCls}">${formatCurrency(this.totals[col.key])}</td>`;
            }
            if (col === cols[0]) return `<td class="${colTypeCls}">Total</td>`;
            return `<td class="${colTypeCls}"></td>`;
        }).join('')}${this.config.readOnly ? '' : '<td class="actions col-actions"></td>'}</tr>`;
    }

    updateSelectionBar() {
        const bar = this.container.querySelector('.selection-bar');
        if (!bar) return;
        if (this.selected.size > 0) {
            bar.classList.remove('hidden');
            bar.querySelector('.selection-count').textContent = `${this.selected.size} selected${this.selected.size !== 1 ? 's' : ''}`;
        } else {
            bar.classList.add('hidden');
        }
    }

    _fireSelectionChange() {
        if (this.config.onSelectionChange) {
            this.config.onSelectionChange(this.getSelectedRows());
        }
    }

    getSelectedRows() { return this.data.filter(r => this.selected.has(r.id)); }
    getAllSelectedIds() { return [...this.selected]; }

    clearSelection() {
        this.selected.clear();
        this.updateSelectionBar();
        this._fireSelectionChange();
    }

    sortLocally() {
        const field = this.sortField;
        const dir = this.sortDir === 'asc' ? 1 : -1;
        this.data.sort((a, b) => {
            let va = a[field], vb = b[field];
            if (va == null) return 1;
            if (vb == null) return -1;
            if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
            return String(va).localeCompare(String(vb), 'en') * dir;
        });
    }

    renderPagination() {
        const info = this.container.querySelector('.row-count');
        const controls = this.container.querySelector('.pagination-controls');
        const totalPages = this.perPage === 0 ? 1 : Math.max(1, Math.ceil(this.total / this.perPage));
        info.textContent = `${this.total} record${this.total !== 1 ? 's' : ''}`;
        controls.innerHTML = `
            <button ${this.page <= 1 ? 'disabled' : ''} data-page="${this.page - 1}">\u2190 Prev</button>
            <span class="current-page">${this.page} / ${totalPages}</span>
            <button ${this.page >= totalPages ? 'disabled' : ''} data-page="${this.page + 1}">Next \u2192</button>
        `;
        controls.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.page = parseInt(btn.dataset.page, 10);
                this.load();
            });
        });
    }
}

Object.assign(AdminApp, { DataTable });

})(window.AdminApp);
(function(AdminApp) {

const { api, escapeHtml } = AdminApp;

class FormPanel {
    constructor(config) {
        this.config = config;
        this.overlay = null;
        this.panel = null;
        this._closing = false;
    }

    open(data = null) {
        if (this.panel || this.overlay) {
            if (this.overlay && this.overlay.parentNode) this.overlay.remove();
            if (this.panel && this.panel.parentNode) this.panel.remove();
            this.overlay = null;
            this.panel = null;
            this._closing = false;
        }
        const isEdit = data != null;
        const title = isEdit ? `Edit ${this.config.title}` : `New ${this.config.title}`;

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
                <button class="btn btn-secondary" data-action="cancel">Cancel</button>
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

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.overlay.classList.add('open');
                this.panel.classList.add('open');
            });
        });

        this.panel.querySelectorAll('.async-select-wrap').forEach(wrap => {
            const url = wrap.dataset.url;
            const fieldKey = wrap.dataset.field;
            const sel = wrap.querySelector('select');
            const search = wrap.querySelector('.async-select-search');
            const currentLabel = wrap.querySelector('.async-select-current');
            let allOptions = [];
            const currentVal = data ? (data[fieldKey] || '') : '';

            const fieldCfg = this.config.fields.find(f => f.key === fieldKey);
            const valKey = fieldCfg?.optionValue;
            const lblKey = fieldCfg?.optionLabel;

            const renderOption = (o, selectedVal) => {
                const isObj = valKey && lblKey && typeof o === 'object';
                const v = isObj ? o[valKey] : o;
                const l = isObj ? o[lblKey] : o;
                return `<option value="${escapeHtml(String(v))}" ${String(v) === String(selectedVal) ? 'selected' : ''}>${escapeHtml(String(l))}</option>`;
            };

            if (url) {
                (async () => {
                    try {
                        const options = await api.get(url);
                        allOptions = options;
                        sel.innerHTML = '<option value="">-- None --</option>' +
                            options.map(o => renderOption(o, currentVal)).join('');
                        if (currentVal) sel.value = currentVal;
                    } catch {
                        sel.innerHTML = '<option value="">Error loading</option>';
                    }
                })();
            }

            search.addEventListener('input', () => {
                const q = search.value.toLowerCase();
                const filtered = q ? allOptions.filter(o => {
                    const text = (valKey && lblKey && typeof o === 'object') ? String(o[lblKey]) : String(o);
                    return text.toLowerCase().includes(q);
                }) : allOptions;
                const selVal = sel.value;
                sel.innerHTML = '<option value="">-- None --</option>' +
                    filtered.map(o => renderOption(o, selVal)).join('');
            });

            sel.addEventListener('change', () => {
                if (currentLabel) currentLabel.innerHTML = sel.value ? `Selected: <strong>${escapeHtml(sel.value)}</strong>` : '';
            });
        });

        const first = this.panel.querySelector('input, select, textarea');
        if (first) setTimeout(() => first.focus(), 400);
    }

    renderField(field, data) {
        const val = data ? (data[field.key] ?? '') : (field.default ?? '');
        const displayVal = Array.isArray(val) ? val.join(', ') : val;

        if (field.type === 'asyncSelect') {
            return `<div class="form-group">
                <label>${field.label}</label>
                <div class="async-select-wrap" data-field="${field.key}" data-url="${field.asyncOptions || ''}">
                    <input type="text" class="async-select-search" placeholder="Filter..." autocomplete="off">
                    <select name="${field.key}" size="6" class="async-select-list">
                        <option value="">-- Loading... --</option>
                    </select>
                    ${displayVal ? `<div class="async-select-current">Selected: <strong>${escapeHtml(displayVal)}</strong></div>` : ''}
                </div>
            </div>`;
        }

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

        const inputType = (field.type === 'number' || field.type === 'integer') ? 'number' : field.type === 'date' ? 'date' : 'text';
        const step = field.type === 'integer' ? 'step="1"' : field.type === 'number' ? 'step="0.01"' : '';
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

        if (this.config.hiddenFields) {
            Object.entries(this.config.hiddenFields).forEach(([k, v]) => {
                formData[k] = v;
            });
        }

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

Object.assign(AdminApp, { FormPanel });

})(window.AdminApp);
(function(AdminApp) {

const { openPanel, closePanel, api, timeAgo, escapeHtml } = AdminApp;

class HistoryPanel {
    constructor() {
        this.overlay = null;
        this.panel = null;
        this._closing = false;
    }

    async open(entityType, entityId) {
        openPanel(this, 'Change history');

        try {
            const entries = await api.get(`/audit/${entityType}/${entityId}`);
            this.renderTimeline(entries);
        } catch {
            this.panel.querySelector('.panel-body').innerHTML =
                `<div class="empty-state">No history available</div>`;
        }
    }

    renderTimeline(entries) {
        if (!this.panel) return;
        const body = this.panel.querySelector('.panel-body');
        if (!entries || entries.length === 0) {
            body.innerHTML = '<div class="empty-state">No changes recorded</div>';
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
            return '<div class="timeline-diff"><span class="diff-new">Record created</span></div>';
        }
        if (entry.action === 'delete') {
            return '<div class="timeline-diff"><span class="diff-old">Record deleted</span></div>';
        }
        if (!entry.changed_fields || entry.changed_fields.length === 0) {
            return '<div class="timeline-diff">Fields updated</div>';
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

Object.assign(AdminApp, { HistoryPanel });

})(window.AdminApp);
(function(AdminApp) {

const GRACE_DAYS = 30;
const SEVERE_OVERDUE_DAYS = 60;
const MS_PER_DAY = 86400000;

const PAYMENT_STATUS_OPTIONS = ['Unpaid', 'Partial', 'Paid'];
const PAYMENT_STATUS_AUTO_OPTIONS = ['Auto', 'Unpaid', 'Partial', 'Paid'];
const CONTRACT_STATUS_OPTIONS = ['Pending', 'Active', 'Ended', 'Suspended'];
const PROPERTY_STATUS_OPTIONS = ['Vacant', 'Occupied', 'Rented', 'Under Renovation'];
const DEPOSIT_STATUS_OPTIONS = ['Pending', 'Paid', 'Returned', 'Official body'];
const ISSUE_STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];
const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];
const EXPENSE_CATEGORY_OPTIONS = ['Council Tax', 'Insurance', 'Waste', 'Service Charge', 'Repairs', 'Utilities', 'Management', 'Legal', 'Tax', 'Other'];
const INVOICE_EXPENSE_CATEGORY_OPTIONS = ['Council Tax', 'Service Charge', 'Insurance', 'Maintenance', 'Utilities', 'Mortgage', 'Tax', 'Other'];
const DOCUMENT_TYPE_OPTIONS = ['Invoice', 'Transfer', 'Receipt'];
const PAYMENT_METHOD_OPTIONS = ['', 'transfer', 'bank transfer', 'cash', 'direct debit'];
const CONTACT_TYPE_OPTIONS = ['individual', 'company', 'government'];
const LEAD_STATUS_OPTIONS = ['New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation', 'Won', 'Lost', 'Archived'];
const LEAD_INTEREST_OPTIONS = ['rental', 'purchase', 'investment', 'other'];
const LEAD_SOURCE_OPTIONS = ['direct', 'web', 'referral', 'portal', 'phone', 'email', 'other'];
const BATCH_STATUS_OPTIONS = ['Pending', 'Sent', 'Completed', 'Returned'];
const CONTACT_ASYNC_SELECT = { type: 'asyncSelect', asyncOptions: '/contacts/names', optionValue: 'name', optionLabel: 'name' };

const ENTITY_CONFIGS = {

    properties: {
        title: 'Property',
        entity: 'property',
        apiPath: '/properties',
        exportPath: '/export/properties',
        detailEntity: 'property',
        historyEntity: 'property',
        columns: [
            { key: 'thumbnail_url', label: 'Photo', type: 'thumbnail' },
            { key: 'property_name', label: 'Name' },
            { key: 'address', label: 'Address' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'contract_ref', label: 'Contract' },
            { key: 'rent', label: 'Rent', type: 'currency' },
            { key: 'start_date', label: 'Start', type: 'date' },
            { key: 'end_date', label: 'End', type: 'date' },
            { key: 'tags', label: 'Tags', type: 'tags' },
        ],
        filters: [
            { key: 'status', label: 'Status', options: PROPERTY_STATUS_OPTIONS },
        ],
        formFields: [
            { key: 'property_name', label: 'Property name', required: true, placeholder: 'e.g. 14 King Street Flat 3B' },
            { key: 'address', label: 'Address', required: true, placeholder: 'Full address' },
            { key: 'contract_ref', label: 'Contract ref', placeholder: 'Contract reference' },
            { key: 'status', label: 'Status', type: 'select', options: PROPERTY_STATUS_OPTIONS, default: 'Vacant' },
            { key: 'rent', label: 'Monthly rent', type: 'number', placeholder: '0.00' },
            { key: 'start_date', label: 'Contract start', type: 'date' },
            { key: 'end_date', label: 'Contract end', type: 'date' },
            { key: 'tags', label: 'Tags (comma separated)', placeholder: 'tag1, tag2' },
            { key: 'image_folder', label: 'Image folder', placeholder: 'e.g. 42 Royal Crescent' },
        ],
        tableOptions: { showCheckboxes: true },
        deleteConfirm: (row) => `Delete "${row.property_name}"? This action cannot be undone.`,
    },

    contracts: {
        title: 'Contract',
        entity: 'contract',
        apiPath: '/contracts',
        detailEntity: 'contract',
        historyEntity: 'contracts',
        columns: [
            { key: 'contract_ref', label: 'Contract' },
            { key: 'property_name', label: 'Property' },
            { key: 'tenant_name', label: 'Tenant' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'rent', label: 'Rent', type: 'currency' },
            { key: 'start_date', label: 'Start', type: 'date' },
            { key: 'end_date', label: 'End', type: 'date' },
            { key: 'doc_count', label: 'Docs', type: 'badge_count', suffix: 'docs' },
            { key: 'tags', label: 'Tags', type: 'tags' },
        ],
        filters: [
            { key: 'status', label: 'Status', options: CONTRACT_STATUS_OPTIONS },
            { key: 'property_name', label: 'Property', asyncOptions: '/properties/names' },
            { key: 'tenant_name', label: 'Tenant', asyncOptions: '/tenants/names' },
        ],
        formFields: [
            { key: 'contract_ref', label: 'Contract ref', required: true, placeholder: 'e.g. 14 KING ST - JOHNSON' },
            { key: 'property_name', label: 'Property', required: true, placeholder: 'Property name' },
            { key: 'address', label: 'Address', placeholder: 'Full address' },
            { key: 'tenant_name', label: 'Tenant', placeholder: 'Tenant name' },
            { key: 'status', label: 'Status', type: 'select', options: CONTRACT_STATUS_OPTIONS, default: 'Pending' },
            { key: 'rent', label: 'Monthly rent', type: 'number', placeholder: '0.00' },
            { key: 'total_value', label: 'Total contract value', type: 'number', placeholder: '0.00' },
            { key: 'start_date', label: 'Start date', type: 'date' },
            { key: 'end_date', label: 'End date', type: 'date' },
            { key: 'tags', label: 'Tags (comma separated)', placeholder: 'tag1, tag2' },
        ],
        tableOptions: {},
        deleteConfirm: (row) => `Delete "${row.contract_ref}"? This action cannot be undone.`,
    },

    rentals: {
        title: 'Rental',
        entity: 'rentals',
        apiPath: '/invoices',
        exportPath: '/export/invoices',
        detailEntity: 'invoice',
        historyEntity: 'invoices',
        columns: [
            { key: 'invoice_number', label: 'Inv.#' },
            { key: 'invoice_date', label: 'Date', type: 'date' },
            { key: 'property_name', label: 'Property', type: 'multiline', subKey: 'property_address' },
            { key: 'contract_ref', label: 'Contract', type: 'multiline', subKey: 'contract_parties' },
            { key: 'amount', label: 'Net', type: 'currency' },
            { key: 'vat', label: 'Tax', type: 'currency' },
            { key: 'retention', label: 'Retention', type: 'currency' },
            { key: 'total', label: 'Total', type: 'currency' },
            { key: 'paid', label: 'Paid', type: 'currency' },
            { key: 'status', label: 'Status', type: 'status' },
        ],
        filters: [
            { key: 'status', label: 'Status', options: PAYMENT_STATUS_OPTIONS },
            { key: 'property_name', label: 'Property', asyncOptions: '/properties/names' },
        ],
        formFields: [
            { key: 'document_type', label: 'Document type', type: 'select', options: DOCUMENT_TYPE_OPTIONS, default: 'Receipt' },
            { key: 'reference', label: 'Reference', required: true, placeholder: 'ALQ-2026-001' },
            { key: 'invoice_number', label: 'Invoice no.', type: 'number', placeholder: 'Auto if empty' },
            { key: 'description', label: 'Description', required: true, placeholder: 'Monthly rent' },
            { key: 'contract_ref', label: 'Contract', required: true, placeholder: 'Contract reference' },
            { key: 'property_name', label: 'Property', required: true, placeholder: 'Property name' },
            { key: 'payer', label: 'Payer', required: true, ...CONTACT_ASYNC_SELECT },
            { key: 'payee', label: 'Payee', required: true, ...CONTACT_ASYNC_SELECT },
            { key: 'status', label: 'Status', type: 'select', options: PAYMENT_STATUS_AUTO_OPTIONS, default: 'Auto' },
            { key: 'amount', label: 'Net', type: 'number', required: true, placeholder: '0.00' },
            { key: 'vat', label: 'Tax/VAT', type: 'number', placeholder: '0.00' },
            { key: 'retention', label: 'Retention', type: 'number', placeholder: '0.00' },
            { key: 'total', label: 'Total', type: 'number', required: true, placeholder: '0.00' },
            { key: 'paid', label: 'Paid', type: 'number', placeholder: '0.00' },
            { key: 'invoice_date', label: 'Invoice date', required: true, placeholder: 'YYYY-MM-DD' },
            { key: 'payment_date', label: 'Payment date', type: 'date' },
            { key: 'payment_method', label: 'Payment method', type: 'select', options: PAYMENT_METHOD_OPTIONS },
            { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
            { key: 'payer_account', label: 'Payer account', placeholder: 'IBAN' },
        ],
        tableOptions: {
            showPeriodFilter: true,
            showCheckboxes: true,
            defaultFilters: { type: 'income' },
            hasPdf: true,
        },
        hiddenFields: { type: 'income' },
        onSubmitTransform: (data) => { if (data.status === 'Auto') delete data.status; return data; },
        deleteConfirm: (row) => `Delete "${row.reference}"? This action cannot be undone.`,
    },

    billing: {
        title: 'Invoice',
        entity: 'billing',
        apiPath: '/invoices',
        exportPath: '/export/invoices',
        detailEntity: 'invoice',
        historyEntity: 'invoices',
        columns: [
            { key: 'invoice_number', label: 'Inv.#' },
            { key: 'document_type', label: 'Type' },
            { key: 'reference', label: 'Reference' },
            { key: 'description', label: 'Description' },
            { key: 'property_name', label: 'Property' },
            { key: 'payer', label: 'Payer' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'total', label: 'Total', type: 'currency' },
            { key: 'paid', label: 'Paid', type: 'currency' },
            { key: 'invoice_date', label: 'Date', type: 'date' },
            { key: 'collection_date', label: 'Coll. date', type: 'date' },
        ],
        filters: [
            { key: 'document_type', label: 'Type', options: DOCUMENT_TYPE_OPTIONS },
            { key: 'status', label: 'Status', options: PAYMENT_STATUS_OPTIONS },
            { key: 'owner_id', label: 'Owner', asyncOptions: '/invoices/owners', optionValue: 'id', optionLabel: 'name' },
            { key: 'payee_id', label: 'Payee', asyncOptions: '/contacts/names', optionValue: 'id', optionLabel: 'name' },
            { key: 'property_name', label: 'Property', asyncOptions: '/properties/names' },
        ],
        formFields: [
            { key: 'document_type', label: 'Document type', type: 'select', options: DOCUMENT_TYPE_OPTIONS, default: 'Invoice' },
            { key: 'reference', label: 'Reference', required: true, placeholder: 'INV-2026-001' },
            { key: 'invoice_number', label: 'Invoice no.', type: 'number', placeholder: 'Auto if empty' },
            { key: 'description', label: 'Description', required: true, placeholder: 'Invoice description' },
            { key: 'contract_ref', label: 'Contract', required: true, placeholder: 'Contract reference' },
            { key: 'property_name', label: 'Property', required: true, placeholder: 'Property name' },
            { key: 'payer', label: 'Payer', required: true, ...CONTACT_ASYNC_SELECT },
            { key: 'payee', label: 'Payee', required: true, ...CONTACT_ASYNC_SELECT },
            { key: 'status', label: 'Status', type: 'select', options: PAYMENT_STATUS_AUTO_OPTIONS, default: 'Auto' },
            { key: 'amount', label: 'Net', type: 'number', placeholder: '0.00' },
            { key: 'vat', label: 'VAT', type: 'number', placeholder: '0.00' },
            { key: 'retention', label: 'Retention', type: 'number', placeholder: '0.00' },
            { key: 'total', label: 'Total', type: 'number', required: true, placeholder: '0.00' },
            { key: 'paid', label: 'Paid', type: 'number', placeholder: '0.00' },
            { key: 'invoice_date', label: 'Invoice date', required: true, placeholder: 'YYYY-MM-DD' },
            { key: 'payment_date', label: 'Payment date', type: 'date' },
            { key: 'collection_date', label: 'Collection date', type: 'date' },
            { key: 'payment_method', label: 'Payment method', type: 'select', options: PAYMENT_METHOD_OPTIONS },
            { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
            { key: 'discount', label: 'Discount', type: 'number', placeholder: '0.00' },
            { key: 'discount_pct', label: 'Discount %', type: 'number', placeholder: '0.00' },
            { key: 'payer_account', label: 'Payer account', placeholder: 'IBAN' },
        ],
        tableOptions: {
            showPeriodFilter: true,
            showCheckboxes: true,
            defaultFilters: { type: 'income' },
            hasPdf: true,
        },
        hiddenFields: { type: 'income' },
        onSubmitTransform: (data) => { if (data.status === 'Auto') delete data.status; return data; },
        deleteConfirm: (row) => `Delete "${row.reference}"? This action cannot be undone.`,
    },

    expenses: {
        title: 'Expense',
        entity: 'expenses',
        apiPath: '/invoices',
        exportPath: '/export/invoices',
        detailEntity: 'invoice',
        historyEntity: 'invoices',
        columns: [
            { key: 'invoice_number', label: 'Inv.#' },
            { key: 'reference', label: 'Reference' },
            { key: 'description', label: 'Description' },
            { key: 'property_name', label: 'Property' },
            { key: 'expense_category', label: 'Category' },
            { key: 'payee', label: 'Supplier' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'total', label: 'Total', type: 'currency' },
            { key: 'paid', label: 'Paid', type: 'currency' },
            { key: 'invoice_date', label: 'Date', type: 'date' },
        ],
        filters: [
            { key: 'expense_category', label: 'Category', options: EXPENSE_CATEGORY_OPTIONS },
            { key: 'status', label: 'Status', options: PAYMENT_STATUS_OPTIONS },
            { key: 'property_name', label: 'Property', asyncOptions: '/properties/names' },
        ],
        formFields: [
            { key: 'reference', label: 'Reference', required: true, placeholder: 'EXP-2026-001' },
            { key: 'invoice_number', label: 'Invoice no.', type: 'number', placeholder: 'Auto if empty' },
            { key: 'description', label: 'Description', required: true, placeholder: 'Expense description' },
            { key: 'property_name', label: 'Property', required: true, placeholder: 'Property name' },
            { key: 'expense_category', label: 'Category', type: 'select', options: EXPENSE_CATEGORY_OPTIONS, default: 'Other' },
            { key: 'payer', label: 'Payer', required: true, ...CONTACT_ASYNC_SELECT },
            { key: 'payee', label: 'Payee', required: true, ...CONTACT_ASYNC_SELECT },
            { key: 'contract_ref', label: 'Contract', placeholder: 'Contract reference (optional)' },
            { key: 'status', label: 'Status', type: 'select', options: PAYMENT_STATUS_AUTO_OPTIONS, default: 'Auto' },
            { key: 'total', label: 'Total', type: 'number', required: true, placeholder: '0.00' },
            { key: 'paid', label: 'Paid', type: 'number', placeholder: '0.00' },
            { key: 'vat', label: 'VAT', type: 'number', placeholder: '0.00' },
            { key: 'invoice_date', label: 'Date', required: true, placeholder: 'YYYY-MM-DD' },
            { key: 'payment_date', label: 'Payment date', type: 'date' },
            { key: 'payment_method', label: 'Payment method', type: 'select', options: PAYMENT_METHOD_OPTIONS },
            { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
        ],
        tableOptions: {
            showPeriodFilter: true,
            defaultFilters: { type: 'expense' },
            hasPdf: true,
        },
        hiddenFields: { type: 'expense' },
        onSubmitTransform: (data) => { if (data.status === 'Auto') delete data.status; return data; },
        deleteConfirm: (row) => `Delete "${row.reference}"? This action cannot be undone.`,
    },

    invoices: {
        title: 'Invoice',
        entity: 'invoices',
        apiPath: '/invoices',
        exportPath: '/export/invoices',
        detailEntity: 'invoice',
        historyEntity: 'invoices',
        columns: [
            { key: 'invoice_number', label: 'Inv.#' },
            { key: 'reference', label: 'Reference' },
            { key: 'description', label: 'Description' },
            { key: 'property_name', label: 'Property' },
            { key: 'payer', label: 'Payer' },
            { key: 'payee', label: 'Payee' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'total', label: 'Total', type: 'currency' },
            { key: 'paid', label: 'Paid', type: 'currency' },
            { key: 'type', label: 'Type', type: 'status' },
            { key: 'expense_category', label: 'Category' },
            { key: 'invoice_date', label: 'Date', type: 'date' },
        ],
        filters: [
            { key: 'status', label: 'Status', options: PAYMENT_STATUS_OPTIONS },
            { key: 'type', label: 'Type', options: ['income', 'expense'] },
            { key: 'expense_category', label: 'Category', options: INVOICE_EXPENSE_CATEGORY_OPTIONS },
            { key: 'payee_id', label: 'Payee', asyncOptions: '/contacts/names', optionValue: 'id', optionLabel: 'name' },
            { key: 'property_name', label: 'Property', asyncOptions: '/properties/names' },
        ],
        formFields: [
            { key: 'document_type', label: 'Document type', type: 'select', options: DOCUMENT_TYPE_OPTIONS, default: 'Invoice' },
            { key: 'reference', label: 'Reference', required: true, placeholder: 'INV-2026-001' },
            { key: 'invoice_number', label: 'Invoice no.', type: 'number', placeholder: 'Auto if empty' },
            { key: 'description', label: 'Description', required: true, placeholder: 'Invoice description' },
            { key: 'contract_ref', label: 'Contract', required: true, placeholder: 'Contract reference' },
            { key: 'property_name', label: 'Property', required: true, placeholder: 'Property name' },
            { key: 'payer', label: 'Payer', required: true, ...CONTACT_ASYNC_SELECT },
            { key: 'payee', label: 'Payee', required: true, ...CONTACT_ASYNC_SELECT },
            { key: 'status', label: 'Status', type: 'select', options: PAYMENT_STATUS_AUTO_OPTIONS, default: 'Auto' },
            { key: 'type', label: 'Type', type: 'select', options: ['income', 'expense'], default: 'income' },
            { key: 'expense_category', label: 'Expense category', type: 'select', options: ['', ...INVOICE_EXPENSE_CATEGORY_OPTIONS] },
            { key: 'total', label: 'Total', type: 'number', required: true, placeholder: '0.00' },
            { key: 'paid', label: 'Paid', type: 'number', placeholder: '0.00' },
            { key: 'vat', label: 'VAT', type: 'number', placeholder: '0.00' },
            { key: 'invoice_date', label: 'Invoice date', required: true, placeholder: 'YYYY-MM-DD' },
            { key: 'payment_date', label: 'Payment date', type: 'date' },
            { key: 'payment_method', label: 'Payment method', type: 'select', options: PAYMENT_METHOD_OPTIONS },
            { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
            { key: 'discount', label: 'Discount', type: 'number', placeholder: '0.00' },
            { key: 'discount_pct', label: 'Discount %', type: 'number', placeholder: '0.00' },
            { key: 'payer_account', label: 'Payer account', placeholder: 'IBAN' },
        ],
        tableOptions: {
            showPeriodFilter: true,
            hasPdf: true,
        },
        onSubmitTransform: (data) => { if (data.status === 'Auto') delete data.status; return data; },
        deleteConfirm: (row) => `Delete "${row.reference}"? This action cannot be undone.`,
    },

    deposits: {
        title: 'Deposit',
        entity: 'deposit',
        apiPath: '/deposits',
        detailEntity: 'deposit',
        historyEntity: 'deposits',
        columns: [
            { key: 'deposit_date', label: 'Date', type: 'date' },
            { key: 'property_name', label: 'Property' },
            { key: 'payer', label: 'Payer' },
            { key: 'payee', label: 'Payee' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'amount', label: 'Amount', type: 'currency' },
            { key: 'is_owner', label: 'Owner', type: 'boolean', trueLabel: 'Owner' },
            { key: 'created_at', label: 'Created', type: 'date' },
        ],
        filters: [
            { key: 'status', label: 'Status', options: DEPOSIT_STATUS_OPTIONS },
            { key: 'property_name', label: 'Property', asyncOptions: '/properties/names' },
        ],
        formFields: [
            { key: 'deposit_date', label: 'Date', type: 'date', required: true },
            { key: 'property_name', label: 'Property', required: true, placeholder: 'Property name' },
            { key: 'payer', label: 'Payer', required: true, ...CONTACT_ASYNC_SELECT },
            { key: 'payee', label: 'Payee', required: true, ...CONTACT_ASYNC_SELECT },
            { key: 'deposit_type', label: 'Type', required: true, placeholder: 'e.g. Bond' },
            { key: 'status', label: 'Status', type: 'select', required: true, options: DEPOSIT_STATUS_OPTIONS },
            { key: 'amount', label: 'Amount', type: 'number', required: true, placeholder: '0.00' },
            { key: 'payment_date', label: 'Payment date', type: 'date' },
            { key: 'refund_date', label: 'Refund date', type: 'date' },
            { key: 'contract_ref', label: 'Contract ref', placeholder: 'Contract reference' },
            { key: 'paid', label: 'Amount paid', type: 'number', placeholder: '0.00' },
            { key: 'refunded', label: 'Amount returned', type: 'number', placeholder: '0.00' },
            { key: 'is_owner', label: 'Owner deposit', type: 'select', options: ['false', 'true'], default: 'false' },
        ],
        tableOptions: {},
        deleteConfirm: (row) => `Delete deposit for "${row.property_name}"? This action cannot be undone.`,
    },

    sepa_batches: {
        title: 'SEPA Batch',
        entity: 'sepa_batches',
        apiPath: '/sepa-batches',
        detailEntity: 'sepa_batch',
        historyEntity: 'sepa_batches',
        columns: [
            { key: 'collection_date', label: 'Collection date', type: 'date' },
            { key: 'batch_name', label: 'Name' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'creditor', label: 'Creditor' },
            { key: 'total_records', label: 'Records' },
            { key: 'total_amount', label: 'Total', type: 'currency' },
            { key: 'created_at', label: 'Created', type: 'date' },
        ],
        filters: [
            { key: 'status', label: 'Status', options: BATCH_STATUS_OPTIONS },
            { key: 'creditor', label: 'Creditor', asyncOptions: '/sepa-batches/creditors' },
        ],
        formFields: [
            { key: 'batch_name', label: 'Batch name', required: true },
            { key: 'collection_date', label: 'Collection date', type: 'date', required: true },
            { key: 'status', label: 'Status', type: 'select', options: BATCH_STATUS_OPTIONS },
            { key: 'creditor', label: 'Creditor (name)', required: true },
            { key: 'creditor_id', label: 'Creditor ID' },
            { key: 'creditor_suffix', label: 'Suffix' },
            { key: 'debtor', label: 'Debtor (name)' },
            { key: 'debtor_iban', label: 'Debtor IBAN' },
            { key: 'debtor_swift_bic', label: 'Debtor SWIFT/BIC' },
            { key: 'debtor_creditor_id', label: 'Debtor Creditor ID' },
            { key: 'debtor_suffix', label: 'Debtor Suffix' },
            { key: 'notes', label: 'Notes', type: 'textarea' },
        ],
        tableOptions: {
            showPeriodFilter: true,
        },
        deleteConfirm: (row) => `Delete batch "${row.batch_name}"? Linked invoices will NOT be deleted.`,
    },

    issues: {
        title: 'Issue',
        entity: 'issue',
        apiPath: '/issues',
        exportPath: '/export/issues',
        detailEntity: 'issue',
        historyEntity: 'issues',
        columns: [
            { key: 'property_name', label: 'Property' },
            { key: 'title', label: 'Title' },
            { key: 'priority', label: 'Priority', type: 'status' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'cost', label: 'Cost', type: 'currency' },
            { key: 'created_at', label: 'Created', type: 'date' },
        ],
        filters: [
            { key: 'status', label: 'Status', options: ISSUE_STATUS_OPTIONS },
            { key: 'priority', label: 'Priority', options: PRIORITY_OPTIONS },
            { key: 'property_name', label: 'Property', asyncOptions: '/properties/names' },
        ],
        formFields: [
            { key: 'property_name', label: 'Property', required: true, placeholder: 'Property name' },
            { key: 'title', label: 'Title', required: true, placeholder: 'Brief description of the issue' },
            { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Detailed description...' },
            { key: 'priority', label: 'Priority', type: 'select', options: PRIORITY_OPTIONS, default: 'Medium' },
            { key: 'status', label: 'Status', type: 'select', options: ISSUE_STATUS_OPTIONS, default: 'Open' },
            { key: 'cost', label: 'Cost', type: 'number', placeholder: '0.00' },
        ],
        tableOptions: {},
        deleteConfirm: (row) => `Delete "${row.title}"? This action cannot be undone.`,
    },

    tenants: {
        title: 'Tenant',
        entity: 'tenant',
        apiPath: '/tenants',
        detailEntity: 'tenant',
        historyEntity: 'tenants',
        columns: [
            { key: 'name', label: 'Name' },
            { key: 'tax_id', label: 'National ID' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'property_name', label: 'Property' },
            { key: 'created_at', label: 'Created', type: 'date' },
        ],
        filters: [
            { key: 'property_name', label: 'Property', asyncOptions: '/properties/names' },
        ],
        formFields: [
            { key: 'name', label: 'Full name', required: true, placeholder: 'Full name' },
            { key: 'tax_id', label: 'National ID', required: true, placeholder: 'ID number' },
            { key: 'email', label: 'Email', required: true, placeholder: 'email@example.com' },
            { key: 'phone', label: 'Phone', required: true, placeholder: '+44 7700 000 000' },
            { key: 'address', label: 'Address', placeholder: 'Current address' },
            { key: 'bank_account', label: 'Bank account (IBAN)', placeholder: 'GB00 0000 0000 0000 0000 00' },
            { key: 'property_name', label: 'Property', placeholder: 'Associated property' },
            { key: 'property_address', label: 'Property address', placeholder: 'Property address' },
            { key: 'is_legacy', label: 'Legacy tenant', type: 'select', options: ['false', 'true'], default: 'false' },
            { key: 'guarantor_name', label: 'Guarantor name', placeholder: 'Guarantor full name' },
            { key: 'guarantor_id', label: 'Guarantor ID', placeholder: 'Guarantor ID' },
            { key: 'guarantor_phone', label: 'Guarantor phone', placeholder: '+44 7700 000 000' },
            { key: 'guarantor_email', label: 'Guarantor email', placeholder: 'guarantor@example.com' },
        ],
        tableOptions: {},
        deleteConfirm: (row) => `Delete "${row.name}"? This action cannot be undone.`,
    },

    owners: {
        title: 'Owner',
        entity: 'owner',
        apiPath: '/owners',
        detailEntity: 'owner',
        historyEntity: 'owners',
        columns: [
            { key: 'name', label: 'Name' },
            { key: 'tax_id', label: 'Tax ID' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'property_name', label: 'Property' },
            { key: 'created_at', label: 'Created', type: 'date' },
        ],
        filters: [
            { key: 'property_name', label: 'Property', asyncOptions: '/properties/names' },
        ],
        formFields: [
            { key: 'name', label: 'Full name', required: true, placeholder: 'Full name' },
            { key: 'tax_id', label: 'Tax ID', required: true, placeholder: 'NI/UTR' },
            { key: 'email', label: 'Email', placeholder: 'email@example.com' },
            { key: 'phone', label: 'Phone', placeholder: '+44 7700 000 000' },
            { key: 'address', label: 'Address', placeholder: 'Current address' },
            { key: 'bank_account', label: 'Bank account', placeholder: 'Bank name or IBAN' },
            { key: 'property_name', label: 'Property', placeholder: 'Associated property' },
            { key: 'property_address', label: 'Property address', placeholder: 'Property address' },
        ],
        tableOptions: {},
        deleteConfirm: (row) => `Delete "${row.name}"? This action cannot be undone.`,
    },

    overdue: {
        title: 'Overdue',
        entity: 'overdue',
        apiPath: '/invoices',
        exportPath: '/export/invoices',
        detailEntity: 'invoice',
        columns: [
            { key: 'reference', label: 'Invoice #' },
            { key: 'description', label: 'Description', type: 'multiline', subKey: 'property_name' },
            { key: 'payer', label: 'Payer' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'total', label: 'Total', type: 'currency' },
            { key: 'paid', label: 'Paid', type: 'currency' },
            { key: '_outstanding', label: 'Pending', render: function(val, row) {
                const pending = parseFloat(row.total || 0) - parseFloat(row.paid || 0);
                if (pending <= 0) return AdminApp.formatCurrency(0);
                return '<span class="text-danger text-semibold">' + AdminApp.formatCurrency(pending) + '</span>';
            }},
            { key: 'invoice_date', label: 'Date', type: 'date' },
            { key: 'collection_date', label: 'Coll. date', type: 'date' },
            { key: '_overdue', label: 'Overdue', render: function(val, row) {
                const refDate = row.collection_date || row.invoice_date;
                if (!refDate) return '-';
                const elapsed = Math.floor((Date.now() - new Date(refDate).getTime()) / MS_PER_DAY);
                const overdueDays = elapsed - GRACE_DAYS;
                if (overdueDays > 0) {
                    const sev = overdueDays > SEVERE_OVERDUE_DAYS ? 'red' : 'amber';
                    return '<span class="badge badge-' + sev + '">' + overdueDays + 'd overdue</span>';
                }
                const remaining = GRACE_DAYS - elapsed;
                return '<span class="badge badge-gray">' + remaining + 'd remaining</span>';
            }},
        ],
        filters: [
            { key: 'status', label: 'Status', options: ['Unpaid', 'Partial'] },
            { key: 'owner_id', label: 'Owner', asyncOptions: '/invoices/owners', optionValue: 'id', optionLabel: 'name' },
            { key: 'property_name', label: 'Property', asyncOptions: '/properties/names' },
        ],
        tableOptions: {
            showPeriodFilter: true,
            readOnly: true,
            defaultFilters: { type: 'income', status: 'Unpaid' },
        },
    },

    leads: {
        title: 'Lead',
        entity: 'lead',
        apiPath: '/leads',
        detailEntity: 'lead',
        historyEntity: 'leads',
        columns: [
            { key: 'name', label: 'Name' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'interest_type', label: 'Interest', type: 'status' },
            { key: 'property_name', label: 'Property' },
            { key: 'source', label: 'Source' },
            { key: 'follow_up_date', label: 'Follow-up', type: 'date' },
            { key: 'score', label: 'Score' },
            { key: 'created_at', label: 'Created', type: 'date' },
        ],
        filters: [
            { key: 'status', label: 'Status', options: LEAD_STATUS_OPTIONS },
            { key: 'interest_type', label: 'Interest', options: LEAD_INTEREST_OPTIONS },
            { key: 'source', label: 'Source', options: LEAD_SOURCE_OPTIONS },
            { key: 'property_name', label: 'Property', asyncOptions: '/properties/names' },
        ],
        formFields: [
            { key: 'name', label: 'Name', required: true, placeholder: 'Contact name' },
            { key: 'email', label: 'Email', placeholder: 'email@example.com' },
            { key: 'phone', label: 'Phone', placeholder: '+44 7700 000 000' },
            { key: 'company', label: 'Company', placeholder: 'Company name' },
            { key: 'source', label: 'Source', type: 'select', options: LEAD_SOURCE_OPTIONS, default: 'direct' },
            { key: 'status', label: 'Status', type: 'select', options: LEAD_STATUS_OPTIONS, default: 'New' },
            { key: 'interest_type', label: 'Interest', type: 'select', options: LEAD_INTEREST_OPTIONS, default: 'rental' },
            { key: 'property_name', label: 'Property of interest', type: 'asyncSelect', asyncOptions: '/properties/names' },
            { key: 'budget_min', label: 'Min budget (GBP)', type: 'number', placeholder: '0' },
            { key: 'budget_max', label: 'Max budget (GBP)', type: 'number', placeholder: '0' },
            { key: 'min_bedrooms', label: 'Min bedrooms', type: 'number', placeholder: '0' },
            { key: 'min_sqm', label: 'Min sq ft', type: 'number', placeholder: '0' },
            { key: 'preferred_area', label: 'Preferred area', placeholder: 'Area, city...' },
            { key: 'follow_up_date', label: 'Next follow-up', type: 'date' },
            { key: 'assigned_to', label: 'Assigned to', placeholder: 'Assigned agent' },
            { key: 'score', label: 'Score (0-100)', type: 'number', placeholder: '0' },
            { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'General notes...' },
        ],
        tableOptions: {},
        deleteConfirm: (row) => `Delete "${row.name}"? This action cannot be undone.`,
    },

    contacts: {
        title: 'Contact',
        entity: 'contact',
        apiPath: '/contacts',
        detailEntity: null,
        historyEntity: 'contacts',
        columns: [
            { key: 'name', label: 'Name' },
            { key: 'tax_id', label: 'Tax ID' },
            { key: 'iban', label: 'IBAN' },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Phone' },
            { key: 'contact_type', label: 'Type' },
            { key: 'created_at', label: 'Created', type: 'date' },
        ],
        filters: [
            { key: 'contact_type', label: 'Type', options: CONTACT_TYPE_OPTIONS },
        ],
        formFields: [
            { key: 'name', label: 'Name', required: true, placeholder: 'Full name or company name' },
            { key: 'tax_id', label: 'Tax ID', placeholder: 'Tax ID' },
            { key: 'iban', label: 'IBAN', placeholder: 'GB00 0000 0000 0000 0000 00' },
            { key: 'email', label: 'Email', placeholder: 'email@example.com' },
            { key: 'phone', label: 'Phone', placeholder: '+44 7700 000 000' },
            { key: 'address', label: 'Address', placeholder: 'Full address' },
            { key: 'contact_type', label: 'Type', type: 'select', options: CONTACT_TYPE_OPTIONS },
            { key: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Additional notes...' },
        ],
        tableOptions: {},
        deleteConfirm: (row) => `Delete "${row.name}"? This action cannot be undone.`,
    },

};

Object.assign(AdminApp, { ENTITY_CONFIGS });

})(window.AdminApp);
(function(AdminApp) {

function initEntityPage(configKey, container, overrides) {
    const config = { ...AdminApp.ENTITY_CONFIGS[configKey], ...overrides };
    if (!config.entity) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (el) el.innerHTML = '<div class="empty-state">Configuration not found for this page.</div>';
        return;
    }

    AdminApp.Toast.init();
    const historyPanel = new AdminApp.HistoryPanel();

    let formPanel = null;
    if (config.formFields && !(config.tableOptions && config.tableOptions.readOnly)) {
        formPanel = new AdminApp.FormPanel({
            title: config.title,
            fields: config.formFields,
            hiddenFields: config.hiddenFields,
            onSubmit: async (data, isEdit, original) => {
                try {
                    if (config.onSubmitTransform) {
                        data = config.onSubmitTransform(data, isEdit);
                    }
                    if (isEdit) {
                        await AdminApp.api.put(`${config.apiPath}/${original.id}`, data);
                        AdminApp.Toast.show(`${config.title} actualizado`);
                    } else {
                        await AdminApp.api.post(config.apiPath, data);
                        AdminApp.Toast.show(`${config.title} creado`);
                    }
                    table.load();
                } catch (e) {
                    AdminApp.Toast.show(e.message, 'error');
                }
            }
        });
    }

    const tableConfig = {
        entity: config.entity,
        apiPath: config.apiPath,
        exportPath: config.exportPath,
        columns: config.columns,
        filters: config.filters,
        ...config.tableOptions,
        onRowClick: (row) => {
            if (config.detailEntity) {
                AdminApp.navigateTo(config.detailEntity, row.id);
            }
        },
        onAction: async (action, row) => {
            if (action === 'create' && formPanel) formPanel.open();
            if (action === 'edit' && formPanel) formPanel.open(row);
            if (action === 'history') historyPanel.open(config.historyEntity || config.entity, row.id);
            if (action === 'gallery' && AdminApp.PropertyPresentation) {
                AdminApp.PropertyPresentation.open(row.id);
            }
            if (action === 'pdf') {
                window.open(`${AdminApp.API_BASE}/contabilidad/${row.id}/pdf`, '_blank');
            }
            if (action === 'delete') {
                const msg = config.deleteConfirm
                    ? config.deleteConfirm(row)
                    : `Delete this record? This action cannot be undone.`;
                const ok = await AdminApp.confirmAction(`Delete ${config.title}`, msg);
                if (ok) {
                    try {
                        await AdminApp.api.del(`${config.apiPath}/${row.id}`);
                        AdminApp.Toast.show(`${config.title} eliminado`);
                        table.load();
                    } catch (e) { AdminApp.Toast.show(e.message, 'error'); }
                }
            }
            if (config.onAction) config.onAction(action, row, { table, formPanel, historyPanel });
        }
    };

    if (overrides && overrides.onSelectionChange) {
        tableConfig.onSelectionChange = overrides.onSelectionChange;
    }
    if (overrides && overrides.onDataLoaded) {
        tableConfig.onDataLoaded = overrides.onDataLoaded;
    }

    const table = new AdminApp.DataTable(container, tableConfig);

    if (overrides && overrides.afterInit) {
        overrides.afterInit({ table, formPanel, historyPanel });
    }

    return { table, formPanel, historyPanel };
}

Object.assign(AdminApp, { initEntityPage });

})(window.AdminApp);
(function(AdminApp) {

const {
    openPanel, closePanel,
    api, escapeHtml,
    formatCurrency, formatDate,
    statusBadge, computeEstado,
    progressBar, daysUntil,
} = AdminApp;

async function openDocumentModal(docId) {
    try {
        const data = await api.get(`/contract_documents/${docId}/text`);
        const overlay = document.createElement('div');
        overlay.className = 'doc-modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'doc-modal';
        modal.innerHTML = `
            <div class="doc-modal-header">
                <h3>${escapeHtml(data.name)}</h3>
                <button class="doc-modal-close-btn doc-modal-close">&times;</button>
            </div>
            <div class="doc-modal-body">${escapeHtml(data.content)}</div>`;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        AdminApp.ScrollLock.lock();
        modal.querySelector('.doc-modal-close').addEventListener('click', () => { overlay.remove(); AdminApp.ScrollLock.unlock(); });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); AdminApp.ScrollLock.unlock(); } });
        document.addEventListener('keydown', function handler(e) { if (e.key === 'Escape') { overlay.remove(); AdminApp.ScrollLock.unlock(); document.removeEventListener('keydown', handler); } });
    } catch (e) {
        window.AdminApp.Toast.show('Error loading document: ' + e.message, 'error');
    }
}

function renderActivoFinancialDetail(f) {
    if (!f) return '';
    const facturado = parseFloat(f.total_invoiced || 0);
    const collected = parseFloat(f.total_collected || 0);
    const outstanding = parseFloat(f.total_outstanding || 0);
    const rate = facturado > 0 ? (collected / facturado * 100) : 0;
    return `
        <div class="detail-section">
            <h4>Financial summary</h4>
            <div class="financial-cards">
                <div class="mini-card"><span class="mini-label">Invoiced</span><span class="mini-value">${formatCurrency(facturado)}</span></div>
                <div class="mini-card success"><span class="mini-label">Collected</span><span class="mini-value">${formatCurrency(collected)}</span></div>
                <div class="mini-card ${outstanding > 0 ? 'error' : ''}"><span class="mini-label">Outstanding</span><span class="mini-value">${formatCurrency(outstanding)}</span></div>
            </div>
            <div class="mt-3">
                <div class="flex justify-between text-sm text-muted mb-2"><span>Collection rate</span><span>${rate.toFixed(1)}%</span></div>
                ${progressBar(rate, rate > 80 ? 'green' : rate > 50 ? 'amber' : 'red')}
            </div>
        </div>`;
}

function renderActivoInvoices(invoices) {
    if (invoices.length === 0) return '';
    return `
        <div class="detail-section">
            <h4>Recent invoices (${invoices.length})</h4>
            <div class="table-container max-h-300 overflow-auto">
                <table class="data-table">
                    <thead><tr><th>Ref</th><th>Description</th><th>Status</th><th>Total</th><th>Paid</th><th>Date</th></tr></thead>
                    <tbody>
                        ${invoices.map(inv => `
                            <tr>
                                <td>${escapeHtml(inv.reference)}</td>
                                <td>${escapeHtml(inv.description)}</td>
                                <td>${statusBadge(inv.status, 'invoice')}</td>
                                <td class="numeric">${formatCurrency(inv.total)}</td>
                                <td class="numeric">${formatCurrency(inv.paid)}</td>
                                <td class="date">${escapeHtml(inv.invoice_date)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

function renderContratoBasicInfo(row) {
    const fields = [['Contract ref', row.contract_ref], ['Property', row.property_name], ['Address', row.address], ['Tenant', row.tenant_name]];
    const financial = [['Monthly rent', formatCurrency(row.rent)], ['Contract value', formatCurrency(row.total)]];
    const dates = [['Start date', formatDate(row.start_date)], ['End date', formatDate(row.end_date)]];
    const days = daysUntil(row.end_date);
    const daysInfo = days != null
        ? `<div class="detail-section"><div class="mini-card ${days < 30 ? 'error' : days < 90 ? '' : 'success'}"><span class="mini-label">Days remaining</span><span class="mini-value">${days}</span></div></div>`
        : '';
    return `
        <div class="detail-section">
            <div class="flex items-center gap-3 mb-4">
                <h3 class="m-0">${escapeHtml(row.contract_ref)}</h3>
                ${statusBadge(row.status, 'contract')}
            </div>
        </div>
        ${AdminApp.detailSection('Identification', fields)}
        ${AdminApp.detailSection('Financial', financial)}
        ${AdminApp.detailSection('Dates', dates)}
        ${daysInfo}
        ${row.tags && row.tags.length ? `<div class="detail-section"><h4>Tags</h4><div>${row.tags.map(t => `<span class="badge badge-blue">${escapeHtml(t)}</span>`).join(' ')}</div></div>` : ''}`;
}

function renderContratoDocuments(detail) {
    if (!detail.documents || detail.documents.length === 0) return '';
    let html = `<div class="detail-section"><h4>Documents (${detail.documents.length})</h4>`;
    detail.documents.forEach(doc => {
        html += `<div class="doc-item">
            <div class="doc-item-header">
                <div class="text-semibold">${escapeHtml(doc.name)}</div>
                ${doc.has_text ? `<button class="btn btn-sm btn-secondary doc-view-btn no-wrap" data-doc-id="${escapeHtml(doc.id)}">View text</button>` : ''}
            </div>
            <div class="doc-item-meta">
                <span class="badge badge-blue">${escapeHtml(doc.type)}</span>
                ${doc.document_date ? ` ${formatDate(doc.document_date)}` : ''}
            </div>
            ${doc.notes ? `<div class="doc-item-notes">${escapeHtml(doc.notes)}</div>` : ''}
        </div>`;
    });
    html += `</div>`;
    return html;
}

function renderContratoDetalles(detail) {
    if (!detail.extracted_data || detail.extracted_data.length === 0) return '';
    const catLabels = {
        price: 'Price', ipc: 'CPI', garantia: 'Guarantee',
        descuento_1: 'Discount 1', descuento_2: 'Discount 2', descuento_3: 'Discount 3',
        incremento_pct: 'Increment %', fin_contrato: 'End contract', ibi: 'Council Tax', extras: 'Extras'
    };
    let html = `<div class="detail-section"><h4>Extracted data</h4>`;
    html += `<table class="detail-data-table"><thead><tr><th>Category</th><th>Value</th><th>Amount</th><th>Period</th></tr></thead><tbody>`;
    detail.extracted_data.forEach(d => {
        const cat = catLabels[d.category] || d.category;
        const label = d.label ? ` (${escapeHtml(d.label)})` : '';
        html += `<tr>
            <td><span class="badge badge-blue">${escapeHtml(cat)}</span>${label}</td>
            <td>${d.value ? escapeHtml(d.value) : '-'}</td>
            <td>${d.numeric_value ? formatCurrency(d.numeric_value) : '-'}</td>
            <td class="text-sm">${formatDate(d.start_date)} → ${formatDate(d.end_date)}</td>
        </tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
}

class DetailPanel {
    constructor() {
        this.overlay = null;
        this.panel = null;
        this._closing = false;
    }

    async openActivo(id) {
        openPanel(this, 'Property details');
        try {
            const data = await api.get(`/properties/${id}/detail`);
            if (!this.panel) return;
            const a = data.property;
            const images = data.images || [];
            let html = '';
            if (images.length > 0) {
                html += `<div class="detail-image-strip">${images.slice(0, 4).map(img => `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename)}" loading="lazy">`).join('')}</div>`;
                html += `<button class="detail-view-gallery-btn" data-gallery-id="${id}">&#128247; View property (${images.length} photos)</button>`;
            }
            html += `
                <div class="detail-section">
                    <h3>${escapeHtml(a.property_name)}</h3>
                    <div class="detail-grid">
                        <div class="detail-field"><span class="detail-label">Address</span><span class="detail-value">${escapeHtml(a.address)}</span></div>
                        <div class="detail-field"><span class="detail-label">Status</span><span class="detail-value">${statusBadge(a.status, 'property')}</span></div>
                        <div class="detail-field"><span class="detail-label">Contract</span><span class="detail-value">${escapeHtml(a.contract_ref) || '-'}</span></div>
                        <div class="detail-field"><span class="detail-label">Monthly rent</span><span class="detail-value">${formatCurrency(a.rent)}</span></div>
                        <div class="detail-field"><span class="detail-label">Contract start</span><span class="detail-value">${formatDate(a.start_date)}</span></div>
                        <div class="detail-field"><span class="detail-label">Contract end</span><span class="detail-value">${formatDate(a.end_date)}</span></div>
                        ${a.tags && a.tags.length ? `<div class="detail-field"><span class="detail-label">Tags</span><span class="detail-value">${a.tags.map(t => `<span class="badge badge-blue">${escapeHtml(t)}</span>`).join(' ')}</span></div>` : ''}
                    </div>
                </div>`;
            html += renderActivoFinancialDetail(data.financial);
            html += renderActivoInvoices(data.invoices || []);
            this.panel.querySelector('.panel-body').innerHTML = html;
        } catch (e) {
            if (this.panel) {
                this.panel.querySelector('.panel-body').innerHTML =
                    `<div class="empty-state">Error loading details: ${escapeHtml(e.message)}</div>`;
            }
        }
    }

    async openContrato(row) {
        openPanel(this, 'Contract details');
        if (!this.panel) return;
        let html = renderContratoBasicInfo(row);
        try {
            const detail = await api.get(`/contracts/${row.id}/detail`);
            html += renderContratoDocuments(detail);
            html += renderContratoDetalles(detail);
        } catch (_) {
        }
        this.panel.querySelector('.panel-body').innerHTML = html;
        this.panel.querySelectorAll('.doc-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openDocumentModal(btn.dataset.docId);
            });
        });
    }

    async openContabilidad(row) {
        openPanel(this, 'Invoice details');
        if (!this.panel) return;
        const fields = [['Reference', row.reference], ['Description', row.description], ['Contract', row.contract_ref], ['Property', row.property_name], ['Payer', row.payer], ['Payee', row.payee]];
        const amounts = [['Net', formatCurrency(row.net)], ['VAT', formatCurrency(row.vat)], ['Withholding', formatCurrency(row.withholding)], ['Total', formatCurrency(row.total)], ['Paid', formatCurrency(row.paid)], ['Discount', formatCurrency(row.discount)], ['Discount %', row.discount_pct ? `${row.discount_pct}%` : '-']];
        const dates = [['Invoice date', row.invoice_date || '-'], ['Payment date', formatDate(row.payment_date)]];
        const payment = [['Payment method', row.payment_method || '-'], ['Payer account', row.payer_account || '-']];
        const html = `
            <div class="detail-section">
                <div class="flex items-center gap-3 mb-4">
                    <h3 class="m-0">${escapeHtml(row.reference)}</h3>
                    ${statusBadge(computeEstado(row), 'invoice')}
                </div>
            </div>
            ${AdminApp.detailSection('Identification', fields)}
            ${AdminApp.detailSection('Amounts', amounts)}
            ${AdminApp.detailSection('Dates', dates)}
            ${AdminApp.detailSection('Payment', payment)}
            ${row.notes ? `<div class="detail-section"><h4>Notes</h4><p class="text-muted text-sm">${escapeHtml(row.notes)}</p></div>` : ''}`;
        this.panel.querySelector('.panel-body').innerHTML = html;
    }

    close() { closePanel(this); }
}

Object.assign(AdminApp, { DetailPanel, openDocumentModal });

})(window.AdminApp);
(function(AdminApp) {

const { api, Toast, escapeHtml, formatDate, timeAgo, API_BASE } = AdminApp;

function getIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
}

function initTabs(el, initTabTable, context) {
    const tabsLoaded = { resumen: true };
    el.querySelectorAll('.tab-bar .tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const name = tab.dataset.tab;
            el.querySelectorAll('.tab-bar .tab').forEach(t => t.classList.remove('active'));
            el.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            el.querySelector(`[data-panel="${name}"]`).classList.add('active');
            if (!tabsLoaded[name]) {
                tabsLoaded[name] = true;
                initTabTable(name, el.querySelector(`[data-panel="${name}"] .tab-table-root`), context);
            }
        });
    });
}

async function loadAuditTrail(entityType, entityId, container) {
    try {
        const entries = await api.get(`/audit/${entityType}/${entityId}`);
        if (!entries || entries.length === 0) {
            container.innerHTML = '<p class="loading-text text-tertiary">No changes recorded.</p>';
            return;
        }
        container.innerHTML = `<div class="activity-feed max-h-none">
            ${entries.map(e => {
                const actionIcon = {'create': '+', 'update': '\u270E', 'delete': '\u2212'}[e.action] || '\u2022';
                const actionColor = {'create': 'green', 'update': 'amber', 'delete': 'red'}[e.action] || 'gray';
                let diffHtml = '';
                if (e.changed_fields && e.changed_fields.length > 0) {
                    diffHtml = '<div class="mt-2">' +
                        e.changed_fields.map(field => {
                            const oldVal = e.old_values ? e.old_values[field] : null;
                            const newVal = e.new_values ? e.new_values[field] : null;
                            return `<div class="diff-field-row">
                                <span class="diff-field-name">${escapeHtml(field)}</span>
                                ${oldVal != null ? `<span class="text-danger line-through">${escapeHtml(String(oldVal))}</span>` : ''}
                                <span class="text-success">${escapeHtml(String(newVal))}</span>
                            </div>`;
                        }).join('') + '</div>';
                }
                return `<div class="activity-item items-start">
                    <span class="activity-icon activity-${actionColor}">${actionIcon}</span>
                    <div class="activity-content flex-1">
                        <div class="flex items-center gap-2">
                            <span class="badge badge-${actionColor}">${escapeHtml(e.action)}</span>
                            ${e.user ? `<span class="text-tertiary text-xs">${escapeHtml(e.user)}</span>` : ''}
                            <span class="activity-time ml-auto">${timeAgo(e.created_at)}</span>
                        </div>
                        ${diffHtml}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    } catch (e) {
        container.innerHTML = `<p class="text-danger">Error: ${escapeHtml(e.message)}</p>`;
    }
}

function formatFileSize(bytes) {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function renderCertificateCard(cert) {
    const isImage = cert.file_type && cert.file_type.startsWith('image/');
    const downloadUrl = `${API_BASE}/deposit_certificates/${cert.id}/download`;
    const preview = isImage
        ? `<img src="${downloadUrl}" alt="${escapeHtml(cert.name)}" class="cert-thumb">`
        : `<div class="cert-icon">PDF</div>`;
    return `<div class="cert-card" data-cert-id="${cert.id}">
        <a href="${downloadUrl}" target="_blank" class="cert-preview">${preview}</a>
        <div class="cert-info">
            <a href="${downloadUrl}" target="_blank" class="cert-name">${escapeHtml(cert.name)}</a>
            <span class="cert-meta">${formatFileSize(cert.size)} &middot; ${formatDate(cert.created_at)}</span>
        </div>
        <button class="btn-icon cert-delete" data-cert-id="${cert.id}" title="Delete">&times;</button>
    </div>`;
}

async function uploadCertificate(depositId, file) {
    try {
        await api.uploadFile(`/deposits/${depositId}/certificates`, file);
        Toast.show(`${file.name} uploaded successfully`);
    } catch (e) {
        Toast.show(`Error: ${e.message}`, 'error');
    }
}

Object.assign(AdminApp, {
    getIdFromUrl,
    initTabs,
    loadAuditTrail,
    formatFileSize,
    renderCertificadoCard: renderCertificateCard,
    renderCertificateCard,
    uploadCertificado: uploadCertificate,
    uploadCertificate,
    entityDetailUrl: AdminApp.detailUrl,
});

})(window.AdminApp);
(function(AdminApp) {

const {
    api, Toast, FormPanel,
    formatCurrency, formatCurrencyValue, formatDate,
    escapeHtml, statusBadge, computeEstado,
} = AdminApp;

async function renderContabilidadDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const id = AdminApp.getIdFromUrl();
    if (!id) { el.innerHTML = '<div class="empty-state">No invoice specified.</div>'; return; }

    try {
        const row = await api.get(`/invoices/${id}`);
        const estado = computeEstado(row);
        const outstanding = (parseFloat(row.total) || 0) - (parseFloat(row.paid) || 0);

        let html = '';

        const backKey = row.type === 'expense' ? 'expenses' : 'billing';
        const backLabel = row.type === 'expense' ? 'Expenses' : 'Invoicing';
        html += AdminApp.breadcrumb(backKey, backLabel, row.reference);

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${row.invoice_number ? `#${row.invoice_number} \u2014 ` : ''}${escapeHtml(row.reference)}</h1>
                ${statusBadge(estado, 'invoice')}
                ${row.type ? statusBadge(row.type, 'invoice') : ''}
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="btn-edit-factura">Edit</button>
                <a href="${AdminApp.API_BASE}/invoices/${id}/pdf" target="_blank" class="btn btn-secondary">PDF</a>
            </div>
        </div>`;

        html += `<div class="tab-bar">
            <button class="tab active" data-tab="resumen">Summary</button>
            <button class="tab" data-tab="historial">History</button>
        </div>`;

        html += '<div class="tab-content">';
        html += '<div class="tab-panel active" data-panel="resumen">';

        html += `<div class="summary-grid">
            <div class="stat-card">
                <div class="label">Total</div>
                <div class="value currency">${formatCurrencyValue(row.total)}</div>
            </div>
            <div class="stat-card success">
                <div class="label">Paid</div>
                <div class="value currency">${formatCurrencyValue(row.paid)}</div>
            </div>
            <div class="stat-card ${outstanding > 0 ? 'error' : ''}">
                <div class="label">Outstanding</div>
                <div class="value currency">${formatCurrencyValue(outstanding)}</div>
            </div>
            ${row.vat ? `<div class="stat-card">
                <div class="label">VAT</div>
                <div class="value currency">${formatCurrencyValue(row.vat)}</div>
            </div>` : ''}
        </div>`;

        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Identification</h3>
                <div class="detail-grid">
                    ${row.invoice_number ? `<div class="detail-field"><span class="detail-label">Invoice no.</span><span class="detail-value">${row.invoice_number}</span></div>` : ''}
                    <div class="detail-field"><span class="detail-label">Description</span><span class="detail-value">${escapeHtml(row.description)}</span></div>
                    <div class="detail-field"><span class="detail-label">Property</span><span class="detail-value">${AdminApp.entitySearchLink(row.property_name, 'properties')}</span></div>
                    <div class="detail-field"><span class="detail-label">Contract</span><span class="detail-value">${AdminApp.entitySearchLink(row.contract_ref, 'contracts')}</span></div>
                    ${row.expense_category ? `<div class="detail-field"><span class="detail-label">Category</span><span class="detail-value"><span class="badge badge-blue">${escapeHtml(row.expense_category)}</span></span></div>` : ''}
                </div>
            </div>
            <div class="detail-info-section">
                <h3>Parties</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Payer</span><span class="detail-value">${escapeHtml(row.payer)}</span></div>
                    <div class="detail-field"><span class="detail-label">Payee</span><span class="detail-value">${escapeHtml(row.payee)}</span></div>
                </div>
            </div>
        </div>`;

        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Dates</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Invoice date</span><span class="detail-value">${formatDate(row.invoice_date)}</span></div>
                    <div class="detail-field"><span class="detail-label">Payment date</span><span class="detail-value">${formatDate(row.payment_date)}</span></div>
                </div>
            </div>
            <div class="detail-info-section">
                <h3>Payment</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Method</span><span class="detail-value">${escapeHtml(row.payment_method) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Payer account</span><span class="detail-value">${escapeHtml(row.payer_account) || '-'}</span></div>
                    ${row.discount ? `<div class="detail-field"><span class="detail-label">Discount</span><span class="detail-value">${formatCurrency(row.discount)}${row.discount_pct ? ` (${row.discount_pct}%)` : ''}</span></div>` : ''}
                </div>
            </div>
        </div>`;

        if (row.notes) {
            html += `<div class="detail-info-section"><h3>Notes</h3><p class="note-text">${escapeHtml(row.notes)}</p></div>`;
        }

        html += '</div>';

        html += '<div class="tab-panel" data-panel="historial"><div id="contabilidad-audit"></div></div>';
        html += '</div>';

        el.innerHTML = html;

        AdminApp.initTabs(el, (tabName, tabContainer) => {
            if (tabName === 'historial') {
                AdminApp.loadAuditTrail('invoice', id, tabContainer);
            }
        }, row);

        el.querySelector('#btn-edit-factura')?.addEventListener('click', () => {
            const fp = new FormPanel({
                title: row.type === 'expense' ? 'Expense' : 'Invoice',
                fields: [
                    { key: 'reference', label: 'Reference', required: true },
                    { key: 'invoice_number', label: 'Invoice no.', type: 'number' },
                    { key: 'description', label: 'Description', required: true },
                    { key: 'contract_ref', label: 'Contract' },
                    { key: 'property_name', label: 'Property' },
                    { key: 'payer', label: 'Payer' },
                    { key: 'payee', label: 'Payee' },
                    { key: 'status', label: 'Status', type: 'select', options: ['Auto', 'Unpaid', 'Partial', 'Paid'] },
                    { key: 'total', label: 'Total', type: 'number', required: true },
                    { key: 'paid', label: 'Paid', type: 'number' },
                    { key: 'vat', label: 'VAT', type: 'number' },
                    { key: 'invoice_date', label: 'Date', required: true },
                    { key: 'payment_date', label: 'Payment date', type: 'date' },
                    { key: 'payment_method', label: 'Payment method', type: 'select', options: ['', 'transfer', 'bizum', 'cash', 'direct debit'] },
                    { key: 'notes', label: 'Notes', type: 'textarea' },
                ],
                onSubmit: async (data) => {
                    if (data.status === 'Auto') delete data.status;
                    await api.put(`/invoices/${id}`, data);
                    Toast.show('Invoice updated');
                    renderContabilidadDetail(container);
                }
            });
            fp.open(row);
        });
    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading invoice: ${escapeHtml(e.message)}</div>`;
    }
}

AdminApp.renderContabilidadDetail = renderContabilidadDetail;

})(window.AdminApp);
(function(AdminApp) {

const {
    api, Toast, DataTable, FormPanel,
    formatCurrency, formatCurrencyValue, formatDate,
    escapeHtml, statusBadge, progressBar, rateColor,
} = AdminApp;

async function renderInquilinoDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const id = AdminApp.getIdFromUrl();
    if (!id) { el.innerHTML = '<div class="empty-state">No tenant specified.</div>'; return; }

    try {
        const data = await api.get(`/tenants/${id}/detail`);
        const t = data.tenant || data;

        let html = '';

        html += AdminApp.breadcrumb('tenants', 'Tenants', t.name);

        const payments = data.payments || [];
        const facturado = payments.reduce((s, p) => s + parseFloat(p.total || 0), 0);
        const collected = payments.reduce((s, p) => s + parseFloat(p.paid || 0), 0);
        const outstanding = pagos.reduce((s, p) => s + parseFloat(p.outstanding || 0), 0);
        const rate = facturado > 0 ? (collected / facturado * 100) : 0;
        const rc = rateColor(rate);

        html += `<div class="detail-page-header">
            <div class="header-title"><h1>${escapeHtml(t.name)}</h1></div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="btn-edit-inquilino">Edit</button>
            </div>
        </div>`;

        html += `<div class="dashboard-grid">
            <div class="stat-card">
                <div class="label">Invoices</div>
                <div class="value">${payments.length}</div>
            </div>
            <div class="stat-card">
                <div class="label">Total invoiced</div>
                <div class="value currency">${formatCurrencyValue(facturado)}</div>
            </div>
            <div class="stat-card success">
                <div class="label">Collected</div>
                <div class="value currency">${formatCurrencyValue(collected)}</div>
                <div class="kpi-subtitle">${rate.toFixed(1)}% payment rate</div>
                <div class="mt-2">${progressBar(rate, rc)}</div>
            </div>
            <div class="stat-card ${outstanding > 0 ? 'error' : ''}">
                <div class="label">Outstanding</div>
                <div class="value currency">${formatCurrencyValue(outstanding)}</div>
            </div>
        </div>`;

        html += `<div class="tab-bar">
            <button class="tab active" data-tab="resumen">Summary</button>
            <button class="tab" data-tab="contratos">Contracts</button>
            <button class="tab" data-tab="invoices">Invoices</button>
            <button class="tab" data-tab="depositos">Deposits</button>
        </div>`;

        html += '<div class="tab-content">';

        html += '<div class="tab-panel active" data-panel="resumen">';
        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Personal details</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(t.name)}</span></div>
                    <div class="detail-field"><span class="detail-label">National ID</span><span class="detail-value">${escapeHtml(t.tax_id)}</span></div>
                    <div class="detail-field"><span class="detail-label">Email</span><span class="detail-value">${t.email ? `<a href="mailto:${escapeHtml(t.email)}" class="text-accent">${escapeHtml(t.email)}</a>` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Phone</span><span class="detail-value">${t.phone ? `<a href="tel:${escapeHtml(t.phone)}" class="text-accent">${escapeHtml(t.phone)}</a>` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Address</span><span class="detail-value">${escapeHtml(t.address) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Bank account</span><span class="detail-value">${escapeHtml(t.bank_account) || '-'}</span></div>
                    ${data.creditor ? `<div class="detail-field"><span class="detail-label">Contact</span><span class="detail-value"><a href="/admin/creditors?search=${encodeURIComponent(data.creditor.name)}" class="text-accent">${escapeHtml(data.creditor.name)}</a></span></div>` : ''}
                    ${t.is_legacy === 'true' || t.is_legacy === true ? '<div class="detail-field"><span class="detail-label">Type</span><span class="detail-value"><span class="badge badge-amber">Legacy tenant</span></span></div>' : ''}
                </div>
            </div>
            <div class="detail-info-section">
                <h3>Property</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Property</span><span class="detail-value">${AdminApp.entitySearchLink(t.property_name, 'properties')}</span></div>
                    <div class="detail-field"><span class="detail-label">Property address</span><span class="detail-value">${escapeHtml(t.property_address) || '-'}</span></div>
                </div>
                ${t.guarantor_name ? `<h3 class="mt-4">Guarantor</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(t.guarantor_name)}</span></div>
                    <div class="detail-field"><span class="detail-label">National ID</span><span class="detail-value">${escapeHtml(t.guarantor_tax_id) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Phone</span><span class="detail-value">${escapeHtml(t.guarantor_phone) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Email</span><span class="detail-value">${escapeHtml(t.guarantor_email) || '-'}</span></div>
                </div>` : ''}
            </div>
        </div>`;
        html += '</div>';

        html += '<div class="tab-panel" data-panel="contratos"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="invoices"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="depositos"><div class="tab-table-root"></div></div>';
        html += '</div>';

        el.innerHTML = html;

        AdminApp.initTabs(el, (tabName, tabContainer) => {
            switch (tabName) {
                case 'contratos':
                    return new DataTable(tabContainer, {
                        entity: 'contract', apiPath: '/contracts',
                        defaultFilters: { tenant_name: t.name },
                        columns: [
                            { key: 'contract_ref', label: 'Contract' },
                            { key: 'property_name', label: 'Property' },
                            { key: 'status', label: 'Status', type: 'status' },
                            { key: 'rent', label: 'Rent', type: 'currency' },
                            { key: 'start_date', label: 'Start', type: 'date' },
                            { key: 'end_date', label: 'End', type: 'date' },
                        ],
                        onRowClick: (row) => { AdminApp.navigateTo('contract', row.id); }
                    });
                case 'invoices':
                    return new DataTable(tabContainer, {
                        entity: 'billing', apiPath: '/invoices',
                        defaultFilters: { payer: t.name }, showPeriodFilter: true,
                        columns: [
                            { key: 'reference', label: 'Ref' },
                            { key: 'description', label: 'Description' },
                            { key: 'status', label: 'Status', type: 'status' },
                            { key: 'total', label: 'Total', type: 'currency' },
                            { key: 'paid', label: 'Paid', type: 'currency' },
                            { key: 'invoice_date', label: 'Date' },
                        ],
                        onRowClick: (row) => { AdminApp.navigateTo('invoice', row.id); }
                    });
                case 'depositos':
                    return new DataTable(tabContainer, {
                        entity: 'deposit', apiPath: '/deposits',
                        defaultFilters: { payer: t.name },
                        columns: [
                            { key: 'property_name', label: 'Property' },
                            { key: 'type', label: 'Type' },
                            { key: 'status', label: 'Status', type: 'status' },
                            { key: 'total', label: 'Total', type: 'currency' },
                            { key: 'paid', label: 'Paid', type: 'currency' },
                            { key: 'date', label: 'Date', type: 'date' },
                        ],
                        onRowClick: (row) => { AdminApp.navigateTo('deposit', row.id); }
                    });
            }
        }, t);

        el.querySelector('#btn-edit-inquilino')?.addEventListener('click', () => {
            const fp = new FormPanel({
                title: 'Tenant',
                fields: [
                    { key: 'name', label: 'Full name', required: true },
                    { key: 'tax_id', label: 'National ID', required: true },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'address', label: 'Address' },
                    { key: 'bank_account', label: 'Bank account (IBAN)' },
                    { key: 'property_name', label: 'Property' },
                    { key: 'property_address', label: 'Property address' },
                    { key: 'is_legacy', label: 'Legacy tenant', type: 'select', options: ['false', 'true'] },
                    { key: 'guarantor_name', label: 'Guarantor name' },
                    { key: 'guarantor_tax_id', label: 'Guarantor ID' },
                    { key: 'guarantor_phone', label: 'Guarantor phone' },
                    { key: 'guarantor_email', label: 'Guarantor email' },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/tenants/${id}`, formData);
                    Toast.show('Tenant updated');
                    renderInquilinoDetail(container);
                }
            });
            fp.open(t);
        });
    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading tenant: ${escapeHtml(e.message)}</div>`;
    }
}

AdminApp.renderInquilinoDetail = renderInquilinoDetail;

})(window.AdminApp);
(function(AdminApp) {

const {
    api, Toast, DataTable, FormPanel,
    formatCurrency, formatCurrencyValue, formatDate,
    escapeHtml, statusBadge, progressBar, rateColor,
} = AdminApp;

async function renderOwnerDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const id = AdminApp.getIdFromUrl();
    if (!id) { el.innerHTML = '<div class="empty-state">No owner specified.</div>'; return; }

    try {
        const data = await api.get(`/owners/${id}/detail`);
        const p = data.owner || data;
        const properties = data.properties || [];
        const financialByProperty = data.financial_by_property || [];
        const totals = data.totals || {};
        const invoices = data.invoices || [];

        let html = '';

        html += AdminApp.breadcrumb('owners', 'Owners', p.name);

        html += `<div class="detail-page-header">
            <div class="header-title"><h1>${escapeHtml(p.name)}</h1></div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="btn-edit-propietario">Edit</button>
            </div>
        </div>`;

        const facturado = parseFloat(totals.total_invoiced || 0);
        const collected = parseFloat(totals.total_collected || 0);
        const outstanding = parseFloat(totals.total_outstanding || 0);
        const rate = facturado > 0 ? (collected / facturado * 100) : 0;
        const rc = rateColor(rate);

        html += `<div class="dashboard-grid">
            <div class="stat-card">
                <div class="label">Properties</div>
                <div class="value">${properties.length}</div>
                <div class="kpi-subtitle">Properties managed</div>
            </div>
            <div class="stat-card">
                <div class="label">Total invoiced</div>
                <div class="value currency">${formatCurrencyValue(facturado)}</div>
            </div>
            <div class="stat-card success">
                <div class="label">Collected</div>
                <div class="value currency">${formatCurrencyValue(collected)}</div>
                <div class="kpi-subtitle">${rate.toFixed(1)}% collection rate</div>
                <div class="mt-2">${progressBar(rate, rc)}</div>
            </div>
            <div class="stat-card ${outstanding > 0 ? 'error' : ''}">
                <div class="label">Outstanding</div>
                <div class="value currency">${formatCurrencyValue(outstanding)}</div>
            </div>
        </div>`;

        html += `<div class="tab-bar">
            <button class="tab active" data-tab="resumen">Summary</button>
            <button class="tab" data-tab="activos">Properties</button>
            <button class="tab" data-tab="ingresos">Income</button>
            <button class="tab" data-tab="gastos">Expenses</button>
        </div>`;

        html += '<div class="tab-content">';

        html += '<div class="tab-panel active" data-panel="resumen">';
        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Personal details</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(p.name)}</span></div>
                    <div class="detail-field"><span class="detail-label">Tax ID</span><span class="detail-value">${escapeHtml(p.tax_id) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Email</span><span class="detail-value">${p.email ? `<a href="mailto:${escapeHtml(p.email)}" class="text-accent">${escapeHtml(p.email)}</a>` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Phone</span><span class="detail-value">${p.phone ? `<a href="tel:${escapeHtml(p.phone)}" class="text-accent">${escapeHtml(p.phone)}</a>` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Address</span><span class="detail-value">${escapeHtml(p.address) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Bank account</span><span class="detail-value">${escapeHtml(p.bank_account) || '-'}</span></div>
                    ${data.creditor ? `<div class="detail-field"><span class="detail-label">Contact</span><span class="detail-value"><a href="/admin/creditors?search=${encodeURIComponent(data.creditor.name)}" class="text-accent">${escapeHtml(data.creditor.name)}</a></span></div>` : ''}
                </div>
            </div>
        </div>`;

        if (financialByProperty.length > 0) {
            html += `<h3 class="mt-6">Financial summary by property</h3>
            <div class="table-container">
                <table class="data-table">
                    <thead><tr>
                        <th>Property</th><th class="numeric">Invoiced</th><th class="numeric">Collected</th><th class="numeric">Outstanding</th><th class="rate-col">% Collected</th><th class="numeric">Invoices</th>
                    </tr></thead>
                    <tbody>
                        ${financialByProperty.map(a => {
                            const f = parseFloat(a.total_invoiced || 0);
                            const c = parseFloat(a.total_collected || 0);
                            const pe = parseFloat(a.total_outstanding || 0);
                            const r = f > 0 ? (c / f * 100) : 0;
                            return `<tr class="clickable-row" data-href="${AdminApp.listUrl('properties', {search: a.property_name})}">
                                <td>${escapeHtml(a.property_name)}</td>
                                <td class="numeric">${formatCurrency(f)}</td>
                                <td class="numeric">${formatCurrency(c)}</td>
                                <td class="numeric${pe > 0 ? ' numeric-danger' : ''}">${formatCurrency(pe)}</td>
                                <td class="rate-col">${progressBar(r, rateColor(r))} <small>${r.toFixed(0)}%</small></td>
                                <td class="numeric">${a.num_invoices || 0}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
        }

        if (invoices.length > 0) {
            html += `<h3 class="mt-6">Recent invoices (${invoices.length})</h3>
            <div class="table-container max-h-300 overflow-auto">
                <table class="data-table">
                    <thead><tr><th>Ref</th><th>Description</th><th>Property</th><th>Status</th><th class="numeric">Total</th><th class="numeric">Paid</th><th>Date</th></tr></thead>
                    <tbody>
                        ${invoices.map(inv => `<tr class="clickable-row" data-href="${AdminApp.detailUrl('invoice', inv.id)}">
                            <td>${escapeHtml(inv.reference)}</td>
                            <td>${escapeHtml(inv.description)}</td>
                            <td>${escapeHtml(inv.property_name)}</td>
                            <td>${statusBadge(inv.status, 'invoice')}</td>
                            <td class="numeric">${formatCurrency(inv.total)}</td>
                            <td class="numeric">${formatCurrency(inv.paid)}</td>
                            <td>${formatDate(inv.invoice_date)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
        }

        html += '</div>';

        html += '<div class="tab-panel" data-panel="activos"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="ingresos"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="gastos"><div class="tab-table-root"></div></div>';
        html += '</div>';

        el.innerHTML = html;

        AdminApp.initTabs(el, (tabName, tabContainer) => {
            switch (tabName) {
                case 'activos':
                    return new DataTable(tabContainer, {
                        entity: 'property', apiPath: '/properties',
                        defaultFilters: { owner_id: p.id },
                        columns: [
                            { key: 'property_name', label: 'Name' },
                            { key: 'address', label: 'Address' },
                            { key: 'status', label: 'Status', type: 'status' },
                            { key: 'rent', label: 'Rent', type: 'currency' },
                        ],
                        onRowClick: (row) => { AdminApp.navigateTo('property', row.id); }
                    });
                case 'ingresos':
                    return new DataTable(tabContainer, {
                        entity: 'billing', apiPath: '/invoices',
                        defaultFilters: { owner_id: p.id, type: 'income' }, showPeriodFilter: true,
                        columns: [
                            { key: 'reference', label: 'Ref' },
                            { key: 'description', label: 'Description' },
                            { key: 'property_name', label: 'Property' },
                            { key: 'status', label: 'Status', type: 'status' },
                            { key: 'total', label: 'Total', type: 'currency' },
                            { key: 'paid', label: 'Paid', type: 'currency' },
                            { key: 'invoice_date', label: 'Date' },
                        ],
                        onRowClick: (row) => { AdminApp.navigateTo('invoice', row.id); }
                    });
                case 'gastos':
                    return new DataTable(tabContainer, {
                        entity: 'expenses', apiPath: '/invoices',
                        defaultFilters: { owner_id: p.id, type: 'expense' }, showPeriodFilter: true,
                        columns: [
                            { key: 'reference', label: 'Ref' },
                            { key: 'description', label: 'Description' },
                            { key: 'property_name', label: 'Property' },
                            { key: 'expense_category', label: 'Category' },
                            { key: 'status', label: 'Status', type: 'status' },
                            { key: 'total', label: 'Total', type: 'currency' },
                            { key: 'invoice_date', label: 'Date' },
                        ],
                        onRowClick: (row) => { AdminApp.navigateTo('invoice', row.id); }
                    });
            }
        }, p);

        el.querySelector('#btn-edit-propietario')?.addEventListener('click', () => {
            const fp = new FormPanel({
                title: 'Owner',
                fields: [
                    { key: 'name', label: 'Full name', required: true },
                    { key: 'tax_id', label: 'Tax ID' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'address', label: 'Address' },
                    { key: 'bank_account', label: 'Bank account' },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/owners/${id}`, formData);
                    Toast.show('Owner updated');
                    renderOwnerDetail(container);
                }
            });
            fp.open(p);
        });
    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading owner: ${escapeHtml(e.message)}</div>`;
    }
}

AdminApp.renderOwnerDetail = renderOwnerDetail;

})(window.AdminApp);
(function(AdminApp) {

const {
    api, Toast, FormPanel, confirmAction,
    formatCurrency, formatDate,
    escapeHtml, statusBadge,
} = AdminApp;

async function renderDepositoDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const id = AdminApp.getIdFromUrl();
    if (!id) { el.innerHTML = '<div class="empty-state">No deposit specified.</div>'; return; }

    try {
        const data = await api.get(`/deposits/${id}/detail`);
        const d = data.deposito || data;

        let html = '';

        html += AdminApp.breadcrumb('deposits', 'Deposits', (d.tipo || 'Deposit') + ' \u2014 ' + (d.propiedad || ''));

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${escapeHtml(d.tipo || 'Deposit')}</h1>
                ${statusBadge(d.estado, 'deposito')}
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="btn-edit-deposito">Edit</button>
            </div>
        </div>`;

        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Amounts</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Total</span><span class="detail-value value-lg">${formatCurrency(d.total)}</span></div>
                    <div class="detail-field"><span class="detail-label">Paid</span><span class="detail-value">${formatCurrency(d.pagado)}</span></div>
                    <div class="detail-field"><span class="detail-label">Returned</span><span class="detail-value">${formatCurrency(d.devuelto)}</span></div>
                </div>
            </div>
            <div class="detail-info-section">
                <h3>Parties</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Payer</span><span class="detail-value">${escapeHtml(d.pagador)}</span></div>
                    <div class="detail-field"><span class="detail-label">Payee</span><span class="detail-value">${escapeHtml(d.receptor)}</span></div>
                    ${d.es_prop === 'true' || d.es_prop === true ? '<div class="detail-field"><span class="detail-label">Tipo</span><span class="detail-value"><span class="badge badge-amber">Owner</span></span></div>' : ''}
                </div>
            </div>
        </div>`;

        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Dates</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Date</span><span class="detail-value">${formatDate(d.fecha)}</span></div>
                    <div class="detail-field"><span class="detail-label">Payment date</span><span class="detail-value">${formatDate(d.fecha_pago)}</span></div>
                    <div class="detail-field"><span class="detail-label">Return date</span><span class="detail-value">${formatDate(d.fecha_devolucion)}</span></div>
                </div>
            </div>
            <div class="detail-info-section">
                <h3>Linked records</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Property</span><span class="detail-value">${AdminApp.entitySearchLink(d.propiedad, 'properties')}</span></div>
                    <div class="detail-field"><span class="detail-label">Contract</span><span class="detail-value">${AdminApp.entitySearchLink(d.contrato, 'contracts')}</span></div>
                </div>
            </div>
        </div>`;

        const certs = data.certificados || [];
        html += `<div class="detail-info-section mt-4">
            <div class="flex justify-between items-center mb-4">
                <h3>Certificates</h3>
                <label class="btn btn-secondary btn-sm clickable">
                    <input type="file" id="cert-file-input" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple class="hidden">
                    Upload certificate
                </label>
            </div>
            <div id="cert-drop-zone" class="cert-drop-zone">
                <p>Drag files here or use the button</p>
            </div>
            <div id="cert-list" class="cert-list">
                ${certs.length === 0 ? '<p class="text-tertiary text-sm">No certificates attached</p>' : ''}
                ${certs.map(c => AdminApp.renderCertificadoCard(c)).join('')}
            </div>
        </div>`;

        el.innerHTML = html;

        el.querySelector('#cert-file-input')?.addEventListener('change', async (e) => {
            for (const file of e.target.files) {
                await AdminApp.uploadCertificado(id, file);
            }
            renderDepositoDetail(container);
        });

        const dropZone = el.querySelector('#cert-drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
            dropZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                for (const file of e.dataTransfer.files) {
                    await AdminApp.uploadCertificado(id, file);
                }
                renderDepositoDetail(container);
            });
        }

        el.querySelectorAll('.cert-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const certId = btn.dataset.certId;
                const ok = await confirmAction('Delete certificate', 'This action cannot be undone.');
                if (ok) {
                    await api.del(`/deposit_certificates/${certId}`);
                    Toast.show('Certificate deleted');
                    renderDepositoDetail(container);
                }
            });
        });

        el.querySelector('#btn-edit-deposito')?.addEventListener('click', () => {
            const fp = new FormPanel({
                title: 'Deposit',
                fields: [
                    { key: 'fecha', label: 'Date', type: 'date', required: true },
                    { key: 'propiedad', label: 'Property', required: true },
                    { key: 'pagador', label: 'Payer', required: true },
                    { key: 'receptor', label: 'Payee', required: true },
                    { key: 'tipo', label: 'Type' },
                    { key: 'estado', label: 'Status', type: 'select', options: ['Pending', 'Paid', 'Returned', 'Official body'] },
                    { key: 'total', label: 'Amount', type: 'number', required: true },
                    { key: 'pagado', label: 'Paid', type: 'number' },
                    { key: 'devuelto', label: 'Returned', type: 'number' },
                    { key: 'fecha_pago', label: 'Payment date', type: 'date' },
                    { key: 'fecha_devolucion', label: 'Return date', type: 'date' },
                    { key: 'contrato', label: 'Contract ref' },
                    { key: 'es_prop', label: 'Prop', type: 'select', options: ['false', 'true'] },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/deposits/${id}`, formData);
                    Toast.show('Deposit updated');
                    renderDepositoDetail(container);
                }
            });
            fp.open(d);
        });
    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading deposit: ${escapeHtml(e.message)}</div>`;
    }
}

AdminApp.renderDepositoDetail = renderDepositoDetail;

})(window.AdminApp);
(function(AdminApp) {

const {
    api, Toast, FormPanel,
    formatCurrency, formatDate,
    escapeHtml, statusBadge,
} = AdminApp;

async function renderIncidenciaDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const id = AdminApp.getIdFromUrl();
    if (!id) { el.innerHTML = '<div class="empty-state">No issue specified.</div>'; return; }

    try {
        const d = await api.get(`/issues/${id}`);

        let html = '';

        html += AdminApp.breadcrumb('issues', 'Issues', d.titulo);

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${escapeHtml(d.titulo)}</h1>
                ${statusBadge(d.prioridad, 'incidencia')}
                ${statusBadge(d.estado, 'incidencia')}
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="btn-edit-incidencia">Edit</button>
            </div>
        </div>`;

        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Details</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Property</span><span class="detail-value">${AdminApp.entitySearchLink(d.activo, 'properties')}</span></div>
                    <div class="detail-field"><span class="detail-label">Cost</span><span class="detail-value">${formatCurrency(d.coste)}</span></div>
                    <div class="detail-field"><span class="detail-label">Created</span><span class="detail-value">${formatDate(d.created_at)}</span></div>
                    <div class="detail-field"><span class="detail-label">Updated</span><span class="detail-value">${formatDate(d.updated_at)}</span></div>
                </div>
            </div>
            ${d.descripcion ? `<div class="detail-info-section">
                <h3>Description</h3>
                <p class="note-text">${escapeHtml(d.descripcion)}</p>
            </div>` : ''}
        </div>`;

        el.innerHTML = html;

        el.querySelector('#btn-edit-incidencia')?.addEventListener('click', () => {
            const fp = new FormPanel({
                title: 'Issue',
                fields: [
                    { key: 'activo', label: 'Property', required: true },
                    { key: 'titulo', label: 'Title', required: true },
                    { key: 'descripcion', label: 'Description', type: 'textarea' },
                    { key: 'prioridad', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
                    { key: 'estado', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
                    { key: 'coste', label: 'Cost', type: 'number' },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/issues/${id}`, formData);
                    Toast.show('Issue updated');
                    renderIncidenciaDetail(container);
                }
            });
            fp.open(d);
        });
    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading issue: ${escapeHtml(e.message)}</div>`;
    }
}

AdminApp.renderIncidenciaDetail = renderIncidenciaDetail;

})(window.AdminApp);
(function(AdminApp) {

const {
    api, Toast, FormPanel,
    formatCurrency, formatDate,
    escapeHtml, statusBadge,
} = AdminApp;

async function renderRemesaDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const id = AdminApp.getIdFromUrl();
    if (!id) { el.innerHTML = '<div class="empty-state">No SEPA batch specified.</div>'; return; }

    try {
        const data = await api.get(`/sepa-batches/${id}/detail`);
        const r = data.remesa;
        const alquileres = data.alquileres || [];

        let html = '';

        html += AdminApp.breadcrumb('sepa_batches', 'SEPA Batches', r.nombre_remesa);

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${escapeHtml(r.nombre_remesa)}</h1>
                ${statusBadge(r.estado, 'remesa')}
            </div>
            <div class="header-actions">
                <select id="remesa-estado-select" class="inline-select">
                    ${['Pending','Sent','Completed','Returned'].map(e =>
                        `<option value="${e}" ${r.estado === e ? 'selected' : ''}>${e}</option>`
                    ).join('')}
                </select>
                <button class="btn btn-secondary" id="btn-edit-remesa">Edit</button>
            </div>
        </div>`;

        html += `<div class="detail-info-grid mb-0">
            <div class="detail-info-section">
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Batch name</span><span class="detail-value">${escapeHtml(r.nombre_remesa)}</span></div>
                </div>
            </div>
            <div class="detail-info-section">
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Collection date</span><span class="detail-value">${formatDate(r.fecha_cobro)}</span></div>
                </div>
            </div>
        </div>`;

        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Presenter</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(r.presentador_nombre)}</span></div>
                    <div class="detail-field"><span class="detail-label">Creditor ID</span><span class="detail-value">${escapeHtml(r.presentador_creditor_id) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Suffix</span><span class="detail-value">${escapeHtml(r.presentador_sufijo) || '-'}</span></div>
                </div>
            </div>
            <div class="detail-info-section">
                <h3>Receiver</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(r.receptor_nombre) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Suffix</span><span class="detail-value">${escapeHtml(r.receptor_sufijo) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">SWIFT/BIC</span><span class="detail-value">${escapeHtml(r.receptor_swift_bic) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Creditor ID</span><span class="detail-value">${escapeHtml(r.receptor_creditor_id) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">IBAN</span><span class="detail-value">${escapeHtml(r.receptor_iban) || '-'}</span></div>
                </div>
            </div>
        </div>`;

        html += `<div class="detail-info-section mt-4">
            <div class="flex justify-between items-center mb-3">
                <h3 class="m-0">Rentals (${alquileres.length})</h3>
            </div>`;

        if (alquileres.length > 0) {
            html += `<div class="overflow-x-auto">
            <table class="data-table detail-data-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Property</th>
                        <th>Contract</th>
                        <th>Payer</th>
                        <th class="text-right">Count</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${alquileres.map(item => `
                        <tr class="clickable-row" data-href="${AdminApp.detailUrl('invoice', item.id)}">
                            <td>${escapeHtml(item.concepto || item.referencia)}</td>
                            <td>${escapeHtml(item.activo)}</td>
                            <td>${escapeHtml(item.contrato) || '-'}</td>
                            <td>${escapeHtml(item.pagador)}</td>
                            <td class="text-right text-semibold">${formatCurrency(item.total)}</td>
                            <td>${statusBadge(item.estado, 'contabilidad')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>`;
        } else {
            html += `<p class="text-tertiary text-14">No rentals linked to this batch.</p>`;
        }

        const totalRegistros = r.total_registros || alquileres.length;
        const totalCantidad = r.total_cantidad || alquileres.reduce((s, a) => s + (parseFloat(a.total) || 0), 0);
        html += `<div class="summary-row">
            <div><strong>Total records:</strong> ${totalRegistros}</div>
            <div><strong>Total amount:</strong> ${formatCurrency(totalCantidad)}</div>
        </div>`;

        html += `</div>`;

        if (r.notas) {
            html += `<div class="detail-info-section mt-4"><h3>Notes</h3><p class="note-text">${escapeHtml(r.notas)}</p></div>`;
        }

        el.innerHTML = html;

        el.querySelector('#remesa-estado-select')?.addEventListener('change', async (e) => {
            try {
                await api.put(`/sepa-batches/${id}`, { estado: e.target.value });
                Toast.show('Status updated');
                renderRemesaDetail(container);
            } catch (err) {
                Toast.show('Error: ' + err.message, 'error');
            }
        });

        el.querySelector('#btn-edit-remesa')?.addEventListener('click', () => {
            const fp = new FormPanel({
                title: 'SEPA Batch',
                fields: [
                    { key: 'nombre_remesa', label: 'Batch name', required: true },
                    { key: 'fecha_cobro', label: 'Collection date', type: 'date', required: true },
                    { key: 'estado', label: 'Status', type: 'select', options: ['Pending', 'Sent', 'Completed', 'Returned'] },
                    { key: 'presentador_nombre', label: 'Presenter (name)', required: true },
                    { key: 'presentador_creditor_id', label: 'Creditor ID' },
                    { key: 'presentador_sufijo', label: 'Suffix' },
                    { key: 'receptor_nombre', label: 'Receiver (name)' },
                    { key: 'receptor_iban', label: 'Receptor IBAN' },
                    { key: 'receptor_swift_bic', label: 'Receptor SWIFT/BIC' },
                    { key: 'notas', label: 'Notes', type: 'textarea' },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/sepa-batches/${id}`, formData);
                    Toast.show('Batch updated');
                    renderRemesaDetail(container);
                }
            });
            fp.open(r);
        });
    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading SEPA batch: ${escapeHtml(e.message)}</div>`;
    }
}

AdminApp.renderRemesaDetail = renderRemesaDetail;

})(window.AdminApp);
(function(AdminApp) {

const {
    api, Toast, FormPanel,
    formatCurrency, formatDate,
    escapeHtml, statusBadge,
} = AdminApp;

async function renderLeadDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const id = AdminApp.getIdFromUrl();
    if (!id) { el.innerHTML = '<div class="empty-state">No lead specified.</div>'; return; }

    try {
        const d = await api.get(`/leads/${id}`);

        let html = '';

        html += AdminApp.breadcrumb('leads', 'Leads', d.nombre);

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${escapeHtml(d.nombre)}</h1>
                ${d.estado ? statusBadge(d.estado, 'incidencia') : ''}
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="btn-edit-lead">Edit</button>
            </div>
        </div>`;

        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Contact</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(d.nombre)}</span></div>
                    <div class="detail-field"><span class="detail-label">Email</span><span class="detail-value">${d.email ? `<a href="mailto:${escapeHtml(d.email)}" class="text-accent">${escapeHtml(d.email)}</a>` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Phone</span><span class="detail-value">${d.telefono ? `<a href="tel:${escapeHtml(d.telefono)}" class="text-accent">${escapeHtml(d.telefono)}</a>` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Company</span><span class="detail-value">${escapeHtml(d.empresa) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Source</span><span class="detail-value">${d.origen ? `<span class="badge badge-blue">${escapeHtml(d.origen)}</span>` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Assigned to</span><span class="detail-value">${escapeHtml(d.asignado_a) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Score</span><span class="detail-value">${d.puntuacion != null ? d.puntuacion : '-'}</span></div>
                </div>
            </div>
            <div class="detail-info-section">
                <h3>Interest</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Tipo</span><span class="detail-value">${d.interes ? `<span class="badge badge-blue">${escapeHtml(d.interes)}</span>` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Property</span><span class="detail-value">${AdminApp.entitySearchLink(d.activo, 'properties')}</span></div>
                    <div class="detail-field"><span class="detail-label">Budget</span><span class="detail-value">${d.presupuesto_min || d.presupuesto_max ? `${formatCurrency(d.presupuesto_min)} \u2014 ${formatCurrency(d.presupuesto_max)}` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Min bedrooms</span><span class="detail-value">${d.habitaciones_min || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Min sq ft</span><span class="detail-value">${d.m2_minimo || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Preferred area</span><span class="detail-value">${escapeHtml(d.zona_preferida) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Next follow-up</span><span class="detail-value">${formatDate(d.fecha_seguimiento)}</span></div>
                </div>
            </div>
        </div>`;

        if (d.notas) {
            html += `<div class="detail-info-section"><h3>General notes</h3><p class="note-text">${escapeHtml(d.notas)}</p></div>`;
        }

        html += `<div class="detail-info-section mt-6">
            <h3>Activity</h3>
            <div class="mb-4">
                <select id="lead-nota-tipo" class="note-select">
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="visit">Visit</option>
                    <option value="task">Task</option>
                    <option value="other">Other</option>
                </select>
                <textarea id="lead-nota-contenido" placeholder="Write a note..." rows="3" class="note-textarea"></textarea>
                <button id="lead-nota-submit" class="btn btn-primary mt-2">Add note</button>
            </div>
            <div id="lead-notes-list"></div>
        </div>`;

        el.innerHTML = html;

        async function loadNotes() {
            const list = el.querySelector('#lead-notes-list');
            try {
                const res = await api.get(`/lead_notas?lead_id=${id}&per_page=100&sort=created_at&order=desc`);
                const notas = res.data || [];
                if (notas.length === 0) {
                    list.innerHTML = '<p class="text-tertiary">No notes yet.</p>';
                    return;
                }
                list.innerHTML = `<div class="activity-feed max-h-none">${notas.map(n => {
                    const fecha = new Date(n.created_at).toLocaleString('en-GB');
                    return `<div class="activity-item items-start">
                        <span class="activity-icon activity-blue">${{'note':'N','call':'T','email':'@','visit':'V','task':'!','other':'?'}[n.tipo] || 'N'}</span>
                        <div class="activity-content flex-1">
                            <div class="flex items-center gap-2">
                                <span class="badge badge-blue">${escapeHtml(n.tipo || 'note')}</span>
                                ${n.autor ? `<span class="text-tertiary text-xs">${escapeHtml(n.autor)}</span>` : ''}
                                <span class="activity-time ml-auto">${fecha}</span>
                            </div>
                            <p class="mt-2 mb-0 text-wrap">${escapeHtml(n.contenido)}</p>
                        </div>
                    </div>`;
                }).join('')}</div>`;
            } catch (e) {
                list.innerHTML = `<p class="text-danger">${escapeHtml(e.message)}</p>`;
            }
        }

        loadNotes();

        el.querySelector('#lead-nota-submit')?.addEventListener('click', async () => {
            const contenido = el.querySelector('#lead-nota-contenido').value.trim();
            if (!contenido) { Toast.show('Write something', 'error'); return; }
            const tipo = el.querySelector('#lead-nota-tipo').value;
            try {
                await api.post('/lead_notes', { lead_id: id, tipo, contenido });
                el.querySelector('#lead-nota-contenido').value = '';
                Toast.show('Note added');
                loadNotes();
            } catch (e) { Toast.show(e.message, 'error'); }
        });

        el.querySelector('#btn-edit-lead')?.addEventListener('click', () => {
            const fp = new FormPanel({
                title: 'Lead',
                fields: [
                    { key: 'nombre', label: 'Name', required: true },
                    { key: 'email', label: 'Email' },
                    { key: 'telefono', label: 'Phone' },
                    { key: 'empresa', label: 'Company' },
                    { key: 'origen', label: 'Source', type: 'select', options: ['direct', 'web', 'referral', 'portal', 'phone', 'email', 'other'] },
                    { key: 'estado', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation', 'Won', 'Lost', 'Archived'] },
                    { key: 'interes', label: 'Interest', type: 'select', options: ['rental', 'purchase', 'investment', 'other'] },
                    { key: 'activo', label: 'Property of interest', type: 'asyncSelect', asyncOptions: '/properties/names' },
                    { key: 'presupuesto_min', label: 'Min budget', type: 'number' },
                    { key: 'presupuesto_max', label: 'Max budget', type: 'number' },
                    { key: 'zona_preferida', label: 'Preferred area' },
                    { key: 'fecha_seguimiento', label: 'Next follow-up', type: 'date' },
                    { key: 'asignado_a', label: 'Assigned to' },
                    { key: 'puntuacion', label: 'Score (0-100)', type: 'number' },
                    { key: 'notas', label: 'Notes', type: 'textarea' },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/leads/${id}`, formData);
                    Toast.show('Lead updated');
                    renderLeadDetail(container);
                }
            });
            fp.open(d);
        });
    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading lead: ${escapeHtml(e.message)}</div>`;
    }
}

AdminApp.renderLeadDetail = renderLeadDetail;

})(window.AdminApp);
(function(AdminApp) {

const {
    api, Toast,
    formatCurrency, formatCurrencyValue,
    formatDate, timeAgo, daysUntil,
    escapeHtml, statusBadge,
    progressBar, stringToColor,
    rateColor
} = AdminApp;

function renderOwnerTable(owners) {
    return `
        <h2 class="section-title">Financial summary by owner</h2>
        <div class="table-container mb-6">
            <table class="data-table">
                <thead><tr>
                    <th>Owner</th><th class="numeric">Properties</th><th class="numeric">Invoiced</th><th class="numeric">Collected</th><th class="numeric">Outstanding</th>
                </tr></thead>
                <tbody>
                    ${owners.map(p => `
                        <tr class="clickable-row" data-href="${AdminApp.detailUrl('owner', p.owner_id)}">
                            <td>${escapeHtml(p.owner_name)}</td>
                            <td class="numeric">${p.num_properties || 0}</td>
                            <td class="numeric">${formatCurrency(p.total_invoiced)}</td>
                            <td class="numeric">${formatCurrency(p.total_collected)}</td>
                            <td class="numeric${parseFloat(p.total_outstanding || 0) > 0 ? ' numeric-danger' : ''}">${formatCurrency(p.total_outstanding)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>`;
}

function renderPropertyFinancialTable(properties, totals) {
    const totalInvoices = properties.reduce((s, a) => s + (a.num_invoices || 0), 0);
    const overallRate = totals.collection_rate || 0;
    const overallRateColor = rateColor(overallRate);

    return `
        <h2 class="section-title">Financial summary by property</h2>
        <div class="table-container mb-6">
            <table class="data-table">
                <thead><tr>
                    <th>Property</th><th class="numeric">Invoiced</th><th class="numeric">Collected</th><th class="numeric">Outstanding</th><th class="rate-col">% Collected</th><th class="numeric">Invoices</th>
                </tr></thead>
                <tbody>
                    ${properties.map(a => {
                        const f = parseFloat(a.total_invoiced || 0);
                        const c = parseFloat(a.total_collected || 0);
                        const p = parseFloat(a.total_outstanding || 0);
                        const r = f > 0 ? (c / f * 100) : 0;
                        const avatarColor = stringToColor(a.property_name);
                        const initial = (a.property_name || '?').charAt(0).toUpperCase();
                        const detailHref = a.id ? AdminApp.detailUrl('property', a.id) : AdminApp.listUrl('properties', {search: a.property_name});
                        return `
                        <tr class="clickable-row" data-href="${detailHref}">
                            <td><div class="property-cell"><div class="property-avatar" style="background:${avatarColor}">${initial}</div><span class="property-name">${escapeHtml(a.property_name)}</span></div></td>
                            <td class="numeric">${formatCurrency(f)}</td>
                            <td class="numeric">${formatCurrency(c)}</td>
                            <td class="numeric${p > 0 ? ' numeric-danger' : ''}">${formatCurrency(p)}</td>
                            <td class="rate-col">${progressBar(r, rateColor(r))} <small>${r.toFixed(0)}%</small></td>
                            <td class="numeric"><a href="${AdminApp.listUrl('billing', {search: a.property_name})}" class="invoice-link">${a.num_invoices || 0}</a></td>
                        </tr>`;
                    }).join('')}
                </tbody>
                <tfoot>
                    <tr class="summary-row clickable-row" data-href="${AdminApp.listUrl('billing')}">
                        <td><strong>All properties (${properties.length})</strong></td>
                        <td class="numeric"><strong>${formatCurrency(totals.total_invoiced)}</strong></td>
                        <td class="numeric"><strong>${formatCurrency(totals.total_collected)}</strong></td>
                        <td class="numeric${parseFloat(totals.total_outstanding) > 0 ? ' text-danger' : ''}"><strong>${formatCurrency(totals.total_outstanding)}</strong></td>
                        <td class="rate-col">${progressBar(overallRate, overallRateColor)} <small><strong>${overallRate.toFixed(0)}%</strong></small></td>
                        <td class="numeric"><strong>${totalInvoices}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>`;
}

function renderDashboardKPIs(data) {
    const rate = data.collection_rate || 0;
    const rc = rateColor(rate);
    const rented = data.properties_by_status.find(e => e.status === 'Rented')?.count || 0;
    const vacant = data.properties_by_status.find(e => e.status === 'Vacant')?.count || 0;
    const ms = data.month_summary || {};
    const ys = data.year_summary || {};
    const monthRate = parseFloat(ms.total_invoiced || 0) > 0
        ? (parseFloat(ms.total_collected || 0) / parseFloat(ms.total_invoiced || 0) * 100) : 0;
    const yearRate = parseFloat(ys.total_invoiced || 0) > 0
        ? (parseFloat(ys.total_collected || 0) / parseFloat(ys.total_invoiced || 0) * 100) : 0;
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const now = new Date();
    const currentMonth = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();

    return `
        <!-- Row 1: Current Month & Current Year -->
        <div class="dashboard-grid dashboard-grid-2col">
            <div class="stat-card clickable-row" data-href="${AdminApp.listUrl('billing')}">
                <div class="label">${currentMonth} ${currentYear}</div>
                <div class="value currency">${formatCurrencyValue(ms.total_invoiced)}</div>
                <div class="kpi-subtitle">${formatCurrency(ms.total_collected)} collected &middot; ${formatCurrency(ms.total_outstanding)} outstanding &middot; ${ms.num_invoices || 0} invoices</div>
                <div class="mt-2">${progressBar(monthRate, rateColor(monthRate))} <small>${monthRate.toFixed(0)}% collected</small></div>
            </div>
            <div class="stat-card clickable-row" data-href="${AdminApp.listUrl('billing')}">
                <div class="label">Year ${currentYear}</div>
                <div class="value currency">${formatCurrencyValue(ys.total_invoiced)}</div>
                <div class="kpi-subtitle">${formatCurrency(ys.total_collected)} collected &middot; ${formatCurrency(ys.total_outstanding)} outstanding &middot; ${ys.num_invoices || 0} invoices</div>
                <div class="mt-2">${progressBar(yearRate, rateColor(yearRate))} <small>${yearRate.toFixed(0)}% collected</small></div>
            </div>
        </div>

        <!-- Row 2: Portfolio summary -->
        <div class="dashboard-grid">
            <div class="stat-card clickable-row" data-href="${AdminApp.listUrl('properties')}">
                <div class="label">Properties</div>
                <div class="value">${data.total_properties}</div>
                <div class="kpi-subtitle">${rented} rented, ${vacant} vacant</div>
            </div>
            <div class="stat-card success">
                <div class="label">Active contracts</div>
                <div class="value">${data.num_active_contracts}</div>
                <div class="kpi-subtitle">${formatCurrencyValue(data.total_monthly_rent)}/mo</div>
            </div>
            <div class="stat-card clickable-row" data-href="${AdminApp.listUrl('billing')}">
                <div class="label">Collection rate</div>
                <div class="value">${rate.toFixed(1)}%</div>
                <div class="kpi-subtitle">${formatCurrency(data.total_collected)} of ${formatCurrency(data.total_invoiced)}</div>
                <div class="mt-2">${progressBar(rate, rc)}</div>
            </div>
            <div class="stat-card ${data.overdue_count > 0 ? 'error' : ''} clickable-row" data-href="${AdminApp.listUrl('overdue')}">
                <div class="label">Overdue &gt;30d</div>
                <div class="value">${data.overdue_count}</div>
                <div class="kpi-subtitle">${data.overdue_count} invoice${data.overdue_count !== 1 ? 's' : ''} overdue</div>
            </div>
        </div>`;
}

function renderDashboardAlerts(data) {
    const hasOverdue = data.overdue_invoices && data.overdue_invoices.length > 0;
    const hasExpiring = data.expiring_leases && data.expiring_leases.length > 0;
    if (!hasOverdue && !hasExpiring) return '';

    let html = '<div class="alerts-row">';

    if (hasOverdue) {
        html += `
        <div class="alert-section alert-danger">
            <h3>Overdue invoices &gt;30d (${data.overdue_invoices.length})</h3>
            <div class="alert-list">
                ${data.overdue_invoices.map(inv => `
                    <div class="alert-item clickable-row" data-href="${AdminApp.detailUrl('invoice', inv.id)}">
                        <div class="alert-item-main">
                            <span class="alert-item-title">${escapeHtml(inv.property_name)}</span>
                            <span class="alert-item-subtitle">${escapeHtml(inv.reference)} &mdash; ${escapeHtml(inv.description)}</span>
                        </div>
                        <div class="alert-item-value">${formatCurrency(parseFloat(inv.total || 0) - parseFloat(inv.paid || 0))}</div>
                    </div>
                `).join('')}
            </div>
            <a href="${AdminApp.listUrl('overdue')}" class="alert-link">View all overdue &rarr;</a>
        </div>`;
    }

    if (hasExpiring) {
        html += `
        <div class="alert-section alert-warning">
            <h3>Expiring contracts (${data.expiring_leases.length})</h3>
            <div class="alert-list">
                ${data.expiring_leases.map(a => {
                    const days = daysUntil(a.end_date);
                    const detailUrl = a.id ? AdminApp.detailUrl('property', a.id) : AdminApp.listUrl('properties');
                    return `
                    <div class="alert-item clickable-row" data-href="${detailUrl}">
                        <div class="alert-item-main">
                            <span class="alert-item-title">${escapeHtml(a.property_name)}</span>
                            <span class="alert-item-subtitle">${escapeHtml(a.address)}</span>
                        </div>
                        <div class="alert-item-value">${days != null ? `${days}d` : '-'}<br><small>${formatDate(a.end_date)}</small></div>
                    </div>`;
                }).join('')}
            </div>
            <a href="${AdminApp.listUrl('contracts')}" class="alert-link">View all contracts &rarr;</a>
        </div>`;
    }

    html += '</div>';
    return html;
}

function renderDashboardStatus(data) {
    return `
        <div>
            <h2 class="section-title" id="status-section">Properties by status</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead><tr><th>Status</th><th>Count</th><th>Distribution</th></tr></thead>
                    <tbody>
                        ${data.properties_by_status.map(e => {
                            const pct = data.total_properties > 0 ? (e.count / data.total_properties * 100) : 0;
                            const color = {'Rented':'green','Occupied':'amber','Vacant':'gray','Under Renovation':'blue','Reserved':'blue'}[e.status] || 'gray';
                            return `
                            <tr class="clickable-row" data-href="${AdminApp.listUrl('properties', {status: e.status})}">
                                <td>${statusBadge(e.status, 'property')}</td>
                                <td>${e.count}</td>
                                <td class="progress-cell">${progressBar(pct, color)} <small class="text-muted">${pct.toFixed(0)}%</small></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

function renderDashboardActivity(data) {
    if (!data.recent_activity || data.recent_activity.length === 0) return '';

    return `
        <div>
            <h2 class="section-title" id="activity-section">Recent activity</h2>
            <div class="activity-feed">
                ${data.recent_activity.map(a => {
                    const actionIcon = {'create': '\u002B', 'update': '\u270E', 'delete': '\u2212'}[a.action] || '\u2022';
                    const actionColor = {'create': 'green', 'update': 'amber', 'delete': 'red'}[a.action] || 'gray';
                    const detailUrl = AdminApp.detailUrl(a.entity_type, a.entity_id);
                    const clickAttr = detailUrl ? `data-href="${detailUrl}"` : '';
                    return `
                    <div class="activity-item${detailUrl ? ' clickable-row' : ''}" ${clickAttr}>
                        <span class="activity-icon activity-${actionColor}">${actionIcon}</span>
                        <div class="activity-content">
                            <span class="activity-text"><strong>${a.action}</strong> ${escapeHtml(a.entity_type)} <span class="text-muted">${escapeHtml(a.entity_id?.substring(0,8))}...</span>${a.user ? ` <span class="text-tertiary text-xs">${escapeHtml(a.user)}</span>` : ''}</span>
                            <span class="activity-time">${timeAgo(a.created_at)}</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
}

async function renderDashboard(container) {
    try {
        const data = await api.get('/dashboard');
        const el = typeof container === 'string' ? document.querySelector(container) : container;

        let html = '';
        html += renderDashboardKPIs(data);
        if (data.financial_by_owner?.length > 0) html += renderOwnerTable(data.financial_by_owner);
        html += renderDashboardAlerts(data);
        html += '<div class="dashboard-two-col">';
        html += renderDashboardStatus(data);
        html += renderDashboardActivity(data);
        html += '</div>';
        if (data.financial_by_property.length > 0) html += renderPropertyFinancialTable(data.financial_by_property, data);
        el.innerHTML = html;
    } catch (e) {
        Toast.show('Error loading dashboard: ' + e.message, 'error');
    }
}

Object.assign(AdminApp, {
    renderDashboard,
    renderOwnerTable,
    renderActivoFinancialTable: renderPropertyFinancialTable,
    renderPropertyFinancialTable,
});

})(window.AdminApp);
(function(AdminApp) {

const {
    api, Toast,
    formatCurrency, formatCurrencyValue,
    escapeHtml,
    progressBar, stringToColor,
    rateColor,
} = AdminApp;

function renderFinancialKPIs(dashboard) {
    const rate = dashboard.collection_rate || 0;
    const rc = rateColor(rate);

    return `
        <div class="dashboard-grid">
            <div class="stat-card">
                <div class="label">Total invoiced</div>
                <div class="value currency">${formatCurrencyValue(dashboard.total_invoiced)}</div>
                <div class="kpi-subtitle">All properties</div>
            </div>
            <div class="stat-card success">
                <div class="label">Total collected</div>
                <div class="value currency">${formatCurrencyValue(dashboard.total_collected)}</div>
                <div class="kpi-subtitle">${rate.toFixed(1)}% collection rate</div>
                <div class="mt-2">${progressBar(rate, rc)}</div>
            </div>
            <div class="stat-card ${dashboard.overdue_count > 0 ? 'error' : ''}">
                <div class="label">Total outstanding</div>
                <div class="value currency">${formatCurrencyValue(dashboard.total_outstanding)}</div>
                <div class="kpi-subtitle">${dashboard.overdue_count} invoice${dashboard.overdue_count !== 1 ? 's' : ''} unpaid</div>
            </div>
            <div class="stat-card">
                <div class="label">Collection rate</div>
                <div class="value">${rate.toFixed(1)}%</div>
                <div class="kpi-subtitle">${rc === 'green' ? 'Healthy' : rc === 'amber' ? 'Needs attention' : 'Critical'}</div>
            </div>
        </div>`;
}

function renderRentabilidadTable(rentabilidad) {
    if (rentabilidad.length === 0) return '';

    rentabilidad.sort((a, b) => parseFloat(b.neto || 0) - parseFloat(a.neto || 0));
    return `
        <h2 class="section-title">Profitability by property</h2>
        <div class="table-container mb-8">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Property</th><th class="numeric">Income</th><th class="numeric">Expenses</th>
                        <th class="numeric">Net profit</th><th class="rate-col">Margin</th>
                    </tr>
                </thead>
                <tbody>
                    ${rentabilidad.map(r => {
                        const neto = parseFloat(r.neto || 0);
                        const margin = r.margin_pct != null ? r.margin_pct : 0;
                        const marginColor = margin > 50 ? 'green' : margin > 20 ? 'amber' : 'red';
                        return `
                        <tr>
                            <td><div class="property-cell"><div class="property-avatar" style="background:${stringToColor(r.property_name)}">${(r.property_name || '?').charAt(0).toUpperCase()}</div><span class="property-name">${escapeHtml(r.property_name)}</span></div></td>
                            <td class="numeric">${formatCurrency(r.total_income)}</td>
                            <td class="numeric">${formatCurrency(r.total_expenses)}</td>
                            <td class="numeric${neto < 0 ? ' numeric-danger' : neto > 0 ? ' text-success text-semibold' : ''}">${formatCurrency(neto)}</td>
                            <td class="rate-col">${progressBar(Math.max(0, margin), marginColor)} <small>${margin.toFixed(1)}%</small></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;
}

async function renderExpenseBreakdown() {
    try {
        const expenses = await api.get('/invoices?type=expense&per_page=500');
        const items = expenses.data || [];
        if (items.length === 0) return '';

        const byProperty = {};
        items.forEach(inv => {
            const key = inv.property_name || 'Unknown';
            if (!byProperty[key]) byProperty[key] = { total: 0, count: 0, paid: 0 };
            byProperty[key].total += parseFloat(inv.total || 0);
            byProperty[key].paid += parseFloat(inv.paid || 0);
            byProperty[key].count += 1;
        });
        const sorted = Object.entries(byProperty).sort((a, b) => b[1].total - a[1].total);
        const grandTotal = sorted.reduce((s, [, v]) => s + v.total, 0);

        return `
            <h2 class="section-title">Expense breakdown by property</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead><tr>
                        <th>Property</th><th class="numeric">Total expenses</th><th class="numeric">Paid</th><th class="numeric">Invoices</th><th class="rate-col">Share</th>
                    </tr></thead>
                    <tbody>
                        ${sorted.map(([propertyName, v]) => {
                            const pct = grandTotal > 0 ? (v.total / grandTotal * 100) : 0;
                            return `
                            <tr>
                                <td><div class="property-cell"><div class="property-avatar" style="background:${stringToColor(propertyName)}">${propertyName.charAt(0).toUpperCase()}</div><span class="property-name">${escapeHtml(propertyName)}</span></div></td>
                                <td class="numeric">${formatCurrency(v.total)}</td>
                                <td class="numeric">${formatCurrency(v.paid)}</td>
                                <td class="numeric">${v.count}</td>
                                <td class="rate-col">${progressBar(pct, 'amber')} <small>${pct.toFixed(0)}%</small></td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>`;
    } catch (_) {
        return '';
    }
}

async function renderFinancial(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;

    try {
        const [dashboard, profitability] = await Promise.all([
            api.get('/dashboard'),
            api.get('/reports/profitability')
        ]);

        let html = '';
        html += renderFinancialKPIs(dashboard);
        html += renderRentabilidadTable(profitability);
        if (dashboard.financial_by_owner?.length > 0) html += AdminApp.renderOwnerTable(dashboard.financial_by_owner);
        if (dashboard.financial_by_property.length > 0) html += AdminApp.renderActivoFinancialTable(dashboard.financial_by_property, dashboard);
        html += await renderExpenseBreakdown();
        el.innerHTML = html;
    } catch (e) {
        Toast.show('Error loading financial data: ' + e.message, 'error');
        el.innerHTML = '<div class="empty-center">Error loading financial data.</div>';
    }
}

AdminApp.renderFinancial = renderFinancial;

})(window.AdminApp);
(function(AdminApp) {

const {
    api, Toast,
    timeAgo,
    escapeHtml,
    progressBar,
} = AdminApp;

async function renderAudit(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;

    try {
        const entries = await api.get('/audit/recent?limit=500');

        const total = entries.length;
        const byAction = { create: 0, update: 0, delete: 0 };
        const byEntity = {};
        entries.forEach(e => {
            byAction[e.action] = (byAction[e.action] || 0) + 1;
            byEntity[e.entity_type] = (byEntity[e.entity_type] || 0) + 1;
        });

        let html = '';

        html += `
            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="label">Total records</div>
                    <div class="value">${total}</div>
                    <div class="kpi-subtitle">Audit records</div>
                </div>
                <div class="stat-card success">
                    <div class="label">Creates</div>
                    <div class="value">${byAction.create || 0}</div>
                    <div class="kpi-subtitle">${total > 0 ? ((byAction.create || 0) / total * 100).toFixed(0) : 0}% of total</div>
                </div>
                <div class="stat-card">
                    <div class="label">Updates</div>
                    <div class="value">${byAction.update || 0}</div>
                    <div class="kpi-subtitle">${total > 0 ? ((byAction.update || 0) / total * 100).toFixed(0) : 0}% of total</div>
                </div>
                <div class="stat-card error">
                    <div class="label">Deletes</div>
                    <div class="value">${byAction.delete || 0}</div>
                    <div class="kpi-subtitle">${total > 0 ? ((byAction.delete || 0) / total * 100).toFixed(0) : 0}% of total</div>
                </div>
            </div>`;

        const entityTypes = Object.entries(byEntity).sort((a, b) => b[1] - a[1]);
        if (entityTypes.length > 0) {
            html += `
                <h2 class="section-title">Activity by entity type</h2>
                <div class="table-container mb-8">
                    <table class="data-table">
                        <thead><tr><th>Entity type</th><th class="numeric">Count</th><th class="rate-col">Distribution</th></tr></thead>
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

        const entityTypeOptions = Object.keys(byEntity).sort();
        html += `
            <h2 class="section-title">Timeline</h2>
            <div class="toolbar mb-4">
                <select class="filter-select" id="audit-entity-filter">
                    <option value="">All types</option>
                    ${entityTypeOptions.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
                <select class="filter-select" id="audit-action-filter">
                    <option value="">All actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                </select>
                <span id="audit-filter-count" class="text-sm text-tertiary ml-auto"></span>
            </div>`;

        html += '<div id="audit-timeline"></div>';

        el.innerHTML = html;

        function renderTimeline(items) {
            const timeline = document.getElementById('audit-timeline');
            const countEl = document.getElementById('audit-filter-count');
            countEl.textContent = `${items.length} de ${total} records`;

            if (items.length === 0) {
                timeline.innerHTML = '<div class="empty-center">No hay records con los filtros selecteds.</div>';
                return;
            }

            timeline.innerHTML = `
                <div class="activity-feed max-h-none">
                    ${items.map(e => {
                        const actionIcon = {'create': '+', 'update': '\u270E', 'delete': '\u2212'}[e.action] || '\u2022';
                        const actionColor = {'create': 'green', 'update': 'amber', 'delete': 'red'}[e.action] || 'gray';
                        const shortId = e.entity_id ? e.entity_id.substring(0, 8) : '';

                        let diffHtml = '';
                        if (e.action === 'create') {
                            diffHtml = '<div class="mt-2"><span class="badge badge-green">Record created</span></div>';
                        } else if (e.action === 'delete') {
                            diffHtml = '<div class="mt-2"><span class="badge badge-red">Record deleted</span></div>';
                        } else if (e.changed_fields && e.changed_fields.length > 0) {
                            diffHtml = '<div class="mt-2">' +
                                e.changed_fields.map(field => {
                                    const oldVal = e.old_values ? e.old_values[field] : null;
                                    const newVal = e.new_values ? e.new_values[field] : null;
                                    return '<div class="diff-field-row">' +
                                        '<span class="diff-field-name">' + escapeHtml(field) + '</span>' +
                                        (oldVal != null ? '<span class="text-danger line-through">' + escapeHtml(String(oldVal)) + '</span> ' : '') +
                                        '<span class="text-success">' + escapeHtml(String(newVal)) + '</span>' +
                                    '</div>';
                                }).join('') +
                            '</div>';
                        }

                        return `
                        <div class="activity-item items-start">
                            <span class="activity-icon activity-${actionColor}">${actionIcon}</span>
                            <div class="activity-content flex-1">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="badge badge-blue">${escapeHtml(e.entity_type)}</span>
                                    <span class="badge badge-${actionColor}">${escapeHtml(e.action)}</span>
                                    <span class="text-tertiary text-xs font-mono">${escapeHtml(shortId)}...</span>
                                    ${e.usuario ? `<span class="text-muted text-xs">${escapeHtml(e.usuario)}</span>` : ''}
                                    <span class="activity-time ml-auto">${timeAgo(e.created_at)}</span>
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

        renderTimeline(entries);
    } catch (e) {
        Toast.show('Error loading audit datage, 'error');
        el.innerHTML = '<div class="empty-center">Error loading audit data.</div>';
    }
}

AdminApp.renderAudit = renderAudit;

})(window.AdminApp);
(function(AdminApp) {

const {
    api, Toast, escapeHtml,
    statusBadge, formatCurrency,
    formatDate, progressBar
} = AdminApp;

const PropertyPresentation = {
    overlay: null,
    lightbox: null,
    images: [],
    currentIndex: 0,
    _keyHandler: null,

    async open(activoId) {
        try {
            const data = await api.get(`/properties/${activoId}/detail`);
            const a = data.property;
            const f = data.financial;
            const images = data.images || [];
            this.images = images;
            this.currentIndex = 0;

            const overlay = document.createElement('div');
            overlay.className = 'presentation-overlay';
            overlay.innerHTML = `
                <div class="presentation-modal">
                    <div class="presentation-header">
                        <h2>${escapeHtml(a.property_name)}</h2>
                        ${statusBadge(a.status, 'property')}
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
            AdminApp.ScrollLock.lock();

            requestAnimationFrame(() => overlay.classList.add('active'));

            overlay.querySelector('.presentation-close').addEventListener('click', () => this.close());
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.close();
            });

            overlay.querySelectorAll('.gallery-thumbnail').forEach((img, i) => {
                img.addEventListener('click', () => this.openLightbox(i));
            });

            this._keyHandler = (e) => this._handleKey(e);
            document.addEventListener('keydown', this._keyHandler);
        } catch (e) {
            Toast.show('Error loading property: ' + e.message, 'error');
        }
    },

    _renderGallery(images) {
        if (images.length === 0) {
            return '<div class="gallery-empty">No photos available</div>';
        }
        return `
            <div class="gallery-grid">
                ${images.map((img, i) => `<div class="gallery-thumb-wrapper">
                    <img class="gallery-thumbnail" src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename)}" loading="lazy" data-index="${i}">
                    ${img.is_primary ? '<span class="gallery-primary-badge">&#9733;</span>' : ''}
                </div>`).join('')}
            </div>
            <div class="gallery-count">${images.length} photo${images.length !== 1 ? 's' : ''}</div>`;
    },

    _renderDetails(a, f) {
        let html = '';

        html += `<div class="presentation-info-group">
            <h4>Location</h4>
            <div class="presentation-info-row"><span class="label">Address</span><span class="value">${escapeHtml(a.address)}</span></div>
            ${a.cadastral_ref ? `<div class="presentation-info-row"><span class="label">Cadastral ref</span><span class="value">${escapeHtml(a.cadastral_ref)}</span></div>` : ''}
        </div>`;

        const hasStats = a.area_sqm || a.bedrooms || a.year_built;
        if (hasStats) {
            html += `<div class="presentation-stats">
                ${a.area_sqm ? `<div class="presentation-stat"><div class="stat-value">${a.area_sqm}</div><div class="stat-label">m&sup2;</div></div>` : ''}
                ${a.bedrooms ? `<div class="presentation-stat"><div class="stat-value">${a.bedrooms}</div><div class="stat-label">Bedrooms</div></div>` : ''}
                ${a.year_built ? `<div class="presentation-stat"><div class="stat-value">${a.year_built}</div><div class="stat-label">Year</div></div>` : ''}
            </div>`;
        }

        if (a.contract_ref || a.rent) {
            html += `<div class="presentation-info-group">
                <h4>Contract</h4>
                ${a.contract_ref ? `<div class="presentation-info-row"><span class="label">Contract</span><span class="value">${escapeHtml(a.contract_ref)}</span></div>` : ''}
                ${a.rent ? `<div class="presentation-info-row"><span class="label">Monthly rent</span><span class="value">${formatCurrency(a.rent)}</span></div>` : ''}
                ${a.start_date ? `<div class="presentation-info-row"><span class="label">Start</span><span class="value">${formatDate(a.start_date)}</span></div>` : ''}
                ${a.end_date ? `<div class="presentation-info-row"><span class="label">End</span><span class="value">${formatDate(a.end_date)}</span></div>` : ''}
            </div>`;
        }

        if (f) {
            const facturado = parseFloat(f.total_invoiced || 0);
            const collected = parseFloat(f.total_collected || 0);
            const outstanding = parseFloat(f.total_outstanding || 0);

            html += `<div class="presentation-info-group">
                <h4>Financial summary</h4>
                <div class="presentation-financial-cards">
                    <div class="presentation-financial-card billed"><div class="fin-value">${formatCurrency(facturado)}</div><div class="fin-label">Invoiced</div></div>
                    <div class="presentation-financial-card collected"><div class="fin-value">${formatCurrency(collected)}</div><div class="fin-label">Collected</div></div>
                    <div class="presentation-financial-card pending"><div class="fin-value">${formatCurrency(outstanding)}</div><div class="fin-label">Outstanding</div></div>
                </div>
            </div>`;
        }

        if (a.tags && a.tags.length) {
            html += `<div class="presentation-info-group">
                <h4>Tags</h4>
                <div class="presentation-tags">
                    ${a.tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}
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
            AdminApp.ScrollLock.unlock();
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

Object.assign(AdminApp, { PropertyPresentation });

})(window.AdminApp);
(function(AdminApp) {

const { api, Toast, FormPanel, escapeHtml, formatCurrency, statusBadge } = AdminApp;

async function renderCostEvolution(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    try {
        const data = await api.get('/reports/cost_evolution');
        if (!data || data.length === 0) {
            el.innerHTML = '<p class="loading-text">No cost data available.</p>';
            return;
        }

        const byProperty = {};
        const allYears = new Set();
        data.forEach(r => {
            if (!byProperty[r.property_name]) byProperty[r.property_name] = {};
            if (!byProperty[r.property_name][r.expense_category]) byProperty[r.property_name][r.expense_category] = {};
            byProperty[r.property_name][r.expense_category][r.year] = parseFloat(r.total) || 0;
            allYears.add(r.year);
        });

        const years = [...allYears].sort((a, b) => a - b);
        if (years.length === 0) { el.innerHTML = ''; return; }

        let html = '<h3 class="m-0 mb-4">Cost evolution by property</h3>';

        for (const [propName, categories] of Object.entries(byProperty).sort(([a], [b]) => a.localeCompare(b, 'en'))) {
            const cats = Object.keys(categories).sort((a, b) => a.localeCompare(b, 'en'));
            const totals = {};
            years.forEach(y => { totals[y] = 0; });

            html += `<div class="evolution-card">
                <h4 class="m-0 mb-3">${escapeHtml(propName)}</h4>
                <table class="data-table evolution-table">
                    <thead><tr>
                        <th>Category</th>
                        ${years.map(y => `<th class="numeric">${y}</th>`).join('')}
                        ${years.length >= 2 ? '<th class="numeric">Var.</th>' : ''}
                    </tr></thead>
                    <tbody>`;

            cats.forEach(cat => {
                const vals = categories[cat];
                years.forEach(y => { totals[y] += vals[y] || 0; });
                const lastTwo = years.slice(-2);
                let varPct = '';
                if (lastTwo.length === 2) {
                    const prev = vals[lastTwo[0]] || 0;
                    const curr = vals[lastTwo[1]] || 0;
                    if (prev > 0) {
                        const pct = ((curr - prev) / prev * 100).toFixed(1);
                        const color = pct > 0 ? 'red' : 'green';
                        varPct = `<span class="badge badge-${color}">${pct > 0 ? '+' : ''}${pct}%</span>`;
                    } else {
                        varPct = '-';
                    }
                }
                html += `<tr>
                    <td>${escapeHtml(cat)}</td>
                    ${years.map(y => `<td class="numeric">${formatCurrency(vals[y] || 0)}</td>`).join('')}
                    ${years.length >= 2 ? `<td class="numeric">${varPct}</td>` : ''}
                </tr>`;
            });

            const lastTwo = years.slice(-2);
            let totalVar = '';
            if (lastTwo.length === 2) {
                const prev = totals[lastTwo[0]] || 0;
                const curr = totals[lastTwo[1]] || 0;
                if (prev > 0) {
                    const pct = ((curr - prev) / prev * 100).toFixed(1);
                    const color = pct > 0 ? 'red' : 'green';
                    totalVar = `<span class="badge badge-${color}">${pct > 0 ? '+' : ''}${pct}%</span>`;
                }
            }
            html += `</tbody><tfoot><tr>
                <td><strong>Total</strong></td>
                ${years.map(y => `<td class="numeric"><strong>${formatCurrency(totals[y])}</strong></td>`).join('')}
                ${years.length >= 2 ? `<td class="numeric">${totalVar}</td>` : ''}
            </tr></tfoot></table></div>`;
        }

        el.innerHTML = html;
    } catch (e) {
        el.innerHTML = `<p class="text-danger">Error loading evolution: ${escapeHtml(e.message)}</p>`;
    }
}

async function renderPropertyDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        el.innerHTML = '<div class="empty-state">No property specified.</div>';
        return;
    }

    try {
        const data = await api.get(`/properties/${id}/detail`);
        const a = data.property;
        const f = data.financial;
        const images = data.images || [];
        const invoices = data.invoices || [];
        const contract = data.contract || null;

        let html = '';

        html += AdminApp.breadcrumb('properties', 'Properties', a.property_name);

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${escapeHtml(a.property_name)}</h1>
                ${statusBadge(a.status, 'property')}
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="btn-edit-property">Edit</button>
                ${a.image_folder ? '<button class="btn btn-secondary" id="btn-gallery">View photos</button>' : ''}
            </div>
        </div>`;

        html += `<div class="tab-bar">
            <button class="tab active" data-tab="resumen">Summary</button>
            <button class="tab" data-tab="contratos">Contracts</button>
            <button class="tab" data-tab="alquileres">Rentals</button>
            <button class="tab" data-tab="gastos">Expenses</button>
            <button class="tab" data-tab="incidencias">Issues</button>
            <button class="tab" data-tab="fotos">Photos</button>
            <button class="tab" data-tab="web">Web</button>
        </div>`;

        html += '<div class="tab-content">';
        html += `<div class="tab-panel active" data-panel="resumen">${AdminApp.renderResumenTab(a, f, images, invoices, contract)}</div>`;
        html += '<div class="tab-panel" data-panel="contratos"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="alquileres"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="gastos"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="incidencias"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="fotos"><div class="tab-fotos-root"></div></div>';
        html += '<div class="tab-panel" data-panel="web"><div class="tab-web-root"></div></div>';
        html += '</div>';

        el.innerHTML = html;

        const tabsLoaded = { resumen: true };
        el.querySelectorAll('.tab-bar .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const name = tab.dataset.tab;
                el.querySelectorAll('.tab-bar .tab').forEach(t => t.classList.remove('active'));
                el.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                el.querySelector(`[data-panel="${name}"]`).classList.add('active');

                if (!tabsLoaded[name]) {
                    tabsLoaded[name] = true;
                    if (name === 'fotos') {
                        AdminApp.initFotosTab(el.querySelector('[data-panel="fotos"] .tab-fotos-root'), id, images);
                    } else if (name === 'web') {
                        AdminApp.initWebTab(el.querySelector('[data-panel="web"] .tab-web-root'), id);
                    } else {
                        AdminApp.initActivoTabTable(name, el.querySelector(`[data-panel="${name}"] .tab-table-root`), a);
                    }
                }
            });
        });

        el.querySelector('#btn-edit-property')?.addEventListener('click', () => {
            const formPanel = new FormPanel({
                title: 'Property',
                fields: [
                    { key: 'property_name', label: 'Property name', required: true },
                    { key: 'address', label: 'Address', required: true },
                    { key: 'contract_ref', label: 'Contract ref' },
                    { key: 'status', label: 'Status', type: 'select', options: ['Vacant', 'Occupied', 'Rented', 'Under Renovation'], default: 'Vacant' },
                    { key: 'rent', label: 'Monthly rent', type: 'number' },
                    { key: 'start_date', label: 'Contract start', type: 'date' },
                    { key: 'end_date', label: 'Contract end', type: 'date' },
                    { key: 'tags', label: 'Tags (comma separated)' },
                    { key: 'image_folder', label: 'Image folder' },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/properties/${id}`, formData);
                    Toast.show('Property updated');
                    renderPropertyDetail(container);
                }
            });
            formPanel.open(a);
        });

        el.querySelector('#btn-gallery')?.addEventListener('click', () => {
            AdminApp.PropertyPresentation.open(id);
        });

    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading property: ${escapeHtml(e.message)}</div>`;
    }
}

Object.assign(AdminApp, { renderActivoDetail: renderPropertyDetail, renderPropertyDetail, renderCostesEvolution: renderCostEvolution, renderCostEvolution });

})(window.AdminApp);
(function(AdminApp) {

const {
    api, formatCurrency, formatCurrencyValue,
    formatDate, escapeHtml,
    statusBadge, progressBar, rateColor
} = AdminApp;

const INSURANCE_WARNING_DAYS = 60;

const _resumenState = { insuranceStatusCache: null };

async function loadInsuranceStatus() {
    if (_resumenState.insuranceStatusCache) return _resumenState.insuranceStatusCache;
    try {
        _resumenState.insuranceStatusCache = await api.get('/reports/insurance_status');
    } catch {
        _resumenState.insuranceStatusCache = [];
    }
    return _resumenState.insuranceStatusCache;
}

async function applyInsuranceBadges(data, tableInstance) {
    if (!tableInstance || !tableInstance.container) return;
    const statuses = await loadInsuranceStatus();
    const statusMap = {};
    (statuses || []).forEach(s => { statusMap[s.property_name] = s; });

    tableInstance.container.querySelectorAll('tbody tr[data-id]').forEach(tr => {
        const id = tr.dataset.id;
        const row = data.find(r => r.id === id);
        if (!row || row.expense_category !== 'Insurance') return;

        const insurance = statusMap[row.property_name];
        const td = tr.querySelector('td:first-child');
        if (!td) return;

        let badge = '';
        if (!insurance || !insurance.has_active) {
            badge = '<span class="badge badge-red insurance-badge" title="No active policy">Expired</span>';
        } else if (insurance.days_until_expiry != null && insurance.days_until_expiry <= INSURANCE_WARNING_DAYS) {
            badge = `<span class="badge badge-amber insurance-badge" title="Expires in ${insurance.days_until_expiry} days">Expiring</span>`;
        } else {
            badge = '<span class="badge badge-green insurance-badge" title="Active policy">Active</span>';
        }
        td.insertAdjacentHTML('beforeend', ' ' + badge);
    });
}

function renderResumenTab(a, f, images, invoices, contract) {
    let html = '';

    if (images.length > 0) {
        html += `<div class="detail-image-strip">
            ${images.slice(0, 4).map(img => `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename)}" loading="lazy">`).join('')}
        </div>`;
    }

    const invoiced = parseFloat(f?.total_invoiced || 0);
    const collected = parseFloat(f?.total_collected || 0);
    const outstanding = parseFloat(f?.total_outstanding || 0);
    const numInvoices = f?.num_invoices || 0;
    const rate = invoiced > 0 ? (collected / invoiced * 100) : 0;
    const rc = rateColor(rate);

    const monthlyRent = contract ? parseFloat(contract.rent || 0) : parseFloat(a.rent || 0);
    const contractRef = contract ? escapeHtml(contract.contract_ref) : (escapeHtml(a.contract_ref) || 'No contract');
    const contractLink = contract
        ? `<a href="${AdminApp.detailUrl('contract', contract.id)}" class="link-accent">${contractRef}</a>`
        : contractRef;

    html += `<div class="summary-grid">
        <div class="stat-card">
            <div class="label">Total invoiced</div>
            <div class="value currency">${formatCurrencyValue(invoiced)}</div>
            <div class="kpi-subtitle">${numInvoices} invoice${numInvoices !== 1 ? 's' : ''}</div>
        </div>
        <div class="stat-card">
            <div class="label">Monthly rent</div>
            <div class="value currency">${formatCurrencyValue(monthlyRent)}</div>
            <div class="kpi-subtitle">${contractLink}</div>
        </div>
        <div class="stat-card success">
            <div class="label">Collected</div>
            <div class="value currency">${formatCurrencyValue(collected)}</div>
            <div class="kpi-subtitle">${rate.toFixed(1)}% collection rate</div>
            <div class="mt-2">${progressBar(rate, rc)}</div>
        </div>
        <div class="stat-card ${outstanding > 0 ? 'error' : ''}">
            <div class="label">Outstanding</div>
            <div class="value currency">${formatCurrencyValue(outstanding)}</div>
        </div>
    </div>`;

    const cRef = contract
        ? `<a href="${AdminApp.detailUrl('contract', contract.id)}" class="link-accent">${escapeHtml(contract.contract_ref)}</a>`
        : (escapeHtml(a.contract_ref) || '-');
    const cRent = contract ? contract.rent : a.rent;
    const cStart = contract ? contract.start_date : a.start_date;
    const cEnd = contract ? contract.end_date : a.end_date;
    const cTenant = contract ? contract.tenant_name : null;

    html += `<div class="detail-info-grid">
        <div class="detail-info-section">
            <h3>Property details</h3>
            <div class="detail-grid">
                <div class="detail-field"><span class="detail-label">Address</span><span class="detail-value">${escapeHtml(a.address)}</span></div>
                <div class="detail-field"><span class="detail-label">Status</span><span class="detail-value">${statusBadge(a.status, 'property')}</span></div>
                ${a.tags && a.tags.length ? `<div class="detail-field"><span class="detail-label">Tags</span><span class="detail-value">${a.tags.map(t => `<span class="badge badge-blue">${escapeHtml(t)}</span>`).join(' ')}</span></div>` : ''}
            </div>
        </div>
        <div class="detail-info-section">
            <h3>Current contract</h3>
            <div class="detail-grid">
                <div class="detail-field"><span class="detail-label">Contract ref</span><span class="detail-value">${cRef}</span></div>
                ${cTenant ? `<div class="detail-field"><span class="detail-label">Tenant</span><span class="detail-value">${escapeHtml(cTenant)}</span></div>` : ''}
                <div class="detail-field"><span class="detail-label">Monthly rent</span><span class="detail-value">${formatCurrency(cRent)}</span></div>
                <div class="detail-field"><span class="detail-label">Start</span><span class="detail-value">${formatDate(cStart)}</span></div>
                <div class="detail-field"><span class="detail-label">End</span><span class="detail-value">${formatDate(cEnd)}</span></div>
            </div>
        </div>
    </div>`;

    if (invoices.length > 0) {
        html += `<div class="detail-section">
            <h4>Recent invoices (${invoices.length})</h4>
            <div class="table-container max-h-300 overflow-auto">
                <table class="data-table">
                    <thead><tr><th>Ref</th><th>Description</th><th>Status</th><th>Total</th><th>Paid</th><th>Date</th></tr></thead>
                    <tbody>
                        ${invoices.map(inv => `<tr>
                            <td>${escapeHtml(inv.reference)}</td>
                            <td>${escapeHtml(inv.description)}</td>
                            <td>${statusBadge(inv.status, 'invoice')}</td>
                            <td class="numeric">${formatCurrency(inv.total)}</td>
                            <td class="numeric">${formatCurrency(inv.paid)}</td>
                            <td class="date">${formatDate(inv.invoice_date)}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    }

    return html;
}

Object.assign(AdminApp, { applyInsuranceBadges, renderResumenTab });

})(window.AdminApp);
(function(AdminApp) {

const { api, Toast, DataTable, FormPanel } = AdminApp;

function initContractsTab(container, property) {
    const propertyName = property.property_name;
    return new DataTable(container, {
        entity: 'contract',
        apiPath: '/contracts',
        defaultFilters: { property_name: propertyName },
        columns: [
            { key: 'contract_ref', label: 'Contract' },
            { key: 'tenant_name', label: 'Tenant' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'rent', label: 'Rent', type: 'currency' },
            { key: 'start_date', label: 'Start', type: 'date' },
            { key: 'end_date', label: 'End', type: 'date' },
        ],
        onAction: async (action, row) => {
            if (action === 'create') {
                const fp = new FormPanel({
                    title: 'Contract',
                    fields: [
                        { key: 'contract_ref', label: 'Contract ref', required: true },
                        { key: 'property_name', label: 'Property', required: true },
                        { key: 'tenant_name', label: 'Tenant', required: true },
                        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Pending', 'Ended', 'Suspended'], default: 'Active' },
                        { key: 'rent', label: 'Rent', type: 'number' },
                        { key: 'start_date', label: 'Start', type: 'date' },
                        { key: 'end_date', label: 'End', type: 'date' },
                    ],
                    onSubmit: async (data) => {
                        await api.post('/contracts', data);
                        Toast.show('Contract created');
                    }
                });
                fp.open({ property_name: propertyName });
            }
            if (action === 'edit') {
                const fp = new FormPanel({
                    title: 'Contract',
                    fields: [
                        { key: 'contract_ref', label: 'Contract ref', required: true },
                        { key: 'property_name', label: 'Property', required: true },
                        { key: 'tenant_name', label: 'Tenant', required: true },
                        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Pending', 'Ended', 'Suspended'], default: 'Active' },
                        { key: 'rent', label: 'Rent', type: 'number' },
                        { key: 'start_date', label: 'Start', type: 'date' },
                        { key: 'end_date', label: 'End', type: 'date' },
                    ],
                    onSubmit: async (data, isEdit, original) => {
                        await api.put(`/contracts/${original.id}`, data);
                        Toast.show('Contract updated');
                    }
                });
                fp.open(row);
            }
        },
        onRowClick: (row) => {
            window.location.href = AdminApp.detailUrl('contract', row.id);
        }
    });
}

function initRentalsTab(container, property) {
    const propertyName = property.property_name;
    const propertyId = property.id;
    const rentalTable = new DataTable(container, {
        entity: 'billing',
        apiPath: '/invoices',
        showPeriodFilter: true,
        defaultFilters: { type: 'income', property_name: propertyName, property_id: propertyId },
        columns: [
            { key: 'reference', label: 'Ref' },
            { key: 'description', label: 'Description' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'total', label: 'Total', type: 'currency' },
            { key: 'paid', label: 'Paid', type: 'currency' },
            { key: 'invoice_date', label: 'Date', type: 'date' },
        ],
        filters: [
            { key: 'status', label: 'Status', options: ['Unpaid', 'Partial', 'Paid'] },
        ],
        onRowClick: (row) => {
            window.location.href = AdminApp.detailUrl('invoice', row.id);
        },
        onAction: async (action, row) => {
            if (action === 'create') {
                const fp = new FormPanel({
                    title: 'New Invoice (Rental)',
                    fields: [
                        { key: 'reference', label: 'Reference', required: true },
                        { key: 'description', label: 'Description', required: true },
                        { key: 'contract_ref', label: 'Contract', required: true },
                        { key: 'property_name', label: 'Property', required: true },
                        { key: 'payer', label: 'Payer', required: true },
                        { key: 'payee', label: 'Payee', required: true },
                        { key: 'total', label: 'Total', type: 'number', required: true },
                        { key: 'paid', label: 'Paid', type: 'number' },
                        { key: 'invoice_date', label: 'Date', type: 'date', required: true },
                        { key: 'status', label: 'Status', type: 'select', options: ['Unpaid', 'Partial', 'Paid'], default: 'Unpaid' },
                    ],
                    hiddenFields: { type: 'income' },
                    onSubmit: async (data) => {
                        await api.post('/invoices', data);
                        Toast.show('Invoice created');
                        rentalTable.load();
                    }
                });
                fp.open({ property_name: propertyName, contract_ref: property.contract_ref || '' });
            }
            if (action === 'edit') {
                const fp = new FormPanel({
                    title: 'Invoice',
                    fields: [
                        { key: 'reference', label: 'Reference', required: true },
                        { key: 'description', label: 'Description', required: true },
                        { key: 'total', label: 'Total', type: 'number', required: true },
                        { key: 'paid', label: 'Paid', type: 'number' },
                        { key: 'invoice_date', label: 'Date', required: true },
                        { key: 'status', label: 'Status', type: 'select', options: ['Auto', 'Unpaid', 'Partial', 'Paid'] },
                    ],
                    onSubmit: async (data, isEdit, original) => {
                        if (data.status === 'Auto') delete data.status;
                        await api.put(`/invoices/${original.id}`, data);
                        Toast.show('Invoice updated');
                        rentalTable.load();
                    }
                });
                fp.open(row);
            }
        }
    });
    return rentalTable;
}

function initExpensesTab(container, property) {
    const { property_name: propertyName, id: propertyId } = property;
    const expensesTable = new DataTable(container, {
        entity: 'expenses',
        apiPath: '/invoices',
        showPeriodFilter: true,
        defaultFilters: { type: 'expense', property_name: propertyName, property_id: propertyId },
        columns: [
            { key: 'reference', label: 'Ref' },
            { key: 'description', label: 'Description' },
            { key: 'expense_category', label: 'Category' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'total', label: 'Total', type: 'currency' },
            { key: 'paid', label: 'Paid', type: 'currency' },
            { key: 'invoice_date', label: 'Date', type: 'date' },
        ],
        filters: [
            { key: 'expense_category', label: 'Category', options: ['Council Tax', 'Insurance', 'Waste', 'Service Charge', 'Repairs', 'Utilities', 'Management', 'Legal', 'Tax', 'Other'] },
            { key: 'status', label: 'Status', options: ['Unpaid', 'Partial', 'Paid'] },
        ],
        onRowClick: (row) => {
            window.location.href = AdminApp.detailUrl('invoice', row.id);
        },
        onAction: async (action, row) => {
            if (action === 'create') {
                const fp = new FormPanel({
                    title: 'New Expense',
                    fields: [
                        { key: 'reference', label: 'Reference', required: true },
                        { key: 'description', label: 'Description', required: true },
                        { key: 'contract_ref', label: 'Contract' },
                        { key: 'property_name', label: 'Property', required: true },
                        { key: 'payer', label: 'Payer', required: true },
                        { key: 'payee', label: 'Payee', required: true },
                        { key: 'expense_category', label: 'Category', type: 'select', options: ['Council Tax', 'Insurance', 'Waste', 'Service Charge', 'Repairs', 'Utilities', 'Management', 'Legal', 'Tax', 'Other'] },
                        { key: 'total', label: 'Total', type: 'number', required: true },
                        { key: 'paid', label: 'Paid', type: 'number' },
                        { key: 'invoice_date', label: 'Date', type: 'date', required: true },
                        { key: 'status', label: 'Status', type: 'select', options: ['Unpaid', 'Partial', 'Paid'], default: 'Unpaid' },
                    ],
                    hiddenFields: { type: 'expense' },
                    onSubmit: async (data) => {
                        await api.post('/invoices', data);
                        Toast.show('Expense created');
                        expensesTable.load();
                    }
                });
                fp.open({ property_name: propertyName, contract_ref: property.contract_ref || '' });
            }
            if (action === 'edit') {
                const fp = new FormPanel({
                    title: 'Expense',
                    fields: [
                        { key: 'reference', label: 'Reference', required: true },
                        { key: 'description', label: 'Description', required: true },
                        { key: 'expense_category', label: 'Category', type: 'select', options: ['Council Tax', 'Insurance', 'Waste', 'Service Charge', 'Repairs', 'Utilities', 'Management', 'Legal', 'Tax', 'Other'] },
                        { key: 'total', label: 'Total', type: 'number', required: true },
                        { key: 'paid', label: 'Paid', type: 'number' },
                        { key: 'invoice_date', label: 'Date', required: true },
                        { key: 'status', label: 'Status', type: 'select', options: ['Auto', 'Unpaid', 'Partial', 'Paid'] },
                    ],
                    hiddenFields: { type: 'expense' },
                    onSubmit: async (data, isEdit, original) => {
                        if (data.status === 'Auto') delete data.status;
                        await api.put(`/invoices/${original.id}`, data);
                        Toast.show('Expense updated');
                        expensesTable.load();
                    }
                });
                fp.open(row);
            }
        }
    });
    return expensesTable;
}

function initIssuesTab(container, property) {
    const propertyName = property.property_name;
    return new DataTable(container, {
        entity: 'issue',
        apiPath: '/issues',
        defaultFilters: { property_name: propertyName },
        columns: [
            { key: 'title', label: 'Title' },
            { key: 'priority', label: 'Priority', type: 'status' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'cost', label: 'Cost', type: 'currency' },
            { key: 'created_at', label: 'Created', type: 'date' },
        ],
        filters: [
            { key: 'status', label: 'Status', options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
            { key: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'] },
        ],
        onRowClick: (row) => {
            window.location.href = AdminApp.detailUrl('issue', row.id);
        },
        onAction: async (action, row) => {
            if (action === 'create') {
                const fp = new FormPanel({
                    title: 'Issue',
                    fields: [
                        { key: 'property_name', label: 'Property', required: true },
                        { key: 'title', label: 'Title', required: true },
                        { key: 'description', label: 'Description', type: 'textarea' },
                        { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'], default: 'Medium' },
                        { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
                        { key: 'cost', label: 'Cost', type: 'number' },
                    ],
                    onSubmit: async (data) => {
                        await api.post('/issues', data);
                        Toast.show('Issue created');
                    }
                });
                fp.open({ property_name: propertyName });
            }
            if (action === 'edit') {
                const fp = new FormPanel({
                    title: 'Issue',
                    fields: [
                        { key: 'property_name', label: 'Property', required: true },
                        { key: 'title', label: 'Title', required: true },
                        { key: 'description', label: 'Description', type: 'textarea' },
                        { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
                        { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
                        { key: 'cost', label: 'Cost', type: 'number' },
                    ],
                    onSubmit: async (data, isEdit, original) => {
                        await api.put(`/issues/${original.id}`, data);
                        Toast.show('Issue updated');
                    }
                });
                fp.open(row);
            }
        }
    });
}

function initActivoTabTable(tabName, container, property) {
    const handlers = { contratos: initContractsTab, alquileres: initRentalsTab, gastos: initExpensesTab, incidencias: initIssuesTab };
    const handler = handlers[tabName];
    if (handler) return handler(container, property);
}

Object.assign(AdminApp, { initActivoTabTable });

})(window.AdminApp);
(function(AdminApp) {

const { api, Toast, confirmAction, escapeHtml } = AdminApp;

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const _fotosState = { webImages: [], activoWebId: null };

function renderImageCard(img) {
    const isPrimary = img.is_primary ? ' active' : '';
    const isWeb = _fotosState.webImages.includes(img.filename);
    const webIdx = isWeb ? _fotosState.webImages.indexOf(img.filename) + 1 : 0;
    return `<div class="image-manage-card${isWeb ? ' web-selected' : ''}" data-filename="${escapeHtml(img.filename)}" draggable="true">
        <div class="image-manage-handle" title="Drag to reorder">&#9776;</div>
        ${isWeb ? `<div class="image-web-badge">${webIdx}</div>` : ''}
        <img class="image-manage-thumb" src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename)}">
        <div class="image-manage-info">
            <span class="image-manage-name">${escapeHtml(img.filename)}</span>
            <button class="image-manage-web${isWeb ? ' active' : ''}" title="${isWeb ? 'Remove from web' : 'Publish to web'}">&#127760;</button>
            <button class="image-manage-primary${isPrimary}" title="Primary image">&#9733;</button>
            <button class="image-manage-delete" title="Delete">&#10005;</button>
        </div>
    </div>`;
}

async function loadWebImages(activoId) {
    try {
        const data = await api.get(`/property_web/by-activo/${activoId}`);
        _fotosState.activoWebId = data.id;
        _fotosState.webImages = data.imagenes_web || [];
    } catch (e) {
        _fotosState.activoWebId = null;
        _fotosState.webImages = [];
    }
}

async function saveWebImages() {
    if (!_fotosState.activoWebId) return;
    try {
        await api.put(`/property_web/${_fotosState.activoWebId}`, { imagees_web: _fotosState.webImages });
    } catch (err) {
        Toast.show('Error saving web selection: ' + err.message, 'error');
    }
}

async function toggleWebImage(filename, grid, activoId) {
    const idx = _fotosState.webImages.indexOf(filename);
    if (idx >= 0) {
        _fotosState.webImages.splice(idx, 1);
        Toast.show('Image removed from web');
    } else {
        if (!_fotosState.activoWebId) {
            try {
                const created = await api.post('/property_web', { activo_id: activoId, publicado: 'false' });
                _fotosState.activoWebId = created.id;
            } catch (err) {
                Toast.show('Error creating web listing: ' + err.message, 'error');
                return;
            }
        }
        _fotosState.webImages.push(filename);
        Toast.show('Image added to web (#' + _fotosState.webImages.length + ')');
    }
    await saveWebImages();
    refreshWebBadges(grid);
}

function refreshWebBadges(grid) {
    grid.querySelectorAll('.image-manage-card').forEach(card => {
        const fn = card.dataset.filename;
        const isWeb = _fotosState.webImages.includes(fn);
        const webIdx = isWeb ? _fotosState.webImages.indexOf(fn) + 1 : 0;
        card.classList.toggle('web-selected', isWeb);

        let badge = card.querySelector('.image-web-badge');
        if (isWeb) {
            if (!badge) {
                badge = document.createElement('div');
                badge.className = 'image-web-badge';
                card.insertBefore(badge, card.querySelector('.image-manage-thumb'));
            }
            badge.textContent = webIdx;
        } else if (badge) {
            badge.remove();
        }

        const webBtn = card.querySelector('.image-manage-web');
        if (webBtn) {
            webBtn.classList.toggle('active', isWeb);
            webBtn.title = isWeb ? 'Remove from web' : 'Publish to web';
        }
    });
}

async function loadImageGrid(grid, activoId) {
    try {
        const data = await api.get(`/properties/${activoId}/images`);
        const images = Array.isArray(data) ? data : (data.images || []);
        if (images.length === 0) {
            grid.innerHTML = '<p class="image-manage-empty">No images. Upload the first one.</p>';
        } else {
            grid.innerHTML = images.map(img => renderImageCard(img)).join('');
            initDragReorder(grid, activoId);
        }
    } catch (e) {
        grid.innerHTML = `<p class="text-danger">Error loading imagees: ${escapeHtml(e.message)}</p>`;
    }
}

function initDragReorder(grid, activoId) {
    let dragEl = null;

    grid.querySelectorAll('.image-manage-card').forEach(card => {
        card.addEventListener('dragstart', (e) => {
            dragEl = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            if (dragEl) dragEl.classList.remove('dragging');
            dragEl = null;
            grid.querySelectorAll('.image-manage-card').forEach(c => c.classList.remove('drag-over'));
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (card !== dragEl) {
                card.classList.add('drag-over');
            }
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', async (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            if (!dragEl || dragEl === card) return;

            const cards = [...grid.querySelectorAll('.image-manage-card')];
            const fromIdx = cards.indexOf(dragEl);
            const toIdx = cards.indexOf(card);
            if (fromIdx < toIdx) {
                card.after(dragEl);
            } else {
                card.before(dragEl);
            }

            const order = [...grid.querySelectorAll('.image-manage-card')].map(c => c.dataset.filename);
            try {
                await api.put(`/properties/${activoId}/images/order`, { order });
                Toast.show('Order updated');
            } catch (err) {
                Toast.show('Error reordering: ' + err.message, 'error');
            }
        });
    });
}

function initFotosTab(container, activoId, initialImages) {
    container.innerHTML = `
        <div class="image-fotos-legend">
            <span><span class="legend-icon">&#127760;</span> = publish to web</span>
            <span><span class="legend-icon">&#9733;</span> = primary image</span>
            <span><span class="legend-icon">&#9776;</span> = drag to reorder</span>
        </div>
        <div class="image-upload-zone" id="image-drop-zone">
            <input type="file" id="image-file-input" multiple accept="image/*" hidden>
            <p>Drag images here or <a href="#" id="image-browse-link">select files</a></p>
            <p class="upload-hint">JPG, PNG, GIF, WebP — Max 10 MB</p>
        </div>
        <div class="image-manage-grid" id="image-manage-grid"></div>`;

    const dropZone = container.querySelector('#image-drop-zone');
    const fileInput = container.querySelector('#image-file-input');
    const browseLink = container.querySelector('#image-browse-link');
    const grid = container.querySelector('#image-manage-grid');

    browseLink.addEventListener('click', (e) => {
        e.preventDefault();
        fileInput.click();
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFiles(fileInput.files, activoId, grid);
            fileInput.value = '';
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        if (!dropZone.contains(e.relatedTarget)) {
            dropZone.classList.remove('drag-over');
        }
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files, activoId, grid);
        }
    });

    grid.addEventListener('click', async (e) => {
        const card = e.target.closest('.image-manage-card');
        if (!card) return;
        const filename = card.dataset.filename;

        if (e.target.closest('.image-manage-web')) {
            await toggleWebImage(filename, grid, activoId);
            return;
        }

        if (e.target.closest('.image-manage-primary')) {
            try {
                await api.put(`/properties/${activoId}/images/primary`, { filename });
                grid.querySelectorAll('.image-manage-primary').forEach(b => b.classList.remove('active'));
                e.target.closest('.image-manage-primary').classList.add('active');
                Toast.show('Primary image updated');
            } catch (err) {
                Toast.show('Error: ' + err.message, 'error');
            }
            return;
        }

        if (e.target.closest('.image-manage-delete')) {
            const ok = await confirmAction('Delete image', 'Delete "' + filename + '"?');
            if (!ok) return;
            try {
                await api.del(`/properties/${activoId}/images/${encodeURIComponent(filename)}`);
                const webIdx = _fotosState.webImages.indexOf(filename);
                if (webIdx >= 0) {
                    _fotosState.webImages.splice(webIdx, 1);
                    await saveWebImages();
                }
                card.remove();
                Toast.show('Image deleted');
                if (grid.querySelectorAll('.image-manage-card').length === 0) {
                    grid.innerHTML = '<p class="image-manage-empty">No images. Upload the first one.</p>';
                }
            } catch (err) {
                Toast.show('Error: ' + err.message, 'error');
            }
            return;
        }
    });

    (async () => {
        await loadWebImages(activoId);
        await loadImageGrid(grid, activoId);
    })();
}

async function handleFiles(files, activoId, grid) {
    let uploaded = 0;
    let failed = 0;

    for (const file of files) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
            Toast.show(`"${file.name}" exceeds 10 MB`, 'error');
            failed++;
            continue;
        }
        try {
            await api.uploadFile(`/properties/${activoId}/images/upload`, file);
            uploaded++;
        } catch (e) {
            Toast.show(`Error uploading "${file.name}": ${e.message}`, 'error');
            failed++;
        }
    }

    if (uploaded > 0) {
        Toast.show(`${uploaded} image${uploaded !== 1 ? 's' : ''} uploaded`);
        await loadImageGrid(grid, activoId);
    }
}

Object.assign(AdminApp, { initFotosTab });

})(window.AdminApp);
(function(AdminApp) {

const { api, Toast, FormPanel, formatCurrency, escapeHtml } = AdminApp;

function renderWebTabContent(webData) {
    if (!webData) {
        return `<div class="empty-state empty-placeholder">
            <p>No web data for this property.</p>
            <button class="btn btn-primary" id="btn-create-web">Create web listing</button>
        </div>`;
    }

    const d = webData;
    const features = (d.features || d.caracteristicas || []).map(c => `<span class="badge badge-blue">${escapeHtml(c)}</span>`).join(' ');

    let html = `<div class="detail-info-grid">
        <div class="detail-info-section">
            <h3>Publication status</h3>
            <div class="detail-grid">
                <div class="detail-field">
                    <span class="detail-label">Published</span>
                    <span class="detail-value">
                        <label class="toggle-switch">
                            <input type="checkbox" id="web-publicado-toggle" ${d.publicado ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                        <span id="web-publicado-label" class="ml-auto">${d.publicado ? 'Visible on web' : 'Not published'}</span>
                    </span>
                </div>
                ${d.titulo ? `<div class="detail-field"><span class="detail-label">Title</span><span class="detail-value">${escapeHtml(d.titulo)}</span></div>` : ''}
                <div class="detail-field"><span class="detail-label">Status</span><span class="detail-value"><span class="badge badge-${(d.estado || d.status) === 'reserved' ? 'amber' : 'green'}">${escapeHtml(d.estado || d.status || 'available')}</span></span></div>
                <div class="detail-field"><span class="detail-label">Offer type</span><span class="detail-value">${escapeHtml(d.tipo_oferta || d.offer_type || 'rental')}</span></div>
            </div>
        </div>
        <div class="detail-info-section">
            <h3>Property data</h3>
            <div class="detail-grid">
                ${d.precio ? `<div class="detail-field"><span class="detail-label">Rental price</span><span class="detail-value">${formatCurrency(d.precio)} /mo</span></div>` : ''}
                ${d.precio_venta ? `<div class="detail-field"><span class="detail-label">Sale price</span><span class="detail-value">${formatCurrency(d.precio_venta)}</span></div>` : ''}
                ${d.superficie ? `<div class="detail-field"><span class="detail-label">Area</span><span class="detail-value">${d.superficie} sq ft</span></div>` : ''}
                ${d.habitaciones != null ? `<div class="detail-field"><span class="detail-label">Bedrooms</span><span class="detail-value">${d.habitaciones}</span></div>` : ''}
                ${d.banos != null ? `<div class="detail-field"><span class="detail-label">Bathrooms</span><span class="detail-value">${d.banos}</span></div>` : ''}
                ${d.tipo_inmueble ? `<div class="detail-field"><span class="detail-label">Property type</span><span class="detail-value">${escapeHtml(d.tipo_inmueble)}</span></div>` : ''}
            </div>
        </div>
    </div>`;

    if (d.descripcion) {
        html += `<div class="detail-section">
            <h4>Description</h4>
            <div class="detail-description-box">${escapeHtml(d.descripcion)}</div>
        </div>`;
    }

    if (features) {
        html += `<div class="detail-section">
            <h4>Features</h4>
            <div class="p-3">${features}</div>
        </div>`;
    }

    html += `<div class="mt-4">
        <button class="btn btn-secondary" id="btn-edit-web">Edit web data</button>
    </div>`;

    return html;
}

function webFormFields() {
    return [
        { key: 'publicado', label: 'Published', type: 'select', options: ['true', 'false'] },
        { key: 'estado', label: 'Status', type: 'select', options: ['available', 'reserved'] },
        { key: 'tipo_oferta', label: 'Offer type', type: 'select', options: ['rental', 'sale', 'both'] },
        { key: 'titulo', label: 'Title (override)' },
        { key: 'precio', label: 'Monthly rental price', type: 'number' },
        { key: 'precio_venta', label: 'Sale price', type: 'number' },
        { key: 'superficie', label: 'Area (sq ft)', type: 'number' },
        { key: 'habitaciones', label: 'Bedrooms', type: 'integer' },
        { key: 'banos', label: 'Bathrooms', type: 'integer' },
        { key: 'tipo_inmueble', label: 'Property type', type: 'select', options: ['flat', 'house', 'detached', 'commercial', 'office', 'garage', 'storage', 'land'] },
        { key: 'descripcion', label: 'Description', type: 'textarea' },
        { key: 'features', label: 'Features (comma separated)' },
    ];
}

async function initWebTab(container, activoId) {
    container.innerHTML = '<p class="loading-text">Loading web data...</p>';

    let webData = null;
    try {
        webData = await api.get(`/property_web/by-activo/${activoId}`);
    } catch (e) {
    }

    container.innerHTML = renderWebTabContent(webData);

    const toggle = container.querySelector('#web-publicado-toggle');
    if (toggle && webData) {
        toggle.addEventListener('change', async () => {
            try {
                await api.put(`/property_web/${webData.id}`, { publicado: toggle.checked ? 'true' : 'false' });
                const label = container.querySelector('#web-publicado-label');
                if (label) label.textContent = toggle.checked ? 'Visible on web' : 'Not published';
                Toast.show(toggle.checked ? 'Published on web' : 'Removed from web');
            } catch (err) {
                Toast.show('Error: ' + err.message, 'error');
                toggle.checked = !toggle.checked;
            }
        });
    }

    container.querySelector('#btn-edit-web')?.addEventListener('click', () => {
        const data = { ...webData };
        if (data.features && Array.isArray(data.features)) {
            data.features = data.features.join(', ');
        } else if (data.caracteristicas && Array.isArray(data.caracteristicas)) {
            data.features = data.caracteristicas.join(', ');
        }
        if (data.publicado != null) data.publicado = String(data.publicado);
        const fp = new FormPanel({
            title: 'Property web data',
            fields: webFormFields(),
            onSubmit: async (formData) => {
                if (formData.features && typeof formData.features === 'string') {
                    formData.features = formData.features.split(',').map(s => s.trim()).filter(Boolean);
                }
                await api.put(`/property_web/${webData.id}`, formData);
                Toast.show('Web data updated');
                initWebTab(container, activoId);
            }
        });
        fp.open(data);
    });

    container.querySelector('#btn-create-web')?.addEventListener('click', () => {
        const fp = new FormPanel({
            title: 'Create web listing',
            fields: webFormFields(),
            onSubmit: async (formData) => {
                formData.activo_id = activoId;
                if (formData.features && typeof formData.features === 'string') {
                    formData.features = formData.features.split(',').map(s => s.trim()).filter(Boolean);
                }
                await api.post('/property_web', formData);
                Toast.show('Web listing created');
                initWebTab(container, activoId);
            }
        });
        fp.open({});
    });
}

Object.assign(AdminApp, { initWebTab });

})(window.AdminApp);
(function(AdminApp) {

const { api, Toast, FormPanel, escapeHtml, statusBadge } = AdminApp;

async function renderContratoDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        el.innerHTML = '<div class="empty-state">No contract specified.</div>';
        return;
    }

    try {
        const [detail, depData, propData] = await Promise.all([
            api.get(`/contracts/${id}/detail`),
            api.get(`/deposits?per_page=200`),
            api.get(`/owners?per_page=100`),
        ]);

        const c = detail.contract;
        const activoId = detail.property_id || null;
        const invoices = detail.invoices || [];
        const documents = detail.documents || [];
        const extractedData = detail.extracted_data || [];

        const depositos = (depData.data || []).filter(d =>
            d.contract_ref === c.contract_ref || d.property_name === c.property_name
        );

        const propietario = (propData.data || []).find(p => p.property_name === c.property_name) || null;

        let html = '';

        html += AdminApp.breadcrumb('contracts', 'Contracts', c.contract_ref);

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${escapeHtml(c.contract_ref)}</h1>
                ${statusBadge(c.status, 'contract')}
            </div>
            <div class="header-actions">
                <button class="btn btn-primary" id="btn-gen-contrato">Generate Contract</button>
                <button class="btn btn-secondary" id="btn-edit-contrato">Edit</button>
            </div>
        </div>`;

        html += `<div class="tab-bar">
            <button class="tab active" data-tab="resumen">Summary</button>
            <button class="tab" data-tab="revision_renta">Rent Review</button>
            <button class="tab" data-tab="descuentos">Discounts</button>
            <button class="tab" data-tab="alquileres">Rentals</button>
            <button class="tab" data-tab="depositos">Deposits</button>
            <button class="tab" data-tab="incidencias">Issues</button>
            <button class="tab" data-tab="documentos">Documents</button>
        </div>`;

        html += '<div class="tab-content">';
        html += `<div class="tab-panel active" data-panel="resumen">${AdminApp.renderContratoResumen(c, invoices, depositos, propietario, activoId, detail)}</div>`;
        html += '<div class="tab-panel" data-panel="revision_renta"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="descuentos"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="alquileres"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="depositos"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="incidencias"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="documentos"><div class="tab-table-root"></div></div>';
        html += '</div>';

        el.innerHTML = html;

        const tabsLoaded = { resumen: true };
        el.querySelectorAll('.tab-bar .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const name = tab.dataset.tab;
                el.querySelectorAll('.tab-bar .tab').forEach(t => t.classList.remove('active'));
                el.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                el.querySelector(`[data-panel="${name}"]`).classList.add('active');

                if (!tabsLoaded[name]) {
                    tabsLoaded[name] = true;
                    AdminApp.initContratoTabTable(name, el.querySelector(`[data-panel="${name}"] .tab-table-root`), c, () => renderContratoDetail(container));
                }
            });
        });

        el.querySelector('#btn-gen-contrato')?.addEventListener('click', () => {
            window.open(`/admin/api/contracts/${id}/document`, '_blank');
        });

        el.querySelector('#btn-edit-contrato')?.addEventListener('click', () => {
            const formPanel = new FormPanel({
                title: 'Contract',
                fields: [
                    { key: 'contract_ref', label: 'Contract ref', required: true },
                    { key: 'property_name', label: 'Property', required: true },
                    { key: 'address', label: 'Address' },
                    { key: 'tenant_name', label: 'Tenant' },
                    { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Active', 'Ended', 'Suspended'] },
                    { key: 'rent', label: 'Monthly rent', type: 'number' },
                    { key: 'total', label: 'Total value', type: 'number' },
                    { key: 'start_date', label: 'Start date', type: 'date' },
                    { key: 'end_date', label: 'End date', type: 'date' },
                    { key: 'tags', label: 'Tags (comma separated)' },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/contracts/${id}`, formData);
                    Toast.show('Contract updated');
                    renderContratoDetail(container);
                }
            });
            formPanel.open(c);
        });

    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading contract: ${escapeHtml(e.message)}</div>`;
    }
}

Object.assign(AdminApp, { renderContratoDetail });

})(window.AdminApp);
(function(AdminApp) {

const {
    formatCurrency, formatDate, escapeHtml,
    statusBadge, progressBar, rateColor
} = AdminApp;

function renderContratoResumen(c, invoices, depositos, propietario, activoId, detail) {
    let html = '';

    html += `<div class="detail-info-grid">
        <div class="detail-info-section">
            <h3>Contract details</h3>
            <div class="detail-grid">
                <div class="detail-field"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(c.contract_ref)}</span></div>
                ${propietario ? `<div class="detail-field"><span class="detail-label">Owner</span><span class="detail-value">${escapeHtml(propietario.name)}</span></div>` : ''}
                <div class="detail-field"><span class="detail-label">Tenant</span><span class="detail-value">${escapeHtml(c.tenant_name)}</span></div>
                <div class="detail-field"><span class="detail-label">Property</span><span class="detail-value"><a href="${activoId ? AdminApp.detailUrl('property', activoId) : AdminApp.listUrl('properties', {search: c.property_name})}" class="link-accent">${escapeHtml(c.property_name)}</a><br><span class="text-sm text-tertiary">${escapeHtml(c.address)}</span></span></div>
                ${c.type ? `<div class="detail-field"><span class="detail-label">Type</span><span class="detail-value">${escapeHtml(c.type)}</span></div>` : ''}
            </div>
        </div>
        <div class="detail-info-section">
            <h3>Dates and value</h3>
            <div class="detail-grid">
                <div class="detail-field"><span class="detail-label">Dates</span><span class="detail-value">${formatDate(c.start_date)} - ${formatDate(c.end_date)}</span></div>
                <div class="detail-field"><span class="detail-label">Contract value</span><span class="detail-value">${formatCurrency(c.total)}</span></div>
                ${c.tags && c.tags.length ? `<div class="detail-field"><span class="detail-label">Tags</span><span class="detail-value">${c.tags.map(t => `<span class="badge badge-blue">${escapeHtml(t)}</span>`).join(' ')}</span></div>` : ''}
            </div>
        </div>
    </div>`;

    const fianza = depositos.length > 0 ? depositos[0] : null;
    html += `<div class="detail-info-grid">
        <div class="detail-info-section">
            <h3>Rent</h3>
            <div class="detail-grid">
                <div class="detail-field"><span class="detail-label">Monthly rent</span><span class="detail-value value-lg">${formatCurrency(c.rent)}</span></div>
            </div>
        </div>
        <div class="detail-info-section${fianza ? ' clickable-row' : ''}"${fianza ? ` data-href="${AdminApp.detailUrl('deposit', fianza.id)}"` : ''}>
            <h3>Deposit${fianza ? ' <span class="text-sm text-accent">View details &rsaquo;</span>' : ''}</h3>
            ${fianza ? `<div class="detail-grid">
                <div class="detail-field"><span class="detail-label">Amount</span><span class="detail-value value-lg">${formatCurrency(fianza.total)}</span></div>
                <div class="detail-field"><span class="detail-label">Status</span><span class="detail-value">${statusBadge(fianza.status, 'deposit')}</span></div>
                <div class="detail-field"><span class="detail-label">Paid</span><span class="detail-value">${formatCurrency(fianza.paid)}</span></div>
            </div>` : '<p class="text-tertiary text-sm">No deposit recorded</p>'}
        </div>
    </div>`;

    const ri = detail.rent_review;
    const di = detail.discounts;
    if (ri || di) {
        html += '<div class="detail-info-grid">';
        if (ri) {
            html += `<div class="detail-info-section">
                <h3>Rent review <span class="badge badge-blue">${escapeHtml(ri.applicable_index.toUpperCase())}</span></h3>
                <div class="detail-grid">
                    ${ri.current_variation != null ? `<div class="detail-field"><span class="detail-label">Current variation</span><span class="detail-value ${parseFloat(ri.current_variation) >= 0 ? 'text-danger' : 'text-success'}">${ri.current_variation}%</span></div>` : ''}
                    ${ri.projected_rent ? `<div class="detail-field"><span class="detail-label">Projected rent</span><span class="detail-value text-semibold">${formatCurrency(ri.projected_rent)}</span></div>` : ''}
                    ${ri.next_review ? `<div class="detail-field"><span class="detail-label">Next review</span><span class="detail-value">${formatDate(ri.next_review)}</span></div>` : ''}
                </div>
            </div>`;
        }
        if (di) {
            html += `<div class="detail-info-section">
                <h3>Discounts</h3>
                ${di.active_discounts && di.active_discounts.length > 0 ? `<div class="detail-grid">
                    ${di.active_discounts.map(d => `<div class="detail-field"><span class="detail-label">${escapeHtml(d.label || d.category)}</span><span class="detail-value text-success">-${formatCurrency(d.calculated_amount)}</span></div>`).join('')}
                    <div class="detail-field border-top pt-2">
                        <span class="detail-label text-semibold">Effective rent</span>
                        <span class="detail-value value-lg">${formatCurrency(di.effective_rent)}</span>
                    </div>
                </div>` : '<p class="text-tertiary text-sm">No active discounts</p>'}
            </div>`;
        }
        html += '</div>';
    }

    const now = new Date();
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthInvoices = invoices.filter(inv => inv.invoice_date && inv.invoice_date.startsWith(thisMonth));
    const collected = monthInvoices.reduce((s, inv) => s + (parseFloat(inv.paid) || 0), 0);
    const uncollected = monthInvoices.reduce((s, inv) => s + ((parseFloat(inv.total) || 0) - (parseFloat(inv.paid) || 0)), 0);
    const monthTotal = collected + uncollected;
    const monthPct = monthTotal > 0 ? (collected / monthTotal * 100) : 0;

    html += `<div class="detail-info-grid">
        <div class="detail-info-section">
            <h3>This month's rentals</h3>
            <div class="detail-grid">
                <div class="detail-field"><span class="detail-label">Collected</span><span class="detail-value text-right">${formatCurrency(collected)}</span></div>
                <div class="detail-field"><span class="detail-label text-danger">Outstanding</span><span class="detail-value text-right text-danger">${formatCurrency(uncollected)}</span></div>
            </div>
            <div class="mt-2">${progressBar(monthPct, rateColor(monthPct))}</div>
        </div>
        <div class="detail-info-section">
            <h3>Financial summary</h3>
            <div class="detail-grid">
                <div class="detail-field"><span class="detail-label">Total invoices</span><span class="detail-value">${invoices.length}</span></div>
                <div class="detail-field"><span class="detail-label">Total invoiced</span><span class="detail-value">${formatCurrency(invoices.reduce((s, i) => s + (parseFloat(i.total) || 0), 0))}</span></div>
                <div class="detail-field"><span class="detail-label">Total collected</span><span class="detail-value">${formatCurrency(invoices.reduce((s, i) => s + (parseFloat(i.paid) || 0), 0))}</span></div>
            </div>
        </div>
    </div>`;

    return html;
}

Object.assign(AdminApp, { renderContratoResumen });

})(window.AdminApp);
(function(AdminApp) {

const { api, Toast, confirmAction, formatCurrency, formatDate, escapeHtml } = AdminApp;

async function renderRevisionRentaTab(container, contrato) {
    container.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const data = await api.get(`/contracts/${contrato.id}/revision_renta`);
        let html = '';

        html += '<div class="detail-info-grid">';
        html += `<div class="detail-info-section">
            <h3>Applicable index: <span class="badge badge-blue">${escapeHtml(data.indice_aplicable.toUpperCase())}</span></h3>
            <p class="text-sm text-muted mb-3 mt-0">${escapeHtml(data.razon)}</p>
            <div class="detail-grid">
                <div class="detail-field"><span class="detail-label">Current rent</span><span class="detail-value value-lg">${formatCurrency(data.alquiler_actual)}</span></div>
                ${data.proxima_revision ? `<div class="detail-field"><span class="detail-label">Next review</span><span class="detail-value">${formatDate(data.proxima_revision)}</span></div>` : ''}
                ${data.variacion_actual != null ? `<div class="detail-field"><span class="detail-label">Variation ${data.indice_aplicable.toUpperCase()} actual</span><span class="detail-value text-semibold ${parseFloat(data.variacion_actual) >= 0 ? 'text-danger' : 'text-success'}">${data.variacion_actual}%</span></div>` : ''}
                ${data.alquiler_proyectado ? `<div class="detail-field"><span class="detail-label">Projected rent</span><span class="detail-value text-bold">${formatCurrency(data.alquiler_proyectado)}</span></div>` : ''}
            </div>
        </div>`;

        html += `<div class="detail-info-section">
            <h3>Apply review</h3>
            <form id="form-aplicar-revision" class="flex-col gap-3">
                <div>
                    <label class="field-label">Year-on-year variation (%)</label>
                    <input type="number" step="0.01" name="variacion" class="field-input"
                        ${data.variacion_actual != null ? `value="${data.variacion_actual}"` : ''}
                        placeholder="e.g. 2.29" required>
                </div>
                ${data.variacion_actual != null && data.alquiler_proyectado ? `
                <p class="text-sm text-muted m-0">
                    New rent: <strong>${formatCurrency(data.alquiler_proyectado)}</strong>
                </p>` : ''}
                <div>
                    <label class="field-label">Notes</label>
                    <textarea name="notas" class="field-input" rows="2" placeholder="Optional"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Apply review</button>
            </form>
        </div>`;
        html += '</div>';

        if (data.historial && data.historial.length > 0) {
            html += '<div class="detail-info-section mt-4"><h3>Review history</h3>';
            html += '<table class="data-table"><thead><tr><th>Date</th><th>Index</th><th>Variation</th><th>Previous</th><th>New</th><th>Notes</th></tr></thead><tbody>';
            for (const h of data.historial) {
                html += `<tr>
                    <td>${formatDate(h.fecha_aplicacion)}</td>
                    <td><span class="badge badge-blue">${escapeHtml(h.indice_tipo)}</span></td>
                    <td>${h.variacion}%</td>
                    <td>${formatCurrency(h.alquiler_anterior)}</td>
                    <td>${formatCurrency(h.alquiler_nuevo)}</td>
                    <td>${escapeHtml(h.notas || '')}</td>
                </tr>`;
            }
            html += '</tbody></table></div>';
        } else {
            html += '<p class="empty-placeholder">No previous reviews</p>';
        }

        container.innerHTML = html;

        container.querySelector('#form-aplicar-revision')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const variacion = parseFloat(fd.get('variacion'));
            if (isNaN(variacion)) { Toast.show('Invalid variation', 'error'); return; }
            const ok = await confirmAction('Apply review', `Apply review de ${variacion}%? This will update the contract rent.`);
            if (!ok) return;
            try {
                const result = await api.post(`/contracts/${contrato.id}/revision_renta`, {
                    variacion: variacion,
                    notas: fd.get('notas') || null,
                });
                Toast.show(`Review applied: ${formatCurrency(result.alquiler_anterior)} -> ${formatCurrency(result.alquiler_nuevo)}`);
                renderRevisionRentaTab(container, contrato);
            } catch (err) {
                Toast.show('Error: ' + err.message, 'error');
            }
        });
    } catch (err) {
        container.innerHTML = `<div class="empty-state">Error loading review data: ${escapeHtml(err.message)}</div>`;
    }
}

Object.assign(AdminApp, { renderRevisionRentaTab });

})(window.AdminApp);
(function(AdminApp) {

const { api, Toast, formatCurrency, formatDate, escapeHtml } = AdminApp;

function renderDiscountCard(d, historical) {
    return `<div class="discount-card${historical ? ' discount-card--historical' : ''}">
        <div class="discount-header">
            <span class="discount-label">${escapeHtml(d.etiqueta || d.categoria)}</span>
            <span class="discount-amount">-${d.es_porcentaje ? d.valor_numerico + '%' : formatCurrency(d.valor_numerico)}</span>
        </div>
        <div class="discount-dates">${formatDate(d.fecha_inicio)} - ${formatDate(d.fecha_fin)}</div>
        <div class="discount-effective">Amount: -${formatCurrency(d.importe_calculado)}/mes</div>
        ${d.notas ? `<div class="discount-notes">${escapeHtml(d.notas)}</div>` : ''}
    </div>`;
}

async function renderDescuentosTab(container, contrato) {
    container.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const data = await api.get(`/contracts/${contrato.id}/descuentos`);
        let html = '';

        html += '<div class="detail-info-grid">';
        html += `<div class="detail-info-section">
            <h3>Discount summary</h3>
            <div class="detail-grid">
                <div class="detail-field"><span class="detail-label">Base rent</span><span class="detail-value">${formatCurrency(data.alquiler_base)}</span></div>
                <div class="detail-field"><span class="detail-label">Total discounts</span><span class="detail-value text-success">-${formatCurrency(data.total_descuento)}</span></div>
                <div class="detail-field border-top pt-2">
                    <span class="detail-label text-semibold">Effective rent</span>
                    <span class="detail-value value-lg">${formatCurrency(data.alquiler_efectivo)}</span>
                </div>
            </div>
        </div>`;

        html += `<div class="detail-info-section">
            <h3>New discount</h3>
            <form id="form-crear-descuento" class="flex-col gap-3">
                <div class="grid-2col">
                    <div><label class="field-label">Amount</label><input type="number" step="0.01" name="valor_numerico" class="field-input" required></div>
                    <div><label class="field-label">Tipo</label><select name="es_porcentaje" class="field-input"><option value="false">GBP (fixed amount)</option><option value="true">% (percentage)</option></select></div>
                    <div><label class="field-label">Start date</label><input type="date" name="fecha_inicio" class="field-input" required></div>
                    <div><label class="field-label">End date</label><input type="date" name="fecha_fin" class="field-input" required></div>
                </div>
                <div><label class="field-label">Label</label><input type="text" name="etiqueta" class="field-input" placeholder="e.g. First months discount"></div>
                <div><label class="field-label">Notes</label><textarea name="notas" class="field-input" rows="2" placeholder="Optional"></textarea></div>
                <button type="submit" class="btn btn-primary">Create discount</button>
            </form>
        </div>`;
        html += '</div>';

        if (data.descuentos_activos.length > 0) {
            html += '<div class="detail-info-section mt-4"><h3>Active discounts</h3><div class="discount-cards">';
            for (const d of data.descuentos_activos) {
                html += renderDiscountCard(d);
            }
            html += '</div></div>';
        }

        if (data.descuentos_historicos.length > 0) {
            html += '<div class="detail-info-section mt-4"><h3>Discount history</h3><div class="discount-cards">';
            for (const d of data.descuentos_historicos) {
                html += renderDiscountCard(d, true);
            }
            html += '</div></div>';
        }

        if (data.descuentos_activos.length === 0 && data.descuentos_historicos.length === 0) {
            html += '<p class="empty-placeholder">No discounts recorded</p>';
        }

        container.innerHTML = html;

        container.querySelector('#form-crear-descuento')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
                await api.post(`/contracts/${contrato.id}/descuentos`, {
                    valor_numerico: parseFloat(fd.get('valor_numerico')),
                    es_porcentaje: fd.get('es_porcentaje') === 'true',
                    fecha_inicio: fd.get('fecha_inicio'),
                    fecha_fin: fd.get('fecha_fin'),
                    etiqueta: fd.get('etiqueta') || null,
                    notas: fd.get('notas') || null,
                });
                Toast.show('Discount created');
                renderDescuentosTab(container, contrato);
            } catch (err) {
                Toast.show('Error: ' + err.message, 'error');
            }
        });
    } catch (err) {
        container.innerHTML = `<div class="empty-state">Error: ${escapeHtml(err.message)}</div>`;
    }
}

Object.assign(AdminApp, { renderDescuentosTab });

})(window.AdminApp);
(function(AdminApp) {

const {
    api, Toast, DataTable, FormPanel,
    formatFileSize, formatDate, escapeHtml, confirmAction, API_BASE
} = AdminApp;

function renderDocumentoCard(doc) {
    const isImage = doc.file_type && doc.file_type.startsWith('image/');
    const hasFile = doc.original_file;
    const downloadUrl = hasFile ? `${API_BASE}/contract_documents/${doc.id}/download` : null;
    const tipoLabel = doc.type || 'contract';

    let preview;
    if (!hasFile) {
        preview = '<div class="cert-icon">--</div>';
    } else if (isImage) {
        preview = `<img src="${downloadUrl}" alt="${escapeHtml(doc.name)}" class="cert-thumb">`;
    } else {
        preview = '<div class="cert-icon">PDF</div>';
    }

    const previewLink = downloadUrl
        ? `<a href="${downloadUrl}" target="_blank" class="cert-preview">${preview}</a>`
        : `<div class="cert-preview">${preview}</div>`;

    const nameLink = downloadUrl
        ? `<a href="${downloadUrl}" target="_blank" class="cert-name">${escapeHtml(doc.name)}</a>`
        : `<span class="cert-name">${escapeHtml(doc.name)}</span>`;

    const meta = [
        `<span class="badge badge-blue">${escapeHtml(tipoLabel)}</span>`,
        doc.size ? formatFileSize(doc.size) : null,
        doc.document_date ? formatDate(doc.document_date) : formatDate(doc.created_at),
    ].filter(Boolean).join(' &middot; ');

    return `<div class="cert-card" data-doc-id="${doc.id}">
        ${previewLink}
        <div class="cert-info">
            ${nameLink}
            <span class="cert-meta">${meta}</span>
        </div>
        <button class="btn-icon doc-delete" data-doc-id="${doc.id}" title="Delete">&times;</button>
    </div>`;
}

async function renderDocumentsTab(container, contrato, renderContratoDetail) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const contratoId = contrato.id;

    try {
        const resp = await api.get(`/contract_documents?contract_id=${contratoId}&per_page=100`);
        const docs = resp.items || resp.data || [];

        let html = `<div class="flex justify-between items-center mb-4">
            <h3>Contract documents</h3>
            <div class="flex gap-2">
                <label class="btn btn-secondary btn-sm clickable">
                    <input type="file" id="doc-file-input" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" multiple class="hidden">
                    Upload file
                </label>
            </div>
        </div>
        <div id="doc-drop-zone" class="cert-drop-zone">
            <p>Drag files here or use the button</p>
        </div>
        <div id="doc-list" class="cert-list">
            ${docs.length === 0 ? '<p class="text-tertiary text-sm">No attached documents</p>' : ''}
            ${docs.map(d => renderDocumentoCard(d)).join('')}
        </div>`;

        el.innerHTML = html;

        // File input upload
        el.querySelector('#doc-file-input')?.addEventListener('change', async (e) => {
            for (const file of e.target.files) {
                try {
                    await api.uploadFile(`/contracts/${contratoId}/documents`, file);
                    Toast.show(`${file.name} uploaded successfully`);
                } catch (err) {
                    Toast.show(`Error: ${err.message}`, 'error');
                }
            }
            renderDocumentsTab(container, contrato, renderContratoDetail);
        });

        // Drag-drop upload
        const dropZone = el.querySelector('#doc-drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
            dropZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                for (const file of e.dataTransfer.files) {
                    try {
                        await api.uploadFile(`/contracts/${contratoId}/documents`, file);
                        Toast.show(`${file.name} uploaded successfully`);
                    } catch (err) {
                        Toast.show(`Error: ${err.message}`, 'error');
                    }
                }
                renderDocumentsTab(container, contrato, renderContratoDetail);
            });
        }

        // Delete buttons
        el.querySelectorAll('.doc-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const docId = btn.dataset.docId;
                const ok = await confirmAction('Delete document', 'This action cannot be undone.');
                if (ok) {
                    await api.del(`/contract_documents/${docId}`);
                    Toast.show('Document deleted');
                    renderDocumentsTab(container, contrato, renderContratoDetail);
                }
            });
        });
    } catch (err) {
        el.innerHTML = `<p class="text-danger">Error loading documents: ${escapeHtml(err.message)}</p>`;
    }
}

function initContratoTabTable(tabName, container, contrato, renderContratoDetail) {
    const contratoName = contrato.contract_ref;
    const activoName = contrato.property_name;

    switch (tabName) {
        case 'revision_renta':
            AdminApp.renderRevisionRentaTab(container, contrato);
            return null;
        case 'descuentos':
            AdminApp.renderDescuentosTab(container, contrato);
            return null;
        case 'alquileres':
            return new DataTable(container, {
                entity: 'billing',
                apiPath: '/invoices',
                showPeriodFilter: true,
                defaultFilters: { type: 'income', contract_ref: contratoName },
                columns: [
                    { key: 'reference', label: 'Ref' },
                    { key: 'description', label: 'Description' },
                    { key: 'status', label: 'Status', type: 'status' },
                    { key: 'total', label: 'Total', type: 'currency' },
                    { key: 'paid', label: 'Paid', type: 'currency' },
                    { key: 'invoice_date', label: 'Date', type: 'date' },
                ],
                filters: [
                    { key: 'status', label: 'Status', options: ['Unpaid', 'Partial', 'Paid'] },
                ],
                onRowClick: (row) => {
                    window.location.href = AdminApp.detailUrl('invoice', row.id);
                },
                onAction: async (action, row) => {
                    if (action === 'edit') {
                        const fp = new FormPanel({
                            title: 'Invoice',
                            fields: [
                                { key: 'reference', label: 'Reference', required: true },
                                { key: 'description', label: 'Description', required: true },
                                { key: 'total', label: 'Total', type: 'number', required: true },
                                { key: 'paid', label: 'Paid', type: 'number' },
                                { key: 'invoice_date', label: 'Date', required: true },
                                { key: 'status', label: 'Status', type: 'select', options: ['Auto', 'Unpaid', 'Partial', 'Paid'] },
                            ],
                            onSubmit: async (data, isEdit, original) => {
                                if (data.status === 'Auto') delete data.status;
                                await api.put(`/invoices/${original.id}`, data);
                                Toast.show('Invoice updated');
                            }
                        });
                        fp.open(row);
                    }
                }
            });
        case 'depositos':
            return new DataTable(container, {
                entity: 'deposit',
                apiPath: '/deposits',
                defaultFilters: { property_name: activoName },
                columns: [
                    { key: 'type', label: 'Type' },
                    { key: 'status', label: 'Status', type: 'status' },
                    { key: 'total', label: 'Total', type: 'currency' },
                    { key: 'paid', label: 'Paid', type: 'currency' },
                    { key: 'payer', label: 'Payer' },
                    { key: 'date', label: 'Date', type: 'date' },
                ],
                onRowClick: (row) => {
                    window.location.href = AdminApp.detailUrl('deposit', row.id);
                },
                onAction: async (action, row) => {
                    if (action === 'edit') {
                        const fp = new FormPanel({
                            title: 'Deposit',
                            fields: [
                                { key: 'property_name', label: 'Property', required: true },
                                { key: 'contract_ref', label: 'Contract' },
                                { key: 'type', label: 'Type', type: 'select', options: ['Deposit', 'Additional guarantee', 'Bank guarantee'] },
                                { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Paid', 'Returned', 'Official body'] },
                                { key: 'total', label: 'Total', type: 'number', required: true },
                                { key: 'paid', label: 'Paid', type: 'number' },
                                { key: 'payer', label: 'Payer', required: true },
                                { key: 'payee', label: 'Payee', required: true },
                                { key: 'date', label: 'Date', type: 'date' },
                            ],
                            onSubmit: async (data, isEdit, original) => {
                                await api.put(`/deposits/${original.id}`, data);
                                Toast.show('Deposit updated');
                            }
                        });
                        fp.open(row);
                    }
                }
            });
        case 'incidencias':
            return new DataTable(container, {
                entity: 'issue',
                apiPath: '/issues',
                defaultFilters: { property_name: activoName },
                columns: [
                    { key: 'title', label: 'Title' },
                    { key: 'priority', label: 'Priority', type: 'status' },
                    { key: 'status', label: 'Status', type: 'status' },
                    { key: 'cost', label: 'Cost', type: 'currency' },
                    { key: 'created_at', label: 'Created', type: 'date' },
                ],
                filters: [
                    { key: 'status', label: 'Status', options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
                    { key: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'] },
                ],
                onRowClick: (row) => {
                    window.location.href = AdminApp.detailUrl('issue', row.id);
                },
                onAction: async (action, row) => {
                    if (action === 'create') {
                        const fp = new FormPanel({
                            title: 'Issue',
                            fields: [
                                { key: 'property_name', label: 'Property', required: true },
                                { key: 'title', label: 'Title', required: true },
                                { key: 'description', label: 'Description', type: 'textarea' },
                                { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'], default: 'Medium' },
                                { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
                                { key: 'cost', label: 'Cost', type: 'number' },
                            ],
                            onSubmit: async (data) => {
                                await api.post('/issues', data);
                                Toast.show('Issue created');
                            }
                        });
                        fp.open({ property_name: activoName });
                    }
                    if (action === 'edit') {
                        const fp = new FormPanel({
                            title: 'Issue',
                            fields: [
                                { key: 'property_name', label: 'Property', required: true },
                                { key: 'title', label: 'Title', required: true },
                                { key: 'description', label: 'Description', type: 'textarea' },
                                { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
                                { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
                                { key: 'cost', label: 'Cost', type: 'number' },
                            ],
                            onSubmit: async (data, isEdit, original) => {
                                await api.put(`/issues/${original.id}`, data);
                                Toast.show('Issue updated');
                            }
                        });
                        fp.open(row);
                    }
                }
            });
        case 'documentos':
            renderDocumentsTab(container, contrato, renderContratoDetail);
            return null;
    }
}

Object.assign(AdminApp, { initContratoTabTable });

})(window.AdminApp);
(function(AdminApp) {

const { api, Toast, escapeHtml, formatCurrency } = AdminApp;

class RemesaBuilder {
    constructor(container) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.selectedRows = [];
        this.onSuccess = null;
        this.render();
    }

    update(selectedRows) {
        this.selectedRows = selectedRows || [];
        this.render();
    }

    render() {
        if (!this.container) return;

        if (this.selectedRows.length === 0) {
            this.container.innerHTML = `
                <div class="remesa-header">
                    <h3>Remesa SEPA</h3>
                    <div class="remesa-subtitle">Batch builder</div>
                </div>
                <div class="remesa-items">
                    <div class="remesa-empty">
                        Select invoices from the table to create a SEPA batch
                    </div>
                </div>`;
            return;
        }

        let totalAmount = 0;
        let totalNeto = 0;
        let totalVat = 0;
        this.selectedRows.forEach(r => {
            totalAmount += parseFloat(r.total) || 0;
            totalNeto += parseFloat(r.neto) || 0;
            totalVat += parseFloat(r.vat) || 0;
        });

        const today = new Date().toISOString().split('T')[0];

        this.container.innerHTML = `
            <div class="remesa-header">
                <h3>Remesa SEPA</h3>
                <div class="remesa-subtitle">${this.selectedRows.length} invoice${this.selectedRows.length !== 1 ? 's' : ''} selected</div>
            </div>
            <div class="remesa-items">
                ${this.selectedRows.map(r => `
                    <div class="remesa-item">
                        <div>
                            <div class="remesa-item-ref">${escapeHtml(r.referencia)}</div>
                            <div class="remesa-item-activo">${escapeHtml(r.activo)} - ${escapeHtml(r.pagador)}</div>
                        </div>
                        <div class="remesa-item-amount">${formatCurrency(r.total)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="remesa-totals">
                <div class="remesa-totals-row">
                    <span>Neto</span>
                    <span>${formatCurrency(totalNeto)}</span>
                </div>
                <div class="remesa-totals-row">
                    <span>IVA</span>
                    <span>${formatCurrency(totalVat)}</span>
                </div>
                <div class="remesa-totals-row total">
                    <span>Total</span>
                    <span>${formatCurrency(totalAmount)}</span>
                </div>
            </div>
            <div class="remesa-actions">
                <div class="remesa-form-group">
                    <label>Collection date</label>
                    <input type="date" class="remesa-fecha" value="${today}">
                </div>
                <div class="remesa-form-group">
                    <label>Presenter (Creditor)</label>
                    <input type="text" class="remesa-presentador-nombre" placeholder="Creditor name" value="PROPLIA LTD">
                </div>
                <div class="remesa-form-group">
                    <label>Creditor ID</label>
                    <input type="text" class="remesa-presentador-creditor-id" placeholder="B46454591" value="">
                </div>
                <div class="remesa-form-group">
                    <label>Suffix</label>
                    <input type="text" class="remesa-presentador-sufijo" placeholder="000" value="">
                </div>
                <div class="remesa-form-group">
                    <label>Receiver IBAN</label>
                    <input type="text" class="remesa-receptor-iban" placeholder="GB00 0000 0000 0000 0000 00" value="">
                </div>
                <div class="remesa-form-group">
                    <label>SWIFT/BIC</label>
                    <input type="text" class="remesa-receptor-swift-bic" placeholder="LOYDGB2L" value="">
                </div>
                <button class="btn btn-primary remesa-create-btn">Create SEPA Batch</button>
            </div>`;

        this.container.querySelector('.remesa-create-btn').addEventListener('click', () => this.createRemesa());
    }

    async createRemesa() {
        const val = (sel) => {
            const el = this.container.querySelector(sel);
            return el ? el.value.trim() : '';
        };

        const fecha = val('.remesa-fecha');
        const presentadorNombre = val('.remesa-presentador-nombre');
        const presentadorCreditorId = val('.remesa-presentador-creditor-id');
        const presentadorSufijo = val('.remesa-presentador-sufijo');
        const receptorIban = val('.remesa-receptor-iban');
        const receptorSwiftBic = val('.remesa-receptor-swift-bic');

        if (!fecha) {
            Toast.show('Enter a collection date', 'error');
            return;
        }
        if (!presentadorNombre) {
            Toast.show('Enter the presenter/creditor name', 'error');
            return;
        }

        const ids = this.selectedRows.map(r => r.id);
        const fechaCobro = new Date(fecha + 'T00:00:00Z').toISOString();

        try {
            const result = await api.post('/sepa-batches/batch', {
                contabilidad_ids: ids,
                fecha_cobro: fechaCobro,
                presentador_nombre: presentadorNombre,
                presentador_creditor_id: presentadorCreditorId || null,
                presentador_sufijo: presentadorSufijo || null,
                receptor_nombre: presentadorNombre,
                receptor_iban: receptorIban || null,
                receptor_swift_bic: receptorSwiftBic || null,
                receptor_sufijo: presentadorSufijo || null,
                receptor_creditor_id: presentadorCreditorId || null,
            });

            Toast.show(`Batch created: ${result.remesa_id} (${result.created} records, ${formatCurrency(result.total)})`);

            this.selectedRows = [];
            this.render();

            if (this.onSuccess) this.onSuccess();
        } catch (e) {
            Toast.show('Error creating batch: ' + e.message, 'error');
        }
    }
}

Object.assign(AdminApp, { RemesaBuilder });

})(window.AdminApp);
