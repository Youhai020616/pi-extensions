# Telegram Bot — Pi Remote Control

Remote control your Pi coding agent from Telegram. Send messages from your phone, receive Pi's responses with **native streaming output** (text appears word-by-word).

## Features

- 🔄 **Bidirectional** — Both terminal and Telegram can send messages to Pi
- ⚡ **Native streaming** — Uses `sendMessageDraft` (Bot API 9.5) for real-time text output
- 📱 **Typing indicator** — Telegram shows "typing..." while Pi processes
- 📏 **Long message splitting** — Auto-splits responses exceeding 4000 characters
- 🔌 **Auto-connect** — Connects automatically on Pi startup if token is configured
- 🔒 **Chat ID restriction** — Optionally limit access to a specific Telegram chat

## Setup

### 1. Create a Telegram Bot

1. Open [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the prompts
3. Copy the API token

### 2. Configure

```bash
# Required: set your bot token
export TELEGRAM_BOT_TOKEN="your-token-here"

# Optional: restrict to your chat only (recommended for security)
export TELEGRAM_CHAT_ID="your-chat-id"
```

Add these to your `~/.bashrc` or `~/.zshrc` for persistence.

### 3. Install

Copy the extension to Pi's extensions directory:

```bash
cp telegram-bot.ts ~/.pi/agent/extensions/
```

Or symlink if you want to keep it in sync with this repo:

```bash
ln -s /path/to/pi-extensions/telegram-bot/telegram-bot.ts ~/.pi/agent/extensions/telegram-bot.ts
```

## Usage

| Command | Description |
|---------|-------------|
| `/telegram-bot` | Toggle connection (connect/disconnect) |
| `/telegram-bot <token>` | Connect with a specific token |
| `/telegram-bot stop` | Disconnect |
| `/telegram-bot status` | Show connection info |

If `TELEGRAM_BOT_TOKEN` is set, the bot **auto-connects** when Pi starts — no need to run `/telegram-bot` manually.

## How It Works

```
You (Telegram)                    Pi (Terminal)
     │                                │
     ├── Send message ───────────────→│ (injected as user message)
     │                                │
     │                                │ Pi processes...
     │  ← sendMessageDraft (stream) ──┤ (text appears word-by-word)
     │  ← sendMessageDraft (stream) ──┤
     │  ← sendMessageDraft (stream) ──┤
     │                                │
     │  ← sendMessage (final) ────────┤ (draft replaced by final message)
     │                                │
```

## Requirements

- Pi coding agent
- Telegram Bot API 9.5+ (for `sendMessageDraft` streaming)
- Node.js 18+ (for built-in `fetch`)

## License

MIT
