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

interface LightContract {
  id: string;
  customerId: string;
  startDate: string;
  endDate?: string;
  estimatedAmount?: number | string;
  state: string;
}

interface LightCredit {
  id: string;
  customerId: string;
  customerName?: string;
  amount: number | string;
  documentDate: string;
  status: string;
}

interface CustomerRevenue {
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

// Maximum reasonable amount threshold - $100 million
// Amounts larger than this are likely data entry errors
const MAX_REASONABLE_AMOUNT = 100_000_000_00; // $100M in cents

// Parse amounts from Light API - handles cents conversion and locale formats
function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined || value === '') return 0;
  
  // If already a number
  if (typeof value === 'number') {
    // Check for obviously erroneous data (over threshold)
    if (Math.abs(value) > MAX_REASONABLE_AMOUNT) {
      console.warn(`Suspicious amount detected: ${value} cents - exceeds $100M threshold, likely data error`);
      return 0; // Return 0 to exclude from totals
    }
    // Light API returns amounts in cents - convert to dollars
    return value / 100;
  }
  
  let str = String(value).trim();
  
  // Remove currency symbols and whitespace
  str = str.replace(/[$€£¥\s]/g, '');
  
  // Auto-detect format by checking last separator
  const lastComma = str.lastIndexOf(',');
  const lastDot = str.lastIndexOf('.');
  
  // Determine if comma is the decimal separator
  const isCommaDecimal = lastComma > lastDot;
  
  if (isCommaDecimal) {
    str = str.replace(/\./g, ''); // Remove thousand separators
    str = str.replace(',', '.'); // Convert decimal separator
  } else {
    str = str.replace(/,/g, ''); // Remove thousand separators
  }
  
  const parsed = parseFloat(str);
  if (isNaN(parsed)) return 0;
  
  // Check for obviously erroneous data
  if (Math.abs(parsed) > MAX_REASONABLE_AMOUNT) {
    console.warn(`Suspicious amount detected: ${parsed} - exceeds $100M threshold, likely data error`);
    return 0;
  }
  
  // Light API typically returns cents - convert to dollars
  return parsed / 100;
}

async function fetchLightAPI(endpoint: string, apiKey: string): Promise<any> {
  console.log(`Calling Light API: ${endpoint}`);
  
  // Light API uses Basic auth with API key directly (not base64 encoded)
  const response = await fetch(`https://api.light.inc${endpoint}`, {
    headers: {
      'Authorization': `Basic ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.error(`Light API error for ${endpoint}:`, response.status, text);
    throw new Error(`Light API error: ${response.status}`);
  }
  
  return response.json();
}

function isInMonth(dateStr: string, month: number, year: number): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return date.getMonth() + 1 === month && date.getFullYear() === year;
}

function getPreviousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }
  return { month: month - 1, year };
}

function calculateDaysOutstanding(dueDate: string): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

function calculateRiskLevel(
  revenueChangePercent: number,
  maxDaysOutstanding: number
): 'high' | 'medium' | 'low' {
  if (revenueChangePercent <= -20 || maxDaysOutstanding > 60) {
    return 'high';
  }
  if ((revenueChangePercent <= -10 && revenueChangePercent > -20) || 
      (maxDaysOutstanding > 30 && maxDaysOutstanding <= 60)) {
    return 'medium';
  }
  return 'low';
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
    const month = parseInt(url.searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(url.searchParams.get('year') || String(new Date().getFullYear()));
    
    console.log(`Fetching revenue data for ${month}/${year}`);

    // Fetch all data from Light API in parallel
    const [customersRes, invoicesRes, contractsRes, creditsRes] = await Promise.all([
      fetchLightAPI('/v1/customers', LIGHT_API_KEY),
      fetchLightAPI('/v1/invoice-receivables', LIGHT_API_KEY),
      fetchLightAPI('/v1/contracts', LIGHT_API_KEY),
      fetchLightAPI('/v1/customer-credits', LIGHT_API_KEY),
    ]);

    // Light API returns 'records' not 'data'
    const customers: LightCustomer[] = customersRes.records || customersRes.data || [];
    const invoices: LightInvoice[] = invoicesRes.records || invoicesRes.data || [];
    const contracts: LightContract[] = contractsRes.records || contractsRes.data || [];
    const credits: LightCredit[] = creditsRes.records || creditsRes.data || [];

    console.log(`Fetched: ${customers.length} customers, ${invoices.length} invoices, ${contracts.length} contracts, ${credits.length} credits`);
    
    // Log sample invoice data to debug amount parsing
    if (invoices.length > 0) {
      console.log('Sample invoices with raw and parsed amounts:', invoices.slice(0, 5).map(inv => ({
        id: inv.id,
        invoiceDate: inv.invoiceDate,
        rawAmount: inv.amount,
        parsedAmount: parseAmount(inv.amount),
        customerId: inv.customerId
      })));
    }

    const prev = getPreviousMonth(month, year);

    // Create customer map
    const customerMap = new Map<string, LightCustomer>();
    customers.forEach(c => customerMap.set(c.id, c));

    // Calculate metrics per customer
    const customerMetrics = new Map<string, CustomerRevenue>();

    // Initialize all customers
    customers.forEach(customer => {
      customerMetrics.set(customer.id, {
        customerId: customer.id,
        customerName: customer.name,
        currentRevenue: 0,
        previousRevenue: 0,
        revenueChange: 0,
        revenueChangePercent: 0,
        unpaidAmount: 0,
        creditsApplied: 0,
        daysOutstanding: 0,
        riskLevel: 'low',
        invoiceCount: 0,
        unpaidInvoiceCount: 0,
      });
    });

    // Process invoices
    invoices.forEach(invoice => {
      const customerId = invoice.customerId;
      if (!customerId) return;
      
      let metrics = customerMetrics.get(customerId);
      if (!metrics) {
        // Customer might not be in customers list, create entry
        metrics = {
          customerId,
          customerName: invoice.customerName || 'Unknown',
          currentRevenue: 0,
          previousRevenue: 0,
          revenueChange: 0,
          revenueChangePercent: 0,
          unpaidAmount: 0,
          creditsApplied: 0,
          daysOutstanding: 0,
          riskLevel: 'low',
          invoiceCount: 0,
          unpaidInvoiceCount: 0,
        };
        customerMetrics.set(customerId, metrics);
      }

      const amount = parseAmount(invoice.amount);

      // Current month revenue
      if (isInMonth(invoice.invoiceDate, month, year)) {
        metrics.currentRevenue += amount;
        metrics.invoiceCount++;
        
        if (invoice.state !== 'PAID') {
          metrics.unpaidAmount += amount;
          metrics.unpaidInvoiceCount++;
          const days = calculateDaysOutstanding(invoice.dueDate);
          metrics.daysOutstanding = Math.max(metrics.daysOutstanding, days);
        }
      }

      // Previous month revenue
      if (isInMonth(invoice.invoiceDate, prev.month, prev.year)) {
        metrics.previousRevenue += amount;
      }
    });

    // Process credits
    credits.forEach(credit => {
      const customerId = credit.customerId;
      if (!customerId) return;
      
      const metrics = customerMetrics.get(customerId);
      if (metrics && isInMonth(credit.documentDate, month, year)) {
        metrics.creditsApplied += parseAmount(credit.amount);
      }
    });

    // Process contracts for end dates
    contracts.forEach(contract => {
      const customerId = contract.customerId;
      if (!customerId) return;
      
      const metrics = customerMetrics.get(customerId);
      if (metrics && contract.endDate) {
        const existingEnd = metrics.contractEndDate ? new Date(metrics.contractEndDate) : null;
        const newEnd = new Date(contract.endDate);
        if (!existingEnd || newEnd < existingEnd) {
          metrics.contractEndDate = contract.endDate;
        }
      }
    });

    // Calculate change and risk
    customerMetrics.forEach(metrics => {
      metrics.revenueChange = metrics.currentRevenue - metrics.previousRevenue;
      metrics.revenueChangePercent = metrics.previousRevenue > 0
        ? ((metrics.revenueChange / metrics.previousRevenue) * 100)
        : (metrics.currentRevenue > 0 ? 100 : 0);
      
      metrics.riskLevel = calculateRiskLevel(
        metrics.revenueChangePercent,
        metrics.daysOutstanding
      );
    });

    // Convert to array and filter out customers with no activity
    const result = Array.from(customerMetrics.values())
      .filter(m => m.currentRevenue > 0 || m.previousRevenue > 0 || m.unpaidAmount > 0)
      .sort((a, b) => a.revenueChangePercent - b.revenueChangePercent);

    // Calculate totals
    const totals = {
      totalRevenue: result.reduce((sum, m) => sum + m.currentRevenue, 0),
      previousTotalRevenue: result.reduce((sum, m) => sum + m.previousRevenue, 0),
      totalUnpaid: result.reduce((sum, m) => sum + m.unpaidAmount, 0),
      totalCredits: result.reduce((sum, m) => sum + m.creditsApplied, 0),
      atRiskCustomers: result.filter(m => m.riskLevel === 'high').length,
      revenueDrift: 0,
      revenueDriftPercent: 0,
    };
    
    totals.revenueDrift = totals.totalRevenue - totals.previousTotalRevenue;
    totals.revenueDriftPercent = totals.previousTotalRevenue > 0
      ? ((totals.revenueDrift / totals.previousTotalRevenue) * 100)
      : 0;

    console.log(`Returning ${result.length} customers with activity`);
    console.log('Totals:', JSON.stringify(totals));

    return new Response(
      JSON.stringify({ 
        customers: result, 
        totals,
        period: { month, year },
        previousPeriod: prev,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in light-revenue-data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
