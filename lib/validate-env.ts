export function validateEnv() {
  // AUTH_SECRET - required
  const authSecret = process.env.AUTH_SECRET;
  if (!authSecret) {
    throw new Error(
      "AUTH_SECRET is not set. Generate one with: openssl rand -base64 32"
    );
  }

  const weakSecrets = [
    "secret",
    "test",
    "change-me",
    "predictflow-dev-secret-change-in-production",
  ];
  for (const weak of weakSecrets) {
    if (authSecret.toLowerCase().includes(weak)) {
      console.warn(
        `\x1b[33m⚠️ WARNING: AUTH_SECRET contains '${weak}'. Use a strong random value in production.\x1b[0m`
      );
      break;
    }
  }

  if (authSecret.length < 32) {
    console.warn(
      "\x1b[33m⚠️ WARNING: AUTH_SECRET is shorter than 32 characters. Consider using a longer secret.\x1b[0m"
    );
  }

  // DATABASE_URL - required
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Set it to your PostgreSQL connection string."
    );
  }

  // Optional but warn if OAuth buttons are rendered without credentials
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn(
      "⚠️ Google OAuth not configured (GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET missing). Google login will not work."
    );
  }
  if (!process.env.KAKAO_CLIENT_ID || !process.env.KAKAO_CLIENT_SECRET) {
    console.warn(
      "⚠️ Kakao OAuth not configured (KAKAO_CLIENT_ID/KAKAO_CLIENT_SECRET missing). Kakao login will not work."
    );
  }
}
