import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateEnv } from "../validate-env";

describe("validateEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
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

  it("passes with a strong secret", () => {
    process.env.AUTH_SECRET = "xK9mP2vL8nQ4wR7jF5hY3bA6cD0eG1iU";
    validateEnv();
    expect(console.warn).not.toHaveBeenCalled();
  });
});
