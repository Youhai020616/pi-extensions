/**
 * Telegram Bot Remote Control Extension for Pi
 *
 * Connect your running Pi session to a Telegram Bot, so you can send messages
 * from Telegram and receive Pi's responses — like a remote control for your terminal.
 *
 * Features:
 *   - Native streaming via sendMessageDraft (Bot API 9.5) — text appears word-by-word
 *   - Bidirectional: both terminal and Telegram can control Pi
 *   - Typing indicator while Pi processes
 *   - Long message auto-splitting
 *   - Graceful connect/disconnect
 *
 * Setup:
 *   1. Create a bot via @BotFather on Telegram, get the token
 *   2. Set environment variable: export TELEGRAM_BOT_TOKEN=your-token-here
 *   3. (Optional) Set TELEGRAM_CHAT_ID to restrict access to a specific chat
 *
 * Usage:
 *   /telegram-bot          - Connect (toggle on/off)
 *   /telegram-bot <token>  - Connect with a specific token
 *   /telegram-bot stop     - Disconnect
 *   /telegram-bot status   - Show connection status
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const TELEGRAM_API = "https://api.telegram.org/bot";

export default function (pi: ExtensionAPI) {
	// ── State ──────────────────────────────────────────────────────────
	let token: string | null = null;
	let isConnected = false;
	let pollAbort: AbortController | null = null;
	let botUsername = "";
	let agentBusy = false;
	let typingTimer: ReturnType<typeof setInterval> | null = null;
	let allowedChatId: number | null = null;
	let activeChatIds = new Set<number>();
	let messageCount = { sent: 0, received: 0 };

	// ── Streaming State ───────────────────────────────────────────────
	let streamBuffer = "";
	let draftId = 0;
	let draftTimer: ReturnType<typeof setTimeout> | null = null;
	let lastDraftTime = 0;
	const DRAFT_THROTTLE_MS = 400; // Min interval between draft updates

	// ── Telegram API ──────────────────────────────────────────────────

	async function tgApi(method: string, params: Record<string, any> = {}, signal?: AbortSignal): Promise<any> {
		const res = await fetch(`${TELEGRAM_API}${token}/${method}`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(params),
			signal,
		});
		const data: any = await res.json();
		if (!data.ok) throw new Error(data.description || `Telegram API ${method} failed`);
		return data.result;
	}

	// ── Message Sending ───────────────────────────────────────────────

	async function sendFinalMessage(chatId: number, text: string): Promise<void> {
		if (!text.trim()) return;

		const chunks = splitMessage(text, 4000);
		for (const chunk of chunks) {
			try {
				await tgApi("sendMessage", {
					chat_id: chatId,
					text: chunk,
					parse_mode: "Markdown",
				});
			} catch {
				// Fallback to plain text if Markdown parsing fails
				try {
					await tgApi("sendMessage", {
						chat_id: chatId,
						text: chunk,
					});
				} catch {
					// Silently ignore
				}
			}
		}
	}

	async function sendToAllChats(text: string): Promise<void> {
		for (const chatId of activeChatIds) {
			await sendFinalMessage(chatId, text).catch(() => {});
		}
		if (text.trim()) messageCount.sent++;
	}

	function splitMessage(text: string, maxLen: number): string[] {
		if (text.length <= maxLen) return [text];
		const chunks: string[] = [];
		let remaining = text;
		while (remaining.length > 0) {
			if (remaining.length <= maxLen) {
				chunks.push(remaining);
				break;
			}
			let splitAt = remaining.lastIndexOf("\n", maxLen);
			if (splitAt < maxLen * 0.3) splitAt = maxLen;
			chunks.push(remaining.slice(0, splitAt));
			remaining = remaining.slice(splitAt).replace(/^\n/, "");
		}
		return chunks;
	}

	// ── Streaming via sendMessageDraft ─────────────────────────────────

	function startDraft(): void {
		streamBuffer = "";
		draftId = Math.floor(Math.random() * 2147483647) + 1; // Random positive int32
		lastDraftTime = 0;
		if (draftTimer) {
			clearTimeout(draftTimer);
			draftTimer = null;
		}
	}

	function appendStreamText(delta: string): void {
		if (!isConnected || activeChatIds.size === 0) return;

		streamBuffer += delta;

		// Throttle draft updates
		const now = Date.now();
		const elapsed = now - lastDraftTime;

		if (elapsed >= DRAFT_THROTTLE_MS) {
			flushDraft();
		} else if (!draftTimer) {
			// Schedule a flush for the remaining throttle time
			draftTimer = setTimeout(() => {
				draftTimer = null;
				flushDraft();
			}, DRAFT_THROTTLE_MS - elapsed);
		}
	}

	function flushDraft(): void {
		if (!isConnected || activeChatIds.size === 0 || !streamBuffer.trim()) return;

		lastDraftTime = Date.now();

		// Truncate to 4096 chars for the draft preview
		const draftText = streamBuffer.length > 4000
			? streamBuffer.slice(0, 4000) + "\n..."
			: streamBuffer;

		for (const chatId of activeChatIds) {
			tgApi("sendMessageDraft", {
				chat_id: chatId,
				draft_id: draftId,
				text: draftText,
			}).catch(() => {
				// sendMessageDraft might fail (e.g., group chats, old clients)
				// Silently ignore — the final sendMessage will still work
			});
		}
	}

	function endDraft(): void {
		if (draftTimer) {
			clearTimeout(draftTimer);
			draftTimer = null;
		}
	}

	// ── Telegram Polling ──────────────────────────────────────────────

	async function startPolling(): Promise<void> {
		let offset = 0;

		while (isConnected) {
			try {
				const updates = await tgApi(
					"getUpdates",
					{ offset, timeout: 30 },
					pollAbort?.signal,
				);

				for (const update of updates) {
					offset = update.update_id + 1;

					if (!isConnected) break;

					const msg = update.message;
					if (msg?.text) {
						handleTelegramMessage(msg.chat.id, msg.text);
					}
				}
			} catch (e: any) {
				if (e.name === "AbortError" || !isConnected) break;
				await new Promise((r) => setTimeout(r, 5000));
			}
		}
	}

	function handleTelegramMessage(chatId: number, text: string): void {
		if (!isConnected) return;
		if (allowedChatId && chatId !== allowedChatId) return;

		activeChatIds.add(chatId);
		messageCount.received++;

		// Show typing indicator
		tgApi("sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => {});

		// Inject message into Pi session
		try {
			if (agentBusy) {
				pi.sendUserMessage(text, { deliverAs: "followUp" });
			} else {
				pi.sendUserMessage(text);
			}
		} catch {
			try {
				pi.sendUserMessage(text, { deliverAs: "followUp" });
			} catch {
				sendFinalMessage(chatId, "⚠️ Failed to deliver message to Pi.").catch(() => {});
			}
		}
	}

	// ── Typing Indicator ──────────────────────────────────────────────

	function startTyping(): void {
		if (typingTimer || activeChatIds.size === 0) return;
		sendTypingAll();
		typingTimer = setInterval(sendTypingAll, 4000);
	}

	function stopTyping(): void {
		if (typingTimer) {
			clearInterval(typingTimer);
			typingTimer = null;
		}
	}

	function sendTypingAll(): void {
		for (const chatId of activeChatIds) {
			tgApi("sendChatAction", { chat_id: chatId, action: "typing" }).catch(() => {});
		}
	}

	// ── Connect / Disconnect ──────────────────────────────────────────

	async function connect(t: string): Promise<void> {
		token = t;
		pollAbort = new AbortController();

		// Verify token
		const me = await tgApi("getMe");
		botUsername = me.username;

		isConnected = true;
		messageCount = { sent: 0, received: 0 };

		// Clear pending updates
		try {
			const updates = await tgApi("getUpdates", { offset: -1 });
			if (updates.length > 0) {
				await tgApi("getUpdates", { offset: updates[updates.length - 1].update_id + 1 });
			}
		} catch {
			// Non-critical
		}

		// If pre-configured chat ID, send welcome
		if (allowedChatId) {
			activeChatIds.add(allowedChatId);
			await sendFinalMessage(
				allowedChatId,
				"🟢 Pi connected.\nSend messages here to control your terminal session.\n\n_Streaming enabled — responses appear in real-time._",
			);
		}

		// Start polling (background)
		startPolling();
	}

	function disconnect(): void {
		const prevChatIds = new Set(activeChatIds);

		isConnected = false;
		stopTyping();
		endDraft();
		pollAbort?.abort();
		pollAbort = null;

		// Best-effort goodbye
		if (token) {
			for (const chatId of prevChatIds) {
				fetch(`${TELEGRAM_API}${token}/sendMessage`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ chat_id: chatId, text: "🔴 Pi disconnected." }),
				}).catch(() => {});
			}
		}

		activeChatIds.clear();
		token = null;
		botUsername = "";
	}

	// ── Pi Events ─────────────────────────────────────────────────────

	// Update status bar on session start (needed for auto-connect)
	pi.on("session_start", async (_event, ctx) => {
		if (isConnected) updateStatus(ctx);
	});

	pi.on("agent_start", async (_event, ctx) => {
		agentBusy = true;
		if (isConnected) {
			startTyping();
			startDraft(); // Prepare for streaming
			updateStatus(ctx);
		}
	});

	pi.on("message_update", async (event, _ctx) => {
		if (!isConnected || activeChatIds.size === 0) return;

		// Stream text deltas to Telegram via sendMessageDraft
		if (event.assistantMessageEvent?.type === "text_delta" && event.assistantMessageEvent.delta) {
			const delta = event.assistantMessageEvent;
			stopTyping(); // No need for "typing..." once draft is visible
			appendStreamText(delta.delta);
		}
	});

	pi.on("agent_end", async (event, ctx) => {
		agentBusy = false;
		stopTyping();
		endDraft();

		if (!isConnected || activeChatIds.size === 0) return;

		// Extract all assistant text from the response
		const textParts: string[] = [];
		for (const msg of event.messages) {
			if (msg.role === "assistant" && Array.isArray(msg.content)) {
				for (const block of msg.content) {
					if (block.type === "text" && block.text?.trim()) {
						textParts.push(block.text);
					}
				}
			}
		}

		if (textParts.length > 0) {
			const fullResponse = textParts.join("\n\n");
			// Send final message (replaces the draft in Telegram)
			await sendToAllChats(fullResponse);
		}

		updateStatus(ctx);
	});

	pi.on("session_shutdown", async () => {
		if (isConnected) disconnect();
	});

	pi.on("session_switch", async (_event, ctx) => {
		if (isConnected && activeChatIds.size > 0) {
			await sendToAllChats("ℹ️ Pi session switched.");
		}
		updateStatus(ctx);
	});

	// ── Status Display ────────────────────────────────────────────────

	function updateStatus(ctx: any): void {
		if (!isConnected) {
			ctx.ui.setStatus("telegram-bot", undefined);
			return;
		}
		const theme = ctx.ui.theme;
		const dot = agentBusy ? theme.fg("warning", "●") : theme.fg("success", "●");
		const name = theme.fg("dim", ` @${botUsername}`);
		const chats = activeChatIds.size > 0
			? theme.fg("dim", ` (${activeChatIds.size} chat${activeChatIds.size > 1 ? "s" : ""})`)
			: "";
		const streaming = theme.fg("dim", " ⚡");
		ctx.ui.setStatus("telegram-bot", `📱${dot}${name}${chats}${streaming}`);
	}

	// ── Command ───────────────────────────────────────────────────────

	// ── Auto-Connect on Load ──────────────────────────────────────────
	// If TELEGRAM_BOT_TOKEN is set, automatically connect when the extension loads
	{
		const autoToken = process.env.TELEGRAM_BOT_TOKEN;
		if (autoToken) {
			connect(autoToken).then(() => {
				// Auto-connected successfully — status will update on next agent event
			}).catch(() => {
				// Silent fail on auto-connect — user can manually /telegram-bot later
			});
		}
	}

	pi.registerCommand("telegram-bot", {
		description: "Connect/disconnect Telegram Bot for remote control (with streaming)",
		handler: async (args, ctx) => {
			const arg = args.trim();

			// /telegram-bot status
			if (arg === "status") {
				if (!isConnected) {
					ctx.ui.notify("Telegram Bot: not connected", "info");
				} else {
					ctx.ui.notify(
						`Telegram Bot: @${botUsername}\n` +
						`Chats: ${activeChatIds.size} | ` +
						`Sent: ${messageCount.sent} | Received: ${messageCount.received}\n` +
						`Streaming: enabled (sendMessageDraft)`,
						"info",
					);
				}
				return;
			}

			// /telegram-bot stop
			if (arg === "stop") {
				if (!isConnected) {
					ctx.ui.notify("Telegram Bot is not connected", "warning");
					return;
				}
				disconnect();
				ctx.ui.setStatus("telegram-bot", undefined);
				ctx.ui.notify("Telegram Bot disconnected", "info");
				return;
			}

			// Toggle: if connected, disconnect
			if (isConnected && !arg) {
				disconnect();
				ctx.ui.setStatus("telegram-bot", undefined);
				ctx.ui.notify("Telegram Bot disconnected", "info");
				return;
			}

			// Connect
			const t = arg || process.env.TELEGRAM_BOT_TOKEN;
			if (!t) {
				ctx.ui.notify(
					"No token provided. Use: /telegram-bot <token>\n" +
					"Or set TELEGRAM_BOT_TOKEN environment variable",
					"error",
				);
				return;
			}

			// Check for allowed chat ID
			const chatIdEnv = process.env.TELEGRAM_CHAT_ID;
			if (chatIdEnv) {
				allowedChatId = parseInt(chatIdEnv, 10);
				if (isNaN(allowedChatId)) {
					ctx.ui.notify("Invalid TELEGRAM_CHAT_ID value", "error");
					allowedChatId = null;
					return;
				}
			}

			try {
				await connect(t);
				updateStatus(ctx);

				const chatIdNote = allowedChatId
					? `Restricted to chat ID: ${allowedChatId}`
					: "Accepting messages from any chat (set TELEGRAM_CHAT_ID to restrict)";

				ctx.ui.notify(
					`🤖 Telegram Bot connected: @${botUsername}\n` +
					`⚡ Streaming enabled (sendMessageDraft)\n` +
					`${chatIdNote}`,
					"info",
				);
			} catch (e: any) {
				ctx.ui.notify(`Failed to connect: ${e.message}`, "error");
			}
		},
	});
}
