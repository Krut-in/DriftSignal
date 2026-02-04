export interface CustomerRevenue {
  customerId: string;
  customerName: string;
  currentRevenue: number;
  previousRevenue: number;
  revenueChange: number;
  revenueChangePercent: number;
  unpaidAmount: number;
  creditsApplied: number;
  daysOutstanding: number;
  riskLevel: 'high' | 'medium' | 'low';
  contractEndDate?: string;
  invoiceCount: number;
  unpaidInvoiceCount: number;
}

export interface RevenueTotals {
  totalRevenue: number;
  previousTotalRevenue: number;
  totalUnpaid: number;
  totalCredits: number;
  atRiskCustomers: number;
  revenueDrift: number;
  revenueDriftPercent: number;
}

export interface RevenueDataResponse {
  customers: CustomerRevenue[];
  totals: RevenueTotals;
  period: { month: number; year: number };
  previousPeriod: { month: number; year: number };
}

export interface DriftingCustomer {
  name: string;
  revenueChange: string;
  primaryReason: string;
}

export interface RecommendedAction {
  action: string;
  priority: 'urgent' | 'high' | 'medium';
  targetCustomer?: string;
}

export interface RevenueAnalysis {
  summary: string;
  topDriftingCustomers: DriftingCustomer[];
  rootCauses: string[];
  recommendedActions: RecommendedAction[];
  investigationQuestions: string[];
}

export type RiskFilter = 'all' | 'high' | 'medium' | 'low';
export type SortField = 'customerName' | 'currentRevenue' | 'revenueChangePercent' | 'unpaidAmount' | 'creditsApplied' | 'riskLevel';
export type SortDirection = 'asc' | 'desc';
