(function(AdminApp) {

const {
    api, formatCurrency, formatCurrencyValue,
    formatDate, escapeHtml,
    statusBadge, progressBar, rateColor
} = AdminApp;

const INSURANCE_WARNING_DAYS = 60;

const _summaryState = { insuranceStatusCache: null };

async function loadInsuranceStatus() {
    if (_summaryState.insuranceStatusCache) return _summaryState.insuranceStatusCache;
    try {
        _summaryState.insuranceStatusCache = await api.get('/reports/insurance_status');
    } catch {
        _summaryState.insuranceStatusCache = [];
    }
    return _summaryState.insuranceStatusCache;
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

function renderSummaryTab(a, f, images, invoices, contract) {
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

Object.assign(AdminApp, { applyInsuranceBadges, renderSummaryTab });

})(window.AdminApp);
