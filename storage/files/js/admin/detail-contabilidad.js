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
