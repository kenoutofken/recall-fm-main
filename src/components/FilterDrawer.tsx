import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { SlidersHorizontal, X } from "lucide-react";
import { MOODS, MEMORY_TYPES } from "@/types/memory";
import TimePeriodPicker from "@/components/TimePeriodPicker";
import LocationSearch, { type LocationResult } from "@/components/LocationSearch";
import { cn } from "@/lib/utils";

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMoods: string[];
  selectedTags: string[];
  dateFilter: Date | undefined;
  searchQuery: string;
  locationName: string;
  onToggleMood: (mood: string) => void;
  onToggleTag: (tag: string) => void;
  onDateFilterChange: (date: Date | undefined) => void;
  onLocationChange: (value: string, location?: LocationResult | null) => void;
  onClearFilters: () => void;
  onSearchChange: (query: string) => void;
  timelineRangeLabel?: string;
  timelineRangeValue?: [number, number] | null;
  timelineRangeMin?: number;
  timelineRangeMax?: number;
  timelineRangeActive?: boolean;
  onTimelineRangeChange?: (value: [number, number]) => void;
  onTimelineRangeReset?: () => void;
}

const FilterDrawer = ({
  open,
  onOpenChange,
  selectedMoods,
  selectedTags,
  dateFilter,
  searchQuery,
  locationName,
  onToggleMood,
  onToggleTag,
  onDateFilterChange,
  onLocationChange,
  onClearFilters,
  onSearchChange,
  timelineRangeLabel,
  timelineRangeValue,
  timelineRangeMin,
  timelineRangeMax,
  timelineRangeActive = false,
  onTimelineRangeChange,
  onTimelineRangeReset,
}: FilterDrawerProps) => {
  const hasActiveFilters =
    searchQuery || selectedMoods.length > 0 || selectedTags.length > 0 || dateFilter || locationName || timelineRangeActive;

  const activeFilterCount =
    selectedMoods.length + selectedTags.length + (dateFilter ? 1 : 0) + (locationName ? 1 : 0) + (timelineRangeActive ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto flex h-[85vh] w-full max-w-lg flex-col rounded-t-2xl p-0 sm:h-[70vh]"
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
                className="w-full rounded-lg border-2 border-foreground/70 bg-white px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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

          {/* Place */}
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">Place</p>
              {locationName && (
                <button
                  type="button"
                  onClick={() => onLocationChange("", null)}
                  className="rounded-full border-2 border-foreground/70 bg-white px-2.5 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
                >
                  Clear
                </button>
              )}
            </div>
            <LocationSearch value={locationName} onChange={onLocationChange} maxLength={120} />
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
                      "cursor-pointer border-2 text-sm py-1.5 px-3 shadow-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-foreground/70 bg-white text-foreground hover:bg-muted"
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
                      "cursor-pointer border-2 text-sm py-1.5 px-3 shadow-sm transition-colors",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-foreground/70 bg-white text-foreground hover:bg-muted"
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

          {timelineRangeValue && typeof timelineRangeMin === "number" && typeof timelineRangeMax === "number" && onTimelineRangeChange && (
            <div className="card-strong rounded-2xl px-4 py-3">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Timeline range</p>
                  {timelineRangeLabel && (
                    <p className="text-xs text-muted-foreground">{timelineRangeLabel}</p>
                  )}
                </div>
                {timelineRangeActive && onTimelineRangeReset && (
                  <button
                    type="button"
                    onClick={onTimelineRangeReset}
                    className="rounded-full border-2 border-foreground/70 bg-white px-2.5 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
                  >
                    Reset
                  </button>
                )}
              </div>
              <Slider
                min={timelineRangeMin}
                max={timelineRangeMax}
                step={1}
                minStepsBetweenThumbs={1}
                value={timelineRangeValue}
                onValueChange={(value) => {
                  if (value.length < 2) return;
                  onTimelineRangeChange([Math.min(value[0], value[1]), Math.max(value[0], value[1])]);
                }}
                aria-label="Timeline season range"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-border px-5 py-4 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            onClick={onClearFilters}
            disabled={!hasActiveFilters}
            className="rounded-full border-2 border-foreground/70 bg-white px-4 text-foreground shadow-sm hover:bg-muted hover:text-foreground"
          >
            Clear all
          </Button>
          <Button onClick={() => onOpenChange(false)} className="flex-1 rounded-full border-2 border-primary bg-primary shadow-sm">
            Show results
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FilterDrawer;
