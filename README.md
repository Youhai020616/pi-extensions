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

### Telegram Bot Highlights

- **Bidirectional** — Send messages from Telegram, Pi responds in both Telegram and terminal
- **Native streaming** — Text appears word-by-word like ChatGPT, powered by `sendMessageDraft`
- **Auto-connect** — Set `TELEGRAM_BOT_TOKEN` env var, Pi connects on startup
- **Zero dependencies** — Uses Node.js built-in `fetch`, no npm install needed

👉 See [telegram-bot/README.md](./extensions/telegram-bot/README.md) for full setup guide.

---

## 🧠 Skills

14 skills covering the full development lifecycle — from brainstorming to shipping.

### 💡 Design & Planning

| Skill | When to Use |
|-------|-------------|
| [brainstorming](./skills/brainstorming/) | Before any creative work — creating features, building components, adding functionality. Explores intent, requirements and design before implementation. |
| [writing-plans](./skills/writing-plans/) | When you have a spec or requirements for a multi-step task, before touching code |

### 🔨 Implementation

| Skill | When to Use |
|-------|-------------|
| [test-driven-development](./skills/test-driven-development/) | When implementing any feature or bugfix — write tests before implementation code |
| [executing-plans](./skills/executing-plans/) | When you have a written implementation plan to execute with review checkpoints |
| [subagent-driven-development](./skills/subagent-driven-development/) | When executing implementation plans with independent tasks in the current session |
| [dispatching-parallel-agents](./skills/dispatching-parallel-agents/) | When facing 2+ independent tasks that can run without shared state |
| [using-git-worktrees](./skills/using-git-worktrees/) | When starting feature work that needs isolation — creates isolated git worktrees with smart directory selection |

### 🐛 Debugging & Verification

| Skill | When to Use |
|-------|-------------|
| [systematic-debugging](./skills/systematic-debugging/) | When encountering any bug, test failure, or unexpected behavior — before proposing fixes |
| [verification-before-completion](./skills/verification-before-completion/) | Before claiming work is done — requires running verification commands and confirming output. Evidence before assertions. |

### 🔍 Code Review & Shipping

| Skill | When to Use |
|-------|-------------|
| [requesting-code-review](./skills/requesting-code-review/) | When completing tasks, implementing features, or before merging to verify requirements |
| [receiving-code-review](./skills/receiving-code-review/) | When receiving feedback — requires technical rigor, not blind implementation |
| [finishing-a-development-branch](./skills/finishing-a-development-branch/) | When implementation is complete and tests pass — guides merge, PR, or cleanup |

### 🛠️ Meta

| Skill | When to Use |
|-------|-------------|
| [using-superpowers](./skills/using-superpowers/) | At conversation start — establishes how to find and use skills |
| [writing-skills](./skills/writing-skills/) | When creating, editing, or verifying skills before deployment |

---

## 📁 Project Structure

```
pi-extensions/
├── package.json                ← Pi Package manifest
├── extensions/
│   └── telegram-bot/
│       ├── telegram-bot.ts     ← Extension code
│       └── README.md
└── skills/
    ├── brainstorming/          ← 14 skills
    │   ├── SKILL.md
    │   ├── scripts/
    │   └── ...
    ├── systematic-debugging/
    ├── test-driven-development/
    └── ...
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
