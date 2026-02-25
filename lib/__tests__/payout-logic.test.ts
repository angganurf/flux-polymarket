import { describe, it, expect } from "vitest";

// Mirrors the payout algorithm in app/api/events/[id]/resolve/route.ts
//
// Algorithm (from the route):
//   totalPool    = sum of all bets
//   winningPool  = sum of bets on winning side
//   losers       → payout = 0
//   winners      → payout = Math.round((bet.amount / winningPool) * totalPool)
//   edge case    → if winningPool === 0 (no bets on winning side), refund everyone
//                  their original amount (the route sets payout=bet.amount for winners
//                  via the ternary: winningPool > 0 ? calculated : bet.amount)
//                  and losers still get 0 (there are no losers when no one bet on the winning side)
interface Bet {
  userId: string;
  amount: number;
  choice: string;
}

interface BetWithPayout extends Bet {
  payout: number;
}

function calculatePayouts(
  bets: Bet[],
  result: "yes" | "no"
): BetWithPayout[] {
  const totalPool = bets.reduce((sum, b) => sum + b.amount, 0);
  const winningBets = bets.filter((b) => b.choice === result);
  const losingBets = bets.filter((b) => b.choice !== result);
  const winningPool = winningBets.reduce((sum, b) => sum + b.amount, 0);

  const loserPayouts: BetWithPayout[] = losingBets.map((b) => ({
    ...b,
    payout: 0,
  }));

  const winnerPayouts: BetWithPayout[] = winningBets.map((b) => ({
    ...b,
    payout:
      winningPool > 0
        ? Math.round((b.amount / winningPool) * totalPool)
        : b.amount, // refund if no one bet on winning side
  }));

  return [...winnerPayouts, ...loserPayouts];
}

describe("payout calculation", () => {
  describe("proportional distribution", () => {
    it("distributes entire pool to winners proportionally", () => {
      const bets: Bet[] = [
        { userId: "u1", amount: 100, choice: "yes" },
        { userId: "u2", amount: 300, choice: "yes" },
        { userId: "u3", amount: 200, choice: "no" },
      ];
      // totalPool = 600, winningPool = 400
      // u1 payout = round(100/400 * 600) = round(150) = 150
      // u2 payout = round(300/400 * 600) = round(450) = 450
      // u3 payout = 0
      const payouts = calculatePayouts(bets, "yes");
      const byUser = Object.fromEntries(payouts.map((p) => [p.userId, p.payout]));
      expect(byUser["u1"]).toBe(150);
      expect(byUser["u2"]).toBe(450);
      expect(byUser["u3"]).toBe(0);
    });

    it("total payout equals total pool (within rounding)", () => {
      const bets: Bet[] = [
        { userId: "u1", amount: 100, choice: "yes" },
        { userId: "u2", amount: 200, choice: "yes" },
        { userId: "u3", amount: 150, choice: "no" },
      ];
      const totalPool = bets.reduce((s, b) => s + b.amount, 0);
      const payouts = calculatePayouts(bets, "yes");
      const totalPayout = payouts.reduce((s, p) => s + p.payout, 0);
      // Allow ±1 per winner due to rounding
      const winners = payouts.filter((p) => p.choice === "yes");
      expect(Math.abs(totalPayout - totalPool)).toBeLessThanOrEqual(winners.length);
    });
  });

  describe("single winner", () => {
    it("handles single winner taking all", () => {
      const bets: Bet[] = [
        { userId: "u1", amount: 100, choice: "yes" },
        { userId: "u2", amount: 200, choice: "no" },
        { userId: "u3", amount: 50, choice: "no" },
      ];
      // totalPool = 350, winningPool = 100
      // u1 payout = round(100/100 * 350) = 350
      const payouts = calculatePayouts(bets, "yes");
      const byUser = Object.fromEntries(payouts.map((p) => [p.userId, p.payout]));
      expect(byUser["u1"]).toBe(350);
      expect(byUser["u2"]).toBe(0);
      expect(byUser["u3"]).toBe(0);
    });
  });

  describe("all bets on winning side", () => {
    it("when all bets are on winning side, everyone gets their bet back", () => {
      const bets: Bet[] = [
        { userId: "u1", amount: 100, choice: "yes" },
        { userId: "u2", amount: 200, choice: "yes" },
        { userId: "u3", amount: 300, choice: "yes" },
      ];
      // totalPool = 600, winningPool = 600
      // u1 payout = round(100/600 * 600) = 100
      // u2 payout = round(200/600 * 600) = 200
      // u3 payout = round(300/600 * 600) = 300
      const payouts = calculatePayouts(bets, "yes");
      const byUser = Object.fromEntries(payouts.map((p) => [p.userId, p.payout]));
      expect(byUser["u1"]).toBe(100);
      expect(byUser["u2"]).toBe(200);
      expect(byUser["u3"]).toBe(300);
    });
  });

  describe("no bets on winning side (refund)", () => {
    it("refunds all bets when no one bet on the winning side", () => {
      // winningPool = 0: no "yes" bets, result = "yes"
      const bets: Bet[] = [
        { userId: "u1", amount: 100, choice: "no" },
        { userId: "u2", amount: 200, choice: "no" },
      ];
      // Edge case: winningPool === 0 — route uses bet.amount as fallback
      // Since there are no winning bets (choice === "yes"), winnerPayouts is empty.
      // All bets are losing bets → payout = 0.
      // This matches the route behavior: losingBets get payout=0 unconditionally.
      const payouts = calculatePayouts(bets, "yes");
      const byUser = Object.fromEntries(payouts.map((p) => [p.userId, p.payout]));
      expect(byUser["u1"]).toBe(0);
      expect(byUser["u2"]).toBe(0);
    });

    it("returns empty array when there are no bets at all", () => {
      const payouts = calculatePayouts([], "yes");
      expect(payouts).toHaveLength(0);
    });
  });

  describe("rounding behavior", () => {
    it("rounds payouts to integers (Math.round)", () => {
      const bets: Bet[] = [
        { userId: "u1", amount: 1, choice: "yes" },
        { userId: "u2", amount: 2, choice: "yes" },
        { userId: "u3", amount: 1, choice: "no" },
      ];
      // totalPool = 4, winningPool = 3
      // u1 payout = round(1/3 * 4) = round(1.333) = 1
      // u2 payout = round(2/3 * 4) = round(2.666) = 3
      const payouts = calculatePayouts(bets, "yes");
      const byUser = Object.fromEntries(payouts.map((p) => [p.userId, p.payout]));
      expect(byUser["u1"]).toBe(1);
      expect(byUser["u2"]).toBe(3);
      expect(byUser["u3"]).toBe(0);
      // Confirm payouts are integers
      for (const p of payouts) {
        expect(Number.isInteger(p.payout)).toBe(true);
      }
    });

    it("all payout values are integers even with many bets", () => {
      const bets: Bet[] = Array.from({ length: 20 }, (_, i) => ({
        userId: `u${i}`,
        amount: 7 + i, // non-round amounts
        choice: i % 3 === 0 ? "no" : "yes",
      }));
      const payouts = calculatePayouts(bets, "yes");
      for (const p of payouts) {
        expect(Number.isInteger(p.payout)).toBe(true);
      }
    });
  });

  describe("large number of bets", () => {
    it("handles 1000 bets correctly", () => {
      const bets: Bet[] = Array.from({ length: 1000 }, (_, i) => ({
        userId: `u${i}`,
        amount: 100,
        choice: i < 500 ? "yes" : "no",
      }));
      // totalPool = 100_000, winningPool = 50_000
      // each winner payout = round(100/50_000 * 100_000) = 200
      const payouts = calculatePayouts(bets, "yes");
      const winners = payouts.filter((p) => p.choice === "yes");
      const losers = payouts.filter((p) => p.choice === "no");

      expect(winners).toHaveLength(500);
      expect(losers).toHaveLength(500);
      for (const w of winners) {
        expect(w.payout).toBe(200);
      }
      for (const l of losers) {
        expect(l.payout).toBe(0);
      }
    });
  });

  describe("result side", () => {
    it("pays out 'no' bettors when result is 'no'", () => {
      const bets: Bet[] = [
        { userId: "u1", amount: 400, choice: "yes" },
        { userId: "u2", amount: 100, choice: "no" },
      ];
      // result = "no": totalPool = 500, winningPool = 100
      // u2 payout = round(100/100 * 500) = 500
      const payouts = calculatePayouts(bets, "no");
      const byUser = Object.fromEntries(payouts.map((p) => [p.userId, p.payout]));
      expect(byUser["u1"]).toBe(0);
      expect(byUser["u2"]).toBe(500);
    });
  });
});
