import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Copy, Check, RefreshCw, AlertCircle, Lightbulb, HelpCircle, Target } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { RevenueAnalysis } from "@/types/revenue";
import { cn } from "@/lib/utils";

interface AIAnalysisPanelProps {
  analysis: RevenueAnalysis | undefined;
  isLoading?: boolean;
  error?: Error | null;
  onRegenerate?: () => void;
}

export function AIAnalysisPanel({ analysis, isLoading, error, onRegenerate }: AIAnalysisPanelProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    if (!analysis) return;

    const text = `
REVENUE DRIFT ANALYSIS

SUMMARY
${analysis.summary}

TOP DRIFTING CUSTOMERS
${analysis.topDriftingCustomers.map(c => `• ${c.name}: ${c.revenueChange} - ${c.primaryReason}`).join('\n')}

ROOT CAUSES
${analysis.rootCauses.map(c => `• ${c}`).join('\n')}

RECOMMENDED ACTIONS
${analysis.recommendedActions.map(a => `• [${a.priority.toUpperCase()}] ${a.action}${a.targetCustomer ? ` (${a.targetCustomer})` : ''}`).join('\n')}

QUESTIONS TO INVESTIGATE
${analysis.investigationQuestions.map(q => `• ${q}`).join('\n')}
    `.trim();

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "Analysis has been copied and is ready to paste.",
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-card border-destructive/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg text-destructive">
            <AlertCircle className="h-5 w-5" />
            Analysis Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          {onRegenerate && (
            <Button variant="outline" size="sm" className="mt-4" onClick={onRegenerate}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5" />
            AI Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Load revenue data to generate AI-powered insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive';
      case 'high': return 'bg-warning/10 text-warning';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Lightbulb className="h-5 w-5" />
          AI Analysis
        </CardTitle>
        <div className="flex items-center gap-2">
          {onRegenerate && (
            <Button variant="ghost" size="sm" onClick={onRegenerate}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={copyToClipboard}>
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Executive Summary */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-foreground">Executive Summary</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
        </div>

        {/* Top Drifting Customers */}
        {analysis.topDriftingCustomers.length > 0 && (
          <div>
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Target className="h-4 w-4" />
              Top Drifting Customers
            </h4>
            <div className="space-y-2">
              {analysis.topDriftingCustomers.map((customer, i) => (
                <div key={i} className="rounded-md bg-secondary/50 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{customer.name}</span>
                    <span className="text-sm text-destructive">{customer.revenueChange}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{customer.primaryReason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Root Causes */}
        {analysis.rootCauses.length > 0 && (
          <div>
            <h4 className="mb-2 text-sm font-semibold text-foreground">Likely Root Causes</h4>
            <ul className="space-y-1">
              {analysis.rootCauses.map((cause, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                  {cause}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommended Actions */}
        {analysis.recommendedActions.length > 0 && (
          <div>
            <h4 className="mb-3 text-sm font-semibold text-foreground">Recommended Actions</h4>
            <div className="space-y-2">
              {analysis.recommendedActions.map((action, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className={cn(
                    "mt-0.5 shrink-0 rounded px-2 py-0.5 text-xs font-medium uppercase",
                    getPriorityColor(action.priority)
                  )}>
                    {action.priority}
                  </span>
                  <div>
                    <p className="text-sm text-foreground">{action.action}</p>
                    {action.targetCustomer && (
                      <p className="text-xs text-muted-foreground">Target: {action.targetCustomer}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investigation Questions */}
        {analysis.investigationQuestions.length > 0 && (
          <div>
            <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <HelpCircle className="h-4 w-4" />
              Questions to Investigate
            </h4>
            <ul className="space-y-1">
              {analysis.investigationQuestions.map((question, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                  {question}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
