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
