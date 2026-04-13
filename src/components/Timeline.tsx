import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Memory } from "@/types/memory";
import MemoryCard from "@/components/MemoryCard";
import MemoryListItem from "@/components/MemoryListItem";
import { Button } from "@/components/ui/button";
import { formatMemoryTime, seasonFromDate, yearFromDate } from "@/lib/memoryTime";

const ITEMS_PER_PAGE = 10;

export type ViewMode = "cards" | "list" | "map";

interface TimelineProps {
  memories: Memory[];
  onDelete: (id: string) => void;
  onEdit?: (memory: Memory) => void;
  viewMode?: ViewMode;
}

const Timeline = ({ memories, onDelete, onEdit, viewMode = "cards" }: TimelineProps) => {
  const [expandedMonths, setExpandedMonths] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  const sorted = useMemo(() => {
    return [...memories].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [memories]);

  const grouped = useMemo(() => {
    const map = new Map<string, Memory[]>();
    sorted.forEach((m) => {
      const year = m.memoryYear ?? yearFromDate(m.date);
      const season = m.memorySeason ?? seasonFromDate(m.date);
      const key = `${year}-${season}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return Array.from(map.entries()).sort(([, aItems], [, bItems]) => {
      return new Date(bItems[0].date).getTime() - new Date(aItems[0].date).getTime();
    });
  }, [sorted]);

  const getVisibleCount = (monthKey: string, total: number) => {
    const extra = expandedMonths[monthKey] ?? 0;
    return Math.min(ITEMS_PER_PAGE + extra, total);
  };

  const showMore = (monthKey: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: (prev[monthKey] ?? 0) + ITEMS_PER_PAGE,
    }));
  };

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
            const visibleCount = getVisibleCount(monthKey, items.length);
            const visibleItems = items.slice(0, visibleCount);
            const hasMore = visibleCount < items.length;

            return (
              <div key={monthKey} className="mb-8">
                <div className="relative flex items-center gap-3 mb-4">
                  <div className="relative z-10 h-[30px] w-[30px] rounded-full bg-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">{formatMemoryTime(items[0])[0]}</span>
                  </div>
                  <h2 className="font-display text-base font-semibold text-foreground">
                    {formatMemoryTime(items[0])}
                    {items.length > ITEMS_PER_PAGE && (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">
                        ({items.length})
                      </span>
                    )}
                  </h2>
                </div>

                <div className={`pl-[38px] ${viewMode === "list" ? "space-y-1.5" : "space-y-4"}`}>
                  {visibleItems.map((memory, i) => (
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
                            onDelete={onDelete}
                            onEdit={onEdit}
                            onClick={(selected) => navigate(`/journal/memories/${selected.id}`)}
                          />
                        ) : (
                          <MemoryCard memory={memory} onDelete={onDelete} onEdit={onEdit} onClick={(selected) => navigate(`/journal/memories/${selected.id}`)} index={0} />
                        )}
                      </div>
                    </motion.div>
                  ))}
                  {hasMore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => showMore(monthKey)}
                      className="w-full text-xs text-muted-foreground"
                    >
                      Show more ({items.length - visibleCount} remaining)
                    </Button>
                  )}
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
