(function(AdminApp) {

const {
    api, Toast, FormPanel,
    formatCurrency, formatDate,
    escapeHtml, statusBadge,
} = AdminApp;

async function renderIncidenciaDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const id = AdminApp.getIdFromUrl();
    if (!id) { el.innerHTML = '<div class="empty-state">No issue specified.</div>'; return; }

    try {
        const d = await api.get(`/issues/${id}`);

        let html = '';

        html += AdminApp.breadcrumb('issues', 'Issues', d.titulo);

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${escapeHtml(d.titulo)}</h1>
                ${statusBadge(d.prioridad, 'incidencia')}
                ${statusBadge(d.estado, 'incidencia')}
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="btn-edit-incidencia">Edit</button>
            </div>
        </div>`;

        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Details</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Property</span><span class="detail-value">${AdminApp.entitySearchLink(d.activo, 'properties')}</span></div>
                    <div class="detail-field"><span class="detail-label">Cost</span><span class="detail-value">${formatCurrency(d.coste)}</span></div>
                    <div class="detail-field"><span class="detail-label">Created</span><span class="detail-value">${formatDate(d.created_at)}</span></div>
                    <div class="detail-field"><span class="detail-label">Updated</span><span class="detail-value">${formatDate(d.updated_at)}</span></div>
                </div>
            </div>
            ${d.descripcion ? `<div class="detail-info-section">
                <h3>Description</h3>
                <p class="note-text">${escapeHtml(d.descripcion)}</p>
            </div>` : ''}
        </div>`;

        el.innerHTML = html;

        el.querySelector('#btn-edit-incidencia')?.addEventListener('click', () => {
            const fp = new FormPanel({
                title: 'Issue',
                fields: [
                    { key: 'activo', label: 'Property', required: true },
                    { key: 'titulo', label: 'Title', required: true },
                    { key: 'descripcion', label: 'Description', type: 'textarea' },
                    { key: 'prioridad', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
                    { key: 'estado', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
                    { key: 'coste', label: 'Cost', type: 'number' },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/issues/${id}`, formData);
                    Toast.show('Issue updated');
                    renderIncidenciaDetail(container);
                }
            });
            fp.open(d);
        });
    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading issue: ${escapeHtml(e.message)}</div>`;
    }
}

AdminApp.renderIncidenciaDetail = renderIncidenciaDetail;

})(window.AdminApp);
