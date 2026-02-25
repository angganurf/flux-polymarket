import { NextRequest, NextResponse } from "next/server";
import { verifyDiscordRequest } from "@/lib/bot/discord-verify";
import { handleDiscordInteraction } from "@/lib/bot/discord";

export async function POST(request: NextRequest) {
  const signature = request.headers.get("X-Signature-Ed25519") ?? "";
  const timestamp = request.headers.get("X-Signature-Timestamp") ?? "";
  const body = await request.text();

  const isValid = await verifyDiscordRequest(body, signature, timestamp);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    const interaction = JSON.parse(body);
    const response = await handleDiscordInteraction(interaction);
    return NextResponse.json(response);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
