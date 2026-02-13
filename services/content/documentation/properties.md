---
title: "Inmuebles"
description: "Gestión completa de propiedades: campos, estados, fotos, importación CSV y ejemplos con agente IA"
author: "Proplia"
slug: "inmuebles"
keywords: "inmuebles, propiedades, gestión inmobiliaria, estados, catastro"
kind: "feature"
public: true
tags: ["inmuebles", "propiedades", "guía"]
published_at: "2026-02-07"
updated_at: "2026-02-07"
---

# Inmuebles

El módulo de inmuebles gestiona todas tus propiedades de alquiler. Cada inmueble tiene 17 campos de datos, 5 estados posibles, galería de fotos y soporte para importación masiva CSV.

## Campos

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | Identificador único (auto) |
| `activo` | String | Nombre del inmueble |
| `direccion` | String | Dirección completa |
| `contrato` | String | Contrato asociado |
| `fecha_inicio` | Date | Fecha inicio del alquiler actual |
| `fecha_fin` | Date | Fecha fin del alquiler actual |
| `alquiler` | Decimal | Importe mensual de alquiler (€) |
| `estado` | Enum | Estado actual del inmueble |
| `etiquetas` | String | Etiquetas para clasificación |
| `superficie` | Decimal | Superficie en m² |
| `habitaciones` | Integer | Número de habitaciones |
| `referencia_catastral` | String | Referencia catastral oficial |
| `anio_construccion` | Integer | Año de construcción |
| `imagen_carpeta` | String | Carpeta de imágenes asociada |
| `created_at` | Timestamp | Fecha de creación |
| `updated_at` | Timestamp | Última modificación |

## Estados

Cada inmueble tiene uno de estos 5 estados:

| Estado | Descripción |
|--------|-------------|
| **Libre** | Disponible para alquilar |
| **Ocupado** | En uso pero sin contrato formal |
| **Alquilado** | Con contrato activo |
| **Reservado** | Comprometido, pendiente de formalizar |
| **En reforma** | En obras, no disponible |

## Ejemplos con el agente IA

### Buscar inmuebles

```
Usuario: Muéstrame todos mis inmuebles en Madrid.

Agente: [usa herramienta search]
```

```json
{
  "entity": "activos",
  "query": "Madrid"
}
```

### Buscar por estado

```
Usuario: ¿Cuántos pisos tengo libres?

Agente: [usa herramienta search]
```

```json
{
  "entity": "activos",
  "filters": { "estado": "Libre" }
}
```

### Crear un inmueble

```
Usuario: Da de alta un piso en Calle Colón 22, Valencia.
         90m², 3 habitaciones, alquiler 950€.
```

```json
{
  "entity": "activos",
  "operation": "create",
  "fields": {
    "activo": "Piso Calle Colón",
    "direccion": "Calle Colón 22, Valencia",
    "alquiler": 950.00,
    "superficie": 90,
    "habitaciones": 3,
    "estado": "Libre"
  }
}
```

### Actualizar estado

```
Usuario: Marca el piso de Calle Mayor como "En reforma".
```

```json
{
  "entity": "activos",
  "operation": "update",
  "id": 1,
  "fields": { "estado": "En reforma" }
}
```

## Importación masiva

Puedes importar inmuebles desde un archivo CSV con el endpoint:

```
POST /admin/api/import/activos
Content-Type: multipart/form-data
```

El CSV debe incluir las columnas correspondientes a los campos de la tabla. Los campos `id`, `created_at` y `updated_at` se generan automáticamente.

## Exportación

```
GET /admin/api/export/activos
```

Exporta todos los inmuebles en formato CSV.

## Vista resumen

La vista SQL `v_activos_resumen` proporciona un resumen de cada propiedad con los días restantes hasta el vencimiento del contrato actual.

## Galería de fotos

Cada inmueble puede tener una carpeta de imágenes asociada mediante el campo `imagen_carpeta`. Las imágenes se gestionan a través del endpoint `/admin/api/images/folders`.
