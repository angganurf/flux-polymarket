"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState, useCallback } from "react";
import {
  Server,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Trash2,
  RefreshCw,
  HardDrive,
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────

interface SystemData {
  system: {
    nodeVersion: string;
    nextVersion: string;
    nodeEnv: string;
    databaseConfigured: boolean;
  };
  cache: {
    size: number;
    maxSize: number;
    ttlPresets: {
      eventsList: number;
      eventDetail: number;
      search: number;
      leaderboard: number;
      orderBook: number;
      pricesHistory: number;
    };
  };
  env: {
    auth: { authSecret: boolean; nextauthUrl: boolean };
    oauth: {
      googleClientId: boolean;
      googleClientSecret: boolean;
      kakaoClientId: boolean;
      kakaoClientSecret: boolean;
    };
    email: { resendApiKey: boolean };
    bots: { telegramBotToken: boolean; discordPublicKey: boolean };
    ai: { openaiApiKey: boolean };
  };
}

type ToastState = { message: string; type: "success" | "error" } | null;

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  if (ms >= 60_000) return `${ms / 60_000}m`;
  return `${ms / 1_000}s`;
}

// ─── Sub-components ────────────────────────────────────────────────────────

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-400">
        <CheckCircle2 className="h-3 w-3" />
        {label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
      <XCircle className="h-3 w-3" />
      {label}
    </span>
  );
}

function EnvRow({
  label,
  isSet,
  required,
  configuredLabel,
  missingLabel,
  requiredLabel,
  optionalLabel,
}: {
  label: string;
  isSet: boolean;
  required: boolean;
  configuredLabel: string;
  missingLabel: string;
  requiredLabel: string;
  optionalLabel: string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-muted-foreground">
          {label}
        </code>
        <span
          className={`text-xs ${required ? "text-red-400/70" : "text-yellow-400/70"}`}
        >
          {required ? requiredLabel : optionalLabel}
        </span>
      </div>
      {isSet ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {configuredLabel}
        </span>
      ) : required ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-400">
          <XCircle className="h-3.5 w-3.5" />
          {missingLabel}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-yellow-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          {missingLabel}
        </span>
      )}
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ElementType;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-4 w-4 text-primary" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const t = useTranslations("admin");

  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/admin/system");
      if (!res.ok) throw new Error("Failed");
      const json = await res.json() as SystemData;
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      const res = await fetch("/api/admin/system", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      showToast(t("cacheCleared"), "success");
      // Refresh data to show new cache size
      await fetchData();
    } catch {
      showToast(t("cacheClearError"), "error");
    } finally {
      setClearing(false);
    }
  };

  // ── Skeleton ──
  if (loading) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">{t("settings")}</h1>
        <div className="space-y-6">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-xl border border-border bg-surface"
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">{t("settings")}</h1>
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <XCircle className="mx-auto mb-4 h-10 w-10 text-red-400" />
          <p className="text-sm text-muted-foreground">{t("settingsLoadError")}</p>
          <button
            onClick={() => void fetchData()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:bg-surface transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { system, cache, env } = data;
  const cachePercent = Math.round((cache.size / cache.maxSize) * 100);

  const ttlRows = [
    { key: "cacheTtlEventsList", value: cache.ttlPresets.eventsList },
    { key: "cacheTtlEventDetail", value: cache.ttlPresets.eventDetail },
    { key: "cacheTtlSearch", value: cache.ttlPresets.search },
    { key: "cacheTtlLeaderboard", value: cache.ttlPresets.leaderboard },
    { key: "cacheTtlOrderBook", value: cache.ttlPresets.orderBook },
    { key: "cacheTtlPricesHistory", value: cache.ttlPresets.pricesHistory },
  ] as const;

  const oauthEnabled =
    env.oauth.googleClientId &&
    env.oauth.googleClientSecret &&
    env.oauth.kakaoClientId &&
    env.oauth.kakaoClientSecret;
  const emailEnabled = env.email.resendApiKey;
  const botsEnabled = env.bots.telegramBotToken || env.bots.discordPublicKey;

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div
          className={`fixed right-6 top-20 z-50 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg transition-all ${
            toast.type === "success"
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      <h1 className="mb-6 text-2xl font-bold text-foreground">{t("settings")}</h1>

      <div className="space-y-6">
        {/* ── Cache Management ── */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <SectionHeader icon={HardDrive} title={t("cacheManagement")} />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Left: status + clear */}
            <div className="space-y-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("cacheStatus")}
              </p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t("cacheEntries")}</span>
                  <span className="font-semibold text-foreground">
                    {cache.size.toLocaleString()} / {cache.maxSize.toLocaleString()}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                  <div
                    className={`h-full rounded-full transition-all ${
                      cachePercent > 80
                        ? "bg-red-500"
                        : cachePercent > 50
                          ? "bg-yellow-500"
                          : "bg-primary"
                    }`}
                    style={{ width: `${cachePercent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {cachePercent}% {t("cacheCapacity")}
                </p>
              </div>

              <button
                onClick={() => void handleClearCache()}
                disabled={clearing || cache.size === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-red-500/50 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {clearing ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {clearing ? t("cacheClearing") : t("cacheClear")}
              </button>
            </div>

            {/* Right: TTL presets */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("cacheTtlPresets")}
              </p>
              <div className="divide-y divide-border">
                {ttlRows.map(({ key, value }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between py-1.5"
                  >
                    <span className="text-sm text-muted-foreground">
                      {t(key)}
                    </span>
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-mono font-medium text-primary">
                      {formatMs(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── System Info ── */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <SectionHeader icon={Server} title={t("systemInfo")} />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {/* Left: versions + env */}
            <div className="space-y-3">
              {[
                { label: t("systemNode"), value: system.nodeVersion },
                {
                  label: t("systemNext"),
                  value: system.nextVersion.replace(/[\^~>=]/, ""),
                },
                { label: t("systemEnv"), value: system.nodeEnv },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <code className="rounded bg-border/50 px-2 py-0.5 text-xs text-foreground">
                    {value}
                  </code>
                </div>
              ))}

              {/* Database */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {t("systemDatabase")}
                </span>
                <StatusBadge
                  ok={system.databaseConfigured}
                  label={
                    system.databaseConfigured
                      ? t("systemDatabaseConnected")
                      : t("systemDatabaseMissing")
                  }
                />
              </div>
            </div>

            {/* Right: feature flags */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("systemFeatures")}
              </p>
              {[
                { label: t("systemOAuth"), ok: oauthEnabled },
                { label: t("systemEmail"), ok: emailEnabled },
                { label: t("systemBots"), ok: botsEnabled },
                { label: t("systemAI"), ok: env.ai.openaiApiKey },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{label}</span>
                  <StatusBadge
                    ok={ok}
                    label={ok ? t("envConfigured") : t("envMissing")}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Environment Status ── */}
        <div className="rounded-xl border border-border bg-surface p-5">
          <SectionHeader icon={ShieldCheck} title={t("envStatus")} />

          <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
            {/* Auth */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("envCategoryAuth")}
              </p>
              <div className="divide-y divide-border">
                <EnvRow
                  label="AUTH_SECRET"
                  isSet={env.auth.authSecret}
                  required={true}
                  configuredLabel={t("envConfigured")}
                  missingLabel={t("envMissing")}
                  requiredLabel={t("envRequired")}
                  optionalLabel={t("envOptional")}
                />
                <EnvRow
                  label="NEXTAUTH_URL"
                  isSet={env.auth.nextauthUrl}
                  required={false}
                  configuredLabel={t("envConfigured")}
                  missingLabel={t("envMissing")}
                  requiredLabel={t("envRequired")}
                  optionalLabel={t("envOptional")}
                />
              </div>
            </div>

            {/* OAuth */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("envCategoryOAuth")}
              </p>
              <div className="divide-y divide-border">
                <EnvRow
                  label="GOOGLE_CLIENT_ID"
                  isSet={env.oauth.googleClientId}
                  required={false}
                  configuredLabel={t("envConfigured")}
                  missingLabel={t("envMissing")}
                  requiredLabel={t("envRequired")}
                  optionalLabel={t("envOptional")}
                />
                <EnvRow
                  label="GOOGLE_CLIENT_SECRET"
                  isSet={env.oauth.googleClientSecret}
                  required={false}
                  configuredLabel={t("envConfigured")}
                  missingLabel={t("envMissing")}
                  requiredLabel={t("envRequired")}
                  optionalLabel={t("envOptional")}
                />
                <EnvRow
                  label="KAKAO_CLIENT_ID"
                  isSet={env.oauth.kakaoClientId}
                  required={false}
                  configuredLabel={t("envConfigured")}
                  missingLabel={t("envMissing")}
                  requiredLabel={t("envRequired")}
                  optionalLabel={t("envOptional")}
                />
                <EnvRow
                  label="KAKAO_CLIENT_SECRET"
                  isSet={env.oauth.kakaoClientSecret}
                  required={false}
                  configuredLabel={t("envConfigured")}
                  missingLabel={t("envMissing")}
                  requiredLabel={t("envRequired")}
                  optionalLabel={t("envOptional")}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("envCategoryEmail")}
              </p>
              <div className="divide-y divide-border">
                <EnvRow
                  label="RESEND_API_KEY"
                  isSet={env.email.resendApiKey}
                  required={false}
                  configuredLabel={t("envConfigured")}
                  missingLabel={t("envMissing")}
                  requiredLabel={t("envRequired")}
                  optionalLabel={t("envOptional")}
                />
              </div>
            </div>

            {/* Bots */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("envCategoryBots")}
              </p>
              <div className="divide-y divide-border">
                <EnvRow
                  label="TELEGRAM_BOT_TOKEN"
                  isSet={env.bots.telegramBotToken}
                  required={false}
                  configuredLabel={t("envConfigured")}
                  missingLabel={t("envMissing")}
                  requiredLabel={t("envRequired")}
                  optionalLabel={t("envOptional")}
                />
                <EnvRow
                  label="DISCORD_PUBLIC_KEY"
                  isSet={env.bots.discordPublicKey}
                  required={false}
                  configuredLabel={t("envConfigured")}
                  missingLabel={t("envMissing")}
                  requiredLabel={t("envRequired")}
                  optionalLabel={t("envOptional")}
                />
              </div>
            </div>

            {/* AI */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("envCategoryAI")}
              </p>
              <div className="divide-y divide-border">
                <EnvRow
                  label="OPENAI_API_KEY"
                  isSet={env.ai.openaiApiKey}
                  required={false}
                  configuredLabel={t("envConfigured")}
                  missingLabel={t("envMissing")}
                  requiredLabel={t("envRequired")}
                  optionalLabel={t("envOptional")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
