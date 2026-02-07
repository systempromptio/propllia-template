---
title: "Banca y SEPA"
description: "Validación IBAN, lookup BIC de bancos españoles y exportación SEPA XML para domiciliaciones"
author: "Proplia"
slug: "bancos"
keywords: "iban, bic, sepa, xml, bancos, domiciliación, pain.008"
kind: "feature"
public: true
tags: ["bancos", "sepa", "iban", "guía"]
published_at: "2026-02-07"
updated_at: "2026-02-07"
---

# Banca y SEPA

Proplia incluye validación de IBAN, resolución automática de BIC/SWIFT para bancos españoles y generación de ficheros SEPA XML (PAIN.008.001.02) para domiciliaciones bancarias.

## Validación IBAN

### Endpoint

```
GET /admin/api/validate/iban?iban=ES9121000418450200051332
```

### Algoritmo

La validación sigue el estándar MOD-97 (ISO 13616):

1. Verifica la longitud según el país
2. Mueve los 4 primeros caracteres al final
3. Convierte letras a números (A=10, B=11...)
4. Calcula módulo 97 — debe ser 1

Soporta más de 50 países. Para IBANs españoles, además valida la estructura BBAN (entidad + oficina + dígitos de control + cuenta).

### Ejemplo de respuesta

```json
{
  "valid": true,
  "iban": "ES9121000418450200051332",
  "country": "ES",
  "bic": "CAIXESBBXXX",
  "bank_name": "CaixaBank"
}
```

## Lookup BIC

Proplia resuelve automáticamente el código BIC/SWIFT para los principales bancos españoles a partir del código de entidad del IBAN:

| Entidad | Banco | BIC |
|---------|-------|-----|
| 0049 | Santander | BSCHESMMXXX |
| 0182 | BBVA | BBVAESMMXXX |
| 2100 | CaixaBank | CAIXESBBXXX |
| 0075 | Banco Popular | POPUESMMXXX |
| 2080 | Abanca | CAABORIMXXX |
| 0081 | Sabadell | BSABESBBXXX |
| 2038 | Bankia | CAABORIMXXX |
| 0128 | Bankinter | BKBKESMMXXX |
| 0487 | Kutxabank | NEABORIMXXX |
| 3058 | Cajamar | CCABORIMXXX |

## Remesas SEPA

### Tabla `remesas_sepa`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | Identificador único (auto) |
| `remesa_id` | String | ID de la remesa |
| `fecha_cobro` | Date | Fecha de cobro solicitada |
| `acreedor` | String | Nombre del acreedor |
| `acreedor_iban` | String | IBAN del acreedor |
| `importe` | Decimal | Importe a cobrar (€) |
| `moneda` | String | Moneda (EUR) |
| `deudor` | String | Nombre del deudor |
| `deudor_iban` | String | IBAN del deudor |
| `mandato_id` | String | ID del mandato SEPA |
| `referencia` | String | Referencia del cobro |
| `archivo` | String | Ruta del archivo XML generado |
| `created_at` | Timestamp | Fecha de creación |
| `updated_at` | Timestamp | Última modificación |

### Exportación XML

```
GET /admin/api/export/remesas_sepa_xml
```

Genera un fichero PAIN.008.001.02 compatible con la banca española. El XML incluye:

- Cabecera con datos del acreedor
- Información de cobro (fecha, importe, moneda)
- Datos del deudor (nombre, IBAN, BIC)
- Referencia del mandato SEPA
- Referencia end-to-end

### Flujo de trabajo

1. Las facturas se generan automáticamente (job mensual)
2. Se seleccionan las facturas a cobrar por domiciliación
3. Se crea la remesa SEPA con los datos de cada factura
4. Se exporta el XML PAIN.008.001.02
5. Se sube el archivo al banco
6. Se actualiza el estado de las facturas según el resultado

## Ejemplos con el agente IA

### Validar un IBAN

```
Usuario: Valida el IBAN ES91 2100 0418 4502 0005 1332.
```

El agente llama al endpoint de validación y devuelve si es válido, el banco (CaixaBank) y el BIC.

### Buscar remesas

```
Usuario: Muéstrame las remesas SEPA del mes pasado.
```

```json
{
  "entity": "remesas_sepa",
  "query": "2026-01"
}
```

### Crear una remesa

```
Usuario: Crea una remesa SEPA para cobrar las facturas de febrero.
```

```json
{
  "entity": "remesas_sepa",
  "operation": "create",
  "fields": {
    "remesa_id": "REM-2026-02",
    "fecha_cobro": "2026-03-05",
    "acreedor": "Propietario SL",
    "acreedor_iban": "ES7620770024003102575766",
    "deudor": "Juan García",
    "deudor_iban": "ES9121000418450200051332",
    "importe": 850.00,
    "moneda": "EUR",
    "referencia": "FAC-2026-002"
  }
}
```
