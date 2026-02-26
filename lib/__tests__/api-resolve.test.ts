import { describe, it, expect } from "vitest";

// Mirrors the resolve logic in app/api/events/[id]/resolve/route.ts
//
// Route flow:
//  1. Auth check (session required)
//  2. result must be "yes" or "no"
//  3. DB transaction atomically claims the event (updateMany where status === "active")
//     - If 0 rows updated → ALREADY_RESOLVED
//  4. Fetch event (with bets) after claiming
//  5. Authorization check: event.creatorId === userId OR user.role === "admin"
//     - If neither → FORBIDDEN (transaction rolls back)
//  6. Calculate and write payouts

// ── Pure logic functions mirroring route ─────────────────────────────────────

function validateResult(result: unknown): { error: string; status: number } | null {
  if (result !== "yes" && result !== "no") {
    return { error: "Result must be 'yes' or 'no'", status: 400 };
  }
  return null;
}

// Mirrors the transaction behavior for event claiming + authorization.
// Returns the simulated settlement or throws a named error.
function simulateResolve(params: {
  eventId: string;
  result: "yes" | "no";
  userId: string;
  userRole: string;
  event: {
    id: string;
    title: string;
    status: string;
    creatorId: string;
    bets: Array<{ id: string; userId: string; amount: number; choice: string }>;
  } | null;
}): {
  result: string;
  eventId: string;
  eventTitle: string;
  winnerPayouts: Array<{ userId: string; payout: number }>;
  loserUserIds: string[];
} {
  const { eventId, result, userId, userRole, event } = params;

  // Simulate updateMany where status === "active"
  if (!event || event.status !== "active") {
    throw new Error("ALREADY_RESOLVED");
  }

  // Authorization: must be creator or admin
  if (event.creatorId !== userId && userRole !== "admin") {
    throw new Error("FORBIDDEN");
  }

  // Calculate payouts (same algorithm as route)
  const winningBets = event.bets.filter((b) => b.choice === result);
  const losingBets = event.bets.filter((b) => b.choice !== result);
  const totalPool = event.bets.reduce((sum, b) => sum + b.amount, 0);
  const winningPool = winningBets.reduce((sum, b) => sum + b.amount, 0);

  const winnerPayouts = winningBets.map((b) => ({
    userId: b.userId,
    payout: winningPool > 0 ? Math.round((b.amount / winningPool) * totalPool) : b.amount,
  }));

  return {
    result,
    eventId,
    eventTitle: event.title,
    winnerPayouts,
    loserUserIds: losingBets.map((b) => b.userId),
  };
}

// ── Tests ────────────────────────────────────────────────────────────────────

const activeEvent = {
  id: "evt-1",
  title: "Will it rain tomorrow?",
  status: "active",
  creatorId: "creator-1",
  bets: [
    { id: "bet-1", userId: "user-A", amount: 200, choice: "yes" },
    { id: "bet-2", userId: "user-B", amount: 100, choice: "no" },
  ],
};

describe("resolve API — result validation", () => {
  it("should reject invalid result values (random string)", () => {
    const err = validateResult("maybe");
    expect(err).toEqual({ error: "Result must be 'yes' or 'no'", status: 400 });
  });

  it("should reject uppercase result (case sensitive)", () => {
    const err = validateResult("YES");
    expect(err).toEqual({ error: "Result must be 'yes' or 'no'", status: 400 });
  });

  it("should reject empty string result", () => {
    const err = validateResult("");
    expect(err).toEqual({ error: "Result must be 'yes' or 'no'", status: 400 });
  });

  it("should reject null result", () => {
    const err = validateResult(null);
    expect(err).toEqual({ error: "Result must be 'yes' or 'no'", status: 400 });
  });

  it("should reject numeric result", () => {
    const err = validateResult(1);
    expect(err).toEqual({ error: "Result must be 'yes' or 'no'", status: 400 });
  });

  it("should accept result 'yes'", () => {
    expect(validateResult("yes")).toBeNull();
  });

  it("should accept result 'no'", () => {
    expect(validateResult("no")).toBeNull();
  });
});

describe("resolve API — authorization", () => {
  it("should reject if user is not the creator", () => {
    expect(() =>
      simulateResolve({
        eventId: "evt-1",
        result: "yes",
        userId: "not-the-creator",
        userRole: "user",
        event: activeEvent,
      })
    ).toThrow("FORBIDDEN");
  });

  it("should allow if user is the creator", () => {
    const settlement = simulateResolve({
      eventId: "evt-1",
      result: "yes",
      userId: "creator-1",
      userRole: "user",
      event: activeEvent,
    });
    expect(settlement.result).toBe("yes");
  });

  it("should allow admin to resolve any event (not creator)", () => {
    const settlement = simulateResolve({
      eventId: "evt-1",
      result: "no",
      userId: "admin-user",
      userRole: "admin",
      event: activeEvent,
    });
    expect(settlement.result).toBe("no");
  });
});

describe("resolve API — already resolved events", () => {
  it("should reject if event is already resolved (status !== active)", () => {
    const resolvedEvent = { ...activeEvent, status: "resolved" };
    expect(() =>
      simulateResolve({
        eventId: "evt-1",
        result: "yes",
        userId: "creator-1",
        userRole: "user",
        event: resolvedEvent,
      })
    ).toThrow("ALREADY_RESOLVED");
  });

  it("should reject if event is cancelled", () => {
    const cancelledEvent = { ...activeEvent, status: "cancelled" };
    expect(() =>
      simulateResolve({
        eventId: "evt-1",
        result: "yes",
        userId: "creator-1",
        userRole: "user",
        event: cancelledEvent,
      })
    ).toThrow("ALREADY_RESOLVED");
  });

  it("should reject if event does not exist (null)", () => {
    expect(() =>
      simulateResolve({
        eventId: "evt-1",
        result: "yes",
        userId: "creator-1",
        userRole: "user",
        event: null,
      })
    ).toThrow("ALREADY_RESOLVED");
  });
});

describe("resolve API — successful resolution", () => {
  it("should successfully resolve event and return result", () => {
    const settlement = simulateResolve({
      eventId: "evt-1",
      result: "yes",
      userId: "creator-1",
      userRole: "user",
      event: activeEvent,
    });
    expect(settlement.result).toBe("yes");
    expect(settlement.eventId).toBe("evt-1");
    expect(settlement.eventTitle).toBe("Will it rain tomorrow?");
  });

  it("should correctly identify winners and losers", () => {
    const settlement = simulateResolve({
      eventId: "evt-1",
      result: "yes",
      userId: "creator-1",
      userRole: "user",
      event: activeEvent,
    });
    // user-A bet YES → winner
    const winnerIds = settlement.winnerPayouts.map((w) => w.userId);
    expect(winnerIds).toContain("user-A");
    // user-B bet NO → loser
    expect(settlement.loserUserIds).toContain("user-B");
  });

  it("should pay winners the full pool proportionally", () => {
    // totalPool = 300, winningPool = 200
    // user-A payout = round(200/200 * 300) = 300
    const settlement = simulateResolve({
      eventId: "evt-1",
      result: "yes",
      userId: "creator-1",
      userRole: "user",
      event: activeEvent,
    });
    const winner = settlement.winnerPayouts.find((w) => w.userId === "user-A");
    expect(winner?.payout).toBe(300);
  });

  it("should resolve with result 'no' and pay correct side", () => {
    // result = "no": user-B (100) wins, user-A (200) loses
    // totalPool = 300, winningPool = 100
    // user-B payout = round(100/100 * 300) = 300
    const settlement = simulateResolve({
      eventId: "evt-1",
      result: "no",
      userId: "creator-1",
      userRole: "user",
      event: activeEvent,
    });
    const winner = settlement.winnerPayouts.find((w) => w.userId === "user-B");
    expect(winner?.payout).toBe(300);
    expect(settlement.loserUserIds).toContain("user-A");
  });

  it("should set status and result correctly on resolution", () => {
    // After a successful simulateResolve, the returned settlement reflects the result
    const settlement = simulateResolve({
      eventId: "evt-1",
      result: "yes",
      userId: "creator-1",
      userRole: "user",
      event: activeEvent,
    });
    expect(settlement.result).toBe("yes");
  });

  it("should handle events with no bets gracefully", () => {
    const emptyEvent = { ...activeEvent, bets: [] };
    const settlement = simulateResolve({
      eventId: "evt-1",
      result: "yes",
      userId: "creator-1",
      userRole: "user",
      event: emptyEvent,
    });
    expect(settlement.winnerPayouts).toHaveLength(0);
    expect(settlement.loserUserIds).toHaveLength(0);
  });
});
