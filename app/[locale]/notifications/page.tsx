"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { NotificationList } from "@/components/notifications/notification-list";
import { NotificationPreferences } from "@/components/notifications/notification-preferences";

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const tAuth = useTranslations("auth");
  const { status: sessionStatus } = useSession();
  const [showPreferences, setShowPreferences] = useState(false);

  // Unauthenticated state
  if (sessionStatus === "unauthenticated") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-lg text-muted mb-4">{t("title")}</p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          {tAuth("login")}
        </Link>
      </div>
    );
  }

  // Loading skeleton
  if (sessionStatus === "loading") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="h-8 w-40 rounded bg-border animate-pulse mb-8" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-lg bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {showPreferences ? (
        <div>
          <button
            onClick={() => setShowPreferences(false)}
            className="mb-4 text-sm text-primary hover:text-primary-hover transition-colors"
          >
            &larr; {t("title")}
          </button>
          <NotificationPreferences />
        </div>
      ) : (
        <NotificationList
          onOpenPreferences={() => setShowPreferences(true)}
        />
      )}
    </div>
  );
}
