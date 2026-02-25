export async function sendDiscordWebhook(
  webhookUrl: string,
  content: string,
  embeds?: DiscordEmbed[]
) {
  if (!webhookUrl) return null;

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content, embeds }),
  });
  return res.ok;
}

export function createMarketEmbed(market: {
  title: string;
  probability?: number;
  volume?: string;
  slug?: string;
}): DiscordEmbed {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://predictflow.app";
  const prob =
    market.probability != null
      ? `${(market.probability * 100).toFixed(1)}%`
      : "N/A";

  return {
    title: market.title,
    color: 0x6366f1, // Indigo
    fields: [
      { name: "Probability", value: prob, inline: true },
      ...(market.volume
        ? [{ name: "Volume", value: `$${market.volume}`, inline: true }]
        : []),
    ],
    url: market.slug
      ? `${baseUrl}/en/markets/${market.slug}`
      : undefined,
    footer: { text: "PredictFlow" },
    timestamp: new Date().toISOString(),
  };
}

export function createPredictionEmbed(event: {
  title: string;
  id: string;
  status: string;
  result?: string | null;
}): DiscordEmbed {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://predictflow.app";
  const statusColor =
    event.status === "resolved"
      ? 0x22c55e
      : event.status === "active"
        ? 0x3b82f6
        : 0xef4444;

  return {
    title: event.title,
    color: statusColor,
    fields: [
      { name: "Status", value: event.status.toUpperCase(), inline: true },
      ...(event.result
        ? [
            {
              name: "Result",
              value: event.result.toUpperCase(),
              inline: true,
            },
          ]
        : []),
    ],
    url: `${baseUrl}/en/predict/${event.id}`,
    footer: { text: "PredictFlow" },
    timestamp: new Date().toISOString(),
  };
}

// Handle Discord slash command interactions
export async function handleDiscordInteraction(
  body: DiscordInteraction
): Promise<DiscordResponse> {
  // PING - required by Discord for endpoint verification
  if (body.type === 1) {
    return { type: 1 }; // PONG
  }

  // Slash command (type 2 = APPLICATION_COMMAND)
  if (body.type === 2) {
    const command = body.data?.name;

    if (command === "markets") {
      return await handleDiscordMarketsCommand();
    }
    if (command === "predictions") {
      return await handleDiscordPredictionsCommand();
    }
    if (command === "help") {
      return {
        type: 4,
        data: {
          content:
            "**PredictFlow Bot**\n\n" +
            "`/markets` - Top trending markets\n" +
            "`/predictions` - Active prediction events\n" +
            "`/help` - Show this help\n\n" +
            "Visit [predictflow.app](https://predictflow.app) for the full experience!",
        },
      };
    }
  }

  return { type: 4, data: { content: "Unknown command" } };
}

async function handleDiscordMarketsCommand(): Promise<DiscordResponse> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3100";
    const res = await fetch(
      `${baseUrl}/api/polymarket/events?limit=5&active=true`
    );
    if (!res.ok) throw new Error("API error");
    const events = await res.json();

    if (!Array.isArray(events) || events.length === 0) {
      return { type: 4, data: { content: "No active markets found." } };
    }

    const embeds = events
      .slice(0, 3)
      .map((e: Record<string, unknown>) =>
        createMarketEmbed({
          title: (e.title as string) || "Unknown",
          slug: e.slug as string | undefined,
        })
      );

    return { type: 4, data: { content: "**Top Markets**", embeds } };
  } catch {
    return {
      type: 4,
      data: { content: "Failed to fetch markets." },
    };
  }
}

async function handleDiscordPredictionsCommand(): Promise<DiscordResponse> {
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
      return {
        type: 4,
        data: { content: "No active predictions found." },
      };
    }

    const embeds = events
      .slice(0, 3)
      .map((e: Record<string, unknown>) =>
        createPredictionEmbed({
          title: (e.title as string) || "Unknown",
          id: (e.id as string) || "",
          status: (e.status as string) || "active",
        })
      );

    return {
      type: 4,
      data: { content: "**Active Predictions**", embeds },
    };
  } catch {
    return {
      type: 4,
      data: { content: "Failed to fetch predictions." },
    };
  }
}

export interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

export interface DiscordInteraction {
  type: number;
  data?: { name: string; options?: unknown[] };
}

export interface DiscordResponse {
  type: number;
  data?: { content: string; embeds?: DiscordEmbed[] };
}
