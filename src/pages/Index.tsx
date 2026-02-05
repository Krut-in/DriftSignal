import { useState } from "react";
import { MonthSelector } from "@/components/revenue/MonthSelector";
import { KPIRow } from "@/components/revenue/KPIRow";
import { CustomerDriftTable } from "@/components/revenue/CustomerDriftTable";
import { AIAnalysisPanel } from "@/components/revenue/AIAnalysisPanel";
import { CustomerHealthTimeline } from "@/components/revenue/CustomerHealthTimeline";
import { useRevenueData } from "@/hooks/useRevenueData";
import { useRevenueAnalysis } from "@/hooks/useRevenueAnalysis";
import { useCustomerHealthHistory } from "@/hooks/useCustomerHealthHistory";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { TrendingDown, ChevronDown } from "lucide-react";

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
  const [healthTimelineOpen, setHealthTimelineOpen] = useState(true);
  const [revenueDriftOpen, setRevenueDriftOpen] = useState(true);

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
            <div className="rounded-lg bg-accent-teal p-2 transition-all duration-300 hover:scale-110 hover:shadow-lg hover:shadow-accent-teal/30 cursor-pointer">
              <TrendingDown className="h-6 w-6 text-primary-foreground transition-transform duration-300 hover:rotate-12" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground bg-gradient-to-r from-foreground via-accent-teal to-foreground bg-clip-text">
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
        <Collapsible open={healthTimelineOpen} onOpenChange={setHealthTimelineOpen} className="mb-8">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent-indigo/10 px-4 py-3 text-left hover:bg-accent-indigo/20 transition-all duration-300 border border-accent-indigo/20 hover:border-accent-indigo/40 hover:shadow-md hover:shadow-accent-indigo/10 group">
            <h2 className="text-lg font-semibold text-foreground group-hover:text-accent-indigo transition-colors duration-300">Customer Health Timeline</h2>
            <ChevronDown className={`h-5 w-5 text-accent-indigo transition-all duration-300 group-hover:scale-110 ${healthTimelineOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <CustomerHealthTimeline
              customers={healthHistory?.customers || []}
              isLoading={isLoadingHealth}
              error={healthError}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Customer Revenue Drift */}
        <Collapsible open={revenueDriftOpen} onOpenChange={setRevenueDriftOpen} className="mb-8">
          <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg bg-accent-indigo/10 px-4 py-3 text-left hover:bg-accent-indigo/20 transition-all duration-300 border border-accent-indigo/20 hover:border-accent-indigo/40 hover:shadow-md hover:shadow-accent-indigo/10 group">
            <h2 className="text-lg font-semibold text-foreground group-hover:text-accent-indigo transition-colors duration-300">Customer Revenue Drift</h2>
            <ChevronDown className={`h-5 w-5 text-accent-indigo transition-all duration-300 group-hover:scale-110 ${revenueDriftOpen ? 'rotate-180' : ''}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <CustomerDriftTable 
              customers={revenueData?.customers || []} 
              isLoading={isLoadingData}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* AI Analysis Panel */}
        <AIAnalysisPanel
          analysis={analysis}
          isLoading={isLoadingAnalysis}
          error={analysisError}
          onRegenerate={() => refetchAnalysis()}
        />

        {/* Footer */}
        <footer className="mt-12 pt-6 text-center relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-accent-teal to-transparent" />
        </footer>
      </div>
    </div>
  );
};

export default Index;
