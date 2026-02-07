---
title: "Contratos y LAU"
description: "Gestión de contratos de alquiler con cumplimiento automático de la Ley de Arrendamientos Urbanos"
author: "Proplia"
slug: "contratos"
keywords: "contratos, lau, arrendamiento, vivienda habitual, temporada"
kind: "feature"
public: true
tags: ["contratos", "lau", "legal", "guía"]
published_at: "2026-02-07"
updated_at: "2026-02-07"
---

# Contratos y LAU

Proplia gestiona contratos de alquiler con cumplimiento automático de la Ley de Arrendamientos Urbanos (LAU). Soporta 3 tipos de contrato, 3 estados, versionado legal automático e ingesta de documentos PDF.

## Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | Identificador único (auto) |
| `contrato` | String | Referencia del contrato |
| `activo` | String | Inmueble asociado |
| `direccion` | String | Dirección del inmueble |
| `inquilino` | String | Inquilino titular |
| `fecha_inicio` | Date | Fecha de inicio |
| `fecha_fin` | Date | Fecha de finalización |
| `alquiler` | Decimal | Importe mensual (€) |
| `total` | Decimal | Importe total del contrato |
| `estado` | Enum | Estado del contrato |
| `etiquetas` | String | Etiquetas clasificatorias |
| `tipo` | Enum | Tipo de contrato |
| `version_lau` | String | Versión de la LAU aplicada |
| `documento_firmado` | String | Referencia al documento firmado |
| `created_at` | Timestamp | Fecha de creación |
| `updated_at` | Timestamp | Última modificación |

## Tipos de contrato

| Tipo | Valor | Descripción |
|------|-------|-------------|
| Vivienda habitual | `vivienda_habitual` | Residencia permanente del inquilino. Duración mínima 5 años (7 si arrendador es persona jurídica) |
| Temporada | `temporada` | Uso temporal (estudios, trabajo, vacaciones). Sin duración mínima legal |
| Comercial | `comercial` | Locales comerciales, oficinas. Regulación diferenciada |

## Estados

| Estado | Descripción |
|--------|-------------|
| **Iniciado** | Contrato creado, pendiente de firma |
| **Firmado** | Contrato firmado y en vigor |
| **Finalizado** | Contrato terminado |

## Versionado LAU

El campo `version_lau` se asigna automáticamente según la fecha de inicio del contrato. Esto asegura que cada contrato aplica la legislación vigente en el momento de su firma.

Las principales diferencias entre versiones de la LAU afectan a:
- Duración mínima de contratos de vivienda habitual
- Mecanismo de actualización de renta (IPC vs índice de referencia)
- Derechos de prórroga
- Límites de fianza

## Ingesta de documentos

Proplia permite adjuntar documentos PDF a cada contrato y extraer datos automáticamente:

### Tablas asociadas

**`contrato_documentos`** — Almacena los documentos:

| Campo | Descripción |
|-------|-------------|
| `contrato_id` | Contrato asociado |
| `nombre` | Nombre del documento |
| `archivo_original` | Ruta del PDF original |
| `archivo_texto` | Texto extraído del PDF |
| `tipo` | Tipo de documento |
| `fecha_documento` | Fecha del documento |

**`contrato_detalles`** — Datos extraídos del documento:

| Campo | Descripción |
|-------|-------------|
| `contrato_id` | Contrato asociado |
| `documento_id` | Documento fuente |
| `categoria` | Tipo de dato (price, ipc, garantia, descuento, incremento_pct, fin_contrato, ibi, extras) |
| `etiqueta` | Descripción del dato |
| `valor` | Valor textual |
| `valor_numerico` | Valor numérico (si aplica) |
| `fecha_inicio` / `fecha_fin` | Periodo de validez |

## Ejemplos con el agente IA

### Crear contrato

```
Usuario: Crea un contrato de vivienda habitual para Ana Ruiz
         en el piso de Calle Colón, inicio 1 de abril 2026,
         alquiler 950€, duración 1 año.
```

```json
{
  "entity": "contratos",
  "operation": "create",
  "fields": {
    "contrato": "CTR-2026-002",
    "activo": "Piso Calle Colón",
    "direccion": "Calle Colón 22, Valencia",
    "inquilino": "Ana Ruiz",
    "fecha_inicio": "2026-04-01",
    "fecha_fin": "2027-03-31",
    "alquiler": 950.00,
    "tipo": "vivienda_habitual",
    "estado": "Iniciado"
  }
}
```

### Consultar contratos por vencer

```
Usuario: ¿Qué contratos vencen en los próximos 60 días?
```

```json
{
  "report": "contratos_por_vencer",
  "days_ahead": 60
}
```

### Buscar contratos de un inquilino

```
Usuario: Muéstrame los contratos de Ana Ruiz.
```

```json
{
  "entity": "contratos",
  "query": "Ana Ruiz"
}
```

## Alertas automáticas

El job `contrato_expiry_alert` se ejecuta diariamente a las 9:00 y genera alertas para contratos que vencen en 30, 60 y 90 días. Las alertas se crean en la tabla `alertas` con prioridad según la proximidad del vencimiento.
