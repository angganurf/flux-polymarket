import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PriceChangeProps {
  value: number;
  className?: string;
}

export function PriceChange({ value, className }: PriceChangeProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const displayValue = `${isPositive ? "+" : ""}${(value * 100).toFixed(1)}%`;

  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-sm font-medium",
        isPositive && "text-yes",
        isNegative && "text-no",
        !isPositive && !isNegative && "text-muted",
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {displayValue}
    </span>
  );
}
