import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { apiCache, CACHE_TTL } from "@/lib/cache";

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const nodeVersion = process.version;
  const nodeEnv = process.env.NODE_ENV ?? "unknown";

  // Next.js version from package.json — read at build time via env or fall back
  let nextVersion = "16.x";
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require("../../../../package.json") as { dependencies?: Record<string, string> };
    nextVersion = pkg.dependencies?.["next"] ?? "16.x";
  } catch {
    // ignore
  }

  const databaseConfigured = Boolean(process.env.DATABASE_URL);

  // Auth
  const authSecretSet = Boolean(process.env.AUTH_SECRET);
  const nextauthUrlSet = Boolean(process.env.NEXTAUTH_URL);

  // OAuth
  const googleClientIdSet = Boolean(process.env.GOOGLE_CLIENT_ID);
  const googleClientSecretSet = Boolean(process.env.GOOGLE_CLIENT_SECRET);
  const kakaoClientIdSet = Boolean(process.env.KAKAO_CLIENT_ID);
  const kakaoClientSecretSet = Boolean(process.env.KAKAO_CLIENT_SECRET);

  // Email
  const resendApiKeySet = Boolean(process.env.RESEND_API_KEY);

  // Bots
  const telegramBotTokenSet = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const discordPublicKeySet = Boolean(process.env.DISCORD_PUBLIC_KEY);

  // AI
  const openaiApiKeySet = Boolean(process.env.OPENAI_API_KEY);

  const cacheSize = apiCache.size;
  const cacheMaxSize = 500;

  const cacheTtlPresets = {
    eventsList: CACHE_TTL.EVENTS_LIST,
    eventDetail: CACHE_TTL.EVENT_DETAIL,
    search: CACHE_TTL.SEARCH,
    leaderboard: CACHE_TTL.LEADERBOARD,
    orderBook: CACHE_TTL.ORDER_BOOK,
    pricesHistory: CACHE_TTL.PRICES_HISTORY,
  };

  return NextResponse.json({
    system: {
      nodeVersion,
      nextVersion,
      nodeEnv,
      databaseConfigured,
    },
    cache: {
      size: cacheSize,
      maxSize: cacheMaxSize,
      ttlPresets: cacheTtlPresets,
    },
    env: {
      auth: {
        authSecret: authSecretSet,
        nextauthUrl: nextauthUrlSet,
      },
      oauth: {
        googleClientId: googleClientIdSet,
        googleClientSecret: googleClientSecretSet,
        kakaoClientId: kakaoClientIdSet,
        kakaoClientSecret: kakaoClientSecretSet,
      },
      email: {
        resendApiKey: resendApiKeySet,
      },
      bots: {
        telegramBotToken: telegramBotTokenSet,
        discordPublicKey: discordPublicKeySet,
      },
      ai: {
        openaiApiKey: openaiApiKeySet,
      },
    },
  });
}

export async function DELETE() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const cleared = apiCache.invalidate();
  return NextResponse.json({ cleared, success: true });
}
