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
  const height = 40;
  const width = 140;
  const padding = 4;
  
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
      className={cn("overflow-visible shrink-0", className)}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Current point indicator */}
      <circle
        cx={padding + ((data.length - 1) / (data.length - 1)) * (width - 2 * padding)}
        cy={height - padding - ((data[data.length - 1] - min) / range) * (height - 2 * padding)}
        r="4"
        fill={strokeColor}
      />
    </svg>
  );
}

function TrendIndicator({ trend, riskLevel }: { trend: 'improving' | 'stable' | 'declining'; riskLevel: 'high' | 'medium' | 'low' }) {
  const getConfig = () => {
    if (trend === 'improving') {
      return {
        icon: TrendingDown,
        label: 'Better',
        className: 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950',
      };
    }
    
    if (trend === 'declining') {
      return {
        icon: TrendingUp,
        label: 'Worse',
        className: 'text-destructive bg-destructive/10',
      };
    }
    
    // Stable trend - label depends on risk level
    if (riskLevel === 'high') {
      return {
        icon: Minus,
        label: 'Stuck',
        className: 'text-destructive bg-destructive/10',
      };
    }
    
    if (riskLevel === 'medium') {
      return {
        icon: Minus,
        label: 'Hold',
        className: 'text-warning bg-warning/10',
      };
    }
    
    return {
      icon: Minus,
      label: 'Steady',
      className: 'text-muted-foreground bg-muted',
    };
  };
  
  const { icon: Icon, label, className } = getConfig();
  
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium",
      className
    )}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </span>
  );
}

function RiskBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const config = {
    high: 'bg-destructive/15 text-destructive border-destructive/30',
    medium: 'bg-warning/15 text-warning border-warning/30',
    low: 'bg-success/10 text-success border-success/20',
  };
  
  return (
    <span className={cn(
      "inline-flex items-center justify-center rounded-md border px-3 py-1 text-sm font-semibold capitalize min-w-[60px]",
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
  
  // Get month labels for header - show first, middle, and last only
  const allMonthLabels = topCustomers[0]?.history.map(h => {
    const date = new Date(h.year, h.month - 1);
    return date.toLocaleDateString('en-US', { month: 'short' });
  }) || [];
  
  const monthLabels = allMonthLabels.length >= 3 
    ? [allMonthLabels[0], allMonthLabels[Math.floor(allMonthLabels.length / 2)], allMonthLabels[allMonthLabels.length - 1]]
    : allMonthLabels;

  return (
    <Card className="bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2.5 text-lg font-semibold">
            <Activity className="h-5 w-5 text-primary" />
            Customer Health Timeline
          </CardTitle>
          <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
            6-month trend
          </span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Column headers */}
        <div className="mb-4 pb-3 border-b border-border flex items-center gap-6 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div className="w-[140px] shrink-0">Customer</div>
          <div className="w-[140px] shrink-0 flex justify-between px-1">
            {monthLabels.map((label, i) => (
              <span key={i} className={i === monthLabels.length - 1 ? 'text-foreground font-semibold' : ''}>
                {label}
              </span>
            ))}
          </div>
          <div className="w-[80px] text-center">Risk</div>
          <div className="flex-1 text-center">Trend</div>
        </div>
        
        <div className="space-y-1.5">
          {topCustomers.map((customer) => (
            <div 
              key={customer.customerId} 
              className={cn(
                "flex items-center gap-6 rounded-lg px-4 py-2.5 transition-all",
                customer.currentRisk === 'high' && "bg-destructive/5 border-l-4 border-destructive shadow-sm",
                customer.currentRisk === 'medium' && "bg-warning/5 border-l-4 border-warning shadow-sm",
                customer.currentRisk === 'low' && "bg-secondary/30 border-l-4 border-success/50 hover:bg-secondary/50"
              )}
            >
              {/* Customer name */}
              <div className="w-[140px] shrink-0">
                <p className="truncate text-sm font-semibold text-foreground" title={customer.customerName}>
                  {customer.customerName}
                </p>
              </div>
              
              {/* Sparkline */}
              <div className="w-[140px] shrink-0 flex items-center justify-center">
                <Sparkline data={customer.history.map(h => h.riskScore)} />
              </div>
              
              {/* Current risk */}
              <div className="w-[80px] flex justify-center">
                <RiskBadge level={customer.currentRisk} />
              </div>
              
              {/* Trend */}
              <div className="flex-1 flex justify-center">
                <TrendIndicator trend={customer.trend} riskLevel={customer.currentRisk} />
              </div>
            </div>
          ))}
        </div>
        
        {customers.length > 8 && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            + {customers.length - 8} more customers
          </p>
        )}
      </CardContent>
    </Card>
  );
}
