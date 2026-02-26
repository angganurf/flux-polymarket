"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Coins, Calendar, Lock, Save, CheckCircle } from "lucide-react";

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  points: number;
  createdAt: string;
}

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tAuth = useTranslations("auth");
  const { data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [nameInitialized, setNameInitialized] = useState(false);
  const [nameSuccess, setNameSuccess] = useState("");
  const [nameError, setNameError] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["user-me"],
    queryFn: async () => {
      const res = await fetch("/api/user/me");
      if (!res.ok) throw new Error("Failed to fetch profile");
      return res.json();
    },
    enabled: !!session?.user,
    staleTime: 30_000,
  });

  // Initialize name from profile data
  if (profile && !nameInitialized) {
    setName(profile.name ?? "");
    setNameInitialized(true);
  }

  const nameMutation = useMutation({
    mutationFn: async (newName: string) => {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update name");
      }
      return res.json();
    },
    onSuccess: () => {
      setNameSuccess(t("nameUpdated"));
      setNameError("");
      queryClient.invalidateQueries({ queryKey: ["user-me"] });
      setTimeout(() => setNameSuccess(""), 3000);
    },
    onError: (err: Error) => {
      setNameError(err.message);
      setNameSuccess("");
    },
  });

  const passwordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to change password");
      }
      return res.json();
    },
    onSuccess: () => {
      setPasswordSuccess(t("passwordChanged"));
      setPasswordError("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(""), 3000);
    },
    onError: (err: Error) => {
      if (err.message.includes("incorrect")) {
        setPasswordError(t("wrongPassword"));
      } else {
        setPasswordError(err.message);
      }
      setPasswordSuccess("");
    },
  });

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setNameError("");
    setNameSuccess("");
    nameMutation.mutate(name.trim());
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword.length < 8) {
      setPasswordError(t("passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("passwordMismatch"));
      return;
    }

    passwordMutation.mutate({ currentPassword, newPassword });
  };

  // Unauthenticated state
  if (sessionStatus === "unauthenticated") {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 text-center">
        <p className="text-lg text-muted mb-4">{t("loginRequired")}</p>
        <Link
          href="/login"
          className="inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
        >
          {tAuth("login")}
        </Link>
      </div>
    );
  }

  // Loading skeleton
  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className="h-8 w-48 rounded bg-border animate-pulse mb-8" />
        <div className="rounded-xl border border-border bg-surface p-6 animate-pulse mb-6">
          <div className="h-4 w-32 rounded bg-border mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <div className="h-4 w-24 rounded bg-border" />
                <div className="h-4 w-40 rounded bg-border" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 animate-pulse mb-6">
          <div className="h-4 w-36 rounded bg-border mb-4" />
          <div className="h-10 w-full rounded bg-border mb-3" />
          <div className="h-10 w-28 rounded bg-border" />
        </div>
        <div className="rounded-xl border border-border bg-surface p-6 animate-pulse">
          <div className="h-4 w-40 rounded bg-border mb-4" />
          <div className="space-y-3">
            <div className="h-10 w-full rounded bg-border" />
            <div className="h-10 w-full rounded bg-border" />
            <div className="h-10 w-full rounded bg-border" />
          </div>
        </div>
      </div>
    );
  }

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString()
    : "...";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">{t("title")}</h1>

      {/* Profile info card */}
      <div className="rounded-xl border border-border bg-surface p-6 mb-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <User className="h-4 w-4" />
              {t("displayName")}
            </div>
            <span className="text-sm font-medium text-foreground">
              {profile?.name || "..."}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              {t("email")}
            </div>
            <span className="text-sm font-medium text-foreground">
              {profile?.email || "..."}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Coins className="h-4 w-4" />
              {t("points")}
            </div>
            <span className="text-sm font-semibold text-yes">
              {profile?.points != null ? profile.points.toLocaleString() : "..."}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Calendar className="h-4 w-4" />
              {t("memberSince")}
            </div>
            <span className="text-sm font-medium text-foreground">
              {memberSince}
            </span>
          </div>
        </div>
      </div>

      {/* Edit name form */}
      <div className="rounded-xl border border-border bg-surface p-6 mb-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t("displayName")}
        </h2>

        <form onSubmit={handleNameSubmit} className="space-y-4">
          {nameSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-yes/10 px-4 py-2.5 text-sm text-yes">
              <CheckCircle className="h-4 w-4" />
              {nameSuccess}
            </div>
          )}
          {nameError && (
            <div className="rounded-lg bg-no/10 px-4 py-2.5 text-sm text-no">
              {nameError}
            </div>
          )}

          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm text-muted">
              {t("displayName")}
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
                className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={nameMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {nameMutation.isPending ? "..." : t("save")}
          </button>
        </form>
      </div>

      {/* Change password form */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t("changePassword")}
        </h2>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {passwordSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-yes/10 px-4 py-2.5 text-sm text-yes">
              <CheckCircle className="h-4 w-4" />
              {passwordSuccess}
            </div>
          )}
          {passwordError && (
            <div className="rounded-lg bg-no/10 px-4 py-2.5 text-sm text-no">
              {passwordError}
            </div>
          )}

          <div>
            <label htmlFor="currentPassword" className="mb-1.5 block text-sm text-muted">
              {t("currentPassword")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-1.5 block text-sm text-muted">
              {t("newPassword")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-sm text-muted">
              {t("confirmNewPassword")}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted outline-none focus:border-primary"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            <Lock className="h-4 w-4" />
            {passwordMutation.isPending ? "..." : t("changePassword")}
          </button>
        </form>
      </div>
    </div>
  );
}
