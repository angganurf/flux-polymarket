import { describe, it, expect } from "vitest";
import { formatVolume, formatPercent, formatNumber } from "../utils/format";

describe("formatVolume", () => {
  it("formats billions", () => {
    const result = formatVolume(2_000_000_000);
    expect(result).toContain("2");
    expect(result.toUpperCase()).toContain("B");
  });

  it("formats millions", () => {
    const result = formatVolume(1_500_000);
    expect(result).toContain("1.5");
    expect(result.toUpperCase()).toContain("M");
  });

  it("formats thousands", () => {
    const result = formatVolume(45_000);
    expect(result).toContain("45");
    expect(result.toUpperCase()).toContain("K");
  });

  it("formats sub-thousand as dollar amount", () => {
    const result = formatVolume(500);
    expect(result).toContain("500");
  });

  it("handles zero", () => {
    const result = formatVolume(0);
    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
  });
});

describe("formatPercent", () => {
  it("formats decimal to percentage string", () => {
    const result = formatPercent(0.75);
    expect(result).toContain("75");
    expect(result).toContain("%");
  });

  it("formats zero", () => {
    const result = formatPercent(0);
    expect(result).toContain("0");
    expect(result).toContain("%");
  });

  it("formats one to 100%", () => {
    const result = formatPercent(1);
    expect(result).toContain("100");
    expect(result).toContain("%");
  });

  it("formats fractional values to one decimal place", () => {
    const result = formatPercent(0.333);
    expect(result).toBe("33.3%");
  });
});

describe("formatNumber", () => {
  it("formats large numbers with commas", () => {
    const result = formatNumber(1_000_000);
    expect(result).toContain("1,000,000");
  });

  it("formats small numbers", () => {
    const result = formatNumber(42);
    expect(result).toBe("42");
  });

  it("formats zero", () => {
    const result = formatNumber(0);
    expect(result).toBe("0");
  });
});
