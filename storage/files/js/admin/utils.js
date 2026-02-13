(function(AdminApp) {

function formatCurrency(val) {
    if (val == null) return '-';
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(num);
}

function formatCurrencyValue(val) {
    return formatCurrency(val).replace(/[^\d.,]/g, '');
}

function formatDate(val) {
    if (!val) return '-';
    try {
        const d = new Date(val);
        return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch { return val; }
}

function timeAgo(dateStr) {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff/60)}m`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h`;
    if (diff < 604800) return `${Math.floor(diff/86400)}d`;
    return formatDate(dateStr);
}

function daysUntil(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    const now = new Date();
    return Math.ceil((d - now) / (1000 * 60 * 60 * 24));
}

function escapeHtml(str) {
    if (str == null) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

function statusBadge(value, type) {
    const map = {
        property: { 'Rented': 'green', 'Occupied': 'amber', 'Vacant': 'gray', 'Under Renovation': 'blue', 'Reserved': 'blue' },
        invoice: { 'Paid': 'green', 'Partial': 'amber', 'Unpaid': 'red', 'income': 'green', 'expense': 'red' },
        rental: { 'Paid': 'green', 'Partial': 'amber', 'Unpaid': 'red' },
        billing: { 'Paid': 'green', 'Partial': 'amber', 'Unpaid': 'red' },
        expense: { 'Paid': 'green', 'Partial': 'amber', 'Unpaid': 'red' },
        contract: { 'Active': 'green', 'Pending': 'blue', 'Ended': 'gray', 'Suspended': 'red' },
        deposit: { 'Paid': 'green', 'Pending': 'amber', 'Returned': 'blue', 'Official body': 'gray' },
        issue: { 'Open': 'red', 'In Progress': 'amber', 'Resolved': 'green', 'Closed': 'gray', 'High': 'red', 'Medium': 'amber', 'Low': 'blue' },
        contract_document: { 'contract': 'blue', 'extension': 'green', 'annex': 'amber', 'addendum': 'gray' },
        contract_detail: { 'price': 'green', 'index': 'blue', 'guarantee': 'amber', 'discount_1': 'gray', 'discount_2': 'gray', 'discount_3': 'gray', 'increase_pct': 'amber', 'end_contract': 'red', 'council_tax': 'blue', 'extras': 'gray' },
        // Legacy aliases for compatibility
        activo: { 'Rented': 'green', 'Occupied': 'amber', 'Vacant': 'gray', 'Under Renovation': 'blue', 'Reserved': 'blue' },
        contabilidad: { 'Paid': 'green', 'Partial': 'amber', 'Unpaid': 'red', 'income': 'green', 'expense': 'red' },
        contrato: { 'Active': 'green', 'Pending': 'blue', 'Ended': 'gray', 'Suspended': 'red' },
        deposito: { 'Paid': 'green', 'Pending': 'amber', 'Returned': 'blue', 'Official body': 'gray' },
        incidencia: { 'Open': 'red', 'In Progress': 'amber', 'Resolved': 'green', 'Closed': 'gray', 'High': 'red', 'Medium': 'amber', 'Low': 'blue' },
    };
    const color = (map[type] || {})[value] || 'gray';
    return `<span class="badge badge-${color}">${escapeHtml(value)}</span>`;
}

function computeStatus(row) {
    const total = parseFloat(row.total) || 0;
    const paid = parseFloat(row.paid) || 0;
    if (total <= 0) return row.status || 'Unpaid';
    if (paid >= total) return 'Paid';
    if (paid > 0) return 'Partial';
    return 'Unpaid';
}

function progressBar(pct, color = 'green') {
    const clamped = Math.min(100, Math.max(0, pct));
    return `<div class="progress-bar"><div class="progress-fill progress-${color}" style="width:${clamped}%"></div></div>`;
}

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = ((hash % 360) + 360) % 360;
    return `hsl(${h}, 45%, 45%)`;
}

function rateColor(pct) {
    return pct > 80 ? 'green' : pct > 50 ? 'amber' : 'red';
}

function getPeriodMonths(period) {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const pad = (n) => String(n).padStart(2, '0');

    function monthStr(year, month) { return `${pad(month + 1)}/${year}`; }
    function monthRange(count) {
        const months = [];
        for (let i = 0; i < count; i++) {
            let mm = m - i;
            let yy = y;
            while (mm < 0) { mm += 12; yy--; }
            months.push(monthStr(yy, mm));
        }
        return months.join(',');
    }

    switch (period) {
        case 'this_month': return monthStr(y, m);
        case 'last_month': return monthStr(m === 0 ? y - 1 : y, m === 0 ? 11 : m - 1);
        case 'last_3': return monthRange(3);
        case 'last_6': return monthRange(6);
        case 'this_year': return Array.from({length: m + 1}, (_, i) => monthStr(y, i)).join(',');
        case 'last_year': return Array.from({length: 12}, (_, i) => monthStr(y - 1, i)).join(',');
        default: return null;
    }
}

function detailSection(title, items) {
    return `
        <div class="detail-section">
            <h4>${title}</h4>
            <div class="detail-grid">
                ${items.map(([label, value]) =>
                    `<div class="detail-field"><span class="detail-label">${label}</span><span class="detail-value">${escapeHtml(value)}</span></div>`
                ).join('')}
            </div>
        </div>`;
}

Object.assign(AdminApp, {
    formatCurrency, formatCurrencyValue, formatDate, timeAgo, daysUntil,
    escapeHtml, statusBadge, computeStatus, progressBar, stringToColor,
    rateColor, getPeriodMonths, detailSection
});

})(window.AdminApp);
