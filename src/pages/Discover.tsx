import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useMemories } from "@/hooks/useMemories";
import AddMemoryForm from "@/components/AddMemoryForm";
import { Memory, MOODS, MEMORY_TYPES } from "@/types/memory";
import { Calendar, SlidersHorizontal, X, Search, Heart, Bookmark, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import AISuggestDrawer from "@/components/AISuggestDrawer";
import FilterDrawer from "@/components/FilterDrawer";
import { useLikes } from "@/hooks/useLikes";
import { usePlaylist } from "@/hooks/usePlaylist";
import MiniPlayer from "@/components/MiniPlayer";
import BottomNav from "@/components/BottomNav";
import UserAvatar from "@/components/UserAvatar";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { motion, AnimatePresence, type PanInfo } from "framer-motion";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const SWIPE_THRESHOLD = 60;

const MOOD_GRADIENTS: Record<string, string> = {
  Joyful: "bg-gradient-to-br from-amber-300 to-orange-400",
  Melancholy: "bg-gradient-to-br from-slate-400 to-blue-500",
  Energized: "bg-gradient-to-br from-red-400 to-rose-500",
  Nostalgic: "bg-gradient-to-br from-indigo-400 to-purple-500",
  Peaceful: "bg-gradient-to-br from-pink-300 to-rose-300",
  Heartbreak: "bg-gradient-to-br from-rose-500 to-red-600",
  Inspired: "bg-gradient-to-br from-yellow-300 to-amber-400",
  Bittersweet: "bg-gradient-to-br from-orange-400 to-amber-600",
};

const getMoodGradient = (mood: string) => {
  const first = mood.split(",")[0].trim();
  const label = MOODS.find((m) => first.includes(m.label))?.label ?? "Nostalgic";
  return MOOD_GRADIENTS[label] ?? "bg-gradient-to-br from-muted to-muted-foreground/20";
};

const Discover = () => {
  const { addMemory } = useMemories();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [expandedMemory, setExpandedMemory] = useState<Memory | null>(null);
  const [showAISuggest, setShowAISuggest] = useState(false);
  const [aiFilterIds, setAiFilterIds] = useState<string[] | null>(null);
  const [aiReason, setAiReason] = useState("");
  useEffect(() => {
    const fetchPublic = async () => {
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load discoveries");
        console.error(error);
      } else {
        setMemories(
          (data ?? []).map((r) => ({
            id: r.id,
            title: r.title,
            description: r.description ?? "",
            songTitle: r.song_title,
            artist: r.artist,
            date: r.date,
            mood: r.mood,
            people: r.people ?? [],
            isPublic: true,
            imageUrl: r.image_url ?? null,
            tags: r.tags ?? [],
            createdAt: r.created_at,
          }))
        );
      }
      setLoading(false);
    };
    fetchPublic();
  }, []);

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
    setAiFilterIds(null);
    setAiReason("");
  };

  const hasActiveFilters = searchQuery || selectedMoods.length > 0 || selectedTags.length > 0 || dateFilter || aiFilterIds !== null;

  const filtered = useMemo(() => {
    let result = memories;
    // AI filter takes priority
    if (aiFilterIds !== null) {
      result = aiFilterIds
        .map((id) => result.find((m) => m.id === id))
        .filter(Boolean) as Memory[];
    }
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
  }, [memories, searchQuery, selectedMoods, selectedTags, dateFilter, aiFilterIds]);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchQuery, selectedMoods, selectedTags, dateFilter]);

  const memoryIds = useMemo(() => filtered.map((m) => m.id), [filtered]);
  const { likeCounts, userLikes, toggleLike } = useLikes(memoryIds);
  const { songs, addSong, removeSong, isSongInPlaylist } = usePlaylist();

  const goNext = useCallback(() => {
    if (currentIndex < filtered.length - 1) {
      setDirection(1);
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, filtered.length]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) goNext();
    else if (info.offset.x > SWIPE_THRESHOLD) goPrev();
  };

  const currentMemory = filtered[currentIndex];

  const _ = direction; // used by swipe handlers

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-foreground">Recall.fm</span>
            <span className="text-muted-foreground/30">|</span>
            <h1 className="font-display text-xl font-normal text-foreground">Discover</h1>
          </div>
          <UserAvatar />
        </div>
      </header>

      <main className="flex-1 min-h-0 max-w-lg mx-auto w-full px-4 py-4 pb-24 flex flex-col">
        {/* Search and Filter Button */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search memories…"
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
          <Button
            variant={aiFilterIds !== null ? "secondary" : "outline"}
            size="icon"
            onClick={() => setShowAISuggest(true)}
            className={cn("shrink-0", aiFilterIds !== null ? "border-primary text-primary" : "border-primary/30 text-primary hover:bg-primary/10")}
            title="AI Suggest"
          >
            <Sparkles size={16} />
          </Button>
          <Button
            variant={showFilters ? "secondary" : "outline"}
            size="icon"
            onClick={() => setShowFilters(true)}
            className="relative shrink-0"
          >
            <SlidersHorizontal size={16} />
            {(selectedMoods.length + selectedTags.length + (dateFilter ? 1 : 0)) > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                {selectedMoods.length + selectedTags.length + (dateFilter ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>

        {/* AI filter banner */}
        {aiFilterIds !== null && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
            <Sparkles size={14} className="text-primary shrink-0" />
            <p className="text-xs text-foreground flex-1">{aiReason || "Showing AI-curated results"}</p>
            <button
              onClick={() => { setAiFilterIds(null); setAiReason(""); }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Card area */}
        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-20">Loading discoveries...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">{hasActiveFilters ? "🔍" : "🌍"}</p>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">
              {hasActiveFilters ? "No matches" : "Nothing here yet"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasActiveFilters ? "Try adjusting your filters" : "Be the first to share a memory publicly!"}
            </p>
          </div>
        ) : (
          <div className="flex-1 min-h-0">
            {/* Carousel */}
            <div className="relative overflow-hidden">
              <div
                className="flex gap-3 transition-transform duration-300 ease-out"
                style={{
                  height: "calc(100vh - 280px)",
                  transform: `translateX(calc(-${currentIndex} * 100% - ${currentIndex} * 12px))`,
                }}
              >
                {filtered.map((mem, i) => (
                  <motion.div
                    key={mem.id}
                    className={cn(
                      "shrink-0 cursor-grab active:cursor-grabbing transition-opacity duration-300 h-full w-full",
                      i === currentIndex ? "opacity-100" : "opacity-40"
                    )}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.4}
                    onDragEnd={handleDragEnd}
                  >
                    <div
                      className="rounded-lg border border-border bg-card overflow-hidden grid h-full cursor-pointer relative"
                      style={{ gridTemplateRows: "1fr auto" }}
                      onClick={() => setExpandedMemory(mem)}
                    >
                      <div className={cn("w-full overflow-hidden min-h-0 relative", !mem.imageUrl && getMoodGradient(mem.mood))}>
                        {mem.imageUrl && <img src={mem.imageUrl} alt="" className="size-full object-cover" />}
                        <div className="absolute bottom-0 left-0 right-0 p-3" onClick={(e) => e.stopPropagation()}>
                          <MiniPlayer songTitle={mem.songTitle} artist={mem.artist} autoPlay={i === currentIndex} variant="overlay" />
                        </div>
                        {i === currentIndex && (
                          <>
                            <button
                              onClick={(e) => { e.stopPropagation(); goPrev(); }}
                              disabled={currentIndex === 0}
                              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-0 transition-all"
                            >
                              <ChevronLeft size={18} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); goNext(); }}
                              disabled={currentIndex >= filtered.length - 1}
                              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 disabled:opacity-0 transition-all"
                            >
                              <ChevronRight size={18} />
                            </button>
                          </>
                        )}
                      </div>
                      <div className="px-5 py-4 flex flex-col">
                        <h3 className="font-display text-lg font-semibold leading-snug mb-2 text-foreground shrink-0">
                          {mem.title}
                        </h3>
                        <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar size={12} />
                            <span>{format(new Date(mem.date), "MMM d, yyyy")}</span>
                          </div>
                          <div className="flex items-center gap-3">
                              <button
                                onClick={() => {
                                  const wasLiked = userLikes.has(mem.id);
                                  toggleLike(mem.id);
                                  toast.success(wasLiked ? "Removed like" : "Liked this memory!");
                                }}
                                className={cn(
                                  "flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors",
                                  userLikes.has(mem.id) && "text-foreground"
                                )}
                              >
                                <Heart
                                  size={20}
                                  className={userLikes.has(mem.id) ? "fill-foreground" : ""}
                                />
                                {(likeCounts[mem.id] || 0) > 0 && (
                                  <span className="text-xs">{likeCounts[mem.id]}</span>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  const inList = isSongInPlaylist(mem.songTitle, mem.artist);
                                  if (inList) {
                                    const song = songs.find(
                                      (s) => s.songTitle.toLowerCase() === mem.songTitle.toLowerCase() && s.artist.toLowerCase() === mem.artist.toLowerCase()
                                    );
                                    if (song) {
                                      removeSong(song.id);
                                      toast.success("Removed from your list");
                                    }
                                  } else {
                                    addSong(mem.songTitle, mem.artist, mem.id);
                                    toast.success("Added to your list!");
                                  }
                                }}
                                className={cn(
                                  "text-muted-foreground hover:text-foreground transition-colors",
                                  isSongInPlaylist(mem.songTitle, mem.artist) && "text-foreground"
                                )}
                              >
                                <Bookmark
                                  size={20}
                                  className={isSongInPlaylist(mem.songTitle, mem.artist) ? "fill-foreground" : ""}
                                />
                              </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

            </div>
          </div>
        )}
      </main>

      <BottomNav onNewMemory={() => setShowForm(true)} />

      {showForm && (
        <AddMemoryForm
          onAdd={addMemory}
          onClose={() => setShowForm(false)}
          editingMemory={null}
        />
      )}

      {expandedMemory && (
        <Dialog open onOpenChange={(open) => !open && setExpandedMemory(null)}>
          <DialogContent className="sm:max-w-md h-full sm:h-auto w-full sm:w-auto max-h-full sm:max-h-[85vh] rounded-none sm:rounded-lg flex flex-col p-0 gap-0 [&>button]:z-50">
            <div className="flex-1 overflow-y-auto p-6 pt-12 space-y-4">
              {expandedMemory.imageUrl && (
                <img src={expandedMemory.imageUrl} alt="" className="w-full h-48 object-cover rounded-md" />
              )}
              <DialogHeader>
                <DialogTitle className="font-display text-xl">{expandedMemory.title}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {expandedMemory.description}
              </p>
              <MiniPlayer songTitle={expandedMemory.songTitle} artist={expandedMemory.artist} />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar size={12} />
                  <span>{format(new Date(expandedMemory.date), "MMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const wasLiked = userLikes.has(expandedMemory.id);
                      toggleLike(expandedMemory.id);
                      toast.success(wasLiked ? "Removed like" : "Liked this memory!");
                    }}
                    className={cn(
                      "flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors",
                      userLikes.has(expandedMemory.id) && "text-foreground"
                    )}
                  >
                    <Heart size={20} className={userLikes.has(expandedMemory.id) ? "fill-foreground" : ""} />
                    {(likeCounts[expandedMemory.id] || 0) > 0 && (
                      <span className="text-xs">{likeCounts[expandedMemory.id]}</span>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const inList = isSongInPlaylist(expandedMemory.songTitle, expandedMemory.artist);
                      if (inList) {
                        const song = songs.find(
                          (s) => s.songTitle.toLowerCase() === expandedMemory.songTitle.toLowerCase() && s.artist.toLowerCase() === expandedMemory.artist.toLowerCase()
                        );
                        if (song) {
                          removeSong(song.id);
                          toast.success("Removed from your list");
                        }
                      } else {
                        addSong(expandedMemory.songTitle, expandedMemory.artist, expandedMemory.id);
                        toast.success("Added to your list!");
                      }
                    }}
                    className={cn(
                      "text-muted-foreground hover:text-foreground transition-colors",
                      isSongInPlaylist(expandedMemory.songTitle, expandedMemory.artist) && "text-foreground"
                    )}
                  >
                    <Bookmark size={20} className={isSongInPlaylist(expandedMemory.songTitle, expandedMemory.artist) ? "fill-foreground" : ""} />
                  </button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      <AISuggestDrawer
        open={showAISuggest}
        onOpenChange={setShowAISuggest}
        onResults={(ids, reason) => {
          setAiFilterIds(ids);
          setAiReason(reason);
          setCurrentIndex(0);
        }}
      />
      <FilterDrawer
        open={showFilters}
        onOpenChange={setShowFilters}
        selectedMoods={selectedMoods}
        selectedTags={selectedTags}
        dateFilter={dateFilter}
        searchQuery={searchQuery}
        onToggleMood={toggleMood}
        onToggleTag={toggleTag}
        onDateFilterChange={setDateFilter}
        onClearFilters={clearFilters}
        onSearchChange={setSearchQuery}
      />
    </div>
  );
};

export default Discover;
