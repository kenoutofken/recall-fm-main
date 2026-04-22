import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Flower, Leaf, Snowflake, Sun } from "lucide-react";
import { Memory } from "@/types/memory";
import MemoryCard from "@/components/MemoryCard";
import MemoryListItem from "@/components/MemoryListItem";
import { formatMemoryTime, seasonFromDate, yearFromDate } from "@/lib/memoryTime";

export type ViewMode = "cards" | "list" | "map";
export type MemorySortMode = "newest" | "oldest" | "title" | "song" | "artist";

// Shared by the journal page and the timeline so all views use the same sort behavior.
export const sortMemories = (memories: Memory[], sortMode: MemorySortMode) => {
  return [...memories].sort((a, b) => {
    if (sortMode === "oldest") {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }

    if (sortMode === "title") {
      return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
    }

    if (sortMode === "song") {
      return a.songTitle.localeCompare(b.songTitle, undefined, { sensitivity: "base" });
    }

    if (sortMode === "artist") {
      return a.artist.localeCompare(b.artist, undefined, { sensitivity: "base" });
    }

    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
};

const getSeasonIcon = (memory: Memory) => {
  const season = memory.memorySeason ?? seasonFromDate(memory.date);
  if (season === "Spring") return Flower;
  if (season === "Summer") return Sun;
  if (season === "Fall") return Leaf;
  return Snowflake;
};

interface TimelineProps {
  memories: Memory[];
  viewMode?: ViewMode;
  sortMode?: MemorySortMode;
}

const Timeline = ({ memories, viewMode = "cards", sortMode = "newest" }: TimelineProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const openMemoryDetail = (memory: Memory) => {
    navigate(`/journal/memories/${memory.id}`, {
      state: {
        from: {
          pathname: location.pathname,
          search: location.search,
        },
      },
    });
  };

  const sorted = useMemo(() => {
    return sortMemories(memories, sortMode);
  }, [memories, sortMode]);

  const grouped = useMemo(() => {
    // The timeline groups entries by the remembered season/year, falling back to the saved date.
    const map = new Map<string, Memory[]>();
    sorted.forEach((m) => {
      const year = m.memoryYear ?? yearFromDate(m.date);
      const season = m.memorySeason ?? seasonFromDate(m.date);
      const key = `${year}-${season}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return Array.from(map.entries());
  }, [sorted]);

  if (viewMode === "list") {
    return (
      <div>
        {sorted.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            No memories for this period.
          </p>
        ) : (
          <div className="space-y-2">
            {sorted.map((memory, i) => (
              <motion.div
                key={memory.id}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.2, delay: i * 0.02 }}
              >
                <MemoryListItem
                  memory={memory}
                  onClick={openMemoryDetail}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      {grouped.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">
          No memories for this period.
        </p>
      ) : (
        <div className="relative">
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-primary/70" />

          {grouped.map(([monthKey, items]) => {
            const SeasonIcon = getSeasonIcon(items[0]);

            return (
              <div key={monthKey} className="mb-8">
                <div className="relative flex items-center gap-3 mb-4">
                  <div className="relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <SeasonIcon size={17} strokeWidth={2.4} aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-base font-semibold text-foreground">
                    {formatMemoryTime(items[0])}
                    {items.length > 1 && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({items.length})
                      </span>
                    )}
                  </h2>
                </div>

                <div className={`pl-[38px] ${viewMode === "list" ? "space-y-1.5" : "space-y-4"}`}>
                  {items.map((memory, i) => (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                    >
                      <div className="relative">
                        <div className={`absolute -left-[27px] ${viewMode === "list" ? "top-3" : "top-5"} h-2 w-2 rounded-full bg-primary`} />
                        {viewMode === "list" ? (
                          <MemoryListItem
                            memory={memory}
                            onClick={openMemoryDetail}
                          />
                        ) : (
                          <MemoryCard memory={memory} onClick={openMemoryDetail} index={0} />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Timeline;
