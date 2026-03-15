# Pi Extensions & Skills

A [Pi Package](https://github.com/badlogic/pi-mono) bundling custom extensions and skills for the Pi coding agent.

## Install

```bash
pi install git:github.com/Youhai020616/pi-extensions
```

That's it. All extensions and skills are loaded automatically.

## What's Inside

### Extensions

| Extension | Description |
|-----------|-------------|
| [telegram-bot](./extensions/telegram-bot/) | Remote control Pi from Telegram with native streaming output |

### Skills

| Skill | Description |
|-------|-------------|
| brainstorming | Explore ideas and design before implementation |
| dispatching-parallel-agents | Run 2+ independent tasks in parallel |
| executing-plans | Execute implementation plans with review checkpoints |
| finishing-a-development-branch | Guide completion of dev work (merge, PR, cleanup) |
| receiving-code-review | Handle code review feedback with technical rigor |
| requesting-code-review | Verify work meets requirements before merging |
| subagent-driven-development | Execute plans with independent subagent tasks |
| systematic-debugging | Debug any bug or test failure methodically |
| test-driven-development | Write tests before implementation |
| using-git-worktrees | Create isolated git worktrees for feature work |
| using-superpowers | Find and use skills effectively |
| verification-before-completion | Verify before claiming work is done |
| writing-plans | Create detailed implementation plans from specs |
| writing-skills | Create, edit, and verify skills |

## Project Structure

```
pi-extensions/
├── package.json              ← Pi Package manifest
├── extensions/
│   └── telegram-bot/
│       ├── telegram-bot.ts
│       └── README.md
└── skills/
    ├── brainstorming/
    ├── systematic-debugging/
    ├── test-driven-development/
    └── ... (14 skills total)
```

## Manual Install

If you prefer not to use `pi install`, copy individual pieces:

```bash
# Single extension
cp extensions/telegram-bot/telegram-bot.ts ~/.pi/agent/extensions/

# Single skill
cp -r skills/brainstorming ~/.pi/agent/skills/

# All skills
cp -r skills/* ~/.pi/agent/skills/
```

## Adding New Extensions / Skills

1. **Extension**: Create a folder under `extensions/` with a `.ts` file and `README.md`
2. **Skill**: Create a folder under `skills/` with a `SKILL.md`
3. Commit and push — anyone with `pi install` gets the update via `pi update`

## License

MIT
