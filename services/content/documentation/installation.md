---
title: "Instalación de Proplia"
description: "Requisitos, compilación y puesta en marcha de Proplia"
author: "Proplia"
slug: "installation"
keywords: "instalación, requisitos, setup, rust, postgresql"
kind: "guide"
public: true
tags: ["instalación", "setup"]
published_at: "2026-02-07"
updated_at: "2026-02-07"
---

# Instalación

## Requisitos previos

| Componente | Versión mínima | Notas |
|-----------|---------------|-------|
| Rust | Edition 2021 | `rustup update stable` |
| PostgreSQL | 16+ | Con extensiones por defecto |
| just | Cualquiera | Instalador de tareas (`cargo install just`) |

## Stack técnico

| Componente | Tecnología |
|-----------|-----------|
| Lenguaje | Rust (edition 2021) |
| Base de datos | PostgreSQL 16+ |
| HTTP | Axum 0.8 |
| Protocolo IA | MCP via rmcp 0.14 |
| Runtime | Tokio async |
| Build | Cargo workspace + `just` |
| PDF | genpdf (Rust) |

## Compilación

```bash
# Clonar el repositorio
git clone https://github.com/proplia/proplia.git
cd proplia

# Compilar todo el workspace
just build
```

El comando `just build` compila todos los crates del workspace, incluyendo:
- Servidor principal (API REST + dashboard)
- Servidor MCP (herramientas IA)
- Extensiones web

## Configuración de base de datos

Proplia usa PostgreSQL. Configura la conexión en las variables de entorno:

```bash
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/proplia
```

Las migraciones se ejecutan automáticamente al iniciar el servidor.

## Puesta en marcha

```bash
# Iniciar todos los servicios
just start
```

Esto arranca:
- Servidor principal en `http://localhost:8080`
- Dashboard de administración en `http://localhost:8080/admin`
- Servidor MCP en el puerto 5010
- Jobs programados (facturación, alertas, backups)

## Verificación

Comprueba que todo funciona:

```bash
# Verificar que el servidor responde
curl http://localhost:8080/api/v1/health

# Verificar el registro MCP
curl http://localhost:8080/api/v1/mcp/registry

# Verificar el registro de agentes
curl http://localhost:8080/api/v1/agents/registry
```

## Jobs programados

Al iniciar, se activan automáticamente 6 jobs:

| Job | Horario | Función |
|-----|---------|---------|
| `generar_facturas_mensuales` | Día 1, 6:00 | Genera facturas de alquiler |
| `contrato_expiry_alert` | Diario, 9:00 | Alertas de contratos por vencer |
| `cobro_pendiente_check` | Diario, 10:00 | Comprueba cobros pendientes |
| `backup` | Diario, 2:00 | Backup PostgreSQL |
| `resumen_mensual` | Día 1, 7:00 | Resumen financiero mensual |
| `seguro_expiry_alert` | Diario, 9:00 | Alertas de seguros por vencer |
