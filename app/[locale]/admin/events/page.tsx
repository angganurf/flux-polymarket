"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  XCircle,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  result: string | null;
  endDate: string;
  createdAt: string;
  totalVolume: number;
  creator: { id: string; name: string | null };
  _count: { bets: number; comments: number };
}

const STATUS_FILTERS = ["all", "active", "resolved", "cancelled"] as const;

export default function AdminEventsPage() {
  const t = useTranslations("admin");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const limit = 20;

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        status: statusFilter,
      });

      const res = await fetch(`/api/admin/events?${params}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events);
        setTotal(data.total);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [offset, statusFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    setOffset(0);
  }, [statusFilter]);

  const handleResolve = async (eventId: string, result: "yes" | "no") => {
    if (!confirm(t("confirmAction"))) return;

    setActing(eventId);
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action: "resolve", result }),
      });
      if (res.ok) {
        await fetchEvents();
      }
    } catch {
      // silent
    } finally {
      setActing(null);
    }
  };

  const handleCancel = async (eventId: string) => {
    if (!confirm(t("confirmAction"))) return;

    setActing(eventId);
    try {
      const res = await fetch("/api/admin/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, action: "cancel" }),
      });
      if (res.ok) {
        await fetchEvents();
      }
    } catch {
      // silent
    } finally {
      setActing(null);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        {t("eventManagement")}
      </h1>

      {/* Status filter tabs */}
      <div className="mb-6 flex items-center gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              statusFilter === status
                ? "bg-primary/10 text-primary"
                : "text-muted hover:text-foreground hover:bg-surface-hover"
            )}
          >
            {status === "all"
              ? "All"
              : status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
        <span className="ml-auto text-sm text-muted">
          {total} {t("events").toLowerCase()}
        </span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-3 text-xs font-medium text-muted">
                Title
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted">
                Creator
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted text-right">
                Bets
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted text-right">
                Volume
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted">
                End Date
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted">
                Created
              </th>
              <th className="px-4 py-3 text-xs font-medium text-muted">
                Actions
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
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-muted">
                  {t("noResults")}
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="border-b border-border transition-colors hover:bg-surface-hover"
                >
                  <td className="max-w-[240px] px-4 py-3">
                    <p className="truncate font-medium text-foreground">
                      {event.title}
                    </p>
                    <p className="text-xs text-muted">{event.category}</p>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {event.creator.name || "Anonymous"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        event.status === "active" &&
                          "bg-yes/10 text-yes",
                        event.status === "resolved" &&
                          "bg-primary/10 text-primary",
                        event.status === "cancelled" &&
                          "bg-no/10 text-no"
                      )}
                    >
                      {event.status}
                      {event.result && ` (${event.result.toUpperCase()})`}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted">
                    {event._count.bets}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-foreground">
                    {event.totalVolume.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(event.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {new Date(event.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {event.status === "active" ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleResolve(event.id, "yes")}
                          disabled={acting === event.id}
                          title={`${t("forceResolve")} YES`}
                          className="rounded-lg p-1.5 text-yes transition-colors hover:bg-yes/10 disabled:opacity-50"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleResolve(event.id, "no")}
                          disabled={acting === event.id}
                          title={`${t("forceResolve")} NO`}
                          className="rounded-lg p-1.5 text-no transition-colors hover:bg-no/10 disabled:opacity-50"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleCancel(event.id)}
                          disabled={acting === event.id}
                          title={t("cancel")}
                          className="rounded-lg p-1.5 text-muted transition-colors hover:bg-surface-hover hover:text-foreground disabled:opacity-50"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted">-</span>
                    )}
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
            Page {currentPage} of {totalPages}
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
