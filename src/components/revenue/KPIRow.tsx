import { KPICard } from "./KPICard";
import { DollarSign, TrendingDown, Clock, AlertTriangle } from "lucide-react";
import type { RevenueTotals } from "@/types/revenue";

interface KPIRowProps {
  totals: RevenueTotals;
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(0)}K`;
  }
  return `$${value.toFixed(0)}`;
}

export function KPIRow({ totals, isLoading }: KPIRowProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[120px] animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    );
  }

  const driftTrend = totals.revenueDriftPercent >= 0 ? 'up' : 'down';

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KPICard
        title="Total Revenue"
        value={formatCurrency(totals.totalRevenue)}
        icon={DollarSign}
        subtitle="this period"
      />
      <KPICard
        title="Revenue Drift"
        value={`${totals.revenueDriftPercent >= 0 ? '+' : ''}${totals.revenueDriftPercent.toFixed(1)}%`}
        icon={TrendingDown}
        trend={driftTrend}
        trendValue={formatCurrency(Math.abs(totals.revenueDrift))}
        subtitle="vs last month"
      />
      <KPICard
        title="Outstanding AR"
        value={formatCurrency(totals.totalUnpaid)}
        icon={Clock}
        subtitle="unpaid invoices"
      />
      <KPICard
        title="At-Risk Customers"
        value={String(totals.atRiskCustomers)}
        icon={AlertTriangle}
        subtitle="high risk"
        trend={totals.atRiskCustomers > 0 ? 'down' : 'neutral'}
      />
    </div>
  );
}
