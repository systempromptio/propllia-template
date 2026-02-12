(function(AdminApp) {

const { escapeHtml, getPeriodMonths } = AdminApp;

function renderFilterBar(config, filterValues, searchQuery, perPage) {
    const hasFilters = (config.filters && config.filters.length > 0) || config.showPeriodFilter;

    const periodFilter = config.showPeriodFilter ? `
        <div class="filter-group">
            <label class="filter-label">Per\u00edodo</label>
            <select class="period-select" data-filter="_period">
                <option value="">All</option>
                <option value="this_month">This month</option>
                <option value="last_month">Last month</option>
                <option value="last_3">\Last 3 months</option>
                <option value="last_6">\Last 6 months</option>
                <option value="this_year">This year</option>
                <option value="last_year">Last year</option>
                <option value="custom">Custom</option>
            </select>
        </div>` : '';

    const dateRangeFilter = config.showPeriodFilter ? `
        <div class="date-range-filter hidden">
            <div class="filter-group">
                <label class="filter-label">From</label>
                <input type="date" class="date-range-input" data-filter="fecha_from" value="${escapeHtml(filterValues.fecha_from || '')}">
            </div>
            <div class="filter-group">
                <label class="filter-label">To</label>
                <input type="date" class="date-range-input" data-filter="fecha_to" value="${escapeHtml(filterValues.fecha_to || '')}">
            </div>
        </div>` : '';

    const filterInputs = (config.filters || []).map(f =>
        f.type === 'text'
        ? `<div class="filter-group"><label class="filter-label">${f.label}</label><input type="text" class="filter-text filter-input" data-filter="${f.key}" placeholder="${f.label}..." value="${escapeHtml(filterValues[f.key] || '')}" class="filter-min-width"></div>`
        : `<div class="filter-group"><label class="filter-label">${f.label}</label><select class="filter-select${f.asyncOptions ? ' async-filter' : ''}" data-filter="${f.key}"${f.asyncOptions ? ` data-async-url="${f.asyncOptions}"` : ''}>
            <option value="">All</option>
            ${(f.options || []).map(o => `<option value="${o}" ${filterValues[f.key] === o ? 'selected' : ''}>${o}</option>`).join('')}
        </select></div>`
    ).join('');

    const filterToggleBtn = hasFilters ? `
        <button class="btn btn-sm btn-secondary filter-toggle" aria-expanded="true" type="button">
            <span class="filter-toggle-icon">\u25BC</span> Filtros
            <span class="filter-toggle-count"></span>
        </button>` : '';

    const toolbar = `
        ${config.showCheckboxes ? '<div class="selection-bar hidden"><span class="selection-count"></span><slot name="selection-actions"></slot></div>' : ''}
        <div class="toolbar">
            <input type="text" class="search-input" placeholder="Search ${config.entity}..." value="${escapeHtml(searchQuery)}">
            ${filterToggleBtn}
            ${config.exportPath ? '<button class="btn btn-secondary" data-action="export">\u2913 Export CSV</button>' : ''}
            ${config.readOnly ? '' : '<button class="btn btn-primary" data-action="create">+ New</button>'}
        </div>
        ${hasFilters ? `<div class="filter-row">
            ${periodFilter}
            ${dateRangeFilter}
            ${filterInputs}
        </div>` : ''}
        <div class="filter-chips hidden">
            <div class="filter-chips-list"></div>
            <button class="btn btn-sm btn-secondary filter-chips-clear">Clear filters</button>
        </div>`;

    const table = `
        <div class="table-container">
            <div class="table-scroll">
                <table class="data-table">
                    <thead><tr></tr></thead>
                    <tbody></tbody>
                    <tfoot></tfoot>
                </table>
            </div>
            <div class="pagination">
                <div class="pagination-info">
                    <span class="row-count"></span>
                    <select class="per-page-select">
                        <option value="50" ${perPage === 50 ? 'selected' : ''}>50</option>
                        <option value="100" ${perPage === 100 ? 'selected' : ''}>100</option>
                        <option value="200" ${perPage === 200 ? 'selected' : ''}>200</option>
                        <option value="0" ${perPage === 0 ? 'selected' : ''}>All</option>
                    </select>
                    <span>por p\u00e1gina</span>
                </div>
                <div class="pagination-controls"></div>
            </div>
        </div>`;

    return toolbar + table;
}

function bindFilterEvents(container, dt) {
    const searchInput = container.querySelector('.toolbar > .search-input');
    let debounce;
    searchInput.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => { dt.searchQuery = searchInput.value; dt.page = 1; dt.clearSelection(); dt.load(); }, 300);
    });

    const filterToggle = container.querySelector('.filter-toggle');
    const filterRow = container.querySelector('.filter-row');
    if (filterToggle && filterRow) {
        filterToggle.addEventListener('click', () => {
            const expanded = filterToggle.getAttribute('aria-expanded') === 'true';
            filterToggle.setAttribute('aria-expanded', String(!expanded));
            filterRow.classList.toggle('filter-row--collapsed', expanded);
        });
    }

    const periodSelect = container.querySelector('.period-select');
    const dateRangeEl = container.querySelector('.date-range-filter');
    if (periodSelect) {
        if (dt.filterValues.fecha_from || dt.filterValues.fecha_to) {
            periodSelect.value = 'custom';
            if (dateRangeEl) dateRangeEl.classList.remove('hidden');
        }
        periodSelect.addEventListener('change', () => {
            const period = periodSelect.value;
            if (period === 'custom') {
                if (dateRangeEl) dateRangeEl.classList.remove('hidden');
                delete dt.filterValues.periodo;
            } else {
                if (dateRangeEl) dateRangeEl.classList.add('hidden');
                const periodoStr = getPeriodMonths(period);
                dt.filterValues.periodo = periodoStr || undefined;
                delete dt.filterValues.fecha_from;
                delete dt.filterValues.fecha_to;
                dt.page = 1;
                dt.clearSelection();
                dt.load();
            }
        });
    }

    if (dateRangeEl) {
        dateRangeEl.querySelectorAll('.date-range-input').forEach(input => {
            input.addEventListener('change', () => {
                dt.filterValues[input.dataset.filter] = input.value || undefined;
                delete dt.filterValues.periodo;
                dt.page = 1;
                dt.clearSelection();
                dt.load();
            });
        });
    }

    container.querySelectorAll('.filter-select').forEach(sel => {
        sel.addEventListener('change', () => {
            dt.filterValues[sel.dataset.filter] = sel.value || undefined;
            dt.page = 1;
            dt.clearSelection();
            dt.load();
        });
    });

    container.querySelectorAll('.filter-text').forEach(input => {
        let filterDebounce;
        input.addEventListener('input', () => {
            clearTimeout(filterDebounce);
            filterDebounce = setTimeout(() => {
                dt.filterValues[input.dataset.filter] = input.value || undefined;
                dt.page = 1;
                dt.clearSelection();
                dt.load();
            }, 300);
        });
    });

    const clearBtn = container.querySelector('.filter-chips-clear');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => { dt._clearAllFilters(); });
    }

    const exportBtn = container.querySelector('[data-action="export"]');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const params = dt._buildParams();
            params.delete('page');
            params.delete('per_page');
            const qs = params.toString();
            window.open(`${AdminApp.API_BASE}${dt.config.exportPath}${qs ? '?' + qs : ''}`, '_blank');
        });
    }

    const createBtn = container.querySelector('[data-action="create"]');
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            if (dt.config.onAction) dt.config.onAction('create', null);
        });
    }

    container.querySelector('.per-page-select').addEventListener('change', (e) => {
        dt.perPage = parseInt(e.target.value, 10);
        dt.page = 1;
        dt.load();
    });
}

Object.assign(AdminApp, { renderFilterBar, bindFilterEvents });

})(window.AdminApp);
