import numeral from "numeral";
import { format, formatDistanceToNow } from "date-fns";

export function formatVolume(value: number): string {
  if (value >= 1_000_000_000) return numeral(value).format("$0.0a").toUpperCase();
  if (value >= 1_000_000) return numeral(value).format("$0.0a").toUpperCase();
  if (value >= 1_000) return numeral(value).format("$0.0a").toUpperCase();
  return numeral(value).format("$0,0");
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function formatPriceChange(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}${(value * 100).toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  return format(new Date(dateStr), "MMM d, yyyy");
}

export function formatTimeAgo(dateStr: string): string {
  return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
}

export function formatNumber(value: number): string {
  return numeral(value).format("0,0");
}

export function formatUSD(value: number): string {
  return numeral(value).format("$0,0.00");
}
