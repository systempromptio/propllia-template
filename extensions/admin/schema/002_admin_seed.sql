-- =============================================
-- Demo Seed Data Function
-- Resets and reloads all admin tables with demo data.
-- Dates are relative to CURRENT_DATE so data stays fresh.
-- Called at migration time and by the hourly reset job.
-- =============================================

CREATE OR REPLACE FUNCTION admin_seed_demo_data() RETURNS void AS $$
BEGIN
    TRUNCATE admin_properties, admin_tenants, admin_owners, admin_contracts,
             admin_invoices, admin_deposits, admin_sepa_batches, admin_issues,
             admin_insurance, admin_alerts, admin_contacts, admin_leads, admin_lead_notes,
             admin_audit_log CASCADE;

    -- =============================================
    -- Properties
    -- =============================================
    INSERT INTO admin_properties (id, property_name, address, contract_ref, status, rent, start_date, end_date, tags, image_folder, created_at, updated_at) VALUES
    ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Flat 3B, 15 King Street', '15 King Street, Flat 3B, London WC2E 8JF', 'KING ST 15 - JOHNSON', 'Let', 1250.00, CURRENT_DATE - INTERVAL '14 months', CURRENT_DATE + INTERVAL '10 months', ARRAY['Residential','Central'], 'king-street-15', NOW() - INTERVAL '18 months', NOW() - INTERVAL '5 days'),
    ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Apartment 2A, 42 Deansgate', '42 Deansgate, Apt 2A, Manchester M3 2EG', 'DEANSGATE 42 - WILLIAMS', 'Let', 1800.00, CURRENT_DATE - INTERVAL '10 months', CURRENT_DATE + INTERVAL '14 months', ARRAY['Residential','Premium'], 'deansgate-42', NOW() - INTERVAL '12 months', NOW() - INTERVAL '3 days'),
    ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Unit 1, 8 Victoria Square', '8 Victoria Square, Ground Floor, Birmingham B1 1BD', '', 'Available', 1400.00, NULL, NULL, ARRAY['Commercial'], 'victoria-sq-8', NOW() - INTERVAL '24 months', NOW() - INTERVAL '15 days'),
    ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'Villa 7, The Crescent', '7 The Crescent, Edinburgh EH3 6PQ', 'CRESCENT 7 - THOMPSON', 'Let', 3200.00, CURRENT_DATE - INTERVAL '18 months', CURRENT_DATE + INTERVAL '6 months', ARRAY['Residential','Premium','Period'], 'crescent-7', NOW() - INTERVAL '20 months', NOW() - INTERVAL '7 days'),
    ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091', 'Studio 1C, 22 Park Row', '22 Park Row, Studio 1C, Bristol BS1 5LY', '', 'Under Renovation', 800.00, NULL, NULL, ARRAY['Residential','Renovation'], 'park-row-22', NOW() - INTERVAL '15 months', NOW() - INTERVAL '2 days'),
    ('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102', 'Flat 4B, 156 Princes Street', '156 Princes Street, Flat 4B, Edinburgh EH2 4BJ', 'PRINCES ST 156 - DAVIES', 'Let', 2100.00, CURRENT_DATE - INTERVAL '8 months', CURRENT_DATE + INTERVAL '16 months', ARRAY['Residential'], 'princes-st-156', NOW() - INTERVAL '10 months', NOW() - INTERVAL '4 days'),
    ('07b8c9d0-e1f2-4a3b-4c5d-6e7f80910213', 'Penthouse, 30 The Embankment', '30 The Embankment, Penthouse, London SE1 7TJ', 'EMBANKMENT 30 - BROWN', 'Let', 2800.00, CURRENT_DATE - INTERVAL '12 months', CURRENT_DATE + INTERVAL '12 months', ARRAY['Residential','Premium','Central'], 'embankment-30', NOW() - INTERVAL '14 months', NOW() - INTERVAL '1 day'),
    ('18c9d0e1-f2a3-4b4c-5d6e-7f8091021324', 'Unit 3, Northern Industrial Estate', 'Northern Industrial Estate, Unit 3, Leeds LS9 8AG', '', 'Available', 2400.00, NULL, NULL, ARRAY['Industrial'], 'northern-industrial-3', NOW() - INTERVAL '22 months', NOW() - INTERVAL '20 days');

    -- =============================================
    -- Tenants
    -- =============================================
    INSERT INTO admin_tenants (id, name, tax_id, email, phone, address, bank_account, property_name, property_address, is_legacy, created_at, updated_at) VALUES
    ('21d0e1f2-a3b4-4c5d-6e7f-809102132435', 'Sarah Johnson', 'UTR 1234567890', 'sarah.johnson@email.co.uk', '+44 20 7946 0123', '15 King Street, Flat 3B, London WC2E 8JF', 'GB29 NWBK 6016 1331 9268 19', 'Flat 3B, 15 King Street', '15 King Street, Flat 3B, London WC2E 8JF', false, NOW() - INTERVAL '14 months', NOW() - INTERVAL '5 days'),
    ('32e1f2a3-b4c5-4d6e-7f80-910213243546', 'James Williams', 'UTR 2345678901', 'james.williams@email.co.uk', '+44 161 496 0234', '42 Deansgate, Apt 2A, Manchester M3 2EG', 'GB82 WEST 1234 5698 7654 32', 'Apartment 2A, 42 Deansgate', '42 Deansgate, Apt 2A, Manchester M3 2EG', false, NOW() - INTERVAL '10 months', NOW() - INTERVAL '3 days'),
    ('43f2a3b4-c5d6-4e7f-8091-021324354657', 'Emma Thompson', 'UTR 3456789012', 'emma.thompson@email.co.uk', '+44 131 496 0345', '7 The Crescent, Edinburgh EH3 6PQ', 'GB15 MIDL 4005 0712 3456 78', 'Villa 7, The Crescent', '7 The Crescent, Edinburgh EH3 6PQ', false, NOW() - INTERVAL '18 months', NOW() - INTERVAL '7 days'),
    ('54a3b4c5-d6e7-4f80-9102-132435465768', 'Oliver Davies', 'UTR 4567890123', 'oliver.davies@email.co.uk', '+44 131 496 0456', '156 Princes Street, Flat 4B, Edinburgh EH2 4BJ', 'GB33 BUKB 2020 5555 5555 55', 'Flat 4B, 156 Princes Street', '156 Princes Street, Flat 4B, Edinburgh EH2 4BJ', false, NOW() - INTERVAL '8 months', NOW() - INTERVAL '4 days'),
    ('65b4c5d6-e7f8-4091-0213-243546576879', 'Charlotte Brown', 'UTR 5678901234', 'charlotte.brown@email.co.uk', '+44 20 7946 0567', '30 The Embankment, Penthouse, London SE1 7TJ', 'GB09 HAFC 0012 3456 7890 12', 'Penthouse, 30 The Embankment', '30 The Embankment, Penthouse, London SE1 7TJ', false, NOW() - INTERVAL '12 months', NOW() - INTERVAL '1 day'),
    ('76c5d6e7-f809-4102-1324-35465768798a', 'William Taylor', 'UTR 6789012345', 'william.taylor@email.co.uk', '+44 20 7946 0678', '88 Baker Street, Flat 2A, London W1U 6TL', 'GB42 LOYD 3099 1200 0012 34', '', '', true, NOW() - INTERVAL '24 months', NOW() - INTERVAL '6 months');

    -- =============================================
    -- Owners
    -- =============================================
    INSERT INTO admin_owners (id, name, tax_id, email, phone, address, bank_account, property_name, property_address, created_at, updated_at) VALUES
    ('87d6e7f8-0910-4213-2435-46576879809b', 'Horizon Properties Ltd', 'UTR 9876543210', 'admin@horizon-properties.co.uk', '+44 20 7946 1234', '50 Grosvenor Square, London W1K 2HZ', 'GB29 NWBK 6016 1331 9268 19', 'Flat 3B, 15 King Street / Penthouse, 30 The Embankment', 'London', NOW() - INTERVAL '24 months', NOW() - INTERVAL '10 days'),
    ('98e7f809-1021-4324-3546-5768798a90ac', 'Margaret Wilson', 'UTR 1122334455', 'margaret.wilson@email.co.uk', '+44 161 496 1234', '120 Portland Street, Manchester M1 4WD', 'GB82 WEST 1234 5698 7654 32', 'Apartment 2A, 42 Deansgate / Flat 4B, 156 Princes Street', 'Manchester / Edinburgh', NOW() - INTERVAL '18 months', NOW() - INTERVAL '8 days'),
    ('a9f80910-2132-4435-4657-68798a9bacbd', 'Crown Investments plc', 'UTR 5544332211', 'contact@crown-investments.co.uk', '+44 121 496 1234', '22 Colmore Row, Birmingham B3 2DA', 'GB15 MIDL 4005 0712 3456 78', 'Unit 1, 8 Victoria Square / Villa 7, The Crescent / Unit 3, Northern Industrial Estate', 'Birmingham / Edinburgh / Leeds', NOW() - INTERVAL '24 months', NOW() - INTERVAL '15 days'),
    ('ba091021-3243-4546-5768-798a9bacbdce', 'Robert Harris', 'UTR 2233445566', 'robert.harris@email.co.uk', '+44 117 496 1234', '90 Queen Square, Bristol BS1 4LH', 'GB33 BUKB 2020 5555 5555 55', 'Studio 1C, 22 Park Row', 'Bristol', NOW() - INTERVAL '15 months', NOW() - INTERVAL '12 days'),
    ('cb1a2b3c-4d5e-4f60-7182-93a4b5c6d7e8', 'Northern Estates Group Ltd', 'UTR 3344556677', 'info@northern-estates.co.uk', '+44 113 496 1234', '18 Park Lane, Leeds LS1 1LF', 'GB76 LOYD 3099 1200 0056 78', 'Unit 3, Northern Industrial Estate', 'Leeds', NOW() - INTERVAL '20 months', NOW() - INTERVAL '6 days'),
    ('dc2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9', 'Patricia Campbell', 'UTR 4455667788', 'patricia.campbell@email.co.uk', '+44 121 496 5678', '5 Hagley Road, Birmingham B16 8SG', 'GB09 HAFC 0012 3456 7890 12', 'Unit 1, 8 Victoria Square', 'Birmingham', NOW() - INTERVAL '12 months', NOW() - INTERVAL '9 days');

    -- =============================================
    -- Contracts
    -- =============================================
    INSERT INTO admin_contracts (id, contract_ref, property_name, address, tenant_name, status, rent, total_value, start_date, end_date, tags, doc_count, created_at, updated_at) VALUES
    ('cb102132-4354-4657-6879-8a9bacbdcedf', 'KING ST 15 - JOHNSON', 'Flat 3B, 15 King Street', '15 King Street, Flat 3B, London WC2E 8JF', 'Sarah Johnson', 'Active', 1250.00, 15000.00, CURRENT_DATE - INTERVAL '14 months', CURRENT_DATE + INTERVAL '10 months', ARRAY['Residential','Annual'], 2, NOW() - INTERVAL '14 months', NOW() - INTERVAL '5 days'),
    ('dc213243-5465-4768-798a-9bacbdcedfe0', 'DEANSGATE 42 - WILLIAMS', 'Apartment 2A, 42 Deansgate', '42 Deansgate, Apt 2A, Manchester M3 2EG', 'James Williams', 'Active', 1800.00, 21600.00, CURRENT_DATE - INTERVAL '10 months', CURRENT_DATE + INTERVAL '14 months', ARRAY['Residential','Annual'], 1, NOW() - INTERVAL '10 months', NOW() - INTERVAL '3 days'),
    ('ed324354-6576-4879-8a9b-acbdcedfe0f1', 'CRESCENT 7 - THOMPSON', 'Villa 7, The Crescent', '7 The Crescent, Edinburgh EH3 6PQ', 'Emma Thompson', 'Active', 3200.00, 38400.00, CURRENT_DATE - INTERVAL '18 months', CURRENT_DATE + INTERVAL '6 months', ARRAY['Residential','Annual','Premium'], 3, NOW() - INTERVAL '18 months', NOW() - INTERVAL '7 days'),
    ('fe435465-7687-4980-9bac-bdcedfe0f102', 'PRINCES ST 156 - DAVIES', 'Flat 4B, 156 Princes Street', '156 Princes Street, Flat 4B, Edinburgh EH2 4BJ', 'Oliver Davies', 'Active', 2100.00, 25200.00, CURRENT_DATE - INTERVAL '8 months', CURRENT_DATE + INTERVAL '16 months', ARRAY['Residential','Annual'], 1, NOW() - INTERVAL '8 months', NOW() - INTERVAL '4 days'),
    ('0f546576-8798-4a91-acbd-cedfe0f10213', 'EMBANKMENT 30 - BROWN', 'Penthouse, 30 The Embankment', '30 The Embankment, Penthouse, London SE1 7TJ', 'Charlotte Brown', 'Active', 2800.00, 33600.00, CURRENT_DATE - INTERVAL '12 months', CURRENT_DATE + INTERVAL '12 months', ARRAY['Residential','Annual','Premium'], 2, NOW() - INTERVAL '12 months', NOW() - INTERVAL '1 day'),
    ('1a657687-9809-4ba2-bcde-f0f102132435', 'VICTORIA SQ 8 - MITCHELL', 'Unit 1, 8 Victoria Square', '8 Victoria Square, Ground Floor, Birmingham B1 1BD', 'David Mitchell', 'Active', 2400.00, 28800.00, CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '18 months', ARRAY['Commercial','Annual'], 1, NOW() - INTERVAL '6 months', NOW() - INTERVAL '10 days'),
    ('2b768798-a910-4cb3-cdef-010213243546', 'PARK ROW 22 - WALKER', 'Studio 1C, 22 Park Row', '22 Park Row, Studio 1C, Bristol BS1 5LY', 'Lucy Walker', 'Pending', 800.00, 9600.00, CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months', ARRAY['Residential','Annual'], 1, NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 days');

    -- =============================================
    -- Invoices
    -- =============================================
    INSERT INTO admin_invoices (id, reference, description, contract_ref, property_name, payer, payee, status, amount, paid, vat, currency, invoice_date, payment_date, type, expense_category, notes, created_at, updated_at) VALUES
    -- Month -1 rent invoices
    ('10000001-0000-4000-8000-000000000001', 'INV-2024-001', 'Monthly rent - 15 King Street', 'KING ST 15 - JOHNSON', 'Flat 3B, 15 King Street', 'Sarah Johnson', 'Horizon Properties Ltd', 'Paid', 1250.00, 1250.00, 0, 'GBP', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE - INTERVAL '25 days', 'income', NULL, '', NOW() - INTERVAL '1 month', NOW() - INTERVAL '25 days'),
    ('10000001-0000-4000-8000-000000000002', 'INV-2024-002', 'Monthly rent - 42 Deansgate', 'DEANSGATE 42 - WILLIAMS', 'Apartment 2A, 42 Deansgate', 'James Williams', 'Margaret Wilson', 'Paid', 1800.00, 1800.00, 0, 'GBP', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE - INTERVAL '28 days', 'income', NULL, '', NOW() - INTERVAL '1 month', NOW() - INTERVAL '28 days'),
    ('10000001-0000-4000-8000-000000000003', 'INV-2024-003', 'Monthly rent - The Crescent', 'CRESCENT 7 - THOMPSON', 'Villa 7, The Crescent', 'Emma Thompson', 'Crown Investments plc', 'Paid', 3200.00, 3200.00, 0, 'GBP', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE - INTERVAL '26 days', 'income', NULL, '', NOW() - INTERVAL '1 month', NOW() - INTERVAL '26 days'),
    ('10000001-0000-4000-8000-000000000004', 'INV-2024-004', 'Monthly rent - 156 Princes Street', 'PRINCES ST 156 - DAVIES', 'Flat 4B, 156 Princes Street', 'Oliver Davies', 'Margaret Wilson', 'Paid', 2100.00, 2100.00, 0, 'GBP', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE - INTERVAL '24 days', 'income', NULL, '', NOW() - INTERVAL '1 month', NOW() - INTERVAL '24 days'),
    ('10000001-0000-4000-8000-000000000005', 'INV-2024-005', 'Monthly rent - 30 The Embankment', 'EMBANKMENT 30 - BROWN', 'Penthouse, 30 The Embankment', 'Charlotte Brown', 'Horizon Properties Ltd', 'Paid', 2800.00, 2800.00, 0, 'GBP', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE - INTERVAL '27 days', 'income', NULL, '', NOW() - INTERVAL '1 month', NOW() - INTERVAL '27 days'),
    -- Current month rent invoices
    ('10000001-0000-4000-8000-000000000006', 'INV-2024-006', 'Monthly rent - 15 King Street', 'KING ST 15 - JOHNSON', 'Flat 3B, 15 King Street', 'Sarah Johnson', 'Horizon Properties Ltd', 'Paid', 1250.00, 1250.00, 0, 'GBP', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '3 days', 'income', NULL, '', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
    ('10000001-0000-4000-8000-000000000007', 'INV-2024-007', 'Monthly rent - 42 Deansgate', 'DEANSGATE 42 - WILLIAMS', 'Apartment 2A, 42 Deansgate', 'James Williams', 'Margaret Wilson', 'Partial', 1800.00, 900.00, 0, 'GBP', CURRENT_DATE - INTERVAL '5 days', NULL, 'income', NULL, 'Partial payment received, awaiting remainder', NOW() - INTERVAL '5 days', NOW() - INTERVAL '2 days'),
    ('10000001-0000-4000-8000-000000000008', 'INV-2024-008', 'Monthly rent - The Crescent', 'CRESCENT 7 - THOMPSON', 'Villa 7, The Crescent', 'Emma Thompson', 'Crown Investments plc', 'Paid', 3200.00, 3200.00, 0, 'GBP', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '4 days', 'income', NULL, '', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
    ('10000001-0000-4000-8000-000000000009', 'INV-2024-009', 'Monthly rent - 156 Princes Street', 'PRINCES ST 156 - DAVIES', 'Flat 4B, 156 Princes Street', 'Oliver Davies', 'Margaret Wilson', 'Unpaid', 2100.00, 0, 0, 'GBP', CURRENT_DATE - INTERVAL '5 days', NULL, 'income', NULL, 'Payment pending', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    ('10000001-0000-4000-8000-000000000010', 'INV-2024-010', 'Monthly rent - 30 The Embankment', 'EMBANKMENT 30 - BROWN', 'Penthouse, 30 The Embankment', 'Charlotte Brown', 'Horizon Properties Ltd', 'Paid', 2800.00, 2800.00, 0, 'GBP', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '4 days', 'income', NULL, '', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
    -- Month -2 invoices
    ('10000001-0000-4000-8000-000000000011', 'INV-2024-011', 'Monthly rent - 156 Princes Street', 'PRINCES ST 156 - DAVIES', 'Flat 4B, 156 Princes Street', 'Oliver Davies', 'Margaret Wilson', 'Partial', 2100.00, 1050.00, 0, 'GBP', CURRENT_DATE - INTERVAL '2 months', NULL, 'income', NULL, 'Partial payment - outstanding for 2 months', NOW() - INTERVAL '2 months', NOW() - INTERVAL '1 month'),
    ('10000001-0000-4000-8000-000000000012', 'INV-2024-012', 'Monthly rent - 30 The Embankment', 'EMBANKMENT 30 - BROWN', 'Penthouse, 30 The Embankment', 'Charlotte Brown', 'Horizon Properties Ltd', 'Paid', 2800.00, 2800.00, 0, 'GBP', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE - INTERVAL '2 months', 'income', NULL, '', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
    -- Expense invoices
    ('10000001-0000-4000-8000-000000000013', 'EXP-2024-001', 'Council tax - 15 King Street', '', 'Flat 3B, 15 King Street', 'Horizon Properties Ltd', 'London Borough Council', 'Paid', 680.00, 680.00, 0, 'GBP', CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE - INTERVAL '2 months', 'expense', 'Council Tax', 'Annual council tax 2024', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
    ('10000001-0000-4000-8000-000000000014', 'EXP-2024-002', 'Service charge Q1 - 42 Deansgate', '', 'Apartment 2A, 42 Deansgate', 'Margaret Wilson', 'Deansgate Management Co', 'Paid', 480.00, 480.00, 0, 'GBP', CURRENT_DATE - INTERVAL '1 month', CURRENT_DATE - INTERVAL '1 month', 'expense', 'Service Charge', 'Quarterly service charge', NOW() - INTERVAL '1 month', NOW() - INTERVAL '1 month'),
    ('10000001-0000-4000-8000-000000000015', 'EXP-2024-003', 'Buildings insurance - The Crescent', '', 'Villa 7, The Crescent', 'Crown Investments plc', 'Aviva Insurance', 'Unpaid', 750.00, 0, 157.50, 'GBP', CURRENT_DATE - INTERVAL '10 days', NULL, 'expense', 'Insurance', 'Annual buildings insurance policy', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days');

    -- =============================================
    -- Deposits
    -- =============================================
    INSERT INTO admin_deposits (id, deposit_date, payment_date, refund_date, property_name, contract_ref, payer, payee, deposit_type, status, amount, paid, refunded, created_at, updated_at) VALUES
    ('105a6b7c-8d9e-4f01-a2b3-c4d5e6f70819', CURRENT_DATE - INTERVAL '14 months', CURRENT_DATE - INTERVAL '14 months', NULL, 'Flat 3B, 15 King Street', 'KING ST 15 - JOHNSON', 'Sarah Johnson', 'Horizon Properties Ltd', 'Bond', 'Held', 2500.00, 2500.00, 0, NOW() - INTERVAL '14 months', NOW() - INTERVAL '14 months'),
    ('216b7c8d-9e0f-4012-b3c4-d5e6f7081920', CURRENT_DATE - INTERVAL '10 months', CURRENT_DATE - INTERVAL '10 months', NULL, 'Apartment 2A, 42 Deansgate', 'DEANSGATE 42 - WILLIAMS', 'James Williams', 'Margaret Wilson', 'Bond', 'Held', 3600.00, 3600.00, 0, NOW() - INTERVAL '10 months', NOW() - INTERVAL '10 months'),
    ('327c8d9e-0f01-4123-c4d5-e6f708192031', CURRENT_DATE - INTERVAL '18 months', CURRENT_DATE - INTERVAL '18 months', NULL, 'Villa 7, The Crescent', 'CRESCENT 7 - THOMPSON', 'Emma Thompson', 'Crown Investments plc', 'Bond', 'Held', 6400.00, 6400.00, 0, NOW() - INTERVAL '18 months', NOW() - INTERVAL '18 months'),
    ('438d9e0a-1012-4234-d5e6-a70819203142', CURRENT_DATE - INTERVAL '8 months', CURRENT_DATE - INTERVAL '8 months', NULL, 'Flat 4B, 156 Princes Street', 'PRINCES ST 156 - DAVIES', 'Oliver Davies', 'Margaret Wilson', 'Bond', 'Held', 4200.00, 4200.00, 0, NOW() - INTERVAL '8 months', NOW() - INTERVAL '8 months'),
    ('549e0f0b-2123-4345-e6f7-b81920314253', CURRENT_DATE - INTERVAL '12 months', CURRENT_DATE - INTERVAL '12 months', NULL, 'Penthouse, 30 The Embankment', 'EMBANKMENT 30 - BROWN', 'Charlotte Brown', 'Horizon Properties Ltd', 'Bond', 'Held', 5600.00, 5600.00, 0, NOW() - INTERVAL '12 months', NOW() - INTERVAL '12 months'),
    ('65af010c-3234-4456-f708-c92031425364', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE - INTERVAL '6 months', NULL, 'Unit 1, 8 Victoria Square', 'VICTORIA SQ 8 - MITCHELL', 'David Mitchell', 'Patricia Campbell', 'Bond', 'Held', 4800.00, 4800.00, 0, NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months');

    -- =============================================
    -- SEPA Payment Batches
    -- =============================================
    INSERT INTO admin_sepa_batches (id, batch_id, collection_date, creditor, creditor_iban, amount, currency, debtor, debtor_iban, mandate_id, reference, created_at, updated_at) VALUES
    ('438d9e0f-0112-4234-d5e6-f70819203142', 'SEPA-2024-001', CURRENT_DATE - INTERVAL '3 days', 'Horizon Properties Ltd', 'GB29 NWBK 6016 1331 9268 19', 4050.00, 'GBP', 'Sarah Johnson', 'GB09 HAFC 0012 3456 7890 12', 'MAND-2024-001', 'January Rents - Horizon', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),
    ('549e0f01-1223-4345-e6f7-081920314253', 'SEPA-2024-002', CURRENT_DATE - INTERVAL '2 days', 'Margaret Wilson', 'GB82 WEST 1234 5698 7654 32', 3900.00, 'GBP', 'James Williams', 'GB82 WEST 1234 5698 7654 32', 'MAND-2024-002', 'January Rents - Wilson', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days'),
    ('65af0102-a334-4456-a708-192031425364', 'SEPA-2024-003', CURRENT_DATE - INTERVAL '1 day', 'Crown Investments plc', 'GB15 MIDL 4005 0712 3456 78', 3200.00, 'GBP', 'Emma Thompson', 'GB42 LOYD 3099 1200 0012 34', 'MAND-2024-003', 'January Rents - Crown', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
    ('76b01213-b445-4567-b819-203142536475', 'SEPA-2024-004', CURRENT_DATE - INTERVAL '30 days', 'Horizon Properties Ltd', 'GB29 NWBK 6016 1331 9268 19', 4050.00, 'GBP', 'Sarah Johnson', 'GB09 HAFC 0012 3456 7890 12', 'MAND-2024-001', 'December Rents - Horizon', NOW() - INTERVAL '32 days', NOW() - INTERVAL '30 days'),
    ('87c12324-c556-4678-c920-314253647586', 'SEPA-2024-005', CURRENT_DATE - INTERVAL '30 days', 'Margaret Wilson', 'GB82 WEST 1234 5698 7654 32', 3900.00, 'GBP', 'Oliver Davies', 'GB33 BUKB 2020 5555 5555 55', 'MAND-2024-004', 'December Rents - Wilson', NOW() - INTERVAL '33 days', NOW() - INTERVAL '30 days'),
    ('98d23435-d667-4789-d031-425364758697', 'SEPA-2024-006', CURRENT_DATE - INTERVAL '1 day', 'Patricia Campbell', 'GB09 HAFC 0012 3456 7890 12', 2400.00, 'GBP', 'David Mitchell', 'GB76 LOYD 3099 1200 0056 78', 'MAND-2024-005', 'January Rents - Campbell', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day');

    -- =============================================
    -- Issues
    -- =============================================
    INSERT INTO admin_issues (id, property_name, title, description, priority, status, cost, created_at, updated_at) VALUES
    ('65af0102-2334-4456-f708-192031425364', 'Flat 3B, 15 King Street', 'Water leak in bathroom', 'Tenant reports a leak from the basin pipework. Damp visible on adjacent wall. Requires urgent plumber.', 'High', 'Open', 450.00, NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
    ('76b01213-3445-4567-0819-203142536475', 'Apartment 2A, 42 Deansgate', 'Boiler malfunction', 'Central heating boiler not firing correctly. Making noise on ignition. Engineer inspection required.', 'Medium', 'In Progress', 320.00, NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days'),
    ('87c12324-4556-4678-1920-314253647586', 'Studio 1C, 22 Park Row', 'Full refurbishment - painting and flooring', 'Complete studio refurbishment: repaint walls, replace laminate flooring, inspect electrical installation.', 'Low', 'In Progress', 6500.00, NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),
    ('98d23435-5667-4789-2031-425364758697', 'Penthouse, 30 The Embankment', 'Annual gas safety check', 'Mandatory annual gas safety inspection. Contact Gas Safe registered engineer.', 'Medium', 'Closed', 150.00, NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days'),
    ('a9e34546-6778-4890-3142-536475869708', 'Unit 1, 8 Victoria Square', 'Front door lock broken', 'Main entrance lock not engaging properly. Tenant requests urgent replacement for security.', 'High', 'Open', 380.00, NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day'),
    ('baf45657-7889-4901-4253-647586970819', 'Villa 7, The Crescent', 'Garden maintenance', 'Quarterly garden maintenance including hedge trimming, lawn care and path clearing.', 'Low', 'In Progress', 550.00, NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days');

    -- =============================================
    -- Insurance Policies
    -- =============================================
    INSERT INTO admin_insurance (id, property_name, insurance_type, company, policy_number, start_date, end_date, premium, status, notes, created_at, updated_at) VALUES
    ('aa000001-0000-4000-8000-000000000001', 'Flat 3B, 15 King Street', 'Buildings', 'Aviva', 'AV-BLD-2024-001', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months', 420.00, 'Active', 'Standard buildings cover', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months'),
    ('aa000001-0000-4000-8000-000000000002', 'Flat 3B, 15 King Street', 'Contents', 'Aviva', 'AV-CNT-2024-001', CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months', 180.00, 'Active', 'Landlord contents cover', NOW() - INTERVAL '6 months', NOW() - INTERVAL '6 months'),
    ('aa000001-0000-4000-8000-000000000003', 'Villa 7, The Crescent', 'Buildings', 'AXA', 'AXA-BLD-2024-003', CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months', 850.00, 'Active', 'Period property enhanced cover', NOW() - INTERVAL '3 months', NOW() - INTERVAL '3 months'),
    ('aa000001-0000-4000-8000-000000000004', 'Penthouse, 30 The Embankment', 'Buildings', 'Zurich', 'ZU-BLD-2024-004', CURRENT_DATE - INTERVAL '10 months', CURRENT_DATE + INTERVAL '2 months', 620.00, 'Active', 'High-value property cover', NOW() - INTERVAL '10 months', NOW() - INTERVAL '10 months'),
    ('aa000001-0000-4000-8000-000000000005', 'Unit 1, 8 Victoria Square', 'Commercial', 'Hiscox', 'HX-COM-2024-005', CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE + INTERVAL '8 months', 1200.00, 'Active', 'Commercial premises cover', NOW() - INTERVAL '4 months', NOW() - INTERVAL '4 months'),
    ('aa000001-0000-4000-8000-000000000006', 'Studio 1C, 22 Park Row', 'Buildings', 'Aviva', 'AV-BLD-2024-006', CURRENT_DATE - INTERVAL '14 months', CURRENT_DATE - INTERVAL '2 months', 350.00, 'Expired', 'Renewal pending post-renovation', NOW() - INTERVAL '14 months', NOW() - INTERVAL '2 months');

    -- =============================================
    -- Alerts
    -- =============================================
    INSERT INTO admin_alerts (id, type, entity_type, entity_id, title, description, status, priority, created_at, updated_at) VALUES
    ('bb000001-0000-4000-8000-000000000001', 'lease_expiry', 'property', 'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80', 'Lease expiring soon', 'Villa 7, The Crescent lease expires within 6 months', 'Active', 'High', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),
    ('bb000001-0000-4000-8000-000000000002', 'overdue_payment', 'invoice', '10000001-0000-4000-8000-000000000009', 'Payment overdue', 'INV-2024-009 for 156 Princes Street is unpaid', 'Active', 'High', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    ('bb000001-0000-4000-8000-000000000003', 'insurance_expiry', 'insurance', 'aa000001-0000-4000-8000-000000000006', 'Insurance expired', 'Buildings insurance for Studio 1C, 22 Park Row has expired', 'Active', 'Medium', NOW() - INTERVAL '2 months', NOW() - INTERVAL '2 months'),
    ('bb000001-0000-4000-8000-000000000004', 'maintenance', 'issue', '65af0102-2334-4456-f708-192031425364', 'Urgent maintenance required', 'Water leak at 15 King Street requires immediate attention', 'Active', 'High', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 day'),
    ('bb000001-0000-4000-8000-000000000005', 'gas_safety', 'property', '07b8c9d0-e1f2-4a3b-4c5d-6e7f80910213', 'Gas safety certificate due', 'Annual gas safety check due for 30 The Embankment', 'Resolved', 'Medium', NOW() - INTERVAL '20 days', NOW() - INTERVAL '5 days');

    -- =============================================
    -- Contacts
    -- =============================================
    INSERT INTO admin_contacts (id, name, tax_id, iban, email, phone, address, contact_type, notes, created_at, updated_at) VALUES
    ('cc000001-0000-4000-8000-000000000001', 'Quick Fix Plumbing', 'UTR 7777888899', 'GB11 NWBK 5566 7788 9900 11', 'info@quickfixplumbing.co.uk', '+44 20 7946 2222', '45 Trade Street, London SE1 4PQ', 'Contractor', 'Reliable plumber, 24hr callout available', NOW() - INTERVAL '12 months', NOW() - INTERVAL '3 months'),
    ('cc000001-0000-4000-8000-000000000002', 'Smith & Sons Electricians', 'UTR 8888999900', 'GB22 MIDL 4005 0712 1122 33', 'jobs@smithelectricians.co.uk', '+44 20 7946 3333', '12 Workshop Lane, London E1 6BT', 'Contractor', 'NICEIC registered, Part P certified', NOW() - INTERVAL '10 months', NOW() - INTERVAL '2 months'),
    ('cc000001-0000-4000-8000-000000000003', 'London Borough Council', '', '', 'council.tax@london.gov.uk', '+44 20 7946 4444', 'Town Hall, London WC1E 7HY', 'Government', 'Council tax authority', NOW() - INTERVAL '24 months', NOW() - INTERVAL '6 months'),
    ('cc000001-0000-4000-8000-000000000004', 'Deansgate Management Co', 'UTR 1111222233', 'GB33 WEST 1234 5698 0011 22', 'accounts@deansgatemgmt.co.uk', '+44 161 496 5555', '1 Deansgate, Manchester M3 2EG', 'Management Company', 'Service charge and building management', NOW() - INTERVAL '18 months', NOW() - INTERVAL '4 months'),
    ('cc000001-0000-4000-8000-000000000005', 'Aviva Insurance', 'UTR 9999000011', '', 'property@aviva.co.uk', '+44 800 051 0051', 'PO Box 520, Norwich NR1 3WG', 'Insurer', 'Buildings and contents insurance provider', NOW() - INTERVAL '24 months', NOW() - INTERVAL '6 months');

    -- =============================================
    -- Leads
    -- =============================================
    INSERT INTO admin_leads (id, name, email, phone, company, source, status, interest_type, property_name, budget_min, budget_max, min_bedrooms, min_sqm, preferred_area, contact_date, follow_up_date, assigned_to, score, notes, created_at, updated_at) VALUES
    ('dd000001-0000-4000-8000-000000000001', 'Michael Clarke', 'michael.clarke@email.co.uk', '+44 20 7946 8001', '', 'Website', 'Qualified', 'Residential Rental', 'Unit 1, 8 Victoria Square', 1500.00, 2500.00, 2, 60.00, 'Central London', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE + INTERVAL '2 days', 'Sarah', 75, 'Looking for 2-bed flat in central London, flexible on move date', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
    ('dd000001-0000-4000-8000-000000000002', 'Rebecca Foster', 'rebecca.foster@email.co.uk', '+44 161 496 8002', 'Foster & Co Solicitors', 'Referral', 'New', 'Commercial Lease', '', 2000.00, 4000.00, NULL, 100.00, 'Manchester City Centre', CURRENT_DATE - INTERVAL '2 days', CURRENT_DATE + INTERVAL '5 days', '', 50, 'Law firm looking for office space in Manchester', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),
    ('dd000001-0000-4000-8000-000000000003', 'Andrew Patel', 'andrew.patel@email.co.uk', '+44 117 496 8003', '', 'Rightmove', 'Contacted', 'Residential Rental', 'Studio 1C, 22 Park Row', 700.00, 1000.00, 1, 30.00, 'Bristol', CURRENT_DATE - INTERVAL '10 days', CURRENT_DATE - INTERVAL '3 days', 'James', 60, 'Young professional seeking studio/1-bed in Bristol centre', NOW() - INTERVAL '10 days', NOW() - INTERVAL '3 days'),
    ('dd000001-0000-4000-8000-000000000004', 'Sophie Nguyen', 'sophie.nguyen@email.co.uk', '+44 131 496 8004', 'Nguyen Consulting', 'LinkedIn', 'Qualified', 'Commercial Lease', 'Unit 3, Northern Industrial Estate', 1800.00, 3000.00, NULL, 200.00, 'Edinburgh / Leeds', CURRENT_DATE - INTERVAL '7 days', CURRENT_DATE + INTERVAL '1 day', 'Sarah', 80, 'Warehouse/industrial space needed for logistics business', NOW() - INTERVAL '7 days', NOW() - INTERVAL '2 days'),
    ('dd000001-0000-4000-8000-000000000005', 'Daniel Hughes', 'daniel.hughes@email.co.uk', '+44 20 7946 8005', '', 'Walk-in', 'Lost', 'Residential Rental', '', 3000.00, 5000.00, 3, 120.00, 'South London', CURRENT_DATE - INTERVAL '30 days', NULL, 'James', 20, 'Was looking for premium property but found elsewhere', NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days');

    -- =============================================
    -- Lead Notes
    -- =============================================
    INSERT INTO admin_lead_notes (id, lead_id, content, author, created_at, updated_at) VALUES
    ('ee000001-0000-4000-8000-000000000001', 'dd000001-0000-4000-8000-000000000001', 'Initial enquiry via website contact form. Interested in central London properties.', 'Sarah', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
    ('ee000001-0000-4000-8000-000000000002', 'dd000001-0000-4000-8000-000000000001', 'Phone call - confirmed budget and requirements. Arranging viewing for Victoria Square unit.', 'Sarah', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
    ('ee000001-0000-4000-8000-000000000003', 'dd000001-0000-4000-8000-000000000003', 'Contacted via email. Sent details of Park Row studio. Awaiting response.', 'James', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),
    ('ee000001-0000-4000-8000-000000000004', 'dd000001-0000-4000-8000-000000000004', 'Met at networking event. Very interested in industrial space for growing logistics company.', 'Sarah', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
    ('ee000001-0000-4000-8000-000000000005', 'dd000001-0000-4000-8000-000000000004', 'Follow-up call. Confirmed Leeds preferred over Edinburgh. Sending Unit 3 details.', 'Sarah', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
    ('ee000001-0000-4000-8000-000000000006', 'dd000001-0000-4000-8000-000000000005', 'Called to follow up but went to voicemail. Will try again next week.', 'James', NOW() - INTERVAL '20 days', NOW() - INTERVAL '20 days'),
    ('ee000001-0000-4000-8000-000000000007', 'dd000001-0000-4000-8000-000000000005', 'Client confirmed they signed with another agency. Marking as lost.', 'James', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days');

    -- =============================================
    -- Audit Log
    -- =============================================
    INSERT INTO admin_audit_log (entity_type, entity_id, action, old_values, new_values, changed_fields, created_at) VALUES
    ('invoices', '10000001-0000-4000-8000-000000000006', 'create', NULL, '{"reference":"INV-2024-006","amount":1250}', ARRAY['reference','description','amount','status'], NOW() - INTERVAL '2 hours'),
    ('invoices', '10000001-0000-4000-8000-000000000007', 'update', '{"paid":0,"status":"Unpaid"}', '{"paid":900,"status":"Partial"}', ARRAY['paid','status'], NOW() - INTERVAL '5 hours'),
    ('properties', 'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091', 'update', '{"status":"Available"}', '{"status":"Under Renovation"}', ARRAY['status'], NOW() - INTERVAL '8 hours'),
    ('issues', '65af0102-2334-4456-f708-192031425364', 'create', NULL, '{"title":"Water leak in bathroom","priority":"High"}', ARRAY['title','description','priority','status'], NOW() - INTERVAL '12 hours'),
    ('contracts', '0f546576-8798-4a91-acbd-cedfe0f10213', 'create', NULL, '{"contract_ref":"EMBANKMENT 30 - BROWN","rent":2800}', ARRAY['contract_ref','property_name','tenant_name','rent'], NOW() - INTERVAL '24 hours'),
    ('tenants', '65b4c5d6-e7f8-4091-0213-243546576879', 'create', NULL, '{"name":"Charlotte Brown"}', ARRAY['name','email','phone','tax_id'], NOW() - INTERVAL '25 hours'),
    ('invoices', '10000001-0000-4000-8000-000000000008', 'create', NULL, '{"reference":"INV-2024-008","amount":3200}', ARRAY['reference','description','amount','status'], NOW() - INTERVAL '30 hours'),
    ('issues', '98d23435-5667-4789-2031-425364758697', 'update', '{"status":"Open"}', '{"status":"Closed"}', ARRAY['status'], NOW() - INTERVAL '48 hours'),
    ('deposits', '327c8d9e-0f01-4123-c4d5-e6f708192031', 'create', NULL, '{"property_name":"Villa 7, The Crescent","amount":6400}', ARRAY['property_name','contract_ref','amount','paid'], NOW() - INTERVAL '72 hours'),
    ('properties', '18c9d0e1-f2a3-4b4c-5d6e-7f8091021324', 'update', '{"rent":2200}', '{"rent":2400}', ARRAY['rent'], NOW() - INTERVAL '96 hours'),
    ('owners', '87d6e7f8-0910-4213-2435-46576879809b', 'update', '{"phone":"+44 20 7946 1230"}', '{"phone":"+44 20 7946 1234"}', ARRAY['phone'], NOW() - INTERVAL '120 hours');

END;
$$ LANGUAGE plpgsql;

-- Run seed on first migration
SELECT admin_seed_demo_data();
