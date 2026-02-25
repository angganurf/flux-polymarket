import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateEnv } from "../validate-env";

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.DATABASE_URL = "postgresql://test:test@localhost/test";
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("throws when AUTH_SECRET is not set", () => {
    delete process.env.AUTH_SECRET;
    expect(() => validateEnv()).toThrow("AUTH_SECRET is not set");
  });

  it("warns on weak default secret", () => {
    process.env.AUTH_SECRET = "predictflow-dev-secret-change-in-production";
    validateEnv();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("WARNING")
    );
  });

  it("warns on short secret", () => {
    process.env.AUTH_SECRET = "tooshort";
    validateEnv();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("shorter than 32")
    );
  });

  it("passes with a strong secret and all env vars", () => {
    process.env.AUTH_SECRET = "xK9mP2vL8nQ4wR7jF5hY3bA6cD0eG1iU";
    process.env.GOOGLE_CLIENT_ID = "test";
    process.env.GOOGLE_CLIENT_SECRET = "test";
    process.env.KAKAO_CLIENT_ID = "test";
    process.env.KAKAO_CLIENT_SECRET = "test";
    validateEnv();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("throws when DATABASE_URL is not set", () => {
    process.env.AUTH_SECRET = "xK9mP2vL8nQ4wR7jF5hY3bA6cD0eG1iU";
    delete process.env.DATABASE_URL;
    expect(() => validateEnv()).toThrow("DATABASE_URL is not set");
  });
});
