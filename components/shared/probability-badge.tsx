import { cn } from "@/lib/utils";

interface ProbabilityBadgeProps {
  yesPrice: number;
  noPrice: number;
  size?: "sm" | "md" | "lg";
}

export function ProbabilityBadge({ yesPrice, noPrice, size = "md" }: ProbabilityBadgeProps) {
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = Math.round(noPrice * 100);

  const sizeClasses = {
    sm: "text-xs gap-1.5",
    md: "text-sm gap-2",
    lg: "text-base gap-2.5",
  };

  return (
    <div className={cn("flex items-center font-medium", sizeClasses[size])}>
      <span className="text-yes">{yesPercent}% Yes</span>
      <span className="text-muted">/</span>
      <span className="text-no">{noPercent}% No</span>
    </div>
  );
}
