"use client";

import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";

export default function OfflinePage() {
  const t = useTranslations("offline");

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-2 text-muted">
          <WifiOff className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-3 max-w-sm text-sm text-muted">{t("description")}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-8 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          {t("retry")}
        </button>
      </div>
    </div>
  );
}
