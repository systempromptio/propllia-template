(function(AdminApp) {

const { api, Toast, confirmAction, formatCurrency, formatDate, escapeHtml } = AdminApp;

async function renderRentRevisionTab(container, contract) {
    container.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const data = await api.get(`/contracts/${contract.id}/revision_renta`);
        let html = '';

        html += '<div class="detail-info-grid">';
        html += `<div class="detail-info-section">
            <h3>Applicable index: <span class="badge badge-blue">${escapeHtml(data.indice_aplicable.toUpperCase())}</span></h3>
            <p class="text-sm text-muted mb-3 mt-0">${escapeHtml(data.razon)}</p>
            <div class="detail-grid">
                <div class="detail-field"><span class="detail-label">Current rent</span><span class="detail-value value-lg">${formatCurrency(data.alquiler_actual)}</span></div>
                ${data.proxima_revision ? `<div class="detail-field"><span class="detail-label">Next review</span><span class="detail-value">${formatDate(data.proxima_revision)}</span></div>` : ''}
                ${data.variacion_actual != null ? `<div class="detail-field"><span class="detail-label">Variation ${data.indice_aplicable.toUpperCase()} actual</span><span class="detail-value text-semibold ${parseFloat(data.variacion_actual) >= 0 ? 'text-danger' : 'text-success'}">${data.variacion_actual}%</span></div>` : ''}
                ${data.alquiler_proyectado ? `<div class="detail-field"><span class="detail-label">Projected rent</span><span class="detail-value text-bold">${formatCurrency(data.alquiler_proyectado)}</span></div>` : ''}
            </div>
        </div>`;

        html += `<div class="detail-info-section">
            <h3>Apply review</h3>
            <form id="form-aplicar-revision" class="flex-col gap-3">
                <div>
                    <label class="field-label">Year-on-year variation (%)</label>
                    <input type="number" step="0.01" name="variacion" class="field-input"
                        ${data.variacion_actual != null ? `value="${data.variacion_actual}"` : ''}
                        placeholder="e.g. 2.29" required>
                </div>
                ${data.variacion_actual != null && data.alquiler_proyectado ? `
                <p class="text-sm text-muted m-0">
                    New rent: <strong>${formatCurrency(data.alquiler_proyectado)}</strong>
                </p>` : ''}
                <div>
                    <label class="field-label">Notes</label>
                    <textarea name="notas" class="field-input" rows="2" placeholder="Optional"></textarea>
                </div>
                <button type="submit" class="btn btn-primary">Apply review</button>
            </form>
        </div>`;
        html += '</div>';

        if (data.historial && data.historial.length > 0) {
            html += '<div class="detail-info-section mt-4"><h3>Review history</h3>';
            html += '<table class="data-table"><thead><tr><th>Date</th><th>Index</th><th>Variation</th><th>Previous</th><th>New</th><th>Notes</th></tr></thead><tbody>';
            for (const h of data.historial) {
                html += `<tr>
                    <td>${formatDate(h.fecha_aplicacion)}</td>
                    <td><span class="badge badge-blue">${escapeHtml(h.indice_tipo)}</span></td>
                    <td>${h.variacion}%</td>
                    <td>${formatCurrency(h.alquiler_anterior)}</td>
                    <td>${formatCurrency(h.alquiler_nuevo)}</td>
                    <td>${escapeHtml(h.notas || '')}</td>
                </tr>`;
            }
            html += '</tbody></table></div>';
        } else {
            html += '<p class="empty-placeholder">No previous reviews</p>';
        }

        container.innerHTML = html;

        container.querySelector('#form-aplicar-revision')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            const variacion = parseFloat(fd.get('variacion'));
            if (isNaN(variacion)) { Toast.show('Invalid variation', 'error'); return; }
            const ok = await confirmAction('Apply review', `Apply review de ${variacion}%? This will update the contract rent.`);
            if (!ok) return;
            try {
                const result = await api.post(`/contracts/${contract.id}/revision_renta`, {
                    variacion: variacion,
                    notas: fd.get('notas') || null,
                });
                Toast.show(`Review applied: ${formatCurrency(result.alquiler_anterior)} -> ${formatCurrency(result.alquiler_nuevo)}`);
                renderRentRevisionTab(container, contract);
            } catch (err) {
                Toast.show('Error: ' + err.message, 'error');
            }
        });
    } catch (err) {
        container.innerHTML = `<div class="empty-state">Error loading review data: ${escapeHtml(err.message)}</div>`;
    }
}

Object.assign(AdminApp, { renderRentRevisionTab });

})(window.AdminApp);
