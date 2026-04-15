import { useEffect, useState, useMemo, useCallback } from "react";

import { ArrowUpDown, Search, SlidersHorizontal, X, LayoutGrid, List, Map } from "lucide-react";
import { useMemories } from "@/hooks/useMemories";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Memory } from "@/types/memory";
import Timeline, { MemorySortMode, ViewMode, sortMemories } from "@/components/Timeline";
import AddMemoryForm from "@/components/AddMemoryForm";
import MemoryMap from "@/components/MemoryMap";
import BottomNav from "@/components/BottomNav";
import UserAvatar from "@/components/UserAvatar";
import AudioToggleButton from "@/components/AudioToggleButton";
import FilterDrawer from "@/components/FilterDrawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { endOfDay, format, parseISO, startOfDay, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";
import { matchesLocationFilter } from "@/lib/locationFilter";
import type { LocationResult } from "@/components/LocationSearch";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const SORT_LABELS: Record<MemorySortMode, string> = {
  newest: "Newest on top",
  oldest: "Oldest on top",
  title: "Memory name",
  song: "Song name",
  artist: "Artist name",
};

const VIEW_MODES: ViewMode[] = ["cards", "list", "map"];
const SORT_MODES: MemorySortMode[] = ["newest", "oldest", "title", "song", "artist"];
const LIST_ONLY_SORT_MODES: MemorySortMode[] = ["title", "song", "artist"];
const DAY_MS = 24 * 60 * 60 * 1000;

const parseViewMode = (value: string | null): ViewMode => {
  return VIEW_MODES.includes(value as ViewMode) ? (value as ViewMode) : "cards";
};

const parseSortMode = (value: string | null, viewMode: ViewMode): MemorySortMode => {
  const sortMode = SORT_MODES.includes(value as MemorySortMode) ? (value as MemorySortMode) : "newest";
  return viewMode !== "list" && LIST_ONLY_SORT_MODES.includes(sortMode) ? "newest" : sortMode;
};

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { memories, loading, addMemory, updateMemory, deleteMemory } = useMemories();
  const [showForm, setShowForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [locationName, setLocationName] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [locationPlaceId, setLocationPlaceId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(() => parseViewMode(searchParams.get("view")));
  const [sortMode, setSortMode] = useState<MemorySortMode>(() => parseSortMode(searchParams.get("sort"), parseViewMode(searchParams.get("view"))));
  const [timelineDateRange, setTimelineDateRange] = useState<[number, number] | null>(null);

  useEffect(() => {
    const nextViewMode = parseViewMode(searchParams.get("view"));
    const nextSortMode = parseSortMode(searchParams.get("sort"), nextViewMode);
    setViewMode(nextViewMode);
    setSortMode(nextSortMode);
  }, [searchParams]);

  const updateJournalUrlState = useCallback((nextViewMode: ViewMode, nextSortMode: MemorySortMode) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("view", nextViewMode);
      next.set("sort", nextSortMode);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const selectViewMode = (nextViewMode: ViewMode) => {
    const nextSortMode = nextViewMode !== "list" && LIST_ONLY_SORT_MODES.includes(sortMode) ? "newest" : sortMode;
    setViewMode(nextViewMode);
    setSortMode(nextSortMode);
    updateJournalUrlState(nextViewMode, nextSortMode);
  };

  const selectSortMode = (nextSortMode: MemorySortMode) => {
    const safeSortMode = parseSortMode(nextSortMode, viewMode);
    setSortMode(safeSortMode);
    updateJournalUrlState(viewMode, safeSortMode);
  };

  useEffect(() => {
    if (viewMode !== "list" && LIST_ONLY_SORT_MODES.includes(sortMode)) {
      setSortMode("newest");
      updateJournalUrlState(viewMode, "newest");
    }
  }, [sortMode, updateJournalUrlState, viewMode]);

  const toggleMood = (mood: string) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedMoods([]);
    setSelectedTags([]);
    setDateFilter(undefined);
    setTimelineDateRange(null);
    setLocationName("");
    setLocationLat(null);
    setLocationLng(null);
    setLocationPlaceId(null);
  };

  const updateLocationFilter = (name: string, location?: LocationResult | null) => {
    setLocationName(name);

    if (location === null) {
      setLocationLat(null);
      setLocationLng(null);
      setLocationPlaceId(null);
      return;
    }

    if (location) {
      setLocationLat(location.lat);
      setLocationLng(location.lng);
      setLocationPlaceId(location.placeId);
    }
  };

  const TIMELINE_POSTS_PER_PAGE = 10;
  const LIST_POSTS_PER_PAGE = 20;
  const [page, setPage] = useState(1);

  const timelineDateBounds = useMemo(() => {
    const timestamps = memories
      .map((memory) => startOfDay(parseISO(memory.date)).getTime())
      .filter((timestamp) => Number.isFinite(timestamp));

    if (timestamps.length === 0) return null;

    return {
      min: Math.min(...timestamps),
      max: Math.max(...timestamps),
    };
  }, [memories]);

  useEffect(() => {
    if (!timelineDateBounds) {
      setTimelineDateRange(null);
      return;
    }

    setTimelineDateRange((current) => {
      if (!current) return null;

      const nextStart = Math.max(timelineDateBounds.min, Math.min(current[0], timelineDateBounds.max));
      const nextEnd = Math.max(timelineDateBounds.min, Math.min(current[1], timelineDateBounds.max));

      if (nextStart === timelineDateBounds.min && nextEnd === timelineDateBounds.max) return null;
      return [Math.min(nextStart, nextEnd), Math.max(nextStart, nextEnd)];
    });
  }, [timelineDateBounds]);

  const timelineSliderValue: [number, number] | null = timelineDateBounds
    ? timelineDateRange ?? ([timelineDateBounds.min, timelineDateBounds.max] as [number, number])
    : null;

  const timelineDateRangeActive = Boolean(
    viewMode === "cards" &&
    timelineDateBounds &&
    timelineDateRange &&
    (timelineDateRange[0] > timelineDateBounds.min || timelineDateRange[1] < timelineDateBounds.max)
  );

  const hasActiveFilters = searchQuery || selectedMoods.length > 0 || selectedTags.length > 0 || dateFilter || locationName || timelineDateRangeActive;
  const activeFilterCount = selectedMoods.length + selectedTags.length + (dateFilter ? 1 : 0) + (locationName ? 1 : 0) + (timelineDateRangeActive ? 1 : 0);

  const filtered = useMemo(() => {
    let result = memories;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.songTitle.toLowerCase().includes(q) ||
          m.artist.toLowerCase().includes(q) ||
          m.mood.toLowerCase().includes(q) ||
          (m.locationName?.toLowerCase().includes(q) ?? false) ||
          m.tags.some((tag) => tag.toLowerCase().includes(q)) ||
          m.people.some((p) => p.toLowerCase().includes(q))
      );
    }
    if (selectedMoods.length > 0) {
      result = result.filter((m) => {
        const memoryMoods = m.mood.split(",").map((s) => s.trim());
        return selectedMoods.some((sm) => memoryMoods.includes(sm));
      });
    }
    if (selectedTags.length > 0) {
      result = result.filter((m) =>
        selectedTags.some((tag) => m.tags.includes(tag))
      );
    }
    if (dateFilter) {
      const start = startOfMonth(dateFilter);
      const end = endOfMonth(dateFilter);
      result = result.filter((m) => {
        const d = parseISO(m.date);
        return d >= start && d <= end;
      });
    }
    if (locationName) {
      result = result.filter((m) => matchesLocationFilter(m, {
        name: locationName,
        lat: locationLat,
        lng: locationLng,
        placeId: locationPlaceId,
      }));
    }
    if (viewMode === "cards" && timelineDateBounds && timelineDateRangeActive && timelineDateRange) {
      const rangeStart = startOfDay(new Date(timelineDateRange[0]));
      const rangeEnd = endOfDay(new Date(timelineDateRange[1]));
      result = result.filter((m) => {
        const date = parseISO(m.date);
        return date >= rangeStart && date <= rangeEnd;
      });
    }
    return result;
  }, [memories, searchQuery, selectedMoods, selectedTags, dateFilter, locationName, locationLat, locationLng, locationPlaceId, timelineDateBounds, timelineDateRange, timelineDateRangeActive, viewMode]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedMoods, selectedTags, dateFilter, locationName, sortMode, timelineDateRange, viewMode]);

  const sortedFiltered = useMemo(() => {
    return sortMemories(filtered, sortMode);
  }, [filtered, sortMode]);

  const memoriesPerPage = viewMode === "list" ? LIST_POSTS_PER_PAGE : TIMELINE_POSTS_PER_PAGE;

  const paginatedMemories = useMemo(() => {
    return sortedFiltered.slice(0, page * memoriesPerPage);
  }, [memoriesPerPage, sortedFiltered, page]);

  const hasMorePages = paginatedMemories.length < sortedFiltered.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="font-display text-xl font-bold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Recall.fm
          </button>
          <div className="flex items-center gap-2">
            <AudioToggleButton />
            <UserAvatar />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        <p className="text-sm text-muted-foreground mb-4">Your personal collection of song-linked memories.</p>
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Quick search memories…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-10"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X size={14} />
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="relative shrink-0"
                aria-label={`Sort memories by ${SORT_LABELS[sortMode]}`}
              >
                <ArrowUpDown size={16} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sortMode}
                onValueChange={(value) => selectSortMode(value as MemorySortMode)}
              >
                <DropdownMenuRadioItem value="newest">Newest on top</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="oldest">Oldest on top</DropdownMenuRadioItem>
                {viewMode === "list" && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuRadioItem value="title">Memory name</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="song">Song name</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="artist">Artist name</DropdownMenuRadioItem>
                  </>
                )}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="icon"
            onClick={() => setShowFilters(true)}
            className="relative shrink-0"
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-20">Loading memories...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">{hasActiveFilters ? "🔍" : "🎵"}</p>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">
              {hasActiveFilters ? "No matches" : "No memories yet"}
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              {hasActiveFilters ? "Try adjusting your filters" : "Every song holds a story. Start capturing yours."}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={() => setShowForm(true)}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Create your first memory
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-muted-foreground">
                {filtered.length} {filtered.length === 1 ? "memory" : "memories"} {hasActiveFilters ? "found" : "saved"}
              </p>
              <div className="flex items-center gap-0.5 rounded-lg border border-border bg-card p-1">
                <button
                  onClick={() => selectViewMode("cards")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Timeline view"
                >
                  <LayoutGrid size={14} />
                  <span>Timeline</span>
                </button>
                <button
                  onClick={() => selectViewMode("list")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="List view"
                >
                  <List size={14} />
                  <span>List</span>
                </button>
                <button
                  onClick={() => selectViewMode("map")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                    viewMode === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Map view"
                >
                  <Map size={14} />
                  <span>Map</span>
                </button>
              </div>
            </div>
            {viewMode === "cards" && timelineDateBounds && timelineSliderValue && timelineDateBounds.min < timelineDateBounds.max && (
              <div className="mb-4 rounded-lg border border-border bg-card px-4 py-3">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Timeline range</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(timelineSliderValue[0]), "MMM d, yyyy")} - {format(new Date(timelineSliderValue[1]), "MMM d, yyyy")}
                    </p>
                  </div>
                  {timelineDateRangeActive && (
                    <button
                      type="button"
                      onClick={() => setTimelineDateRange(null)}
                      className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <Slider
                  min={timelineDateBounds.min}
                  max={timelineDateBounds.max}
                  step={DAY_MS}
                  minStepsBetweenThumbs={1}
                  value={timelineSliderValue}
                  onValueChange={(value) => {
                    if (value.length < 2 || !timelineDateBounds) return;
                    const nextRange: [number, number] = [Math.min(value[0], value[1]), Math.max(value[0], value[1])];
                    if (nextRange[0] <= timelineDateBounds.min && nextRange[1] >= timelineDateBounds.max) {
                      setTimelineDateRange(null);
                      return;
                    }
                    setTimelineDateRange(nextRange);
                  }}
                  aria-label="Timeline date range"
                />
              </div>
            )}
            {viewMode === "map" ? (
              <MemoryMap memories={sortedFiltered} />
            ) : (
              <Timeline memories={paginatedMemories} viewMode={viewMode} sortMode={sortMode} />
            )}
            {viewMode !== "map" && hasMorePages && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                className="w-full mt-4 text-xs text-muted-foreground"
              >
                Show more ({sortedFiltered.length - paginatedMemories.length} remaining)
              </Button>
            )}
          </>
        )}
      </main>

      <BottomNav onNewMemory={() => setShowForm(true)} />

      <FilterDrawer
        open={showFilters}
        onOpenChange={setShowFilters}
        selectedMoods={selectedMoods}
        selectedTags={selectedTags}
        dateFilter={dateFilter}
        searchQuery={searchQuery}
        locationName={locationName}
        onToggleMood={toggleMood}
        onToggleTag={toggleTag}
        onDateFilterChange={setDateFilter}
        onLocationChange={updateLocationFilter}
        onClearFilters={clearFilters}
        onSearchChange={setSearchQuery}
      />

      {showForm && (
        <AddMemoryForm
          onAdd={(data) => {
            const memoryData = { ...data, tags: data.tags ?? [] };
            if (editingMemory) {
              updateMemory(editingMemory.id, memoryData);
            } else {
              addMemory(memoryData);
              navigate("/journal");
            }
          }}
          onClose={() => { setShowForm(false); setEditingMemory(null); }}
          editingMemory={editingMemory}
        />
      )}
    </div>
  );
};

export default Index;
