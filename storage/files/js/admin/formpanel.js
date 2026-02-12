(function(AdminApp) {

const { api, escapeHtml } = AdminApp;

class FormPanel {
    constructor(config) {
        this.config = config;
        this.overlay = null;
        this.panel = null;
        this._closing = false;
    }

    open(data = null) {
        if (this.panel || this.overlay) {
            if (this.overlay && this.overlay.parentNode) this.overlay.remove();
            if (this.panel && this.panel.parentNode) this.panel.remove();
            this.overlay = null;
            this.panel = null;
            this._closing = false;
        }
        const isEdit = data != null;
        const title = isEdit ? `Edit ${this.config.title}` : `New ${this.config.title}`;

        this.overlay = document.createElement('div');
        this.overlay.className = 'panel-overlay';

        this.panel = document.createElement('div');
        this.panel.className = 'side-panel';
        this.panel.innerHTML = `
            <div class="panel-header">
                <h2>${title}</h2>
                <button class="panel-close">\u00D7</button>
            </div>
            <div class="panel-body">
                <form id="entity-form">
                    ${this.config.fields.map(f => this.renderField(f, data)).join('')}
                </form>
            </div>
            <div class="panel-footer">
                <button class="btn btn-secondary" data-action="cancel">Cancel</button>
                <button class="btn btn-primary" data-action="save">${isEdit ? 'Guardar' : 'Crear'}</button>
            </div>`;

        this.panel.addEventListener('click', e => e.stopPropagation());
        this.panel.querySelector('.panel-close').addEventListener('click', () => this.close());
        this.panel.querySelector('[data-action="cancel"]').addEventListener('click', () => this.close());
        this.panel.querySelector('[data-action="save"]').addEventListener('click', () => this.submit(isEdit, data));
        this.overlay.addEventListener('click', (e) => {
            if (e.target === this.overlay) this.close();
        });

        document.body.appendChild(this.overlay);
        document.body.appendChild(this.panel);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.overlay.classList.add('open');
                this.panel.classList.add('open');
            });
        });

        this.panel.querySelectorAll('.async-select-wrap').forEach(wrap => {
            const url = wrap.dataset.url;
            const fieldKey = wrap.dataset.field;
            const sel = wrap.querySelector('select');
            const search = wrap.querySelector('.async-select-search');
            const currentLabel = wrap.querySelector('.async-select-current');
            let allOptions = [];
            const currentVal = data ? (data[fieldKey] || '') : '';

            const fieldCfg = this.config.fields.find(f => f.key === fieldKey);
            const valKey = fieldCfg?.optionValue;
            const lblKey = fieldCfg?.optionLabel;

            const renderOption = (o, selectedVal) => {
                const isObj = valKey && lblKey && typeof o === 'object';
                const v = isObj ? o[valKey] : o;
                const l = isObj ? o[lblKey] : o;
                return `<option value="${escapeHtml(String(v))}" ${String(v) === String(selectedVal) ? 'selected' : ''}>${escapeHtml(String(l))}</option>`;
            };

            if (url) {
                (async () => {
                    try {
                        const options = await api.get(url);
                        allOptions = options;
                        sel.innerHTML = '<option value="">-- None --</option>' +
                            options.map(o => renderOption(o, currentVal)).join('');
                        if (currentVal) sel.value = currentVal;
                    } catch {
                        sel.innerHTML = '<option value="">Error loading</option>';
                    }
                })();
            }

            search.addEventListener('input', () => {
                const q = search.value.toLowerCase();
                const filtered = q ? allOptions.filter(o => {
                    const text = (valKey && lblKey && typeof o === 'object') ? String(o[lblKey]) : String(o);
                    return text.toLowerCase().includes(q);
                }) : allOptions;
                const selVal = sel.value;
                sel.innerHTML = '<option value="">-- None --</option>' +
                    filtered.map(o => renderOption(o, selVal)).join('');
            });

            sel.addEventListener('change', () => {
                if (currentLabel) currentLabel.innerHTML = sel.value ? `Selected: <strong>${escapeHtml(sel.value)}</strong>` : '';
            });
        });

        const first = this.panel.querySelector('input, select, textarea');
        if (first) setTimeout(() => first.focus(), 400);
    }

    renderField(field, data) {
        const val = data ? (data[field.key] ?? '') : (field.default ?? '');
        const displayVal = Array.isArray(val) ? val.join(', ') : val;

        if (field.type === 'asyncSelect') {
            return `<div class="form-group">
                <label>${field.label}</label>
                <div class="async-select-wrap" data-field="${field.key}" data-url="${field.asyncOptions || ''}">
                    <input type="text" class="async-select-search" placeholder="Filter..." autocomplete="off">
                    <select name="${field.key}" size="6" class="async-select-list">
                        <option value="">-- Loading... --</option>
                    </select>
                    ${displayVal ? `<div class="async-select-current">Selected: <strong>${escapeHtml(displayVal)}</strong></div>` : ''}
                </div>
            </div>`;
        }

        if (field.type === 'select') {
            return `<div class="form-group">
                <label>${field.label}</label>
                <select name="${field.key}">
                    ${(field.options || []).map(o =>
                        `<option value="${o}" ${o === val ? 'selected' : ''}>${o}</option>`
                    ).join('')}
                </select>
            </div>`;
        }

        if (field.type === 'textarea') {
            return `<div class="form-group">
                <label>${field.label}</label>
                <textarea name="${field.key}">${escapeHtml(displayVal)}</textarea>
            </div>`;
        }

        const inputType = (field.type === 'number' || field.type === 'integer') ? 'number' : field.type === 'date' ? 'date' : 'text';
        const step = field.type === 'integer' ? 'step="1"' : field.type === 'number' ? 'step="0.01"' : '';
        return `<div class="form-group">
            <label>${field.label}</label>
            <input type="${inputType}" name="${field.key}" value="${escapeHtml(displayVal)}" ${step}
                ${field.required ? 'required' : ''} placeholder="${field.placeholder || ''}">
        </div>`;
    }

    submit(isEdit, originalData) {
        const form = this.panel.querySelector('#entity-form');
        const formData = {};
        this.config.fields.forEach(f => {
            let val = form.querySelector(`[name="${f.key}"]`)?.value;
            if (val === '' || val === undefined) {
                if (!isEdit) return;
                val = null;
            } else if (f.type === 'number' && val) {
                val = val;
            } else if (f.key === 'etiquetas' && val) {
                val = val.split(',').map(s => s.trim()).filter(Boolean);
            }
            if (isEdit && val !== null && originalData && val === String(originalData[f.key] ?? '')) {
                return;
            }
            formData[f.key] = val;
        });

        if (this.config.hiddenFields) {
            Object.entries(this.config.hiddenFields).forEach(([k, v]) => {
                formData[k] = v;
            });
        }

        if (this.config.onSubmit) {
            this.config.onSubmit(formData, isEdit, originalData);
        }
        this.close();
    }

    close() {
        if (this._closing) return;
        if (!this.panel && !this.overlay) return;
        this._closing = true;
        if (this.panel) this.panel.classList.remove('open');
        if (this.overlay) this.overlay.classList.remove('open');
        setTimeout(() => {
            if (this.overlay) { this.overlay.remove(); this.overlay = null; }
            if (this.panel) { this.panel.remove(); this.panel = null; }
            this._closing = false;
            if (this.config.onClose) this.config.onClose();
        }, 350);
    }
}

Object.assign(AdminApp, { FormPanel });

})(window.AdminApp);
