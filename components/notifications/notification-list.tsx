"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Bell,
  Trophy,
  CheckCircle,
  MessageCircle,
  Coins,
  Info,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  type Notification,
} from "@/lib/hooks/use-notifications";
import { formatDistanceToNow } from "date-fns";

const typeIcons: Record<string, typeof Bell> = {
  bet_result: Trophy,
  bet_won: Trophy,
  bet_lost: Trophy,
  event_resolved: CheckCircle,
  comment_reply: MessageCircle,
  points_earned: Coins,
  system: Info,
};

const typeColors: Record<string, string> = {
  bet_result: "text-yes",
  bet_won: "text-yes",
  bet_lost: "text-no",
  event_resolved: "text-primary",
  comment_reply: "text-primary-hover",
  points_earned: "text-yes",
  system: "text-muted",
};

const PAGE_SIZE = 20;

function parseStructuredMessage(
  type: string,
  title: string,
  message: string,
  t: ReturnType<typeof useTranslations<"notifications">>
): { displayTitle: string; displayMessage: string } {
  if (type === "bet_won" || type === "bet_lost") {
    try {
      const data = JSON.parse(message) as Record<string, unknown>;
      if (type === "bet_won") {
        return {
          displayTitle: t("betWonTitle"),
          displayMessage: t("betWonMessage", {
            payout: data.payout as number,
            eventTitle: data.eventTitle as string,
          }),
        };
      } else {
        return {
          displayTitle: t("betLostTitle"),
          displayMessage: t("betLostMessage", {
            eventTitle: data.eventTitle as string,
          }),
        };
      }
    } catch {
      // Fall through to raw values if JSON parse fails
    }
  }
  return { displayTitle: title, displayMessage: message };
}

function NotificationRow({
  notification,
  onRead,
  t,
}: {
  notification: Notification;
  onRead: (id: string, link?: string | null) => void;
  t: ReturnType<typeof useTranslations<"notifications">>;
}) {
  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || "text-muted";

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: false,
  });

  const { displayTitle, displayMessage } = parseStructuredMessage(
    notification.type,
    notification.title,
    notification.message,
    t
  );

  return (
    <button
      onClick={() => onRead(notification.id, notification.link)}
      className={cn(
        "flex w-full items-start gap-4 rounded-lg p-4 text-left transition-colors hover:bg-surface-hover",
        !notification.read && "bg-primary/5 border border-primary/10",
        notification.read && "border border-transparent"
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          notification.read ? "bg-border/30" : "bg-primary/10",
          colorClass
        )}
      >
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-tight",
              notification.read
                ? "text-muted"
                : "font-medium text-foreground"
            )}
          >
            {displayTitle}
          </p>
          <span className="shrink-0 text-[11px] text-muted/60">
            {timeAgo}
          </span>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {displayMessage}
        </p>
      </div>
      {!notification.read && (
        <div className="mt-3 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}

interface NotificationListProps {
  onOpenPreferences?: () => void;
}

export function NotificationList({
  onOpenPreferences,
}: NotificationListProps) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const [page, setPage] = useState(0);

  const offset = page * PAGE_SIZE;
  const { data, isLoading } = useNotifications(PAGE_SIZE, offset);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.notifications ?? [];
  const total = data?.total ?? 0;
  const unreadCount = data?.unreadCount ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  function handleNotificationClick(id: string, link?: string | null) {
    markAsRead.mutate(id);
    if (link) {
      router.push(link as "/");
    }
  }

  return (
    <div>
      {/* Header row */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-muted">
              {unreadCount} {t("unread")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-light hover:text-foreground"
            >
              {t("markAllRead")}
            </button>
          )}
          {onOpenPreferences && (
            <button
              onClick={onOpenPreferences}
              className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-light hover:text-foreground"
            >
              <Settings className="h-3.5 w-3.5" />
              {t("preferences")}
            </button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-surface"
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface py-16">
          <Bell className="mb-3 h-12 w-12 text-muted/20" />
          <p className="text-sm text-muted">{t("empty")}</p>
        </div>
      )}

      {/* Notification list */}
      {!isLoading && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onRead={handleNotificationClick}
              t={t}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-xs text-muted">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted transition-colors hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
