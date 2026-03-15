# Pi Extensions

A collection of extensions for the [Pi coding agent](https://github.com/badlogic/pi-mono).

## Extensions

| Extension | Description |
|-----------|-------------|
| [telegram-bot](./telegram-bot/) | Remote control Pi from Telegram with native streaming output |

## Installation

Each extension is a standalone folder. Copy the folder (or just the `.ts` file) to your Pi extensions directory:

```bash
# Global (all projects)
cp -r telegram-bot/ ~/.pi/agent/extensions/telegram-bot/

# Or just the single file
cp telegram-bot/telegram-bot.ts ~/.pi/agent/extensions/
```

Then run `/reload` in Pi to load the extension.

## Creating a New Extension

1. Create a new folder under this repo: `my-extension/`
2. Add your `my-extension.ts` (or `index.ts`) inside
3. Add a `README.md` describing usage
4. Submit a PR or push directly

## License

MIT
