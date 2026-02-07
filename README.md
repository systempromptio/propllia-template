<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://systemprompt.io/files/images/logo.svg">
  <source media="(prefers-color-scheme: light)" srcset="https://systemprompt.io/files/images/logo-dark.svg">
  <img src="https://systemprompt.io/files/images/logo-dark.svg" alt="systemprompt.io" width="400">
</picture>

**SaaS landing page template — edit YAML, get a production website.**

[![GitHub Template](https://img.shields.io/badge/GitHub-Template-blue?logo=github)](https://github.com/systempromptio/propllia-template/generate)
[![Built on systemprompt-core](https://img.shields.io/badge/built%20on-systemprompt--core-blue)](https://github.com/systempromptio/systemprompt-core)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Rust](https://img.shields.io/badge/rust-1.75+-orange.svg)](https://www.rust-lang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18+-336791.svg)](https://www.postgresql.org/)
[![MCP](https://img.shields.io/badge/MCP-compatible-purple.svg)](https://modelcontextprotocol.io/)
[![Discord](https://img.shields.io/badge/Discord-Join%20us-5865F2.svg)](https://discord.gg/wkAbSuPWpr)

[Documentation](https://systemprompt.io/documentation) · [Discord](https://discord.gg/wkAbSuPWpr) · [Issues](https://github.com/systempromptio/propllia-template/issues)

</div>

---

Clone this template, edit YAML config files, and get a complete SaaS landing page with homepage, feature pages, blog, pricing tiers, documentation, and an AI chatbot — ready to deploy.

The included example content is for [Proplia](https://proplia.io), a Spanish property management product. Replace the YAML and Markdown with your own product and language.

Built on [systemprompt.io](https://systemprompt.io). Compiles to a single Rust binary. One dependency: PostgreSQL.

---

## What You Get

| Page | Description | Config File |
|------|-------------|-------------|
| **Homepage** | Hero section, features grid, how-it-works steps, pricing tiers, CTAs | `services/web/config/homepage.yaml` |
| **Feature pages** | 7 detailed pages with sections, inline SVG visuals, related links | `services/web/config/features/*.yaml` |
| **Blog** | Markdown posts with SEO meta tags, sitemap, structured data | `services/content/blog/*/index.md` |
| **Documentation** | Docs section with sidebar navigation | `services/content/documentation/` |
| **Demo page** | Interactive product demo | `services/web/config/demo.yaml` |
| **AI Agent** | Chatbot that answers visitor questions about your product | `services/agents/welcome.yaml` |

---

## Quick Start

### Prerequisites

- **Rust 1.75+**: [rustup.rs](https://rustup.rs/)
- **just**: command runner (`cargo install just`)
- **Docker**: for local PostgreSQL ([docker.com](https://www.docker.com/))

### 1. Use This Template

Click **"Use this template"** on GitHub, or:

```bash
gh repo create my-saas --template systempromptio/propllia-template --clone
cd my-saas
```

### 2. Build

```bash
just build
```

### 3. Setup

```bash
just login      # Authenticate with systemprompt.io cloud
just tenant     # Create your tenant and database
```

### 4. Start

```bash
just start
```

Visit **http://localhost:8080** — you'll see the full landing page with all sections live.

---

## Customize Your Landing Page

Everything is driven by YAML and Markdown. No code changes needed for content.

```
services/
  web/
    metadata.yaml            ← Site name, SEO, base URL (start here)
    config/
      homepage.yaml          ← Hero, features grid, pricing, CTAs
      features/*.yaml        ← One file per feature page (7 included)
      theme.yaml             ← Colors, fonts, branding
      navigation.yaml        ← Header menus, footer links, docs sidebar
      demo.yaml              ← Demo page content
    templates/               ← Handlebars HTML templates (advanced)
  content/
    blog/*/index.md          ← Blog posts (Markdown with frontmatter)
  agents/
    welcome.yaml             ← AI agent personality and product knowledge
```

### Site identity — `services/web/metadata.yaml`

```yaml
site:
  name: "Your Project"
  title: "Your Project - Your Tagline Here"
  description: "Replace this with your project description for SEO and social sharing."
  author: "Your Name"
  baseUrl: "https://your-domain.com"

seo:
  defaultImage: "/files/images/logo.png"
  twitterHandle: "@your_handle"
  keywords: "your, keywords, here"
```

### Branding — `services/web/config/theme.yaml`

```yaml
branding:
  name: "YourProduct"
  title: "YourProduct - Your tagline"
  themeColor: "#0D7D6C"      # Change to your brand color
  display_sitename: true
  twitter_handle: "@your_handle"
```

### Homepage — `services/web/config/homepage.yaml`

The homepage YAML controls every section: hero text and CTAs, a features grid with icons and descriptions, how-it-works steps, pricing tiers (free/paid/enterprise), and a final call-to-action. Edit the file and restart to see changes.

### Feature pages — `services/web/config/features/*.yaml`

Each feature gets its own YAML file with a headline, highlight badges, multiple content sections (supporting HTML, tables, SVG visuals), item lists, and links to related features. Add or remove files to control which feature pages exist.

### Blog — `services/content/blog/`

Each post is a directory with an `index.md` file. Frontmatter defines title, description, author, tags, and published date. The template handles SEO meta tags, Open Graph, structured data, and sitemap generation automatically.

---

## Project Structure

```
propllia-template/
├── services/                   # Your content — YAML and Markdown
│   ├── web/
│   │   ├── metadata.yaml       # Site identity and SEO
│   │   ├── config/             # Homepage, features, theme, navigation
│   │   └── templates/          # Handlebars HTML templates
│   ├── content/
│   │   └── blog/               # Blog posts (Markdown)
│   └── agents/
│       └── welcome.yaml        # AI welcome agent
│
├── extensions/                 # Rust code — advanced customization
│   ├── web/                    # Web rendering engine
│   ├── soul/                   # Memory system
│   └── mcp/                    # MCP servers (4 included)
│
├── storage/files/              # Static assets (images, fonts, CSS)
├── Cargo.toml                  # Rust workspace (systemprompt-core dependency)
└── justfile                    # Development commands
```

**Key rules:**
- Content and config go in `services/` (YAML and Markdown only)
- Rust code goes in `extensions/`
- CSS goes in `storage/files/css/`

---

## Commands

| Command | Description |
|---------|-------------|
| `just build` | Build the project |
| `just start` | Start the server (localhost:8080) |
| `just login` | Authenticate with systemprompt.io cloud |
| `just tenant` | Create tenant, database, and run migrations |
| `just deploy` | Build release and deploy to cloud |
| `just docker-build` | Build Docker image |
| `just docker-run` | Run in Docker container |

---

## Built on systemprompt.io

This template extends [systemprompt-core](https://github.com/systempromptio/systemprompt-core), which provides the web server, template rendering, agent runtime, MCP protocol, authentication (OAuth2 + WebAuthn), database migrations, and observability. You own the code and extend it through the `extensions/` directory.

Works with Claude Code, Claude Desktop, ChatGPT, and any MCP-compatible client.

See the full reference at **[systemprompt.io/documentation](https://systemprompt.io/documentation)**.

---

## License

MIT — see [LICENSE](LICENSE).

Depends on [systemprompt-core](https://github.com/systempromptio/systemprompt-core) (FSL-1.1-ALv2).

---

<div align="center">

**[Documentation](https://systemprompt.io/documentation)** · **[Discord](https://discord.gg/wkAbSuPWpr)** · **[systemprompt-core](https://github.com/systempromptio/systemprompt-core)** · **[Issues](https://github.com/systempromptio/propllia-template/issues)**

Questions? Join us on [Discord](https://discord.gg/wkAbSuPWpr).

</div>
