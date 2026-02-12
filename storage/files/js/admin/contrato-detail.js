(function(AdminApp) {

const { api, Toast, FormPanel, escapeHtml, statusBadge } = AdminApp;

async function renderContratoDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        el.innerHTML = '<div class="empty-state">No contract specified.</div>';
        return;
    }

    try {
        const [detail, depData, propData] = await Promise.all([
            api.get(`/contracts/${id}/detail`),
            api.get(`/deposits?per_page=200`),
            api.get(`/owners?per_page=100`),
        ]);

        const c = detail.contract;
        const activoId = detail.property_id || null;
        const invoices = detail.invoices || [];
        const documents = detail.documents || [];
        const extractedData = detail.extracted_data || [];

        const depositos = (depData.data || []).filter(d =>
            d.contract_ref === c.contract_ref || d.property_name === c.property_name
        );

        const propietario = (propData.data || []).find(p => p.property_name === c.property_name) || null;

        let html = '';

        html += AdminApp.breadcrumb('contracts', 'Contracts', c.contract_ref);

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${escapeHtml(c.contract_ref)}</h1>
                ${statusBadge(c.status, 'contract')}
            </div>
            <div class="header-actions">
                <button class="btn btn-primary" id="btn-gen-contrato">Generate Contract</button>
                <button class="btn btn-secondary" id="btn-edit-contrato">Edit</button>
            </div>
        </div>`;

        html += `<div class="tab-bar">
            <button class="tab active" data-tab="resumen">Summary</button>
            <button class="tab" data-tab="revision_renta">Rent Review</button>
            <button class="tab" data-tab="descuentos">Discounts</button>
            <button class="tab" data-tab="alquileres">Rentals</button>
            <button class="tab" data-tab="depositos">Deposits</button>
            <button class="tab" data-tab="incidencias">Issues</button>
            <button class="tab" data-tab="documentos">Documents</button>
        </div>`;

        html += '<div class="tab-content">';
        html += `<div class="tab-panel active" data-panel="resumen">${AdminApp.renderContratoResumen(c, invoices, depositos, propietario, activoId, detail)}</div>`;
        html += '<div class="tab-panel" data-panel="revision_renta"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="descuentos"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="alquileres"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="depositos"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="incidencias"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="documentos"><div class="tab-table-root"></div></div>';
        html += '</div>';

        el.innerHTML = html;

        const tabsLoaded = { resumen: true };
        el.querySelectorAll('.tab-bar .tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const name = tab.dataset.tab;
                el.querySelectorAll('.tab-bar .tab').forEach(t => t.classList.remove('active'));
                el.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
                tab.classList.add('active');
                el.querySelector(`[data-panel="${name}"]`).classList.add('active');

                if (!tabsLoaded[name]) {
                    tabsLoaded[name] = true;
                    AdminApp.initContratoTabTable(name, el.querySelector(`[data-panel="${name}"] .tab-table-root`), c, () => renderContratoDetail(container));
                }
            });
        });

        el.querySelector('#btn-gen-contrato')?.addEventListener('click', () => {
            window.open(`/admin/api/contracts/${id}/document`, '_blank');
        });

        el.querySelector('#btn-edit-contrato')?.addEventListener('click', () => {
            const formPanel = new FormPanel({
                title: 'Contract',
                fields: [
                    { key: 'contract_ref', label: 'Contract ref', required: true },
                    { key: 'property_name', label: 'Property', required: true },
                    { key: 'address', label: 'Address' },
                    { key: 'tenant_name', label: 'Tenant' },
                    { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'Active', 'Ended', 'Suspended'] },
                    { key: 'rent', label: 'Monthly rent', type: 'number' },
                    { key: 'total', label: 'Total value', type: 'number' },
                    { key: 'start_date', label: 'Start date', type: 'date' },
                    { key: 'end_date', label: 'End date', type: 'date' },
                    { key: 'tags', label: 'Tags (comma separated)' },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/contracts/${id}`, formData);
                    Toast.show('Contract updated');
                    renderContratoDetail(container);
                }
            });
            formPanel.open(c);
        });

    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading contract: ${escapeHtml(e.message)}</div>`;
    }
}

Object.assign(AdminApp, { renderContratoDetail });

})(window.AdminApp);
