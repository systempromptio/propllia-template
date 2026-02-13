(function(AdminApp) {

function initEntityPage(configKey, container, overrides) {
    const config = { ...AdminApp.ENTITY_CONFIGS[configKey], ...overrides };
    if (!config.entity) {
        const el = typeof container === 'string' ? document.querySelector(container) : container;
        if (el) el.innerHTML = '<div class="empty-state">Configuration not found for this page.</div>';
        return;
    }

    AdminApp.Toast.init();
    const historyPanel = new AdminApp.HistoryPanel();

    let formPanel = null;
    if (config.formFields && !(config.tableOptions && config.tableOptions.readOnly)) {
        formPanel = new AdminApp.FormPanel({
            title: config.title,
            fields: config.formFields,
            hiddenFields: config.hiddenFields,
            onSubmit: async (data, isEdit, original) => {
                try {
                    if (config.onSubmitTransform) {
                        data = config.onSubmitTransform(data, isEdit);
                    }
                    if (isEdit) {
                        await AdminApp.api.put(`${config.apiPath}/${original.id}`, data);
                        AdminApp.Toast.show(`${config.title} updated`);
                    } else {
                        await AdminApp.api.post(config.apiPath, data);
                        AdminApp.Toast.show(`${config.title} created`);
                    }
                    table.load();
                } catch (e) {
                    AdminApp.Toast.show(e.message, 'error');
                }
            }
        });
    }

    const tableConfig = {
        entity: config.entity,
        apiPath: config.apiPath,
        exportPath: config.exportPath,
        columns: config.columns,
        filters: config.filters,
        ...config.tableOptions,
        onRowClick: (row) => {
            if (config.detailEntity) {
                AdminApp.navigateTo(config.detailEntity, row.id);
            }
        },
        onAction: async (action, row) => {
            if (action === 'create' && formPanel) formPanel.open();
            if (action === 'edit' && formPanel) formPanel.open(row);
            if (action === 'history') historyPanel.open(config.historyEntity || config.entity, row.id);
            if (action === 'gallery' && AdminApp.PropertyPresentation) {
                AdminApp.PropertyPresentation.open(row.id);
            }
            if (action === 'pdf') {
                fetch(`${AdminApp.API_BASE}/invoices/${row.id}/pdf`)
                    .then(res => {
                        if (!res.ok) throw new Error('PDF download failed');
                        const ct = res.headers.get('content-type') || '';
                        if (ct.includes('application/pdf')) return res.blob();
                        return null;
                    })
                    .then(blob => {
                        if (!blob) return;
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `invoice-${row.reference || row.id}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    })
                    .catch(e => AdminApp.Toast.show(e.message, 'error'));
            }
            if (action === 'delete') {
                const msg = config.deleteConfirm
                    ? config.deleteConfirm(row)
                    : `Delete this record? This action cannot be undone.`;
                const ok = await AdminApp.confirmAction(`Delete ${config.title}`, msg);
                if (ok) {
                    try {
                        await AdminApp.api.del(`${config.apiPath}/${row.id}`);
                        AdminApp.Toast.show(`${config.title} deleted`);
                        table.load();
                    } catch (e) { AdminApp.Toast.show(e.message, 'error'); }
                }
            }
            if (config.onAction) config.onAction(action, row, { table, formPanel, historyPanel });
        }
    };

    if (overrides && overrides.onSelectionChange) {
        tableConfig.onSelectionChange = overrides.onSelectionChange;
    }
    if (overrides && overrides.onDataLoaded) {
        tableConfig.onDataLoaded = overrides.onDataLoaded;
    }

    const table = new AdminApp.DataTable(container, tableConfig);

    if (overrides && overrides.afterInit) {
        overrides.afterInit({ table, formPanel, historyPanel });
    }

    return { table, formPanel, historyPanel };
}

Object.assign(AdminApp, { initEntityPage });

})(window.AdminApp);
