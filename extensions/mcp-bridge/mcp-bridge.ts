/**
 * MCP Bridge Extension for Pi
 *
 * Provides a single `mcp` tool that gives the LLM direct access to all MCP servers
 * (GitHub, Tavily, Neon, Resend, etc.) via the mcp-cli binary.
 *
 * Replaces verbose CLAUDE.md instructions (~1500 tokens) with a single tool registration
 * (~200 tokens), saving ~90% context on every conversation.
 *
 * Actions:
 *   - list:   List all available servers and tools
 *   - search: Find tools by keyword (e.g., "search", "email")
 *   - schema: View a tool's parameters before calling it
 *   - call:   Execute a tool with JSON arguments
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { StringEnum } from "@mariozechner/pi-ai";

// Auto-detect mcp-cli path
const MCP_CLI_PATHS = [
	process.env.MCP_CLI_PATH,
	`${process.env.HOME}/.bun/bin/mcp-cli.exe`,
	`${process.env.HOME}/.bun/bin/mcp-cli`,
	`${process.env.USERPROFILE}/.bun/bin/mcp-cli.exe`,
];

function findMcpCli(): string | null {
	const fs = require("node:fs");
	for (const p of MCP_CLI_PATHS) {
		if (p && fs.existsSync(p)) return p;
	}
	return null;
}

export default function (pi: ExtensionAPI) {
	const mcpCliPath = findMcpCli();

	if (!mcpCliPath) {
		// Don't register tool if mcp-cli not found
		return;
	}

	async function runMcpCli(args: string[], signal?: AbortSignal): Promise<{ stdout: string; stderr: string; code: number }> {
		const result = await pi.exec(mcpCliPath!, args, { signal, timeout: 60000 });
		return {
			stdout: result.stdout || "",
			stderr: result.stderr || "",
			code: result.code ?? 0,
		};
	}

	function cleanOutput(stdout: string, stderr: string): string {
		// mcp-cli prints server startup logs to stderr/stdout, filter them out
		const lines = stdout.split("\n").filter((line) => {
			if (line.startsWith("[") && line.includes("]")) {
				// Filter server startup noise like [tavily-mcp] Tavily MCP server...
				const after = line.slice(line.indexOf("]") + 1).trim();
				if (!after || after.startsWith("MCP") || after.startsWith("Initialized") ||
					after.startsWith("Registered") || after.includes("running on stdio") ||
					after.includes("started successfully") || after.includes("Handling") ||
					after.includes("server") || after.includes("CDP relay")) {
					return false;
				}
			}
			return true;
		});
		let cleaned = lines.join("\n").trim();
		// Remove Warning lines about failed connections
		cleaned = cleaned.replace(/Warning: \d+ server\(s\) failed to connect:.*\n?/g, "").trim();
		return cleaned;
	}

	pi.registerTool({
		name: "mcp",
		label: "MCP",
		description: "Access external services (GitHub, web search, database, email, etc.) via MCP servers",
		promptSnippet: "Access external services: GitHub, web search (Tavily), PostgreSQL (Neon), email (Resend), code sandbox (e2b), hosting (Hostinger), workflows (n8n), and more. Use action 'list' to discover, 'search' to find, 'schema' to inspect, 'call' to execute.",
		promptGuidelines: [
			"Use mcp with action 'search' to find relevant tools before calling them.",
			"Use mcp with action 'schema' to check required parameters before calling a tool.",
			"Use mcp with action 'call' to execute. The 'tool' parameter format is 'server/tool_name' (e.g., 'github/search_code', 'tavily-mcp/tavily_search').",
		],
		parameters: Type.Object({
			action: StringEnum(["list", "search", "schema", "call"] as const, {
				description: "list: show all servers/tools. search: find tools by keyword. schema: view tool parameters. call: execute a tool.",
			}),
			tool: Type.Optional(Type.String({
				description: "Tool identifier in 'server/tool_name' format (e.g., 'github/search_code'). Required for 'schema' and 'call'.",
			})),
			query: Type.Optional(Type.String({
				description: "Search keyword for 'search' action (e.g., 'email', 'search', 'database').",
			})),
			args: Type.Optional(Type.String({
				description: "JSON string of arguments for 'call' action (e.g., '{\"query\": \"react hooks\"}').",
			})),
		}),

		async execute(toolCallId, params, signal, onUpdate, ctx) {
			const { action, tool, query, args } = params;

			try {
				switch (action) {
					case "list": {
						const result = await runMcpCli([], signal);
						const output = cleanOutput(result.stdout, result.stderr);
						return {
							content: [{ type: "text", text: output || "No MCP servers available." }],
							details: { action },
						};
					}

					case "search": {
						if (!query) {
							return {
								content: [{ type: "text", text: "Error: 'query' parameter is required for search action." }],
								details: { action, error: true },
							};
						}
						const result = await runMcpCli(["grep", `*${query}*`], signal);
						const output = cleanOutput(result.stdout, result.stderr);
						return {
							content: [{ type: "text", text: output || `No tools found matching '${query}'.` }],
							details: { action, query },
						};
					}

					case "schema": {
						if (!tool) {
							return {
								content: [{ type: "text", text: "Error: 'tool' parameter is required for schema action (e.g., 'github/search_code')." }],
								details: { action, error: true },
							};
						}
						const result = await runMcpCli([tool], signal);
						const output = cleanOutput(result.stdout, result.stderr);
						return {
							content: [{ type: "text", text: output || `Tool '${tool}' not found.` }],
							details: { action, tool },
						};
					}

					case "call": {
						if (!tool) {
							return {
								content: [{ type: "text", text: "Error: 'tool' parameter is required for call action." }],
								details: { action, error: true },
							};
						}

						// Stream progress
						onUpdate?.({
							content: [{ type: "text", text: `Calling ${tool}...` }],
							details: { action, tool },
						});

						const cliArgs = ["-j", tool];
						if (args) cliArgs.push(args);

						const result = await runMcpCli(cliArgs, signal);
						let output = cleanOutput(result.stdout, result.stderr);

						// Try to parse JSON response and extract text content
						try {
							const parsed = JSON.parse(output);
							if (parsed.content && Array.isArray(parsed.content)) {
								const texts = parsed.content
									.filter((c: any) => c.type === "text")
									.map((c: any) => c.text);
								if (texts.length > 0) {
									output = texts.join("\n\n");
								}
							}
							// Try to pretty-parse if the extracted text is also JSON
							try {
								const inner = JSON.parse(output);
								output = JSON.stringify(inner, null, 2);
							} catch {
								// Not JSON, keep as-is
							}
						} catch {
							// Not JSON, keep raw output
						}

						if (result.code !== 0 && !output) {
							output = `Error executing ${tool}: exit code ${result.code}\n${result.stderr}`;
						}

						return {
							content: [{ type: "text", text: output || `Tool '${tool}' returned no output.` }],
							details: { action, tool, args },
						};
					}

					default:
						return {
							content: [{ type: "text", text: `Unknown action: ${action}. Use list, search, schema, or call.` }],
							details: { action, error: true },
						};
				}
			} catch (e: any) {
				if (e.name === "AbortError" || signal?.aborted) {
					return {
						content: [{ type: "text", text: "Operation cancelled." }],
						details: { action, cancelled: true },
					};
				}
				throw e;
			}
		},
	});
}
