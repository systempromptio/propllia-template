(function(AdminApp) {
const { api, Toast, escapeHtml, formatCurrency, formatDate, statusBadge, computeEstado } = AdminApp;
class DataTable {
    constructor(container, config) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.config = config;
        this.data = [];
        this.sortField = null;
        this.sortDir = 'asc';
        this.page = 1;
        this.perPage = 200;
        this.searchQuery = '';
        this.filterValues = {};
        this.selected = new Set();
        this._asyncOptionLabels = {};

        const urlParams = new URLSearchParams(window.location.search);
        for (const [key, value] of urlParams.entries()) {
            if (key === 'page') { this.page = parseInt(value, 10) || 1; }
            else if (key === 'per_page') { this.perPage = parseInt(value, 10); }
            else if (key === 'search') { this.searchQuery = value; }
            else { this.filterValues[key] = value; }
        }

        this.container.innerHTML = AdminApp.renderFilterBar(this.config, this.filterValues, this.searchQuery, this.perPage);
        AdminApp.bindFilterEvents(this.container, this);
        AdminApp.loadAsyncFilters(this.container, this);
        AdminApp.setupPopupDismissHandlers(this.container);
        this.load();
    }
    _hasFilters() {
        return (this.config.filters && this.config.filters.length > 0) || this.config.showPeriodFilter;
    }
    _isDefaultFilter(key) {
        return this.config.defaultFilters && key in this.config.defaultFilters;
    }
    _activeFilterCount() {
        let count = 0;
        for (const [k, v] of Object.entries(this.filterValues)) {
            if (v && k !== '_period' && !this._isDefaultFilter(k)) count++;
        }
        return count;
    }

    _clearAllFilters() { AdminApp.clearAllFilters(this); }
    _removeFilter(key) { AdminApp.removeFilter(this, key); }
    _renderChips() { AdminApp.renderChips(this); }
    _buildParams() {
        const params = new URLSearchParams();
        params.set('page', this.page);
        params.set('per_page', this.perPage);
        if (this.searchQuery) params.set('search', this.searchQuery);
        if (this.sortField) { params.set('sort', this.sortField); params.set('order', this.sortDir); }
        Object.entries(this.filterValues).forEach(([k, v]) => {
            if (v && k !== '_period') params.set(k, v);
        });
        if (this.config.defaultFilters) {
            Object.entries(this.config.defaultFilters).forEach(([k, v]) => {
                if (v) params.set(k, v);
            });
        }
        return params;
    }

    _syncUrl() {
        const params = this._buildParams();
        params.delete('page');
        params.delete('per_page');
        const qs = params.toString();
        const url = new URL(window.location);
        url.search = qs ? '?' + qs : '';
        window.history.replaceState(null, '', url);
    }

    async load() {
        const params = this._buildParams();
        try {
            const result = await api.get(`${this.config.apiPath}?${params}`);
            this.data = result.data || [];
            this.total = result.total || 0;
            this.totals = result.totals || null;
            this.renderTable();
            this._renderChips();
            this._syncUrl();
            if (this.config.onDataLoaded) this.config.onDataLoaded(this.data, this);
        } catch (e) {
            Toast.show(e.message, 'error');
        }
    }

    renderTable() {
        const thead = this.container.querySelector('thead tr');
        const tbody = this.container.querySelector('tbody');
        const tfoot = this.container.querySelector('tfoot');
        const cols = this.data.length > 0
            ? this.config.columns.filter(col => this.data.some(row => row[col.key] != null && row[col.key] !== ''))
            : this.config.columns;
        const showCb = this.config.showCheckboxes;
        const allChecked = this.data.length > 0 && this.data.every(r => this.selected.has(r.id));

        thead.innerHTML = this._renderHeader(cols, showCb, allChecked);
        this._bindHeaderEvents(thead, showCb);
        tbody.innerHTML = this._renderBody(cols, showCb);
        this._bindBodyEvents(thead, tbody, showCb);
        AdminApp.bindActionPopupEvents(tbody, this);
        tfoot.innerHTML = this._renderFooter(cols, showCb);
        this.renderPagination();
        this.updateSelectionBar();
    }

    _renderHeader(cols, showCb, allChecked) {
        const cbHeader = showCb ? `<th class="col-checkbox"><input type="checkbox" class="select-all-cb" ${allChecked ? 'checked' : ''}></th>` : '';
        return cbHeader + cols.map(col => {
            const sorted = this.sortField === col.key;
            const icon = sorted ? (this.sortDir === 'asc' ? '\u25B2' : '\u25BC') : '\u25B4';
            const typeCls = col.type ? `col-${col.type}` : 'col-text';
            const sortedCls = sorted ? ' sorted' : '';
            const widthAttr = col.width ? ` style="width:${col.width}"` : '';
            return `<th data-sort="${col.key}" class="${typeCls}${sortedCls}"${widthAttr}>
                ${col.label} <span class="sort-icon">${icon}</span>
            </th>`;
        }).join('') + (this.config.readOnly ? '' : '<th class="col-actions"Actions</th>');
    }

    _bindHeaderEvents(thead, showCb) {
        thead.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => {
                const field = th.dataset.sort;
                if (this.sortField === field) {
                    this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this.sortField = field;
                    this.sortDir = 'asc';
                }
                this.load();
            });
        });
        if (showCb) {
            const selectAllCb = thead.querySelector('.select-all-cb');
            if (selectAllCb) {
                selectAllCb.addEventListener('change', () => {
                    if (selectAllCb.checked) {
                        this.data.forEach(r => this.selected.add(r.id));
                    } else {
                        this.selected.clear();
                    }
                    this.renderTable();
                    this._fireSelectionChange();
                });
            }
        }
    }

    _renderBody(cols, showCb) {
        if (this.data.length === 0) {
            const colSpan = cols.length + 1 + (showCb ? 1 : 0);
            return `<tr><td colspan="${colSpan}" class="empty-state">No records found</td></tr>`;
        }
        return this.data.map(row => {
            const id = row.id;
            const isSelected = this.selected.has(id);
            const cbTd = showCb ? `<td class="col-checkbox"><input type="checkbox" class="row-cb" data-id="${escapeHtml(id)}" ${isSelected ? 'checked' : ''}></td>` : '';
            return `<tr data-id="${escapeHtml(id)}" class="clickable-row${isSelected ? ' selected' : ''}">
                ${cbTd}
                ${cols.map(col => this._renderCell(col, row)).join('')}
                ${this.config.readOnly ? '' : AdminApp.renderActionPopup(row, this.config)}
            </tr>`;
        }).join('');
    }

    _renderCell(col, row) {
        let val = row[col.key];
        let cls = '';
        if (col.render) {
            val = col.render(val, row);
            return `<td class="${col.type ? `col-${col.type}` : 'col-custom'}">${val}</td>`;
        }
        if (col.type === 'multiline') {
            const primary = escapeHtml(val);
            const secondary = col.subKey ? escapeHtml(row[col.subKey]) : '';
            val = `<div class="cell-primary">${primary || '-'}</div>${secondary ? `<div class="cell-secondary">${secondary}</div>` : ''}`;
            return `<td class="col-multiline">${val}</td>`;
        }
        if (col.type === 'currency') { val = formatCurrency(val); cls = 'numeric'; }
        else if (col.type === 'date') { val = formatDate(val); cls = 'date'; }
        else if (col.type === 'status') {
            if ((this.config.entity === 'contabilidad' || this.config.entity === 'facturacion' || this.config.entity === 'alquileres' || this.config.entity === 'costes') && col.key === 'estado') val = computeEstado(row);
            val = statusBadge(val, this.config.entity);
        }
        else if (col.type === 'tags' && Array.isArray(val)) { val = val.map(t => `<span class="badge badge-blue">${escapeHtml(t)}</span>`).join(' '); }
        else if (col.type === 'badge_count') { val = val > 0 ? `<span class="badge badge-green">${val} ${col.suffix || ''}</span>` : '-'; }
        else if (col.type === 'boolean') { val = val ? `<span class="badge badge-blue">${col.trueLabel || 'Si'}</span>` : ''; }
        else if (col.type === 'thumbnail') { val = val ? `<img class="table-thumbnail" src="${escapeHtml(val)}" alt="" loading="lazy">` : '<span class="table-thumbnail-empty">-</span>'; cls = 'thumbnail-cell'; }
        else { val = escapeHtml(val); }
        const colTypeCls = col.type ? `col-${col.type}` : 'col-text';
        const tdCls = cls ? `${cls} ${colTypeCls}` : colTypeCls;
        return `<td class="${tdCls}">${val || '-'}</td>`;
    }

    _bindBodyEvents(thead, tbody, showCb) {
        if (showCb) {
            tbody.querySelectorAll('.row-cb').forEach(cb => {
                cb.addEventListener('click', (e) => { e.stopPropagation(); });
                cb.addEventListener('change', () => {
                    const rowId = cb.dataset.id;
                    if (cb.checked) this.selected.add(rowId);
                    else this.selected.delete(rowId);
                    this.updateSelectionBar();
                    this._fireSelectionChange();
                    const tr = cb.closest('tr');
                    if (tr) tr.classList.toggle('selected', cb.checked);
                    const selectAllCb = thead.querySelector('.select-all-cb');
                    if (selectAllCb) selectAllCb.checked = this.data.every(r => this.selected.has(r.id));
                });
            });
        }
        tbody.querySelectorAll('tr.clickable-row').forEach(tr => {
            tr.addEventListener('click', (e) => {
                if (e.target.closest('button') || e.target.closest('input[type="checkbox"]')) return;
                const id = tr.dataset.id;
                const row = this.data.find(r => r.id === id);
                if (row && this.config.onRowClick) this.config.onRowClick(row);
            });
        });
    }

    _renderFooter(cols, showCb) {
        if (!this.totals || this.data.length === 0) return '';
        const cbTd = showCb ? '<td class="col-checkbox"></td>' : '';
        return `<tr>${cbTd}${cols.map(col => {
            const colTypeCls = col.type ? `col-${col.type}` : 'col-text';
            if (col.type === 'currency' && this.totals[col.key] != null) {
                return `<td class="numeric ${colTypeCls}">${formatCurrency(this.totals[col.key])}</td>`;
            }
            if (col === cols[0]) return `<td class="${colTypeCls}">Total</td>`;
            return `<td class="${colTypeCls}"></td>`;
        }).join('')}${this.config.readOnly ? '' : '<td class="actions col-actions"></td>'}</tr>`;
    }

    updateSelectionBar() {
        const bar = this.container.querySelector('.selection-bar');
        if (!bar) return;
        if (this.selected.size > 0) {
            bar.classList.remove('hidden');
            bar.querySelector('.selection-count').textContent = `${this.selected.size} selected${this.selected.size !== 1 ? 's' : ''}`;
        } else {
            bar.classList.add('hidden');
        }
    }

    _fireSelectionChange() {
        if (this.config.onSelectionChange) {
            this.config.onSelectionChange(this.getSelectedRows());
        }
    }

    getSelectedRows() { return this.data.filter(r => this.selected.has(r.id)); }
    getAllSelectedIds() { return [...this.selected]; }

    clearSelection() {
        this.selected.clear();
        this.updateSelectionBar();
        this._fireSelectionChange();
    }

    sortLocally() {
        const field = this.sortField;
        const dir = this.sortDir === 'asc' ? 1 : -1;
        this.data.sort((a, b) => {
            let va = a[field], vb = b[field];
            if (va == null) return 1;
            if (vb == null) return -1;
            if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
            return String(va).localeCompare(String(vb), 'en') * dir;
        });
    }

    renderPagination() {
        const info = this.container.querySelector('.row-count');
        const controls = this.container.querySelector('.pagination-controls');
        const totalPages = this.perPage === 0 ? 1 : Math.max(1, Math.ceil(this.total / this.perPage));
        info.textContent = `${this.total} record${this.total !== 1 ? 's' : ''}`;
        controls.innerHTML = `
            <button ${this.page <= 1 ? 'disabled' : ''} data-page="${this.page - 1}">\u2190 Prev</button>
            <span class="current-page">${this.page} / ${totalPages}</span>
            <button ${this.page >= totalPages ? 'disabled' : ''} data-page="${this.page + 1}">Next \u2192</button>
        `;
        controls.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', () => {
                this.page = parseInt(btn.dataset.page, 10);
                this.load();
            });
        });
    }
}

Object.assign(AdminApp, { DataTable });

})(window.AdminApp);
