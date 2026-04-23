import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

interface TimePeriodPickerProps {
  dateFilter: Date | undefined;
  onDateFilterChange: (date: Date | undefined) => void;
}

const TimePeriodPicker = ({ dateFilter, onDateFilterChange }: TimePeriodPickerProps) => {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => dateFilter?.getFullYear() ?? new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const handleSelect = (monthIdx: number) => {
    const selected = new Date(viewYear, monthIdx, 1);
    // If already selected, deselect
    if (dateFilter && dateFilter.getFullYear() === viewYear && dateFilter.getMonth() === monthIdx) {
      onDateFilterChange(undefined);
    } else {
      onDateFilterChange(selected);
    }
    setOpen(false);
  };

  const label = dateFilter
    ? `${MONTH_LABELS[dateFilter.getMonth()]} ${dateFilter.getFullYear()}`
    : "Latest";

  return (
    <div className="flex items-center gap-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "gap-1.5 rounded-full border-2 border-foreground/70 bg-white px-4 shadow-sm",
              dateFilter && "border-primary bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            )}
          >
            <Calendar size={14} />
            <span>{label}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-3 pointer-events-auto" align="start">
          {/* Year navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewYear((y) => y - 1)}
              className="rounded-full border-2 border-foreground/70 bg-white p-1 text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-semibold text-foreground">{viewYear}</span>
            <button
              onClick={() => setViewYear((y) => y + 1)}
              disabled={viewYear >= currentYear}
              className="rounded-full border-2 border-foreground/70 bg-white p-1 text-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-20"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Month grid */}
          <div className="grid grid-cols-4 gap-1.5">
            {MONTH_LABELS.map((m, idx) => {
              const isFuture = viewYear === currentYear && idx > currentMonth;
              const isSelected =
                dateFilter &&
                dateFilter.getFullYear() === viewYear &&
                dateFilter.getMonth() === idx;

              return (
                <button
                  key={m}
                  onClick={() => !isFuture && handleSelect(idx)}
                  disabled={isFuture}
                  className={cn(
                    "rounded-md border-2 py-2 text-xs font-medium shadow-sm transition-all",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : isFuture
                      ? "border-border text-muted-foreground/30 cursor-default"
                      : "border-foreground/70 bg-white text-foreground hover:bg-muted"
                  )}
                >
                  {m}
                </button>
              );
            })}
          </div>

          {/* Reset to latest */}
          {dateFilter && (
            <button
              onClick={() => { onDateFilterChange(undefined); setOpen(false); }}
              className="mt-3 w-full rounded-full border-2 border-foreground/70 bg-white px-3 py-2 text-center text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
            >
              Reset to Latest
            </button>
          )}
        </PopoverContent>
      </Popover>

      {dateFilter && (
        <button
          onClick={() => onDateFilterChange(undefined)}
          className="rounded-full border-2 border-foreground/70 bg-white p-1 text-foreground shadow-sm transition-colors hover:bg-muted"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default TimePeriodPicker;
