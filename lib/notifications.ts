import { prisma } from "@/lib/db";
import {
  sendEmail,
  betResultEmailHtml,
  commentReplyEmailHtml,
} from "@/lib/email";

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

  const notification = await prisma.notification.create({ data: input });

  // Send email notification if the user has it enabled
  if (prefs?.emailEnabled) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true, name: true },
    });

    if (user?.email) {
      let emailHtml: string | null = null;

      if (input.type === "bet_result" || input.type === "event_resolved") {
        emailHtml = betResultEmailHtml({
          userName: user.name || "",
          eventTitle: input.title,
          won: input.title.toLowerCase().includes("won"),
          link: input.link || "/",
        });
      } else if (input.type === "comment_reply") {
        emailHtml = commentReplyEmailHtml({
          userName: user.name || "",
          commenterName: "",
          eventTitle: input.title,
          comment: input.message,
          link: input.link || "/",
        });
      }

      if (emailHtml) {
        const result = await sendEmail({
          to: user.email,
          subject: input.title,
          html: emailHtml,
        });
        if (result) {
          await prisma.notification.update({
            where: { id: notification.id },
            data: { emailSent: true },
          });
        }
      }
    }
  }

  return notification;
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
