"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Search, ChevronLeft, ChevronRight, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserRow {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  points: number;
  createdAt: string;
  _count: {
    bets: number;
    events: number;
  };
}

export default function AdminUsersPage() {
  const t = useTranslations("admin");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const limit = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
      });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotal(data.total);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [offset, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    setOffset(0);
  }, [search]);

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm(t("confirmAction"))) return;

    setUpdating(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch {
      // silent
    } finally {
      setUpdating(null);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t("userManagement")}
      </h1>

      {/* Search bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            className="w-full rounded-lg border border-border bg-surface pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <span className="text-sm text-muted">
          {total} {t("users").toLowerCase()}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-medium text-muted">
                {t("name")}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted">
                {t("email")}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted">
                {t("role")}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted text-right">
                {t("points")}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted text-right">
                {t("bets")}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted text-right">
                {t("events")}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted">
                {t("joined")}
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-border">
                  {Array.from({ length: 8 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 w-20 animate-pulse rounded bg-border" />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  {t("noResults")}
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border transition-colors hover:bg-surface-hover"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {user.name || t("anonymous")}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {user.email || "-"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        user.role === "admin"
                          ? "bg-primary/10 text-primary"
                          : "bg-border text-muted"
                      )}
                    >
                      {user.role === "admin" ? (
                        <Shield className="h-3 w-3" />
                      ) : (
                        <User className="h-3 w-3" />
                      )}
                      {user.role === "admin" ? t("admin") : t("user")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {user.points.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-muted">
                    {user._count.bets}
                  </td>
                  <td className="px-4 py-3 text-right text-muted">
                    {user._count.events}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleRoleToggle(user.id, user.role)}
                      disabled={updating === user.id}
                      className={cn(
                        "rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                        user.role === "admin"
                          ? "border border-no/30 text-no hover:bg-no/10"
                          : "border border-primary/30 text-primary hover:bg-primary/10"
                      )}
                    >
                      {updating === user.id
                        ? "..."
                        : t("changeRole")}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted">
            {t("page")} {currentPage} {t("of")} {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition-colors hover:text-foreground disabled:opacity-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
