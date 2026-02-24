"use client";

import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface ConnectionStatusProps {
  status: "connected" | "disconnected" | "connecting";
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const t = useTranslations("common");

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <div
        className={cn(
          "h-2 w-2 rounded-full",
          status === "connected" && "bg-yes animate-pulse",
          status === "connecting" && "bg-yellow-500 animate-pulse",
          status === "disconnected" && "bg-no"
        )}
      />
      <span className="text-muted">{t(status)}</span>
    </div>
  );
}
