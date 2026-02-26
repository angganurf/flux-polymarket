"use client";

import { use, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMarketDetail, usePriceHistory } from "@/lib/hooks/use-market-detail";
import { CHART_INTERVALS } from "@/lib/utils/constants";
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
} from "lightweight-charts";

// ---------------------------------------------------------------------------
// Embed theme CSS variable overrides
// ---------------------------------------------------------------------------
const THEMES = {
  dark: {
    "--background": "#0b0e11",
    "--foreground": "#e5e7eb",
    "--surface": "#141820",
    "--border": "#1f2937",
    "--muted": "#6b7280",
    "--accent-yes": "#22c55e",
    "--accent-no": "#ef4444",
    "--accent-primary": "#6366f1",
  },
  light: {
    "--background": "#ffffff",
    "--foreground": "#111827",
    "--surface": "#f9fafb",
    "--border": "#e5e7eb",
    "--muted": "#6b7280",
    "--accent-yes": "#16a34a",
    "--accent-no": "#dc2626",
    "--accent-primary": "#4f46e5",
  },
} as const;

// ---------------------------------------------------------------------------
// Mini chart component (self-contained for embed)
// ---------------------------------------------------------------------------
function MiniChart({
  tokenId,
  height,
  theme,
}: {
  tokenId: string;
  height: number;
  theme: "dark" | "light";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);

  const interval = CHART_INTERVALS[4]; // "max" / ALL
  const { data, isLoading } = usePriceHistory(
    tokenId,
    interval.id,
    interval.fidelity
  );

  const textColor = theme === "dark" ? "#6b7280" : "#9ca3af";
  const gridColor =
    theme === "dark" ? "#1f293722" : "#e5e7eb44";

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor,
        fontSize: 10,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
      },
      crosshair: {
        horzLine: { color: "#6366f140", style: 3 },
        vertLine: { color: "#6366f140", style: 3 },
      },
      handleScroll: { vertTouchDrag: false },
      width: containerRef.current.clientWidth,
      height,
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#6366f1",
      topColor: "#6366f140",
      bottomColor: "#6366f105",
      lineWidth: 2,
      priceFormat: {
        type: "custom",
        formatter: (price: number) => `${(price * 100).toFixed(1)}%`,
        minMove: 0.001,
      },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height, theme]);

  useEffect(() => {
    if (!seriesRef.current || !data?.history) return;
    const chartData: LineData<Time>[] = data.history.map((point) => ({
      time: point.t as Time,
      value: point.p,
    }));
    seriesRef.current.setData(chartData);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <div className="relative">
      {isLoading && (
        <div
          className="absolute inset-0 flex items-center justify-center z-10"
          style={{ background: "var(--surface)", opacity: 0.8 }}
        >
          <div
            className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
            style={{ borderColor: "var(--accent-primary)", borderTopColor: "transparent" }}
          />
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------
function EmbedSkeleton() {
  return (
    <div className="animate-pulse p-4" style={{ background: "var(--surface)" }}>
      <div className="h-5 w-3/4 rounded" style={{ background: "var(--border)" }} />
      <div className="mt-3 flex gap-4">
        <div className="h-8 w-20 rounded" style={{ background: "var(--border)" }} />
        <div className="h-8 w-20 rounded" style={{ background: "var(--border)" }} />
      </div>
      <div className="mt-3 h-3 w-full rounded-full" style={{ background: "var(--border)" }} />
      <div className="mt-4 h-40 rounded" style={{ background: "var(--border)" }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main embed page
// ---------------------------------------------------------------------------
export default function EmbedMarketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const searchParams = useSearchParams();

  const theme = (searchParams.get("theme") === "light" ? "light" : "dark") as
    | "dark"
    | "light";
  const totalHeight = Number(searchParams.get("height")) || 400;

  const { data: market, isLoading, error } = useMarketDetail(slug);
  const tokenId = market?.clobTokenIds[0];

  // Apply theme CSS variables to body
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const vars = THEMES[theme];
    Object.entries(vars).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydration gate for theme CSS vars
    setMounted(true);
  }, [theme]);

  if (!mounted) return null;

  // Compute chart height: total minus header (~120px) minus footer (~28px) minus padding
  const chartHeight = Math.max(totalHeight - 160, 100);

  const baseUrl = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || "https://predictflow.app");
  const locale = searchParams.get("locale") || "en";
  const fullMarketUrl = `${baseUrl}/${locale}/markets/${slug}`;

  if (isLoading) {
    return (
      <div
        style={{
          height: totalHeight,
          overflow: "hidden",
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <EmbedSkeleton />
      </div>
    );
  }

  if (error || !market) {
    return (
      <div
        style={{
          height: totalHeight,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          border: "1px solid var(--border)",
          background: "var(--surface)",
          color: "var(--muted)",
          fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
          fontSize: 14,
        }}
      >
        Market not found
      </div>
    );
  }

  const yesPrice = market.yesPrice;
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = 100 - yesPercent;

  return (
    <div
      style={{
        height: totalHeight,
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid var(--border)",
        background: "var(--surface)",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
        color: "var(--foreground)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "12px 16px 0 16px", flexShrink: 0 }}>
        {/* Market question */}
        <a
          href={fullMarketUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--foreground)",
            textDecoration: "none",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            lineHeight: "1.4",
          }}
        >
          {market.question}
        </a>

        {/* YES / NO probabilities */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginTop: 8 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--accent-yes)",
              }}
            >
              {yesPercent}%
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>Yes</span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: "var(--accent-no)",
              }}
            >
              {noPercent}%
            </span>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>No</span>
          </div>
        </div>

        {/* Probability bar */}
        <div
          style={{
            display: "flex",
            height: 6,
            borderRadius: 3,
            overflow: "hidden",
            marginTop: 8,
            background: "var(--background)",
          }}
        >
          <div
            style={{
              width: `${yesPercent}%`,
              background: "var(--accent-yes)",
              transition: "width 0.7s",
            }}
          />
          <div
            style={{
              width: `${noPercent}%`,
              background: "var(--accent-no)",
              transition: "width 0.7s",
            }}
          />
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minHeight: 0, padding: "8px 8px 0 8px" }}>
        {tokenId && (
          <MiniChart tokenId={tokenId} height={chartHeight} theme={theme} />
        )}
      </div>

      {/* Footer - Powered by */}
      <div
        style={{
          padding: "4px 16px 8px 16px",
          flexShrink: 0,
          textAlign: "right",
        }}
      >
        <a
          href={baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontSize: 11,
            color: "var(--muted)",
            textDecoration: "none",
          }}
        >
          Powered by{" "}
          <span style={{ color: "var(--accent-primary)", fontWeight: 600 }}>
            PredictFlow
          </span>
        </a>
      </div>
    </div>
  );
}
