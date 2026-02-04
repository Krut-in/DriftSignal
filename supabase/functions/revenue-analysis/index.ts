import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { customers, totals, period } = await req.json();

    if (!customers || customers.length === 0) {
      return new Response(
        JSON.stringify({
          summary: "No customer data available for analysis.",
          topDriftingCustomers: [],
          rootCauses: [],
          recommendedActions: [],
          investigationQuestions: [],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Prepare data summary for AI
    const topDrifters = customers
      .filter((c: any) => c.revenueChangePercent < 0)
      .slice(0, 5)
      .map((c: any) => ({
        name: c.customerName,
        change: c.revenueChangePercent.toFixed(1),
        unpaid: c.unpaidAmount,
        credits: c.creditsApplied,
        daysOverdue: c.daysOutstanding,
      }));

    const highRiskCount = customers.filter((c: any) => c.riskLevel === 'high').length;
    const mediumRiskCount = customers.filter((c: any) => c.riskLevel === 'medium').length;

    const prompt = `You are a financial analyst assistant helping a CFO understand revenue changes.

Analyze this revenue data for ${period.month}/${period.year}:

TOTALS:
- Total Revenue: $${(totals.totalRevenue / 1000).toFixed(0)}K
- Previous Month Revenue: $${(totals.previousTotalRevenue / 1000).toFixed(0)}K
- Revenue Change: ${totals.revenueDriftPercent.toFixed(1)}%
- Outstanding AR: $${(totals.totalUnpaid / 1000).toFixed(0)}K
- Credits Applied: $${(totals.totalCredits / 1000).toFixed(0)}K
- High Risk Customers: ${highRiskCount}
- Medium Risk Customers: ${mediumRiskCount}

TOP DECLINING CUSTOMERS:
${topDrifters.map((c: any) => `- ${c.name}: ${c.change}% change, $${(c.unpaid / 1000).toFixed(0)}K unpaid, ${c.daysOverdue} days overdue`).join('\n')}

Provide actionable insights for a CFO in plain business language.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'You are a financial analyst providing CFO-level revenue insights. Be concise, actionable, and focus on business impact.' },
          { role: 'user', content: prompt },
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'analyze_revenue_drift',
            description: 'Provide structured revenue drift analysis',
            parameters: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: '2-3 sentence executive summary of revenue changes and key drivers'
                },
                topDriftingCustomers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      revenueChange: { type: 'string' },
                      primaryReason: { type: 'string' }
                    },
                    required: ['name', 'revenueChange', 'primaryReason']
                  }
                },
                rootCauses: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of likely root causes for revenue drift'
                },
                recommendedActions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      action: { type: 'string' },
                      priority: { type: 'string', enum: ['urgent', 'high', 'medium'] },
                      targetCustomer: { type: 'string' }
                    },
                    required: ['action', 'priority']
                  }
                },
                investigationQuestions: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Questions the finance team should investigate'
                }
              },
              required: ['summary', 'topDriftingCustomers', 'rootCauses', 'recommendedActions', 'investigationQuestions']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'analyze_revenue_drift' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    console.log('AI Response:', JSON.stringify(aiResult));

    // Extract tool call result
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const analysis = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify(analysis),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback if no tool call
    return new Response(
      JSON.stringify({
        summary: aiResult.choices?.[0]?.message?.content || 'Unable to generate analysis.',
        topDriftingCustomers: [],
        rootCauses: [],
        recommendedActions: [],
        investigationQuestions: [],
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in revenue-analysis:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
