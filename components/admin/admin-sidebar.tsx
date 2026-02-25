"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { LayoutDashboard, Users, Calendar, Settings, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin" as const, icon: LayoutDashboard, labelKey: "dashboard" },
  { href: "/admin/users" as const, icon: Users, labelKey: "users" },
  { href: "/admin/events" as const, icon: Calendar, labelKey: "events" },
  { href: "/admin/settings" as const, icon: Settings, labelKey: "settings" },
];

export function AdminSidebar() {
  const t = useTranslations("admin");
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:block">
      <div className="flex h-full flex-col">
        {/* Sidebar header */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-4">
          <Shield className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-foreground">{t("title")}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4" aria-label={t("title")}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:bg-surface-hover hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {t(item.labelKey as "dashboard" | "users" | "events" | "settings")}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
