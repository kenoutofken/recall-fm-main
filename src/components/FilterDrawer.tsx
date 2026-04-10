import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, X } from "lucide-react";
import { MOODS, MEMORY_TYPES } from "@/types/memory";
import TimePeriodPicker from "@/components/TimePeriodPicker";
import { cn } from "@/lib/utils";

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMoods: string[];
  selectedTags: string[];
  dateFilter: Date | undefined;
  searchQuery: string;
  onToggleMood: (mood: string) => void;
  onToggleTag: (tag: string) => void;
  onDateFilterChange: (date: Date | undefined) => void;
  onClearFilters: () => void;
  onSearchChange: (query: string) => void;
}

const FilterDrawer = ({
  open,
  onOpenChange,
  selectedMoods,
  selectedTags,
  dateFilter,
  searchQuery,
  onToggleMood,
  onToggleTag,
  onDateFilterChange,
  onClearFilters,
  onSearchChange,
}: FilterDrawerProps) => {
  const hasActiveFilters =
    searchQuery || selectedMoods.length > 0 || selectedTags.length > 0 || dateFilter;

  const activeFilterCount =
    selectedMoods.length + selectedTags.length + (dateFilter ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[85vh] sm:h-[70vh] flex flex-col rounded-t-2xl p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 font-display">
            <SlidersHorizontal size={18} className="text-primary" />
            Filters
            {activeFilterCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Search */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Search</p>
            <div className="relative">
              <input
                type="text"
                placeholder="Search memories, songs, artists..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Mood Filter */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Mood</p>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => {
                const label = `${mood.emoji} ${mood.label}`;
                const active = selectedMoods.includes(label);
                return (
                  <Badge
                    key={mood.label}
                    variant={active ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors text-sm py-1.5 px-3",
                      active && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => onToggleMood(label)}
                  >
                    {mood.emoji} {mood.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Memory Type Filter */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Memory Type</p>
            <div className="flex flex-wrap gap-2">
              {MEMORY_TYPES.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <Badge
                    key={tag}
                    variant={active ? "default" : "outline"}
                    className={cn(
                      "cursor-pointer transition-colors text-sm py-1.5 px-3",
                      active && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => onToggleTag(tag)}
                  >
                    {tag}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* Time Period */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Time Period</p>
            <TimePeriodPicker
              dateFilter={dateFilter}
              onDateFilterChange={onDateFilterChange}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-5 py-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="text-muted-foreground"
          >
            Clear all
          </Button>
          <Button onClick={() => onOpenChange(false)} className="flex-1">
            Show results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterDrawer;
