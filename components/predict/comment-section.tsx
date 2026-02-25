"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/utils/format";
import { MessageCircle, Send } from "lucide-react";

interface CommentUser {
  id: string;
  name: string | null;
  image: string | null;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: CommentUser;
}

interface CommentSectionProps {
  eventId: string;
}

const MAX_CHARS = 1000;

// Generate a consistent color from a string
function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-emerald-500",
    "bg-violet-500",
    "bg-amber-500",
    "bg-rose-500",
    "bg-cyan-500",
    "bg-pink-500",
    "bg-teal-500",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function CommentSection({ eventId }: CommentSectionProps) {
  const t = useTranslations("predict.comments");
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/comments`);
      if (res.ok) {
        setComments(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setSubmitting(true);

    // Optimistic update
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      content: trimmed,
      createdAt: new Date().toISOString(),
      user: {
        id: session?.user?.id || "",
        name: session?.user?.name || null,
        image: session?.user?.image || null,
      },
    };

    setComments((prev) => [optimisticComment, ...prev]);
    setContent("");

    try {
      const res = await fetch(`/api/events/${eventId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (res.ok) {
        // Refetch to get server-confirmed data
        fetchComments();
      } else {
        // Revert optimistic update on failure
        setComments((prev) =>
          prev.filter((c) => c.id !== optimisticComment.id)
        );
        setContent(trimmed);
      }
    } catch {
      // Revert optimistic update
      setComments((prev) =>
        prev.filter((c) => c.id !== optimisticComment.id)
      );
      setContent(trimmed);
    } finally {
      setSubmitting(false);
    }
  };

  const remaining = MAX_CHARS - content.length;

  return (
    <div className="mt-6">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-4">
        <MessageCircle className="h-4 w-4" />
        {t("title")}
        {comments.length > 0 && (
          <span className="text-xs font-normal text-muted">
            ({comments.length})
          </span>
        )}
      </h3>

      {/* Comment form */}
      {session ? (
        <form onSubmit={handleSubmit} className="mb-5">
          <div className="rounded-xl border border-border bg-surface p-3">
            <textarea
              value={content}
              onChange={(e) => {
                if (e.target.value.length <= MAX_CHARS) {
                  setContent(e.target.value);
                }
              }}
              placeholder={t("placeholder")}
              rows={3}
              className="w-full resize-none bg-transparent text-sm text-foreground placeholder-muted outline-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span
                className={cn(
                  "text-xs",
                  remaining < 100 ? "text-no" : "text-muted"
                )}
              >
                {remaining} {t("charLimit")}
              </span>
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                <Send className="h-3 w-3" />
                {t("submit")}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-5 rounded-xl border border-border bg-surface px-4 py-3 text-center text-sm text-muted">
          {t("loginToComment")}
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-surface p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-full bg-border" />
                <div className="h-3 w-24 rounded bg-border" />
              </div>
              <div className="h-3 w-3/4 rounded bg-border" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface px-4 py-8 text-center text-sm text-muted">
          {t("empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const displayName = comment.user.name || "Anonymous";
            const initial = displayName.charAt(0).toUpperCase();
            const avatarColor = getAvatarColor(displayName);

            return (
              <div
                key={comment.id}
                className="rounded-xl border border-border bg-surface p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white",
                      avatarColor
                    )}
                  >
                    {initial}
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {displayName}
                  </span>
                  <span className="text-xs text-muted">
                    {formatTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
