import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSelectorProps {
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
}

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export function MonthSelector({ month, year, onMonthChange, onYearChange }: MonthSelectorProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handlePreviousMonth = () => {
    if (month === 1) {
      onMonthChange(12);
      onYearChange(year - 1);
    } else {
      onMonthChange(month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(1);
      onYearChange(year + 1);
    } else {
      onMonthChange(month + 1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousMonth}
        className="h-9 w-9 border-accent-indigo/20 hover:border-accent-indigo/40 hover:bg-accent-indigo/10 hover:shadow-md hover:shadow-accent-indigo/10 transition-all duration-300"
      >
        <ChevronLeft className="h-4 w-4 text-accent-indigo" />
      </Button>

      <Select value={String(month)} onValueChange={(v) => onMonthChange(Number(v))}>
        <SelectTrigger className="w-[140px] bg-card border-accent-indigo/20 focus:ring-accent-indigo/30 transition-all duration-300 hover:border-accent-indigo/40 hover:shadow-md hover:shadow-accent-indigo/10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {months.map((m) => (
            <SelectItem key={m.value} value={String(m.value)}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={String(year)} onValueChange={(v) => onYearChange(Number(v))}>
        <SelectTrigger className="w-[100px] bg-card border-accent-indigo/20 focus:ring-accent-indigo/30 transition-all duration-300 hover:border-accent-indigo/40 hover:shadow-md hover:shadow-accent-indigo/10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        className="h-9 w-9 border-accent-indigo/20 hover:border-accent-indigo/40 hover:bg-accent-indigo/10 hover:shadow-md hover:shadow-accent-indigo/10 transition-all duration-300"
      >
        <ChevronRight className="h-4 w-4 text-accent-indigo" />
      </Button>
    </div>
  );
}
