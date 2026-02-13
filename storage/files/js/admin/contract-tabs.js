(function(AdminApp) {

const {
    api, Toast, DataTable, FormPanel,
    formatFileSize, formatDate, escapeHtml, confirmAction, API_BASE
} = AdminApp;

function renderDocumentCard(doc) {
    const isImage = doc.file_type && doc.file_type.startsWith('image/');
    const hasFile = doc.original_file;
    const downloadUrl = hasFile ? `${API_BASE}/contract_documents/${doc.id}/download` : null;
    const tipoLabel = doc.type || 'contract';

    let preview;
    if (!hasFile) {
        preview = '<div class="cert-icon">--</div>';
    } else if (isImage) {
        preview = `<img src="${downloadUrl}" alt="${escapeHtml(doc.name)}" class="cert-thumb">`;
    } else {
        preview = '<div class="cert-icon">PDF</div>';
    }

    const previewLink = downloadUrl
        ? `<a href="${downloadUrl}" target="_blank" class="cert-preview">${preview}</a>`
        : `<div class="cert-preview">${preview}</div>`;

    const nameLink = downloadUrl
        ? `<a href="${downloadUrl}" target="_blank" class="cert-name">${escapeHtml(doc.name)}</a>`
        : `<span class="cert-name">${escapeHtml(doc.name)}</span>`;

    const meta = [
        `<span class="badge badge-blue">${escapeHtml(tipoLabel)}</span>`,
        doc.size ? formatFileSize(doc.size) : null,
        doc.document_date ? formatDate(doc.document_date) : formatDate(doc.created_at),
    ].filter(Boolean).join(' &middot; ');

    return `<div class="cert-card" data-doc-id="${doc.id}">
        ${previewLink}
        <div class="cert-info">
            ${nameLink}
            <span class="cert-meta">${meta}</span>
        </div>
        <button class="btn-icon doc-delete" data-doc-id="${doc.id}" title="Delete">&times;</button>
    </div>`;
}

async function renderDocumentsTab(container, contract, renderContractDetail) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const contractId = contract.id;

    try {
        const resp = await api.get(`/contract_documents?contract_id=${contractId}&per_page=100`);
        const docs = resp.items || resp.data || [];

        let html = `<div class="flex justify-between items-center mb-4">
            <h3>Contract documents</h3>
            <div class="flex gap-2">
                <label class="btn btn-secondary btn-sm clickable">
                    <input type="file" id="doc-file-input" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" multiple class="hidden">
                    Upload file
                </label>
            </div>
        </div>
        <div id="doc-drop-zone" class="cert-drop-zone">
            <p>Drag files here or use the button</p>
        </div>
        <div id="doc-list" class="cert-list">
            ${docs.length === 0 ? '<p class="text-tertiary text-sm">No attached documents</p>' : ''}
            ${docs.map(d => renderDocumentCard(d)).join('')}
        </div>`;

        el.innerHTML = html;

        // File input upload
        el.querySelector('#doc-file-input')?.addEventListener('change', async (e) => {
            for (const file of e.target.files) {
                try {
                    await api.uploadFile(`/contracts/${contractId}/documents`, file);
                    Toast.show(`${file.name} uploaded successfully`);
                } catch (err) {
                    Toast.show(`Error: ${err.message}`, 'error');
                }
            }
            renderDocumentsTab(container, contract, renderContractDetail);
        });

        // Drag-drop upload
        const dropZone = el.querySelector('#doc-drop-zone');
        if (dropZone) {
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
            dropZone.addEventListener('drop', async (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                for (const file of e.dataTransfer.files) {
                    try {
                        await api.uploadFile(`/contracts/${contractId}/documents`, file);
                        Toast.show(`${file.name} uploaded successfully`);
                    } catch (err) {
                        Toast.show(`Error: ${err.message}`, 'error');
                    }
                }
                renderDocumentsTab(container, contract, renderContractDetail);
            });
        }

        // Delete buttons
        el.querySelectorAll('.doc-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const docId = btn.dataset.docId;
                const ok = await confirmAction('Delete document', 'This action cannot be undone.');
                if (ok) {
                    await api.del(`/contract_documents/${docId}`);
                    Toast.show('Document deleted');
                    renderDocumentsTab(container, contract, renderContractDetail);
                }
            });
        });
    } catch (err) {
        el.innerHTML = `<p class="text-danger">Error loading documents: ${escapeHtml(err.message)}</p>`;
    }
}

function initContractTabTable(tabName, container, contract, renderContractDetail) {
    const contractName = contract.contract_ref;
    const activoName = contract.property_name;

    switch (tabName) {
        case 'revision_renta':
            AdminApp.renderRentRevisionTab(container, contract);
            return null;
        case 'descuentos':
            AdminApp.renderDiscountsTab(container, contract);
            return null;
        case 'alquileres':
            return new DataTable(container, {
                entity: 'billing',
                apiPath: '/invoices',
                showPeriodFilter: true,
                defaultFilters: { type: 'income', contract_ref: contractName },
                columns: [
                    { key: 'reference', label: 'Ref' },
                    { key: 'description', label: 'Description' },
                    { key: 'status', label: 'Status', type: 'status' },
                    { key: 'total', label: 'Total', type: 'currency' },
                    { key: 'paid', label: 'Paid', type: 'currency' },
                    { key: 'invoice_date', label: 'Date', type: 'date' },
                ],
                filters: [
                    { key: 'status', label: 'Status', options: ['Unpaid', 'Partial', 'Paid'] },
                ],
                onRowClick: (row) => {
                    window.location.href = AdminApp.detailUrl('invoice', row.id);
                },
                onAction: async (action, row) => {
                    if (action === 'edit') {
                        const fp = new FormPanel({
                            title: 'Invoice',
                            fields: [
                                { key: 'reference', label: 'Reference', required: true },
                                { key: 'description', label: 'Description', required: true },
                                { key: 'total', label: 'Total', type: 'number', required: true },
                                { key: 'paid', label: 'Paid', type: 'number' },
                                { key: 'invoice_date', label: 'Date', required: true },
                                { key: 'status', label: 'Status', type: 'select', options: ['Auto', 'Unpaid', 'Partial', 'Paid'] },
                            ],
                            onSubmit: async (data, isEdit, original) => {
                                if (data.status === 'Auto') delete data.status;
                                await api.put(`/invoices/${original.id}`, data);
                                Toast.show('Invoice updated');
                            }
                        });
                        fp.open(row);
                    }
                }
            });
        case 'depositos':
            return new DataTable(container, {
                entity: 'deposit',
                apiPath: '/deposits',
                defaultFilters: { property_name: activoName },
                columns: [
                    { key: 'type', label: 'Type' },
                    { key: 'status', label: 'Status', type: 'status' },
                    { key: 'total', label: 'Total', type: 'currency' },
                    { key: 'paid', label: 'Paid', type: 'currency' },
                    { key: 'payer', label: 'Payer' },
                    { key: 'date', label: 'Date', type: 'date' },
                ],
                onRowClick: (row) => {
                    window.location.href = AdminApp.detailUrl('deposit', row.id);
                },
                onAction: async (action, row) => {
                    if (action === 'edit') {
                        const fp = new FormPanel({
                            title: 'Deposit',
                            fields: [
                                { key: 'property_name', label: 'Property', required: true },
                                { key: 'contract_ref', label: 'Contract' },
                                { key: 'type', label: 'Type', type: 'select', options: ['Deposit', 'Additional guarantee', 'Bank guarantee'] },
                                { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Paid', 'Returned', 'Official body'] },
                                { key: 'total', label: 'Total', type: 'number', required: true },
                                { key: 'paid', label: 'Paid', type: 'number' },
                                { key: 'payer', label: 'Payer', required: true },
                                { key: 'payee', label: 'Payee', required: true },
                                { key: 'date', label: 'Date', type: 'date' },
                            ],
                            onSubmit: async (data, isEdit, original) => {
                                await api.put(`/deposits/${original.id}`, data);
                                Toast.show('Deposit updated');
                            }
                        });
                        fp.open(row);
                    }
                }
            });
        case 'incidencias':
            return new DataTable(container, {
                entity: 'issue',
                apiPath: '/issues',
                defaultFilters: { property_name: activoName },
                columns: [
                    { key: 'title', label: 'Title' },
                    { key: 'priority', label: 'Priority', type: 'status' },
                    { key: 'status', label: 'Status', type: 'status' },
                    { key: 'cost', label: 'Cost', type: 'currency' },
                    { key: 'created_at', label: 'Created', type: 'date' },
                ],
                filters: [
                    { key: 'status', label: 'Status', options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
                    { key: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'] },
                ],
                onRowClick: (row) => {
                    window.location.href = AdminApp.detailUrl('issue', row.id);
                },
                onAction: async (action, row) => {
                    if (action === 'create') {
                        const fp = new FormPanel({
                            title: 'Issue',
                            fields: [
                                { key: 'property_name', label: 'Property', required: true },
                                { key: 'title', label: 'Title', required: true },
                                { key: 'description', label: 'Description', type: 'textarea' },
                                { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'], default: 'Medium' },
                                { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
                                { key: 'cost', label: 'Cost', type: 'number' },
                            ],
                            onSubmit: async (data) => {
                                await api.post('/issues', data);
                                Toast.show('Issue created');
                            }
                        });
                        fp.open({ property_name: activoName });
                    }
                    if (action === 'edit') {
                        const fp = new FormPanel({
                            title: 'Issue',
                            fields: [
                                { key: 'property_name', label: 'Property', required: true },
                                { key: 'title', label: 'Title', required: true },
                                { key: 'description', label: 'Description', type: 'textarea' },
                                { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
                                { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
                                { key: 'cost', label: 'Cost', type: 'number' },
                            ],
                            onSubmit: async (data, isEdit, original) => {
                                await api.put(`/issues/${original.id}`, data);
                                Toast.show('Issue updated');
                            }
                        });
                        fp.open(row);
                    }
                }
            });
        case 'documentos':
            renderDocumentsTab(container, contract, renderContractDetail);
            return null;
    }
}

Object.assign(AdminApp, { initContractTabTable });

})(window.AdminApp);
