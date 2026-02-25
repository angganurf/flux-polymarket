"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface EmbedCodeGeneratorProps {
  slug: string;
}

export function EmbedCodeGenerator({ slug }: EmbedCodeGeneratorProps) {
  const t = useTranslations("market");
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [height, setHeight] = useState(400);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3100";

  const embedUrl = `${baseUrl}/embed/market/${slug}?theme=${theme}&height=${height}`;
  const iframeCode = `<iframe src="${embedUrl}" width="100%" height="${height}" frameborder="0" style="border-radius:12px;overflow:hidden;"></iframe>`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = iframeCode;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [iframeCode]);

  return (
    <div className="rounded-xl border border-border bg-surface">
      {/* Toggle header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-surface-hover"
      >
        <div className="flex items-center gap-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-primary"
          >
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
          </svg>
          <span className="text-sm font-semibold text-foreground">
            {t("embedTitle")}
          </span>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn(
            "text-muted transition-transform",
            isOpen && "rotate-180"
          )}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="border-t border-border px-4 pb-4 pt-3">
          {/* Options */}
          <div className="mb-3 flex items-center gap-4">
            {/* Theme selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted">{t("embedTheme")}</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as "dark" | "light")}
                className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
              >
                <option value="dark">{t("embedDark")}</option>
                <option value="light">{t("embedLight")}</option>
              </select>
            </div>

            {/* Height input */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted">{t("embedHeight")}</label>
              <input
                type="number"
                value={height}
                onChange={(e) =>
                  setHeight(
                    Math.max(200, Math.min(800, Number(e.target.value) || 400))
                  )
                }
                min={200}
                max={800}
                step={50}
                className="w-20 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
              />
              <span className="text-xs text-muted">px</span>
            </div>
          </div>

          {/* Code block */}
          <div className="relative">
            <pre className="overflow-x-auto rounded-lg border border-border bg-background p-3 text-xs text-muted font-mono leading-relaxed">
              {iframeCode}
            </pre>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              aria-label={copied ? t("embedCopied") : t("embedCopy")}
              className={cn(
                "absolute right-2 top-2 rounded-md px-2.5 py-1 text-xs font-medium transition-all",
                copied
                  ? "bg-yes/20 text-yes"
                  : "bg-primary/10 text-primary hover:bg-primary/20"
              )}
            >
              <span aria-live="assertive" aria-atomic="true">
                {copied ? t("embedCopied") : t("embedCopy")}
              </span>
            </button>
          </div>

          {/* Preview link */}
          <a
            href={`/embed/market/${slug}?theme=${theme}&height=${height}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-xs text-primary hover:underline"
          >
            {t("embedPreview")} &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
