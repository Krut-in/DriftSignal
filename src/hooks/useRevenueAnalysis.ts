import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RevenueAnalysis, CustomerRevenue, RevenueTotals } from '@/types/revenue';

interface AnalysisInput {
  customers: CustomerRevenue[];
  totals: RevenueTotals;
  period: { month: number; year: number };
}

export function useRevenueAnalysis(input: AnalysisInput | null, enabled: boolean = true) {
  return useQuery<RevenueAnalysis>({
    queryKey: ['revenue-analysis', input?.period.month, input?.period.year],
    queryFn: async () => {
      if (!input) {
        throw new Error('No data available for analysis');
      }

      const { data, error } = await supabase.functions.invoke('revenue-analysis', {
        body: input,
      });

      if (error) {
        throw new Error(error.message || 'Failed to generate analysis');
      }

      return data as RevenueAnalysis;
    },
    enabled: enabled && !!input && input.customers.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });
}
