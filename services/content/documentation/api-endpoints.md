---
title: "Endpoints REST"
description: "Referencia completa de los 90 endpoints REST de la API de Proplia"
author: "Proplia"
slug: "api-endpoints"
keywords: "api, rest, endpoints, crud, export, import"
kind: "reference"
public: true
tags: ["api", "endpoints", "referencia"]
published_at: "2026-02-07"
updated_at: "2026-02-07"
---

# Endpoints REST

Proplia expone 90 endpoints REST organizados por categoría. Todos requieren autenticación (ver [Autenticación API](/documentation/api-auth)).

Base URL: `http://localhost:8080`

## CRUD (13 entidades)

Cada entidad tiene 4 endpoints estándar:

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/admin/api/{entidad}` | Listar todos |
| GET | `/admin/api/{entidad}/{id}` | Obtener por ID |
| POST | `/admin/api/{entidad}` | Crear nuevo |
| PUT | `/admin/api/{entidad}/{id}` | Actualizar |
| DELETE | `/admin/api/{entidad}/{id}` | Eliminar |

### Entidades

`activos`, `contabilidad`, `contratos`, `inquilinos`, `propietarios`, `depositos`, `remesas_sepa`, `incidencias`, `seguros`, `alertas`, `contrato_documentos`, `contrato_detalles`, `audit_log`

### Ejemplo: Listar inmuebles

```bash
curl http://localhost:8080/admin/api/activos \
  -H "Authorization: Bearer $TOKEN"
```

```json
[
  {
    "id": 1,
    "activo": "Piso Calle Mayor",
    "direccion": "Calle Mayor 15, Madrid",
    "alquiler": 850.00,
    "estado": "Alquilado",
    "superficie": 75,
    "habitaciones": 2
  }
]
```

### Ejemplo: Crear inmueble

```bash
curl -X POST http://localhost:8080/admin/api/activos \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activo": "Piso Centro",
    "direccion": "Calle Colón 22, Valencia",
    "alquiler": 950.00,
    "estado": "Libre",
    "superficie": 90,
    "habitaciones": 3
  }'
```

## Vistas detalle

| Ruta | Descripción |
|------|-------------|
| GET `/admin/api/activos/{id}/detail` | Detalle de inmueble con contratos y facturas |
| GET `/admin/api/contratos/{id}/detail` | Detalle de contrato con documentos |
| GET `/admin/api/inquilinos/{id}/detail` | Detalle de inquilino con historial |
| GET `/admin/api/propietarios/{id}/detail` | Detalle de propietario |
| GET `/admin/api/depositos/{id}/detail` | Detalle de depósito |
| GET `/admin/api/remesas_sepa/{id}/detail` | Detalle de remesa SEPA |

## Importación masiva

```
POST /admin/api/import/{entidad}
Content-Type: multipart/form-data
```

| Entidad | Ruta |
|---------|------|
| Inmuebles | `/admin/api/import/activos` |
| Contabilidad | `/admin/api/import/contabilidad` |
| Contratos | `/admin/api/import/contratos` |
| Inquilinos | `/admin/api/import/inquilinos` |
| Propietarios | `/admin/api/import/propietarios` |
| Depósitos | `/admin/api/import/depositos` |
| Remesas SEPA | `/admin/api/import/remesas_sepa` |

### Ejemplo: Importar inmuebles

```bash
curl -X POST http://localhost:8080/admin/api/import/activos \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@inmuebles.csv"
```

## Exportación

| Ruta | Formato | Descripción |
|------|---------|-------------|
| GET `/admin/api/export/activos` | CSV | Exportar inmuebles |
| GET `/admin/api/export/contabilidad` | CSV | Exportar facturas |
| GET `/admin/api/export/incidencias` | CSV | Exportar incidencias |
| GET `/admin/api/export/remesas_sepa_xml` | XML | SEPA PAIN.008.001.02 |

## PDF

| Ruta | Descripción |
|------|-------------|
| GET `/admin/api/contabilidad/{id}/pdf` | Descargar factura en PDF |

## Validación

| Ruta | Descripción |
|------|-------------|
| GET `/admin/api/validate/iban?iban={iban}` | Validar IBAN (MOD-97) |

## Dashboard

| Ruta | Descripción |
|------|-------------|
| GET `/admin/api/dashboard` | Métricas: financieras, impagos, vencimientos, actividad reciente |

## Informes

| Ruta | Descripción |
|------|-------------|
| GET `/admin/api/reports/morosidad` | Informe de morosidad |
| GET `/admin/api/reports/rentabilidad` | Informe de rentabilidad por inmueble |
| GET `/admin/api/reports/flujo_caja` | Informe de flujo de caja |

## Auditoría

| Ruta | Descripción |
|------|-------------|
| GET `/admin/api/audit/{entity_type}/{entity_id}` | Historial de cambios de un registro |
| GET `/admin/api/audit/recent` | Cambios recientes en todo el sistema |

## Listados auxiliares

| Ruta | Descripción |
|------|-------------|
| GET `/admin/api/activos/names` | Nombres de inmuebles (para selectores) |
| GET `/admin/api/contabilidad/receptors` | Receptores únicos (para selectores) |
| GET `/admin/api/images/folders` | Carpetas de imágenes disponibles |

## Documentos de contrato

| Ruta | Descripción |
|------|-------------|
| GET `/admin/api/contrato_documentos/{id}/text` | Texto extraído del PDF |
