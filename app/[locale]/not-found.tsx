import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("errors");

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-primary">404</p>
        <h2 className="mt-4 text-xl font-bold text-foreground">{t("notFound")}</h2>
        <p className="mt-2 text-sm text-muted">{t("notFoundDescription")}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          {t("goHome")}
        </Link>
      </div>
    </div>
  );
}
