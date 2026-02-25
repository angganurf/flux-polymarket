// Usage:
// DISCORD_APP_ID=xxx DISCORD_BOT_TOKEN=xxx npx tsx scripts/setup-discord-commands.ts

export {};

const commands = [
  { name: "markets", description: "View top trending prediction markets" },
  { name: "predictions", description: "View active prediction events" },
  { name: "help", description: "Show PredictFlow bot help" },
];

async function main() {
  const appId = process.env.DISCORD_APP_ID;
  const botToken = process.env.DISCORD_BOT_TOKEN;

  if (!appId || !botToken) {
    console.error("Missing DISCORD_APP_ID or DISCORD_BOT_TOKEN");
    process.exit(1);
  }

  const res = await fetch(
    `https://discord.com/api/v10/applications/${appId}/commands`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bot ${botToken}`,
      },
      body: JSON.stringify(commands),
    }
  );

  const data = await res.json();
  console.log("Discord commands registered:", data);
}

main();
