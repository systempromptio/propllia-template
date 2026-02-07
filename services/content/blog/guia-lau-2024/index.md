---
title: "Guía completa de la LAU 2024: lo que necesitas saber"
description: "Todo sobre la Ley de Arrendamientos Urbanos vigente: duraciones, actualizaciones de renta, derechos y obligaciones"
slug: "guia-lau-2024"
kind: "blog"
public: true
author: "Proplia"
published_at: "2026-02-07"
tags: ["lau", "legal", "contratos"]
category: "article"
---

# Guía completa de la LAU 2024: lo que necesitas saber

La Ley de Arrendamientos Urbanos (LAU) regula todos los contratos de alquiler en España. Si gestionas propiedades de alquiler, entender la LAU no es opcional — es obligatorio. Esta guía cubre lo esencial: tipos de contrato, duraciones, actualizaciones de renta y cómo Proplia te ayuda a cumplir automáticamente.

## Evolución de la LAU

La LAU ha sufrido varias reformas importantes:

| Año | Reforma | Cambio principal |
|-----|---------|-----------------|
| 1994 | LAU original | Liberalización del mercado de alquiler |
| 2013 | Reforma PP | Duración mínima reducida a 3 años |
| 2019 | RDL 7/2019 | Duración mínima devuelta a 5 años (7 para empresas) |
| 2023-2024 | Ley de Vivienda | Límites de renta en zonas tensionadas, índice de referencia |

Cada contrato se rige por la versión de la LAU vigente en el momento de su firma. Por eso es crítico registrar qué versión aplica — Proplia lo hace automáticamente con el campo `version_lau`.

## Tipos de contrato

### Vivienda habitual

Es el contrato más regulado. Se aplica cuando el inmueble es la residencia permanente del inquilino.

| Aspecto | Regla actual (RDL 7/2019) |
|---------|--------------------------|
| Duración mínima | 5 años (persona física) / 7 años (persona jurídica) |
| Prórroga tácita | 3 años adicionales si ninguna parte notifica |
| Preaviso (arrendador) | 4 meses antes del vencimiento |
| Preaviso (inquilino) | 2 meses antes del vencimiento |
| Desistimiento inquilino | Tras 6 meses, con 30 días de preaviso |
| Fianza | 1 mensualidad obligatoria |
| Garantías adicionales | Hasta 2 mensualidades (contratos < 5/7 años) |

### Temporada

Para usos no permanentes: estudios, trabajo temporal, vacaciones.

| Aspecto | Regla |
|---------|-------|
| Duración | La pactada (sin mínimo legal) |
| Prórroga | Solo si se pacta |
| Fianza | 2 mensualidades obligatorias |
| Regulación | Menos protección para el inquilino |

### Comercial

Para locales, oficinas y uso distinto de vivienda.

| Aspecto | Regla |
|---------|-------|
| Duración | La pactada (sin mínimo legal) |
| Indemnización | Si dura > 5 años, posible indemnización al inquilino |
| Fianza | 2 mensualidades obligatorias |
| Traspaso | Regulado específicamente |

## Actualización de renta

### Hasta 2024

La renta se actualizaba anualmente según el IPC (Índice de Precios al Consumo).

### 2024 en adelante

La Ley de Vivienda introduce el **Índice de Referencia de Arrendamientos** del INE, que sustituye al IPC para actualizar alquileres. El objetivo es que las subidas sean más moderadas que el IPC general.

Para 2024, el límite de subida fue del 3%. A partir de 2025, se aplica el nuevo índice de referencia.

### Zonas tensionadas

En zonas declaradas como "tensionadas" por las comunidades autónomas:
- **Contrato nuevo (mismo inquilino)**: La renta no puede superar la del contrato anterior
- **Contrato nuevo (nuevo inquilino, gran tenedor)**: La renta se limita al índice de referencia
- **Contrato nuevo (nuevo inquilino, pequeño propietario)**: La renta no puede superar la del contrato anterior + índice de referencia

## Fianza y garantías

| Tipo de contrato | Fianza obligatoria | Garantías adicionales |
|------------------|-------------------|----------------------|
| Vivienda habitual | 1 mensualidad | Hasta 2 mensualidades |
| Temporada | 2 mensualidades | Sin límite legal |
| Comercial | 2 mensualidades | Sin límite legal |

La fianza se deposita en el organismo correspondiente de cada comunidad autónoma (ej: IVIMA en Madrid, INCASÒL en Cataluña).

## Derechos del inquilino

Los principales derechos irrenunciables en vivienda habitual:

- **Duración mínima**: 5/7 años independientemente de lo pactado
- **Prórroga tácita**: 3 años adicionales
- **Subrogación**: En caso de fallecimiento o separación
- **Desistimiento**: Tras 6 meses con preaviso
- **Tanteo y retracto**: Derecho preferente de compra
- **Obras de accesibilidad**: El inquilino puede realizarlas

## Cómo Proplia gestiona la LAU

Proplia automatiza el cumplimiento de la LAU:

### Versionado automático

Cada contrato registra la versión de la LAU vigente en el campo `version_lau`. Esto asegura que:
- Los derechos y obligaciones correctos se aplican
- Los cambios legislativos no afectan retroactivamente a contratos existentes
- Hay trazabilidad legal completa

### Alertas de vencimiento

El sistema genera alertas automáticas:
- **90 días**: Preaviso temprano
- **60 días**: Acción recomendada
- **30 días**: Preaviso urgente

### Tipos de contrato

Al crear un contrato, Proplia requiere especificar el tipo (`vivienda_habitual`, `temporada`, `comercial`) para aplicar las reglas correctas.

### Ejemplo con el agente IA

```
Tú: ¿Qué contratos de vivienda habitual vencen pronto?

Agente: 2 contratos vencen en los próximos 90 días:
        1. Juan García (C/ Mayor 15) — vence 01/05/2026 (83 días)
           Tipo: vivienda_habitual, LAU: RDL 7/2019
        2. Ana Ruiz (C/ Colón 22) — vence 15/04/2026 (67 días)
           Tipo: vivienda_habitual, LAU: RDL 7/2019

        Recuerda: preaviso mínimo de 4 meses para no renovar.
        Juan García ya está fuera de plazo de preaviso.
```

## Resumen

| Concepto | Vivienda habitual | Temporada | Comercial |
|----------|------------------|-----------|-----------|
| Duración mínima | 5/7 años | Pactada | Pactada |
| Fianza | 1 mes | 2 meses | 2 meses |
| Actualización renta | Índice referencia | Pactada | Pactada |
| Prórroga tácita | 3 años | No | No |
| Preaviso arrendador | 4 meses | Pactado | Pactado |

Para gestionar tus contratos con cumplimiento LAU automático, empieza gratis en [proplia.io](https://proplia.io). Consulta la [documentación de contratos](/documentation/contratos) para más detalles técnicos.
