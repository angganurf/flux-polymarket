"use client";

import { useState, useRef, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  Bell,
  Trophy,
  CheckCircle,
  MessageCircle,
  Coins,
  Info,
  CheckCheck,
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
  event_resolved: CheckCircle,
  comment_reply: MessageCircle,
  points_earned: Coins,
  system: Info,
};

const typeColors: Record<string, string> = {
  bet_result: "text-yes",
  event_resolved: "text-primary",
  comment_reply: "text-primary-hover",
  points_earned: "text-yes",
  system: "text-muted",
};

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string, link?: string | null) => void;
}) {
  const Icon = typeIcons[notification.type] || Bell;
  const colorClass = typeColors[notification.type] || "text-muted";

  const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
    addSuffix: false,
  });

  return (
    <button
      onClick={() => onRead(notification.id, notification.link)}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-hover",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className={cn("mt-0.5 shrink-0", colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm leading-tight",
            notification.read ? "text-muted" : "font-medium text-foreground"
          )}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
          {notification.message}
        </p>
        <p className="mt-1 text-[10px] text-muted/60">{timeAgo}</p>
      </div>
      {!notification.read && (
        <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
      )}
    </button>
  );
}

export function NotificationBell() {
  const { data: session } = useSession();
  const t = useTranslations("notifications");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data } = useNotifications(5, 0);
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unreadCount = data?.unreadCount ?? 0;
  const notifications = data?.notifications ?? [];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open]);

  if (!session?.user) return null;

  function handleNotificationClick(id: string, link?: string | null) {
    markAsRead.mutate(id);
    setOpen(false);
    if (link) {
      router.push(link as "/");
    }
  }

  function handleMarkAllRead() {
    markAllAsRead.mutate();
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center justify-center rounded-lg p-2 text-muted transition-colors hover:text-foreground"
        aria-label={t("title")}
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-no px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t("title")}
              {unreadCount > 0 && (
                <span className="ml-2 text-xs font-normal text-muted">
                  {unreadCount} {t("unread")}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-primary transition-colors hover:text-primary-hover"
                disabled={markAllAsRead.isPending}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                {t("markAllRead")}
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted">
                <Bell className="mb-2 h-8 w-8 opacity-30" />
                <p className="text-sm">{t("empty")}</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onRead={handleNotificationClick}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border">
              <button
                onClick={() => {
                  setOpen(false);
                  router.push("/notifications" as "/");
                }}
                className="block w-full py-2.5 text-center text-xs font-medium text-primary transition-colors hover:bg-surface-hover hover:text-primary-hover"
              >
                {t("viewAll")}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
