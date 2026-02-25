"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Sparkles, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ParsedMarket } from "@/lib/api/types";

interface AIAnalysisProps {
  market: ParsedMarket;
}

function renderMarkdown(text: string) {
  // Split into lines for processing
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul
          key={`ul-${elements.length}`}
          className="my-2 ml-4 list-disc space-y-1"
        >
          {listItems.map((item, i) => (
            <li key={i} className="text-sm leading-relaxed text-muted">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Bullet point
    if (/^[\s]*[-*]\s+/.test(line)) {
      listItems.push(line.replace(/^[\s]*[-*]\s+/, ""));
      continue;
    }

    // Numbered list
    if (/^[\s]*\d+[.)]\s+/.test(line)) {
      listItems.push(line.replace(/^[\s]*\d+[.)]\s+/, ""));
      continue;
    }

    flushList();

    // Empty line
    if (line.trim() === "") {
      elements.push(<br key={`br-${i}`} />);
      continue;
    }

    // Heading (### or ##)
    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      elements.push(
        <p
          key={`h-${i}`}
          className="mt-3 mb-1 text-sm font-semibold text-foreground"
        >
          {renderInline(headingMatch[2])}
        </p>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-muted">
        {renderInline(line)}
      </p>
    );
  }

  flushList();
  return elements;
}

function renderInline(text: string): React.ReactNode[] {
  // Handle **bold** patterns
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <strong key={match.index} className="font-semibold text-foreground">
        {match[1]}
      </strong>
    );
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

export function AIAnalysis({ market }: AIAnalysisProps) {
  const t = useTranslations("market.aiAnalysis");
  const [isOpen, setIsOpen] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const analyze = useCallback(async () => {
    setLoading(true);
    setError(false);
    setAnalysis("");

    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: market.question,
          yesPrice: market.yesPrice,
          noPrice: market.noPrice,
          volume: market.volume,
          volume24h: market.volume24h,
          priceChange24h: market.priceChange24h,
          priceChange1w: market.priceChange1w,
          description: market.description,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch analysis");
      }

      // Handle non-streaming fallback (when no API key)
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        const data = await res.json();
        setAnalysis(data.analysis);
        setLoading(false);
        setHasGenerated(true);
        return;
      }

      // Handle streaming text response from Vercel AI SDK
      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        text += chunk;
        setAnalysis(text);
      }

      setHasGenerated(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [market]);

  const handleToggle = useCallback(() => {
    const willOpen = !isOpen;
    setIsOpen(willOpen);

    // Auto-trigger analysis on first open
    if (willOpen && !hasGenerated && !loading) {
      analyze();
    }
  }, [isOpen, hasGenerated, loading, analyze]);

  return (
    <div className="rounded-xl border border-border bg-surface">
      {/* Collapsible header */}
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-hover"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            {t("title")}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted" />
        )}
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {/* Loading state */}
          {loading && !analysis && (
            <div className="flex items-center gap-2 py-4">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                <span
                  className="h-2 w-2 animate-pulse rounded-full bg-primary"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="h-2 w-2 animate-pulse rounded-full bg-primary"
                  style={{ animationDelay: "0.4s" }}
                />
              </div>
              <span className="text-sm text-muted">{t("loading")}</span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="py-4">
              <p className="text-sm text-muted">{t("error")}</p>
              <button
                onClick={analyze}
                className="mt-2 flex items-center gap-1.5 text-sm text-primary hover:underline"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t("regenerate")}
              </button>
            </div>
          )}

          {/* Analysis content */}
          {analysis && (
            <div>
              <div
                className={cn(
                  "prose-sm",
                  loading && "opacity-80"
                )}
              >
                {renderMarkdown(analysis)}
              </div>

              {/* Regenerate button */}
              {!loading && hasGenerated && (
                <button
                  onClick={analyze}
                  className="mt-3 flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  {t("regenerate")}
                </button>
              )}
            </div>
          )}

          {/* Streaming indicator (while content is visible) */}
          {loading && analysis && (
            <div className="mt-2 flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="text-xs text-muted">{t("loading")}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
