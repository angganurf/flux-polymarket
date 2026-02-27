import { prisma } from "@/lib/db";
import {
  sendEmail,
  betResultEmailHtml,
  commentReplyEmailHtml,
} from "@/lib/email";

export type NotificationType =
  | "bet_result"
  | "bet_won"
  | "bet_lost"
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
      bet_won: "betResults",
      bet_lost: "betResults",
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

      if (input.type === "bet_result" || input.type === "bet_won" || input.type === "bet_lost" || input.type === "event_resolved") {
        let parsedEventTitle = input.title;
        try {
          const parsed = JSON.parse(input.message);
          if (parsed.eventTitle) parsedEventTitle = parsed.eventTitle;
        } catch {
          // message is not JSON, use title as-is
        }
        emailHtml = betResultEmailHtml({
          userName: user.name || "",
          eventTitle: parsedEventTitle,
          won: input.type === "bet_won",
          link: input.link || "/",
        });
      } else if (input.type === "comment_reply") {
        let commenterName = "";
        let eventTitle = input.title;
        let commentContent = input.message;
        try {
          const msgData = JSON.parse(input.message) as Record<string, unknown>;
          if (msgData.commenterName) commenterName = msgData.commenterName as string;
          if (msgData.eventTitle) eventTitle = msgData.eventTitle as string;
          if (msgData.content) commentContent = msgData.content as string;
        } catch {
          // message is not JSON, use raw values
        }
        emailHtml = commentReplyEmailHtml({
          userName: user.name || "",
          commenterName,
          eventTitle,
          comment: commentContent,
          link: input.link || "/",
        });
      }

      if (emailHtml) {
        // Resolve a human-readable email subject from potentially structured title
        let emailSubject = input.title;
        try {
          const titleData = JSON.parse(input.title) as Record<string, unknown>;
          if (titleData.key === "newComment") emailSubject = "New comment on your prediction";
        } catch {
          // title is plain text, use as-is
        }
        const result = await sendEmail({
          to: user.email,
          subject: emailSubject,
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
