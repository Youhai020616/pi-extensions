# 🧩 Pi Extensions & Skills

[![Pi Package](https://img.shields.io/badge/pi--package-v1.0.0-blue?style=flat-square)](https://github.com/badlogic/pi-mono)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

A [Pi Package](https://github.com/badlogic/pi-mono) bundling custom **extensions** and **skills** for the [Pi coding agent](https://github.com/badlogic/pi-mono).

> Extensions add tools and capabilities to Pi. Skills guide the agent's behavior and workflows.

## ⚡ Quick Install

```bash
pi install git:github.com/Youhai020616/pi-extensions
```

All extensions and skills are loaded automatically. Update anytime with:

```bash
pi update
```

---

## 📦 Extensions

| Extension | Description |
|-----------|-------------|
| [telegram-bot](./extensions/telegram-bot/) | 📱 Remote control Pi from Telegram with native streaming output via `sendMessageDraft` (Bot API 9.5) |
| [mcp-bridge](./extensions/mcp-bridge/) | 🔌 Single `mcp` tool for all MCP servers (GitHub, Tavily, Neon, Resend, etc.) — replaces verbose CLAUDE.md instructions, saves ~90% context |

### Telegram Bot Highlights

- **Bidirectional** — Send messages from Telegram, Pi responds in both Telegram and terminal
- **Native streaming** — Text appears word-by-word like ChatGPT, powered by `sendMessageDraft`
- **Auto-connect** — Set `TELEGRAM_BOT_TOKEN` env var, Pi connects on startup
- **Zero dependencies** — Uses Node.js built-in `fetch`, no npm install needed

👉 See [telegram-bot/README.md](./extensions/telegram-bot/README.md) for full setup guide.

### MCP Bridge Highlights

- **One tool, all servers** — `list`, `search`, `schema`, `call` actions cover the full workflow
- **Context efficient** — Replaces ~1500 tokens of CLAUDE.md instructions with ~200 token tool description
- **Auto-discovery** — LLM can search and inspect tools before calling them
- **JSON parsing** — Automatically extracts and formats response content

👉 See [mcp-bridge/README.md](./extensions/mcp-bridge/README.md) for full setup guide.

---

## 🧠 Skills

13 skills covering the full development lifecycle — from brainstorming to shipping. Zero redundancy, Pi-native compatible.

### 💡 Design & Planning

| Skill | When to Use |
|-------|-------------|
| [brainstorming](./skills/brainstorming/) | Before any creative work — creating features, building components, adding functionality. Explores intent, requirements and design before implementation. |
| [writing-plans](./skills/writing-plans/) | When you have a spec or requirements for a multi-step task, before touching code |

### 🔨 Implementation

| Skill | When to Use |
|-------|-------------|
| [test-driven-development](./skills/test-driven-development/) | When implementing any feature or bugfix — write tests before implementation code |
| [plan-execution](./skills/plan-execution/) | When you have a plan to execute or 2+ independent tasks — auto-selects between subagent dispatch, parallel agents, or single-agent sequential mode |
| [using-git-worktrees](./skills/using-git-worktrees/) | When starting feature work that needs isolation — creates isolated git worktrees with smart directory selection |

### 🐛 Debugging & Verification

| Skill | When to Use |
|-------|-------------|
| [systematic-debugging](./skills/systematic-debugging/) | When encountering any bug, test failure, or unexpected behavior — before proposing fixes |
| [verification-before-completion](./skills/verification-before-completion/) | Before claiming work is done — requires running verification commands and confirming output. Includes common command templates for Node/Python/Rust/Go. |

### 🔍 Code Review & Shipping

| Skill | When to Use |
|-------|-------------|
| [receiving-code-review](./skills/receiving-code-review/) | When receiving feedback — requires technical rigor, not blind implementation |
| [finishing-a-development-branch](./skills/finishing-a-development-branch/) | When implementation is complete — self code review, test verification, merge/PR/cleanup options, commit conventions |

### 🏗️ Engineering Practices

| Skill | When to Use |
|-------|-------------|
| [api-design](./skills/api-design/) | When designing, building, or reviewing REST/GraphQL APIs — endpoint design, error handling, versioning, auth |
| [docker-deploy](./skills/docker-deploy/) | When containerizing apps — Dockerfile best practices, docker-compose, CI/CD pipelines |
| [security-checklist](./skills/security-checklist/) | When reviewing security — OWASP Top 10, secrets management, input validation, dependency audit |

### 🛠️ Meta

| Skill | When to Use |
|-------|-------------|
| [writing-skills](./skills/writing-skills/) | When creating, editing, or verifying skills before deployment |

---

## 🚀 Typical Workflow

Skills chain naturally through a feature development lifecycle:

```
1. "I want to add a comments feature"
   → brainstorming (explore requirements, design solution)

2. "Design approved, create a plan"
   → writing-plans (break into tasks, write implementation plan)

3. "Start development"
   → using-git-worktrees (create isolated branch)
   → plan-execution (execute tasks step by step)
   → test-driven-development (TDD for each task)

4. "Tests are failing"
   → systematic-debugging (find root cause before fixing)

5. "Done, ready to ship"
   → verification-before-completion (run tests, verify)
   → finishing-a-development-branch (review + merge/PR)
```

You don't need to remember skill names — just describe your task and Pi auto-selects the right skill. Use `/skill:name` to force a specific one.

---

## 📁 Project Structure

```
pi-extensions/
├── package.json                ← Pi Package manifest
├── extensions/
│   ├── telegram-bot/
│   │   ├── telegram-bot.ts
│   │   └── README.md
│   └── mcp-bridge/
│       ├── mcp-bridge.ts
│       └── README.md
└── skills/
    ├── brainstorming/          ← 13 skills
    ├── writing-plans/
    ├── test-driven-development/
    ├── plan-execution/
    ├── using-git-worktrees/
    ├── systematic-debugging/
    ├── verification-before-completion/
    ├── receiving-code-review/
    ├── finishing-a-development-branch/
    ├── api-design/
    ├── docker-deploy/
    ├── security-checklist/
    └── writing-skills/
```

## 🔧 Manual Install

If you prefer not to use `pi install`:

```bash
# Single extension
cp extensions/telegram-bot/telegram-bot.ts ~/.pi/agent/extensions/

# Single skill
cp -r skills/brainstorming ~/.pi/agent/skills/

# Everything
cp -r extensions/* ~/.pi/agent/extensions/
cp -r skills/* ~/.pi/agent/skills/
```

## ➕ Contributing

**Add an extension:**
1. Create `extensions/my-ext/` with a `.ts` file and `README.md`

**Add a skill:**
1. Create `skills/my-skill/` with a `SKILL.md`

Commit, push, and `pi update` pulls the changes.

## License

MIT
