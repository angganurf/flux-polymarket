"use client";

import { useState } from "react";
import { Share2, Link, Check } from "lucide-react";
import { useTranslations } from "next-intl";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const t = useTranslations("market");
  const [copied, setCopied] = useState(false);

  const handleTwitterShare = () => {
    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
    window.open(tweetUrl, "_blank", "noopener,noreferrer,width=600,height=400");
  };

  const handleKakaoShare = () => {
    const kakaoUrl = `https://story.kakao.com/share?url=${encodeURIComponent(url)}`;
    window.open(kakaoUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted mr-1">
        <Share2 className="inline h-3.5 w-3.5" /> {t("share")}
      </span>

      {/* Twitter / X */}
      <button
        onClick={handleTwitterShare}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary/50 hover:text-foreground"
        title="Share on X (Twitter)"
        aria-label="Share on X (Twitter)"
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
        <span className="hidden sm:inline">X</span>
      </button>

      {/* Kakao */}
      <button
        onClick={handleKakaoShare}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-yellow-500/50 hover:text-foreground"
        title="Share on KakaoTalk"
        aria-label="Share on KakaoTalk"
      >
        <svg
          className="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.724 1.8 5.114 4.508 6.457-.147.53-.533 1.922-.61 2.221-.098.381.14.376.294.274.121-.08 1.93-1.311 2.711-1.84A13.4 13.4 0 0012 18.383c5.523 0 10-3.463 10-7.691S17.523 3 12 3z" />
        </svg>
        <span className="hidden sm:inline">Kakao</span>
      </button>

      {/* Copy Link */}
      <button
        onClick={handleCopyLink}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-primary/50 hover:text-foreground"
        title={t("copyLink")}
        aria-label={copied ? t("copied") : t("copyLink")}
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-yes" />
            <span className="text-yes">{t("copied")}</span>
          </>
        ) : (
          <>
            <Link className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("copyLink")}</span>
          </>
        )}
      </button>
    </div>
  );
}
