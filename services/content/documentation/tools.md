---
title: "Herramientas MCP"
description: "Referencia completa de las 3 herramientas MCP de Proplia: search, edit e informe"
author: "Proplia"
slug: "herramientas"
keywords: "mcp, herramientas, search, edit, informe, referencia"
kind: "reference"
public: true
tags: ["mcp", "herramientas", "referencia"]
published_at: "2026-02-07"
updated_at: "2026-02-07"
---

# Herramientas MCP

Referencia completa de las 3 herramientas disponibles en el servidor MCP de Proplia.

## search

Busca registros en cualquiera de las 11 entidades disponibles.

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `entity` | String | Si | Entidad a buscar |
| `id` | Integer | No | Buscar por ID exacto |
| `query` | String | No | Búsqueda por texto libre (ILIKE) |
| `filters` | Object | No | Filtros exactos por campo |
| `limit` | Integer | No | Máximo de resultados (default: 20) |
| `offset` | Integer | No | Desplazamiento para paginación |

### Entidades disponibles

| Entidad | Campos buscables |
|---------|-----------------|
| `activos` | activo, direccion, estado, etiquetas |
| `contabilidad` | referencia, concepto, pagador, receptor, estado |
| `contratos` | contrato, activo, inquilino, estado, tipo |
| `inquilinos` | nombre, identificacion, email, telefono |
| `propietarios` | nombre, identificacion, email |
| `depositos` | propiedad, contrato, pagador, estado |
| `remesas_sepa` | remesa_id, acreedor, deudor, referencia |
| `incidencias` | activo, titulo, estado, prioridad |
| `seguros` | activo, compania, numero_poliza, estado |
| `alertas` | tipo, titulo, estado, prioridad |
| `audit_log` | entity_type, entity_id, action |

### Ejemplos

Buscar por texto:

```json
{
  "entity": "activos",
  "query": "Madrid"
}
```

Buscar por filtro exacto:

```json
{
  "entity": "activos",
  "filters": { "estado": "Libre" },
  "limit": 50
}
```

Buscar por ID:

```json
{
  "entity": "contratos",
  "id": 42
}
```

Paginación:

```json
{
  "entity": "contabilidad",
  "filters": { "estado": "Pagado" },
  "limit": 10,
  "offset": 20
}
```

## edit

Crea, actualiza o elimina registros en 10 entidades.

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `entity` | String | Si | Entidad a modificar |
| `operation` | String | Si | `create`, `update` o `delete` |
| `id` | Integer | update/delete | ID del registro |
| `fields` | Object | create/update | Campos a establecer |

### Entidades disponibles

Todas excepto `audit_log`:
`activos`, `contabilidad`, `contratos`, `inquilinos`, `propietarios`, `depositos`, `remesas_sepa`, `incidencias`, `seguros`, `alertas`

### Campos obligatorios por entidad

| Entidad | Campos obligatorios |
|---------|--------------------|
| `activos` | activo, direccion, alquiler, estado |
| `contabilidad` | referencia, concepto, total, tipo, estado |
| `contratos` | contrato, activo, inquilino, fecha_inicio, alquiler, tipo, estado |
| `inquilinos` | nombre, identificacion |
| `propietarios` | nombre, identificacion |
| `depositos` | propiedad, contrato, pagador, tipo, total |
| `remesas_sepa` | remesa_id, acreedor, acreedor_iban, deudor, deudor_iban, importe |
| `incidencias` | activo, titulo, estado |
| `seguros` | activo, tipo_seguro, compania, fecha_inicio, fecha_fin |
| `alertas` | tipo, titulo, estado, prioridad |

### Valores válidos de estado

| Entidad | Estados |
|---------|---------|
| `activos` | Libre, Ocupado, Alquilado, Reservado, En reforma |
| `contabilidad` | Emitida, Enviada, Sin pagar, Parcial, Pagado, Vencida |
| `contratos` | Iniciado, Firmado, Finalizado |
| `incidencias` | Abierta, En progreso, Resuelta, Cerrada |
| `seguros` | Vigente, Vencido, Cancelado |
| `alertas` | nueva, leida, resuelta |

### Ejemplos

Crear registro:

```json
{
  "entity": "activos",
  "operation": "create",
  "fields": {
    "activo": "Piso Centro",
    "direccion": "Calle Mayor 15, Madrid",
    "alquiler": 850.00,
    "estado": "Libre",
    "superficie": 75,
    "habitaciones": 2
  }
}
```

Actualizar registro:

```json
{
  "entity": "activos",
  "operation": "update",
  "id": 1,
  "fields": {
    "estado": "Alquilado",
    "alquiler": 900.00
  }
}
```

Eliminar registro:

```json
{
  "entity": "incidencias",
  "operation": "delete",
  "id": 5
}
```

### Audit trail

Cada operación `edit` genera automáticamente una entrada en `audit_log` con:
- `entity_type` — Entidad modificada
- `entity_id` — ID del registro
- `action` — create, update o delete
- `old_values` — Valores anteriores (JSON)
- `new_values` — Valores nuevos (JSON)
- `changed_fields` — Lista de campos modificados

## informe

Genera informes de negocio.

### Parámetros

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `report` | String | Si | Tipo de informe |
| `activo` | Integer | No | Filtrar por inmueble (ID) |
| `days_ahead` | Integer | No | Días de antelación (para contratos_por_vencer) |

### Tipos de informe

| Tipo | Descripción | Datos incluidos |
|------|-------------|-----------------|
| `portfolio` | Resumen de inmuebles | Total, por estado, ocupación, alquiler medio |
| `financiero` | Balance económico | Ingresos, gastos, neto, por periodo |
| `contratos_por_vencer` | Vencimientos próximos | Contratos que expiran en N días |
| `morosidad` | Impagos | Inquilinos morosos, importes, días de retraso |
| `rentabilidad` | Rentabilidad neta | Ingresos - gastos por inmueble, % rentabilidad |
| `flujo_caja` | Cash flow | Entradas y salidas por periodo |

### Ejemplos

Informe de portfolio:

```json
{
  "report": "portfolio"
}
```

Contratos que vencen en 90 días:

```json
{
  "report": "contratos_por_vencer",
  "days_ahead": 90
}
```

Rentabilidad de un inmueble:

```json
{
  "report": "rentabilidad",
  "activo": 1
}
```
