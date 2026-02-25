import { NextRequest, NextResponse } from "next/server";
import { handleTelegramUpdate } from "@/lib/bot/telegram";

export async function POST(request: NextRequest) {
  // Verify the request comes from Telegram using a secret token
  const secretToken = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secretToken !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const update = await request.json();
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
