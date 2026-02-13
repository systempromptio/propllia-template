(function(AdminApp) {

const {
    api, Toast,
    formatCurrency,
    escapeHtml, statusBadge,
    stringToColor,
} = AdminApp;

async function renderOverdue(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;

    try {
        const data = await api.get('/reports/overdue');
        const items = Array.isArray(data) ? data : (data.data || []);

        if (items.length === 0) {
            el.innerHTML = '<div class="empty-center"><p>No overdue invoices</p></div>';
            return;
        }

        items.sort((a, b) => (b.days_overdue || 0) - (a.days_overdue || 0));
        const totalOwed = items.reduce((s, r) => s + parseFloat(r.total_owed || 0), 0);
        const totalInvoices = items.reduce((s, r) => s + (r.num_invoices || 0), 0);

        let html = `
        <div class="dashboard-grid">
            <div class="stat-card error">
                <div class="label">Total overdue</div>
                <div class="value currency">${AdminApp.formatCurrencyValue(totalOwed)}</div>
                <div class="kpi-subtitle">${items.length} tenant${items.length !== 1 ? 's' : ''} with outstanding balances</div>
            </div>
            <div class="stat-card">
                <div class="label">Overdue invoices</div>
                <div class="value">${totalInvoices}</div>
                <div class="kpi-subtitle">Across ${items.length} tenant${items.length !== 1 ? 's' : ''}</div>
            </div>
        </div>

        <h2 class="section-title">Overdue by tenant</h2>
        <div class="table-container">
            <table class="data-table">
                <thead><tr>
                    <th>Tenant</th><th>Property</th><th class="numeric">Amount owed</th>
                    <th class="numeric">Invoices</th><th class="numeric">Days overdue</th>
                </tr></thead>
                <tbody>
                    ${items.map(r => {
                        const days = r.days_overdue || 0;
                        const severity = days > 60 ? 'numeric-danger text-semibold' : days > 30 ? 'numeric-danger' : '';
                        return `
                        <tr>
                            <td>${escapeHtml(r.payer)}</td>
                            <td><div class="property-cell"><div class="property-avatar" style="background:${stringToColor(r.property_name)}">${(r.property_name || '?').charAt(0).toUpperCase()}</div><span class="property-name">${escapeHtml(r.property_name)}</span></div></td>
                            <td class="numeric numeric-danger">${formatCurrency(r.total_owed)}</td>
                            <td class="numeric">${r.num_invoices}</td>
                            <td class="numeric ${severity}">${days}d</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>`;

        el.innerHTML = html;
    } catch (e) {
        Toast.show('Error loading overdue data: ' + e.message, 'error');
        el.innerHTML = '<div class="empty-center">Error loading overdue data.</div>';
    }
}

AdminApp.renderOverdue = renderOverdue;

})(window.AdminApp);
