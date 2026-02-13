(function(AdminApp) {

const { api, Toast, escapeHtml, formatCurrency } = AdminApp;

class SepaBatchBuilder {
    constructor(container) {
        this.container = typeof container === 'string' ? document.querySelector(container) : container;
        this.selectedRows = [];
        this.onSuccess = null;
        this.render();
    }

    update(selectedRows) {
        this.selectedRows = selectedRows || [];
        this.render();
    }

    render() {
        if (!this.container) return;

        if (this.selectedRows.length === 0) {
            this.container.innerHTML = `
                <div class="sepa-batch-header">
                    <h3>Remesa SEPA</h3>
                    <div class="sepa-batch-subtitle">Batch builder</div>
                </div>
                <div class="sepa-batch-items">
                    <div class="sepa-batch-empty">
                        Select invoices from the table to create a SEPA batch
                    </div>
                </div>`;
            return;
        }

        let totalAmount = 0;
        let totalNet = 0;
        let totalVat = 0;
        this.selectedRows.forEach(r => {
            totalAmount += parseFloat(r.total) || 0;
            totalNet += parseFloat(r.neto) || 0;
            totalVat += parseFloat(r.vat) || 0;
        });

        const today = new Date().toISOString().split('T')[0];

        this.container.innerHTML = `
            <div class="sepa-batch-header">
                <h3>Remesa SEPA</h3>
                <div class="sepa-batch-subtitle">${this.selectedRows.length} invoice${this.selectedRows.length !== 1 ? 's' : ''} selected</div>
            </div>
            <div class="sepa-batch-items">
                ${this.selectedRows.map(r => `
                    <div class="sepa-batch-item">
                        <div>
                            <div class="sepa-batch-item-ref">${escapeHtml(r.referencia)}</div>
                            <div class="sepa-batch-item-property">${escapeHtml(r.activo)} - ${escapeHtml(r.pagador)}</div>
                        </div>
                        <div class="sepa-batch-item-amount">${formatCurrency(r.total)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="sepa-batch-totals">
                <div class="sepa-batch-totals-row">
                    <span>Neto</span>
                    <span>${formatCurrency(totalNet)}</span>
                </div>
                <div class="sepa-batch-totals-row">
                    <span>IVA</span>
                    <span>${formatCurrency(totalVat)}</span>
                </div>
                <div class="sepa-batch-totals-row total">
                    <span>Total</span>
                    <span>${formatCurrency(totalAmount)}</span>
                </div>
            </div>
            <div class="sepa-batch-actions">
                <div class="sepa-batch-form-group">
                    <label>Collection date</label>
                    <input type="date" class="sepa-batch-date" value="${today}">
                </div>
                <div class="sepa-batch-form-group">
                    <label>Presenter (Creditor)</label>
                    <input type="text" class="sepa-batch-presenter-name" placeholder="Creditor name" value="PROPLIA LTD">
                </div>
                <div class="sepa-batch-form-group">
                    <label>Creditor ID</label>
                    <input type="text" class="sepa-batch-presenter-creditor-id" placeholder="B46454591" value="">
                </div>
                <div class="sepa-batch-form-group">
                    <label>Suffix</label>
                    <input type="text" class="sepa-batch-presenter-suffix" placeholder="000" value="">
                </div>
                <div class="sepa-batch-form-group">
                    <label>Receiver IBAN</label>
                    <input type="text" class="sepa-batch-receiver-iban" placeholder="GB00 0000 0000 0000 0000 00" value="">
                </div>
                <div class="sepa-batch-form-group">
                    <label>SWIFT/BIC</label>
                    <input type="text" class="sepa-batch-receiver-swift-bic" placeholder="LOYDGB2L" value="">
                </div>
                <button class="btn btn-primary sepa-batch-create-btn">Create SEPA Batch</button>
            </div>`;

        this.container.querySelector('.sepa-batch-create-btn').addEventListener('click', () => this.createSepaBatch());
    }

    async createSepaBatch() {
        const val = (sel) => {
            const el = this.container.querySelector(sel);
            return el ? el.value.trim() : '';
        };

        const date = val('.sepa-batch-date');
        const presenterName = val('.sepa-batch-presenter-name');
        const presenterCreditorId = val('.sepa-batch-presenter-creditor-id');
        const presenterSuffix = val('.sepa-batch-presenter-suffix');
        const receiverIban = val('.sepa-batch-receiver-iban');
        const receiverSwiftBic = val('.sepa-batch-receiver-swift-bic');

        if (!date) {
            Toast.show('Enter a collection date', 'error');
            return;
        }
        if (!presenterName) {
            Toast.show('Enter the presenter/creditor name', 'error');
            return;
        }

        const ids = this.selectedRows.map(r => r.id);
        const collectionDate = new Date(date + 'T00:00:00Z').toISOString();

        try {
            const result = await api.post('/sepa-batches/batch', {
                contabilidad_ids: ids,
                fecha_cobro: collectionDate,
                presentador_nombre: presenterName,
                presentador_creditor_id: presenterCreditorId || null,
                presentador_sufijo: presenterSuffix || null,
                receptor_nombre: presenterName,
                receptor_iban: receiverIban || null,
                receptor_swift_bic: receiverSwiftBic || null,
                receptor_sufijo: presenterSuffix || null,
                receptor_creditor_id: presenterCreditorId || null,
            });

            Toast.show(`Batch created: ${result.remesa_id} (${result.created} records, ${formatCurrency(result.total)})`);

            this.selectedRows = [];
            this.render();

            if (this.onSuccess) this.onSuccess();
        } catch (e) {
            Toast.show('Error creating batch: ' + e.message, 'error');
        }
    }
}

Object.assign(AdminApp, { SepaBatchBuilder });

})(window.AdminApp);
