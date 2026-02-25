import { prisma } from "@/lib/db";

export type NotificationType =
  | "bet_result"
  | "event_resolved"
  | "comment_reply"
  | "points_earned"
  | "system";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

/**
 * Create a notification for a user, respecting their notification preferences.
 * Returns null if the user has disabled this notification type.
 */
export async function createNotification(input: CreateNotificationInput) {
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: input.userId },
  });

  // If preferences exist, check if this notification type is enabled
  if (prefs) {
    // Check global in-app toggle first
    if (!prefs.inAppEnabled) return null;

    const typeMap: Record<NotificationType, keyof typeof prefs> = {
      bet_result: "betResults",
      event_resolved: "eventResolved",
      comment_reply: "commentReplies",
      points_earned: "betResults",
      system: "systemAlerts",
    };

    const prefKey = typeMap[input.type];
    if (prefKey && !prefs[prefKey]) return null;
  }

  return prisma.notification.create({ data: input });
}

/**
 * Fetch paginated notifications for a user, including unread count.
 */
export async function getUserNotifications(
  userId: string,
  limit = 20,
  offset = 0
) {
  const [notifications, unreadCount, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.notification.count({ where: { userId, read: false } }),
    prisma.notification.count({ where: { userId } }),
  ]);

  return { notifications, unreadCount, total, limit, offset };
}

/**
 * Mark a single notification as read for a specific user.
 */
export async function markAsRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

/**
 * Mark all unread notifications as read for a user.
 */
export async function markAllAsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

/**
 * Get or create default notification preferences for a user.
 */
export async function getOrCreatePreferences(userId: string) {
  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  if (!prefs) {
    prefs = await prisma.notificationPreference.create({
      data: { userId },
    });
  }

  return prefs;
}
