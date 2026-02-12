(function(AdminApp) {

const { escapeHtml } = AdminApp;

function loadAsyncFilters(container, dt) {
    container.querySelectorAll('.async-filter').forEach(sel => {
        const url = sel.dataset.asyncUrl;
        if (!url) return;
        const filterKey = sel.dataset.filter;
        const filterCfg = (dt.config.filters || []).find(f => f.key === filterKey);
        const valKey = filterCfg?.optionValue;
        const lblKey = filterCfg?.optionLabel;
        (async () => {
            try {
                const options = await AdminApp.api.get(url);
                const current = dt.filterValues[filterKey];
                if (valKey && lblKey && options.length > 0 && typeof options[0] === 'object') {
                    const labelMap = {};
                    options.forEach(o => { labelMap[String(o[valKey])] = o[lblKey]; });
                    dt._asyncOptionLabels[filterKey] = labelMap;
                    sel.innerHTML = '<option value="">All</option>' +
                        options.map(o => `<option value="${o[valKey]}" ${current === String(o[valKey]) ? 'selected' : ''}>${o[lblKey]}</option>`).join('');
                } else {
                    sel.innerHTML = '<option value="">All</option>' +
                        options.map(o => `<option value="${o}" ${current === o ? 'selected' : ''}>${o}</option>`).join('');
                }
                dt._renderChips();
            } catch (_) { }
        })();
    });
}

function clearAllFilters(dt) {
    dt.searchQuery = '';
    const searchInput = dt.container.querySelector('.toolbar > .search-input');
    if (searchInput) searchInput.value = '';
    const defaults = dt.config.defaultFilters || {};
    dt.filterValues = { ...defaults };
    dt.container.querySelectorAll('.filter-select').forEach(sel => { sel.value = ''; });
    dt.container.querySelectorAll('.filter-text').forEach(input => { input.value = ''; });
    const periodSelect = dt.container.querySelector('.period-select');
    if (periodSelect) periodSelect.value = '';
    const dateRangeEl = dt.container.querySelector('.date-range-filter');
    if (dateRangeEl) {
        dateRangeEl.classList.add('hidden');
        dateRangeEl.querySelectorAll('.date-range-input').forEach(input => { input.value = ''; });
    }
    dt.page = 1;
    dt.clearSelection();
    dt.load();
}

function removeFilter(dt, key) {
    if (key === '_search') {
        dt.searchQuery = '';
        const searchInput = dt.container.querySelector('.toolbar > .search-input');
        if (searchInput) searchInput.value = '';
    } else if (key === 'periodo') {
        delete dt.filterValues.periodo;
        const periodSelect = dt.container.querySelector('.period-select');
        if (periodSelect) periodSelect.value = '';
    } else if (key === 'fecha_from' || key === 'fecha_to') {
        delete dt.filterValues.fecha_from;
        delete dt.filterValues.fecha_to;
        const dateRangeEl = dt.container.querySelector('.date-range-filter');
        if (dateRangeEl) {
            dateRangeEl.classList.add('hidden');
            dateRangeEl.querySelectorAll('.date-range-input').forEach(input => { input.value = ''; });
        }
        const periodSelect = dt.container.querySelector('.period-select');
        if (periodSelect) periodSelect.value = '';
    } else {
        delete dt.filterValues[key];
        const sel = dt.container.querySelector(`.filter-select[data-filter="${key}"]`);
        if (sel) sel.value = '';
        const input = dt.container.querySelector(`.filter-text[data-filter="${key}"]`);
        if (input) input.value = '';
    }
    dt.page = 1;
    dt.clearSelection();
    dt.load();
}

function renderChips(dt) {
    const chipsContainer = dt.container.querySelector('.filter-chips');
    const chipsList = dt.container.querySelector('.filter-chips-list');
    if (!chipsContainer || !chipsList) return;
    const chips = [];
    const defaults = dt.config.defaultFilters || {};
    const filters = dt.config.filters || [];
    if (dt.searchQuery) {
        chips.push({ key: '_search', label: 'Search', value: dt.searchQuery });
    }
    for (const [key, value] of Object.entries(dt.filterValues)) {
        if (!value || key === '_period') continue;
        if (defaults[key] === value) continue;
        if (key === 'fecha_to' && dt.filterValues.fecha_from) continue;
        let label = key;
        let displayValue = value;
        const filterCfg = filters.find(f => f.key === key);
        if (filterCfg) {
            label = filterCfg.label;
            if (dt._asyncOptionLabels[key] && dt._asyncOptionLabels[key][value]) {
                displayValue = dt._asyncOptionLabels[key][value];
            }
        } else if (key === 'periodo') {
            label = 'Per\u00edodo';
        } else if (key === 'fecha_from') {
            label = 'Range';
            const from = dt.filterValues.fecha_from || '';
            const to = dt.filterValues.fecha_to || '';
            displayValue = from + (to ? ' \u2013 ' + to : '+');
        }
        chips.push({ key, label, value: displayValue });
    }
    if (chips.length === 0) {
        chipsContainer.classList.add('hidden');
        return;
    }
    chipsContainer.classList.remove('hidden');
    chipsList.innerHTML = chips.map(c =>
        `<span class="filter-chip">
            <span class="filter-chip-label">${escapeHtml(c.label)}:</span>
            ${escapeHtml(c.value)}
            <button class="chip-remove" data-chip-key="${c.key}" type="button" aria-label="Remove filter ${escapeHtml(c.label)}">&times;</button>
        </span>`
    ).join('');
    chipsList.querySelectorAll('.chip-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeFilter(dt, btn.dataset.chipKey);
        });
    });
    const countBadge = dt.container.querySelector('.filter-toggle-count');
    if (countBadge) {
        const count = dt._activeFilterCount();
        countBadge.textContent = count > 0 ? count : '';
    }
}

Object.assign(AdminApp, { loadAsyncFilters, clearAllFilters, removeFilter, renderChips });

})(window.AdminApp);
