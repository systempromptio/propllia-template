(function(AdminApp) {

const {
    api, Toast, FormPanel, confirmAction,
    formatCurrency, formatDate,
    escapeHtml, statusBadge,
} = AdminApp;

async function renderDepositoDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const id = AdminApp.getIdFromUrl();
    if (!id) { el.innerHTML = '<div class="empty-state">No deposit specified.</div>'; return; }

    try {
        const data = await api.get(`/deposits/${id}/detail`);
        const d = data.deposito || data;

        let html = '';

        html += AdminApp.breadcrumb('deposits', 'Deposits', (d.tipo || 'Deposit') + ' \u2014 ' + (d.propiedad || ''));

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${escapeHtml(d.tipo || 'Deposit')}</h1>
                ${statusBadge(d.estado, 'deposito')}
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="btn-edit-deposito">Edit</button>
            </div>
        </div>`;

        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Amounts</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Total</span><span class="detail-value value-lg">${formatCurrency(d.total)}</span></div>
                    <div class="detail-field"><span class="detail-label">Paid</span><span class="detail-value">${formatCurrency(d.pagado)}</span></div>
                    <div class="detail-field"><span class="detail-label">Returned</span><span class="detail-value">${formatCurrency(d.devuelto)}</span></div>
                </div>
            </div>
            <div class="detail-info-section">
                <h3>Parties</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Payer</span><span class="detail-value">${escapeHtml(d.pagador)}</span></div>
                    <div class="detail-field"><span class="detail-label">Payee</span><span class="detail-value">${escapeHtml(d.receptor)}</span></div>
                    ${d.es_prop === 'true' || d.es_prop === true ? '<div class="detail-field"><span class="detail-label">Tipo</span><span class="detail-value"><span class="badge badge-amber">Owner</span></span></div>' : ''}
                </div>
            </div>
        </div>`;

        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Dates</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Date</span><span class="detail-value">${formatDate(d.fecha)}</span></div>
                    <div class="detail-field"><span class="detail-label">Payment date</span><span class="detail-value">${formatDate(d.fecha_pago)}</span></div>
                    <div class="detail-field"><span class="detail-label">Return date</span><span class="detail-value">${formatDate(d.fecha_devolucion)}</span></div>
                </div>
            </div>
            <div class="detail-info-section">
                <h3>Linked records</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Property</span><span class="detail-value">${AdminApp.entitySearchLink(d.propiedad, 'properties')}</span></div>
                    <div class="detail-field"><span class="detail-label">Contract</span><span class="detail-value">${AdminApp.entitySearchLink(d.contrato, 'contracts')}</span></div>
                </div>
            </div>
        </div>`;

        const certs = data.certificados || [];
        html += `<div class="detail-info-section mt-4">
            <div class="flex justify-between items-center mb-4">
                <h3>Certificates</h3>
                <label class="btn btn-secondary btn-sm clickable">
                    <input type="file" id="cert-file-input" accept=".pdf,.jpg,.jpeg,.png,.webp" multiple class="hidden">
                    Upload certificate
                </label>
            </div>
            <div id="cert-drop-zone" class="cert-drop-zone">
                <p>Drag files here or use the button</p>
            </div>
            <div id="cert-list" class="cert-list">
                ${certs.length === 0 ? '<p class="text-tertiary text-sm">No certificates attached</p>' : ''}
                ${certs.map(c => AdminApp.renderCertificadoCard(c)).join('')}
            </div>
        </div>`;

        el.innerHTML = html;

        el.querySelector('#cert-file-input')?.addEventListener('change', async (e) => {
            for (const file of e.target.files) {
                await AdminApp.uploadCertificado(id, file);
            }
            renderDepositoDetail(container);
        });

        const dropZone = el.querySelector('#cert-drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
            dropZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                for (const file of e.dataTransfer.files) {
                    await AdminApp.uploadCertificado(id, file);
                }
                renderDepositoDetail(container);
            });
        }

        el.querySelectorAll('.cert-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const certId = btn.dataset.certId;
                const ok = await confirmAction('Delete certificate', 'This action cannot be undone.');
                if (ok) {
                    await api.del(`/deposit_certificates/${certId}`);
                    Toast.show('Certificate deleted');
                    renderDepositoDetail(container);
                }
            });
        });

        el.querySelector('#btn-edit-deposito')?.addEventListener('click', () => {
            const fp = new FormPanel({
                title: 'Deposit',
                fields: [
                    { key: 'fecha', label: 'Date', type: 'date', required: true },
                    { key: 'propiedad', label: 'Property', required: true },
                    { key: 'pagador', label: 'Payer', required: true },
                    { key: 'receptor', label: 'Payee', required: true },
                    { key: 'tipo', label: 'Type' },
                    { key: 'estado', label: 'Status', type: 'select', options: ['Pending', 'Paid', 'Returned', 'Official body'] },
                    { key: 'total', label: 'Amount', type: 'number', required: true },
                    { key: 'pagado', label: 'Paid', type: 'number' },
                    { key: 'devuelto', label: 'Returned', type: 'number' },
                    { key: 'fecha_pago', label: 'Payment date', type: 'date' },
                    { key: 'fecha_devolucion', label: 'Return date', type: 'date' },
                    { key: 'contrato', label: 'Contract ref' },
                    { key: 'es_prop', label: 'Prop', type: 'select', options: ['false', 'true'] },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/deposits/${id}`, formData);
                    Toast.show('Deposit updated');
                    renderDepositoDetail(container);
                }
            });
            fp.open(d);
        });
    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading deposit: ${escapeHtml(e.message)}</div>`;
    }
}

AdminApp.renderDepositoDetail = renderDepositoDetail;

})(window.AdminApp);
