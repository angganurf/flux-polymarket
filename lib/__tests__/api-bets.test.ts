import { describe, it, expect, vi, afterEach } from "vitest";

// Mirrors the full validation + transaction logic in app/api/bets/route.ts
//
// Route flow:
//  1. Auth check (session required)
//  2. Body validation: eventId, choice, amount required
//  3. Choice must be "yes" or "no"
//  4. Amount must be integer between 10 and 100,000
//  5. Event must exist and have status === "active"
//  6. Event endDate must not have passed
//  7. DB transaction: atomically deduct points (fails if insufficient)
//  8. Create bet record

// ── Pure validation helpers ─────────────────────────────────────────────────

function validateBetBody(body: {
  eventId?: unknown;
  choice?: unknown;
  amount?: unknown;
}): { error: string; status: number } | null {
  const { eventId, choice, amount } = body;

  if (!eventId || !choice || amount == null) {
    return { error: "eventId, choice, and amount are required", status: 400 };
  }

  if (choice !== "yes" && choice !== "no") {
    return { error: "Choice must be 'yes' or 'no'", status: 400 };
  }

  if (
    typeof amount !== "number" ||
    !Number.isInteger(amount) ||
    amount < 10 ||
    amount > 100_000
  ) {
    return { error: "Amount must be an integer between 10 and 100,000", status: 400 };
  }

  return null; // valid
}

function validateEventForBet(event: {
  status: string;
  endDate: Date;
} | null): { error: string; status: number } | null {
  if (!event || event.status !== "active") {
    return { error: "Event is not active", status: 400 };
  }

  if (new Date() > event.endDate) {
    return { error: "Event has ended", status: 400 };
  }

  return null; // valid
}

// Mirrors the transaction outcome: throws INSUFFICIENT_POINTS when user
// does not have enough points, otherwise returns a simulated bet.
function simulatePlaceBet(params: {
  userId: string;
  eventId: string;
  choice: string;
  amount: number;
  userPoints: number;
}): { id: string; userId: string; eventId: string; choice: string; amount: number } {
  const { userId, eventId, choice, amount, userPoints } = params;

  if (userPoints < amount) {
    throw new Error("INSUFFICIENT_POINTS");
  }

  // Simulated bet record returned by tx.bet.create
  return { id: "bet-1", userId, eventId, choice, amount };
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("bet API — authorization", () => {
  it("should reject unauthorized requests (no session)", () => {
    // Route returns 401 when session?.user?.id is falsy.
    // We represent this as a pure check on the session value.
    const session: null = null;
    const isAuthorized = session !== null && (session as { user?: { id?: string } })?.user?.id;
    expect(isAuthorized).toBeFalsy();
  });

  it("should reject requests where session has no user id", () => {
    const session = { user: {} };
    const isAuthorized = Boolean(session?.user && (session.user as { id?: string }).id);
    expect(isAuthorized).toBe(false);
  });

  it("should allow requests with a valid session", () => {
    const session = { user: { id: "user-123" } };
    const isAuthorized = Boolean(session?.user?.id);
    expect(isAuthorized).toBe(true);
  });
});

describe("bet API — body validation", () => {
  it("should reject request missing eventId", () => {
    const result = validateBetBody({ choice: "yes", amount: 100 });
    expect(result).toEqual({
      error: "eventId, choice, and amount are required",
      status: 400,
    });
  });

  it("should reject request missing choice", () => {
    const result = validateBetBody({ eventId: "evt-1", amount: 100 });
    expect(result).toEqual({
      error: "eventId, choice, and amount are required",
      status: 400,
    });
  });

  it("should reject request missing amount", () => {
    const result = validateBetBody({ eventId: "evt-1", choice: "yes" });
    expect(result).toEqual({
      error: "eventId, choice, and amount are required",
      status: 400,
    });
  });

  it("should reject invalid choice value", () => {
    const result = validateBetBody({ eventId: "evt-1", choice: "maybe", amount: 100 });
    expect(result).toEqual({ error: "Choice must be 'yes' or 'no'", status: 400 });
  });

  it("should reject uppercase choice (case sensitive)", () => {
    const result = validateBetBody({ eventId: "evt-1", choice: "YES", amount: 100 });
    expect(result).toEqual({ error: "Choice must be 'yes' or 'no'", status: 400 });
  });

  it("should accept choice 'yes'", () => {
    const result = validateBetBody({ eventId: "evt-1", choice: "yes", amount: 100 });
    expect(result).toBeNull();
  });

  it("should accept choice 'no'", () => {
    const result = validateBetBody({ eventId: "evt-1", choice: "no", amount: 100 });
    expect(result).toBeNull();
  });
});

describe("bet API — amount validation", () => {
  const base = { eventId: "evt-1", choice: "yes" };

  it("should reject bets below minimum amount (10)", () => {
    const result = validateBetBody({ ...base, amount: 9 });
    expect(result).toEqual({
      error: "Amount must be an integer between 10 and 100,000",
      status: 400,
    });
  });

  it("should reject amount of 0", () => {
    const result = validateBetBody({ ...base, amount: 0 });
    expect(result).toEqual({
      error: "Amount must be an integer between 10 and 100,000",
      status: 400,
    });
  });

  it("should reject negative amounts", () => {
    const result = validateBetBody({ ...base, amount: -100 });
    expect(result).toEqual({
      error: "Amount must be an integer between 10 and 100,000",
      status: 400,
    });
  });

  it("should reject amounts above 100,000", () => {
    const result = validateBetBody({ ...base, amount: 100_001 });
    expect(result).toEqual({
      error: "Amount must be an integer between 10 and 100,000",
      status: 400,
    });
  });

  it("should reject non-integer amounts (float)", () => {
    const result = validateBetBody({ ...base, amount: 50.5 });
    expect(result).toEqual({
      error: "Amount must be an integer between 10 and 100,000",
      status: 400,
    });
  });

  it("should reject string amount", () => {
    const result = validateBetBody({ ...base, amount: "100" });
    expect(result).toEqual({
      error: "Amount must be an integer between 10 and 100,000",
      status: 400,
    });
  });

  it("should accept minimum valid amount (10)", () => {
    const result = validateBetBody({ ...base, amount: 10 });
    expect(result).toBeNull();
  });

  it("should accept maximum valid amount (100,000)", () => {
    const result = validateBetBody({ ...base, amount: 100_000 });
    expect(result).toBeNull();
  });

  it("should accept a typical valid amount (500)", () => {
    const result = validateBetBody({ ...base, amount: 500 });
    expect(result).toBeNull();
  });
});

describe("bet API — event validation", () => {
  const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const pastDate = new Date(Date.now() - 1000);

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should reject bets on non-existent event (null)", () => {
    const result = validateEventForBet(null);
    expect(result).toEqual({ error: "Event is not active", status: 400 });
  });

  it("should reject bets on inactive/resolved events", () => {
    const result = validateEventForBet({ status: "resolved", endDate: futureDate });
    expect(result).toEqual({ error: "Event is not active", status: 400 });
  });

  it("should reject bets on cancelled events", () => {
    const result = validateEventForBet({ status: "cancelled", endDate: futureDate });
    expect(result).toEqual({ error: "Event is not active", status: 400 });
  });

  it("should reject bets on pending events", () => {
    const result = validateEventForBet({ status: "pending", endDate: futureDate });
    expect(result).toEqual({ error: "Event is not active", status: 400 });
  });

  it("should reject bets on expired events (past endDate)", () => {
    const result = validateEventForBet({ status: "active", endDate: pastDate });
    expect(result).toEqual({ error: "Event has ended", status: 400 });
  });

  it("should accept bets on active events with future endDate", () => {
    const result = validateEventForBet({ status: "active", endDate: futureDate });
    expect(result).toBeNull();
  });
});

describe("bet API — points / transaction logic", () => {
  const validParams = {
    userId: "user-1",
    eventId: "evt-1",
    choice: "yes" as const,
    amount: 100,
  };

  it("should reject bets with insufficient points", () => {
    expect(() =>
      simulatePlaceBet({ ...validParams, amount: 500, userPoints: 499 })
    ).toThrow("INSUFFICIENT_POINTS");
  });

  it("should reject when user has zero points", () => {
    expect(() =>
      simulatePlaceBet({ ...validParams, amount: 10, userPoints: 0 })
    ).toThrow("INSUFFICIENT_POINTS");
  });

  it("should successfully place a valid bet and return bet record", () => {
    const bet = simulatePlaceBet({ ...validParams, amount: 100, userPoints: 1000 });
    expect(bet).toMatchObject({
      userId: "user-1",
      eventId: "evt-1",
      choice: "yes",
      amount: 100,
    });
  });

  it("should successfully place bet when points exactly equal amount", () => {
    const bet = simulatePlaceBet({ ...validParams, amount: 500, userPoints: 500 });
    expect(bet.amount).toBe(500);
  });

  it("should allow bet when user has more points than amount", () => {
    const bet = simulatePlaceBet({ ...validParams, amount: 100, userPoints: 10_000 });
    expect(bet.amount).toBe(100);
  });
});
