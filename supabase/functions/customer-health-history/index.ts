import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LightCustomer {
  id: string;
  name: string;
  email?: string;
}

interface LightInvoice {
  id: string;
  customerId: string;
  customerName?: string;
  amount: number | string;
  invoiceDate: string;
  dueDate: string;
  state: string;
}

interface MonthlySnapshot {
  month: number;
  year: number;
  revenue: number;
  unpaidAmount: number;
  daysOutstanding: number;
  riskLevel: 'high' | 'medium' | 'low';
  riskScore: number; // 0-100 for sparkline
}

interface CustomerHealthHistory {
  customerId: string;
  customerName: string;
  history: MonthlySnapshot[];
  trend: 'improving' | 'stable' | 'declining';
  currentRisk: 'high' | 'medium' | 'low';
}

// Maximum reasonable amount threshold - $100 million in cents
const MAX_REASONABLE_AMOUNT = 100_000_000_00;

function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  
  if (typeof value === 'number') {
    if (Math.abs(value) > MAX_REASONABLE_AMOUNT) return 0;
    return value / 100;
  }
  
  let str = String(value).trim().replace(/[$€£¥\s]/g, '');
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');
  
  if (lastComma > lastDot) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else {
    str = str.replace(/,/g, '');
  }
  
  const parsed = parseFloat(str);
  if (isNaN(parsed) || Math.abs(parsed) > MAX_REASONABLE_AMOUNT) return 0;
  return parsed / 100;
}

async function fetchLightAPI(endpoint: string, apiKey: string): Promise<any> {
  const response = await fetch(`https://api.light.inc${endpoint}`, {
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Light API error: ${response.status}`);
  }
  
  return response.json();
}

function getMonthKey(month: number, year: number): string {
  return `${year}-${month.toString().padStart(2, '0')}`;
}

function isInMonth(dateStr: string, month: number, year: number): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date.getMonth() + 1 === month && date.getFullYear() === year;
}

function calculateDaysOutstanding(dueDate: string, referenceDate: Date): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const diffTime = referenceDate.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function calculateRiskScore(revenueChangePercent: number, daysOutstanding: number): number {
  // Risk score 0-100 where 100 is highest risk
  let score = 50; // baseline
  
  // Revenue decline increases risk
  if (revenueChangePercent < -30) score += 30;
  else if (revenueChangePercent < -20) score += 20;
  else if (revenueChangePercent < -10) score += 10;
  else if (revenueChangePercent > 10) score -= 15;
  else if (revenueChangePercent > 0) score -= 5;
  
  // Days outstanding increases risk
  if (daysOutstanding > 90) score += 25;
  else if (daysOutstanding > 60) score += 15;
  else if (daysOutstanding > 30) score += 8;
  
  return Math.max(0, Math.min(100, score));
}

function calculateRiskLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

function determineTrend(history: MonthlySnapshot[]): 'improving' | 'stable' | 'declining' {
  if (history.length < 2) return 'stable';
  
  // Compare first half average to second half average
  const mid = Math.floor(history.length / 2);
  const firstHalf = history.slice(0, mid);
  const secondHalf = history.slice(mid);
  
  const firstAvg = firstHalf.reduce((sum, h) => sum + h.riskScore, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, h) => sum + h.riskScore, 0) / secondHalf.length;
  
  const diff = secondAvg - firstAvg;
  
  if (diff > 10) return 'declining'; // risk is increasing
  if (diff < -10) return 'improving'; // risk is decreasing
  return 'stable';
}

function getLast6Months(endMonth: number, endYear: number): Array<{month: number, year: number}> {
  const months = [];
  let m = endMonth;
  let y = endYear;
  
  for (let i = 0; i < 6; i++) {
    months.unshift({ month: m, year: y });
    m--;
    if (m === 0) {
      m = 12;
      y--;
    }
  }
  
  return months;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LIGHT_API_KEY = Deno.env.get('LIGHT_API_KEY');
    if (!LIGHT_API_KEY) {
      throw new Error('LIGHT_API_KEY is not configured');
    }

    const url = new URL(req.url);
    const endMonth = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
    const endYear = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));
    
    console.log(`Fetching 6-month health history ending ${endMonth}/${endYear}`);

    // Fetch invoices and customers from Light API in parallel
    const [invoicesRes, customersRes] = await Promise.all([
      fetchLightAPI('/v1/invoice-receivables', LIGHT_API_KEY),
      fetchLightAPI('/v1/customers', LIGHT_API_KEY),
    ]);
    
    const invoices: LightInvoice[] = invoicesRes.records || invoicesRes.data || [];
    const customers: LightCustomer[] = customersRes.records || customersRes.data || [];
    
    console.log(`Fetched ${invoices.length} invoices and ${customers.length} customers for health history`);

    // Create customer name lookup
    const customerNameMap = new Map<string, string>();
    customers.forEach(c => customerNameMap.set(c.id, c.name));

    const months = getLast6Months(endMonth, endYear);
    
    // Group invoices by customer
    const customerInvoices = new Map<string, { name: string; invoices: LightInvoice[] }>();
    
    invoices.forEach(inv => {
      if (!inv.customerId) return;
      
      if (!customerInvoices.has(inv.customerId)) {
        // Prefer customer name from customers API, fall back to invoice's customerName
        const name = customerNameMap.get(inv.customerId) || inv.customerName || 'Unknown';
        customerInvoices.set(inv.customerId, {
          name,
          invoices: []
        });
      }
      customerInvoices.get(inv.customerId)!.invoices.push(inv);
    });

    // Calculate health history for each customer
    const results: CustomerHealthHistory[] = [];
    
    customerInvoices.forEach((data, customerId) => {
      const history: MonthlySnapshot[] = [];
      let previousRevenue = 0;
      
      months.forEach(({ month, year }, idx) => {
        // Reference date for calculating days outstanding (end of that month)
        const referenceDate = new Date(year, month, 0); // Last day of month
        
        let revenue = 0;
        let unpaidAmount = 0;
        let maxDaysOutstanding = 0;
        
        data.invoices.forEach(inv => {
          if (isInMonth(inv.invoiceDate, month, year)) {
            const amount = parseAmount(inv.amount);
            revenue += amount;
            
            if (inv.state !== 'PAID') {
              unpaidAmount += amount;
              const days = calculateDaysOutstanding(inv.dueDate, referenceDate);
              maxDaysOutstanding = Math.max(maxDaysOutstanding, days);
            }
          }
        });
        
        const revenueChangePercent = previousRevenue > 0
          ? ((revenue - previousRevenue) / previousRevenue) * 100
          : (idx === 0 ? 0 : (revenue > 0 ? 100 : 0));
        
        const riskScore = calculateRiskScore(revenueChangePercent, maxDaysOutstanding);
        
        history.push({
          month,
          year,
          revenue,
          unpaidAmount,
          daysOutstanding: maxDaysOutstanding,
          riskLevel: calculateRiskLevel(riskScore),
          riskScore
        });
        
        previousRevenue = revenue;
      });
      
      // Only include customers with some activity in the period
      const hasActivity = history.some(h => h.revenue > 0 || h.unpaidAmount > 0);
      if (!hasActivity) return;
      
      const trend = determineTrend(history);
      const currentRisk = history[history.length - 1]?.riskLevel || 'low';
      
      results.push({
        customerId,
        customerName: data.name,
        history,
        trend,
        currentRisk
      });
    });
    
    // Sort by current risk (high first) then by declining trend
    results.sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      const trendOrder = { declining: 0, stable: 1, improving: 2 };
      
      const riskDiff = riskOrder[a.currentRisk] - riskOrder[b.currentRisk];
      if (riskDiff !== 0) return riskDiff;
      
      return trendOrder[a.trend] - trendOrder[b.trend];
    });

    console.log(`Returning health history for ${results.length} customers`);

    return new Response(
      JSON.stringify({ 
        customers: results,
        period: { 
          start: months[0],
          end: months[months.length - 1]
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in customer-health-history:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
