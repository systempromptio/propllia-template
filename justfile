set dotenv-load

CLI := `R="target/release/systemprompt"; D="target/debug/systemprompt"; if [ -f "$R" ] && [ -f "$D" ]; then if [ "$R" -nt "$D" ]; then echo "$R"; else echo "$D"; fi; elif [ -f "$R" ]; then echo "$R"; elif [ -f "$D" ]; then echo "$D"; else echo "echo 'ERROR: No CLI binary found. Run: just build'"; fi`

CLI_RELEASE := "target/release/systemprompt"

default *ARGS:
    {{CLI}} {{ARGS}}

[windows]
build *FLAGS:
    $env:SQLX_OFFLINE="true"; cargo build --workspace {{FLAGS}}

[unix]
build *FLAGS:
    #!/usr/bin/env bash
    set -euo pipefail
    export SYSTEMPROMPT_PROFILE="${SYSTEMPROMPT_PROFILE:-}"
    SECRETS_FILE="{{justfile_directory()}}/.systemprompt/profiles/local/secrets.json"
    USE_OFFLINE=false
    if [ -f "$SECRETS_FILE" ]; then
        DB_URL=$(sed -n 's/.*"database_url"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$SECRETS_FILE" 2>/dev/null | head -1)
        if [ -n "$DB_URL" ] && [ "$DB_URL" != "null" ]; then
            if pg_isready -d "$DB_URL" -t 2 >/dev/null 2>&1; then
                export DATABASE_URL="$DB_URL"
                echo "Using database: $DB_URL"
            else
                echo "Database not reachable, using offline mode"
                USE_OFFLINE=true
            fi
        else
            echo "No database_url in secrets, using offline mode"
            USE_OFFLINE=true
        fi
    else
        echo "No local profile secrets found, using offline mode"
        USE_OFFLINE=true
    fi
    cargo update systemprompt --quiet 2>/dev/null || true
    if [ "$USE_OFFLINE" = "true" ]; then
        SQLX_OFFLINE=true cargo build --workspace {{FLAGS}}
    else
        cargo build --workspace {{FLAGS}}
    fi

[windows]
clippy *FLAGS:
    $env:SQLX_OFFLINE="true"; cargo clippy --workspace {{FLAGS}} -- -D warnings

[unix]
clippy *FLAGS:
    #!/usr/bin/env bash
    set -euo pipefail
    SECRETS_FILE="{{justfile_directory()}}/.systemprompt/profiles/local/secrets.json"
    USE_OFFLINE=false
    if [ -f "$SECRETS_FILE" ]; then
        DB_URL=$(sed -n 's/.*"database_url"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$SECRETS_FILE" 2>/dev/null | head -1)
        if [ -n "$DB_URL" ] && [ "$DB_URL" != "null" ]; then
            if pg_isready -d "$DB_URL" -t 2 >/dev/null 2>&1; then
                export DATABASE_URL="$DB_URL"
            else
                USE_OFFLINE=true
            fi
        else
            USE_OFFLINE=true
        fi
    else
        USE_OFFLINE=true
    fi
    if [ "$USE_OFFLINE" = "true" ]; then
        SQLX_OFFLINE=true cargo clippy --workspace {{FLAGS}} -- -D warnings
    else
        cargo clippy --workspace {{FLAGS}} -- -D warnings
    fi

start:
    {{CLI}} infra services start --profile local

migrate:
    {{CLI}} infra db migrate

login ENV="production":
    {{CLI}} cloud auth login {{ENV}}

logout:
    {{CLI}} cloud auth logout

whoami:
    {{CLI}} cloud auth whoami

tenant:
    {{CLI}} cloud tenant
    {{CLI}} core skills sync --direction to-db -y

profile:
    {{CLI}} cloud profile

profiles:
    {{CLI}} cloud profile list

deploy *FLAGS:
    just build --release
    {{CLI_RELEASE}} cloud deploy {{FLAGS}}

docker-build TAG="local":
    docker build -f .systemprompt/Dockerfile -t systemprompt-template:{{TAG}} .

docker-run TAG="local":
    docker run -p 8080:8080 --env-file .env systemprompt-template:{{TAG}}

publish:
    {{CLI}} infra jobs run copy_extension_assets
    {{CLI}} infra jobs run publish_pipeline

webauthn-admin EMAIL:
    {{CLI}} admin users webauthn generate-setup-token --email "{{EMAIL}}"
