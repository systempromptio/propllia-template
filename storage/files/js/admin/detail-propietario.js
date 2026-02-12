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
