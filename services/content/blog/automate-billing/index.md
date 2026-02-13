---
title: "Cómo automatizar la facturación de alquileres"
description: "Guía paso a paso para automatizar las facturas mensuales de tus alquileres con generación PDF y cobros SEPA"
slug: "automatizar-facturacion"
kind: "blog"
public: true
author: "Proplia"
published_at: "2026-02-07"
tags: ["facturación", "sepa", "automatización"]
category: "guide"
---

# Cómo automatizar la facturación de alquileres

Si gestionas más de un par de alquileres, la facturación manual es un problema: facturas olvidadas, importes incorrectos, PDFs hechos a mano, y perseguir cobros uno a uno. Esta guía explica cómo automatizar todo el flujo — desde la generación de facturas hasta el cobro por domiciliación bancaria SEPA.

## El problema de la facturación manual

Los errores más comunes en la gestión manual:

- **Facturas olvidadas**: No se emite la factura de un inquilino un mes
- **Importes incorrectos**: Copiar el importe mal o no aplicar actualizaciones de renta
- **Sin seguimiento**: No saber qué facturas están pagadas y cuáles no
- **PDF artesanales**: Crear facturas en Word/Excel uno a uno
- **Cobros desorganizados**: Revisar extractos bancarios manualmente

## La solución: facturación automática

Proplia automatiza el ciclo completo de facturación en 4 pasos:

```
Contratos firmados
       ↓
[Job automático - día 1 del mes, 6:00]
       ↓
Facturas generadas (estado: Emitida)
       ↓
PDF disponible para cada factura
       ↓
Remesa SEPA XML → Banco → Cobro automático
       ↓
Estado actualizado (Pagado / Sin pagar)
```

### Paso 1: Generación automática de facturas

El job `generar_facturas_mensuales` se ejecuta el día 1 de cada mes a las 6:00. Para cada contrato con estado "Firmado":

1. Crea un registro en la tabla `contabilidad`
2. Asigna la referencia de factura (serie numérica)
3. Establece el concepto "Alquiler [mes] [año]"
4. Copia el importe del campo `alquiler` del contrato
5. Estado inicial: "Emitida"

No necesitas hacer nada — las facturas aparecen automáticamente el primer día del mes.

### Paso 2: Generación de PDF

Cada factura tiene su PDF disponible:

```
GET /admin/api/contabilidad/{id}/pdf
```

El PDF se genera con `genpdf` (Rust) e incluye:
- Datos del emisor y receptor
- Concepto y desglose
- Importe, IVA, descuentos
- Datos bancarios para el pago

### Paso 3: Cobro por domiciliación SEPA

Para cobrar automáticamente por domiciliación bancaria:

1. **Validar IBANs**: Proplia valida automáticamente los IBANs de los inquilinos (MOD-97, 50+ países)
2. **Crear remesa**: Agrupa las facturas del mes en una remesa SEPA
3. **Exportar XML**: Genera el fichero PAIN.008.001.02

```
GET /admin/api/export/remesas_sepa_xml
```

4. **Subir al banco**: Sube el XML a tu banca online (compatible con todos los bancos españoles)
5. **Resultado**: El banco procesa los cobros y devuelve el resultado

### Paso 4: Seguimiento de estados

Cada factura pasa por hasta 6 estados:

| Estado | Significado | Acción |
|--------|------------|--------|
| **Emitida** | Generada automáticamente | Enviar al inquilino |
| **Enviada** | Enviada al inquilino | Esperar pago |
| **Sin pagar** | Plazo vencido sin pago | Reclamar |
| **Parcial** | Pago parcial recibido | Reclamar resto |
| **Pagado** | Cobro completo | Nada |
| **Vencida** | Fuera de plazo | Iniciar procedimiento |

## Alertas automáticas

El job `cobro_pendiente_check` se ejecuta diariamente a las 10:00 y:
- Identifica facturas con estado "Sin pagar" o "Parcial"
- Genera alertas en la tabla `alertas`
- Prioridad según días de retraso

## Gestión con el agente IA

Todo el seguimiento de facturación se puede hacer por lenguaje natural:

### Consultar estado

```
Tú: ¿Cómo van las facturas de febrero?

Agente: Facturas de febrero 2026:
        - 12 emitidas
        - 9 pagadas
        - 2 sin pagar (Juan García: 850€, Ana Ruiz: 950€)
        - 1 parcial (Pedro López: pagado 500€ de 750€)
        Total pendiente: 2,050€
```

### Registrar pagos

```
Tú: Juan García ha pagado la factura de febrero.

Agente: Factura FAC-2026-014 actualizada:
        - Estado: Pagado
        - Pagado: 850.00€
        - Fecha de pago: 07/02/2026
```

### Pagos parciales

```
Tú: Pedro López ha pagado 250€ más de su factura pendiente.

Agente: Factura FAC-2026-015 actualizada:
        - Pagado: 750.00€ (500€ anterior + 250€)
        - Estado: Pagado (importe completo alcanzado)
```

### Informe de morosidad

```
Tú: ¿Quién me debe dinero?

Agente: Informe de morosidad:
        | Inquilino | Factura | Importe | Días retraso |
        |-----------|---------|---------|-------------|
        | Ana Ruiz | FEB-2026 | 950€ | 7 días |
        Total pendiente: 950€
```

## Descuentos

Proplia soporta dos tipos de descuento en facturas:

- **Descuento fijo** (`descuento`): Importe en euros. Ej: 50€ de descuento por pronto pago
- **Descuento porcentual** (`descuento_pct`): Porcentaje sobre el total. Ej: 5% de descuento

Ambos se pueden combinar en la misma factura.

## Clasificación de gastos

Además de los ingresos por alquiler, puedes registrar gastos con el campo `tipo_gasto`:

- IBI (Impuesto de Bienes Inmuebles)
- Comunidad de propietarios
- Seguros
- Mantenimiento y reparaciones
- Suministros
- Otros

Esto permite generar informes de rentabilidad neta por inmueble.

## Empieza gratis

Proplia es gratuito para hasta 5 inmuebles, con facturación automática incluida. Empieza gratis en [proplia.io](https://proplia.io).

Para más detalles, consulta la [documentación de facturación](/documentation/billing) y la [guía de banca SEPA](/documentation/banking).
