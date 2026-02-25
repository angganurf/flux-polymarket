"use client";

import { useTranslations } from "next-intl";

export default function AdminError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-bold text-foreground">
        {t("somethingWentWrong")}
      </h2>
      <p className="text-muted">{error.message || t("unexpectedError")}</p>
      <button
        onClick={reset}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
      >
        {t("tryAgain")}
      </button>
    </div>
  );
}
