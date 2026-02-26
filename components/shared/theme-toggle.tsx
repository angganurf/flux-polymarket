"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

export function ThemeToggle() {
  const t = useTranslations("common");
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration gate for theme
    setMounted(true);
  }, []);

  // Avoid hydration mismatch: render placeholder until mounted
  if (!mounted) {
    return (
      <button
        className={cn(
          "flex items-center justify-center rounded-lg p-1.5",
          "border border-border text-muted transition-colors"
        )}
        aria-label={t("toggleTheme")}
      >
        <Sun className="h-3.5 w-3.5" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex items-center justify-center rounded-lg p-1.5",
        "border border-border text-muted transition-colors hover:text-foreground hover:border-border-light"
      )}
      aria-label={isDark ? t("lightMode") : t("darkMode")}
      title={isDark ? t("lightMode") : t("darkMode")}
    >
      {isDark ? (
        <Sun className="h-3.5 w-3.5" />
      ) : (
        <Moon className="h-3.5 w-3.5" />
      )}
    </button>
  );
}
