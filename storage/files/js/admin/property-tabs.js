(function(AdminApp) {

const { api, Toast, DataTable, FormPanel } = AdminApp;

function initContractsTab(container, property) {
    const propertyName = property.property_name;
    return new DataTable(container, {
        entity: 'contract',
        apiPath: '/contracts',
        defaultFilters: { property_name: propertyName },
        columns: [
            { key: 'contract_ref', label: 'Contract' },
            { key: 'tenant_name', label: 'Tenant' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'rent', label: 'Rent', type: 'currency' },
            { key: 'start_date', label: 'Start', type: 'date' },
            { key: 'end_date', label: 'End', type: 'date' },
        ],
        onAction: async (action, row) => {
            if (action === 'create') {
                const fp = new FormPanel({
                    title: 'Contract',
                    fields: [
                        { key: 'contract_ref', label: 'Contract ref', required: true },
                        { key: 'property_name', label: 'Property', required: true },
                        { key: 'tenant_name', label: 'Tenant', required: true },
                        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Pending', 'Ended', 'Suspended'], default: 'Active' },
                        { key: 'rent', label: 'Rent', type: 'number' },
                        { key: 'start_date', label: 'Start', type: 'date' },
                        { key: 'end_date', label: 'End', type: 'date' },
                    ],
                    onSubmit: async (data) => {
                        await api.post('/contracts', data);
                        Toast.show('Contract created');
                    }
                });
                fp.open({ property_name: propertyName });
            }
            if (action === 'edit') {
                const fp = new FormPanel({
                    title: 'Contract',
                    fields: [
                        { key: 'contract_ref', label: 'Contract ref', required: true },
                        { key: 'property_name', label: 'Property', required: true },
                        { key: 'tenant_name', label: 'Tenant', required: true },
                        { key: 'status', label: 'Status', type: 'select', options: ['Active', 'Pending', 'Ended', 'Suspended'], default: 'Active' },
                        { key: 'rent', label: 'Rent', type: 'number' },
                        { key: 'start_date', label: 'Start', type: 'date' },
                        { key: 'end_date', label: 'End', type: 'date' },
                    ],
                    onSubmit: async (data, isEdit, original) => {
                        await api.put(`/contracts/${original.id}`, data);
                        Toast.show('Contract updated');
                    }
                });
                fp.open(row);
            }
        },
        onRowClick: (row) => {
            window.location.href = AdminApp.detailUrl('contract', row.id);
        }
    });
}

function initRentalsTab(container, property) {
    const propertyName = property.property_name;
    const propertyId = property.id;
    const rentalTable = new DataTable(container, {
        entity: 'billing',
        apiPath: '/invoices',
        showPeriodFilter: true,
        defaultFilters: { type: 'income', property_name: propertyName, property_id: propertyId },
        columns: [
            { key: 'reference', label: 'Ref' },
            { key: 'description', label: 'Description' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'total', label: 'Total', type: 'currency' },
            { key: 'paid', label: 'Paid', type: 'currency' },
            { key: 'invoice_date', label: 'Date', type: 'date' },
        ],
        filters: [
            { key: 'status', label: 'Status', options: ['Unpaid', 'Partial', 'Paid'] },
        ],
        onRowClick: (row) => {
            window.location.href = AdminApp.detailUrl('invoice', row.id);
        },
        onAction: async (action, row) => {
            if (action === 'create') {
                const fp = new FormPanel({
                    title: 'New Invoice (Rental)',
                    fields: [
                        { key: 'reference', label: 'Reference', required: true },
                        { key: 'description', label: 'Description', required: true },
                        { key: 'contract_ref', label: 'Contract', required: true },
                        { key: 'property_name', label: 'Property', required: true },
                        { key: 'payer', label: 'Payer', required: true },
                        { key: 'payee', label: 'Payee', required: true },
                        { key: 'total', label: 'Total', type: 'number', required: true },
                        { key: 'paid', label: 'Paid', type: 'number' },
                        { key: 'invoice_date', label: 'Date', type: 'date', required: true },
                        { key: 'status', label: 'Status', type: 'select', options: ['Unpaid', 'Partial', 'Paid'], default: 'Unpaid' },
                    ],
                    hiddenFields: { type: 'income' },
                    onSubmit: async (data) => {
                        await api.post('/invoices', data);
                        Toast.show('Invoice created');
                        rentalTable.load();
                    }
                });
                fp.open({ property_name: propertyName, contract_ref: property.contract_ref || '' });
            }
            if (action === 'edit') {
                const fp = new FormPanel({
                    title: 'Invoice',
                    fields: [
                        { key: 'reference', label: 'Reference', required: true },
                        { key: 'description', label: 'Description', required: true },
                        { key: 'total', label: 'Total', type: 'number', required: true },
                        { key: 'paid', label: 'Paid', type: 'number' },
                        { key: 'invoice_date', label: 'Date', required: true },
                        { key: 'status', label: 'Status', type: 'select', options: ['Auto', 'Unpaid', 'Partial', 'Paid'] },
                    ],
                    onSubmit: async (data, isEdit, original) => {
                        if (data.status === 'Auto') delete data.status;
                        await api.put(`/invoices/${original.id}`, data);
                        Toast.show('Invoice updated');
                        rentalTable.load();
                    }
                });
                fp.open(row);
            }
        }
    });
    return rentalTable;
}

function initExpensesTab(container, property) {
    const { property_name: propertyName, id: propertyId } = property;
    const expensesTable = new DataTable(container, {
        entity: 'expenses',
        apiPath: '/invoices',
        showPeriodFilter: true,
        defaultFilters: { type: 'expense', property_name: propertyName, property_id: propertyId },
        columns: [
            { key: 'reference', label: 'Ref' },
            { key: 'description', label: 'Description' },
            { key: 'expense_category', label: 'Category' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'total', label: 'Total', type: 'currency' },
            { key: 'paid', label: 'Paid', type: 'currency' },
            { key: 'invoice_date', label: 'Date', type: 'date' },
        ],
        filters: [
            { key: 'expense_category', label: 'Category', options: ['Council Tax', 'Insurance', 'Waste', 'Service Charge', 'Repairs', 'Utilities', 'Management', 'Legal', 'Tax', 'Other'] },
            { key: 'status', label: 'Status', options: ['Unpaid', 'Partial', 'Paid'] },
        ],
        onRowClick: (row) => {
            window.location.href = AdminApp.detailUrl('invoice', row.id);
        },
        onAction: async (action, row) => {
            if (action === 'create') {
                const fp = new FormPanel({
                    title: 'New Expense',
                    fields: [
                        { key: 'reference', label: 'Reference', required: true },
                        { key: 'description', label: 'Description', required: true },
                        { key: 'contract_ref', label: 'Contract' },
                        { key: 'property_name', label: 'Property', required: true },
                        { key: 'payer', label: 'Payer', required: true },
                        { key: 'payee', label: 'Payee', required: true },
                        { key: 'expense_category', label: 'Category', type: 'select', options: ['Council Tax', 'Insurance', 'Waste', 'Service Charge', 'Repairs', 'Utilities', 'Management', 'Legal', 'Tax', 'Other'] },
                        { key: 'total', label: 'Total', type: 'number', required: true },
                        { key: 'paid', label: 'Paid', type: 'number' },
                        { key: 'invoice_date', label: 'Date', type: 'date', required: true },
                        { key: 'status', label: 'Status', type: 'select', options: ['Unpaid', 'Partial', 'Paid'], default: 'Unpaid' },
                    ],
                    hiddenFields: { type: 'expense' },
                    onSubmit: async (data) => {
                        await api.post('/invoices', data);
                        Toast.show('Expense created');
                        expensesTable.load();
                    }
                });
                fp.open({ property_name: propertyName, contract_ref: property.contract_ref || '' });
            }
            if (action === 'edit') {
                const fp = new FormPanel({
                    title: 'Expense',
                    fields: [
                        { key: 'reference', label: 'Reference', required: true },
                        { key: 'description', label: 'Description', required: true },
                        { key: 'expense_category', label: 'Category', type: 'select', options: ['Council Tax', 'Insurance', 'Waste', 'Service Charge', 'Repairs', 'Utilities', 'Management', 'Legal', 'Tax', 'Other'] },
                        { key: 'total', label: 'Total', type: 'number', required: true },
                        { key: 'paid', label: 'Paid', type: 'number' },
                        { key: 'invoice_date', label: 'Date', required: true },
                        { key: 'status', label: 'Status', type: 'select', options: ['Auto', 'Unpaid', 'Partial', 'Paid'] },
                    ],
                    hiddenFields: { type: 'expense' },
                    onSubmit: async (data, isEdit, original) => {
                        if (data.status === 'Auto') delete data.status;
                        await api.put(`/invoices/${original.id}`, data);
                        Toast.show('Expense updated');
                        expensesTable.load();
                    }
                });
                fp.open(row);
            }
        }
    });
    return expensesTable;
}

function initIssuesTab(container, property) {
    const propertyName = property.property_name;
    return new DataTable(container, {
        entity: 'issue',
        apiPath: '/issues',
        defaultFilters: { property_name: propertyName },
        columns: [
            { key: 'title', label: 'Title' },
            { key: 'priority', label: 'Priority', type: 'status' },
            { key: 'status', label: 'Status', type: 'status' },
            { key: 'cost', label: 'Cost', type: 'currency' },
            { key: 'created_at', label: 'Created', type: 'date' },
        ],
        filters: [
            { key: 'status', label: 'Status', options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
            { key: 'priority', label: 'Priority', options: ['High', 'Medium', 'Low'] },
        ],
        onRowClick: (row) => {
            window.location.href = AdminApp.detailUrl('issue', row.id);
        },
        onAction: async (action, row) => {
            if (action === 'create') {
                const fp = new FormPanel({
                    title: 'Issue',
                    fields: [
                        { key: 'property_name', label: 'Property', required: true },
                        { key: 'title', label: 'Title', required: true },
                        { key: 'description', label: 'Description', type: 'textarea' },
                        { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'], default: 'Medium' },
                        { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
                        { key: 'cost', label: 'Cost', type: 'number' },
                    ],
                    onSubmit: async (data) => {
                        await api.post('/issues', data);
                        Toast.show('Issue created');
                    }
                });
                fp.open({ property_name: propertyName });
            }
            if (action === 'edit') {
                const fp = new FormPanel({
                    title: 'Issue',
                    fields: [
                        { key: 'property_name', label: 'Property', required: true },
                        { key: 'title', label: 'Title', required: true },
                        { key: 'description', label: 'Description', type: 'textarea' },
                        { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
                        { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved', 'Closed'] },
                        { key: 'cost', label: 'Cost', type: 'number' },
                    ],
                    onSubmit: async (data, isEdit, original) => {
                        await api.put(`/issues/${original.id}`, data);
                        Toast.show('Issue updated');
                    }
                });
                fp.open(row);
            }
        }
    });
}

function initPropertyTabTable(tabName, container, property) {
    const handlers = { contratos: initContractsTab, alquileres: initRentalsTab, gastos: initExpensesTab, incidencias: initIssuesTab };
    const handler = handlers[tabName];
    if (handler) return handler(container, property);
}

Object.assign(AdminApp, { initPropertyTabTable });

})(window.AdminApp);
