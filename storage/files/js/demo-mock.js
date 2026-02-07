/**
 * Demo Mock API - Property Management
 * Intercepts window.fetch to simulate a REST API with realistic Spanish property data.
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
        activos: [
            'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
            'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
            'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
            'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f80',
            'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8091',
            'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f809102',
            '07b8c9d0-e1f2-4a3b-4c5d-6e7f80910213',
            '18c9d0e1-f2a3-4b4c-5d6e-7f8091021324'
        ],
        inquilinos: [
            '21d0e1f2-a3b4-4c5d-6e7f-809102132435',
            '32e1f2a3-b4c5-4d6e-7f80-910213243546',
            '43f2a3b4-c5d6-4e7f-8091-021324354657',
            '54a3b4c5-d6e7-4f80-9102-132435465768',
            '65b4c5d6-e7f8-4091-0213-243546576879',
            '76c5d6e7-f809-4102-1324-35465768798a'
        ],
        propietarios: [
            '87d6e7f8-0910-4213-2435-46576879809b',
            '98e7f809-1021-4324-3546-5768798a90ac',
            'a9f80910-2132-4435-4657-68798a9bacbd',
            'ba091021-3243-4546-5768-798a9bacbdce',
            'cb1a2b3c-4d5e-4f60-7182-93a4b5c6d7e8',
            'dc2b3c4d-5e6f-4071-8293-a4b5c6d7e8f9'
        ],
        contratos: [
            'cb102132-4354-4657-6879-8a9bacbdcedf',
            'dc213243-5465-4768-798a-9bacbdcedfe0',
            'ed324354-6576-4879-8a9b-acbdcedfe0f1',
            'fe435465-7687-4980-9bac-bdcedfe0f102',
            '0f546576-8798-4a91-acbd-cedfe0f10213',
            '1a657687-9809-4ba2-bcde-f0f102132435',
            '2b768798-a910-4cb3-cdef-010213243546'
        ],
        contabilidad: [],
        depositos: [
            '105a6b7c-8d9e-4f01-a2b3-c4d5e6f70819',
            '216b7c8d-9e0f-4012-b3c4-d5e6f7081920',
            '327c8d9e-0f01-4123-c4d5-e6f708192031',
            '438d9e0a-1012-4234-d5e6-a70819203142',
            '549e0f0b-2123-4345-e6f7-b81920314253',
            '65af010c-3234-4456-f708-c92031425364'
        ],
        remesas: [
            '438d9e0f-0112-4234-d5e6-f70819203142',
            '549e0f01-1223-4345-e6f7-081920314253',
            '65af0102-a334-4456-a708-192031425364',
            '76b01213-b445-4567-b819-203142536475',
            '87c12324-c556-4678-c920-314253647586',
            '98d23435-d667-4789-d031-425364758697'
        ],
        incidencias: [
            '65af0102-2334-4456-f708-192031425364',
            '76b01213-3445-4567-0819-203142536475',
            '87c12324-4556-4678-1920-314253647586',
            '98d23435-5667-4789-2031-425364758697',
            'a9e34546-6778-4890-3142-536475869708',
            'baf45657-7889-4901-4253-647586970819'
        ]
    };

    // Generate 15 invoice IDs
    for (let i = 0; i < 15; i++) {
        IDS.contabilidad.push(uuid());
    }

    // ========================================================================
    // Properties (Activos)
    // ========================================================================
    const activos = [
        {
            id: IDS.activos[0],
            activo: 'Piso Calle Mayor 15, 3B',
            direccion: 'Calle Mayor 15, 3B, 28013 Madrid',
            contrato: 'CALLE MAYOR 15 - GARCIA',
            estado: 'Alquilado',
            alquiler: 850,
            fecha_inicio: monthsAgo(14),
            fecha_fin: monthsFromNow(10),
            etiquetas: ['Residencial', 'Centro'],
            imagen_carpeta: 'calle-mayor-15',
            created_at: monthsAgo(18),
            updated_at: daysAgo(5)
        },
        {
            id: IDS.activos[1],
            activo: 'Apartamento Paseo de Gracia 42',
            direccion: 'Paseo de Gracia 42, 2A, 08007 Barcelona',
            contrato: 'GRACIA 42 - MARTINEZ',
            estado: 'Alquilado',
            alquiler: 1200,
            fecha_inicio: monthsAgo(10),
            fecha_fin: monthsFromNow(14),
            etiquetas: ['Residencial', 'Premium'],
            imagen_carpeta: 'gracia-42',
            created_at: monthsAgo(12),
            updated_at: daysAgo(3)
        },
        {
            id: IDS.activos[2],
            activo: 'Local Comercial Gran Via 8',
            direccion: 'Gran Via 8, Bajo, 46002 Valencia',
            contrato: '',
            estado: 'Libre',
            alquiler: 950,
            fecha_inicio: null,
            fecha_fin: null,
            etiquetas: ['Comercial'],
            imagen_carpeta: 'gran-via-8',
            created_at: monthsAgo(24),
            updated_at: daysAgo(15)
        },
        {
            id: IDS.activos[3],
            activo: 'Villa Urbanizacion Las Palmeras 7',
            direccion: 'Urbanizacion Las Palmeras 7, 29660 Marbella',
            contrato: 'LAS PALMERAS 7 - FERNANDEZ',
            estado: 'Alquilado',
            alquiler: 2100,
            fecha_inicio: monthsAgo(18),
            fecha_fin: monthsFromNow(6),
            etiquetas: ['Residencial', 'Premium', 'Costa'],
            imagen_carpeta: 'las-palmeras-7',
            created_at: monthsAgo(20),
            updated_at: daysAgo(7)
        },
        {
            id: IDS.activos[4],
            activo: 'Estudio Calle Sierpes 22',
            direccion: 'Calle Sierpes 22, 1C, 41004 Sevilla',
            contrato: '',
            estado: 'En reforma',
            alquiler: 550,
            fecha_inicio: null,
            fecha_fin: null,
            etiquetas: ['Residencial', 'Reforma'],
            imagen_carpeta: 'sierpes-22',
            created_at: monthsAgo(15),
            updated_at: daysAgo(2)
        },
        {
            id: IDS.activos[5],
            activo: 'Piso Avenida Diagonal 156',
            direccion: 'Avenida Diagonal 156, 4B, 08018 Barcelona',
            contrato: 'DIAGONAL 156 - LOPEZ',
            estado: 'Alquilado',
            alquiler: 1400,
            fecha_inicio: monthsAgo(8),
            fecha_fin: monthsFromNow(16),
            etiquetas: ['Residencial'],
            imagen_carpeta: 'diagonal-156',
            created_at: monthsAgo(10),
            updated_at: daysAgo(4)
        },
        {
            id: IDS.activos[6],
            activo: 'Atico Paseo del Prado 30',
            direccion: 'Paseo del Prado 30, Atico, 28014 Madrid',
            contrato: 'PRADO 30 - RUIZ',
            estado: 'Alquilado',
            alquiler: 1850,
            fecha_inicio: monthsAgo(12),
            fecha_fin: monthsFromNow(12),
            etiquetas: ['Residencial', 'Premium', 'Centro'],
            imagen_carpeta: 'prado-30',
            created_at: monthsAgo(14),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.activos[7],
            activo: 'Nave Industrial Poligono Norte 3',
            direccion: 'Poligono Industrial Norte, Parcela 3, 50014 Zaragoza',
            contrato: '',
            estado: 'Libre',
            alquiler: 1600,
            fecha_inicio: null,
            fecha_fin: null,
            etiquetas: ['Industrial'],
            imagen_carpeta: 'poligono-norte-3',
            created_at: monthsAgo(22),
            updated_at: daysAgo(20)
        }
    ];

    // ========================================================================
    // Tenants (Inquilinos)
    // ========================================================================
    const inquilinos = [
        {
            id: IDS.inquilinos[0],
            nombre: 'Ana Garcia Lopez',
            identificacion: '12345678A',
            email: 'ana.garcia@email.com',
            telefono: '+34 612 345 678',
            direccion: 'Calle Mayor 15, 3B, 28013 Madrid',
            banco: 'ES91 2100 0418 4502 0005 1332',
            activo: 'Piso Calle Mayor 15, 3B',
            direccion_activo: 'Calle Mayor 15, 3B, 28013 Madrid',
            es_antiguo: false,
            created_at: monthsAgo(14),
            updated_at: daysAgo(5)
        },
        {
            id: IDS.inquilinos[1],
            nombre: 'Carlos Martinez Ruiz',
            identificacion: '23456789B',
            email: 'carlos.martinez@email.com',
            telefono: '+34 623 456 789',
            direccion: 'Paseo de Gracia 42, 2A, 08007 Barcelona',
            banco: 'ES79 2100 0813 6102 0008 4567',
            activo: 'Apartamento Paseo de Gracia 42',
            direccion_activo: 'Paseo de Gracia 42, 2A, 08007 Barcelona',
            es_antiguo: false,
            created_at: monthsAgo(10),
            updated_at: daysAgo(3)
        },
        {
            id: IDS.inquilinos[2],
            nombre: 'Elena Fernandez Torres',
            identificacion: '34567890C',
            email: 'elena.fernandez@email.com',
            telefono: '+34 634 567 890',
            direccion: 'Urbanizacion Las Palmeras 7, 29660 Marbella',
            banco: 'ES68 0049 1500 0512 1106 7890',
            activo: 'Villa Urbanizacion Las Palmeras 7',
            direccion_activo: 'Urbanizacion Las Palmeras 7, 29660 Marbella',
            es_antiguo: false,
            created_at: monthsAgo(18),
            updated_at: daysAgo(7)
        },
        {
            id: IDS.inquilinos[3],
            nombre: 'Miguel Lopez Sanchez',
            identificacion: '45678901D',
            email: 'miguel.lopez@email.com',
            telefono: '+34 645 678 901',
            direccion: 'Avenida Diagonal 156, 4B, 08018 Barcelona',
            banco: 'ES17 0081 0200 6100 0134 5678',
            activo: 'Piso Avenida Diagonal 156',
            direccion_activo: 'Avenida Diagonal 156, 4B, 08018 Barcelona',
            es_antiguo: false,
            created_at: monthsAgo(8),
            updated_at: daysAgo(4)
        },
        {
            id: IDS.inquilinos[4],
            nombre: 'Lucia Ruiz Moreno',
            identificacion: '56789012E',
            email: 'lucia.ruiz@email.com',
            telefono: '+34 656 789 012',
            direccion: 'Paseo del Prado 30, Atico, 28014 Madrid',
            banco: 'ES23 0182 3140 4800 2013 4567',
            activo: 'Atico Paseo del Prado 30',
            direccion_activo: 'Paseo del Prado 30, Atico, 28014 Madrid',
            es_antiguo: false,
            created_at: monthsAgo(12),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.inquilinos[5],
            nombre: 'Pablo Navarro Gil',
            identificacion: '67890123F',
            email: 'pablo.navarro@email.com',
            telefono: '+34 667 890 123',
            direccion: 'Calle Serrano 88, 2A, 28006 Madrid',
            banco: 'ES56 0075 0001 8506 0012 3456',
            activo: '',
            direccion_activo: '',
            es_antiguo: true,
            created_at: monthsAgo(24),
            updated_at: monthsAgo(6)
        }
    ];

    // ========================================================================
    // Owners (Propietarios)
    // ========================================================================
    const propietarios = [
        {
            id: IDS.propietarios[0],
            nombre: 'Inmobiliaria Horizonte S.L.',
            identificacion: 'B12345678',
            email: 'admin@horizonte-inmobiliaria.es',
            telefono: '+34 911 234 567',
            direccion: 'Calle Velazquez 50, 28001 Madrid',
            banco: 'ES91 2100 0418 4502 0005 1332',
            activo: 'Piso Calle Mayor 15, 3B / Atico Paseo del Prado 30',
            direccion_activo: 'Madrid',
            created_at: monthsAgo(24),
            updated_at: daysAgo(10)
        },
        {
            id: IDS.propietarios[1],
            nombre: 'Maria Josefa Rodriguez Perez',
            identificacion: '11223344A',
            email: 'mjrodriguez@email.com',
            telefono: '+34 622 334 455',
            direccion: 'Calle Balmes 120, 08008 Barcelona',
            banco: 'ES79 2100 0813 6102 0008 4567',
            activo: 'Apartamento Paseo de Gracia 42 / Piso Avenida Diagonal 156',
            direccion_activo: 'Barcelona',
            created_at: monthsAgo(18),
            updated_at: daysAgo(8)
        },
        {
            id: IDS.propietarios[2],
            nombre: 'Inversiones Mediterraneo S.A.',
            identificacion: 'A87654321',
            email: 'contacto@invmed.es',
            telefono: '+34 961 876 543',
            direccion: 'Avenida del Puerto 22, 46023 Valencia',
            banco: 'ES68 0049 1500 0512 1106 7890',
            activo: 'Local Comercial Gran Via 8 / Villa Urbanizacion Las Palmeras 7 / Nave Industrial Poligono Norte 3',
            direccion_activo: 'Valencia / Marbella / Zaragoza',
            created_at: monthsAgo(24),
            updated_at: daysAgo(15)
        },
        {
            id: IDS.propietarios[3],
            nombre: 'Fernando Gutierrez Blanco',
            identificacion: '22334455B',
            email: 'fgutierrez@email.com',
            telefono: '+34 655 443 322',
            direccion: 'Calle Feria 90, 41003 Sevilla',
            banco: 'ES17 0081 0200 6100 0134 5678',
            activo: 'Estudio Calle Sierpes 22',
            direccion_activo: 'Sevilla',
            created_at: monthsAgo(15),
            updated_at: daysAgo(12)
        },
        {
            id: IDS.propietarios[4],
            nombre: 'Grupo Pirineos Inmobiliaria S.L.',
            identificacion: 'B50123456',
            email: 'info@grupopirineos.es',
            telefono: '+34 976 234 567',
            direccion: 'Paseo Independencia 18, 50001 Zaragoza',
            banco: 'ES34 2085 0100 1103 3012 3456',
            activo: 'Nave Industrial Poligono Norte 3',
            direccion_activo: 'Zaragoza',
            created_at: monthsAgo(20),
            updated_at: daysAgo(6)
        },
        {
            id: IDS.propietarios[5],
            nombre: 'Isabel Navarro Delgado',
            identificacion: '33445566C',
            email: 'inavarro@email.com',
            telefono: '+34 666 778 899',
            direccion: 'Calle Larios 5, 29015 Malaga',
            banco: 'ES56 0182 5740 4500 1023 4567',
            activo: 'Local Comercial Gran Via 8',
            direccion_activo: 'Valencia',
            created_at: monthsAgo(12),
            updated_at: daysAgo(9)
        }
    ];

    // ========================================================================
    // Contracts (Contratos)
    // ========================================================================
    const contratos = [
        {
            id: IDS.contratos[0],
            contrato: 'CALLE MAYOR 15 - GARCIA',
            activo: 'Piso Calle Mayor 15, 3B',
            direccion: 'Calle Mayor 15, 3B, 28013 Madrid',
            inquilino: 'Ana Garcia Lopez',
            estado: 'Activo',
            alquiler: 850,
            total: 850 * 12,
            fecha_inicio: monthsAgo(14),
            fecha_fin: monthsFromNow(10),
            etiquetas: ['Residencial', 'Anual'],
            doc_count: 2,
            created_at: monthsAgo(14),
            updated_at: daysAgo(5)
        },
        {
            id: IDS.contratos[1],
            contrato: 'GRACIA 42 - MARTINEZ',
            activo: 'Apartamento Paseo de Gracia 42',
            direccion: 'Paseo de Gracia 42, 2A, 08007 Barcelona',
            inquilino: 'Carlos Martinez Ruiz',
            estado: 'Activo',
            alquiler: 1200,
            total: 1200 * 12,
            fecha_inicio: monthsAgo(10),
            fecha_fin: monthsFromNow(14),
            etiquetas: ['Residencial', 'Anual'],
            doc_count: 1,
            created_at: monthsAgo(10),
            updated_at: daysAgo(3)
        },
        {
            id: IDS.contratos[2],
            contrato: 'LAS PALMERAS 7 - FERNANDEZ',
            activo: 'Villa Urbanizacion Las Palmeras 7',
            direccion: 'Urbanizacion Las Palmeras 7, 29660 Marbella',
            inquilino: 'Elena Fernandez Torres',
            estado: 'Activo',
            alquiler: 2100,
            total: 2100 * 12,
            fecha_inicio: monthsAgo(18),
            fecha_fin: monthsFromNow(6),
            etiquetas: ['Residencial', 'Anual', 'Premium'],
            doc_count: 3,
            created_at: monthsAgo(18),
            updated_at: daysAgo(7)
        },
        {
            id: IDS.contratos[3],
            contrato: 'DIAGONAL 156 - LOPEZ',
            activo: 'Piso Avenida Diagonal 156',
            direccion: 'Avenida Diagonal 156, 4B, 08018 Barcelona',
            inquilino: 'Miguel Lopez Sanchez',
            estado: 'Activo',
            alquiler: 1400,
            total: 1400 * 12,
            fecha_inicio: monthsAgo(8),
            fecha_fin: monthsFromNow(16),
            etiquetas: ['Residencial', 'Anual'],
            doc_count: 1,
            created_at: monthsAgo(8),
            updated_at: daysAgo(4)
        },
        {
            id: IDS.contratos[4],
            contrato: 'PRADO 30 - RUIZ',
            activo: 'Atico Paseo del Prado 30',
            direccion: 'Paseo del Prado 30, Atico, 28014 Madrid',
            inquilino: 'Lucia Ruiz Moreno',
            estado: 'Activo',
            alquiler: 1850,
            total: 1850 * 12,
            fecha_inicio: monthsAgo(12),
            fecha_fin: monthsFromNow(12),
            etiquetas: ['Residencial', 'Anual', 'Premium'],
            doc_count: 2,
            created_at: monthsAgo(12),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.contratos[5],
            contrato: 'GRAN VIA 8 - NAVARRO',
            activo: 'Local Comercial Gran Via 8',
            direccion: 'Gran Via 8, Bajo, 46007 Valencia',
            inquilino: 'Pedro Navarro Gil',
            estado: 'Activo',
            alquiler: 1600,
            total: 1600 * 12,
            fecha_inicio: monthsAgo(6),
            fecha_fin: monthsFromNow(18),
            etiquetas: ['Comercial', 'Anual'],
            doc_count: 1,
            created_at: monthsAgo(6),
            updated_at: daysAgo(10)
        },
        {
            id: IDS.contratos[6],
            contrato: 'SIERPES 22 - ROMERO',
            activo: 'Estudio Calle Sierpes 22',
            direccion: 'Calle Sierpes 22, 1A, 41004 Sevilla',
            inquilino: 'Sofia Romero Vega',
            estado: 'Iniciado',
            alquiler: 550,
            total: 550 * 12,
            fecha_inicio: monthsAgo(2),
            fecha_fin: monthsFromNow(10),
            etiquetas: ['Residencial', 'Anual'],
            doc_count: 1,
            created_at: monthsAgo(2),
            updated_at: daysAgo(2)
        }
    ];

    // ========================================================================
    // Invoices (Contabilidad) - 15 entries
    // ========================================================================
    const contabilidad = [
        // --- Rent invoices: Month -1 ---
        {
            id: IDS.contabilidad[0],
            referencia: 'FACT-2024-001',
            concepto: 'Alquiler mensual - Calle Mayor 15',
            contrato: 'CALLE MAYOR 15 - GARCIA',
            activo: 'Piso Calle Mayor 15, 3B',
            pagador: 'Ana Garcia Lopez',
            receptor: 'Inmobiliaria Horizonte S.L.',
            estado: 'Pagado',
            total: 850,
            pagado: 850,
            vat: 0,
            moneda: 'EUR',
            fecha: monthsAgo(1),
            fecha_de_pago: daysAgo(25),
            tipo: 'ingreso',
            tipo_gasto: null,
            notas: '',
            created_at: monthsAgo(1),
            updated_at: daysAgo(25)
        },
        {
            id: IDS.contabilidad[1],
            referencia: 'FACT-2024-002',
            concepto: 'Alquiler mensual - Paseo de Gracia 42',
            contrato: 'GRACIA 42 - MARTINEZ',
            activo: 'Apartamento Paseo de Gracia 42',
            pagador: 'Carlos Martinez Ruiz',
            receptor: 'Maria Josefa Rodriguez Perez',
            estado: 'Pagado',
            total: 1200,
            pagado: 1200,
            vat: 0,
            moneda: 'EUR',
            fecha: monthsAgo(1),
            fecha_de_pago: daysAgo(28),
            tipo: 'ingreso',
            tipo_gasto: null,
            notas: '',
            created_at: monthsAgo(1),
            updated_at: daysAgo(28)
        },
        {
            id: IDS.contabilidad[2],
            referencia: 'FACT-2024-003',
            concepto: 'Alquiler mensual - Las Palmeras 7',
            contrato: 'LAS PALMERAS 7 - FERNANDEZ',
            activo: 'Villa Urbanizacion Las Palmeras 7',
            pagador: 'Elena Fernandez Torres',
            receptor: 'Inversiones Mediterraneo S.A.',
            estado: 'Pagado',
            total: 2100,
            pagado: 2100,
            vat: 0,
            moneda: 'EUR',
            fecha: monthsAgo(1),
            fecha_de_pago: daysAgo(26),
            tipo: 'ingreso',
            tipo_gasto: null,
            notas: '',
            created_at: monthsAgo(1),
            updated_at: daysAgo(26)
        },
        {
            id: IDS.contabilidad[3],
            referencia: 'FACT-2024-004',
            concepto: 'Alquiler mensual - Diagonal 156',
            contrato: 'DIAGONAL 156 - LOPEZ',
            activo: 'Piso Avenida Diagonal 156',
            pagador: 'Miguel Lopez Sanchez',
            receptor: 'Maria Josefa Rodriguez Perez',
            estado: 'Pagado',
            total: 1400,
            pagado: 1400,
            vat: 0,
            moneda: 'EUR',
            fecha: monthsAgo(1),
            fecha_de_pago: daysAgo(24),
            tipo: 'ingreso',
            tipo_gasto: null,
            notas: '',
            created_at: monthsAgo(1),
            updated_at: daysAgo(24)
        },
        {
            id: IDS.contabilidad[4],
            referencia: 'FACT-2024-005',
            concepto: 'Alquiler mensual - Prado 30',
            contrato: 'PRADO 30 - RUIZ',
            activo: 'Atico Paseo del Prado 30',
            pagador: 'Lucia Ruiz Moreno',
            receptor: 'Inmobiliaria Horizonte S.L.',
            estado: 'Pagado',
            total: 1850,
            pagado: 1850,
            vat: 0,
            moneda: 'EUR',
            fecha: monthsAgo(1),
            fecha_de_pago: daysAgo(27),
            tipo: 'ingreso',
            tipo_gasto: null,
            notas: '',
            created_at: monthsAgo(1),
            updated_at: daysAgo(27)
        },
        // --- Rent invoices: Current month ---
        {
            id: IDS.contabilidad[5],
            referencia: 'FACT-2024-006',
            concepto: 'Alquiler mensual - Calle Mayor 15',
            contrato: 'CALLE MAYOR 15 - GARCIA',
            activo: 'Piso Calle Mayor 15, 3B',
            pagador: 'Ana Garcia Lopez',
            receptor: 'Inmobiliaria Horizonte S.L.',
            estado: 'Pagado',
            total: 850,
            pagado: 850,
            vat: 0,
            moneda: 'EUR',
            fecha: daysAgo(5),
            fecha_de_pago: daysAgo(3),
            tipo: 'ingreso',
            tipo_gasto: null,
            notas: '',
            created_at: daysAgo(5),
            updated_at: daysAgo(3)
        },
        {
            id: IDS.contabilidad[6],
            referencia: 'FACT-2024-007',
            concepto: 'Alquiler mensual - Paseo de Gracia 42',
            contrato: 'GRACIA 42 - MARTINEZ',
            activo: 'Apartamento Paseo de Gracia 42',
            pagador: 'Carlos Martinez Ruiz',
            receptor: 'Maria Josefa Rodriguez Perez',
            estado: 'Parcial',
            total: 1200,
            pagado: 600,
            vat: 0,
            moneda: 'EUR',
            fecha: daysAgo(5),
            fecha_de_pago: null,
            tipo: 'ingreso',
            tipo_gasto: null,
            notas: 'Pago parcial recibido, pendiente segunda mitad',
            created_at: daysAgo(5),
            updated_at: daysAgo(2)
        },
        {
            id: IDS.contabilidad[7],
            referencia: 'FACT-2024-008',
            concepto: 'Alquiler mensual - Las Palmeras 7',
            contrato: 'LAS PALMERAS 7 - FERNANDEZ',
            activo: 'Villa Urbanizacion Las Palmeras 7',
            pagador: 'Elena Fernandez Torres',
            receptor: 'Inversiones Mediterraneo S.A.',
            estado: 'Pagado',
            total: 2100,
            pagado: 2100,
            vat: 0,
            moneda: 'EUR',
            fecha: daysAgo(5),
            fecha_de_pago: daysAgo(4),
            tipo: 'ingreso',
            tipo_gasto: null,
            notas: '',
            created_at: daysAgo(5),
            updated_at: daysAgo(4)
        },
        {
            id: IDS.contabilidad[8],
            referencia: 'FACT-2024-009',
            concepto: 'Alquiler mensual - Diagonal 156',
            contrato: 'DIAGONAL 156 - LOPEZ',
            activo: 'Piso Avenida Diagonal 156',
            pagador: 'Miguel Lopez Sanchez',
            receptor: 'Maria Josefa Rodriguez Perez',
            estado: 'Sin pagar',
            total: 1400,
            pagado: 0,
            vat: 0,
            moneda: 'EUR',
            fecha: daysAgo(5),
            fecha_de_pago: null,
            tipo: 'ingreso',
            tipo_gasto: null,
            notas: 'Pendiente de cobro',
            created_at: daysAgo(5),
            updated_at: daysAgo(5)
        },
        {
            id: IDS.contabilidad[9],
            referencia: 'FACT-2024-010',
            concepto: 'Alquiler mensual - Prado 30',
            contrato: 'PRADO 30 - RUIZ',
            activo: 'Atico Paseo del Prado 30',
            pagador: 'Lucia Ruiz Moreno',
            receptor: 'Inmobiliaria Horizonte S.L.',
            estado: 'Pagado',
            total: 1850,
            pagado: 1850,
            vat: 0,
            moneda: 'EUR',
            fecha: daysAgo(5),
            fecha_de_pago: daysAgo(4),
            tipo: 'ingreso',
            tipo_gasto: null,
            notas: '',
            created_at: daysAgo(5),
            updated_at: daysAgo(4)
        },
        // --- Rent invoices: Month -2 (two older ones) ---
        {
            id: IDS.contabilidad[10],
            referencia: 'FACT-2024-011',
            concepto: 'Alquiler mensual - Diagonal 156',
            contrato: 'DIAGONAL 156 - LOPEZ',
            activo: 'Piso Avenida Diagonal 156',
            pagador: 'Miguel Lopez Sanchez',
            receptor: 'Maria Josefa Rodriguez Perez',
            estado: 'Parcial',
            total: 1400,
            pagado: 700,
            vat: 0,
            moneda: 'EUR',
            fecha: monthsAgo(2),
            fecha_de_pago: null,
            tipo: 'ingreso',
            tipo_gasto: null,
            notas: 'Pago parcial - pendiente desde hace 2 meses',
            created_at: monthsAgo(2),
            updated_at: monthsAgo(1)
        },
        {
            id: IDS.contabilidad[11],
            referencia: 'FACT-2024-012',
            concepto: 'Alquiler mensual - Prado 30',
            contrato: 'PRADO 30 - RUIZ',
            activo: 'Atico Paseo del Prado 30',
            pagador: 'Lucia Ruiz Moreno',
            receptor: 'Inmobiliaria Horizonte S.L.',
            estado: 'Pagado',
            total: 1850,
            pagado: 1850,
            vat: 0,
            moneda: 'EUR',
            fecha: monthsAgo(2),
            fecha_de_pago: monthsAgo(2),
            tipo: 'ingreso',
            tipo_gasto: null,
            notas: '',
            created_at: monthsAgo(2),
            updated_at: monthsAgo(2)
        },
        // --- Expense invoices ---
        {
            id: IDS.contabilidad[12],
            referencia: 'GASTO-2024-001',
            concepto: 'IBI anual - Calle Mayor 15',
            contrato: '',
            activo: 'Piso Calle Mayor 15, 3B',
            pagador: 'Inmobiliaria Horizonte S.L.',
            receptor: 'Ayuntamiento de Madrid',
            estado: 'Pagado',
            total: 680,
            pagado: 680,
            vat: 0,
            moneda: 'EUR',
            fecha: monthsAgo(2),
            fecha_de_pago: monthsAgo(2),
            tipo: 'gasto',
            tipo_gasto: 'IBI',
            notas: 'Impuesto sobre Bienes Inmuebles 2024',
            created_at: monthsAgo(2),
            updated_at: monthsAgo(2)
        },
        {
            id: IDS.contabilidad[13],
            referencia: 'GASTO-2024-002',
            concepto: 'Cuota comunidad Q1 - Gracia 42',
            contrato: '',
            activo: 'Apartamento Paseo de Gracia 42',
            pagador: 'Maria Josefa Rodriguez Perez',
            receptor: 'Comunidad Paseo de Gracia 42',
            estado: 'Pagado',
            total: 320,
            pagado: 320,
            vat: 0,
            moneda: 'EUR',
            fecha: monthsAgo(1),
            fecha_de_pago: monthsAgo(1),
            tipo: 'gasto',
            tipo_gasto: 'Comunidad',
            notas: 'Cuota trimestral de comunidad',
            created_at: monthsAgo(1),
            updated_at: monthsAgo(1)
        },
        {
            id: IDS.contabilidad[14],
            referencia: 'GASTO-2024-003',
            concepto: 'Seguro hogar - Las Palmeras 7',
            contrato: '',
            activo: 'Villa Urbanizacion Las Palmeras 7',
            pagador: 'Inversiones Mediterraneo S.A.',
            receptor: 'Mapfre Seguros',
            estado: 'Sin pagar',
            total: 540,
            pagado: 0,
            vat: 113.40,
            moneda: 'EUR',
            fecha: daysAgo(10),
            fecha_de_pago: null,
            tipo: 'gasto',
            tipo_gasto: 'Seguro',
            notas: 'Poliza anual de seguro del hogar',
            created_at: daysAgo(10),
            updated_at: daysAgo(10)
        }
    ];

    // ========================================================================
    // Deposits (Depositos)
    // ========================================================================
    const depositos = [
        {
            id: IDS.depositos[0],
            fecha: monthsAgo(14),
            fecha_pago: monthsAgo(14),
            fecha_devolucion: null,
            propiedad: 'Piso Calle Mayor 15, 3B',
            contrato: 'CALLE MAYOR 15 - GARCIA',
            pagador: 'Ana Garcia Lopez',
            receptor: 'Inmobiliaria Horizonte S.L.',
            tipo: 'Fianza',
            estado: 'Depositado',
            total: 1700,
            pagado: 1700,
            devuelto: 0,
            created_at: monthsAgo(14),
            updated_at: monthsAgo(14)
        },
        {
            id: IDS.depositos[1],
            fecha: monthsAgo(10),
            fecha_pago: monthsAgo(10),
            fecha_devolucion: null,
            propiedad: 'Apartamento Paseo de Gracia 42',
            contrato: 'GRACIA 42 - MARTINEZ',
            pagador: 'Carlos Martinez Ruiz',
            receptor: 'Maria Josefa Rodriguez Perez',
            tipo: 'Fianza',
            estado: 'Depositado',
            total: 2400,
            pagado: 2400,
            devuelto: 0,
            created_at: monthsAgo(10),
            updated_at: monthsAgo(10)
        },
        {
            id: IDS.depositos[2],
            fecha: monthsAgo(18),
            fecha_pago: monthsAgo(18),
            fecha_devolucion: null,
            propiedad: 'Villa Urbanizacion Las Palmeras 7',
            contrato: 'LAS PALMERAS 7 - FERNANDEZ',
            pagador: 'Elena Fernandez Torres',
            receptor: 'Inversiones Mediterraneo S.A.',
            tipo: 'Fianza',
            estado: 'Depositado',
            total: 4200,
            pagado: 4200,
            devuelto: 0,
            created_at: monthsAgo(18),
            updated_at: monthsAgo(18)
        },
        {
            id: IDS.depositos[3],
            fecha: monthsAgo(8),
            fecha_pago: monthsAgo(8),
            fecha_devolucion: null,
            propiedad: 'Piso Avenida Diagonal 156',
            contrato: 'DIAGONAL 156 - LOPEZ',
            pagador: 'Miguel Lopez Sanchez',
            receptor: 'Maria Josefa Rodriguez Perez',
            tipo: 'Fianza',
            estado: 'Depositado',
            total: 2800,
            pagado: 2800,
            devuelto: 0,
            created_at: monthsAgo(8),
            updated_at: monthsAgo(8)
        },
        {
            id: IDS.depositos[4],
            fecha: monthsAgo(12),
            fecha_pago: monthsAgo(12),
            fecha_devolucion: null,
            propiedad: 'Atico Paseo del Prado 30',
            contrato: 'PRADO 30 - RUIZ',
            pagador: 'Lucia Ruiz Moreno',
            receptor: 'Inmobiliaria Horizonte S.L.',
            tipo: 'Fianza',
            estado: 'Depositado',
            total: 3700,
            pagado: 3700,
            devuelto: 0,
            created_at: monthsAgo(12),
            updated_at: monthsAgo(12)
        },
        {
            id: IDS.depositos[5],
            fecha: monthsAgo(6),
            fecha_pago: monthsAgo(6),
            fecha_devolucion: null,
            propiedad: 'Local Comercial Gran Via 8',
            contrato: 'GRAN VIA 8 - NAVARRO',
            pagador: 'Pedro Navarro Gil',
            receptor: 'Isabel Navarro Delgado',
            tipo: 'Fianza',
            estado: 'Depositado',
            total: 3200,
            pagado: 3200,
            devuelto: 0,
            created_at: monthsAgo(6),
            updated_at: monthsAgo(6)
        }
    ];

    // ========================================================================
    // SEPA Batches (Remesas SEPA)
    // ========================================================================
    const remesas_sepa = [
        {
            id: IDS.remesas[0],
            remesa_id: 'SEPA-2024-001',
            fecha_cobro: daysAgo(3),
            acreedor: 'Inmobiliaria Horizonte S.L.',
            acreedor_iban: 'ES91 2100 0418 4502 0005 1332',
            importe: 2700,
            moneda: 'EUR',
            deudor: 'Ana Garcia Lopez',
            deudor_iban: 'ES23 0182 3140 4800 2013 4567',
            mandato_id: 'MAND-2024-001',
            referencia: 'Alquileres Enero - Horizonte',
            created_at: daysAgo(5),
            updated_at: daysAgo(3)
        },
        {
            id: IDS.remesas[1],
            remesa_id: 'SEPA-2024-002',
            fecha_cobro: daysAgo(2),
            acreedor: 'Maria Josefa Rodriguez Perez',
            acreedor_iban: 'ES79 2100 0813 6102 0008 4567',
            importe: 2600,
            moneda: 'EUR',
            deudor: 'Carlos Martinez Ruiz',
            deudor_iban: 'ES79 2100 0813 6102 0008 4567',
            mandato_id: 'MAND-2024-002',
            referencia: 'Alquileres Enero - Rodriguez',
            created_at: daysAgo(4),
            updated_at: daysAgo(2)
        },
        {
            id: IDS.remesas[2],
            remesa_id: 'SEPA-2024-003',
            fecha_cobro: daysAgo(1),
            acreedor: 'Inversiones Mediterraneo S.A.',
            acreedor_iban: 'ES68 0049 1500 0512 1106 7890',
            importe: 2100,
            moneda: 'EUR',
            deudor: 'Elena Fernandez Torres',
            deudor_iban: 'ES45 0182 3140 4800 5067 8901',
            mandato_id: 'MAND-2024-003',
            referencia: 'Alquileres Enero - Mediterraneo',
            created_at: daysAgo(3),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.remesas[3],
            remesa_id: 'SEPA-2024-004',
            fecha_cobro: daysAgo(30),
            acreedor: 'Inmobiliaria Horizonte S.L.',
            acreedor_iban: 'ES91 2100 0418 4502 0005 1332',
            importe: 2700,
            moneda: 'EUR',
            deudor: 'Ana Garcia Lopez',
            deudor_iban: 'ES23 0182 3140 4800 2013 4567',
            mandato_id: 'MAND-2024-001',
            referencia: 'Alquileres Diciembre - Horizonte',
            created_at: daysAgo(32),
            updated_at: daysAgo(30)
        },
        {
            id: IDS.remesas[4],
            remesa_id: 'SEPA-2024-005',
            fecha_cobro: daysAgo(30),
            acreedor: 'Maria Josefa Rodriguez Perez',
            acreedor_iban: 'ES79 2100 0813 6102 0008 4567',
            importe: 2600,
            moneda: 'EUR',
            deudor: 'Miguel Lopez Sanchez',
            deudor_iban: 'ES34 0049 2200 1234 5678 9012',
            mandato_id: 'MAND-2024-004',
            referencia: 'Alquileres Diciembre - Rodriguez',
            created_at: daysAgo(33),
            updated_at: daysAgo(30)
        },
        {
            id: IDS.remesas[5],
            remesa_id: 'SEPA-2024-006',
            fecha_cobro: daysAgo(1),
            acreedor: 'Isabel Navarro Delgado',
            acreedor_iban: 'ES56 0182 5740 4500 1023 4567',
            importe: 1600,
            moneda: 'EUR',
            deudor: 'Pedro Navarro Gil',
            deudor_iban: 'ES67 2100 4321 0512 0034 5678',
            mandato_id: 'MAND-2024-005',
            referencia: 'Alquileres Enero - Navarro',
            created_at: daysAgo(3),
            updated_at: daysAgo(1)
        }
    ];

    // ========================================================================
    // Maintenance Issues (Incidencias)
    // ========================================================================
    const incidencias = [
        {
            id: IDS.incidencias[0],
            activo: 'Piso Calle Mayor 15, 3B',
            titulo: 'Fuga de agua en el bano',
            descripcion: 'El inquilino reporta una fuga en la tuberia del lavabo. Se observa humedad en la pared contigua. Requiere fontanero urgente.',
            prioridad: 'Alta',
            estado: 'Abierta',
            coste: 350,
            created_at: daysAgo(3),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.incidencias[1],
            activo: 'Apartamento Paseo de Gracia 42',
            titulo: 'Averia aire acondicionado',
            descripcion: 'El sistema de aire acondicionado no enfria correctamente. Hace ruido al encender. Revision tecnica necesaria.',
            prioridad: 'Media',
            estado: 'En progreso',
            coste: 220,
            created_at: daysAgo(7),
            updated_at: daysAgo(2)
        },
        {
            id: IDS.incidencias[2],
            activo: 'Estudio Calle Sierpes 22',
            titulo: 'Reforma integral - pintura y suelos',
            descripcion: 'Reforma completa del estudio: repintar paredes, sustituir suelo laminado, revision de instalacion electrica.',
            prioridad: 'Baja',
            estado: 'En progreso',
            coste: 4500,
            created_at: daysAgo(15),
            updated_at: daysAgo(2)
        },
        {
            id: IDS.incidencias[3],
            activo: 'Atico Paseo del Prado 30',
            titulo: 'Revision anual caldera',
            descripcion: 'Revision obligatoria anual de la caldera de gas. Contactar con servicio tecnico autorizado.',
            prioridad: 'Media',
            estado: 'Cerrada',
            coste: 120,
            created_at: daysAgo(20),
            updated_at: daysAgo(5)
        },
        {
            id: IDS.incidencias[4],
            activo: 'Local Comercial Gran Via 8',
            titulo: 'Cerradura puerta principal rota',
            descripcion: 'La cerradura de la puerta principal del local no cierra correctamente. El inquilino solicita cambio urgente por seguridad.',
            prioridad: 'Alta',
            estado: 'Abierta',
            coste: 280,
            created_at: daysAgo(2),
            updated_at: daysAgo(1)
        },
        {
            id: IDS.incidencias[5],
            activo: 'Villa Urbanizacion Las Palmeras 7',
            titulo: 'Limpieza y mantenimiento piscina',
            descripcion: 'Mantenimiento trimestral de la piscina comunitaria. Incluye limpieza de filtros, analisis de agua y ajuste de quimicos.',
            prioridad: 'Baja',
            estado: 'En progreso',
            coste: 450,
            created_at: daysAgo(10),
            updated_at: daysAgo(3)
        }
    ];

    // ========================================================================
    // Audit Entries
    // ========================================================================
    const auditEntries = [
        {
            id: uuid(),
            entity_type: 'contabilidad',
            entity_id: IDS.contabilidad[5],
            action: 'create',
            old_values: null,
            new_values: { referencia: 'FACT-2024-006', total: 850 },
            changed_fields: ['referencia', 'concepto', 'total', 'estado'],
            created_at: hoursAgo(2)
        },
        {
            id: uuid(),
            entity_type: 'contabilidad',
            entity_id: IDS.contabilidad[6],
            action: 'update',
            old_values: { pagado: 0, estado: 'Sin pagar' },
            new_values: { pagado: 600, estado: 'Parcial' },
            changed_fields: ['pagado', 'estado'],
            created_at: hoursAgo(5)
        },
        {
            id: uuid(),
            entity_type: 'activos',
            entity_id: IDS.activos[4],
            action: 'update',
            old_values: { estado: 'Libre' },
            new_values: { estado: 'En reforma' },
            changed_fields: ['estado'],
            created_at: hoursAgo(8)
        },
        {
            id: uuid(),
            entity_type: 'incidencias',
            entity_id: IDS.incidencias[0],
            action: 'create',
            old_values: null,
            new_values: { titulo: 'Fuga de agua en el bano', prioridad: 'Alta' },
            changed_fields: ['titulo', 'descripcion', 'prioridad', 'estado'],
            created_at: hoursAgo(12)
        },
        {
            id: uuid(),
            entity_type: 'contratos',
            entity_id: IDS.contratos[4],
            action: 'create',
            old_values: null,
            new_values: { contrato: 'PRADO 30 - RUIZ', alquiler: 1850 },
            changed_fields: ['contrato', 'activo', 'inquilino', 'alquiler'],
            created_at: hoursAgo(24)
        },
        {
            id: uuid(),
            entity_type: 'inquilinos',
            entity_id: IDS.inquilinos[4],
            action: 'create',
            old_values: null,
            new_values: { nombre: 'Lucia Ruiz Moreno' },
            changed_fields: ['nombre', 'email', 'telefono', 'identificacion'],
            created_at: hoursAgo(25)
        },
        {
            id: uuid(),
            entity_type: 'contabilidad',
            entity_id: IDS.contabilidad[7],
            action: 'create',
            old_values: null,
            new_values: { referencia: 'FACT-2024-008', total: 2100 },
            changed_fields: ['referencia', 'concepto', 'total', 'estado'],
            created_at: hoursAgo(30)
        },
        {
            id: uuid(),
            entity_type: 'incidencias',
            entity_id: IDS.incidencias[3],
            action: 'update',
            old_values: { estado: 'Abierta' },
            new_values: { estado: 'Cerrada' },
            changed_fields: ['estado'],
            created_at: hoursAgo(48)
        },
        {
            id: uuid(),
            entity_type: 'depositos',
            entity_id: IDS.depositos[2],
            action: 'create',
            old_values: null,
            new_values: { propiedad: 'Villa Urbanizacion Las Palmeras 7', total: 4200 },
            changed_fields: ['propiedad', 'contrato', 'total', 'pagado'],
            created_at: hoursAgo(72)
        },
        {
            id: uuid(),
            entity_type: 'activos',
            entity_id: IDS.activos[7],
            action: 'update',
            old_values: { alquiler: 1500 },
            new_values: { alquiler: 1600 },
            changed_fields: ['alquiler'],
            created_at: hoursAgo(96)
        },
        {
            id: uuid(),
            entity_type: 'propietarios',
            entity_id: IDS.propietarios[0],
            action: 'update',
            old_values: { telefono: '+34 911 234 560' },
            new_values: { telefono: '+34 911 234 567' },
            changed_fields: ['telefono'],
            created_at: hoursAgo(120)
        },
        {
            id: uuid(),
            entity_type: 'contabilidad',
            entity_id: IDS.contabilidad[14],
            action: 'create',
            old_values: null,
            new_values: { referencia: 'GASTO-2024-003', total: 540 },
            changed_fields: ['referencia', 'concepto', 'total', 'tipo', 'tipo_gasto'],
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
                    cmp = String(aVal).localeCompare(String(bVal), 'es');
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

    // Helper: filter contabilidad for totals calculation (without pagination)
    function filterContabilidadForTotals(params) {
        let filtered = [...contabilidad];
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
        const totalActivos = activos.length;
        const activosByEstado = [];
        const estadoCounts = {};
        activos.forEach(function (a) {
            estadoCounts[a.estado] = (estadoCounts[a.estado] || 0) + 1;
        });
        for (const [estado, count] of Object.entries(estadoCounts)) {
            activosByEstado.push({ estado: estado, count: count });
        }

        // Financial totals from income invoices only
        const incomeInvoices = contabilidad.filter(function (c) { return c.tipo === 'ingreso'; });
        const totalFacturado = incomeInvoices.reduce(function (s, c) { return s + c.total; }, 0);
        const totalCobrado = incomeInvoices.reduce(function (s, c) { return s + c.pagado; }, 0);
        const totalPendiente = totalFacturado - totalCobrado;
        const pendingCount = incomeInvoices.filter(function (c) { return c.estado === 'Sin pagar' || c.estado === 'Parcial'; }).length;
        const collectionRate = totalFacturado > 0 ? Math.round((totalCobrado / totalFacturado) * 1000) / 10 : 0;

        // Overdue invoices: unpaid or partial income, older than 15 days
        const fifteenDaysAgo = new Date(_now);
        fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
        const overdueInvoices = contabilidad.filter(function (c) {
            return (c.estado === 'Sin pagar' || c.estado === 'Parcial') &&
                c.tipo === 'ingreso' &&
                new Date(c.fecha) < fifteenDaysAgo;
        });

        // Expiring leases: contracts ending within 90 days
        const ninetyDaysFromNow = new Date(_now);
        ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
        const expiringLeases = activos.filter(function (a) {
            return a.fecha_fin && new Date(a.fecha_fin) <= ninetyDaysFromNow && a.estado === 'Alquilado';
        });

        // Recent activity from audit
        const recentActivity = auditEntries.slice(0, 5);

        // Financial by receptor
        const byReceptor = {};
        incomeInvoices.forEach(function (c) {
            const key = c.receptor;
            if (!byReceptor[key]) {
                byReceptor[key] = { receptor: key, total_facturado: 0, total_cobrado: 0, total_pendiente: 0, num_activos: 0, _activos_set: {} };
            }
            byReceptor[key].total_facturado += c.total;
            byReceptor[key].total_cobrado += c.pagado;
            byReceptor[key].total_pendiente += (c.total - c.pagado);
            if (c.activo) byReceptor[key]._activos_set[c.activo] = true;
        });
        const financialByReceptor = Object.values(byReceptor).map(function (r) {
            r.num_activos = Object.keys(r._activos_set).length;
            delete r._activos_set;
            return r;
        });

        // Financial by activo
        const byActivo = {};
        incomeInvoices.forEach(function (c) {
            const key = c.activo;
            if (!byActivo[key]) {
                byActivo[key] = { activo: key, total_facturado: 0, total_cobrado: 0, total_pendiente: 0, num_facturas: 0 };
            }
            byActivo[key].total_facturado += c.total;
            byActivo[key].total_cobrado += c.pagado;
            byActivo[key].total_pendiente += (c.total - c.pagado);
            byActivo[key].num_facturas += 1;
        });
        const financialByActivo = Object.values(byActivo);

        return {
            total_activos: totalActivos,
            total_facturado: totalFacturado,
            total_cobrado: totalCobrado,
            total_pendiente: totalPendiente,
            pending_count: pendingCount,
            collection_rate: collectionRate,
            activos_by_estado: activosByEstado,
            overdue_invoices: overdueInvoices,
            expiring_leases: expiringLeases,
            recent_activity: recentActivity,
            financial_by_receptor: financialByReceptor,
            financial_by_activo: financialByActivo
        };
    }

    // ========================================================================
    // Compute reports
    // ========================================================================
    function buildMorosidad() {
        const unpaid = contabilidad.filter(function (c) {
            return (c.estado === 'Sin pagar' || c.estado === 'Parcial') && c.tipo === 'ingreso';
        });
        const groups = {};
        unpaid.forEach(function (c) {
            const key = c.pagador + '||' + c.activo;
            if (!groups[key]) {
                groups[key] = {
                    pagador: c.pagador,
                    activo: c.activo,
                    total_owed: 0,
                    num_invoices: 0,
                    oldest_fecha: c.fecha,
                    days_overdue: 0
                };
            }
            groups[key].total_owed += (c.total - c.pagado);
            groups[key].num_invoices += 1;
            if (c.fecha < groups[key].oldest_fecha) {
                groups[key].oldest_fecha = c.fecha;
            }
        });
        return Object.values(groups).map(function (g) {
            g.days_overdue = Math.floor((_now - new Date(g.oldest_fecha)) / 86400000);
            return g;
        });
    }

    function buildRentabilidad() {
        const byActivo = {};
        contabilidad.forEach(function (c) {
            const key = c.activo;
            if (!byActivo[key]) {
                byActivo[key] = { activo: key, total_ingresos: 0, total_gastos: 0, neto: 0, margen_pct: 0 };
            }
            if (c.tipo === 'ingreso') {
                byActivo[key].total_ingresos += c.pagado;
            } else {
                byActivo[key].total_gastos += c.total;
            }
        });
        return Object.values(byActivo).map(function (r) {
            r.neto = r.total_ingresos - r.total_gastos;
            r.margen_pct = r.total_ingresos > 0 ? Math.round((r.neto / r.total_ingresos) * 1000) / 10 : 0;
            return r;
        });
    }

    // ========================================================================
    // Build activo detail
    // ========================================================================
    function buildActivoDetail(id) {
        const activo = activos.find(function (a) { return a.id === id; });
        if (!activo) return null;

        const invoices = contabilidad.filter(function (c) { return c.activo === activo.activo; });
        const incomeInvoices = invoices.filter(function (c) { return c.tipo === 'ingreso'; });
        const totalFacturado = incomeInvoices.reduce(function (s, c) { return s + c.total; }, 0);
        const totalCobrado = incomeInvoices.reduce(function (s, c) { return s + c.pagado; }, 0);
        const totalPendiente = totalFacturado - totalCobrado;

        return {
            activo: activo,
            financial: {
                total_facturado: totalFacturado,
                total_cobrado: totalCobrado,
                total_pendiente: totalPendiente
            },
            invoices: invoices,
            images: [
                { url: '/files/images/property-placeholder-1.jpg', filename: 'fachada.jpg' },
                { url: '/files/images/property-placeholder-2.jpg', filename: 'salon.jpg' }
            ]
        };
    }

    // ========================================================================
    // Build contrato detail
    // ========================================================================
    function buildContratoDetail(id) {
        const contrato = contratos.find(function (c) { return c.id === id; });
        if (!contrato) return null;

        return {
            contrato: contrato,
            documentos: [
                {
                    id: uuid(),
                    nombre: 'Contrato de arrendamiento',
                    tipo: 'Contrato',
                    fecha_documento: contrato.fecha_inicio,
                    archivo_texto: true,
                    notas: 'Documento firmado por ambas partes'
                }
            ],
            detalles: [
                {
                    categoria: 'price',
                    etiqueta: 'Renta mensual',
                    valor: contrato.alquiler + ' EUR/mes',
                    valor_numerico: contrato.alquiler,
                    fecha_inicio: contrato.fecha_inicio,
                    fecha_fin: contrato.fecha_fin
                },
                {
                    categoria: 'ipc',
                    etiqueta: 'Actualizacion IPC',
                    valor: 'Anual segun INE',
                    valor_numerico: null,
                    fecha_inicio: contrato.fecha_inicio,
                    fecha_fin: contrato.fecha_fin
                },
                {
                    categoria: 'garantia',
                    etiqueta: 'Fianza',
                    valor: '2 mensualidades',
                    valor_numerico: contrato.alquiler * 2,
                    fecha_inicio: contrato.fecha_inicio,
                    fecha_fin: contrato.fecha_fin
                }
            ]
        };
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
                resolve(routeRequest(route, params, method, url));
            }, 80 + Math.random() * 120);
        });
    };

    function routeRequest(route, params, method, originalUrl) {

        // ====================================================================
        // POST / PUT / DELETE  (write operations - return success, read-only)
        // ====================================================================
        if (method === 'POST') {
            return jsonResponse({ success: true, id: uuid() });
        }
        if (method === 'PUT') {
            return jsonResponse({ success: true });
        }
        if (method === 'DELETE') {
            return jsonResponse({ success: true });
        }

        // ====================================================================
        // GET routes
        // ====================================================================

        // Dashboard
        if (route === '/dashboard') {
            return jsonResponse(buildDashboard());
        }

        // --- Activos ---
        if (route === '/activos/names') {
            return jsonResponse(activos.map(function (a) { return a.activo; }));
        }

        // Activo images
        const imagesMatch = route.match(/^\/activos\/images\/(.+)$/);
        if (imagesMatch) {
            return jsonResponse([
                { url: '/files/images/property-placeholder-1.jpg', filename: 'fachada.jpg' },
                { url: '/files/images/property-placeholder-2.jpg', filename: 'salon.jpg' }
            ]);
        }

        // Activo detail
        const activoDetailMatch = route.match(/^\/activos\/([^/]+)\/detail$/);
        if (activoDetailMatch) {
            const detail = buildActivoDetail(activoDetailMatch[1]);
            if (detail) return jsonResponse(detail);
            return jsonResponse({ error: 'Not found' }, 404);
        }

        // Single activo
        const activoSingleMatch = route.match(/^\/activos\/([^/]+)$/);
        if (activoSingleMatch && activoSingleMatch[1] !== 'names' && activoSingleMatch[1] !== 'images') {
            const activo = activos.find(function (a) { return a.id === activoSingleMatch[1]; });
            if (activo) return jsonResponse(activo);
            return jsonResponse({ error: 'Not found' }, 404);
        }

        // Activos list
        if (route === '/activos') {
            return jsonResponse(filterAndPaginate(activos, params));
        }

        // --- Contratos ---
        const contratoDetailMatch = route.match(/^\/contratos\/([^/]+)\/detail$/);
        if (contratoDetailMatch) {
            const detail = buildContratoDetail(contratoDetailMatch[1]);
            if (detail) return jsonResponse(detail);
            return jsonResponse({ error: 'Not found' }, 404);
        }

        if (route === '/contratos') {
            return jsonResponse(filterAndPaginate(contratos, params));
        }

        // --- Contabilidad ---
        if (route === '/contabilidad/receptors') {
            const receptors = [];
            const seen = {};
            contabilidad.forEach(function (c) {
                if (!seen[c.receptor]) {
                    seen[c.receptor] = true;
                    receptors.push(c.receptor);
                }
            });
            return jsonResponse(receptors);
        }

        if (route === '/contabilidad') {
            const result = filterAndPaginate(contabilidad, params);
            // Add totals for contabilidad
            const filteredAll = filterContabilidadForTotals(params);
            const totalSum = filteredAll.reduce(function (s, c) { return s + c.total; }, 0);
            const pagadoSum = filteredAll.reduce(function (s, c) { return s + c.pagado; }, 0);
            result.totals = { total: totalSum, pagado: pagadoSum };
            return jsonResponse(result);
        }

        // --- Inquilinos ---
        if (route === '/inquilinos') {
            return jsonResponse(filterAndPaginate(inquilinos, params));
        }

        // --- Propietarios ---
        if (route === '/propietarios') {
            return jsonResponse(filterAndPaginate(propietarios, params));
        }

        // --- Depositos ---
        if (route === '/depositos') {
            return jsonResponse(filterAndPaginate(depositos, params));
        }

        // --- Remesas SEPA ---
        if (route === '/remesas_sepa') {
            return jsonResponse(filterAndPaginate(remesas_sepa, params));
        }

        // --- Incidencias ---
        if (route === '/incidencias') {
            return jsonResponse(filterAndPaginate(incidencias, params));
        }

        // --- Reports ---
        if (route === '/reports/morosidad') {
            return jsonResponse(buildMorosidad());
        }

        if (route === '/reports/rentabilidad') {
            return jsonResponse(buildRentabilidad());
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

        // --- Contrato documentos text ---
        const docTextMatch = route.match(/^\/contrato_documentos\/([^/]+)\/text$/);
        if (docTextMatch) {
            return jsonResponse({
                id: docTextMatch[1],
                nombre: 'Contrato de arrendamiento',
                content: 'CONTRATO DE ARRENDAMIENTO DE VIVIENDA\n\nEn cumplimiento de la Ley 29/1994 de Arrendamientos Urbanos...\n\n[Contenido del documento de ejemplo para la demo]'
            });
        }

        // --- Single entity by ID (generic /v1/:entity/:id) ---
        const entitySingleMatch = route.match(/^\/([^/]+)\/([^/]+)$/);
        if (entitySingleMatch) {
            const entityName = entitySingleMatch[1];
            const entityId = entitySingleMatch[2];
            const collections = {
                activos: activos,
                contratos: contratos,
                contabilidad: contabilidad,
                inquilinos: inquilinos,
                propietarios: propietarios,
                depositos: depositos,
                remesas_sepa: remesas_sepa,
                incidencias: incidencias
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

    console.log('%c[Demo Mode] API mock active \u2014 all data is simulated', 'color: #f59e0b; font-weight: bold;');
})();
