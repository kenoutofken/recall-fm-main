import { useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface MonthPickerProps {
  /** Set of "yyyy-MM" strings that have memories */
  availableMonths: Set<string>;
  selectedMonth: string | null;
  onSelect: (month: string | null) => void;
}

const MonthPicker = ({ availableMonths, selectedMonth, onSelect }: MonthPickerProps) => {
  const [open, setOpen] = useState(false);

  // Derive available years
  const years = useMemo(() => {
    const s = new Set<number>();
    availableMonths.forEach((ym) => s.add(parseInt(ym.split("-")[0])));
    return Array.from(s).sort((a, b) => b - a);
  }, [availableMonths]);

  const [viewYear, setViewYear] = useState(() => years[0] ?? new Date().getFullYear());

  const handleSelect = (monthIdx: number) => {
    const key = `${viewYear}-${String(monthIdx + 1).padStart(2, "0")}`;
    if (selectedMonth === key) {
      onSelect(null);
    } else {
      onSelect(key);
    }
    setOpen(false);
  };

  const selectedLabel = selectedMonth
    ? format(parse(selectedMonth, "yyyy-MM", new Date()), "MMM yyyy")
    : "All time";

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors">
            <CalendarDays size={15} className="text-primary" />
            {selectedLabel}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[260px] p-3 pointer-events-auto" align="start">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewYear((y) => y - 1)}
              disabled={!years.includes(viewYear - 1)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted disabled:opacity-20 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="font-display text-sm font-semibold text-foreground">{viewYear}</span>
            <button
              onClick={() => setViewYear((y) => y + 1)}
              disabled={!years.includes(viewYear + 1)}
              className="rounded-full p-1 text-muted-foreground hover:bg-muted disabled:opacity-20 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_LABELS.map((label, idx) => {
              const key = `${viewYear}-${String(idx + 1).padStart(2, "0")}`;
              const hasMemories = availableMonths.has(key);
              const isSelected = selectedMonth === key;

              return (
                <button
                  key={label}
                  onClick={() => hasMemories && handleSelect(idx)}
                  disabled={!hasMemories}
                  className={`rounded-md py-2 text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : hasMemories
                      ? "bg-muted text-foreground hover:bg-primary/15"
                      : "text-muted-foreground/30 cursor-default"
                  }`}
                >
                  {label}
                  {hasMemories && (
                    <div
                      className={`mx-auto mt-0.5 h-1 w-1 rounded-full ${
                        isSelected ? "bg-primary-foreground" : "bg-primary"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>

      {selectedMonth && (
        <button
          onClick={() => onSelect(null)}
          className="flex items-center gap-1 rounded-full bg-muted px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default MonthPicker;
