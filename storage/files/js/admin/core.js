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
