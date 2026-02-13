/**
 * Demo Mock API - Property Management
 * Intercepts window.fetch to simulate a REST API with realistic UK property data.
 * Must be loaded BEFORE admin.js.
 */
(function () {
    'use strict';

    // ========================================================================
    // Date Helpers
    // ========================================================================
    const _now = new Date();

    function today() {
        return _now.toISOString().slice(0, 10);
    }

    function daysAgo(n) {
        const d = new Date(_now);
        d.setDate(d.getDate() - n);
        return d.toISOString().slice(0, 10);
    }

    function daysFromNow(n) {
        const d = new Date(_now);
        d.setDate(d.getDate() + n);
        return d.toISOString().slice(0, 10);
    }

    function monthsAgo(n) {
        const d = new Date(_now);
        d.setMonth(d.getMonth() - n);
        return d.toISOString().slice(0, 10);
    }

    function monthsFromNow(n) {
        const d = new Date(_now);
        d.setMonth(d.getMonth() + n);
        return d.toISOString().slice(0, 10);
    }

    function hoursAgo(n) {
        const d = new Date(_now);
        d.setHours(d.getHours() - n);
        return d.toISOString();
    }

    function uuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    // ========================================================================
    // Fixed UUIDs (so cross-references are stable)
    // ========================================================================
    const IDS = {
        properties: [
            'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
            'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
            'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
            'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
            'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
            'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102',
            '07b8c9d0-e1f2-4a3b-4c5d-6e7f80910213',
            '18c9d0e1-f2a3-4b4c-5d6e-7f8091021324'
        ],
        tenants: [
            '21d0e1f2-a3b4-4c5d-6e7f-809102132435',
            '32e1f2a3-b4c5-4d6e-7f80-910213243546',
            '43f2a3b4-c5d6-4e7f-8091-021324354657',
            '54a3b4c5-d6e7-4f80-9102-132435465768',
            '65b4c5d6-e7f8-4091-0213-243546576879',
            '76c5d6e7-f809-4102-1324-35465768798a'
        ],
        owners: [
            '87d6e7f8-0910-4213-2435-46576879809b',
            '98e7f809-1021-4324-3546-5768798a90ac',
            'a9f80910-2132-4435-4657-68798a9bacbd',
            'ba091021-3243-4546-5768-798a9bacbdce',
            'cb1a2b3c-4d5e-4f60-7182-93a4b5c6d7e8',
            'dc2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9'
        ],
        contracts: [
            'cb102132-4354-4657-6879-8a9bacbdcedf',
            'dc213243-5465-4768-798a-9bacbdcedfe0',
            'ed324354-6576-4879-8a9b-acbdcedfe0f1',
            'fe435465-7687-4980-9bac-bdcedfe0f102',
            '0f546576-8798-4a91-acbd-cedfe0f10213',
            '1a657687-9809-4ba2-bcde-f0f102132435',
            '2b768798-a910-4cb3-cdef-010213243546'
        ],
        invoices: [],
        deposits: [
            '105a6b7c-8d9e-4f01-a2b3-c4d5e6f70819',
            '216b7c8d-9e0f-4012-b3c4-d5e6f7081920',
            '327c8d9e-0f01-4123-c4d5-e6f708192031',
            '438d9e0a-1012-4234-d5e6-a70819203142',
            '549e0f0b-2123-4345-e6f7-b81920314253',
            '65af010c-3234-4456-f708-c92031425364'
        ],
        sepa_batches: [
            '438d9e0f-0112-4234-d5e6-f70819203142',
            '549e0f01-1223-4345-e6f7-081920314253',
            '65af0102-a334-4456-a708-192031425364',
            '76b01213-b445-4567-b819-203142536475',
            '87c12324-c556-4678-c920-314253647586',
            '98d23435-d667-4789-d031-425364758697'
        ],
        issues: [
            '65af0102-2334-4456-f708-192031425364',
            '76b01213-3445-4567-0819-203142536475',
            '87c12324-4556-4678-1920-314253647586',
            '98d23435-5667-4789-2031-425364758697',
            'a9e34546-6778-4890-3142-536475869708',
            'baf45657-7889-4901-4253-647586970819'
        ],
        insurance: [
            'ins10001-aaaa-4bbb-cccc-ddddeeee0001',
            'ins10002-aaaa-4bbb-cccc-ddddeeee0002',
            'ins10003-aaaa-4bbb-cccc-ddddeeee0003',
            'ins10004-aaaa-4bbb-cccc-ddddeeee0004'
        ],
        contacts: [
            'con10001-aaaa-4bbb-cccc-ddddeeee0001',
            'con10002-aaaa-4bbb-cccc-ddddeeee0002',
            'con10003-aaaa-4bbb-cccc-ddddeeee0003',
            'con10004-aaaa-4bbb-cccc-ddddeeee0004',
            'con10005-aaaa-4bbb-cccc-ddddeeee0005'
        ],
        leads: [
            'lea10001-aaaa-4bbb-cccc-ddddeeee0001',
            'lea10002-aaaa-4bbb-cccc-ddddeeee0002',
            'lea10003-aaaa-4bbb-cccc-ddddeeee0003',
            'lea10004-aaaa-4bbb-cccc-ddddeeee0004'
        ]
    };

    // Generate 15 invoice IDs
    for (let i = 0; i < 15; i++) {
        IDS.invoices.push(uuid());
    }

    // ========================================================================
    // Properties
    // ========================================================================
    const properties = [
        {
            id: IDS.properties[0],
            property_name: '14 King Street, Flat 3B',
            address: '14 King Street, Flat 3B, Manchester M2 4WQ',
            contract_ref: 'KING ST 14 - JOHNSON',
            status: 'Rented',
            rent: 875,
            start_date: monthsAgo(14),
            end_date: monthsFromNow(10),
            tags: ['Residential', 'City Centre'],
            image_folder: 'king-street-14',
            created_at: monthsAgo(18),
            updated_at: daysAgo(5)
        },
        {
            id: IDS.properties[1],
            property_name: '42 Royal Crescent',
            address: '42 Royal Crescent, Bath BA1 2LR',
            contract_ref: 'ROYAL CRESCENT 42 - WILLIAMS',
            status: 'Rented',
            rent: 1650,
            start_date: monthsAgo(10),
            end_date: monthsFromNow(14),
            tags: ['Residential', 'Premium'],
            image_folder: 'royal-crescent-42',
            created_at: monthsAgo(12),
            updated_at: daysAgo(3)
        },
        {
            id: IDS.properties[2],
            property_name: '8 Commercial Road, Unit B',
            address: '8 Commercial Road, Unit B, Birmingham B1 1RS',
            contract_ref: '',
            status: 'Vacant',
            rent: 2200,
            start_date: null,
            end_date: null,
            tags: ['Commercial', 'Office'],
            image_folder: 'commercial-road-8',
            created_at: monthsAgo(24),
            updated_at: daysAgo(15)
        },
        {
            id: IDS.properties[3],
            property_name: '7 Palm Grove, Kensington',
            address: '7 Palm Grove, Kensington, London W8 5PT',
            contract_ref: 'PALM GROVE 7 - THOMPSON',
            status: 'Rented',
            rent: 4500,
            start_date: monthsAgo(18),
            end_date: monthsFromNow(6),
            tags: ['Residential', 'Premium', 'Prime'],
            image_folder: 'palm-grove-7',
            created_at: monthsAgo(20),
            updated_at: daysAgo(7)
        },
        {
            id: IDS.properties[4],
            property_name: '22 Serpentine Walk, Flat 1C',
            address: '22 Serpentine Walk, Flat 1C, Bristol BS1 4DJ',
            contract_ref: '',
            status: 'Under Renovation',
            rent: 725,
            start_date: null,
            end_date: null,
            tags: ['Residential', 'Renovation'],
            image_folder: 'serpentine-walk-22',
            created_at: monthsAgo(15),
            updated_at: daysAgo(2)
        },
        {
            id: IDS.properties[5],
            property_name: '156 Diagonal Avenue, Flat 4B',
            address: '156 Diagonal Avenue, Flat 4B, Edinburgh EH1 2NG',
            contract_ref: 'DIAGONAL AVE 156 - BROWN',
            status: 'Rented',
            rent: 1150,
            start_date: monthsAgo(8),
            end_date: monthsFromNow(16),
            tags: ['Residential'],
            image_folder: 'diagonal-avenue-156',
            created_at: monthsAgo(10),
            updated_at: daysAgo(4)
        },
        {
            id: IDS.properties[6],
            property_name: '30 Meadow Lane, Penthouse',
            address: '30 Meadow Lane, Penthouse, London SW1A 1AA',
            contract_ref: 'MEADOW LN 30 - TAYLOR',
            status: 'Rented',
            rent: 3800,
            start_date: monthsAgo(12),
            end_date: monthsFromNow(12),
            tags: ['Residential', 'Premium', 'City Centre'],
            image_folder: 'meadow-lane-30',
            created_at: monthsAgo(14),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.properties[7],
            property_name: '3 Northern Industrial Park',
            address: '3 Northern Industrial Park, Leeds LS9 8AG',
            contract_ref: '',
            status: 'Vacant',
            rent: 5200,
            start_date: null,
            end_date: null,
            tags: ['Commercial', 'Industrial'],
            image_folder: 'northern-industrial-3',
            created_at: monthsAgo(22),
            updated_at: daysAgo(20)
        }
    ];

    // ========================================================================
    // Tenants
    // ========================================================================
    const tenants = [
        {
            id: IDS.tenants[0],
            name: 'Sarah Johnson',
            tax_id: 'AB123456C',
            email: 'sarah.johnson@email.co.uk',
            phone: '+44 7700 900123',
            address: '14 King Street, Flat 3B, Manchester M2 4WQ',
            bank_account: 'GB29 NWBK 6016 1331 9268 19',
            property_name: '14 King Street, Flat 3B',
            property_address: '14 King Street, Flat 3B, Manchester M2 4WQ',
            is_legacy: false,
            guarantor_name: '',
            guarantor_id: '',
            guarantor_tax_id: '',
            guarantor_phone: '',
            guarantor_email: '',
            created_at: monthsAgo(14),
            updated_at: daysAgo(5)
        },
        {
            id: IDS.tenants[1],
            name: 'James Williams',
            tax_id: 'CD234567D',
            email: 'james.williams@email.co.uk',
            phone: '+44 7700 900234',
            address: '42 Royal Crescent, Bath BA1 2LR',
            bank_account: 'GB82 WEST 1234 5698 7654 32',
            property_name: '42 Royal Crescent',
            property_address: '42 Royal Crescent, Bath BA1 2LR',
            is_legacy: false,
            guarantor_name: '',
            guarantor_id: '',
            guarantor_tax_id: '',
            guarantor_phone: '',
            guarantor_email: '',
            created_at: monthsAgo(10),
            updated_at: daysAgo(3)
        },
        {
            id: IDS.tenants[2],
            name: 'Emma Thompson',
            tax_id: 'EF345678E',
            email: 'emma.thompson@email.co.uk',
            phone: '+44 7700 900345',
            address: '7 Palm Grove, Kensington, London W8 5PT',
            bank_account: 'GB76 BARC 2026 0508 1234 56',
            property_name: '7 Palm Grove, Kensington',
            property_address: '7 Palm Grove, Kensington, London W8 5PT',
            is_legacy: false,
            guarantor_name: '',
            guarantor_id: '',
            guarantor_tax_id: '',
            guarantor_phone: '',
            guarantor_email: '',
            created_at: monthsAgo(18),
            updated_at: daysAgo(7)
        },
        {
            id: IDS.tenants[3],
            name: 'David Brown',
            tax_id: 'GH456789F',
            email: 'david.brown@email.co.uk',
            phone: '+44 7700 900456',
            address: '156 Diagonal Avenue, Flat 4B, Edinburgh EH1 2NG',
            bank_account: 'GB33 BUKB 2020 1555 5555 55',
            property_name: '156 Diagonal Avenue, Flat 4B',
            property_address: '156 Diagonal Avenue, Flat 4B, Edinburgh EH1 2NG',
            is_legacy: false,
            guarantor_name: '',
            guarantor_id: '',
            guarantor_tax_id: '',
            guarantor_phone: '',
            guarantor_email: '',
            created_at: monthsAgo(8),
            updated_at: daysAgo(4)
        },
        {
            id: IDS.tenants[4],
            name: 'Lucy Taylor',
            tax_id: 'IJ567890G',
            email: 'lucy.taylor@email.co.uk',
            phone: '+44 7700 900567',
            address: '30 Meadow Lane, Penthouse, London SW1A 1AA',
            bank_account: 'GB09 HABU 6216 1140 0486 42',
            property_name: '30 Meadow Lane, Penthouse',
            property_address: '30 Meadow Lane, Penthouse, London SW1A 1AA',
            is_legacy: false,
            guarantor_name: '',
            guarantor_id: '',
            guarantor_tax_id: '',
            guarantor_phone: '',
            guarantor_email: '',
            created_at: monthsAgo(12),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.tenants[5],
            name: 'Paul Mitchell',
            tax_id: 'KL678901H',
            email: 'paul.mitchell@email.co.uk',
            phone: '+44 7700 900678',
            address: '15 Harley Street, London W1G 9QY',
            bank_account: 'GB62 MIDL 4025 1639 8750 90',
            property_name: '',
            property_address: '',
            is_legacy: true,
            guarantor_name: '',
            guarantor_id: '',
            guarantor_tax_id: '',
            guarantor_phone: '',
            guarantor_email: '',
            created_at: monthsAgo(24),
            updated_at: monthsAgo(6)
        }
    ];

    // ========================================================================
    // Owners
    // ========================================================================
    const owners = [
        {
            id: IDS.owners[0],
            name: 'Horizon Properties Ltd',
            tax_id: '12345678',
            email: 'admin@horizonproperties.co.uk',
            phone: '+44 20 7946 0123',
            address: '50 Chancery Lane, London WC2A 1HL',
            bank_account: 'GB29 NWBK 6016 1331 9268 19',
            property_name: '14 King Street, Flat 3B / 30 Meadow Lane, Penthouse',
            property_address: 'Manchester / London',
            created_at: monthsAgo(24),
            updated_at: daysAgo(10)
        },
        {
            id: IDS.owners[1],
            name: 'Margaret Chen',
            tax_id: 'AA112233B',
            email: 'margaret.chen@email.co.uk',
            phone: '+44 7700 900789',
            address: '120 Queen Street, Bath BA1 1HE',
            bank_account: 'GB82 WEST 1234 5698 7654 32',
            property_name: '42 Royal Crescent / 156 Diagonal Avenue, Flat 4B',
            property_address: 'Bath / Edinburgh',
            created_at: monthsAgo(18),
            updated_at: daysAgo(8)
        },
        {
            id: IDS.owners[2],
            name: 'Mediterranean Investments Ltd',
            tax_id: '87654321',
            email: 'contact@medinvest.co.uk',
            phone: '+44 20 7946 0456',
            address: '22 Harbour Road, Bristol BS1 5TY',
            bank_account: 'GB76 BARC 2026 0508 1234 56',
            property_name: '8 Commercial Road, Unit B / 7 Palm Grove, Kensington / 3 Northern Industrial Park',
            property_address: 'Birmingham / London / Leeds',
            created_at: monthsAgo(24),
            updated_at: daysAgo(15)
        },
        {
            id: IDS.owners[3],
            name: 'Frank Morrison',
            tax_id: 'BB223344C',
            email: 'frank.morrison@email.co.uk',
            phone: '+44 7700 900890',
            address: '90 Park Row, Bristol BS1 5LJ',
            bank_account: 'GB33 BUKB 2020 1555 5555 55',
            property_name: '22 Serpentine Walk, Flat 1C',
            property_address: 'Bristol',
            created_at: monthsAgo(15),
            updated_at: daysAgo(12)
        },
        {
            id: IDS.owners[4],
            name: 'Pinnacle Real Estate Ltd',
            tax_id: '50123456',
            email: 'info@pinnaclerealestate.co.uk',
            phone: '+44 113 294 5678',
            address: '18 Victoria Street, Leeds LS1 5DL',
            bank_account: 'GB41 LOYD 3096 1731 2345 67',
            property_name: '3 Northern Industrial Park',
            property_address: 'Leeds',
            created_at: monthsAgo(20),
            updated_at: daysAgo(6)
        },
        {
            id: IDS.owners[5],
            name: 'Isabel Clarke',
            tax_id: 'CC334455D',
            email: 'isabel.clarke@email.co.uk',
            phone: '+44 7700 900901',
            address: '5 The Esplanade, Brighton BN2 1AL',
            bank_account: 'GB56 HBUK 1093 4010 2345 67',
            property_name: '8 Commercial Road, Unit B',
            property_address: 'Birmingham',
            created_at: monthsAgo(12),
            updated_at: daysAgo(9)
        }
    ];

    // ========================================================================
    // Contracts
    // ========================================================================
    const contracts = [
        {
            id: IDS.contracts[0],
            contract_ref: 'KING ST 14 - JOHNSON',
            property_name: '14 King Street, Flat 3B',
            address: '14 King Street, Flat 3B, Manchester M2 4WQ',
            tenant: 'Sarah Johnson',
            status: 'Active',
            rent: 875,
            total: 875 * 12,
            start_date: monthsAgo(14),
            end_date: monthsFromNow(10),
            tags: ['Residential', 'Annual'],
            doc_count: 2,
            created_at: monthsAgo(14),
            updated_at: daysAgo(5)
        },
        {
            id: IDS.contracts[1],
            contract_ref: 'ROYAL CRESCENT 42 - WILLIAMS',
            property_name: '42 Royal Crescent',
            address: '42 Royal Crescent, Bath BA1 2LR',
            tenant: 'James Williams',
            status: 'Active',
            rent: 1650,
            total: 1650 * 24,
            start_date: monthsAgo(10),
            end_date: monthsFromNow(14),
            tags: ['Residential', 'Biennial'],
            doc_count: 1,
            created_at: monthsAgo(10),
            updated_at: daysAgo(3)
        },
        {
            id: IDS.contracts[2],
            contract_ref: 'PALM GROVE 7 - THOMPSON',
            property_name: '7 Palm Grove, Kensington',
            address: '7 Palm Grove, Kensington, London W8 5PT',
            tenant: 'Emma Thompson',
            status: 'Active',
            rent: 4500,
            total: 4500 * 36,
            start_date: monthsAgo(18),
            end_date: monthsFromNow(18),
            tags: ['Residential', '3-Year', 'Premium'],
            doc_count: 3,
            created_at: monthsAgo(18),
            updated_at: daysAgo(7)
        },
        {
            id: IDS.contracts[3],
            contract_ref: 'DIAGONAL AVE 156 - BROWN',
            property_name: '156 Diagonal Avenue, Flat 4B',
            address: '156 Diagonal Avenue, Flat 4B, Edinburgh EH1 2NG',
            tenant: 'David Brown',
            status: 'Active',
            rent: 1150,
            total: 1150 * 6,
            start_date: monthsAgo(3),
            end_date: monthsFromNow(3),
            tags: ['Residential', '6-Month'],
            doc_count: 1,
            created_at: monthsAgo(3),
            updated_at: daysAgo(4)
        },
        {
            id: IDS.contracts[4],
            contract_ref: 'MEADOW LN 30 - TAYLOR',
            property_name: '30 Meadow Lane, Penthouse',
            address: '30 Meadow Lane, Penthouse, London SW1A 1AA',
            tenant: 'Lucy Taylor',
            status: 'Active',
            rent: 3800,
            total: 3800 * 24,
            start_date: monthsAgo(12),
            end_date: monthsFromNow(12),
            tags: ['Residential', 'Biennial', 'Premium'],
            doc_count: 2,
            created_at: monthsAgo(12),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.contracts[5],
            contract_ref: 'COMMERCIAL RD 8 - MITCHELL',
            property_name: '8 Commercial Road, Unit B',
            address: '8 Commercial Road, Unit B, Birmingham B1 1RS',
            tenant: 'Paul Mitchell',
            status: 'Active',
            rent: 2200,
            total: 2200 * 60,
            start_date: monthsAgo(6),
            end_date: monthsFromNow(54),
            tags: ['Commercial', '5-Year'],
            doc_count: 1,
            created_at: monthsAgo(6),
            updated_at: daysAgo(10)
        },
        {
            id: IDS.contracts[6],
            contract_ref: 'SERPENTINE 22 - HARRIS',
            property_name: '22 Serpentine Walk, Flat 1C',
            address: '22 Serpentine Walk, Flat 1C, Bristol BS1 4DJ',
            tenant: 'Sophie Harris',
            status: 'Pending',
            rent: 725,
            total: 725 * 12,
            start_date: monthsFromNow(1),
            end_date: monthsFromNow(13),
            tags: ['Residential', 'Annual'],
            doc_count: 1,
            created_at: daysAgo(10),
            updated_at: daysAgo(2)
        }
    ];

    // ========================================================================
    // Invoices - 15 entries
    // ========================================================================
    const invoices = [
        // --- Rent invoices: Month -1 ---
        {
            id: IDS.invoices[0],
            reference: 'INV-2024-001',
            description: 'Monthly rent - King Street 14',
            contract_ref: 'KING ST 14 - JOHNSON',
            property_name: '14 King Street, Flat 3B',
            payer: 'Sarah Johnson',
            payee: 'Horizon Properties Ltd',
            status: 'Paid',
            total: 875,
            paid: 875,
            vat: 0,
            currency: 'EUR',
            invoice_date: monthsAgo(1),
            payment_date: daysAgo(25),
            type: 'income',
            expense_category: null,
            notes: '',
            created_at: monthsAgo(1),
            updated_at: daysAgo(25)
        },
        {
            id: IDS.invoices[1],
            reference: 'INV-2024-002',
            description: 'Monthly rent - Royal Crescent 42',
            contract_ref: 'ROYAL CRESCENT 42 - WILLIAMS',
            property_name: '42 Royal Crescent',
            payer: 'James Williams',
            payee: 'Margaret Chen',
            status: 'Paid',
            total: 1650,
            paid: 1650,
            vat: 0,
            currency: 'EUR',
            invoice_date: monthsAgo(1),
            payment_date: daysAgo(28),
            type: 'income',
            expense_category: null,
            notes: '',
            created_at: monthsAgo(1),
            updated_at: daysAgo(28)
        },
        {
            id: IDS.invoices[2],
            reference: 'INV-2024-003',
            description: 'Monthly rent - Palm Grove 7',
            contract_ref: 'PALM GROVE 7 - THOMPSON',
            property_name: '7 Palm Grove, Kensington',
            payer: 'Emma Thompson',
            payee: 'Mediterranean Investments Ltd',
            status: 'Paid',
            total: 4500,
            paid: 4500,
            vat: 0,
            currency: 'EUR',
            invoice_date: monthsAgo(1),
            payment_date: daysAgo(26),
            type: 'income',
            expense_category: null,
            notes: '',
            created_at: monthsAgo(1),
            updated_at: daysAgo(26)
        },
        {
            id: IDS.invoices[3],
            reference: 'INV-2024-004',
            description: 'Monthly rent - Diagonal Avenue 156',
            contract_ref: 'DIAGONAL AVE 156 - BROWN',
            property_name: '156 Diagonal Avenue, Flat 4B',
            payer: 'David Brown',
            payee: 'Margaret Chen',
            status: 'Paid',
            total: 1150,
            paid: 1150,
            vat: 0,
            currency: 'EUR',
            invoice_date: monthsAgo(1),
            payment_date: daysAgo(24),
            type: 'income',
            expense_category: null,
            notes: '',
            created_at: monthsAgo(1),
            updated_at: daysAgo(24)
        },
        {
            id: IDS.invoices[4],
            reference: 'INV-2024-005',
            description: 'Monthly rent - Meadow Lane 30',
            contract_ref: 'MEADOW LN 30 - TAYLOR',
            property_name: '30 Meadow Lane, Penthouse',
            payer: 'Lucy Taylor',
            payee: 'Horizon Properties Ltd',
            status: 'Paid',
            total: 3800,
            paid: 3800,
            vat: 0,
            currency: 'EUR',
            invoice_date: monthsAgo(1),
            payment_date: daysAgo(27),
            type: 'income',
            expense_category: null,
            notes: '',
            created_at: monthsAgo(1),
            updated_at: daysAgo(27)
        },
        // --- Rent invoices: Current month ---
        {
            id: IDS.invoices[5],
            reference: 'INV-2024-006',
            description: 'Monthly rent - King Street 14',
            contract_ref: 'KING ST 14 - JOHNSON',
            property_name: '14 King Street, Flat 3B',
            payer: 'Sarah Johnson',
            payee: 'Horizon Properties Ltd',
            status: 'Paid',
            total: 875,
            paid: 875,
            vat: 0,
            currency: 'EUR',
            invoice_date: daysAgo(5),
            payment_date: daysAgo(3),
            type: 'income',
            expense_category: null,
            notes: '',
            created_at: daysAgo(5),
            updated_at: daysAgo(3)
        },
        {
            id: IDS.invoices[6],
            reference: 'INV-2024-007',
            description: 'Monthly rent - Royal Crescent 42',
            contract_ref: 'ROYAL CRESCENT 42 - WILLIAMS',
            property_name: '42 Royal Crescent',
            payer: 'James Williams',
            payee: 'Margaret Chen',
            status: 'Partial',
            total: 1650,
            paid: 825,
            vat: 0,
            currency: 'EUR',
            invoice_date: daysAgo(5),
            payment_date: null,
            type: 'income',
            expense_category: null,
            notes: 'Partial payment received, second half pending',
            created_at: daysAgo(5),
            updated_at: daysAgo(2)
        },
        {
            id: IDS.invoices[7],
            reference: 'INV-2024-008',
            description: 'Monthly rent - Palm Grove 7',
            contract_ref: 'PALM GROVE 7 - THOMPSON',
            property_name: '7 Palm Grove, Kensington',
            payer: 'Emma Thompson',
            payee: 'Mediterranean Investments Ltd',
            status: 'Paid',
            total: 4500,
            paid: 4500,
            vat: 0,
            currency: 'EUR',
            invoice_date: daysAgo(5),
            payment_date: daysAgo(4),
            type: 'income',
            expense_category: null,
            notes: '',
            created_at: daysAgo(5),
            updated_at: daysAgo(4)
        },
        {
            id: IDS.invoices[8],
            reference: 'INV-2024-009',
            description: 'Monthly rent - Diagonal Avenue 156',
            contract_ref: 'DIAGONAL AVE 156 - BROWN',
            property_name: '156 Diagonal Avenue, Flat 4B',
            payer: 'David Brown',
            payee: 'Margaret Chen',
            status: 'Unpaid',
            total: 1150,
            paid: 0,
            vat: 0,
            currency: 'EUR',
            invoice_date: daysAgo(5),
            payment_date: null,
            type: 'income',
            expense_category: null,
            notes: 'Awaiting payment',
            created_at: daysAgo(5),
            updated_at: daysAgo(5)
        },
        {
            id: IDS.invoices[9],
            reference: 'INV-2024-010',
            description: 'Monthly rent - Meadow Lane 30',
            contract_ref: 'MEADOW LN 30 - TAYLOR',
            property_name: '30 Meadow Lane, Penthouse',
            payer: 'Lucy Taylor',
            payee: 'Horizon Properties Ltd',
            status: 'Paid',
            total: 3800,
            paid: 3800,
            vat: 0,
            currency: 'EUR',
            invoice_date: daysAgo(5),
            payment_date: daysAgo(4),
            type: 'income',
            expense_category: null,
            notes: '',
            created_at: daysAgo(5),
            updated_at: daysAgo(4)
        },
        // --- Rent invoices: Month -2 (two older ones) ---
        {
            id: IDS.invoices[10],
            reference: 'INV-2024-011',
            description: 'Monthly rent - Diagonal Avenue 156',
            contract_ref: 'DIAGONAL AVE 156 - BROWN',
            property_name: '156 Diagonal Avenue, Flat 4B',
            payer: 'David Brown',
            payee: 'Margaret Chen',
            status: 'Partial',
            total: 1150,
            paid: 575,
            vat: 0,
            currency: 'EUR',
            invoice_date: monthsAgo(2),
            payment_date: null,
            type: 'income',
            expense_category: null,
            notes: 'Partial payment - outstanding for 2 months',
            created_at: monthsAgo(2),
            updated_at: monthsAgo(1)
        },
        {
            id: IDS.invoices[11],
            reference: 'INV-2024-012',
            description: 'Monthly rent - Meadow Lane 30',
            contract_ref: 'MEADOW LN 30 - TAYLOR',
            property_name: '30 Meadow Lane, Penthouse',
            payer: 'Lucy Taylor',
            payee: 'Horizon Properties Ltd',
            status: 'Paid',
            total: 3800,
            paid: 3800,
            vat: 0,
            currency: 'EUR',
            invoice_date: monthsAgo(2),
            payment_date: monthsAgo(2),
            type: 'income',
            expense_category: null,
            notes: '',
            created_at: monthsAgo(2),
            updated_at: monthsAgo(2)
        },
        // --- Expense invoices ---
        {
            id: IDS.invoices[12],
            reference: 'EXP-2024-001',
            description: 'Council tax - King Street 14',
            contract_ref: '',
            property_name: '14 King Street, Flat 3B',
            payer: 'Horizon Properties Ltd',
            payee: 'Manchester City Council',
            status: 'Paid',
            total: 680,
            paid: 680,
            vat: 0,
            currency: 'EUR',
            invoice_date: monthsAgo(2),
            payment_date: monthsAgo(2),
            type: 'expense',
            expense_category: 'Council Tax',
            notes: 'Annual council tax 2024',
            created_at: monthsAgo(2),
            updated_at: monthsAgo(2)
        },
        {
            id: IDS.invoices[13],
            reference: 'EXP-2024-002',
            description: 'Service charge Q1 - Royal Crescent 42',
            contract_ref: '',
            property_name: '42 Royal Crescent',
            payer: 'Margaret Chen',
            payee: 'Royal Crescent Management Co',
            status: 'Paid',
            total: 320,
            paid: 320,
            vat: 0,
            currency: 'EUR',
            invoice_date: monthsAgo(1),
            payment_date: monthsAgo(1),
            type: 'expense',
            expense_category: 'Service Charge',
            notes: 'Quarterly service charge',
            created_at: monthsAgo(1),
            updated_at: monthsAgo(1)
        },
        {
            id: IDS.invoices[14],
            reference: 'EXP-2024-003',
            description: 'Buildings insurance - Palm Grove 7',
            contract_ref: '',
            property_name: '7 Palm Grove, Kensington',
            payer: 'Mediterranean Investments Ltd',
            payee: 'Aviva Insurance',
            status: 'Unpaid',
            total: 540,
            paid: 0,
            vat: 108,
            currency: 'EUR',
            invoice_date: daysAgo(10),
            payment_date: null,
            type: 'expense',
            expense_category: 'Insurance',
            notes: 'Annual buildings insurance policy',
            created_at: daysAgo(10),
            updated_at: daysAgo(10)
        }
    ];

    // ========================================================================
    // Deposits
    // ========================================================================
    const deposits = [
        {
            id: IDS.deposits[0],
            invoice_date: monthsAgo(14),
            payment_date: monthsAgo(14),
            return_date: null,
            property_name: '14 King Street, Flat 3B',
            contract_ref: 'KING ST 14 - JOHNSON',
            payer: 'Sarah Johnson',
            payee: 'Horizon Properties Ltd',
            type: 'Deposit',
            status: 'Deposited',
            total: 1750,
            paid: 1750,
            refunded: 0,
            created_at: monthsAgo(14),
            updated_at: monthsAgo(14)
        },
        {
            id: IDS.deposits[1],
            invoice_date: monthsAgo(10),
            payment_date: monthsAgo(10),
            return_date: null,
            property_name: '42 Royal Crescent',
            contract_ref: 'ROYAL CRESCENT 42 - WILLIAMS',
            payer: 'James Williams',
            payee: 'Margaret Chen',
            type: 'Deposit',
            status: 'Deposited',
            total: 3300,
            paid: 3300,
            refunded: 0,
            created_at: monthsAgo(10),
            updated_at: monthsAgo(10)
        },
        {
            id: IDS.deposits[2],
            invoice_date: monthsAgo(18),
            payment_date: monthsAgo(18),
            return_date: null,
            property_name: '7 Palm Grove, Kensington',
            contract_ref: 'PALM GROVE 7 - THOMPSON',
            payer: 'Emma Thompson',
            payee: 'Mediterranean Investments Ltd',
            type: 'Deposit',
            status: 'Deposited',
            total: 9000,
            paid: 9000,
            refunded: 0,
            created_at: monthsAgo(18),
            updated_at: monthsAgo(18)
        },
        {
            id: IDS.deposits[3],
            invoice_date: monthsAgo(8),
            payment_date: monthsAgo(8),
            return_date: null,
            property_name: '156 Diagonal Avenue, Flat 4B',
            contract_ref: 'DIAGONAL AVE 156 - BROWN',
            payer: 'David Brown',
            payee: 'Margaret Chen',
            type: 'Deposit',
            status: 'Deposited',
            total: 2300,
            paid: 2300,
            refunded: 0,
            created_at: monthsAgo(8),
            updated_at: monthsAgo(8)
        },
        {
            id: IDS.deposits[4],
            invoice_date: monthsAgo(12),
            payment_date: monthsAgo(12),
            return_date: null,
            property_name: '30 Meadow Lane, Penthouse',
            contract_ref: 'MEADOW LN 30 - TAYLOR',
            payer: 'Lucy Taylor',
            payee: 'Horizon Properties Ltd',
            type: 'Deposit',
            status: 'Deposited',
            total: 7600,
            paid: 7600,
            refunded: 0,
            created_at: monthsAgo(12),
            updated_at: monthsAgo(12)
        },
        {
            id: IDS.deposits[5],
            invoice_date: monthsAgo(6),
            payment_date: monthsAgo(6),
            return_date: null,
            property_name: '8 Commercial Road, Unit B',
            contract_ref: 'COMMERCIAL RD 8 - MITCHELL',
            payer: 'Paul Mitchell',
            payee: 'Isabel Clarke',
            type: 'Deposit',
            status: 'Deposited',
            total: 6600,
            paid: 6600,
            refunded: 0,
            created_at: monthsAgo(6),
            updated_at: monthsAgo(6)
        }
    ];

    // ========================================================================
    // SEPA Batches
    // ========================================================================
    const sepa_batches = [
        {
            id: IDS.sepa_batches[0],
            batch_id: 'SEPA-2024-001',
            collection_date: daysAgo(3),
            creditor: 'Horizon Properties Ltd',
            creditor_iban: 'GB29 NWBK 6016 1331 9268 19',
            amount: 4675,
            currency: 'EUR',
            debtor: 'Sarah Johnson',
            debtor_iban: 'GB09 HABU 6216 1140 0486 42',
            mandate_id: 'MAND-2024-001',
            reference: 'Rent January - Horizon',
            created_at: daysAgo(5),
            updated_at: daysAgo(3)
        },
        {
            id: IDS.sepa_batches[1],
            batch_id: 'SEPA-2024-002',
            collection_date: daysAgo(2),
            creditor: 'Margaret Chen',
            creditor_iban: 'GB82 WEST 1234 5698 7654 32',
            amount: 2800,
            currency: 'EUR',
            debtor: 'James Williams',
            debtor_iban: 'GB82 WEST 1234 5698 7654 32',
            mandate_id: 'MAND-2024-002',
            reference: 'Rent January - Chen',
            created_at: daysAgo(4),
            updated_at: daysAgo(2)
        },
        {
            id: IDS.sepa_batches[2],
            batch_id: 'SEPA-2024-003',
            collection_date: daysAgo(1),
            creditor: 'Mediterranean Investments Ltd',
            creditor_iban: 'GB76 BARC 2026 0508 1234 56',
            amount: 4500,
            currency: 'EUR',
            debtor: 'Emma Thompson',
            debtor_iban: 'GB45 LOYD 3096 1731 2345 67',
            mandate_id: 'MAND-2024-003',
            reference: 'Rent January - Mediterranean',
            created_at: daysAgo(3),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.sepa_batches[3],
            batch_id: 'SEPA-2024-004',
            collection_date: daysAgo(30),
            creditor: 'Horizon Properties Ltd',
            creditor_iban: 'GB29 NWBK 6016 1331 9268 19',
            amount: 4675,
            currency: 'EUR',
            debtor: 'Sarah Johnson',
            debtor_iban: 'GB09 HABU 6216 1140 0486 42',
            mandate_id: 'MAND-2024-001',
            reference: 'Rent December - Horizon',
            created_at: daysAgo(32),
            updated_at: daysAgo(30)
        },
        {
            id: IDS.sepa_batches[4],
            batch_id: 'SEPA-2024-005',
            collection_date: daysAgo(30),
            creditor: 'Margaret Chen',
            creditor_iban: 'GB82 WEST 1234 5698 7654 32',
            amount: 2800,
            currency: 'EUR',
            debtor: 'David Brown',
            debtor_iban: 'GB34 MIDL 4025 1639 8750 90',
            mandate_id: 'MAND-2024-004',
            reference: 'Rent December - Chen',
            created_at: daysAgo(33),
            updated_at: daysAgo(30)
        },
        {
            id: IDS.sepa_batches[5],
            batch_id: 'SEPA-2024-006',
            collection_date: daysAgo(1),
            creditor: 'Isabel Clarke',
            creditor_iban: 'GB56 HBUK 1093 4010 2345 67',
            amount: 2200,
            currency: 'EUR',
            debtor: 'Paul Mitchell',
            debtor_iban: 'GB67 NWBK 6016 1331 1234 56',
            mandate_id: 'MAND-2024-005',
            reference: 'Rent January - Clarke',
            created_at: daysAgo(3),
            updated_at: daysAgo(1)
        }
    ];

    // ========================================================================
    // Issues
    // ========================================================================
    const issues = [
        {
            id: IDS.issues[0],
            property_name: '14 King Street, Flat 3B',
            title: 'Water leak in bathroom',
            description: 'The tenant reports a leak from the washbasin pipe. Damp visible on the adjoining wall. Urgent plumber required.',
            priority: 'High',
            status: 'Open',
            cost: 350,
            created_at: daysAgo(3),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.issues[1],
            property_name: '42 Royal Crescent',
            title: 'Air conditioning fault',
            description: 'The air conditioning system is not cooling properly. Makes noise on startup. Technical inspection needed.',
            priority: 'Medium',
            status: 'In Progress',
            cost: 220,
            created_at: daysAgo(7),
            updated_at: daysAgo(2)
        },
        {
            id: IDS.issues[2],
            property_name: '22 Serpentine Walk, Flat 1C',
            title: 'Full renovation - painting and flooring',
            description: 'Complete renovation of the flat: repaint walls, replace laminate flooring, review electrical installation.',
            priority: 'Low',
            status: 'In Progress',
            cost: 4500,
            created_at: daysAgo(15),
            updated_at: daysAgo(2)
        },
        {
            id: IDS.issues[3],
            property_name: '30 Meadow Lane, Penthouse',
            title: 'Annual boiler inspection',
            description: 'Mandatory annual gas boiler inspection. Contact authorised service engineer.',
            priority: 'Medium',
            status: 'Closed',
            cost: 120,
            created_at: daysAgo(20),
            updated_at: daysAgo(5)
        },
        {
            id: IDS.issues[4],
            property_name: '8 Commercial Road, Unit B',
            title: 'Front door lock broken',
            description: 'The main door lock does not close properly. The tenant requests urgent replacement for security reasons.',
            priority: 'High',
            status: 'Open',
            cost: 280,
            created_at: daysAgo(2),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.issues[5],
            property_name: '7 Palm Grove, Kensington',
            title: 'Garden maintenance',
            description: 'Quarterly garden maintenance. Includes hedge trimming, lawn care and patio cleaning.',
            priority: 'Low',
            status: 'In Progress',
            cost: 450,
            created_at: daysAgo(10),
            updated_at: daysAgo(3)
        }
    ];

    // ========================================================================
    // Insurance Policies
    // ========================================================================
    const insurance = [
        {
            id: IDS.insurance[0],
            property_name: '14 King Street, Flat 3B',
            type: 'Buildings',
            company: 'Aviva',
            policy_number: 'AV-BLD-2024-001',
            start_date: monthsAgo(6),
            end_date: monthsFromNow(6),
            premium: 420,
            status: 'Active',
            created_at: monthsAgo(6),
            updated_at: monthsAgo(6)
        },
        {
            id: IDS.insurance[1],
            property_name: '7 Palm Grove, Kensington',
            type: 'Buildings & Contents',
            company: 'AXA',
            policy_number: 'AXA-BC-2024-002',
            start_date: monthsAgo(10),
            end_date: monthsFromNow(2),
            premium: 1250,
            status: 'Active',
            created_at: monthsAgo(10),
            updated_at: monthsAgo(10)
        },
        {
            id: IDS.insurance[2],
            property_name: '42 Royal Crescent',
            type: 'Landlord',
            company: 'Direct Line',
            policy_number: 'DL-LL-2023-045',
            start_date: monthsAgo(18),
            end_date: monthsAgo(6),
            premium: 680,
            status: 'Expired',
            created_at: monthsAgo(18),
            updated_at: monthsAgo(6)
        },
        {
            id: IDS.insurance[3],
            property_name: '30 Meadow Lane, Penthouse',
            type: 'Buildings & Contents',
            company: 'Zurich',
            policy_number: 'ZU-BC-2024-018',
            start_date: monthsAgo(3),
            end_date: monthsFromNow(9),
            premium: 980,
            status: 'Active',
            created_at: monthsAgo(3),
            updated_at: monthsAgo(3)
        }
    ];

    // ========================================================================
    // Contacts / Creditors
    // ========================================================================
    const contacts = [
        {
            id: IDS.contacts[0],
            name: 'Manchester City Council',
            tax_id: '00-MCC-001',
            iban: '',
            email: 'revenues@manchester.gov.uk',
            phone: '+44 161 234 5000',
            type: 'Council',
            created_at: monthsAgo(12),
            updated_at: monthsAgo(12)
        },
        {
            id: IDS.contacts[1],
            name: 'Aviva Insurance',
            tax_id: '02417910',
            iban: 'GB45 BARC 2024 0512 3456 78',
            email: 'claims@aviva.co.uk',
            phone: '+44 800 051 5041',
            type: 'Insurance',
            created_at: monthsAgo(10),
            updated_at: monthsAgo(10)
        },
        {
            id: IDS.contacts[2],
            name: 'Royal Crescent Management Co',
            tax_id: '12-RCM-456',
            iban: 'GB55 LOYD 3096 2814 5678 90',
            email: 'admin@royalcrescentmgmt.co.uk',
            phone: '+44 1225 444 555',
            type: 'Management',
            created_at: monthsAgo(18),
            updated_at: monthsAgo(18)
        },
        {
            id: IDS.contacts[3],
            name: 'ProFix Plumbing',
            tax_id: '23-PFX-789',
            iban: 'GB88 MIDL 4025 1639 0012 34',
            email: 'jobs@profixplumbing.co.uk',
            phone: '+44 7911 123456',
            type: 'Contractor',
            created_at: monthsAgo(6),
            updated_at: monthsAgo(6)
        },
        {
            id: IDS.contacts[4],
            name: 'GreenScape Gardens',
            tax_id: '34-GSG-012',
            iban: 'GB22 HBUK 1093 4015 6789 01',
            email: 'bookings@greenscapegardens.co.uk',
            phone: '+44 7922 234567',
            type: 'Contractor',
            created_at: monthsAgo(4),
            updated_at: monthsAgo(4)
        }
    ];

    // ========================================================================
    // Leads (CRM)
    // ========================================================================
    const leads = [
        {
            id: IDS.leads[0],
            name: 'Oliver Spencer',
            email: 'oliver.spencer@email.co.uk',
            phone: '+44 7700 901234',
            source: 'Website',
            status: 'Viewing',
            interest: '2-bed flat, central Manchester',
            property_name: '14 King Street, Flat 3B',
            score: 75,
            created_at: daysAgo(3),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.leads[1],
            name: 'Charlotte Evans',
            email: 'charlotte.evans@email.co.uk',
            phone: '+44 7700 902345',
            source: 'Referral',
            status: 'Contacted',
            interest: 'Premium property, London area',
            property_name: '30 Meadow Lane, Penthouse',
            score: 60,
            created_at: daysAgo(7),
            updated_at: daysAgo(5)
        },
        {
            id: IDS.leads[2],
            name: 'Thomas Baker',
            email: 'thomas.baker@email.co.uk',
            phone: '+44 7700 903456',
            source: 'Portal',
            status: 'New',
            interest: 'Commercial unit, Birmingham',
            property_name: '8 Commercial Road, Unit B',
            score: 40,
            created_at: daysAgo(1),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.leads[3],
            name: 'Jessica Patel',
            email: 'jessica.patel@email.co.uk',
            phone: '+44 7700 904567',
            source: 'Website',
            status: 'Won',
            interest: 'Family home, Bath area',
            property_name: '42 Royal Crescent',
            score: 95,
            created_at: daysAgo(30),
            updated_at: daysAgo(10)
        }
    ];

    // ========================================================================
    // Lead Notes
    // ========================================================================
    const lead_notes = [];

    // ========================================================================
    // Audit Entries
    // ========================================================================
    const auditEntries = [
        {
            id: uuid(),
            entity_type: 'invoices',
            entity_id: IDS.invoices[5],
            action: 'create',
            old_values: null,
            new_values: { reference: 'INV-2024-006', total: 1250 },
            changed_fields: ['reference', 'description', 'total', 'status'],
            created_at: hoursAgo(2)
        },
        {
            id: uuid(),
            entity_type: 'invoices',
            entity_id: IDS.invoices[6],
            action: 'update',
            old_values: { paid: 0, status: 'Unpaid' },
            new_values: { paid: 900, status: 'Partial' },
            changed_fields: ['paid', 'status'],
            created_at: hoursAgo(5)
        },
        {
            id: uuid(),
            entity_type: 'properties',
            entity_id: IDS.properties[4],
            action: 'update',
            old_values: { status: 'Vacant' },
            new_values: { status: 'Under Renovation' },
            changed_fields: ['status'],
            created_at: hoursAgo(8)
        },
        {
            id: uuid(),
            entity_type: 'issues',
            entity_id: IDS.issues[0],
            action: 'create',
            old_values: null,
            new_values: { title: 'Water leak in bathroom', priority: 'High' },
            changed_fields: ['title', 'description', 'priority', 'status'],
            created_at: hoursAgo(12)
        },
        {
            id: uuid(),
            entity_type: 'contracts',
            entity_id: IDS.contracts[4],
            action: 'create',
            old_values: null,
            new_values: { contract_ref: 'MEADOW LN 30 - TAYLOR', rent: 3800 },
            changed_fields: ['contract_ref', 'property_name', 'tenant', 'rent'],
            created_at: hoursAgo(24)
        },
        {
            id: uuid(),
            entity_type: 'tenants',
            entity_id: IDS.tenants[4],
            action: 'create',
            old_values: null,
            new_values: { name: 'Lucy Taylor' },
            changed_fields: ['name', 'email', 'phone', 'tax_id'],
            created_at: hoursAgo(25)
        },
        {
            id: uuid(),
            entity_type: 'invoices',
            entity_id: IDS.invoices[7],
            action: 'create',
            old_values: null,
            new_values: { reference: 'INV-2024-008', total: 4500 },
            changed_fields: ['reference', 'description', 'total', 'status'],
            created_at: hoursAgo(30)
        },
        {
            id: uuid(),
            entity_type: 'issues',
            entity_id: IDS.issues[3],
            action: 'update',
            old_values: { status: 'Open' },
            new_values: { status: 'Closed' },
            changed_fields: ['status'],
            created_at: hoursAgo(48)
        },
        {
            id: uuid(),
            entity_type: 'deposits',
            entity_id: IDS.deposits[2],
            action: 'create',
            old_values: null,
            new_values: { property_name: '7 Palm Grove, Kensington', total: 9000 },
            changed_fields: ['property_name', 'contract_ref', 'total', 'paid'],
            created_at: hoursAgo(72)
        },
        {
            id: uuid(),
            entity_type: 'properties',
            entity_id: IDS.properties[7],
            action: 'update',
            old_values: { rent: 4800 },
            new_values: { rent: 5200 },
            changed_fields: ['rent'],
            created_at: hoursAgo(96)
        },
        {
            id: uuid(),
            entity_type: 'owners',
            entity_id: IDS.owners[0],
            action: 'update',
            old_values: { phone: '+44 20 7946 0120' },
            new_values: { phone: '+44 20 7946 0123' },
            changed_fields: ['phone'],
            created_at: hoursAgo(120)
        },
        {
            id: uuid(),
            entity_type: 'invoices',
            entity_id: IDS.invoices[14],
            action: 'create',
            old_values: null,
            new_values: { reference: 'EXP-2024-003', total: 540 },
            changed_fields: ['reference', 'description', 'total', 'type', 'expense_category'],
            created_at: hoursAgo(144)
        }
    ];

    // ========================================================================
    // Helper: Paginate and filter a dataset
    // ========================================================================
    function filterAndPaginate(dataset, params) {
        let filtered = [...dataset];

        // Search: case-insensitive match across all string fields
        const search = params.get('search');
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(function (item) {
                return Object.values(item).some(function (val) {
                    if (typeof val === 'string') return val.toLowerCase().includes(q);
                    if (Array.isArray(val)) return val.some(function (v) { return typeof v === 'string' && v.toLowerCase().includes(q); });
                    return false;
                });
            });
        }

        // Apply key=value filters (skip pagination and sort params)
        const reserved = new Set(['page', 'per_page', 'search', 'sort', 'order', 'limit']);
        for (const [key, value] of params.entries()) {
            if (reserved.has(key) || !value) continue;
            filtered = filtered.filter(function (item) {
                const fieldVal = item[key];
                if (fieldVal == null) return false;
                if (typeof fieldVal === 'string') return fieldVal.toLowerCase() === value.toLowerCase();
                if (typeof fieldVal === 'number') return String(fieldVal) === value;
                return false;
            });
        }

        // Sort
        const sortField = params.get('sort');
        const sortOrder = params.get('order') || 'asc';
        if (sortField) {
            filtered.sort(function (a, b) {
                const aVal = a[sortField];
                const bVal = b[sortField];
                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;
                let cmp = 0;
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    cmp = aVal - bVal;
                } else {
                    cmp = String(aVal).localeCompare(String(bVal), 'en');
                }
                return sortOrder === 'desc' ? -cmp : cmp;
            });
        }

        const total = filtered.length;
        const page = parseInt(params.get('page'), 10) || 1;
        const perPage = parseInt(params.get('per_page'), 10) || 25;
        const start = (page - 1) * perPage;
        const data = filtered.slice(start, start + perPage);

        return { data: data, total: total };
    }

    // Helper: filter invoices for totals calculation (without pagination)
    function filterInvoicesForTotals(params) {
        let filtered = [...invoices];
        const search = params.get('search');
        if (search) {
            const q = search.toLowerCase();
            filtered = filtered.filter(function (item) {
                return Object.values(item).some(function (val) {
                    return typeof val === 'string' && val.toLowerCase().includes(q);
                });
            });
        }
        const reserved = new Set(['page', 'per_page', 'search', 'sort', 'order', 'limit']);
        for (const [key, value] of params.entries()) {
            if (reserved.has(key) || !value) continue;
            filtered = filtered.filter(function (item) {
                const fieldVal = item[key];
                if (fieldVal == null) return false;
                if (typeof fieldVal === 'string') return fieldVal.toLowerCase() === value.toLowerCase();
                if (typeof fieldVal === 'number') return String(fieldVal) === value;
                return false;
            });
        }
        return filtered;
    }

    // ========================================================================
    // Compute dashboard data from the datasets
    // ========================================================================
    function buildDashboard() {
        const totalProperties = properties.length;
        const propertiesByStatus = [];
        const statusCounts = {};
        properties.forEach(function (a) {
            statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
        });
        for (const [status, count] of Object.entries(statusCounts)) {
            propertiesByStatus.push({ status: status, count: count });
        }

        // Financial totals from income invoices only
        const incomeInvoices = invoices.filter(function (c) { return c.type === 'income'; });
        const totalInvoiced = incomeInvoices.reduce(function (s, c) { return s + c.total; }, 0);
        const totalCollected = incomeInvoices.reduce(function (s, c) { return s + c.paid; }, 0);
        const totalOutstanding = totalInvoiced - totalCollected;
        const pendingCount = incomeInvoices.filter(function (c) { return c.status === 'Unpaid' || c.status === 'Partial'; }).length;
        const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 1000) / 10 : 0;

        // Overdue invoices: unpaid or partial income, older than 15 days
        const fifteenDaysAgo = new Date(_now);
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        const overdueInvoices = invoices.filter(function (c) {
            return (c.status === 'Unpaid' || c.status === 'Partial') &&
                c.type === 'income' &&
                new Date(c.invoice_date) < fifteenDaysAgo;
        });

        // Expiring leases: contracts ending within 90 days
        const ninetyDaysFromNow = new Date(_now);
        ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
        const expiringLeases = properties.filter(function (a) {
            return a.end_date && new Date(a.end_date) <= ninetyDaysFromNow && a.status === 'Rented';
        });

        // Recent activity from audit
        const recentActivity = auditEntries.slice(0, 5);

        // Financial by payee
        const byPayee = {};
        incomeInvoices.forEach(function (c) {
            const key = c.payee;
            if (!byPayee[key]) {
                byPayee[key] = { payee: key, total_invoiced: 0, total_collected: 0, total_outstanding: 0, num_properties: 0, _properties_set: {} };
            }
            byPayee[key].total_invoiced += c.total;
            byPayee[key].total_collected += c.paid;
            byPayee[key].total_outstanding += (c.total - c.paid);
            if (c.property_name) byPayee[key]._properties_set[c.property_name] = true;
        });
        const financialByPayee = Object.values(byPayee).map(function (r) {
            r.num_properties = Object.keys(r._properties_set).length;
            delete r._properties_set;
            return r;
        });

        // Financial by property
        const byProperty = {};
        incomeInvoices.forEach(function (c) {
            const key = c.property_name;
            if (!byProperty[key]) {
                byProperty[key] = { property_name: key, total_invoiced: 0, total_collected: 0, total_outstanding: 0, num_invoices: 0 };
            }
            byProperty[key].total_invoiced += c.total;
            byProperty[key].total_collected += c.paid;
            byProperty[key].total_outstanding += (c.total - c.paid);
            byProperty[key].num_invoices += 1;
        });
        const financialByProperty = Object.values(byProperty);

        // Active contracts and monthly rent
        const activeContracts = contracts.filter(function (c) { return c.status === 'Active'; });
        const numActiveContracts = activeContracts.length;
        const totalMonthlyRent = activeContracts.reduce(function (s, c) { return s + (c.rent || 0); }, 0);

        // Month summary: income invoices for current month
        var now = new Date(_now);
        var monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        var monthInvoices = incomeInvoices.filter(function (c) {
            return new Date(c.invoice_date) >= monthStart;
        });
        var monthSummary = {
            total_invoiced: monthInvoices.reduce(function (s, c) { return s + c.total; }, 0),
            total_collected: monthInvoices.reduce(function (s, c) { return s + c.paid; }, 0),
            total_outstanding: monthInvoices.reduce(function (s, c) { return s + (c.total - c.paid); }, 0),
            num_invoices: monthInvoices.length
        };

        // Year summary: income invoices for current year
        var yearStart = new Date(now.getFullYear(), 0, 1);
        var yearInvoices = incomeInvoices.filter(function (c) {
            return new Date(c.invoice_date) >= yearStart;
        });
        var yearSummary = {
            total_invoiced: yearInvoices.reduce(function (s, c) { return s + c.total; }, 0),
            total_collected: yearInvoices.reduce(function (s, c) { return s + c.paid; }, 0),
            total_outstanding: yearInvoices.reduce(function (s, c) { return s + (c.total - c.paid); }, 0),
            num_invoices: yearInvoices.length
        };

        return {
            total_properties: totalProperties,
            total_invoiced: totalInvoiced,
            total_collected: totalCollected,
            total_outstanding: totalOutstanding,
            pending_count: pendingCount,
            collection_rate: collectionRate,
            properties_by_status: propertiesByStatus,
            overdue_invoices: overdueInvoices,
            overdue_count: overdueInvoices.length,
            expiring_leases: expiringLeases,
            recent_activity: recentActivity,
            financial_by_payee: financialByPayee,
            financial_by_property: financialByProperty,
            num_active_contracts: numActiveContracts,
            total_monthly_rent: totalMonthlyRent,
            month_summary: monthSummary,
            year_summary: yearSummary
        };
    }

    // ========================================================================
    // Compute reports
    // ========================================================================
    function buildOverdue() {
        const unpaid = invoices.filter(function (c) {
            return (c.status === 'Unpaid' || c.status === 'Partial') && c.type === 'income';
        });
        const groups = {};
        unpaid.forEach(function (c) {
            const key = c.payer + '||' + c.property_name;
            if (!groups[key]) {
                groups[key] = {
                    payer: c.payer,
                    property_name: c.property_name,
                    total_owed: 0,
                    num_invoices: 0,
                    oldest_date: c.invoice_date,
                    days_overdue: 0
                };
            }
            groups[key].total_owed += (c.total - c.paid);
            groups[key].num_invoices += 1;
            if (c.invoice_date < groups[key].oldest_date) {
                groups[key].oldest_date = c.invoice_date;
            }
        });
        return Object.values(groups).map(function (g) {
            g.days_overdue = Math.floor((_now - new Date(g.oldest_date)) / 86400000);
            return g;
        });
    }

    function buildProfitability() {
        const byProperty = {};
        invoices.forEach(function (c) {
            const key = c.property_name;
            if (!byProperty[key]) {
                byProperty[key] = { property_name: key, total_income: 0, total_expenses: 0, net: 0, margin_pct: 0 };
            }
            if (c.type === 'income') {
                byProperty[key].total_income += c.paid;
            } else {
                byProperty[key].total_expenses += c.total;
            }
        });
        return Object.values(byProperty).map(function (r) {
            r.net = r.total_income - r.total_expenses;
            r.margin_pct = r.total_income > 0 ? Math.round((r.net / r.total_income) * 1000) / 10 : 0;
            return r;
        });
    }

    // ========================================================================
    // Build property detail
    // ========================================================================
    function buildPropertyDetail(id) {
        const property = properties.find(function (a) { return a.id === id; });
        if (!property) return null;

        const propInvoices = invoices.filter(function (c) { return c.property_name === property.property_name; });
        const incomeInvoices = propInvoices.filter(function (c) { return c.type === 'income'; });
        const totalInvoiced = incomeInvoices.reduce(function (s, c) { return s + c.total; }, 0);
        const totalCollected = incomeInvoices.reduce(function (s, c) { return s + c.paid; }, 0);
        const totalOutstanding = totalInvoiced - totalCollected;

        return {
            property: property,
            financial: {
                total_invoiced: totalInvoiced,
                total_collected: totalCollected,
                total_outstanding: totalOutstanding
            },
            invoices: propInvoices,
            images: getPropertyImages(property.id)
        };
    }

    // Property-specific image sets
    function getPropertyImages(propertyId) {
        var imageMap = {};
        // King Street - residential flat, city centre
        imageMap[IDS.properties[0]] = [
            { url: '/files/images/property-placeholder-7.jpg', filename: 'exterior.jpg' },
            { url: '/files/images/property-placeholder-2.jpg', filename: 'lounge.jpg' }
        ];
        // Royal Crescent - premium residential
        imageMap[IDS.properties[1]] = [
            { url: '/files/images/property-placeholder-5.jpg', filename: 'exterior.jpg' },
            { url: '/files/images/property-placeholder-6.jpg', filename: 'living-room.jpg' }
        ];
        // Commercial Road - commercial office
        imageMap[IDS.properties[2]] = [
            { url: '/files/images/property-placeholder-3.jpg', filename: 'exterior.jpg' },
            { url: '/files/images/property-placeholder-4.jpg', filename: 'interior.jpg' }
        ];
        // Palm Grove - premium Kensington house
        imageMap[IDS.properties[3]] = [
            { url: '/files/images/property-placeholder-8.jpg', filename: 'exterior.jpg' },
            { url: '/files/images/property-placeholder-9.jpg', filename: 'living-room.jpg' },
            { url: '/files/images/property-placeholder-6.jpg', filename: 'kitchen.jpg' }
        ];
        // Serpentine Walk - under renovation
        imageMap[IDS.properties[4]] = [
            { url: '/files/images/property-placeholder-7.jpg', filename: 'exterior.jpg' }
        ];
        // Diagonal Avenue - standard residential flat
        imageMap[IDS.properties[5]] = [
            { url: '/files/images/property-placeholder-7.jpg', filename: 'exterior.jpg' },
            { url: '/files/images/property-placeholder-2.jpg', filename: 'lounge.jpg' }
        ];
        // Meadow Lane - premium penthouse
        imageMap[IDS.properties[6]] = [
            { url: '/files/images/property-placeholder-1.jpg', filename: 'exterior.jpg' },
            { url: '/files/images/property-placeholder-9.jpg', filename: 'living-room.jpg' },
            { url: '/files/images/property-placeholder-6.jpg', filename: 'open-plan.jpg' }
        ];
        // Northern Industrial Park - commercial/industrial
        imageMap[IDS.properties[7]] = [
            { url: '/files/images/property-placeholder-10.jpg', filename: 'exterior.jpg' },
            { url: '/files/images/property-placeholder-3.jpg', filename: 'commercial-area.jpg' }
        ];
        return imageMap[propertyId] || [
            { url: '/files/images/property-placeholder-1.jpg', filename: 'exterior.jpg' },
            { url: '/files/images/property-placeholder-2.jpg', filename: 'interior.jpg' }
        ];
    }

    // ========================================================================
    // Build contract detail
    // ========================================================================
    function buildContractDetail(id) {
        const contract = contracts.find(function (c) { return c.id === id; });
        if (!contract) return null;

        // Determine rent review clause based on contract tags
        var reviewClause = 'Annual per CPI';
        var depositMonths = 2;
        if (contract.tags.indexOf('Commercial') >= 0 || contract.tags.indexOf('5-Year') >= 0) {
            reviewClause = 'Triennial open-market review';
            depositMonths = 3;
        } else if (contract.tags.indexOf('3-Year') >= 0) {
            reviewClause = 'Annual per CPI + 1%';
            depositMonths = 2;
        } else if (contract.tags.indexOf('Biennial') >= 0) {
            reviewClause = 'Biennial per CPI';
            depositMonths = 2;
        } else if (contract.tags.indexOf('6-Month') >= 0) {
            reviewClause = 'Fixed for term';
            depositMonths = 1;
        }

        return {
            contract: contract,
            documents: [
                {
                    id: uuid(),
                    name: 'Tenancy agreement',
                    type: 'Contract',
                    document_date: contract.start_date,
                    has_text: true,
                    notes: 'Signed by both parties'
                }
            ],
            details: [
                {
                    category: 'price',
                    label: 'Monthly rent',
                    value: contract.rent + ' EUR/month',
                    numeric_value: contract.rent,
                    start_date: contract.start_date,
                    end_date: contract.end_date
                },
                {
                    category: 'review',
                    label: 'Rent review',
                    value: reviewClause,
                    numeric_value: null,
                    start_date: contract.start_date,
                    end_date: contract.end_date
                },
                {
                    category: 'deposit',
                    label: 'Deposit',
                    value: depositMonths + ' months rent',
                    numeric_value: contract.rent * depositMonths,
                    start_date: contract.start_date,
                    end_date: contract.end_date
                }
            ]
        };
    }

    // ========================================================================
    // Build invoice PDF HTML
    // ========================================================================
    function buildInvoicePdfHtml(invoiceData) {
        const outstanding = invoiceData.total - invoiceData.paid;
        const statusClass = invoiceData.status === 'Paid' ? 'paid' : invoiceData.status === 'Partial' ? 'partial' : 'unpaid';
        return '<!DOCTYPE html><html><head><style>' +
            'body{font-family:Arial,sans-serif;font-size:13px;color:#333;margin:0;padding:40px}' +
            '.header{border-bottom:3px solid #2B4C7E;padding-bottom:20px;margin-bottom:30px;overflow:hidden}' +
            '.header h1{float:right;color:#2B4C7E;font-size:28px;text-transform:uppercase;letter-spacing:2px}' +
            '.brand{float:left;font-size:24px;font-weight:700;color:#2B4C7E}' +
            '.ref{color:#666;font-size:14px;float:right;clear:right}' +
            '.parties{overflow:hidden;margin-bottom:30px}' +
            '.party{width:48%;float:left}.party.right{float:right}' +
            '.party-label{font-size:10px;font-weight:700;text-transform:uppercase;color:#2B4C7E;border-bottom:1px solid #eee;padding-bottom:5px;margin-bottom:8px}' +
            '.party-name{font-size:15px;font-weight:700;margin-bottom:4px}' +
            'table{width:100%;border-collapse:collapse;margin-bottom:20px}' +
            'thead th{background:#2B4C7E;color:#fff;padding:10px;text-align:left;font-size:11px;text-transform:uppercase}' +
            'tbody td{padding:12px 10px;border-bottom:1px solid #eee}' +
            '.amount{text-align:right;font-weight:600}' +
            '.totals{float:right;width:280px}' +
            '.totals td{padding:6px 10px}.totals .total-row td{font-size:18px;font-weight:800;color:#2B4C7E;border-top:3px solid #2B4C7E;padding-top:12px}' +
            '.status{display:inline-block;padding:3px 10px;border-radius:10px;font-size:11px;font-weight:700;text-transform:uppercase}' +
            '.status-paid{background:#E8F5E9;color:#2E7D32}' +
            '.status-partial{background:#FFF3E0;color:#E65100}' +
            '.status-unpaid{background:#FBE9E7;color:#C62828}' +
            '.footer{text-align:center;border-top:1px solid #eee;padding-top:20px;margin-top:40px;font-size:10px;color:#999}' +
            '</style></head><body>' +
            '<div class="header"><span class="brand">Proplia</span><h1>Invoice</h1><div class="ref">' + invoiceData.reference + '</div></div>' +
            '<div class="parties">' +
            '<div class="party"><div class="party-label">From (Issuer)</div><div class="party-name">' + invoiceData.payee + '</div></div>' +
            '<div class="party right"><div class="party-label">To (Recipient)</div><div class="party-name">' + invoiceData.payer + '</div></div>' +
            '</div>' +
            '<table><thead><tr><th>Description</th><th class="amount">Subtotal</th><th class="amount">VAT</th><th class="amount">Amount</th></tr></thead>' +
            '<tbody><tr><td>' + invoiceData.description + '</td><td class="amount">' + invoiceData.total.toFixed(2) + ' EUR</td><td class="amount">' + invoiceData.vat.toFixed(2) + ' EUR</td><td class="amount">' + invoiceData.total.toFixed(2) + ' EUR</td></tr></tbody></table>' +
            '<div style="overflow:hidden"><table class="totals">' +
            '<tr><td>Subtotal</td><td class="amount">' + invoiceData.total.toFixed(2) + ' EUR</td></tr>' +
            '<tr><td>VAT</td><td class="amount">' + invoiceData.vat.toFixed(2) + ' EUR</td></tr>' +
            '<tr class="total-row"><td>Total</td><td class="amount">' + invoiceData.total.toFixed(2) + ' EUR</td></tr>' +
            '</table></div>' +
            '<div style="margin-top:20px"><strong>Status:</strong> <span class="status status-' + statusClass + '">' + invoiceData.status + '</span>' +
            ' &nbsp; <strong>Paid:</strong> ' + invoiceData.paid.toFixed(2) + ' EUR' +
            (outstanding > 0 ? ' &nbsp; <strong style="color:#C62828">Outstanding: ' + outstanding.toFixed(2) + ' EUR</strong>' : '') +
            '</div>' +
            '<div class="footer"><strong>Proplia</strong> &mdash; Property Management<br>Document generated automatically</div>' +
            '</body></html>';
    }

    // ========================================================================
    // JSON Response helper
    // ========================================================================
    function jsonResponse(data, status) {
        return new Response(JSON.stringify(data), {
            status: status || 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    function parseBody(init) {
        if (!init || !init.body) return {};
        try { return JSON.parse(init.body); } catch (e) { return {}; }
    }

    function addAuditEntry(action, entityType, entityId, oldValues, newValues, changedFields) {
        auditEntries.unshift({
            id: uuid(),
            entity_type: entityType,
            entity_id: entityId,
            action: action,
            old_values: oldValues || null,
            new_values: newValues || null,
            changed_fields: changedFields || [],
            created_at: new Date().toISOString()
        });
    }

    // ========================================================================
    // Collection map for CRUD routing
    // ========================================================================
    var collectionMap = {
        '/properties': properties,
        '/tenants': tenants,
        '/owners': owners,
        '/contracts': contracts,
        '/invoices': invoices,
        '/deposits': deposits,
        '/sepa-batches': sepa_batches,
        '/issues': issues,
        '/insurance': insurance,
        '/contacts': contacts,
        '/leads': leads,
        '/lead-notes': lead_notes
    };

    function resolveCollection(route) {
        if (collectionMap[route]) {
            return { collection: collectionMap[route], entityType: route.slice(1).replace(/-/g, '_') };
        }
        var match = route.match(/^(\/[^/]+)\/([^/]+)$/);
        if (match && collectionMap[match[1]]) {
            return { collection: collectionMap[match[1]], entityType: match[1].slice(1).replace(/-/g, '_'), id: match[2] };
        }
        return null;
    }

    // ========================================================================
    // Route matching and fetch override
    // ========================================================================
    const originalFetch = window.fetch;

    window.fetch = function (input, init) {
        const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : String(input));
        const method = (init && init.method) ? init.method.toUpperCase() : 'GET';

        // Only intercept /admin/api requests
        if (!url.includes('/admin/api')) {
            return originalFetch.apply(this, arguments);
        }

        // Parse the URL
        let urlObj;
        try {
            urlObj = new URL(url, window.location.origin);
        } catch (e) {
            return originalFetch.apply(this, arguments);
        }

        const pathname = urlObj.pathname;
        const params = urlObj.searchParams;

        // Strip the /admin/api prefix to get the route
        const route = pathname.replace(/^\/admin\/api/, '');

        // Small artificial delay to feel realistic
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve(routeRequest(route, params, method, url, init));
            }, 80 + Math.random() * 120);
        });
    };

    function routeRequest(route, params, method, originalUrl, init) {

        // ====================================================================
        // POST (create) — add new item to in-memory collection
        // ====================================================================
        if (method === 'POST') {
            var body = parseBody(init);
            var resolved = resolveCollection(route);

            if (!resolved) {
                return jsonResponse({ success: true, id: uuid() });
            }

            var newId = uuid();
            var now = new Date().toISOString();
            var newItem = Object.assign({}, body, {
                id: newId,
                created_at: now,
                updated_at: now
            });
            resolved.collection.push(newItem);

            var summaryFields = {};
            var keys = Object.keys(body);
            keys.slice(0, 4).forEach(function (k) { summaryFields[k] = body[k]; });
            addAuditEntry('create', resolved.entityType, newId, null, summaryFields, keys);

            return jsonResponse(newItem);
        }

        // ====================================================================
        // PUT (update) — merge fields into existing item
        // ====================================================================
        if (method === 'PUT') {
            var body = parseBody(init);
            var resolved = resolveCollection(route);

            if (!resolved || !resolved.id) {
                return jsonResponse({ success: true });
            }

            var idx = -1;
            for (var i = 0; i < resolved.collection.length; i++) {
                if (resolved.collection[i].id === resolved.id) { idx = i; break; }
            }

            if (idx === -1) {
                return jsonResponse({ error: 'Not found' }, 404);
            }

            var existing = resolved.collection[idx];
            var oldValues = {};
            var newValues = {};
            var changedFields = [];

            Object.keys(body).forEach(function (key) {
                if (key === 'id' || key === 'created_at') return;
                if (String(existing[key]) !== String(body[key])) {
                    oldValues[key] = existing[key];
                    newValues[key] = body[key];
                    changedFields.push(key);
                }
            });

            Object.keys(body).forEach(function (key) {
                if (key === 'id' || key === 'created_at') return;
                existing[key] = body[key];
            });
            existing.updated_at = new Date().toISOString();

            if (changedFields.length > 0) {
                addAuditEntry('update', resolved.entityType, resolved.id, oldValues, newValues, changedFields);
            }

            return jsonResponse(existing);
        }

        // ====================================================================
        // DELETE — remove item from in-memory collection
        // ====================================================================
        if (method === 'DELETE') {
            var resolved = resolveCollection(route);

            if (!resolved || !resolved.id) {
                return jsonResponse({ success: true });
            }

            var idx = -1;
            for (var i = 0; i < resolved.collection.length; i++) {
                if (resolved.collection[i].id === resolved.id) { idx = i; break; }
            }

            if (idx === -1) {
                return jsonResponse({ error: 'Not found' }, 404);
            }

            var removed = resolved.collection.splice(idx, 1)[0];
            var summaryFields = {};
            var keys = Object.keys(removed);
            keys.slice(0, 4).forEach(function (k) { summaryFields[k] = removed[k]; });
            addAuditEntry('delete', resolved.entityType, resolved.id, summaryFields, null, keys);

            return jsonResponse({ success: true });
        }

        // ====================================================================
        // GET routes
        // ====================================================================

        // Dashboard
        if (route === '/dashboard') {
            return jsonResponse(buildDashboard());
        }

        // --- Properties ---
        if (route === '/properties/names') {
            return jsonResponse(properties.map(function (a) { return a.property_name; }));
        }

        // --- Tenants names ---
        if (route === '/tenants/names') {
            return jsonResponse(tenants.map(function (t) { return t.name; }));
        }

        // --- Contacts names ---
        if (route === '/contacts/names') {
            return jsonResponse(contacts.map(function (c) { return { id: c.id, name: c.name }; }));
        }

        // Property images
        const imagesMatch = route.match(/^\/properties\/images\/(.+)$/);
        if (imagesMatch) {
            return jsonResponse(getPropertyImages(imagesMatch[1]));
        }

        // Property detail
        const propertyDetailMatch = route.match(/^\/properties\/([^/]+)\/detail$/);
        if (propertyDetailMatch) {
            const detail = buildPropertyDetail(propertyDetailMatch[1]);
            if (detail) return jsonResponse(detail);
            return jsonResponse({ error: 'Not found' }, 404);
        }

        // Single property
        const propertySingleMatch = route.match(/^\/properties\/([^/]+)$/);
        if (propertySingleMatch && propertySingleMatch[1] !== 'names' && propertySingleMatch[1] !== 'images') {
            const property = properties.find(function (a) { return a.id === propertySingleMatch[1]; });
            if (property) return jsonResponse(property);
            return jsonResponse({ error: 'Not found' }, 404);
        }

        // Properties list
        if (route === '/properties') {
            return jsonResponse(filterAndPaginate(properties, params));
        }

        // --- Contracts ---
        const contractDetailMatch = route.match(/^\/contracts\/([^/]+)\/detail$/);
        if (contractDetailMatch) {
            const detail = buildContractDetail(contractDetailMatch[1]);
            if (detail) return jsonResponse(detail);
            return jsonResponse({ error: 'Not found' }, 404);
        }

        if (route === '/contracts') {
            return jsonResponse(filterAndPaginate(contracts, params));
        }

        // --- Invoices ---
        if (route === '/invoices/payees') {
            const payees = [];
            const seen = {};
            invoices.forEach(function (c) {
                if (!seen[c.payee]) {
                    seen[c.payee] = true;
                    payees.push(c.payee);
                }
            });
            return jsonResponse(payees);
        }

        // Invoice PDF download
        const invoicePdfMatch = route.match(/^\/invoices\/([^/]+)\/pdf$/);
        if (invoicePdfMatch) {
            const invoiceData = invoices.find(function (c) { return c.id === invoicePdfMatch[1]; });
            if (invoiceData) {
                const html = buildInvoicePdfHtml(invoiceData);
                const blob = new Blob([html], { type: 'text/html' });
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = invoiceData.reference + '.html';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(blobUrl);
                return jsonResponse({ success: true, message: 'PDF download triggered' });
            }
            return jsonResponse({ error: 'Not found' }, 404);
        }

        if (route === '/invoices') {
            const result = filterAndPaginate(invoices, params);
            // Add totals for invoices
            const filteredAll = filterInvoicesForTotals(params);
            const totalSum = filteredAll.reduce(function (s, c) { return s + c.total; }, 0);
            const paidSum = filteredAll.reduce(function (s, c) { return s + c.paid; }, 0);
            result.totals = { total: totalSum, paid: paidSum };
            return jsonResponse(result);
        }

        // --- Tenants ---
        if (route === '/tenants') {
            return jsonResponse(filterAndPaginate(tenants, params));
        }

        // --- Owners ---
        if (route === '/owners') {
            return jsonResponse(filterAndPaginate(owners, params));
        }

        // --- Deposits ---
        if (route === '/deposits') {
            return jsonResponse(filterAndPaginate(deposits, params));
        }

        // --- SEPA Batches ---
        if (route === '/sepa-batches') {
            return jsonResponse(filterAndPaginate(sepa_batches, params));
        }

        // --- Issues ---
        if (route === '/issues') {
            return jsonResponse(filterAndPaginate(issues, params));
        }

        // --- Insurance ---
        if (route === '/insurance') {
            return jsonResponse(filterAndPaginate(insurance, params));
        }

        // --- Contacts ---
        if (route === '/contacts') {
            return jsonResponse(filterAndPaginate(contacts, params));
        }

        // --- Leads ---
        if (route === '/leads') {
            return jsonResponse(filterAndPaginate(leads, params));
        }

        // --- Lead Notes ---
        if (route.match(/^\/lead[-_]not(as|es)/)) {
            var leadIdParam = params.get('lead_id');
            var filtered = lead_notes;
            if (leadIdParam) {
                filtered = lead_notes.filter(function (n) { return n.lead_id === leadIdParam; });
            }
            return jsonResponse({ data: filtered, total: filtered.length });
        }

        // --- Alerts (mock) ---
        if (route === '/alerts') {
            return jsonResponse({
                data: [
                    { id: uuid(), type: 'overdue', message: 'Invoice INV-2024-009 is overdue', severity: 'high', created_at: daysAgo(2) },
                    { id: uuid(), type: 'expiring', message: 'Contract PALM GROVE 7 - THOMPSON expires in 6 months', severity: 'medium', created_at: daysAgo(1) },
                    { id: uuid(), type: 'maintenance', message: 'Water leak at 14 King Street requires attention', severity: 'high', created_at: daysAgo(3) }
                ],
                total: 3
            });
        }

        // --- Reports ---
        if (route === '/reports/overdue') {
            return jsonResponse(buildOverdue());
        }

        if (route === '/reports/profitability') {
            return jsonResponse(buildProfitability());
        }

        // --- Audit ---
        if (route === '/audit/recent') {
            const limit = parseInt(params.get('limit'), 10) || 500;
            return jsonResponse(auditEntries.slice(0, limit));
        }

        const auditEntityMatch = route.match(/^\/audit\/([^/]+)\/([^/]+)$/);
        if (auditEntityMatch) {
            const entityType = auditEntityMatch[1];
            const entityId = auditEntityMatch[2];
            const entries = auditEntries.filter(function (e) {
                return e.entity_type === entityType && e.entity_id === entityId;
            });
            return jsonResponse(entries);
        }

        // --- Export (CSV) ---
        if (route.startsWith('/export/')) {
            return new Response('', {
                status: 200,
                headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="export.csv"' }
            });
        }

        // --- Contract documents text ---
        const docTextMatch = route.match(/^\/contract_documents\/([^/]+)\/text$/);
        if (docTextMatch) {
            return jsonResponse({
                id: docTextMatch[1],
                name: 'Tenancy agreement',
                content: 'ASSURED SHORTHOLD TENANCY AGREEMENT\n\nIn accordance with the Housing Act 1988...\n\n[Sample document content for demo purposes]'
            });
        }

        // --- Single entity by ID (generic /v1/:entity/:id) ---
        const entitySingleMatch = route.match(/^\/([^/]+)\/([^/]+)$/);
        if (entitySingleMatch) {
            const entityName = entitySingleMatch[1];
            const entityId = entitySingleMatch[2];
            const collections = {
                properties: properties,
                contracts: contracts,
                invoices: invoices,
                tenants: tenants,
                owners: owners,
                deposits: deposits,
                'sepa-batches': sepa_batches,
                issues: issues,
                insurance: insurance,
                contacts: contacts,
                leads: leads
            };
            const collection = collections[entityName];
            if (collection) {
                const item = collection.find(function (i) { return i.id === entityId; });
                if (item) return jsonResponse(item);
                return jsonResponse({ error: 'Not found' }, 404);
            }
        }

        // --- Fallback: pass through to real fetch ---
        return originalFetch(originalUrl);
    }

    // Signal that demo mode is active
    window.__DEMO_MOCK_ACTIVE__ = true;

    console.log('%c[Demo Mode] API mock active — all data is simulated', 'color: #f59e0b; font-weight: bold;');
})();
