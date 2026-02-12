(function(AdminApp) {

const {
    api, Toast, FormPanel,
    formatCurrency, formatDate,
    escapeHtml, statusBadge,
} = AdminApp;

async function renderLeadDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const id = AdminApp.getIdFromUrl();
    if (!id) { el.innerHTML = '<div class="empty-state">No lead specified.</div>'; return; }

    try {
        const d = await api.get(`/leads/${id}`);

        let html = '';

        html += AdminApp.breadcrumb('leads', 'Leads', d.nombre);

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${escapeHtml(d.nombre)}</h1>
                ${d.estado ? statusBadge(d.estado, 'incidencia') : ''}
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="btn-edit-lead">Edit</button>
            </div>
        </div>`;

        html += `<div class="detail-info-grid">
            <div class="detail-info-section">
                <h3>Contact</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Name</span><span class="detail-value">${escapeHtml(d.nombre)}</span></div>
                    <div class="detail-field"><span class="detail-label">Email</span><span class="detail-value">${d.email ? `<a href="mailto:${escapeHtml(d.email)}" class="text-accent">${escapeHtml(d.email)}</a>` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Phone</span><span class="detail-value">${d.telefono ? `<a href="tel:${escapeHtml(d.telefono)}" class="text-accent">${escapeHtml(d.telefono)}</a>` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Company</span><span class="detail-value">${escapeHtml(d.empresa) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Source</span><span class="detail-value">${d.origen ? `<span class="badge badge-blue">${escapeHtml(d.origen)}</span>` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Assigned to</span><span class="detail-value">${escapeHtml(d.asignado_a) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Score</span><span class="detail-value">${d.puntuacion != null ? d.puntuacion : '-'}</span></div>
                </div>
            </div>
            <div class="detail-info-section">
                <h3>Interest</h3>
                <div class="detail-grid">
                    <div class="detail-field"><span class="detail-label">Tipo</span><span class="detail-value">${d.interes ? `<span class="badge badge-blue">${escapeHtml(d.interes)}</span>` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Property</span><span class="detail-value">${AdminApp.entitySearchLink(d.activo, 'properties')}</span></div>
                    <div class="detail-field"><span class="detail-label">Budget</span><span class="detail-value">${d.presupuesto_min || d.presupuesto_max ? `${formatCurrency(d.presupuesto_min)} \u2014 ${formatCurrency(d.presupuesto_max)}` : '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Min bedrooms</span><span class="detail-value">${d.habitaciones_min || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Min sq ft</span><span class="detail-value">${d.m2_minimo || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Preferred area</span><span class="detail-value">${escapeHtml(d.zona_preferida) || '-'}</span></div>
                    <div class="detail-field"><span class="detail-label">Next follow-up</span><span class="detail-value">${formatDate(d.fecha_seguimiento)}</span></div>
                </div>
            </div>
        </div>`;

        if (d.notas) {
            html += `<div class="detail-info-section"><h3>General notes</h3><p class="note-text">${escapeHtml(d.notas)}</p></div>`;
        }

        html += `<div class="detail-info-section mt-6">
            <h3>Activity</h3>
            <div class="mb-4">
                <select id="lead-nota-tipo" class="note-select">
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="visit">Visit</option>
                    <option value="task">Task</option>
                    <option value="other">Other</option>
                </select>
                <textarea id="lead-nota-contenido" placeholder="Write a note..." rows="3" class="note-textarea"></textarea>
                <button id="lead-nota-submit" class="btn btn-primary mt-2">Add note</button>
            </div>
            <div id="lead-notes-list"></div>
        </div>`;

        el.innerHTML = html;

        async function loadNotes() {
            const list = el.querySelector('#lead-notes-list');
            try {
                const res = await api.get(`/lead_notas?lead_id=${id}&per_page=100&sort=created_at&order=desc`);
                const notas = res.data || [];
                if (notas.length === 0) {
                    list.innerHTML = '<p class="text-tertiary">No notes yet.</p>';
                    return;
                }
                list.innerHTML = `<div class="activity-feed max-h-none">${notas.map(n => {
                    const fecha = new Date(n.created_at).toLocaleString('en-GB');
                    return `<div class="activity-item items-start">
                        <span class="activity-icon activity-blue">${{'note':'N','call':'T','email':'@','visit':'V','task':'!','other':'?'}[n.tipo] || 'N'}</span>
                        <div class="activity-content flex-1">
                            <div class="flex items-center gap-2">
                                <span class="badge badge-blue">${escapeHtml(n.tipo || 'note')}</span>
                                ${n.autor ? `<span class="text-tertiary text-xs">${escapeHtml(n.autor)}</span>` : ''}
                                <span class="activity-time ml-auto">${fecha}</span>
                            </div>
                            <p class="mt-2 mb-0 text-wrap">${escapeHtml(n.contenido)}</p>
                        </div>
                    </div>`;
                }).join('')}</div>`;
            } catch (e) {
                list.innerHTML = `<p class="text-danger">${escapeHtml(e.message)}</p>`;
            }
        }

        loadNotes();

        el.querySelector('#lead-nota-submit')?.addEventListener('click', async () => {
            const contenido = el.querySelector('#lead-nota-contenido').value.trim();
            if (!contenido) { Toast.show('Write something', 'error'); return; }
            const tipo = el.querySelector('#lead-nota-tipo').value;
            try {
                await api.post('/lead_notes', { lead_id: id, tipo, contenido });
                el.querySelector('#lead-nota-contenido').value = '';
                Toast.show('Note added');
                loadNotes();
            } catch (e) { Toast.show(e.message, 'error'); }
        });

        el.querySelector('#btn-edit-lead')?.addEventListener('click', () => {
            const fp = new FormPanel({
                title: 'Lead',
                fields: [
                    { key: 'nombre', label: 'Name', required: true },
                    { key: 'email', label: 'Email' },
                    { key: 'telefono', label: 'Phone' },
                    { key: 'empresa', label: 'Company' },
                    { key: 'origen', label: 'Source', type: 'select', options: ['direct', 'web', 'referral', 'portal', 'phone', 'email', 'other'] },
                    { key: 'estado', label: 'Status', type: 'select', options: ['New', 'Contacted', 'Qualified', 'Viewing', 'Negotiation', 'Won', 'Lost', 'Archived'] },
                    { key: 'interes', label: 'Interest', type: 'select', options: ['rental', 'purchase', 'investment', 'other'] },
                    { key: 'activo', label: 'Property of interest', type: 'asyncSelect', asyncOptions: '/properties/names' },
                    { key: 'presupuesto_min', label: 'Min budget', type: 'number' },
                    { key: 'presupuesto_max', label: 'Max budget', type: 'number' },
                    { key: 'zona_preferida', label: 'Preferred area' },
                    { key: 'fecha_seguimiento', label: 'Next follow-up', type: 'date' },
                    { key: 'asignado_a', label: 'Assigned to' },
                    { key: 'puntuacion', label: 'Score (0-100)', type: 'number' },
                    { key: 'notas', label: 'Notes', type: 'textarea' },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/leads/${id}`, formData);
                    Toast.show('Lead updated');
                    renderLeadDetail(container);
                }
            });
            fp.open(d);
        });
    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading lead: ${escapeHtml(e.message)}</div>`;
    }
}

AdminApp.renderLeadDetail = renderLeadDetail;

})(window.AdminApp);
