"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { formatTimeAgo } from "@/lib/utils/format";
import { MessageCircle, Send } from "lucide-react";
import { useComments, usePostComment } from "@/lib/hooks/use-comments";

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
  const tc = useTranslations("common");
  const { data: session } = useSession();
  const { data: comments = [], isLoading: loading } = useComments(eventId);
  const postCommentMutation = usePostComment(eventId);
  const [content, setContent] = useState("");

  const submitting = postCommentMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed || submitting) return;

    setContent("");
    postCommentMutation.mutate(trimmed, {
      onError: () => {
        setContent(trimmed);
      },
    });
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
            const displayName = comment.user.name || tc("anonymous");
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
