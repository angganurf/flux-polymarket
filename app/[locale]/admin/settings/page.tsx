"use client";

import { useTranslations } from "next-intl";
import { Settings } from "lucide-react";

export default function AdminSettingsPage() {
  const t = useTranslations("admin");

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("settings")}</h1>

      <div className="rounded-xl border border-border bg-surface p-8 text-center">
        <Settings className="mx-auto mb-4 h-10 w-10 text-muted" />
        <p className="text-lg font-medium text-foreground">Coming Soon</p>
        <p className="mt-2 text-sm text-muted">
          System settings, rate limits, and configuration options will be available here.
        </p>
      </div>
    </div>
  );
}
