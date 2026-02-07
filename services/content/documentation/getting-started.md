---
title: "Primeros pasos con Proplia"
description: "Guía paso a paso para crear tu primer inmueble, inquilino, contrato y factura con Proplia"
author: "Proplia"
slug: "getting-started"
keywords: "primeros pasos, tutorial, inicio rápido, proplia"
kind: "guide"
public: true
tags: ["inicio", "tutorial"]
published_at: "2026-02-07"
updated_at: "2026-02-07"
---

# Primeros pasos con Proplia

Esta guía te lleva desde la instalación hasta generar tu primera factura en 5 pasos. Puedes usar el agente IA (lenguaje natural) o la API REST para cada operación.

## 1. Crear tu primer inmueble

Con el agente IA:

```
Usuario: Crea un inmueble en Calle Mayor 15, Madrid.
         Alquiler 850€/mes, 75m², 2 habitaciones, estado Libre.

Agente: He creado el inmueble con los siguientes datos:
        - Dirección: Calle Mayor 15, Madrid
        - Alquiler: 850.00€
        - Superficie: 75m²
        - Habitaciones: 2
        - Estado: Libre
```

El agente usa la herramienta `edit` con estos parámetros:

```json
{
  "entity": "activos",
  "operation": "create",
  "fields": {
    "activo": "Piso Calle Mayor",
    "direccion": "Calle Mayor 15, Madrid",
    "alquiler": 850.00,
    "superficie": 75,
    "habitaciones": 2,
    "estado": "Libre"
  }
}
```

Campos obligatorios: `activo`, `direccion`, `alquiler`, `estado`.

## 2. Añadir un inquilino

```
Usuario: Añade al inquilino Juan García, DNI 12345678A,
         email juan@email.com, teléfono 612345678.

Agente: Inquilino creado:
        - Nombre: Juan García
        - Identificación: 12345678A
        - Email: juan@email.com
        - Teléfono: 612345678
```

Campos obligatorios: `nombre`, `identificacion`.

Puedes incluir datos del fiador (avalista) con los campos `fiador_nombre`, `fiador_identificacion`, `fiador_telefono`, `fiador_email`.

## 3. Crear un contrato

```
Usuario: Crea un contrato de vivienda habitual para Juan García
         en Calle Mayor 15, desde el 1 de marzo 2026,
         alquiler 850€, duración 1 año.

Agente: Contrato creado:
        - Tipo: vivienda_habitual
        - Inquilino: Juan García
        - Inmueble: Calle Mayor 15, Madrid
        - Inicio: 2026-03-01
        - Fin: 2027-02-28
        - Alquiler: 850.00€
        - Versión LAU: aplicada automáticamente
        - Estado: Iniciado
```

El campo `version_lau` se asigna automáticamente según la fecha de inicio del contrato. Los 3 tipos disponibles son: `vivienda_habitual`, `temporada`, `comercial`.

## 4. Generar una factura

```
Usuario: Genera la factura de marzo 2026 para el contrato
         de Juan García.

Agente: Factura generada:
        - Referencia: FAC-2026-001
        - Concepto: Alquiler marzo 2026
        - Total: 850.00€
        - Estado: Emitida
```

Las facturas también se generan automáticamente el día 1 de cada mes con el job `generar_facturas_mensuales`.

## 5. Consultar informes

```
Usuario: Dame un informe de mi portfolio.

Agente: Informe de portfolio:
        - Total inmuebles: 1
        - Ocupados: 1 (100%)
        - Alquiler mensual total: 850.00€
        - Alquiler anual estimado: 10,200.00€
```

Los 6 tipos de informe disponibles son:
- `portfolio` — Resumen general de inmuebles
- `financiero` — Ingresos y gastos
- `contratos_por_vencer` — Contratos próximos a finalizar
- `morosidad` — Inquilinos con pagos pendientes
- `rentabilidad` — Rentabilidad neta por inmueble
- `flujo_caja` — Cash flow por periodo

## Siguiente paso

Consulta las guías detalladas de cada módulo en la barra lateral, o pregúntale directamente al agente IA lo que necesites.
