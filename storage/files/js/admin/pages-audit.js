(function(AdminApp) {

const {
    api, Toast,
    timeAgo,
    escapeHtml,
    progressBar,
} = AdminApp;

async function renderAudit(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;

    try {
        const entries = await api.get('/audit/recent?limit=500');

        const total = entries.length;
        const byAction = { create: 0, update: 0, delete: 0 };
        const byEntity = {};
        entries.forEach(e => {
            byAction[e.action] = (byAction[e.action] || 0) + 1;
            byEntity[e.entity_type] = (byEntity[e.entity_type] || 0) + 1;
        });

        let html = '';

        html += `
            <div class="dashboard-grid">
                <div class="stat-card">
                    <div class="label">Total records</div>
                    <div class="value">${total}</div>
                    <div class="kpi-subtitle">Audit records</div>
                </div>
                <div class="stat-card success">
                    <div class="label">Creates</div>
                    <div class="value">${byAction.create || 0}</div>
                    <div class="kpi-subtitle">${total > 0 ? ((byAction.create || 0) / total * 100).toFixed(0) : 0}% of total</div>
                </div>
                <div class="stat-card">
                    <div class="label">Updates</div>
                    <div class="value">${byAction.update || 0}</div>
                    <div class="kpi-subtitle">${total > 0 ? ((byAction.update || 0) / total * 100).toFixed(0) : 0}% of total</div>
                </div>
                <div class="stat-card error">
                    <div class="label">Deletes</div>
                    <div class="value">${byAction.delete || 0}</div>
                    <div class="kpi-subtitle">${total > 0 ? ((byAction.delete || 0) / total * 100).toFixed(0) : 0}% of total</div>
                </div>
            </div>`;

        const entityTypes = Object.entries(byEntity).sort((a, b) => b[1] - a[1]);
        if (entityTypes.length > 0) {
            html += `
                <h2 class="section-title">Activity by entity type</h2>
                <div class="table-container mb-8">
                    <table class="data-table">
                        <thead><tr><th>Entity type</th><th class="numeric">Count</th><th class="rate-col">Distribution</th></tr></thead>
                        <tbody>
                            ${entityTypes.map(([type, count]) => {
                                const pct = total > 0 ? (count / total * 100) : 0;
                                return `
                                <tr>
                                    <td><span class="badge badge-blue">${escapeHtml(type)}</span></td>
                                    <td class="numeric">${count}</td>
                                    <td class="rate-col">${progressBar(pct, 'blue')} <small>${pct.toFixed(0)}%</small></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>`;
        }

        const entityTypeOptions = Object.keys(byEntity).sort();
        html += `
            <h2 class="section-title">Timeline</h2>
            <div class="toolbar mb-4">
                <select class="filter-select" id="audit-entity-filter">
                    <option value="">All types</option>
                    ${entityTypeOptions.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
                <select class="filter-select" id="audit-action-filter">
                    <option value="">All actions</option>
                    <option value="create">Create</option>
                    <option value="update">Update</option>
                    <option value="delete">Delete</option>
                </select>
                <span id="audit-filter-count" class="text-sm text-tertiary ml-auto"></span>
            </div>`;

        html += '<div id="audit-timeline"></div>';

        el.innerHTML = html;

        function renderTimeline(items) {
            const timeline = document.getElementById('audit-timeline');
            const countEl = document.getElementById('audit-filter-count');
            countEl.textContent = `${items.length} de ${total} records`;

            if (items.length === 0) {
                timeline.innerHTML = '<div class="empty-center">No hay records con los filtros selecteds.</div>';
                return;
            }

            timeline.innerHTML = `
                <div class="activity-feed max-h-none">
                    ${items.map(e => {
                        const actionIcon = {'create': '+', 'update': '\u270E', 'delete': '\u2212'}[e.action] || '\u2022';
                        const actionColor = {'create': 'green', 'update': 'amber', 'delete': 'red'}[e.action] || 'gray';
                        const shortId = e.entity_id ? e.entity_id.substring(0, 8) : '';

                        let diffHtml = '';
                        if (e.action === 'create') {
                            diffHtml = '<div class="mt-2"><span class="badge badge-green">Record created</span></div>';
                        } else if (e.action === 'delete') {
                            diffHtml = '<div class="mt-2"><span class="badge badge-red">Record deleted</span></div>';
                        } else if (e.changed_fields && e.changed_fields.length > 0) {
                            diffHtml = '<div class="mt-2">' +
                                e.changed_fields.map(field => {
                                    const oldVal = e.old_values ? e.old_values[field] : null;
                                    const newVal = e.new_values ? e.new_values[field] : null;
                                    return '<div class="diff-field-row">' +
                                        '<span class="diff-field-name">' + escapeHtml(field) + '</span>' +
                                        (oldVal != null ? '<span class="text-danger line-through">' + escapeHtml(String(oldVal)) + '</span> ' : '') +
                                        '<span class="text-success">' + escapeHtml(String(newVal)) + '</span>' +
                                    '</div>';
                                }).join('') +
                            '</div>';
                        }

                        return `
                        <div class="activity-item items-start">
                            <span class="activity-icon activity-${actionColor}">${actionIcon}</span>
                            <div class="activity-content flex-1">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="badge badge-blue">${escapeHtml(e.entity_type)}</span>
                                    <span class="badge badge-${actionColor}">${escapeHtml(e.action)}</span>
                                    <span class="text-tertiary text-xs font-mono">${escapeHtml(shortId)}...</span>
                                    ${e.usuario ? `<span class="text-muted text-xs">${escapeHtml(e.usuario)}</span>` : ''}
                                    <span class="activity-time ml-auto">${timeAgo(e.created_at)}</span>
                                </div>
                                ${diffHtml}
                            </div>
                        </div>`;
                    }).join('')}
                </div>`;
        }

        function applyFilters() {
            const entityFilter = document.getElementById('audit-entity-filter').value;
            const actionFilter = document.getElementById('audit-action-filter').value;
            const filtered = entries.filter(e => {
                if (entityFilter && e.entity_type !== entityFilter) return false;
                if (actionFilter && e.action !== actionFilter) return false;
                return true;
            });
            renderTimeline(filtered);
        }

        document.getElementById('audit-entity-filter').addEventListener('change', applyFilters);
        document.getElementById('audit-action-filter').addEventListener('change', applyFilters);

        renderTimeline(entries);
    } catch (e) {
        Toast.show('Error loading audit datage, 'error');
        el.innerHTML = '<div class="empty-center">Error loading audit data.</div>';
    }
}

AdminApp.renderAudit = renderAudit;

})(window.AdminApp);
