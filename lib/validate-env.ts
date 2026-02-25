export function validateEnv() {
  const weakSecrets = [
    "predictflow-dev-secret-change-in-production",
    "change-me",
    "secret",
    "test",
  ];

  const authSecret = process.env.AUTH_SECRET;

  if (!authSecret) {
    throw new Error(
      "AUTH_SECRET is not set. Generate one with: openssl rand -base64 32"
    );
  }

  if (weakSecrets.some((weak) => authSecret.toLowerCase().includes(weak))) {
    console.warn(
      "\x1b[33m⚠ WARNING: AUTH_SECRET appears to be a default/weak value. Generate a secure one with: openssl rand -base64 32\x1b[0m"
    );
  }

  if (authSecret.length < 32) {
    console.warn(
      "\x1b[33m⚠ WARNING: AUTH_SECRET is shorter than 32 characters. Consider using a longer secret.\x1b[0m"
    );
  }
}
