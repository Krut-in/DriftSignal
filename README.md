# DriftSignal 📊
*Revenue Intelligence That Speaks Your Language*

## The Revenue Blindspot Problem

Finance teams ask the same question every month: "Why did revenue drop?"

The answers are buried in spreadsheets. They're scattered across invoicing systems. They're lost between technical metrics and business impact.

By the time you manually compile the data, analyze the trends, and write the report—it's already outdated. Opportunities to act have passed.

## The Solution: AI-Powered Revenue Intelligence

**DriftSignal** transforms raw revenue data into actionable intelligence automatically.

It tracks customer revenue patterns, identifies at-risk accounts before they churn, and explains what's driving your numbers in plain English. No more data archaeology. Just strategic decisions.

## Core Features

### Dynamic Revenue Monitoring
Track your critical metrics in real-time:
- Total revenue with month-over-month changes
- Unpaid balances and credit adjustments
- Revenue drift percentage and absolute values
- Navigate any historical month/year for trend analysis

### Customer Health Timeline
See the big picture at a glance:
- Visualize multiple months of customer data simultaneously
- Color-coded health indicators (healthy, at-risk, churned)
- Spot patterns before they become problems
- Identify which accounts need immediate attention

### Intelligent Drift Detection
Know exactly where your revenue is moving:
- Per-customer revenue change calculations
- Sortable and filterable drift tables
- Instantly identify your biggest movers
- Optimized performance for hundreds of records

### AI-Powered Analysis
Get insights in seconds, not hours:
- Natural language explanations of revenue changes
- AI identifies contributing factors automatically
- Suggests areas requiring immediate attention
- Powered by Supabase Edge Functions with built-in error handling

### Serverless Architecture
Fast, reliable, and scalable:
- Custom API endpoints for revenue data
- TanStack Query caching (5-min data, 10-min analysis)
- Authentication and retry logic built-in
- Reduces unnecessary API calls for responsive UX

## Technical Architecture

### Frontend Stack
- **React 18.3** + **TypeScript 5.8** for type-safe development
- **Vite** for lightning-fast builds
- **shadcn/ui** + **Radix UI** for accessible components
- **Tailwind CSS** for consistent styling
- **Recharts** for responsive data visualizations

### Backend & Data
- **Supabase** for backend services and Edge Functions
- **TanStack Query v5** for intelligent data fetching
- Custom React hooks for reusable query logic
- Environment-based configuration for security

### Testing & Quality
- **Vitest** + **Testing Library** for unit tests
- **jsdom** for DOM simulation
- Type checking across the entire codebase

## Project Setup

**Prerequisites**
- Node.js 18+ and npm ([install via nvm](https://github.com/nvm-sh/nvm))
- Supabase account with project credentials
- Environment variables (see below)

**Quick Start**

```bash
# Clone the repository
git clone https://github.com/Krut-in/DriftSignal.git
cd DriftSignal

# Install dependencies
npm install

# Configure environment variables
# Create .env file with:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

Application runs at `http://localhost:5173`

## Future Roadmap

### Predictive Analytics
Forecast revenue trends 3-6 months ahead using ML models. Identify churn risks before they happen with confidence-scored predictions.

### Multi-Currency Support
Handle global revenue streams automatically. Real-time exchange rates, localized formatting, and normalized period comparisons.

### Customizable Alerting
Set thresholds and get notified instantly. Alerts via email, Slack, or in-app when revenue drift exceeds your defined limits.

### Export & Reporting
One-click exports to PDF and Excel. Templated layouts with custom branding. Schedule automatic generation for recurring reports.

### Team Collaboration
Comment and annotate insights directly in the platform. Integrate with project management tools to close the loop between insight and action.

---

**Built with TypeScript, React, Supabase, and AI** | [Live Demo](https://drift-signal.lovable.app/)
