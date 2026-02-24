"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";

export function Header() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const links = [
    { href: "/markets" as const, label: t("markets") },
    { href: "/leaderboard" as const, label: t("leaderboard") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
          <BarChart3 className="h-5 w-5 text-primary" />
          <span>PredictFlow</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "bg-primary/10 text-primary"
                  : "text-muted hover:text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
        </div>
      </div>
    </header>
  );
}
