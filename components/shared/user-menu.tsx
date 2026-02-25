"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogIn, LogOut, Coins, Shield } from "lucide-react";
import { useEffect, useState } from "react";

export function UserMenu() {
  const { data: session, status } = useSession();
  const t = useTranslations("auth");
  const tAdmin = useTranslations("admin");
  const [points, setPoints] = useState<number | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    const fetchUserInfo = async () => {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          setPoints(data.points);
          setRole(data.role);
        }
      } catch {
        // Silently fail — user info display is non-critical
      }
    };

    fetchUserInfo();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUserInfo, 30_000);
    return () => clearInterval(interval);
  }, [session?.user]);

  if (status === "loading") {
    return <div className="h-8 w-20 animate-pulse rounded-lg bg-border" />;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-hover"
      >
        <LogIn className="h-3.5 w-3.5" />
        {t("login")}
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Points display */}
      <div className="flex items-center gap-1 text-xs font-medium text-yes">
        <Coins className="h-3.5 w-3.5" />
        <span>{points != null ? points.toLocaleString() : "..."}</span>
      </div>

      {/* User name */}
      <span className="text-xs text-muted">{session.user.name || session.user.email}</span>

      {/* Admin link */}
      {role === "admin" && (
        <Link
          href="/admin"
          className="flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
        >
          <Shield className="h-3.5 w-3.5" />
          {tAdmin("admin")}
        </Link>
      )}

      {/* Logout button */}
      <button
        onClick={() => signOut()}
        aria-label={t("logout")}
        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-foreground hover:border-border-light"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
