import { useState, useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RiskBadge } from "./RiskBadge";
import { Download, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import type { CustomerRevenue, RiskFilter, SortField, SortDirection } from "@/types/revenue";
import { cn } from "@/lib/utils";

interface CustomerDriftTableProps {
  customers: CustomerRevenue[];
  isLoading?: boolean;
}

function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function CustomerDriftTable({ customers, isLoading }: CustomerDriftTableProps) {
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("all");
  const [sortField, setSortField] = useState<SortField>("revenueChangePercent");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const filteredAndSorted = useMemo(() => {
    let result = [...customers];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter((c) => 
        c.customerName.toLowerCase().includes(searchLower)
      );
    }

    // Risk filter
    if (riskFilter !== "all") {
      result = result.filter((c) => c.riskLevel === riskFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "customerName":
          comparison = a.customerName.localeCompare(b.customerName);
          break;
        case "currentRevenue":
          comparison = a.currentRevenue - b.currentRevenue;
          break;
        case "revenueChangePercent":
          comparison = a.revenueChangePercent - b.revenueChangePercent;
          break;
        case "unpaidAmount":
          comparison = a.unpaidAmount - b.unpaidAmount;
          break;
        case "creditsApplied":
          comparison = a.creditsApplied - b.creditsApplied;
          break;
        case "riskLevel":
          const riskOrder = { high: 0, medium: 1, low: 2 };
          comparison = riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
          break;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return result;
  }, [customers, search, riskFilter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const exportToCSV = () => {
    const headers = ["Customer", "Revenue", "Change %", "Unpaid", "Credits", "Days Outstanding", "Risk"];
    const rows = filteredAndSorted.map((c) => [
      c.customerName,
      c.currentRevenue,
      c.revenueChangePercent.toFixed(1),
      c.unpaidAmount,
      c.creditsApplied,
      c.daysOutstanding,
      c.riskLevel,
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenue-drift-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    return sortDirection === "asc" 
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="h-10 w-64 animate-pulse rounded-md bg-muted" />
          <div className="flex gap-2">
            <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
            <div className="h-10 w-24 animate-pulse rounded-md bg-muted" />
          </div>
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-card"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={riskFilter} onValueChange={(v) => setRiskFilter(v as RiskFilter)}>
            <SelectTrigger className="w-[130px] bg-card">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risks</SelectItem>
              <SelectItem value="high">High Risk</SelectItem>
              <SelectItem value="medium">Medium Risk</SelectItem>
              <SelectItem value="low">Low Risk</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead 
                className="cursor-pointer select-none"
                onClick={() => handleSort("customerName")}
              >
                <div className="flex items-center gap-2">
                  Customer
                  <SortIcon field="customerName" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort("currentRevenue")}
              >
                <div className="flex items-center justify-end gap-2">
                  Revenue
                  <SortIcon field="currentRevenue" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort("revenueChangePercent")}
              >
                <div className="flex items-center justify-end gap-2">
                  Change
                  <SortIcon field="revenueChangePercent" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort("unpaidAmount")}
              >
                <div className="flex items-center justify-end gap-2">
                  Unpaid
                  <SortIcon field="unpaidAmount" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none text-right"
                onClick={() => handleSort("creditsApplied")}
              >
                <div className="flex items-center justify-end gap-2">
                  Credits
                  <SortIcon field="creditsApplied" />
                </div>
              </TableHead>
              <TableHead 
                className="cursor-pointer select-none text-center"
                onClick={() => handleSort("riskLevel")}
              >
                <div className="flex items-center justify-center gap-2">
                  Risk
                  <SortIcon field="riskLevel" />
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  No customers found
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSorted.map((customer) => (
                <TableRow key={customer.customerId}>
                  <TableCell className="font-medium">{customer.customerName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(customer.currentRevenue)}</TableCell>
                  <TableCell className={cn(
                    "text-right font-medium",
                    customer.revenueChangePercent >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatPercent(customer.revenueChangePercent)}
                  </TableCell>
                  <TableCell className="text-right">
                    {customer.unpaidAmount > 0 ? formatCurrency(customer.unpaidAmount) : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    {customer.creditsApplied > 0 ? formatCurrency(customer.creditsApplied) : '—'}
                  </TableCell>
                  <TableCell className="text-center">
                    <RiskBadge level={customer.riskLevel} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Showing {filteredAndSorted.length} of {customers.length} customers
      </p>
    </div>
  );
}
