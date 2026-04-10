import { useState, useMemo, useCallback } from "react";

import { Search, SlidersHorizontal, X, LayoutGrid, List } from "lucide-react";
import { useMemories } from "@/hooks/useMemories";

import { Memory, MOODS, MEMORY_TYPES } from "@/types/memory";
import Timeline, { ViewMode } from "@/components/Timeline";
import AddMemoryForm from "@/components/AddMemoryForm";
import BottomNav from "@/components/BottomNav";
import UserAvatar from "@/components/UserAvatar";
import TimePeriodPicker from "@/components/TimePeriodPicker";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { parseISO, startOfMonth, endOfMonth } from "date-fns";
import { cn } from "@/lib/utils";

const Index = () => {
  const { memories, loading, addMemory, updateMemory, deleteMemory } = useMemories();
  const [showForm, setShowForm] = useState(false);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("cards");

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
  };

  const hasActiveFilters = searchQuery || selectedMoods.length > 0 || selectedTags.length > 0 || dateFilter;

  const POSTS_PER_PAGE = 10;
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = memories;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.songTitle.toLowerCase().includes(q) ||
          m.artist.toLowerCase().includes(q) ||
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
    return result;
  }, [memories, searchQuery, selectedMoods, selectedTags, dateFilter]);

  // Reset page when filters change
  const prevFilteredLen = useMemo(() => filtered.length, [filtered]);
  useMemo(() => { setPage(1); }, [searchQuery, selectedMoods, selectedTags, dateFilter]);

  const paginatedMemories = useMemo(() => {
    return filtered.slice(0, page * POSTS_PER_PAGE);
  }, [filtered, page]);

  const hasMorePages = paginatedMemories.length < filtered.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-foreground">Recall.fm</span>
            <span className="text-muted-foreground/30">|</span>
            <h1 className="font-display text-xl font-normal text-foreground">Journal</h1>
          </div>
          <UserAvatar />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        <p className="text-sm text-muted-foreground mb-4">Your personal collection of song-linked memories.</p>
        <div className="mb-4 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search your memories…"
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

          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "secondary" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5"
            >
              <SlidersHorizontal size={14} />
              Filters
              {(selectedMoods.length + selectedTags.length) > 0 && (
                <span className="ml-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {selectedMoods.length + selectedTags.length}
                </span>
              )}
            </Button>

            <TimePeriodPicker dateFilter={dateFilter} onDateFilterChange={setDateFilter} />

            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-auto">
                Clear all
              </button>
            )}
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="rounded-lg border border-border bg-card p-4 space-y-4">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Mood</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MOODS.map((mood) => {
                        const label = `${mood.emoji} ${mood.label}`;
                        const active = selectedMoods.includes(label);
                        return (
                          <Badge
                            key={mood.label}
                            variant={active ? "default" : "outline"}
                            className={cn("cursor-pointer transition-colors text-xs", active && "bg-primary text-primary-foreground")}
                            onClick={() => toggleMood(label)}
                          >
                            {mood.emoji} {mood.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Memory Type</p>
                    <div className="flex flex-wrap gap-1.5">
                      {MEMORY_TYPES.map((tag) => {
                        const active = selectedTags.includes(tag);
                        return (
                          <Badge
                            key={tag}
                            variant={active ? "default" : "outline"}
                            className={cn("cursor-pointer transition-colors text-xs", active && "bg-primary text-primary-foreground")}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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
              <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
                <button
                  onClick={() => setViewMode("cards")}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    viewMode === "cards" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Card view"
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 rounded transition-colors",
                    viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="List view"
                >
                  <List size={14} />
                </button>
              </div>
            </div>
            <Timeline memories={paginatedMemories} onDelete={deleteMemory} onEdit={(m) => { setEditingMemory(m); setShowForm(true); }} viewMode={viewMode} />
            {hasMorePages && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                className="w-full mt-4 text-xs text-muted-foreground"
              >
                Show more ({filtered.length - paginatedMemories.length} remaining)
              </Button>
            )}
          </>
        )}
      </main>

      <BottomNav onNewMemory={() => setShowForm(true)} />

      {showForm && (
        <AddMemoryForm
          onAdd={(data) => {
            const memoryData = { ...data, tags: data.tags ?? [] };
            if (editingMemory) {
              updateMemory(editingMemory.id, memoryData);
            } else {
              addMemory(memoryData);
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
