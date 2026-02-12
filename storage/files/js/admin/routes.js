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
