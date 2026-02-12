(function(AdminApp) {

const { api, Toast, escapeHtml, formatCurrency } = AdminApp;

class RemesaBuilder {
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
                <div class="remesa-header">
                    <h3>Remesa SEPA</h3>
                    <div class="remesa-subtitle">Batch builder</div>
                </div>
                <div class="remesa-items">
                    <div class="remesa-empty">
                        Select invoices from the table to create a SEPA batch
                    </div>
                </div>`;
            return;
        }

        let totalAmount = 0;
        let totalNeto = 0;
        let totalVat = 0;
        this.selectedRows.forEach(r => {
            totalAmount += parseFloat(r.total) || 0;
            totalNeto += parseFloat(r.neto) || 0;
            totalVat += parseFloat(r.vat) || 0;
        });

        const today = new Date().toISOString().split('T')[0];

        this.container.innerHTML = `
            <div class="remesa-header">
                <h3>Remesa SEPA</h3>
                <div class="remesa-subtitle">${this.selectedRows.length} invoice${this.selectedRows.length !== 1 ? 's' : ''} selected</div>
            </div>
            <div class="remesa-items">
                ${this.selectedRows.map(r => `
                    <div class="remesa-item">
                        <div>
                            <div class="remesa-item-ref">${escapeHtml(r.referencia)}</div>
                            <div class="remesa-item-activo">${escapeHtml(r.activo)} - ${escapeHtml(r.pagador)}</div>
                        </div>
                        <div class="remesa-item-amount">${formatCurrency(r.total)}</div>
                    </div>
                `).join('')}
            </div>
            <div class="remesa-totals">
                <div class="remesa-totals-row">
                    <span>Neto</span>
                    <span>${formatCurrency(totalNeto)}</span>
                </div>
                <div class="remesa-totals-row">
                    <span>IVA</span>
                    <span>${formatCurrency(totalVat)}</span>
                </div>
                <div class="remesa-totals-row total">
                    <span>Total</span>
                    <span>${formatCurrency(totalAmount)}</span>
                </div>
            </div>
            <div class="remesa-actions">
                <div class="remesa-form-group">
                    <label>Collection date</label>
                    <input type="date" class="remesa-fecha" value="${today}">
                </div>
                <div class="remesa-form-group">
                    <label>Presenter (Creditor)</label>
                    <input type="text" class="remesa-presentador-nombre" placeholder="Creditor name" value="PROPLIA LTD">
                </div>
                <div class="remesa-form-group">
                    <label>Creditor ID</label>
                    <input type="text" class="remesa-presentador-creditor-id" placeholder="B46454591" value="">
                </div>
                <div class="remesa-form-group">
                    <label>Suffix</label>
                    <input type="text" class="remesa-presentador-sufijo" placeholder="000" value="">
                </div>
                <div class="remesa-form-group">
                    <label>Receiver IBAN</label>
                    <input type="text" class="remesa-receptor-iban" placeholder="GB00 0000 0000 0000 0000 00" value="">
                </div>
                <div class="remesa-form-group">
                    <label>SWIFT/BIC</label>
                    <input type="text" class="remesa-receptor-swift-bic" placeholder="LOYDGB2L" value="">
                </div>
                <button class="btn btn-primary remesa-create-btn">Create SEPA Batch</button>
            </div>`;

        this.container.querySelector('.remesa-create-btn').addEventListener('click', () => this.createRemesa());
    }

    async createRemesa() {
        const val = (sel) => {
            const el = this.container.querySelector(sel);
            return el ? el.value.trim() : '';
        };

        const fecha = val('.remesa-fecha');
        const presentadorNombre = val('.remesa-presentador-nombre');
        const presentadorCreditorId = val('.remesa-presentador-creditor-id');
        const presentadorSufijo = val('.remesa-presentador-sufijo');
        const receptorIban = val('.remesa-receptor-iban');
        const receptorSwiftBic = val('.remesa-receptor-swift-bic');

        if (!fecha) {
            Toast.show('Enter a collection date', 'error');
            return;
        }
        if (!presentadorNombre) {
            Toast.show('Enter the presenter/creditor name', 'error');
            return;
        }

        const ids = this.selectedRows.map(r => r.id);
        const fechaCobro = new Date(fecha + 'T00:00:00Z').toISOString();

        try {
            const result = await api.post('/sepa-batches/batch', {
                contabilidad_ids: ids,
                fecha_cobro: fechaCobro,
                presentador_nombre: presentadorNombre,
                presentador_creditor_id: presentadorCreditorId || null,
                presentador_sufijo: presentadorSufijo || null,
                receptor_nombre: presentadorNombre,
                receptor_iban: receptorIban || null,
                receptor_swift_bic: receptorSwiftBic || null,
                receptor_sufijo: presentadorSufijo || null,
                receptor_creditor_id: presentadorCreditorId || null,
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

Object.assign(AdminApp, { RemesaBuilder });

})(window.AdminApp);
