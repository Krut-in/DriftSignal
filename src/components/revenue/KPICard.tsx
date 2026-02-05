import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function KPICard({ title, value, subtitle, icon: Icon, trend, trendValue }: KPICardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            {(subtitle || trendValue) && (
              <div className="flex items-center gap-2 pt-1">
                {trendValue && (
                  <span className={cn(
                    "text-sm font-medium",
                    trend === 'up' && "text-success",
                    trend === 'down' && "text-destructive",
                    trend === 'neutral' && "text-muted-foreground"
                  )}>
                    {trend === 'up' && '↑'}
                    {trend === 'down' && '↓'}
                    {trendValue}
                  </span>
                )}
                {subtitle && (
                  <span className="text-sm text-muted-foreground">{subtitle}</span>
                )}
              </div>
            )}
          </div>
          <div className="rounded-lg bg-accent-copper/15 p-2.5">
            <Icon className="h-5 w-5 text-accent-copper" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
