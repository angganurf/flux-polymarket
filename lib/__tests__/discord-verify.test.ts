import { describe, it, expect } from "vitest";

// hexToUint8Array is not exported from discord-verify.ts (it's a private helper),
// so we test the same algorithm here. The verifyDiscordRequest function itself
// requires a real Ed25519 public key + signature — those are covered by integration tests.
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

describe("Discord verification utils — hexToUint8Array", () => {
  it("converts hex string to Uint8Array", () => {
    const result = hexToUint8Array("48656c6c6f");
    expect(result).toEqual(
      new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])
    );
  });

  it("converts 'Hello' ASCII bytes correctly", () => {
    // H=0x48, e=0x65, l=0x6c, l=0x6c, o=0x6f
    const result = hexToUint8Array("48656c6c6f");
    expect(Array.from(result)).toEqual([72, 101, 108, 108, 111]);
  });

  it("handles empty string", () => {
    const result = hexToUint8Array("");
    expect(result).toEqual(new Uint8Array([]));
    expect(result.length).toBe(0);
  });

  it("converts ff to 255", () => {
    const result = hexToUint8Array("ff");
    expect(result).toEqual(new Uint8Array([255]));
  });

  it("converts 00 to 0", () => {
    const result = hexToUint8Array("00");
    expect(result).toEqual(new Uint8Array([0]));
  });

  it("converts FF (uppercase) to 255", () => {
    const result = hexToUint8Array("FF");
    expect(result).toEqual(new Uint8Array([255]));
  });

  it("converts a two-byte sequence correctly", () => {
    const result = hexToUint8Array("0102");
    expect(result).toEqual(new Uint8Array([1, 2]));
  });

  it("returns the correct byte length (half the hex string length)", () => {
    const hex = "deadbeef";
    const result = hexToUint8Array(hex);
    expect(result.length).toBe(hex.length / 2);
  });

  it("converts deadbeef correctly", () => {
    const result = hexToUint8Array("deadbeef");
    expect(result).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]));
  });

  it("handles a full 32-byte (64-char) hex string", () => {
    const hex = "a".repeat(64);
    const result = hexToUint8Array(hex);
    expect(result.length).toBe(32);
    result.forEach((b) => expect(b).toBe(0xaa));
  });
});

describe("Discord verify — verifyDiscordRequest preconditions", () => {
  it("returns false when DISCORD_PUBLIC_KEY env var is missing", async () => {
    // We import the actual function to verify the env-guard branch
    const { verifyDiscordRequest } = await import("../bot/discord-verify");
    const originalKey = process.env.DISCORD_PUBLIC_KEY;
    delete process.env.DISCORD_PUBLIC_KEY;

    const result = await verifyDiscordRequest("body", "sig", "timestamp");
    expect(result).toBe(false);

    // Restore env
    if (originalKey !== undefined) {
      process.env.DISCORD_PUBLIC_KEY = originalKey;
    }
  });

  it("returns false for an invalid signature", async () => {
    const { verifyDiscordRequest } = await import("../bot/discord-verify");
    // A valid-format but incorrect Ed25519 key (32 bytes = 64 hex chars)
    process.env.DISCORD_PUBLIC_KEY = "a".repeat(64);

    const result = await verifyDiscordRequest(
      "test-body",
      "b".repeat(128), // 64-byte signature (wrong)
      "12345678"
    );
    expect(result).toBe(false);

    delete process.env.DISCORD_PUBLIC_KEY;
  });
});
