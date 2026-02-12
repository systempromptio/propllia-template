(function(AdminApp) {

const { api, Toast, formatCurrency, formatDate, escapeHtml } = AdminApp;

function renderDiscountCard(d, historical) {
    return `<div class="discount-card${historical ? ' discount-card--historical' : ''}">
        <div class="discount-header">
            <span class="discount-label">${escapeHtml(d.etiqueta || d.categoria)}</span>
            <span class="discount-amount">-${d.es_porcentaje ? d.valor_numerico + '%' : formatCurrency(d.valor_numerico)}</span>
        </div>
        <div class="discount-dates">${formatDate(d.fecha_inicio)} - ${formatDate(d.fecha_fin)}</div>
        <div class="discount-effective">Amount: -${formatCurrency(d.importe_calculado)}/mes</div>
        ${d.notas ? `<div class="discount-notes">${escapeHtml(d.notas)}</div>` : ''}
    </div>`;
}

async function renderDescuentosTab(container, contrato) {
    container.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const data = await api.get(`/contracts/${contrato.id}/descuentos`);
        let html = '';

        html += '<div class="detail-info-grid">';
        html += `<div class="detail-info-section">
            <h3>Discount summary</h3>
            <div class="detail-grid">
                <div class="detail-field"><span class="detail-label">Base rent</span><span class="detail-value">${formatCurrency(data.alquiler_base)}</span></div>
                <div class="detail-field"><span class="detail-label">Total discounts</span><span class="detail-value text-success">-${formatCurrency(data.total_descuento)}</span></div>
                <div class="detail-field border-top pt-2">
                    <span class="detail-label text-semibold">Effective rent</span>
                    <span class="detail-value value-lg">${formatCurrency(data.alquiler_efectivo)}</span>
                </div>
            </div>
        </div>`;

        html += `<div class="detail-info-section">
            <h3>New discount</h3>
            <form id="form-crear-descuento" class="flex-col gap-3">
                <div class="grid-2col">
                    <div><label class="field-label">Amount</label><input type="number" step="0.01" name="valor_numerico" class="field-input" required></div>
                    <div><label class="field-label">Tipo</label><select name="es_porcentaje" class="field-input"><option value="false">GBP (fixed amount)</option><option value="true">% (percentage)</option></select></div>
                    <div><label class="field-label">Start date</label><input type="date" name="fecha_inicio" class="field-input" required></div>
                    <div><label class="field-label">End date</label><input type="date" name="fecha_fin" class="field-input" required></div>
                </div>
                <div><label class="field-label">Label</label><input type="text" name="etiqueta" class="field-input" placeholder="e.g. First months discount"></div>
                <div><label class="field-label">Notes</label><textarea name="notas" class="field-input" rows="2" placeholder="Optional"></textarea></div>
                <button type="submit" class="btn btn-primary">Create discount</button>
            </form>
        </div>`;
        html += '</div>';

        if (data.descuentos_activos.length > 0) {
            html += '<div class="detail-info-section mt-4"><h3>Active discounts</h3><div class="discount-cards">';
            for (const d of data.descuentos_activos) {
                html += renderDiscountCard(d);
            }
            html += '</div></div>';
        }

        if (data.descuentos_historicos.length > 0) {
            html += '<div class="detail-info-section mt-4"><h3>Discount history</h3><div class="discount-cards">';
            for (const d of data.descuentos_historicos) {
                html += renderDiscountCard(d, true);
            }
            html += '</div></div>';
        }

        if (data.descuentos_activos.length === 0 && data.descuentos_historicos.length === 0) {
            html += '<p class="empty-placeholder">No discounts recorded</p>';
        }

        container.innerHTML = html;

        container.querySelector('#form-crear-descuento')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
                await api.post(`/contracts/${contrato.id}/descuentos`, {
                    valor_numerico: parseFloat(fd.get('valor_numerico')),
                    es_porcentaje: fd.get('es_porcentaje') === 'true',
                    fecha_inicio: fd.get('fecha_inicio'),
                    fecha_fin: fd.get('fecha_fin'),
                    etiqueta: fd.get('etiqueta') || null,
                    notas: fd.get('notas') || null,
                });
                Toast.show('Discount created');
                renderDescuentosTab(container, contrato);
            } catch (err) {
                Toast.show('Error: ' + err.message, 'error');
            }
        });
    } catch (err) {
        container.innerHTML = `<div class="empty-state">Error: ${escapeHtml(err.message)}</div>`;
    }
}

Object.assign(AdminApp, { renderDescuentosTab });

})(window.AdminApp);
