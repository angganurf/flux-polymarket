"use client";

import { useTranslations } from "next-intl";

export default function PredictError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-no/10">
          <span className="text-2xl">!</span>
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {t("somethingWentWrong")}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {error.message || t("unexpectedError")}
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          {t("tryAgain")}
        </button>
      </div>
    </div>
  );
}
