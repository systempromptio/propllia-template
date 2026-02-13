(function(AdminApp) {

const {
    openPanel, closePanel,
    api, escapeHtml,
    formatCurrency, formatDate,
    statusBadge, computeStatus,
    progressBar, daysUntil,
} = AdminApp;

async function openDocumentModal(docId) {
    try {
        const data = await api.get(`/contract_documents/${docId}/text`);
        const overlay = document.createElement('div');
        overlay.className = 'doc-modal-overlay';
        const modal = document.createElement('div');
        modal.className = 'doc-modal';
        modal.innerHTML = `
            <div class="doc-modal-header">
                <h3>${escapeHtml(data.name)}</h3>
                <button class="doc-modal-close-btn doc-modal-close">&times;</button>
            </div>
            <div class="doc-modal-body">${escapeHtml(data.content)}</div>`;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        AdminApp.ScrollLock.lock();
        modal.querySelector('.doc-modal-close').addEventListener('click', () => { overlay.remove(); AdminApp.ScrollLock.unlock(); });
        overlay.addEventListener('click', (e) => { if (e.target === overlay) { overlay.remove(); AdminApp.ScrollLock.unlock(); } });
        document.addEventListener('keydown', function handler(e) { if (e.key === 'Escape') { overlay.remove(); AdminApp.ScrollLock.unlock(); document.removeEventListener('keydown', handler); } });
    } catch (e) {
        window.AdminApp.Toast.show('Error loading document: ' + e.message, 'error');
    }
}

function renderPropertyFinancialDetail(f) {
    if (!f) return '';
    const invoiced = parseFloat(f.total_invoiced || 0);
    const collected = parseFloat(f.total_collected || 0);
    const outstanding = parseFloat(f.total_outstanding || 0);
    const rate = invoiced > 0 ? (collected / invoiced * 100) : 0;
    return `
        <div class="detail-section">
            <h4>Financial summary</h4>
            <div class="financial-cards">
                <div class="mini-card"><span class="mini-label">Invoiced</span><span class="mini-value">${formatCurrency(invoiced)}</span></div>
                <div class="mini-card success"><span class="mini-label">Collected</span><span class="mini-value">${formatCurrency(collected)}</span></div>
                <div class="mini-card ${outstanding > 0 ? 'error' : ''}"><span class="mini-label">Outstanding</span><span class="mini-value">${formatCurrency(outstanding)}</span></div>
            </div>
            <div class="mt-3">
                <div class="flex justify-between text-sm text-muted mb-2"><span>Collection rate</span><span>${rate.toFixed(1)}%</span></div>
                ${progressBar(rate, rate > 80 ? 'green' : rate > 50 ? 'amber' : 'red')}
            </div>
        </div>`;
}

function renderPropertyInvoices(invoices) {
    if (invoices.length === 0) return '';
    return `
        <div class="detail-section">
            <h4>Recent invoices (${invoices.length})</h4>
            <div class="table-container max-h-300 overflow-auto">
                <table class="data-table">
                    <thead><tr><th>Ref</th><th>Description</th><th>Status</th><th>Total</th><th>Paid</th><th>Date</th></tr></thead>
                    <tbody>
                        ${invoices.map(inv => `
                            <tr>
                                <td>${escapeHtml(inv.reference)}</td>
                                <td>${escapeHtml(inv.description)}</td>
                                <td>${statusBadge(inv.status, 'invoice')}</td>
                                <td class="numeric">${formatCurrency(inv.total)}</td>
                                <td class="numeric">${formatCurrency(inv.paid)}</td>
                                <td class="date">${escapeHtml(inv.invoice_date)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
}

function renderContractBasicInfo(row) {
    const fields = [['Contract ref', row.contract_ref], ['Property', row.property_name], ['Address', row.address], ['Tenant', row.tenant_name]];
    const financial = [['Monthly rent', formatCurrency(row.rent)], ['Contract value', formatCurrency(row.total)]];
    const dates = [['Start date', formatDate(row.start_date)], ['End date', formatDate(row.end_date)]];
    const days = daysUntil(row.end_date);
    const daysInfo = days != null
        ? `<div class="detail-section"><div class="mini-card ${days < 30 ? 'error' : days < 90 ? '' : 'success'}"><span class="mini-label">Days remaining</span><span class="mini-value">${days}</span></div></div>`
        : '';
    return `
        <div class="detail-section">
            <div class="flex items-center gap-3 mb-4">
                <h3 class="m-0">${escapeHtml(row.contract_ref)}</h3>
                ${statusBadge(row.status, 'contract')}
            </div>
        </div>
        ${AdminApp.detailSection('Identification', fields)}
        ${AdminApp.detailSection('Financial', financial)}
        ${AdminApp.detailSection('Dates', dates)}
        ${daysInfo}
        ${row.tags && row.tags.length ? `<div class="detail-section"><h4>Tags</h4><div>${row.tags.map(t => `<span class="badge badge-blue">${escapeHtml(t)}</span>`).join(' ')}</div></div>` : ''}`;
}

function renderContractDocuments(detail) {
    if (!detail.documents || detail.documents.length === 0) return '';
    let html = `<div class="detail-section"><h4>Documents (${detail.documents.length})</h4>`;
    detail.documents.forEach(doc => {
        html += `<div class="doc-item">
            <div class="doc-item-header">
                <div class="text-semibold">${escapeHtml(doc.name)}</div>
                ${doc.has_text ? `<button class="btn btn-sm btn-secondary doc-view-btn no-wrap" data-doc-id="${escapeHtml(doc.id)}">View text</button>` : ''}
            </div>
            <div class="doc-item-meta">
                <span class="badge badge-blue">${escapeHtml(doc.type)}</span>
                ${doc.document_date ? ` ${formatDate(doc.document_date)}` : ''}
            </div>
            ${doc.notes ? `<div class="doc-item-notes">${escapeHtml(doc.notes)}</div>` : ''}
        </div>`;
    });
    html += `</div>`;
    return html;
}

function renderContractDetails(detail) {
    if (!detail.extracted_data || detail.extracted_data.length === 0) return '';
    const catLabels = {
        price: 'Price', ipc: 'CPI', garantia: 'Guarantee',
        descuento_1: 'Discount 1', descuento_2: 'Discount 2', descuento_3: 'Discount 3',
        incremento_pct: 'Increment %', fin_contrato: 'End contract', ibi: 'Council Tax', extras: 'Extras'
    };
    let html = `<div class="detail-section"><h4>Extracted data</h4>`;
    html += `<table class="detail-data-table"><thead><tr><th>Category</th><th>Value</th><th>Amount</th><th>Period</th></tr></thead><tbody>`;
    detail.extracted_data.forEach(d => {
        const cat = catLabels[d.category] || d.category;
        const label = d.label ? ` (${escapeHtml(d.label)})` : '';
        html += `<tr>
            <td><span class="badge badge-blue">${escapeHtml(cat)}</span>${label}</td>
            <td>${d.value ? escapeHtml(d.value) : '-'}</td>
            <td>${d.numeric_value ? formatCurrency(d.numeric_value) : '-'}</td>
            <td class="text-sm">${formatDate(d.start_date)} → ${formatDate(d.end_date)}</td>
        </tr>`;
    });
    html += `</tbody></table></div>`;
    return html;
}

class DetailPanel {
    constructor() {
        this.overlay = null;
        this.panel = null;
        this._closing = false;
    }

    async openProperty(id) {
        openPanel(this, 'Property details');
        try {
            const data = await api.get(`/properties/${id}/detail`);
            if (!this.panel) return;
            const a = data.property;
            const images = data.images || [];
            let html = '';
            if (images.length > 0) {
                html += `<div class="detail-image-strip">${images.slice(0, 4).map(img => `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.filename)}" loading="lazy">`).join('')}</div>`;
                html += `<button class="detail-view-gallery-btn" data-gallery-id="${id}">&#128247; View property (${images.length} photos)</button>`;
            }
            html += `
                <div class="detail-section">
                    <h3>${escapeHtml(a.property_name)}</h3>
                    <div class="detail-grid">
                        <div class="detail-field"><span class="detail-label">Address</span><span class="detail-value">${escapeHtml(a.address)}</span></div>
                        <div class="detail-field"><span class="detail-label">Status</span><span class="detail-value">${statusBadge(a.status, 'property')}</span></div>
                        <div class="detail-field"><span class="detail-label">Contract</span><span class="detail-value">${escapeHtml(a.contract_ref) || '-'}</span></div>
                        <div class="detail-field"><span class="detail-label">Monthly rent</span><span class="detail-value">${formatCurrency(a.rent)}</span></div>
                        <div class="detail-field"><span class="detail-label">Contract start</span><span class="detail-value">${formatDate(a.start_date)}</span></div>
                        <div class="detail-field"><span class="detail-label">Contract end</span><span class="detail-value">${formatDate(a.end_date)}</span></div>
                        ${a.tags && a.tags.length ? `<div class="detail-field"><span class="detail-label">Tags</span><span class="detail-value">${a.tags.map(t => `<span class="badge badge-blue">${escapeHtml(t)}</span>`).join(' ')}</span></div>` : ''}
                    </div>
                </div>`;
            html += renderPropertyFinancialDetail(data.financial);
            html += renderPropertyInvoices(data.invoices || []);
            this.panel.querySelector('.panel-body').innerHTML = html;
        } catch (e) {
            if (this.panel) {
                this.panel.querySelector('.panel-body').innerHTML =
                    `<div class="empty-state">Error loading details: ${escapeHtml(e.message)}</div>`;
            }
        }
    }

    async openContract(row) {
        openPanel(this, 'Contract details');
        if (!this.panel) return;
        let html = renderContractBasicInfo(row);
        try {
            const detail = await api.get(`/contracts/${row.id}/detail`);
            html += renderContractDocuments(detail);
            html += renderContractDetails(detail);
        } catch (_) {
        }
        this.panel.querySelector('.panel-body').innerHTML = html;
        this.panel.querySelectorAll('.doc-view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                openDocumentModal(btn.dataset.docId);
            });
        });
    }

    async openBilling(row) {
        openPanel(this, 'Invoice details');
        if (!this.panel) return;
        const fields = [['Reference', row.reference], ['Description', row.description], ['Contract', row.contract_ref], ['Property', row.property_name], ['Payer', row.payer], ['Payee', row.payee]];
        const amounts = [['Net', formatCurrency(row.net)], ['VAT', formatCurrency(row.vat)], ['Withholding', formatCurrency(row.withholding)], ['Total', formatCurrency(row.total)], ['Paid', formatCurrency(row.paid)], ['Discount', formatCurrency(row.discount)], ['Discount %', row.discount_pct ? `${row.discount_pct}%` : '-']];
        const dates = [['Invoice date', row.invoice_date || '-'], ['Payment date', formatDate(row.payment_date)]];
        const payment = [['Payment method', row.payment_method || '-'], ['Payer account', row.payer_account || '-']];
        const html = `
            <div class="detail-section">
                <div class="flex items-center gap-3 mb-4">
                    <h3 class="m-0">${escapeHtml(row.reference)}</h3>
                    ${statusBadge(computeStatus(row), 'invoice')}
                </div>
            </div>
            ${AdminApp.detailSection('Identification', fields)}
            ${AdminApp.detailSection('Amounts', amounts)}
            ${AdminApp.detailSection('Dates', dates)}
            ${AdminApp.detailSection('Payment', payment)}
            ${row.notes ? `<div class="detail-section"><h4>Notes</h4><p class="text-muted text-sm">${escapeHtml(row.notes)}</p></div>` : ''}`;
        this.panel.querySelector('.panel-body').innerHTML = html;
    }

    close() { closePanel(this); }
}

Object.assign(AdminApp, { DetailPanel, openDocumentModal });

})(window.AdminApp);
