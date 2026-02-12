-- =============================================
-- Property Management Admin Tables
-- =============================================

-- Properties
CREATE TABLE IF NOT EXISTS admin_properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_name TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    contract_ref TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Available',
    rent NUMERIC(10,2) NOT NULL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    tags TEXT[] DEFAULT '{}',
    image_folder TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_properties_status ON admin_properties(status);
CREATE INDEX IF NOT EXISTS idx_admin_properties_created ON admin_properties(created_at DESC);

-- Tenants
CREATE TABLE IF NOT EXISTS admin_tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tax_id TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    bank_account TEXT NOT NULL DEFAULT '',
    property_name TEXT NOT NULL DEFAULT '',
    property_address TEXT NOT NULL DEFAULT '',
    is_legacy BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_tenants_name ON admin_tenants(name);

-- Owners
CREATE TABLE IF NOT EXISTS admin_owners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tax_id TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    bank_account TEXT NOT NULL DEFAULT '',
    property_name TEXT NOT NULL DEFAULT '',
    property_address TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_owners_name ON admin_owners(name);

-- Contracts
CREATE TABLE IF NOT EXISTS admin_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_ref TEXT NOT NULL,
    property_name TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    tenant_name TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Active',
    rent NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_value NUMERIC(10,2) NOT NULL DEFAULT 0,
    start_date DATE,
    end_date DATE,
    tags TEXT[] DEFAULT '{}',
    doc_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_contracts_status ON admin_contracts(status);

-- Invoices / Accounting
CREATE TABLE IF NOT EXISTS admin_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    contract_ref TEXT NOT NULL DEFAULT '',
    property_name TEXT NOT NULL DEFAULT '',
    payer TEXT NOT NULL DEFAULT '',
    payee TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Unpaid',
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    paid NUMERIC(10,2) NOT NULL DEFAULT 0,
    vat NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'GBP',
    invoice_date DATE,
    payment_date DATE,
    type TEXT NOT NULL DEFAULT 'income',
    expense_category TEXT,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_invoices_status ON admin_invoices(status);
CREATE INDEX IF NOT EXISTS idx_admin_invoices_type ON admin_invoices(type);
CREATE INDEX IF NOT EXISTS idx_admin_invoices_date ON admin_invoices(invoice_date DESC);

-- Security Deposits
CREATE TABLE IF NOT EXISTS admin_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deposit_date DATE,
    payment_date DATE,
    refund_date DATE,
    property_name TEXT NOT NULL DEFAULT '',
    contract_ref TEXT NOT NULL DEFAULT '',
    payer TEXT NOT NULL DEFAULT '',
    payee TEXT NOT NULL DEFAULT '',
    deposit_type TEXT NOT NULL DEFAULT 'Bond',
    status TEXT NOT NULL DEFAULT 'Pending',
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    paid NUMERIC(10,2) NOT NULL DEFAULT 0,
    refunded NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_deposits_status ON admin_deposits(status);

-- SEPA Payment Batches
CREATE TABLE IF NOT EXISTS admin_sepa_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id TEXT NOT NULL DEFAULT '',
    collection_date DATE,
    creditor TEXT NOT NULL DEFAULT '',
    creditor_iban TEXT NOT NULL DEFAULT '',
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'GBP',
    debtor TEXT NOT NULL DEFAULT '',
    debtor_iban TEXT NOT NULL DEFAULT '',
    mandate_id TEXT NOT NULL DEFAULT '',
    reference TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_sepa_batches_batch ON admin_sepa_batches(batch_id);

-- Maintenance Issues
CREATE TABLE IF NOT EXISTS admin_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_name TEXT NOT NULL DEFAULT '',
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Open',
    cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_issues_status ON admin_issues(status);
CREATE INDEX IF NOT EXISTS idx_admin_issues_priority ON admin_issues(priority);

-- Audit Log
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_audit_entity ON admin_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_created ON admin_audit_log(created_at DESC);

-- Insurance Policies
CREATE TABLE IF NOT EXISTS admin_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_name TEXT NOT NULL DEFAULT '',
    insurance_type TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    policy_number TEXT NOT NULL DEFAULT '',
    start_date DATE,
    end_date DATE,
    premium NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'Active',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_insurance_status ON admin_insurance(status);

-- Alerts
CREATE TABLE IF NOT EXISTS admin_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL DEFAULT '',
    entity_type TEXT NOT NULL DEFAULT '',
    entity_id UUID,
    title TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'Active',
    priority TEXT NOT NULL DEFAULT 'Medium',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_status ON admin_alerts(status);

-- Contacts
CREATE TABLE IF NOT EXISTS admin_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tax_id TEXT NOT NULL DEFAULT '',
    iban TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    contact_type TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_contacts_name ON admin_contacts(name);

-- Leads
CREATE TABLE IF NOT EXISTS admin_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    company TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'New',
    interest_type TEXT NOT NULL DEFAULT '',
    property_name TEXT NOT NULL DEFAULT '',
    budget_min NUMERIC(10,2),
    budget_max NUMERIC(10,2),
    min_bedrooms INTEGER,
    min_sqm NUMERIC(10,2),
    preferred_area TEXT NOT NULL DEFAULT '',
    contact_date DATE,
    follow_up_date DATE,
    assigned_to TEXT NOT NULL DEFAULT '',
    score INTEGER NOT NULL DEFAULT 0,
    notes TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_leads_status ON admin_leads(status);

-- Lead Notes
CREATE TABLE IF NOT EXISTS admin_lead_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES admin_leads(id) ON DELETE CASCADE,
    content TEXT NOT NULL DEFAULT '',
    author TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_lead_notes_lead ON admin_lead_notes(lead_id);

-- Table labels
COMMENT ON TABLE admin_properties IS 'Properties and real estate assets';
COMMENT ON TABLE admin_tenants IS 'Tenants renting properties';
COMMENT ON TABLE admin_owners IS 'Property owners';
COMMENT ON TABLE admin_contracts IS 'Rental contracts between owners and tenants';
COMMENT ON TABLE admin_invoices IS 'Invoices and accounting records';
COMMENT ON TABLE admin_deposits IS 'Security deposits for rental contracts';
COMMENT ON TABLE admin_sepa_batches IS 'SEPA direct debit payment batches';
COMMENT ON TABLE admin_issues IS 'Maintenance issues and incident reports';
COMMENT ON TABLE admin_audit_log IS 'Audit trail of all entity changes';
COMMENT ON TABLE admin_insurance IS 'Insurance policies for properties';
COMMENT ON TABLE admin_alerts IS 'System alerts and notifications';
COMMENT ON TABLE admin_contacts IS 'External contacts (suppliers, contractors, etc.)';
COMMENT ON TABLE admin_leads IS 'Prospective tenant and buyer leads';
COMMENT ON TABLE admin_lead_notes IS 'Notes and follow-ups on leads';
