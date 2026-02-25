import { describe, it, expect, vi, afterEach } from "vitest";

// Mirrors the validation rules in app/api/bets/route.ts
// Amount must be a positive integer between 10 and 100_000
// Choice must be "yes" or "no"
// Event must be active (status === "active")
// Event must not have passed its endDate
// User must have sufficient points (enforced via DB transaction, mirrored here as a guard)
function validateBet(params: {
  amount: number;
  choice: string;
  userPoints: number;
  eventStatus: string;
  eventEndDate: Date;
}): { error: string } | { valid: true } {
  const { amount, choice, userPoints, eventStatus, eventEndDate } = params;

  // Must be a positive integer within bounds (matches route: integer, 10–100_000)
  if (
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount < 10 ||
    amount > 100_000
  ) {
    return { error: "Amount must be an integer between 10 and 100,000" };
  }

  // Insufficient points check (mirrors DB-level optimistic lock)
  if (amount > userPoints) {
    return { error: "Not enough points" };
  }

  // Choice validation (matches route: "yes" or "no")
  if (choice !== "yes" && choice !== "no") {
    return { error: "Choice must be 'yes' or 'no'" };
  }

  // Event must be active
  if (eventStatus !== "active") {
    return { error: "Event is not active" };
  }

  // Event must not have ended
  if (new Date() > eventEndDate) {
    return { error: "Event has ended" };
  }

  return { valid: true };
}

describe("bet validation logic", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day from now
  const pastDate = new Date(Date.now() - 1000); // already ended

  describe("amount validation", () => {
    it("rejects amount below minimum (< 10)", () => {
      const result = validateBet({
        amount: 9,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ error: "Amount must be an integer between 10 and 100,000" });
    });

    it("rejects zero amount", () => {
      const result = validateBet({
        amount: 0,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ error: "Amount must be an integer between 10 and 100,000" });
    });

    it("rejects negative amount", () => {
      const result = validateBet({
        amount: -50,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ error: "Amount must be an integer between 10 and 100,000" });
    });

    it("rejects amount above maximum (> 100_000)", () => {
      const result = validateBet({
        amount: 100_001,
        choice: "yes",
        userPoints: 200_000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ error: "Amount must be an integer between 10 and 100,000" });
    });

    it("rejects non-integer amount", () => {
      const result = validateBet({
        amount: 50.5,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ error: "Amount must be an integer between 10 and 100,000" });
    });

    it("accepts minimum valid amount (10)", () => {
      const result = validateBet({
        amount: 10,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ valid: true });
    });

    it("accepts maximum valid amount (100_000)", () => {
      const result = validateBet({
        amount: 100_000,
        choice: "yes",
        userPoints: 100_000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ valid: true });
    });
  });

  describe("points validation", () => {
    it("rejects amount exceeding user points", () => {
      const result = validateBet({
        amount: 500,
        choice: "yes",
        userPoints: 499,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ error: "Not enough points" });
    });

    it("accepts amount equal to user points", () => {
      const result = validateBet({
        amount: 500,
        choice: "yes",
        userPoints: 500,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ valid: true });
    });

    it("accepts amount less than user points", () => {
      const result = validateBet({
        amount: 100,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ valid: true });
    });
  });

  describe("choice validation", () => {
    it("rejects invalid choice string", () => {
      const result = validateBet({
        amount: 100,
        choice: "maybe",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ error: "Choice must be 'yes' or 'no'" });
    });

    it("rejects empty choice", () => {
      const result = validateBet({
        amount: 100,
        choice: "",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ error: "Choice must be 'yes' or 'no'" });
    });

    it("rejects case-variant choice (YES)", () => {
      const result = validateBet({
        amount: 100,
        choice: "YES",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ error: "Choice must be 'yes' or 'no'" });
    });

    it("accepts choice 'yes'", () => {
      const result = validateBet({
        amount: 100,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ valid: true });
    });

    it("accepts choice 'no'", () => {
      const result = validateBet({
        amount: 100,
        choice: "no",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ valid: true });
    });
  });

  describe("event status validation", () => {
    it("rejects bet on resolved event", () => {
      const result = validateBet({
        amount: 100,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "resolved",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ error: "Event is not active" });
    });

    it("rejects bet on cancelled event", () => {
      const result = validateBet({
        amount: 100,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "cancelled",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ error: "Event is not active" });
    });

    it("rejects bet on pending event", () => {
      const result = validateBet({
        amount: 100,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "pending",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ error: "Event is not active" });
    });

    it("accepts bet on active event", () => {
      const result = validateBet({
        amount: 100,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ valid: true });
    });
  });

  describe("event end date validation", () => {
    it("rejects bet on expired event", () => {
      const result = validateBet({
        amount: 100,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: pastDate,
      });
      expect(result).toEqual({ error: "Event has ended" });
    });

    it("accepts bet before event ends", () => {
      vi.useFakeTimers();
      const endDate = new Date(Date.now() + 5000); // 5 seconds in the future
      const result = validateBet({
        amount: 100,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: endDate,
      });
      expect(result).toEqual({ valid: true });
    });

    it("rejects bet exactly at end time (past)", () => {
      vi.useFakeTimers();
      // Set clock, create a date in the past
      const endDate = new Date(Date.now() - 1);
      const result = validateBet({
        amount: 100,
        choice: "yes",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: endDate,
      });
      expect(result).toEqual({ error: "Event has ended" });
    });
  });

  describe("fully valid bet", () => {
    it("accepts a completely valid bet with all fields correct", () => {
      const result = validateBet({
        amount: 250,
        choice: "no",
        userPoints: 1000,
        eventStatus: "active",
        eventEndDate: futureDate,
      });
      expect(result).toEqual({ valid: true });
    });
  });
});
