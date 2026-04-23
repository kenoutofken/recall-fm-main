import { useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { Flower, Leaf, Snowflake, Sun } from "lucide-react";
import { Memory } from "@/types/memory";
import MemoryCard from "@/components/MemoryCard";
import MemoryListItem from "@/components/MemoryListItem";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { formatMemoryTime, seasonFromDate, yearFromDate } from "@/lib/memoryTime";
import { cn } from "@/lib/utils";

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

type TimelineGroup = {
  key: string;
  year: number;
  season: string;
  items: Memory[];
};

type TimelineYearGroup = {
  year: number;
  groups: TimelineGroup[];
};

interface TimelineProps {
  memories: Memory[];
  viewMode?: ViewMode;
  sortMode?: MemorySortMode;
  detailState?: unknown;
  onMemorySelect?: (memory: Memory) => void;
}

const Timeline = ({ memories, viewMode = "cards", sortMode = "newest", detailState, onMemorySelect }: TimelineProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const openMemoryDetail = (memory: Memory) => {
    if (onMemorySelect) {
      onMemorySelect(memory);
      return;
    }

    navigate(`/journal/memories/${memory.id}`, {
      state: {
        from: {
          pathname: location.pathname,
          search: location.search,
          uiState: detailState,
        },
      },
    });
  };

  const sorted = useMemo(() => {
    return sortMemories(memories, sortMode);
  }, [memories, sortMode]);

  const grouped = useMemo(() => {
    // The timeline groups entries by the remembered season/year, falling back to the saved date.
    const map = new Map<string, TimelineGroup>();
    sorted.forEach((m) => {
      const year = m.memoryYear ?? yearFromDate(m.date);
      const season = m.memorySeason ?? seasonFromDate(m.date);
      const key = `${year}-${season}`;
      if (!map.has(key)) {
        map.set(key, { key, year, season, items: [] });
      }
      map.get(key)!.items.push(m);
    });
    return Array.from(map.entries());
  }, [sorted]);

  const groupedByYear = useMemo(() => {
    const map = new Map<number, TimelineYearGroup>();

    grouped.forEach(([, group]) => {
      if (!map.has(group.year)) {
        map.set(group.year, { year: group.year, groups: [] });
      }

      map.get(group.year)!.groups.push(group);
    });

    return Array.from(map.values());
  }, [grouped]);

  const defaultOpenYears = useMemo(() => {
    return groupedByYear.slice(0, 2).map((group) => String(group.year));
  }, [groupedByYear]);

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
        <Accordion
          type="multiple"
          defaultValue={defaultOpenYears}
          className="space-y-3"
        >
          {groupedByYear.map((yearGroup) => (
            <AccordionItem
              key={yearGroup.year}
              value={String(yearGroup.year)}
              className="card-strong overflow-hidden rounded-3xl border-primary/35 bg-white/95 px-0 shadow-sm"
            >
              <AccordionTrigger className="px-5 py-4 text-left no-underline hover:no-underline">
                <div className="min-w-0 flex-1">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-foreground">{yearGroup.year}</div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                      {yearGroup.groups.reduce((count, group) => count + group.items.length, 0)} memories
                    </p>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 pt-0">
                <div className="space-y-5 border-t border-primary/10 pt-4">
                  {yearGroup.groups.map((group) => {
                    const SeasonIcon = getSeasonIcon(group.items[0]);

                    return (
                      <section key={group.key} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1.5 rounded-full border-2 border-foreground/70 bg-white px-3 py-1 text-xs font-semibold text-foreground shadow-sm">
                            <SeasonIcon size={13} className="text-primary" strokeWidth={2.2} aria-hidden="true" />
                            <span>{group.season}</span>
                            {group.items.length > 1 && (
                              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-foreground">
                                {group.items.length}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          {group.items.map((memory, i) => (
                            <motion.div
                              key={memory.id}
                              initial={{ opacity: 0, y: 8 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true, margin: "-40px" }}
                              transition={{ duration: 0.22, delay: i * 0.03 }}
                            >
                              <MemoryCard memory={memory} onClick={openMemoryDetail} index={0} />
                            </motion.div>
                          ))}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

    </div>
  );
};

export default Timeline;
