(function(AdminApp) {

const { api, Toast, FormPanel, escapeHtml, formatCurrency, statusBadge } = AdminApp;

async function renderCostEvolution(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    if (!el) return;

    try {
        const data = await api.get('/reports/cost_evolution');
        if (!data || data.length === 0) {
            el.innerHTML = '<p class="loading-text">No cost data available.</p>';
            return;
        }

        const byProperty = {};
        const allYears = new Set();
        data.forEach(r => {
            if (!byProperty[r.property_name]) byProperty[r.property_name] = {};
            if (!byProperty[r.property_name][r.expense_category]) byProperty[r.property_name][r.expense_category] = {};
            byProperty[r.property_name][r.expense_category][r.year] = parseFloat(r.total) || 0;
            allYears.add(r.year);
        });

        const years = [...allYears].sort((a, b) => a - b);
        if (years.length === 0) { el.innerHTML = ''; return; }

        let html = '<h3 class="m-0 mb-4">Cost evolution by property</h3>';

        for (const [propName, categories] of Object.entries(byProperty).sort(([a], [b]) => a.localeCompare(b, 'en'))) {
            const cats = Object.keys(categories).sort((a, b) => a.localeCompare(b, 'en'));
            const totals = {};
            years.forEach(y => { totals[y] = 0; });

            html += `<div class="evolution-card">
                <h4 class="m-0 mb-3">${escapeHtml(propName)}</h4>
                <table class="data-table evolution-table">
                    <thead><tr>
                        <th>Category</th>
                        ${years.map(y => `<th class="numeric">${y}</th>`).join('')}
                        ${years.length >= 2 ? '<th class="numeric">Var.</th>' : ''}
                    </tr></thead>
                    <tbody>`;

            cats.forEach(cat => {
                const vals = categories[cat];
                years.forEach(y => { totals[y] += vals[y] || 0; });
                const lastTwo = years.slice(-2);
                let varPct = '';
                if (lastTwo.length === 2) {
                    const prev = vals[lastTwo[0]] || 0;
                    const curr = vals[lastTwo[1]] || 0;
                    if (prev > 0) {
                        const pct = ((curr - prev) / prev * 100).toFixed(1);
                        const color = pct > 0 ? 'red' : 'green';
                        varPct = `<span class="badge badge-${color}">${pct > 0 ? '+' : ''}${pct}%</span>`;
                    } else {
                        varPct = '-';
                    }
                }
                html += `<tr>
                    <td>${escapeHtml(cat)}</td>
                    ${years.map(y => `<td class="numeric">${formatCurrency(vals[y] || 0)}</td>`).join('')}
                    ${years.length >= 2 ? `<td class="numeric">${varPct}</td>` : ''}
                </tr>`;
            });

            const lastTwo = years.slice(-2);
            let totalVar = '';
            if (lastTwo.length === 2) {
                const prev = totals[lastTwo[0]] || 0;
                const curr = totals[lastTwo[1]] || 0;
                if (prev > 0) {
                    const pct = ((curr - prev) / prev * 100).toFixed(1);
                    const color = pct > 0 ? 'red' : 'green';
                    totalVar = `<span class="badge badge-${color}">${pct > 0 ? '+' : ''}${pct}%</span>`;
                }
            }
            html += `</tbody><tfoot><tr>
                <td><strong>Total</strong></td>
                ${years.map(y => `<td class="numeric"><strong>${formatCurrency(totals[y])}</strong></td>`).join('')}
                ${years.length >= 2 ? `<td class="numeric">${totalVar}</td>` : ''}
            </tr></tfoot></table></div>`;
        }

        el.innerHTML = html;
    } catch (e) {
        el.innerHTML = `<p class="text-danger">Error loading evolution: ${escapeHtml(e.message)}</p>`;
    }
}

async function renderPropertyDetail(container) {
    const el = typeof container === 'string' ? document.querySelector(container) : container;
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        el.innerHTML = '<div class="empty-state">No property specified.</div>';
        return;
    }

    try {
        const data = await api.get(`/properties/${id}/detail`);
        const a = data.property;
        const f = data.financial;
        const images = data.images || [];
        const invoices = data.invoices || [];
        const contract = data.contract || null;

        let html = '';

        html += AdminApp.breadcrumb('properties', 'Properties', a.property_name);

        html += `<div class="detail-page-header">
            <div class="header-title">
                <h1>${escapeHtml(a.property_name)}</h1>
                ${statusBadge(a.status, 'property')}
            </div>
            <div class="header-actions">
                <button class="btn btn-secondary" id="btn-edit-property">Edit</button>
                ${a.image_folder ? '<button class="btn btn-secondary" id="btn-gallery">View photos</button>' : ''}
            </div>
        </div>`;

        html += `<div class="tab-bar">
            <button class="tab active" data-tab="resumen">Summary</button>
            <button class="tab" data-tab="contratos">Contracts</button>
            <button class="tab" data-tab="alquileres">Rentals</button>
            <button class="tab" data-tab="gastos">Expenses</button>
            <button class="tab" data-tab="incidencias">Issues</button>
            <button class="tab" data-tab="fotos">Photos</button>
            <button class="tab" data-tab="web">Web</button>
        </div>`;

        html += '<div class="tab-content">';
        html += `<div class="tab-panel active" data-panel="resumen">${AdminApp.renderResumenTab(a, f, images, invoices, contract)}</div>`;
        html += '<div class="tab-panel" data-panel="contratos"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="alquileres"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="gastos"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="incidencias"><div class="tab-table-root"></div></div>';
        html += '<div class="tab-panel" data-panel="fotos"><div class="tab-fotos-root"></div></div>';
        html += '<div class="tab-panel" data-panel="web"><div class="tab-web-root"></div></div>';
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
                    if (name === 'fotos') {
                        AdminApp.initFotosTab(el.querySelector('[data-panel="fotos"] .tab-fotos-root'), id, images);
                    } else if (name === 'web') {
                        AdminApp.initWebTab(el.querySelector('[data-panel="web"] .tab-web-root'), id);
                    } else {
                        AdminApp.initActivoTabTable(name, el.querySelector(`[data-panel="${name}"] .tab-table-root`), a);
                    }
                }
            });
        });

        el.querySelector('#btn-edit-property')?.addEventListener('click', () => {
            const formPanel = new FormPanel({
                title: 'Property',
                fields: [
                    { key: 'property_name', label: 'Property name', required: true },
                    { key: 'address', label: 'Address', required: true },
                    { key: 'contract_ref', label: 'Contract ref' },
                    { key: 'status', label: 'Status', type: 'select', options: ['Vacant', 'Occupied', 'Rented', 'Under Renovation'], default: 'Vacant' },
                    { key: 'rent', label: 'Monthly rent', type: 'number' },
                    { key: 'start_date', label: 'Contract start', type: 'date' },
                    { key: 'end_date', label: 'Contract end', type: 'date' },
                    { key: 'tags', label: 'Tags (comma separated)' },
                    { key: 'image_folder', label: 'Image folder' },
                ],
                onSubmit: async (formData) => {
                    await api.put(`/properties/${id}`, formData);
                    Toast.show('Property updated');
                    renderPropertyDetail(container);
                }
            });
            formPanel.open(a);
        });

        el.querySelector('#btn-gallery')?.addEventListener('click', () => {
            AdminApp.PropertyPresentation.open(id);
        });

    } catch (e) {
        el.innerHTML = `<div class="empty-state">Error loading property: ${escapeHtml(e.message)}</div>`;
    }
}

Object.assign(AdminApp, { renderActivoDetail: renderPropertyDetail, renderPropertyDetail, renderCostesEvolution: renderCostEvolution, renderCostEvolution });

})(window.AdminApp);
