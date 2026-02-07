---
title: "Facturación"
description: "Sistema de facturación automática: generación mensual, PDF, estados, descuentos y ejemplos con agente IA"
author: "Proplia"
slug: "facturacion"
keywords: "facturación, facturas, contabilidad, pdf, automatización"
kind: "feature"
public: true
tags: ["facturación", "contabilidad", "guía"]
published_at: "2026-02-07"
updated_at: "2026-02-07"
---

# Facturación

Proplia genera facturas de alquiler automáticamente cada mes. El módulo de contabilidad gestiona 25 campos por factura, 6 estados de seguimiento, generación PDF, descuentos y clasificación de ingresos/gastos.

## Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | Identificador único (auto) |
| `referencia` | String | Referencia de la factura |
| `concepto` | String | Descripción del concepto |
| `contrato` | String | Contrato asociado |
| `activo` | String | Inmueble asociado |
| `pagador` | String | Quien paga |
| `receptor` | String | Quien cobra |
| `estado` | Enum | Estado de la factura |
| `total` | Decimal | Importe total (€) |
| `pagado` | Decimal | Importe pagado (€) |
| `vat` | Decimal | IVA aplicado |
| `moneda` | Enum | Moneda (eur/usd) |
| `fecha` | Date | Fecha de emisión |
| `fecha_de_pago` | Date | Fecha de pago |
| `notas` | Text | Notas adicionales |
| `factura` | String | Número de factura |
| `descuento` | Decimal | Descuento fijo (€) |
| `descuento_pct` | Decimal | Descuento porcentual (%) |
| `cuenta_pagador` | String | IBAN del pagador |
| `cuenta_receptor` | String | IBAN del receptor |
| `metodo_pago` | String | Método de pago |
| `metodo_cobro` | String | Método de cobro |
| `tipo` | Enum | Ingreso o Gasto |
| `tipo_gasto` | String | Categoría de gasto (IBI, comunidad, seguros, mantenimiento, etc.) |
| `created_at` | Timestamp | Fecha de creación |
| `updated_at` | Timestamp | Última modificación |

## Estados

| Estado | Descripción |
|--------|-------------|
| **Emitida** | Factura generada, pendiente de envío |
| **Enviada** | Factura enviada al pagador |
| **Sin pagar** | Factura vencida sin pago |
| **Parcial** | Pago parcial recibido |
| **Pagado** | Factura completamente pagada |
| **Vencida** | Plazo de pago superado |

## Generación automática

El job `generar_facturas_mensuales` se ejecuta el día 1 de cada mes a las 6:00 y:

1. Busca todos los contratos con estado "Firmado"
2. Genera una factura por cada contrato activo
3. Asigna el concepto "Alquiler [mes] [año]"
4. Establece el importe desde el campo `alquiler` del contrato
5. Estado inicial: "Emitida"

## Generación PDF

Cada factura puede generar su PDF con el endpoint:

```
GET /admin/api/contabilidad/{id}/pdf
```

Los PDFs se generan con `genpdf` (Rust) usando las fuentes DejaVuSans y LiberationSans.

## Descuentos

Proplia soporta dos tipos de descuento que se pueden combinar:

- **`descuento`** — Importe fijo en euros (ej: 50€ de descuento)
- **`descuento_pct`** — Porcentaje sobre el total (ej: 10%)

## Tipo de registro

El campo `tipo` clasifica cada registro como:
- **Ingreso** — Cobros de alquiler, fianzas recibidas
- **Gasto** — IBI, comunidad, seguros, mantenimiento, suministros

El campo `tipo_gasto` categoriza los gastos para informes financieros.

## Vistas SQL

**`v_contabilidad_pendiente`** — Facturas con estado "Sin pagar" o "Parcial", útil para seguimiento de morosidad.

**`v_resumen_por_activo`** — Totales financieros (ingresos, gastos, neto) agrupados por inmueble.

**`v_resumen_por_receptor`** — Totales financieros agrupados por acreedor/receptor.

## Ejemplos con el agente IA

### Generar factura

```
Usuario: Genera la factura de marzo para el contrato
         de Juan García en Calle Mayor 15.
```

```json
{
  "entity": "contabilidad",
  "operation": "create",
  "fields": {
    "referencia": "FAC-2026-003",
    "concepto": "Alquiler marzo 2026",
    "contrato": "CTR-2026-001",
    "activo": "Piso Calle Mayor",
    "pagador": "Juan García",
    "total": 850.00,
    "tipo": "Ingreso",
    "estado": "Emitida",
    "fecha": "2026-03-01"
  }
}
```

### Registrar pago

```
Usuario: Juan García ha pagado la factura de marzo.
```

```json
{
  "entity": "contabilidad",
  "operation": "update",
  "id": 3,
  "fields": {
    "estado": "Pagado",
    "pagado": 850.00,
    "fecha_de_pago": "2026-03-05"
  }
}
```

### Informe de morosidad

```
Usuario: ¿Quién me debe dinero?
```

```json
{
  "report": "morosidad"
}
```

## Exportación

```
GET /admin/api/export/contabilidad
```

Exporta todas las facturas en formato CSV.
