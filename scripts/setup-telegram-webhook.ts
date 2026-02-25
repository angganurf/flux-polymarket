// Usage:
// TELEGRAM_BOT_TOKEN=xxx WEBHOOK_URL=https://your-domain.com/api/bot/telegram TELEGRAM_WEBHOOK_SECRET=xxx npx tsx scripts/setup-telegram-webhook.ts

export {};

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const webhookUrl = process.env.WEBHOOK_URL;
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (!token || !webhookUrl) {
    console.error("Missing TELEGRAM_BOT_TOKEN or WEBHOOK_URL");
    process.exit(1);
  }

  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        secret_token: secret,
        allowed_updates: ["message"],
      }),
    }
  );

  const data = await res.json();
  console.log("Webhook setup result:", data);
}

main();
