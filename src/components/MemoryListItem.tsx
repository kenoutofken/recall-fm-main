import { Memory } from "@/types/memory";
import { Calendar, Trash2, Pencil, MapPin } from "lucide-react";
import MiniPlayer from "@/components/MiniPlayer";
import { formatMemoryTime } from "@/lib/memoryTime";

interface MemoryListItemProps {
  memory: Memory;
  onDelete: (id: string) => void;
  onEdit?: (memory: Memory) => void;
  onClick?: (memory: Memory) => void;
}

const MemoryListItem = ({ memory, onDelete, onEdit, onClick }: MemoryListItemProps) => {
  const moodParts = memory.mood.split(",").map((s) => s.trim());
  const firstEmoji = moodParts[0]?.split(" ")[0] ?? "";

  return (
    <div
      className="group flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-all hover:shadow-sm cursor-pointer"
      onClick={() => onClick?.(memory)}
    >
      {/* Mood emoji */}
      <span className="text-lg shrink-0">{firstEmoji}</span>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{memory.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {memory.songTitle} — {memory.artist}
        </p>
        {memory.locationName && (
          <p className="mt-0.5 flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
            <MapPin size={10} className="shrink-0" />
            <span className="min-w-0 truncate">{memory.locationName}</span>
          </p>
        )}
      </div>

      {/* Date */}
      <div className="hidden xs:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Calendar size={11} />
        <span>{formatMemoryTime(memory)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 shrink-0">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(memory); }}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Edit memory"
          >
            <Pencil size={14} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(memory.id); }}
          className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
          aria-label="Delete memory"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        <MiniPlayer songTitle={memory.songTitle} artist={memory.artist} variant="compact" />
      </div>
    </div>
  );
};

export default MemoryListItem;
