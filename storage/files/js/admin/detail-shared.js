(function(AdminApp) {

const { api, Toast, escapeHtml, formatDate, timeAgo, API_BASE } = AdminApp;

function getIdFromUrl() {
    return new URLSearchParams(window.location.search).get('id');
}

function initTabs(el, initTabTable, context) {
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
                initTabTable(name, el.querySelector(`[data-panel="${name}"] .tab-table-root`), context);
            }
        });
    });
}

async function loadAuditTrail(entityType, entityId, container) {
    try {
        const entries = await api.get(`/audit/${entityType}/${entityId}`);
        if (!entries || entries.length === 0) {
            container.innerHTML = '<p class="loading-text text-tertiary">No changes recorded.</p>';
            return;
        }
        container.innerHTML = `<div class="activity-feed max-h-none">
            ${entries.map(e => {
                const actionIcon = {'create': '+', 'update': '\u270E', 'delete': '\u2212'}[e.action] || '\u2022';
                const actionColor = {'create': 'green', 'update': 'amber', 'delete': 'red'}[e.action] || 'gray';
                let diffHtml = '';
                if (e.changed_fields && e.changed_fields.length > 0) {
                    diffHtml = '<div class="mt-2">' +
                        e.changed_fields.map(field => {
                            const oldVal = e.old_values ? e.old_values[field] : null;
                            const newVal = e.new_values ? e.new_values[field] : null;
                            return `<div class="diff-field-row">
                                <span class="diff-field-name">${escapeHtml(field)}</span>
                                ${oldVal != null ? `<span class="text-danger line-through">${escapeHtml(String(oldVal))}</span>` : ''}
                                <span class="text-success">${escapeHtml(String(newVal))}</span>
                            </div>`;
                        }).join('') + '</div>';
                }
                return `<div class="activity-item items-start">
                    <span class="activity-icon activity-${actionColor}">${actionIcon}</span>
                    <div class="activity-content flex-1">
                        <div class="flex items-center gap-2">
                            <span class="badge badge-${actionColor}">${escapeHtml(e.action)}</span>
                            ${e.user ? `<span class="text-tertiary text-xs">${escapeHtml(e.user)}</span>` : ''}
                            <span class="activity-time ml-auto">${timeAgo(e.created_at)}</span>
                        </div>
                        ${diffHtml}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    } catch (e) {
        container.innerHTML = `<p class="text-danger">Error: ${escapeHtml(e.message)}</p>`;
    }
}

function formatFileSize(bytes) {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function renderCertificateCard(cert) {
    const isImage = cert.file_type && cert.file_type.startsWith('image/');
    const downloadUrl = `${API_BASE}/deposit_certificates/${cert.id}/download`;
    const preview = isImage
        ? `<img src="${downloadUrl}" alt="${escapeHtml(cert.name)}" class="cert-thumb">`
        : `<div class="cert-icon">PDF</div>`;
    return `<div class="cert-card" data-cert-id="${cert.id}">
        <a href="${downloadUrl}" target="_blank" class="cert-preview">${preview}</a>
        <div class="cert-info">
            <a href="${downloadUrl}" target="_blank" class="cert-name">${escapeHtml(cert.name)}</a>
            <span class="cert-meta">${formatFileSize(cert.size)} &middot; ${formatDate(cert.created_at)}</span>
        </div>
        <button class="btn-icon cert-delete" data-cert-id="${cert.id}" title="Delete">&times;</button>
    </div>`;
}

async function uploadCertificate(depositId, file) {
    try {
        await api.uploadFile(`/deposits/${depositId}/certificates`, file);
        Toast.show(`${file.name} uploaded successfully`);
    } catch (e) {
        Toast.show(`Error: ${e.message}`, 'error');
    }
}

Object.assign(AdminApp, {
    getIdFromUrl,
    initTabs,
    loadAuditTrail,
    formatFileSize,
    renderCertificadoCard: renderCertificateCard,
    renderCertificateCard,
    uploadCertificado: uploadCertificate,
    uploadCertificate,
    entityDetailUrl: AdminApp.detailUrl,
});

})(window.AdminApp);
