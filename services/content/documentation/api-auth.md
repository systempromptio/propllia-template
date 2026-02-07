---
title: "Autenticación API"
description: "WebAuthn (Passkeys), OAuth2 PKCE, JWT tokens y ejemplos de autenticación para la API de Proplia"
author: "Proplia"
slug: "api-auth"
keywords: "autenticación, oauth2, webauthn, passkeys, jwt, api"
kind: "reference"
public: true
tags: ["api", "autenticación", "oauth2", "referencia"]
published_at: "2026-02-07"
updated_at: "2026-02-07"
---

# Autenticación API

Proplia implementa dos métodos de autenticación: WebAuthn (Passkeys) para el dashboard web y OAuth2 PKCE para acceso a la API REST y MCP.

## WebAuthn (Passkeys)

El dashboard de administración usa WebAuthn para login sin contraseña:

1. El usuario accede a `/admin/login`
2. El navegador solicita la Passkey (huella digital, Face ID, llave de seguridad)
3. El servidor verifica la credencial
4. Se emite un JWT + refresh token

### Flujo

```
Navegador → GET /admin/login
         → POST /api/v1/core/webauthn/authenticate/start
         → Verificación biométrica local
         → POST /api/v1/core/webauthn/authenticate/finish
         ← JWT + Refresh Token
```

## OAuth2 PKCE

Para acceso programático a la API (aplicaciones externas, agentes IA, integraciones):

### 1. Generar code verifier y challenge

```bash
# Generar code_verifier (43-128 caracteres aleatorios)
CODE_VERIFIER=$(openssl rand -base64 32 | tr -d '=/+' | cut -c1-43)

# Generar code_challenge (SHA256 + base64url)
CODE_CHALLENGE=$(echo -n "$CODE_VERIFIER" | openssl dgst -sha256 -binary | base64 | tr '+/' '-_' | tr -d '=')
```

### 2. Solicitar autorización

```bash
curl "http://localhost:8080/api/v1/core/oauth/authorize?\
client_id=proplia&\
response_type=code&\
code_challenge=$CODE_CHALLENGE&\
code_challenge_method=S256&\
scope=admin&\
redirect_uri=http://localhost:8080/callback"
```

### 3. Intercambiar código por tokens

```bash
curl -X POST http://localhost:8080/api/v1/core/oauth/token \
  -H "Content-Type: application/json" \
  -d "{
    \"grant_type\": \"authorization_code\",
    \"code\": \"AUTH_CODE_RECIBIDO\",
    \"code_verifier\": \"$CODE_VERIFIER\",
    \"client_id\": \"proplia\",
    \"redirect_uri\": \"http://localhost:8080/callback\"
  }"
```

### Respuesta

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

## JWT Tokens

Los tokens de acceso son JWT firmados con la siguiente estructura:

```json
{
  "sub": "user_id",
  "scope": "admin",
  "iat": 1709251200,
  "exp": 1709254800
}
```

- **Duración**: 1 hora
- **Refresh**: Usa el refresh token para obtener un nuevo access token sin re-autenticar

### Refresh token

```bash
curl -X POST http://localhost:8080/api/v1/core/oauth/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "refresh_token",
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2g..."
  }'
```

## Usar la API autenticada

Incluye el token en el header `Authorization`:

```bash
# Listar inmuebles
curl http://localhost:8080/admin/api/activos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."

# Crear un inmueble
curl -X POST http://localhost:8080/admin/api/activos \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -H "Content-Type: application/json" \
  -d '{
    "activo": "Piso Centro",
    "direccion": "Calle Mayor 15, Madrid",
    "alquiler": 850.00,
    "estado": "Libre"
  }'
```

## Autenticación MCP

El servidor MCP usa OAuth2 con audience `a2a` (agent-to-agent). Los clientes MCP se autentican con el mismo flujo OAuth2 PKCE descrito arriba, con `scope=admin` y `audience=a2a`.

```json
{
  "mcpServers": {
    "proplia": {
      "url": "http://localhost:5010/sse",
      "auth": {
        "type": "oauth2",
        "token_url": "http://localhost:8080/api/v1/core/oauth/token",
        "client_id": "proplia",
        "scope": "admin"
      }
    }
  }
}
```
