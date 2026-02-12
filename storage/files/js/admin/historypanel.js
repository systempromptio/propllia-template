(function(AdminApp) {

const { openPanel, closePanel, api, timeAgo, escapeHtml } = AdminApp;

class HistoryPanel {
    constructor() {
        this.overlay = null;
        this.panel = null;
        this._closing = false;
    }

    async open(entityType, entityId) {
        openPanel(this, 'Change history');

        try {
            const entries = await api.get(`/audit/${entityType}/${entityId}`);
            this.renderTimeline(entries);
        } catch {
            this.panel.querySelector('.panel-body').innerHTML =
                `<div class="empty-state">No history available</div>`;
        }
    }

    renderTimeline(entries) {
        if (!this.panel) return;
        const body = this.panel.querySelector('.panel-body');
        if (!entries || entries.length === 0) {
            body.innerHTML = '<div class="empty-state">No changes recorded</div>';
            return;
        }

        body.innerHTML = `<div class="timeline">
            ${entries.map(e => `
                <div class="timeline-entry action-${e.action}">
                    <div class="timeline-meta">
                        <span class="timeline-action">${e.action}</span>
                        &mdash; ${timeAgo(e.created_at)}
                    </div>
                    ${this.renderDiff(e)}
                </div>
            `).join('')}
        </div>`;
    }

    renderDiff(entry) {
        if (entry.action === 'create') {
            return '<div class="timeline-diff"><span class="diff-new">Record created</span></div>';
        }
        if (entry.action === 'delete') {
            return '<div class="timeline-diff"><span class="diff-old">Record deleted</span></div>';
        }
        if (!entry.changed_fields || entry.changed_fields.length === 0) {
            return '<div class="timeline-diff">Fields updated</div>';
        }
        return `<div class="timeline-diff">
            ${entry.changed_fields.map(field => {
                const oldVal = entry.old_values ? entry.old_values[field] : null;
                const newVal = entry.new_values ? entry.new_values[field] : null;
                return `<div class="diff-field">
                    <span class="field-name">${field}</span>
                    ${oldVal != null ? `<span class="diff-old">${escapeHtml(oldVal)}</span>` : ''}
                    <span class="diff-new">${escapeHtml(newVal)}</span>
                </div>`;
            }).join('')}
        </div>`;
    }

    close() { closePanel(this); }
}

Object.assign(AdminApp, { HistoryPanel });

})(window.AdminApp);
