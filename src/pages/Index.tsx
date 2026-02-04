import { useState } from "react";
import { MonthSelector } from "@/components/revenue/MonthSelector";
import { KPIRow } from "@/components/revenue/KPIRow";
import { CustomerDriftTable } from "@/components/revenue/CustomerDriftTable";
import { AIAnalysisPanel } from "@/components/revenue/AIAnalysisPanel";
import { CustomerHealthTimeline } from "@/components/revenue/CustomerHealthTimeline";
import { useRevenueData } from "@/hooks/useRevenueData";
import { useRevenueAnalysis } from "@/hooks/useRevenueAnalysis";
import { useCustomerHealthHistory } from "@/hooks/useCustomerHealthHistory";
import { TrendingDown } from "lucide-react";

function getDefaultPeriod() {
  const now = new Date();
  // Default to previous month
  if (now.getMonth() === 0) {
    return { month: 12, year: now.getFullYear() - 1 };
  }
  return { month: now.getMonth(), year: now.getFullYear() };
}

const Index = () => {
  const defaultPeriod = getDefaultPeriod();
  const [month, setMonth] = useState(defaultPeriod.month);
  const [year, setYear] = useState(defaultPeriod.year);

  const { 
    data: revenueData, 
    isLoading: isLoadingData, 
    error: dataError,
    refetch: refetchData 
  } = useRevenueData(month, year);

  const {
    data: analysis,
    isLoading: isLoadingAnalysis,
    error: analysisError,
    refetch: refetchAnalysis
  } = useRevenueAnalysis(
    revenueData ? {
      customers: revenueData.customers,
      totals: revenueData.totals,
      period: revenueData.period,
    } : null,
    !!revenueData
  );

  const {
    data: healthHistory,
    isLoading: isLoadingHealth,
    error: healthError,
  } = useCustomerHealthHistory(month, year);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2">
              <TrendingDown className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Revenue Drift Intelligence
              </h1>
              <p className="text-sm text-muted-foreground">
                Understand why your revenue is changing
              </p>
            </div>
          </div>
          <MonthSelector
            month={month}
            year={year}
            onMonthChange={setMonth}
            onYearChange={setYear}
          />
        </header>

        {/* Error State */}
        {dataError && (
          <div className="mb-6 rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              Failed to load revenue data: {dataError.message}
            </p>
          </div>
        )}

        {/* KPI Cards */}
        <section className="mb-8">
          <KPIRow 
            totals={revenueData?.totals || {
              totalRevenue: 0,
              previousTotalRevenue: 0,
              totalUnpaid: 0,
              totalCredits: 0,
              atRiskCustomers: 0,
              revenueDrift: 0,
              revenueDriftPercent: 0,
            }} 
            isLoading={isLoadingData} 
          />
        </section>

        {/* Customer Health Timeline - Full Width */}
        <section className="mb-8">
          <CustomerHealthTimeline
            customers={healthHistory?.customers || []}
            isLoading={isLoadingHealth}
            error={healthError}
          />
        </section>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Customer Table - 2 columns */}
          <section className="lg:col-span-2">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Customer Revenue Drift</h2>
            <CustomerDriftTable 
              customers={revenueData?.customers || []} 
              isLoading={isLoadingData}
            />
          </section>

          {/* AI Analysis Panel - 1 column */}
          <section className="lg:col-span-1">
            <AIAnalysisPanel
              analysis={analysis}
              isLoading={isLoadingAnalysis}
              error={analysisError}
              onRegenerate={() => refetchAnalysis()}
            />
          </section>
        </div>

        {/* Footer */}
        <footer className="mt-12 border-t pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Data sourced from Light ERP • Last updated: {new Date().toLocaleDateString()}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
