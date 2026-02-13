(function(AdminApp) {

const { api, Toast, FormPanel, formatCurrency, escapeHtml } = AdminApp;

function renderWebTabContent(webData) {
    if (!webData) {
        return `<div class="empty-state empty-placeholder">
            <p>No web data for this property.</p>
            <button class="btn btn-primary" id="btn-create-web">Create web listing</button>
        </div>`;
    }

    const d = webData;
    const features = (d.features || d.caracteristicas || []).map(c => `<span class="badge badge-blue">${escapeHtml(c)}</span>`).join(' ');

    let html = `<div class="detail-info-grid">
        <div class="detail-info-section">
            <h3>Publication status</h3>
            <div class="detail-grid">
                <div class="detail-field">
                    <span class="detail-label">Published</span>
                    <span class="detail-value">
                        <label class="toggle-switch">
                            <input type="checkbox" id="web-publicado-toggle" ${d.publicado ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </label>
                        <span id="web-publicado-label" class="ml-auto">${d.publicado ? 'Visible on web' : 'Not published'}</span>
                    </span>
                </div>
                ${d.titulo ? `<div class="detail-field"><span class="detail-label">Title</span><span class="detail-value">${escapeHtml(d.titulo)}</span></div>` : ''}
                <div class="detail-field"><span class="detail-label">Status</span><span class="detail-value"><span class="badge badge-${(d.estado || d.status) === 'reserved' ? 'amber' : 'green'}">${escapeHtml(d.estado || d.status || 'available')}</span></span></div>
                <div class="detail-field"><span class="detail-label">Offer type</span><span class="detail-value">${escapeHtml(d.tipo_oferta || d.offer_type || 'rental')}</span></div>
            </div>
        </div>
        <div class="detail-info-section">
            <h3>Property data</h3>
            <div class="detail-grid">
                ${d.precio ? `<div class="detail-field"><span class="detail-label">Rental price</span><span class="detail-value">${formatCurrency(d.precio)} /mo</span></div>` : ''}
                ${d.precio_venta ? `<div class="detail-field"><span class="detail-label">Sale price</span><span class="detail-value">${formatCurrency(d.precio_venta)}</span></div>` : ''}
                ${d.superficie ? `<div class="detail-field"><span class="detail-label">Area</span><span class="detail-value">${d.superficie} sq ft</span></div>` : ''}
                ${d.habitaciones != null ? `<div class="detail-field"><span class="detail-label">Bedrooms</span><span class="detail-value">${d.habitaciones}</span></div>` : ''}
                ${d.banos != null ? `<div class="detail-field"><span class="detail-label">Bathrooms</span><span class="detail-value">${d.banos}</span></div>` : ''}
                ${d.tipo_inmueble ? `<div class="detail-field"><span class="detail-label">Property type</span><span class="detail-value">${escapeHtml(d.tipo_inmueble)}</span></div>` : ''}
            </div>
        </div>
    </div>`;

    if (d.descripcion) {
        html += `<div class="detail-section">
            <h4>Description</h4>
            <div class="detail-description-box">${escapeHtml(d.descripcion)}</div>
        </div>`;
    }

    if (features) {
        html += `<div class="detail-section">
            <h4>Features</h4>
            <div class="p-3">${features}</div>
        </div>`;
    }

    html += `<div class="mt-4">
        <button class="btn btn-secondary" id="btn-edit-web">Edit web data</button>
    </div>`;

    return html;
}

function webFormFields() {
    return [
        { key: 'publicado', label: 'Published', type: 'select', options: ['true', 'false'] },
        { key: 'estado', label: 'Status', type: 'select', options: ['available', 'reserved'] },
        { key: 'tipo_oferta', label: 'Offer type', type: 'select', options: ['rental', 'sale', 'both'] },
        { key: 'titulo', label: 'Title (override)' },
        { key: 'precio', label: 'Monthly rental price', type: 'number' },
        { key: 'precio_venta', label: 'Sale price', type: 'number' },
        { key: 'superficie', label: 'Area (sq ft)', type: 'number' },
        { key: 'habitaciones', label: 'Bedrooms', type: 'integer' },
        { key: 'banos', label: 'Bathrooms', type: 'integer' },
        { key: 'tipo_inmueble', label: 'Property type', type: 'select', options: ['flat', 'house', 'detached', 'commercial', 'office', 'garage', 'storage', 'land'] },
        { key: 'descripcion', label: 'Description', type: 'textarea' },
        { key: 'features', label: 'Features (comma separated)' },
    ];
}

async function initWebTab(container, propertyId) {
    container.innerHTML = '<p class="loading-text">Loading web data...</p>';

    let webData = null;
    try {
        webData = await api.get(`/property_web/by-activo/${propertyId}`);
    } catch (e) {
    }

    container.innerHTML = renderWebTabContent(webData);

    const toggle = container.querySelector('#web-publicado-toggle');
    if (toggle && webData) {
        toggle.addEventListener('change', async () => {
            try {
                await api.put(`/property_web/${webData.id}`, { publicado: toggle.checked ? 'true' : 'false' });
                const label = container.querySelector('#web-publicado-label');
                if (label) label.textContent = toggle.checked ? 'Visible on web' : 'Not published';
                Toast.show(toggle.checked ? 'Published on web' : 'Removed from web');
            } catch (err) {
                Toast.show('Error: ' + err.message, 'error');
                toggle.checked = !toggle.checked;
            }
        });
    }

    container.querySelector('#btn-edit-web')?.addEventListener('click', () => {
        const data = { ...webData };
        if (data.features && Array.isArray(data.features)) {
            data.features = data.features.join(', ');
        } else if (data.caracteristicas && Array.isArray(data.caracteristicas)) {
            data.features = data.caracteristicas.join(', ');
        }
        if (data.publicado != null) data.publicado = String(data.publicado);
        const fp = new FormPanel({
            title: 'Property web data',
            fields: webFormFields(),
            onSubmit: async (formData) => {
                if (formData.features && typeof formData.features === 'string') {
                    formData.features = formData.features.split(',').map(s => s.trim()).filter(Boolean);
                }
                await api.put(`/property_web/${webData.id}`, formData);
                Toast.show('Web data updated');
                initWebTab(container, propertyId);
            }
        });
        fp.open(data);
    });

    container.querySelector('#btn-create-web')?.addEventListener('click', () => {
        const fp = new FormPanel({
            title: 'Create web listing',
            fields: webFormFields(),
            onSubmit: async (formData) => {
                formData.activo_id = propertyId;
                if (formData.features && typeof formData.features === 'string') {
                    formData.features = formData.features.split(',').map(s => s.trim()).filter(Boolean);
                }
                await api.post('/property_web', formData);
                Toast.show('Web listing created');
                initWebTab(container, propertyId);
            }
        });
        fp.open({});
    });
}

Object.assign(AdminApp, { initWebTab });

})(window.AdminApp);
