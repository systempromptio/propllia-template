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
