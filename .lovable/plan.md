

# Revenue Drift Intelligence - Implementation Plan

## Product Overview

An AI-powered dashboard that helps finance teams understand why revenue is changing month-over-month. It pulls data from Light (Customers, Invoice Receivables, Contracts, Customer Credits), aggregates revenue per customer, detects drift, and generates CFO-ready summaries with actionable insights.

---

## Architecture Overview

```text
+------------------+     +----------------------+     +------------------+
|   React Frontend |---->| Edge Function        |---->| Light API        |
|   (Dashboard)    |     | (light-revenue-data) |     | (ERP Data)       |
+------------------+     +----------------------+     +------------------+
         |                        |
         |                        v
         |               +----------------------+
         +-------------->| Edge Function        |---->| Lovable AI       |
                         | (revenue-analysis)   |     | (CFO Summary)    |
                         +----------------------+
```

---

## Phase 1: Backend Infrastructure

### 1.1 Request Light API Key

Before any implementation, we need to securely store your Light API key:

- Navigate to https://app.light.inc/settings/api-keys
- Create a key with "Controller" role (read-only access)
- Provide it when prompted

### 1.2 Edge Function: `light-revenue-data`

Fetches and joins data from four Light API endpoints:

**Endpoints Called:**
- `GET /v1/customers` - All customers with `id`, `name`, `email`
- `GET /v1/invoice-receivables` - Invoices with `customerId`, `amount`, `invoiceDate`, `dueDate`, `state`
- `GET /v1/contracts` - Contracts with `customerId`, `startDate`, `endDate`, `estimatedAmount`, `state`
- `GET /v1/customer-credits` - Credits with `customerId`, `amount`, `documentDate`, `status`

**Data Processing Logic:**
1. Accept `month` and `year` parameters
2. Fetch all four datasets from Light API
3. Filter invoices/credits by the selected month and previous month
4. Join all data by `customerId`
5. Calculate per-customer metrics:
   - Total invoiced revenue (current month)
   - Total invoiced revenue (previous month)
   - Revenue change (delta and percentage)
   - Unpaid invoices (state !== "PAID")
   - Days outstanding (dueDate vs today)
   - Credits applied
   - Contract status
6. Return aggregated customer data with metrics

### 1.3 Edge Function: `revenue-analysis`

Uses Lovable AI to generate CFO summary:

**Input:** Aggregated customer revenue data
**Output:** Structured analysis including:
- Executive summary (2-3 sentences)
- Top drifting customers with reasons
- Root cause hypotheses
- Recommended actions
- Key questions for investigation

**Model:** `google/gemini-3-flash-preview` (default)

---

## Phase 2: Frontend Components

### 2.1 Page Structure: `/` (Index)

```text
+------------------------------------------------------------------+
| Header: "Revenue Drift Intelligence"          [Month Selector]   |
+------------------------------------------------------------------+
| KPI Row                                                          |
| +------------+ +---------------+ +-------------+ +--------------+|
| | Total      | | Revenue Drift | | Outstanding | | At-Risk      ||
| | Revenue    | | vs Last Month | | AR          | | Customers    ||
| | $2.4M      | | -6.1%         | | $214K       | | 3            ||
| +------------+ +---------------+ +-------------+ +--------------+|
+------------------------------------------------------------------+
| Customer Drift Table                                   [Filters] |
| +----------------------------------------------------------------+|
| | Customer    | Revenue  | Change | Unpaid | Credits | Risk     ||
| |-------------|----------|--------|--------|---------|----------|
| | Acme Corp   | $450K    | -12%   | $89K   | $0      | High     ||
| | Nova Ltd    | $280K    | -8%    | $45K   | $12K    | Medium   ||
| | ...         | ...      | ...    | ...    | ...     | ...      ||
| +----------------------------------------------------------------+|
+------------------------------------------------------------------+
| AI Analysis Panel                              [Regenerate]      |
| +----------------------------------------------------------------+|
| | CFO Summary                                                    ||
| | Revenue declined 6.1% driven primarily by...                   ||
| |                                                                ||
| | Recommended Actions                                            ||
| | 1. Escalate collections for Acme Corp                          ||
| | 2. Review Nova Ltd contract renewal                            ||
| |                                                                ||
| | Questions to Investigate                                       ||
| | - Are contract renewals delayed?                               ||
| | - Are credits operational or pricing-related?                  ||
| +----------------------------------------------------------------+|
+------------------------------------------------------------------+
```

### 2.2 Components to Create

| Component | Purpose |
|-----------|---------|
| `MonthSelector.tsx` | Dropdown to select analysis month |
| `KPICard.tsx` | Individual metric card with icon and trend indicator |
| `KPIRow.tsx` | Container for 4 KPI cards |
| `CustomerDriftTable.tsx` | Sortable table with risk indicators |
| `RiskBadge.tsx` | Color-coded risk indicator (High/Medium/Low) |
| `AIAnalysisPanel.tsx` | Streaming AI summary with sections |
| `LoadingState.tsx` | Skeleton loaders for data fetching |

### 2.3 Custom Hooks

| Hook | Purpose |
|------|---------|
| `useRevenueData` | Fetches and caches revenue data via React Query |
| `useRevenueAnalysis` | Streams AI analysis with token-by-token rendering |

---

## Phase 3: Data Flow

### 3.1 Initial Load Sequence

1. User lands on page
2. `MonthSelector` defaults to previous completed month
3. `useRevenueData` calls `light-revenue-data` edge function
4. KPI cards and table populate with loading states
5. Data arrives and UI updates
6. `useRevenueAnalysis` streams AI summary in background

### 3.2 Month Change Flow

1. User selects new month
2. Cache check via React Query
3. If miss: fetch fresh data from Light API
4. Re-generate AI analysis for new period

---

## Phase 4: Risk Calculation Logic

**Risk Level Assignment (per customer):**

| Condition | Risk Level |
|-----------|------------|
| Revenue drop > 20% OR Overdue > 60 days | High |
| Revenue drop 10-20% OR Overdue 30-60 days | Medium |
| Revenue drop < 10% AND No overdue | Low |

**Additional flags:**
- Credits > 10% of revenue: Flag for investigation
- Contract ending within 30 days: Renewal warning
- Multiple unpaid invoices: Collection priority

---

## Phase 5: AI Prompt Engineering

### Analysis Prompt Structure

The edge function will use tool calling to get structured output:

```text
Tool: analyze_revenue_drift
Parameters:
  - summary: string (2-3 sentence executive summary)
  - top_drifting_customers: array of { name, revenue_change, primary_reason }
  - root_causes: array of strings
  - recommended_actions: array of { action, priority, target_customer? }
  - investigation_questions: array of strings
```

---

## Technical Details

### File Structure

```text
src/
  pages/
    Index.tsx                    # Main dashboard page
  components/
    revenue/
      MonthSelector.tsx          # Month/year picker
      KPICard.tsx                # Single metric card
      KPIRow.tsx                 # 4-card container
      CustomerDriftTable.tsx     # Main data table
      RiskBadge.tsx              # Risk indicator
      AIAnalysisPanel.tsx        # AI summary display
      LoadingState.tsx           # Skeleton loaders
  hooks/
    useRevenueData.ts            # React Query hook for Light data
    useRevenueAnalysis.ts        # Streaming AI hook
  types/
    revenue.ts                   # TypeScript interfaces

supabase/
  functions/
    light-revenue-data/
      index.ts                   # Light API aggregation
    revenue-analysis/
      index.ts                   # AI summary generation
```

### TypeScript Interfaces

```typescript
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
}

interface RevenueAnalysis {
  summary: string;
  topDriftingCustomers: {
    name: string;
    revenueChange: number;
    primaryReason: string;
  }[];
  rootCauses: string[];
  recommendedActions: {
    action: string;
    priority: 'urgent' | 'high' | 'medium';
    targetCustomer?: string;
  }[];
  investigationQuestions: string[];
}
```

---

## Security Considerations

- Light API key stored as Supabase secret (never exposed in frontend)
- All Light API calls made server-side via Edge Functions
- No sensitive financial data cached in browser storage
- Rate limiting considerations for Light API (handle 429 gracefully)

---

## Implementation Order

1. Request and store Light API key as secret
2. Create `light-revenue-data` edge function
3. Create basic UI with KPI cards and table (mock data)
4. Connect UI to edge function
5. Create `revenue-analysis` edge function
6. Add AI streaming panel
7. Add month selector and filtering
8. Polish loading states and error handling
9. Add export/print functionality (optional)


Everything seems perfect - just lets pitch this as applicasgions and not dashboard try to revenude drift because this is easy to sell - kind of do some corporate colour encoding just the way I as a CFO Would prefer if this product was in my company 

Keep the ui/ux simple and minimal, the user should not feel cognitive load and easily understand and navigate the application. Keep the colours warm and pleasing to eyes, do not use pink, purple, or etc colours or gradient finishing.


Also add a copy button on ai analysis panel so the cfo or anyone could copy paste that content of suggestion and analysis


The filter in customer drift table should be interactive and the cfo should be able to play with that data

Also after you join the final table should be in  exportable  table format  so that i can upload it either in light or anywhere else


The final insights should be such that non-tech, tech, finance, everyone can have grasp or understand it easily

In case of doubts or queries do ask for more clarifying questions
