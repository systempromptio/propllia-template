---
title: "Inquilinos"
description: "Gestión de inquilinos: ficha completa, datos de fiador, historial de contratos y pagos"
author: "Proplia"
slug: "inquilinos"
keywords: "inquilinos, tenants, fiador, gestión inquilinos"
kind: "feature"
public: true
tags: ["inquilinos", "guía"]
published_at: "2026-02-07"
updated_at: "2026-02-07"
---

# Inquilinos

El módulo de inquilinos gestiona las fichas completas de tus arrendatarios, incluyendo datos del fiador (avalista), historial de contratos y historial de pagos.

## Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | Identificador único (auto) |
| `nombre` | String | Nombre completo |
| `identificacion` | String | DNI, NIE o pasaporte |
| `email` | String | Correo electrónico |
| `telefono` | String | Teléfono de contacto |
| `direccion` | String | Dirección personal |
| `banco` | String | Cuenta bancaria (IBAN) |
| `activo` | String | Inmueble asociado actualmente |
| `direccion_activo` | String | Dirección del inmueble actual |
| `es_antiguo` | Boolean | Si es inquilino anterior |
| `fiador_nombre` | String | Nombre del fiador/avalista |
| `fiador_identificacion` | String | DNI/NIE del fiador |
| `fiador_telefono` | String | Teléfono del fiador |
| `fiador_email` | String | Email del fiador |
| `created_at` | Timestamp | Fecha de creación |
| `updated_at` | Timestamp | Última modificación |

## Datos del fiador

La LAU permite exigir un fiador en contratos de vivienda habitual. Proplia almacena los datos del avalista directamente en la ficha del inquilino:

- `fiador_nombre` — Nombre completo del avalista
- `fiador_identificacion` — DNI/NIE del avalista
- `fiador_telefono` — Teléfono de contacto
- `fiador_email` — Correo electrónico

## Vistas SQL

### Contratos por inquilino (`v_inquilino_contratos`)

Muestra todos los contratos (pasados y presentes) de cada inquilino, incluyendo tipo, fechas, alquiler y estado.

### Pagos por inquilino (`v_inquilino_pagos`)

Muestra todo el historial de pagos de cada inquilino, incluyendo importes, fechas y estado de cada factura.

## Ejemplos con el agente IA

### Buscar inquilinos

```
Usuario: Busca al inquilino Juan García.
```

```json
{
  "entity": "inquilinos",
  "query": "Juan García"
}
```

### Crear inquilino con fiador

```
Usuario: Añade a María López, DNI 87654321B, email maria@email.com,
         teléfono 698765432. Su fiador es Pedro López, DNI 11223344C.
```

```json
{
  "entity": "inquilinos",
  "operation": "create",
  "fields": {
    "nombre": "María López",
    "identificacion": "87654321B",
    "email": "maria@email.com",
    "telefono": "698765432",
    "fiador_nombre": "Pedro López",
    "fiador_identificacion": "11223344C"
  }
}
```

### Ver historial de un inquilino

```
Usuario: ¿Qué contratos ha tenido Juan García?
```

El agente consulta la vista `v_inquilino_contratos` para mostrar el historial completo.

### Actualizar datos bancarios

```
Usuario: Actualiza el IBAN de María López a ES91 2100 0418 4502 0005 1332.
```

```json
{
  "entity": "inquilinos",
  "operation": "update",
  "id": 2,
  "fields": { "banco": "ES9121000418450200051332" }
}
```

## Importación CSV

```
POST /admin/api/import/inquilinos
Content-Type: multipart/form-data
```

Campos obligatorios en el CSV: `nombre`, `identificacion`.
