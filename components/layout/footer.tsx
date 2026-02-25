"use client";

import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border bg-surface/50 py-6">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted">
        <p>{t("tagline")}</p>
        <p className="mt-1 text-xs">
          {t("disclaimer")}
        </p>
      </div>
    </footer>
  );
}
