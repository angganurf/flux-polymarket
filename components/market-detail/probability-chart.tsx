"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  AreaSeries,
  type IChartApi,
  type ISeriesApi,
  type LineData,
  type Time,
} from "lightweight-charts";
import { usePriceHistory } from "@/lib/hooks/use-market-detail";
import { CHART_INTERVALS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";

interface ProbabilityChartProps {
  tokenId: string;
}

export function ProbabilityChart({ tokenId }: ProbabilityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | null>(null);
  const [interval, setInterval] = useState("max");

  const selectedInterval =
    CHART_INTERVALS.find((i) => i.id === interval) ?? CHART_INTERVALS[4];
  const { data, isLoading } = usePriceHistory(
    tokenId,
    selectedInterval.id,
    selectedInterval.fidelity
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#6b7280",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1f293722" },
        horzLines: { color: "#1f293722" },
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
      height: 320,
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
  }, []);

  // Update chart data when price history changes
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
    <div className="rounded-xl border border-border bg-surface p-4">
      {/* Interval selector */}
      <div className="mb-4 flex gap-1">
        {CHART_INTERVALS.map((i) => (
          <button
            key={i.id}
            onClick={() => setInterval(i.id)}
            className={cn(
              "rounded-lg px-3 py-1 text-xs font-medium transition-colors",
              interval === i.id
                ? "bg-primary text-white"
                : "text-muted hover:text-foreground"
            )}
          >
            {i.label}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/80 z-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        <div ref={containerRef} />
      </div>
    </div>
  );
}
