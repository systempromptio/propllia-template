(function(AdminApp) {

const {
    api, Toast, FormPanel,
    formatCurrency, formatDate,
    escapeHtml, statusBadge,
} = AdminApp;

async function renderSepaBatchDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const id = AdminApp.getIdFromUrl();
    if (!id) { el.innerHTML = '<div class="empty-state">No SEPA batch specified.</div>'; return; }

    try {
        const data = await api.get(`/sepa-batches/${id}/detail`);
        const r = data.remesa;
        const rentals = data.rentals || [];

        let html = '';

        html += AdminApp.breadcrumb('sepa_batches', 'SEPA Batches', r.nombre_remesa);

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${escapeHtml(r.nombre_remesa)}</h1>
                ${statusBadge(r.estado, 'remesa')}
            </div>
            <div class="header-actions">
                <select id="sepa-batch-status-select" class="inline-select">
                    ${['Pending','Sent','Completed','Returned'].map(e =>
                        `<option value="${e}" ${r.estado === e ? 'selected' : ''}>${e}</option>`
                    ).join('')}
                </select>
                <button class="btn btn-secondary" id="btn-edit-sepa-batch">Edit</button>
            </div>
        </div>`;

        html += `<div class="detail-info-grid mb-0">
            <div class="detail-info-section">
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Batch name</span><span class="detail-value">${escapeHtml(r.nombre_remesa)}</span></div>
                </div>
            </div>
            <div class="detail-info-section">
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Collection date</span><span class="detail-value">${formatDate(r.fecha_cobro)}</span></div>
                </div>
            </div>
        </div>`;

        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Presenter</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(r.presentador_nombre)}</span></div>
                    <div class="detail-field"><span class="detail-label">Creditor ID</span><span class="detail-value">${escapeHtml(r.presentador_creditor_id) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Suffix</span><span class="detail-value">${escapeHtml(r.presentador_sufijo) || '-'}</span></div>
                </div>
            </div>
            <div class="detail-info-section">
                <h3>Receiver</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(r.receptor_nombre) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Suffix</span><span class="detail-value">${escapeHtml(r.receptor_sufijo) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">SWIFT/BIC</span><span class="detail-value">${escapeHtml(r.receptor_swift_bic) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Creditor ID</span><span class="detail-value">${escapeHtml(r.receptor_creditor_id) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">IBAN</span><span class="detail-value">${escapeHtml(r.receptor_iban) || '-'}</span></div>
                </div>
            </div>
        </div>`;

        html += `<div class="detail-info-section mt-4">
            <div class="flex justify-between items-center mb-3">
                <h3 class="m-0">Rentals (${rentals.length})</h3>
            </div>`;

        if (rentals.length > 0) {
            html += `<div class="overflow-x-auto">
            <table class="data-table detail-data-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th>Property</th>
                        <th>Contract</th>
                        <th>Payer</th>
                        <th class="text-right">Count</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${rentals.map(item => `
                        <tr class="clickable-row" data-href="${AdminApp.detailUrl('invoice', item.id)}">
                            <td>${escapeHtml(item.concepto || item.referencia)}</td>
                            <td>${escapeHtml(item.activo)}</td>
                            <td>${escapeHtml(item.contrato) || '-'}</td>
                            <td>${escapeHtml(item.pagador)}</td>
                            <td class="text-right text-semibold">${formatCurrency(item.total)}</td>
                            <td>${statusBadge(item.estado, 'contabilidad')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            </div>`;
        } else {
            html += `<p class="text-tertiary text-14">No rentals linked to this batch.</p>`;
        }

        const totalRegistros = r.total_registros || rentals.length;
        const totalCantidad = r.total_cantidad || rentals.reduce((s, a) => s + (parseFloat(a.total) || 0), 0);
        html += `<div class="summary-row">
            <div><strong>Total records:</strong> ${totalRegistros}</div>
            <div><strong>Total amount:</strong> ${formatCurrency(totalCantidad)}</div>
        </div>`;

        html += `</div>`;

        if (r.notas) {
            html += `<div class="detail-info-section mt-4"><h3>Notes</h3><p class="note-text">${escapeHtml(r.notas)}</p></div>`;
        }

        el.innerHTML = html;

        el.querySelector('#sepa-batch-status-select')?.addEventListener('change', async (e) => {
            try {
                await api.put(`/sepa-batches/${id}`, { estado: e.target.value });
                Toast.show('Status updated');
                renderSepaBatchDetail(container);
            } catch (err) {
                Toast.show('Error: ' + err.message, 'error');
            }
        });

        el.querySelector('#btn-edit-sepa-batch')?.addEventListener('click', () => {
            const fp = new FormPanel({
                title: 'SEPA Batch',
                fields: [
                    { key: 'nombre_remesa', label: 'Batch name', required: true },
                    { key: 'fecha_cobro', label: 'Collection date', type: 'date', required: true },
                    { key: 'estado', label: 'Status', type: 'select', options: ['Pending', 'Sent', 'Completed', 'Returned'] },
                    { key: 'presentador_nombre', label: 'Presenter (name)', required: true },
                    { key: 'presentador_creditor_id', label: 'Creditor ID' },
                    { key: 'presentador_sufijo', label: 'Suffix' },
                    { key: 'receptor_nombre', label: 'Receiver (name)' },
                    { key: 'receptor_iban', label: 'Receptor IBAN' },
                    { key: 'receptor_swift_bic', label: 'Receptor SWIFT/BIC' },
                    { key: 'notas', label: 'Notes', type: 'textarea' },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/sepa-batches/${id}`, formData);
                    Toast.show('Batch updated');
                    renderSepaBatchDetail(container);
                }
            });
            fp.open(r);
        });
    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading SEPA batch: ${escapeHtml(e.message)}</div>`;
    }
}

AdminApp.renderSepaBatchDetail = renderSepaBatchDetail;

})(window.AdminApp);
