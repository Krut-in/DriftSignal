import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RevenueDataResponse } from '@/types/revenue';

export function useRevenueData(month: number, year: number) {
  return useQuery<RevenueDataResponse>({
    queryKey: ['revenue-data', month, year],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('light-revenue-data', {
        body: {},
        headers: {},
      });

      // The invoke doesn't support query params, so we need to use fetch
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/light-revenue-data?month=${month}&year=${year}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch revenue data');
      }

      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}
