"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  useNotificationPreferences,
  useUpdatePreferences,
} from "@/lib/hooks/use-notifications";
import { Bell, Mail, Trophy, CheckCircle, MessageCircle, Info } from "lucide-react";
import { useState, useEffect } from "react";

interface ToggleProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

function Toggle({
  label,
  description,
  icon,
  checked,
  onChange,
  disabled,
}: ToggleProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-surface-hover",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <div className="flex items-center gap-3">
        {icon && <div className="text-muted">{icon}</div>}
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && (
            <p className="mt-0.5 text-xs text-muted">{description}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-primary" : "bg-border-light",
          disabled && "cursor-not-allowed"
        )}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
    </label>
  );
}

export function NotificationPreferences() {
  const t = useTranslations("notifications");
  const { data: prefs, isLoading } = useNotificationPreferences();
  const updatePrefs = useUpdatePreferences();
  const [saved, setSaved] = useState(false);

  // Local state that syncs with server
  const [local, setLocal] = useState({
    inAppEnabled: true,
    emailEnabled: false,
    betResults: true,
    eventResolved: true,
    commentReplies: true,
    systemAlerts: true,
  });

  useEffect(() => {
    if (prefs) {
      setLocal({
        inAppEnabled: prefs.inAppEnabled,
        emailEnabled: prefs.emailEnabled,
        betResults: prefs.betResults,
        eventResolved: prefs.eventResolved,
        commentReplies: prefs.commentReplies,
        systemAlerts: prefs.systemAlerts,
      });
    }
  }, [prefs]);

  function handleToggle(field: keyof typeof local, value: boolean) {
    const updated = { ...local, [field]: value };
    setLocal(updated);

    updatePrefs.mutate(
      { [field]: value },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg bg-surface"
          />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">{t("preferences")}</h2>
        {saved && (
          <span className="rounded-lg bg-yes/10 px-3 py-1 text-xs font-medium text-yes">
            {t("saved")}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {/* Global toggles */}
        <div className="mb-2">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Global
          </p>
          <div className="space-y-2">
            <Toggle
              label={t("inApp")}
              icon={<Bell className="h-4 w-4" />}
              checked={local.inAppEnabled}
              onChange={(v) => handleToggle("inAppEnabled", v)}
            />
            <Toggle
              label={t("email")}
              icon={<Mail className="h-4 w-4" />}
              checked={local.emailEnabled}
              onChange={(v) => handleToggle("emailEnabled", v)}
            />
          </div>
        </div>

        {/* Per-type toggles */}
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Categories
          </p>
          <div className="space-y-2">
            <Toggle
              label={t("betResults")}
              icon={<Trophy className="h-4 w-4" />}
              checked={local.betResults}
              onChange={(v) => handleToggle("betResults", v)}
              disabled={!local.inAppEnabled}
            />
            <Toggle
              label={t("eventResolved")}
              icon={<CheckCircle className="h-4 w-4" />}
              checked={local.eventResolved}
              onChange={(v) => handleToggle("eventResolved", v)}
              disabled={!local.inAppEnabled}
            />
            <Toggle
              label={t("commentReplies")}
              icon={<MessageCircle className="h-4 w-4" />}
              checked={local.commentReplies}
              onChange={(v) => handleToggle("commentReplies", v)}
              disabled={!local.inAppEnabled}
            />
            <Toggle
              label={t("systemAlerts")}
              icon={<Info className="h-4 w-4" />}
              checked={local.systemAlerts}
              onChange={(v) => handleToggle("systemAlerts", v)}
              disabled={!local.inAppEnabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
