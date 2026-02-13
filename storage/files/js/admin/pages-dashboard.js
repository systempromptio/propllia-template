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
                        <td><div class="property-cell"><div class="property-avatar" style="background:var(--bg-surface-raised);color:var(--text-primary);font-size:12px">&Sigma;</div><span class="property-name"><strong>All properties (${properties.length})</strong></span></div></td>
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
    renderPropertyFinancialTable,
});

})(window.AdminApp);
