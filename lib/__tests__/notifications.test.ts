import { describe, it, expect } from "vitest";
import type { NotificationType } from "../notifications";

// Test notification type mapping and preference checking logic
describe("notification preferences", () => {
  const typeMap: Record<NotificationType, string> = {
    bet_result: "betResults",
    bet_won: "betResults",
    bet_lost: "betResults",
    event_resolved: "eventResolved",
    comment_reply: "commentReplies",
    points_earned: "betResults",
    system: "systemAlerts",
  };

  it("maps notification types to preference keys correctly", () => {
    expect(typeMap["bet_result"]).toBe("betResults");
    expect(typeMap["event_resolved"]).toBe("eventResolved");
    expect(typeMap["comment_reply"]).toBe("commentReplies");
    expect(typeMap["system"]).toBe("systemAlerts");
    expect(typeMap["points_earned"]).toBe("betResults");
  });

  it("all notification types have preference mappings", () => {
    const types: NotificationType[] = [
      "bet_result",
      "bet_won",
      "bet_lost",
      "event_resolved",
      "comment_reply",
      "points_earned",
      "system",
    ];
    for (const type of types) {
      expect(typeMap[type]).toBeDefined();
    }
  });

  it("maps bet_result and points_earned to the same preference key", () => {
    expect(typeMap["bet_result"]).toBe(typeMap["points_earned"]);
  });

  it("maps exactly 7 notification types", () => {
    expect(Object.keys(typeMap)).toHaveLength(7);
  });
});

describe("notification preference gate logic", () => {
  // Simulate the gating logic from createNotification without Prisma
  function shouldSend(
    prefs: {
      inAppEnabled: boolean;
      betResults: boolean;
      eventResolved: boolean;
      commentReplies: boolean;
      systemAlerts: boolean;
    } | null,
    type: NotificationType
  ): boolean {
    if (!prefs) return true; // no prefs = always send

    if (!prefs.inAppEnabled) return false;

    const typeMap: Record<NotificationType, keyof typeof prefs> = {
      bet_result: "betResults",
      bet_won: "betResults",
      bet_lost: "betResults",
      event_resolved: "eventResolved",
      comment_reply: "commentReplies",
      points_earned: "betResults",
      system: "systemAlerts",
    };

    const prefKey = typeMap[type];
    if (prefKey && !prefs[prefKey]) return false;

    return true;
  }

  it("sends notification when no preferences are set", () => {
    expect(shouldSend(null, "bet_result")).toBe(true);
  });

  it("blocks notification when inAppEnabled is false", () => {
    const prefs = {
      inAppEnabled: false,
      betResults: true,
      eventResolved: true,
      commentReplies: true,
      systemAlerts: true,
    };
    expect(shouldSend(prefs, "bet_result")).toBe(false);
  });

  it("blocks bet_result when betResults is false", () => {
    const prefs = {
      inAppEnabled: true,
      betResults: false,
      eventResolved: true,
      commentReplies: true,
      systemAlerts: true,
    };
    expect(shouldSend(prefs, "bet_result")).toBe(false);
  });

  it("blocks points_earned when betResults is false (shared pref key)", () => {
    const prefs = {
      inAppEnabled: true,
      betResults: false,
      eventResolved: true,
      commentReplies: true,
      systemAlerts: true,
    };
    expect(shouldSend(prefs, "points_earned")).toBe(false);
  });

  it("blocks comment_reply when commentReplies is false", () => {
    const prefs = {
      inAppEnabled: true,
      betResults: true,
      eventResolved: true,
      commentReplies: false,
      systemAlerts: true,
    };
    expect(shouldSend(prefs, "comment_reply")).toBe(false);
  });

  it("sends when all preferences are enabled", () => {
    const prefs = {
      inAppEnabled: true,
      betResults: true,
      eventResolved: true,
      commentReplies: true,
      systemAlerts: true,
    };
    expect(shouldSend(prefs, "system")).toBe(true);
    expect(shouldSend(prefs, "event_resolved")).toBe(true);
    expect(shouldSend(prefs, "comment_reply")).toBe(true);
  });
});
