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
