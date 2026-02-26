"use client";

import { useSession, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LogIn, LogOut, Coins, Shield, UserCog } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export function UserMenu() {
  const { data: session, status } = useSession();
  const t = useTranslations("auth");
  const tAdmin = useTranslations("admin");
  const tProfile = useTranslations("profile");

  const { data: userInfo } = useQuery({
    queryKey: ["user-me"],
    queryFn: async () => {
      const res = await fetch("/api/user/me");
      if (!res.ok) throw new Error("Failed to fetch user info");
      return res.json() as Promise<{ points: number; role: string }>;
    },
    enabled: !!session?.user,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const points = userInfo?.points ?? null;
  const role = userInfo?.role ?? null;

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

      {/* Profile link */}
      <Link
        href="/profile"
        className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted transition-colors hover:text-foreground hover:border-border-light"
        aria-label={tProfile("title")}
      >
        <UserCog className="h-3.5 w-3.5" />
      </Link>

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
