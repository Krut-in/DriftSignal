import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CustomerHealthHistory } from "@/hooks/useCustomerHealthHistory";

interface CustomerHealthTimelineProps {
  customers: CustomerHealthHistory[];
  isLoading?: boolean;
  error?: Error | null;
}

function Sparkline({ data, className }: { data: number[]; className?: string }) {
  if (data.length === 0) return null;
  
  const max = Math.max(...data, 100);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const height = 32;
  const width = 120;
  const padding = 2;
  
  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((value - min) / range) * (height - 2 * padding);
    return `${x},${y}`;
  }).join(' ');
  
  // Determine color based on trend (last vs first)
  const trend = data[data.length - 1] - data[0];
  const strokeColor = trend > 10 
    ? 'hsl(var(--destructive))' // risk increasing = bad
    : trend < -10 
      ? 'hsl(var(--success, 142 76% 36%))' // risk decreasing = good
      : 'hsl(var(--muted-foreground))';
  
  return (
    <svg 
      width={width} 
      height={height} 
      className={cn("overflow-visible", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current point indicator */}
      <circle
        cx={padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding)}
        cy={height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding)}
        r="3"
        fill={strokeColor}
      />
    </svg>
  );
}

function TrendIndicator({ trend }: { trend: 'improving' | 'stable' | 'declining' }) {
  const config = {
    improving: {
      icon: TrendingDown,
      label: 'Improving',
      className: 'text-green-600 bg-green-50',
    },
    stable: {
      icon: Minus,
      label: 'Stable',
      className: 'text-muted-foreground bg-muted',
    },
    declining: {
      icon: TrendingUp,
      label: 'Declining',
      className: 'text-destructive bg-destructive/10',
    },
  };
  
  const { icon: Icon, label, className } = config[trend];
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
      className
    )}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function RiskBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const config = {
    high: 'bg-destructive/10 text-destructive border-destructive/20',
    medium: 'bg-warning/10 text-warning border-warning/20',
    low: 'bg-muted text-muted-foreground border-border',
  };
  
  return (
    <span className={cn(
      "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
      config[level]
    )}>
      {level}
    </span>
  );
}

export function CustomerHealthTimeline({ customers, isLoading, error }: CustomerHealthTimelineProps) {
  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Customer Health Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-destructive/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <Activity className="h-5 w-5" />
            Health Timeline Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!customers || customers.length === 0) {
    return (
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Customer Health Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No customer health data available for this period.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show top 8 customers sorted by risk
  const topCustomers = customers.slice(0, 8);
  
  // Get month labels for header
  const monthLabels = topCustomers[0]?.history.map(h => {
    const date = new Date(h.year, h.month - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  }) || [];

  return (
    <Card className="bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5" />
            Customer Health Timeline
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            6-month risk trend
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Month labels header */}
        <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="w-28 shrink-0" />
          <div className="flex w-[120px] justify-between px-1">
            {monthLabels.map((label, i) => (
              <span key={i} className={i === monthLabels.length - 1 ? 'font-medium text-foreground' : ''}>
                {label}
              </span>
            ))}
          </div>
          <div className="w-16 text-center">Risk</div>
          <div className="w-20 text-center">Trend</div>
        </div>
        
        <div className="space-y-2">
          {topCustomers.map((customer) => (
            <div 
              key={customer.customerId} 
              className="flex items-center gap-4 rounded-lg bg-secondary/30 px-3 py-2 transition-colors hover:bg-secondary/50"
            >
              {/* Customer name */}
              <div className="w-28 shrink-0">
                <p className="truncate text-sm font-medium text-foreground" title={customer.customerName}>
                  {customer.customerName}
                </p>
              </div>
              
              {/* Sparkline */}
              <div className="flex items-center justify-center">
                <Sparkline data={customer.history.map(h => h.riskScore)} />
              </div>
              
              {/* Current risk */}
              <div className="w-16 text-center">
                <RiskBadge level={customer.currentRisk} />
              </div>
              
              {/* Trend */}
              <div className="w-20 text-center">
                <TrendIndicator trend={customer.trend} />
              </div>
            </div>
          ))}
        </div>
        
        {customers.length > 8 && (
          <p className="mt-3 text-center text-xs text-muted-foreground">
            + {customers.length - 8} more customers
          </p>
        )}
      </CardContent>
    </Card>
  );
}
