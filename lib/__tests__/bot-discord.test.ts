import { describe, it, expect } from "vitest";
import {
  createMarketEmbed,
  createPredictionEmbed,
  handleDiscordInteraction,
} from "../bot/discord";

describe("Discord bot utils — status colors", () => {
  it("uses green (0x22c55e) for resolved status", () => {
    const embed = createPredictionEmbed({
      title: "Test Event",
      id: "1",
      status: "resolved",
    });
    expect(embed.color).toBe(0x22c55e);
  });

  it("uses blue (0x3b82f6) for active status", () => {
    const embed = createPredictionEmbed({
      title: "Test Event",
      id: "1",
      status: "active",
    });
    expect(embed.color).toBe(0x3b82f6);
  });

  it("uses red (0xef4444) for cancelled (fallthrough) status", () => {
    const embed = createPredictionEmbed({
      title: "Test Event",
      id: "1",
      status: "cancelled",
    });
    expect(embed.color).toBe(0xef4444);
  });
});

describe("handleDiscordInteraction — PING/PONG", () => {
  it("responds to PING (type 1) with PONG (type 1)", async () => {
    const response = await handleDiscordInteraction({ type: 1 });
    expect(response).toEqual({ type: 1 });
  });

  it("responds to unknown type with unknown-command message", async () => {
    const response = await handleDiscordInteraction({ type: 99 });
    expect(response.type).toBe(4);
    expect(response.data?.content).toContain("Unknown command");
  });
});

describe("createMarketEmbed", () => {
  it("uses indigo color (0x6366f1)", () => {
    const embed = createMarketEmbed({ title: "BTC 200k?" });
    expect(embed.color).toBe(0x6366f1);
  });

  it("includes title", () => {
    const embed = createMarketEmbed({ title: "Will BTC hit 200k?" });
    expect(embed.title).toBe("Will BTC hit 200k?");
  });

  it("includes probability field when provided", () => {
    const embed = createMarketEmbed({
      title: "Test",
      probability: 0.6,
    });
    const probField = embed.fields?.find((f) => f.name === "Probability");
    expect(probField).toBeDefined();
    expect(probField?.value).toBe("60.0%");
  });

  it("shows N/A for probability when not provided", () => {
    const embed = createMarketEmbed({ title: "Test" });
    const probField = embed.fields?.find((f) => f.name === "Probability");
    expect(probField?.value).toBe("N/A");
  });

  it("includes volume field when provided", () => {
    const embed = createMarketEmbed({ title: "Test", volume: "500000" });
    const volField = embed.fields?.find((f) => f.name === "Volume");
    expect(volField).toBeDefined();
    expect(volField?.value).toBe("$500000");
  });

  it("omits volume field when not provided", () => {
    const embed = createMarketEmbed({ title: "Test" });
    const volField = embed.fields?.find((f) => f.name === "Volume");
    expect(volField).toBeUndefined();
  });

  it("includes URL when slug is provided", () => {
    const embed = createMarketEmbed({
      title: "Test",
      slug: "my-market-slug",
    });
    expect(embed.url).toContain("my-market-slug");
  });

  it("has undefined URL when slug is not provided", () => {
    const embed = createMarketEmbed({ title: "Test" });
    expect(embed.url).toBeUndefined();
  });

  it("includes a footer with 'PredictFlow'", () => {
    const embed = createMarketEmbed({ title: "Test" });
    expect(embed.footer?.text).toBe("PredictFlow");
  });

  it("includes a timestamp", () => {
    const embed = createMarketEmbed({ title: "Test" });
    expect(embed.timestamp).toBeDefined();
    expect(() => new Date(embed.timestamp!)).not.toThrow();
  });
});

describe("createPredictionEmbed", () => {
  it("includes the event title", () => {
    const embed = createPredictionEmbed({
      title: "My Prediction",
      id: "pred-1",
      status: "active",
    });
    expect(embed.title).toBe("My Prediction");
  });

  it("includes URL containing the event id", () => {
    const embed = createPredictionEmbed({
      title: "My Prediction",
      id: "pred-42",
      status: "active",
    });
    expect(embed.url).toContain("pred-42");
  });

  it("includes status field in uppercase", () => {
    const embed = createPredictionEmbed({
      title: "My Prediction",
      id: "1",
      status: "active",
    });
    const statusField = embed.fields?.find((f) => f.name === "Status");
    expect(statusField?.value).toBe("ACTIVE");
  });

  it("includes result field when result is provided", () => {
    const embed = createPredictionEmbed({
      title: "My Prediction",
      id: "1",
      status: "resolved",
      result: "yes",
    });
    const resultField = embed.fields?.find((f) => f.name === "Result");
    expect(resultField).toBeDefined();
    expect(resultField?.value).toBe("YES");
  });

  it("omits result field when result is null", () => {
    const embed = createPredictionEmbed({
      title: "My Prediction",
      id: "1",
      status: "resolved",
      result: null,
    });
    const resultField = embed.fields?.find((f) => f.name === "Result");
    expect(resultField).toBeUndefined();
  });
});

describe("handleDiscordInteraction — slash commands", () => {
  it("handles /help command and returns help text", async () => {
    const response = await handleDiscordInteraction({
      type: 2,
      data: { name: "help" },
    });
    expect(response.type).toBe(4);
    expect(response.data?.content).toContain("/markets");
    expect(response.data?.content).toContain("/predictions");
  });
});
