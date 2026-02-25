import { prisma } from "@/lib/db";

const TELEGRAM_API = "https://api.telegram.org/bot";

function getToken() {
  return process.env.TELEGRAM_BOT_TOKEN ?? "";
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  parseMode = "HTML"
) {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    }),
  });
  return res.json();
}

// Format market data for Telegram
export function formatMarketAlert(market: {
  title: string;
  probability?: number;
  volume?: string;
  slug?: string;
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://predictflow.app";
  const prob =
    market.probability != null
      ? `${(market.probability * 100).toFixed(1)}%`
      : "N/A";
  return [
    `<b>${escapeHtml(market.title)}</b>`,
    ``,
    `Probability: ${prob}`,
    market.volume ? `Volume: $${market.volume}` : "",
    ``,
    market.slug ? `${baseUrl}/en/markets/${market.slug}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function formatPredictionAlert(event: {
  title: string;
  id: string;
  status: string;
  result?: string | null;
}) {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://predictflow.app";
  const statusEmoji =
    event.status === "resolved"
      ? "resolved"
      : event.status === "active"
        ? "ACTIVE"
        : "CLOSED";
  return [
    `<b>${escapeHtml(event.title)}</b>`,
    ``,
    `Status: ${statusEmoji}`,
    event.result ? `Result: ${event.result.toUpperCase()}` : "",
    ``,
    `${baseUrl}/en/predict/${event.id}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Handle incoming Telegram bot commands
export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  if (!message?.text) return;

  const chatId = message.chat.id.toString();
  const text = message.text.trim();

  if (text === "/start") {
    await sendTelegramMessage(
      chatId,
      "<b>Welcome to PredictFlow Bot!</b>\n\n" +
        "Commands:\n" +
        "/markets - Top trending markets\n" +
        "/predictions - Active prediction events\n" +
        "/subscribe - Subscribe to alerts\n" +
        "/unsubscribe - Unsubscribe from alerts\n" +
        "/help - Show this help"
    );
  } else if (text === "/markets" || text === "/top") {
    await handleMarketsCommand(chatId);
  } else if (text === "/predictions") {
    await handlePredictionsCommand(chatId);
  } else if (text === "/subscribe") {
    await handleSubscribeCommand(chatId);
  } else if (text === "/unsubscribe") {
    await handleUnsubscribeCommand(chatId);
  } else if (text === "/help") {
    await sendTelegramMessage(
      chatId,
      "<b>PredictFlow Bot Help</b>\n\n" +
        "/markets - View top 5 trending markets\n" +
        "/predictions - View active prediction events\n" +
        "/subscribe - Get market alerts\n" +
        "/unsubscribe - Stop market alerts\n\n" +
        "Visit https://predictflow.app for the full experience!"
    );
  }
}

async function handleMarketsCommand(chatId: string) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100";
    const res = await fetch(
      `${baseUrl}/api/polymarket/events?limit=5&active=true`
    );
    if (!res.ok) throw new Error("API error");
    const events = await res.json();

    if (!Array.isArray(events) || events.length === 0) {
      await sendTelegramMessage(chatId, "No active markets found.");
      return;
    }

    const lines = events
      .slice(0, 5)
      .map((e: Record<string, unknown>, i: number) => {
        const title = typeof e.title === "string" ? e.title : "Unknown";
        return `${i + 1}. ${escapeHtml(title)}`;
      });

    await sendTelegramMessage(
      chatId,
      `<b>Top Markets</b>\n\n${lines.join("\n")}\n\nVisit predictflow.app for details!`
    );
  } catch {
    await sendTelegramMessage(
      chatId,
      "Failed to fetch markets. Try again later."
    );
  }
}

async function handlePredictionsCommand(chatId: string) {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100";
    const res = await fetch(
      `${baseUrl}/api/events?status=active&limit=5`
    );
    if (!res.ok) throw new Error("API error");
    const data = await res.json();
    const events = Array.isArray(data) ? data : (data.events ?? []);

    if (events.length === 0) {
      await sendTelegramMessage(chatId, "No active predictions found.");
      return;
    }

    const lines = events
      .slice(0, 5)
      .map((e: Record<string, unknown>, i: number) => {
        const title = typeof e.title === "string" ? e.title : "Unknown";
        return `${i + 1}. ${escapeHtml(title)}`;
      });

    await sendTelegramMessage(
      chatId,
      `<b>Active Predictions</b>\n\n${lines.join("\n")}\n\nBet now at predictflow.app!`
    );
  } catch {
    await sendTelegramMessage(
      chatId,
      "Failed to fetch predictions. Try again later."
    );
  }
}

async function handleSubscribeCommand(chatId: string, platform: string = "telegram") {
  try {
    await prisma.botSubscriber.upsert({
      where: { platform_chatId: { platform, chatId } },
      create: { platform, chatId, active: true },
      update: { active: true },
    });
    await sendTelegramMessage(chatId, "✅ You've been subscribed to market alerts! You'll receive updates on trending markets and prediction results.");
  } catch {
    await sendTelegramMessage(chatId, "❌ Failed to subscribe. Please try again later.");
  }
}

async function handleUnsubscribeCommand(chatId: string, platform: string = "telegram") {
  try {
    await prisma.botSubscriber.upsert({
      where: { platform_chatId: { platform, chatId } },
      create: { platform, chatId, active: false },
      update: { active: false },
    });
    await sendTelegramMessage(chatId, "✅ You've been unsubscribed from market alerts.");
  } catch {
    await sendTelegramMessage(chatId, "❌ Failed to unsubscribe. Please try again later.");
  }
}

export async function getActiveSubscribers(platform: string) {
  return prisma.botSubscriber.findMany({
    where: { platform, active: true },
  });
}

export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: { id: number; first_name: string };
    chat: { id: number; type: string };
    text?: string;
  };
}
