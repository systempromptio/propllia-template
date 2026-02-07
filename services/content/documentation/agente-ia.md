---
title: "Agente IA"
description: "Gestiona tus alquileres por lenguaje natural con el agente IA de Proplia basado en MCP"
author: "Proplia"
slug: "agente-ia"
keywords: "agente ia, mcp, inteligencia artificial, lenguaje natural, chatbot"
kind: "feature"
public: true
tags: ["agente-ia", "mcp", "guía"]
published_at: "2026-02-07"
updated_at: "2026-02-07"
---

# Agente IA

Proplia incluye un agente de inteligencia artificial que permite gestionar tus alquileres por lenguaje natural. Pregunta, crea, modifica y consulta — sin menús, sin formularios.

## Qué es MCP

Model Context Protocol (MCP) es un protocolo abierto que conecta modelos de IA con herramientas externas. En lugar de usar una interfaz web con formularios, hablas con un agente que ejecuta las operaciones por ti.

```
Usuario → Agente IA (Proplia) → Herramientas MCP → PostgreSQL
```

El agente interpreta lo que necesitas, elige la herramienta adecuada, ejecuta la operación y te devuelve el resultado en lenguaje natural.

## 3 herramientas

El agente tiene acceso a 3 herramientas MCP:

| Herramienta | Función | Entidades |
|-------------|---------|-----------|
| **search** | Buscar registros | 11 entidades |
| **edit** | Crear, actualizar, eliminar | 10 entidades |
| **informe** | Generar informes | 6 tipos |

### search

Busca en 11 entidades: activos, contabilidad, contratos, inquilinos, propietarios, depositos, remesas_sepa, incidencias, seguros, alertas, audit_log.

Modos de búsqueda:
- **Por ID** — Busca un registro exacto
- **Por texto** — Búsqueda libre (ILIKE) en campos de texto
- **Por filtros** — Filtros exactos por campo (estado, tipo, etc.)
- **Paginación** — `limit` y `offset` para resultados grandes

### edit

Opera sobre 10 entidades (todas excepto audit_log):
- **create** — Crear nuevo registro
- **update** — Modificar registro existente (por ID)
- **delete** — Eliminar registro (por ID)

Cada operación genera automáticamente una entrada en `audit_log` con los valores anteriores y nuevos.

### informe

Genera 6 tipos de informe:
- **portfolio** — Resumen general de inmuebles (ocupación, alquileres)
- **financiero** — Balance de ingresos y gastos
- **contratos_por_vencer** — Contratos que expiran pronto (configurable con `days_ahead`)
- **morosidad** — Inquilinos con pagos pendientes
- **rentabilidad** — Rentabilidad neta por inmueble
- **flujo_caja** — Cash flow por periodo

## Conversaciones de ejemplo

### Gestión de inmuebles

```
Usuario: ¿Cuántos pisos tengo alquilados?
Agente: Tienes 12 inmuebles con estado "Alquilado" de un total de 15.
        3 están en estado "Libre".

Usuario: Muéstrame los que están libres.
Agente: Inmuebles disponibles:
        1. Calle Colón 22, Valencia — 950€/mes, 90m²
        2. Avda. Diagonal 415, Barcelona — 1,200€/mes, 110m²
        3. Calle Gran Vía 8, Madrid — 1,500€/mes, 85m²
```

### Facturación y pagos

```
Usuario: ¿Quién me debe dinero?
Agente: Informe de morosidad:
        - Juan García: 850€ (factura marzo, 15 días de retraso)
        - Ana Ruiz: 1,900€ (facturas enero y febrero)
        Total pendiente: 2,750€

Usuario: Registra que Juan García ha pagado.
Agente: Factura FAC-2026-003 actualizada a "Pagado".
        Fecha de pago: 2026-03-15.
```

### Informes

```
Usuario: Dame un informe de rentabilidad.
Agente: Rentabilidad por inmueble:
        | Inmueble | Ingresos | Gastos | Neto | Rent. |
        |----------|----------|--------|------|-------|
        | C/ Mayor 15 | 10,200€ | 2,400€ | 7,800€ | 76.5% |
        | C/ Colón 22 | 11,400€ | 1,800€ | 9,600€ | 84.2% |
        Media portfolio: 80.3%
```

## Compatibilidad

El agente es compatible con cualquier cliente MCP:

- **Claude** (Anthropic)
- **ChatGPT** (OpenAI)
- **Gemini** (Google)
- Cualquier aplicación que soporte el protocolo MCP

## Conexión

El servidor MCP está disponible en el puerto 5010 por defecto. Para conectar un cliente:

```json
{
  "mcpServers": {
    "proplia": {
      "url": "http://localhost:5010/sse"
    }
  }
}
```

La autenticación se realiza mediante OAuth2 (ver [Autenticación API](/documentation/api-auth)).
