import { useQuery } from '@tanstack/react-query';

export interface MonthlySnapshot {
  month: number;
  year: number;
  revenue: number;
  unpaidAmount: number;
  daysOutstanding: number;
  riskLevel: 'high' | 'medium' | 'low';
  riskScore: number;
}

export interface CustomerHealthHistory {
  customerId: string;
  customerName: string;
  history: MonthlySnapshot[];
  trend: 'improving' | 'stable' | 'declining';
  currentRisk: 'high' | 'medium' | 'low';
}

export interface HealthHistoryResponse {
  customers: CustomerHealthHistory[];
  period: {
    start: { month: number; year: number };
    end: { month: number; year: number };
  };
}

export function useCustomerHealthHistory(month: number, year: number) {
  return useQuery<HealthHistoryResponse>({
    queryKey: ['customer-health-history', month, year],
    queryFn: async () => {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/customer-health-history?month=${month}&year=${year}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch health history');
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
}
