# MCP Bridge — Pi Extension

Give Pi direct access to all your MCP servers (GitHub, Tavily, Neon, Resend, etc.) through a single `mcp` tool.

## Why

Without this extension, you need ~1500 tokens of instructions in `CLAUDE.md` teaching the LLM how to shell out to `mcp-cli`. With this extension, it's a native tool — the LLM calls it directly, saving **~90% context**.

**Before** (CLAUDE.md approach):
```
LLM → bash("mcp-cli github/search_code '{"query":"hooks"}'") → parse stdout
```

**After** (this extension):
```
LLM → mcp(action:"call", tool:"github/search_code", args:'{"query":"hooks"}')
```

## Setup

### 1. Install mcp-cli

```bash
bun install -g @anthropic/mcp-cli
# or: npm install -g @anthropic/mcp-cli
```

### 2. Install extension

```bash
cp mcp-bridge.ts ~/.pi/agent/extensions/
```

The extension auto-detects `mcp-cli` at `~/.bun/bin/mcp-cli`. Set `MCP_CLI_PATH` env var to override.

### 3. (Optional) Remove CLAUDE.md instructions

If you had MCP CLI instructions in your `CLAUDE.md`, you can remove them — this extension replaces them.

## Usage

The LLM uses the `mcp` tool automatically when it needs external services. You can also guide it:

| You say | LLM does |
|---------|----------|
| "Search GitHub for React hooks" | `mcp(action:"call", tool:"github/search_code", args:{query:"react hooks"})` |
| "What MCP tools are available?" | `mcp(action:"list")` |
| "Find tools related to email" | `mcp(action:"search", query:"email")` |
| "How do I use tavily search?" | `mcp(action:"schema", tool:"tavily-mcp/tavily_search")` |

## Tool Actions

| Action | Description | Required Params |
|--------|-------------|-----------------|
| `list` | List all servers and tools | — |
| `search` | Find tools by keyword | `query` |
| `schema` | View tool parameters | `tool` |
| `call` | Execute a tool | `tool`, optionally `args` |

## Supported Servers

Depends on your mcp-cli configuration. Common servers:

| Server | Examples |
|--------|----------|
| **github** | `search_code`, `create_pull_request`, `get_file_contents` |
| **tavily-mcp** | `tavily_search`, `tavily_extract`, `tavily_crawl` |
| **Neon** | `run_sql`, `create_project`, `list_projects` |
| **resend** | `send-email`, `list-audiences` |
| **e2b-server** | `run_code` |
| **hostinger-mcp** | Domain, hosting, VPS management |
| **n8n-mcp** | Workflow automation |
| **playwriter** | Browser automation |

## License

MIT
