---
title: "Migrate from OpenClaw to SystemPrompt"
description: "Complete guide to migrating your OpenClaw (ClawdBot/Moltbot) installation to SystemPrompt with memory preservation."
priority: 10
keywords:
  - migrate
  - openclaw
  - clawdbot
  - moltbot
  - import
  - memories
  - conversion
category: guide
---

# Migrate from OpenClaw to SystemPrompt

This playbook guides you through migrating an existing OpenClaw (formerly ClawdBot/Moltbot) installation to SystemPrompt while preserving your agent's memories and personality.

---

## Prerequisites

Before starting:

1. **OpenClaw Installation** — Working OpenClaw setup with memories to export
2. **SystemPrompt Installed** — Follow `guide_start` for installation
3. **PostgreSQL Running** — SystemPrompt database configured
4. **Active Session** — Run `just login` to authenticate

Verify prerequisites:

```bash
# Check OpenClaw is accessible
openclaw --version

# Check SystemPrompt is running
systemprompt admin session show

# Check database is ready
systemprompt infra db status
```

---

## Step 1: Export OpenClaw Data

Export your OpenClaw memories and configuration:

```bash
# Export memories in SQL format (for direct import)
openclaw export --memories --format sql > openclaw_memories.sql

# Export configuration for reference
openclaw export --config --format yaml > openclaw_config.yaml

# Optional: Export as JSON for inspection
openclaw export --memories --format json > openclaw_memories.json
```

**What gets exported:**
- Conversation memories and context
- Personality traits and preferences
- Channel configurations (Discord, Slack, etc.)
- Custom skills and responses

---

## Step 2: Create SystemPrompt Agent

Create a new agent to receive the imported data:

```bash
# Create the agent
systemprompt admin agents create --name assistant --port 9020

# Verify creation
systemprompt admin agents show assistant
```

---

## Step 3: Run Database Migrations

Ensure the database schema is ready:

```bash
# Run all pending migrations
systemprompt infra db migrate
```

---

## Step 4: Import OpenClaw Memories

Import the exported SQL data:

```bash
# Import memories directly
cat openclaw_memories.sql | systemprompt infra db execute

# Or use the file path
systemprompt infra db execute --file openclaw_memories.sql
```

**Verify import:**

```bash
# Check memory count
systemprompt infra db query "SELECT COUNT(*) as memory_count FROM memory_entities"

# Sample imported memories
systemprompt infra db query "SELECT entity_type, content FROM memory_entities LIMIT 5"
```

---

## Step 5: Set Discord Secrets

If using Discord (most OpenClaw users), set the bot token:

```bash
# Set Discord bot token (uses same token as OpenClaw)
systemprompt cloud secrets set DISCORD_BOT_TOKEN <your-token>

# Verify secret is set
systemprompt cloud secrets list
```

---

## Step 6: Test Setup

---

## Step 8: Enable Agent

Start your migrated agent:

```bash
# Enable the agent
systemprompt admin agents edit assistant --enable

# Verify it's running
systemprompt admin agents status assistant
```

---

## Step 9: Test Discord Connection

Verify Discord integration:

```bash
# Test Discord connection
systemprompt discord test --channel general

# Send a test message
systemprompt discord send --channel general --message "Migration complete! Assistant is now live on SystemPrompt."
```

---

## Verification Checklist

Run through this checklist to confirm successful migration:

| Check | Command | Expected |
|-------|---------|----------|
| Agent exists | `systemprompt admin agents show assistant` | Shows agent config |
| Agent running | `systemprompt admin agents status assistant` | Status: running |
| Memories imported | `systemprompt infra db query "SELECT COUNT(*) FROM memory_entities"` | > 0 |
| Jobs active | `systemprompt infra jobs list` | Jobs listed |
| Discord connected | `systemprompt discord test` | Status: Connected |

---

## Troubleshooting

### Import Fails with SQL Errors

OpenClaw schema may differ. Convert the export:

```bash
# Inspect the export format
head -50 openclaw_memories.sql

# Manually adjust column names if needed
# Then retry import
```

### Memories Not Appearing

Check the memory_entities table schema:

```bash
systemprompt infra db query "\\d memory_entities"
```

### Discord Bot Not Connecting

Verify the token is correct:

```bash
# Re-set the token
systemprompt cloud secrets set DISCORD_BOT_TOKEN <token>

# Restart the agent
systemprompt admin agents edit assistant --disable
systemprompt admin agents edit assistant --enable
```

### Jobs Not Running

Check job status:

```bash
systemprompt infra jobs list
systemprompt infra logs view --level error --since 1h
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Export OpenClaw memories | `openclaw export --memories --format sql > openclaw_memories.sql` |
| Create agent | `systemprompt admin agents create --name assistant --port 9020` |
| Run migrations | `systemprompt infra db migrate` |
| Import memories | `cat openclaw_memories.sql \| systemprompt infra db execute` |
| Set Discord token | `systemprompt cloud secrets set DISCORD_BOT_TOKEN <token>` |
| Enable agent | `systemprompt admin agents edit assistant --enable` |
| Test Discord | `systemprompt discord test --channel general` |

---

## What's Different in SystemPrompt

Key differences from OpenClaw:

| Feature | OpenClaw | SystemPrompt |
|---------|----------|--------------|
| Memory storage | SQLite/JSON | PostgreSQL |
| Scheduling | Cron files | Built-in job scheduler |
| Extensions | Runtime plugins | Compile-time extensions |
| Channels | Gateway process | Native Discord CLI |
| Deployment | Docker/local | Cloud or self-hosted |

---

## Next Steps

After migration:

1. **Set up scheduled updates**: `systemprompt core playbooks show cli_jobs`
3. **Explore other extensions**: `systemprompt plugins list`
4. **Deploy to production**: `systemprompt core playbooks show cli_deploy`
