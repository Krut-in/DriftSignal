import { cn } from "@/lib/utils";

interface RiskBadgeProps {
  level: 'high' | 'medium' | 'low';
}

export function RiskBadge({ level }: RiskBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        level === 'high' && "bg-destructive/10 text-destructive",
        level === 'medium' && "bg-warning/10 text-warning",
        level === 'low' && "bg-success/10 text-success"
      )}
    >
      {level.charAt(0).toUpperCase() + level.slice(1)}
    </span>
  );
}
