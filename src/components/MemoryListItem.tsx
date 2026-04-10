import { Memory } from "@/types/memory";
import { Calendar, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";

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
      </div>

      {/* Date */}
      <div className="hidden xs:flex items-center gap-1 text-xs text-muted-foreground shrink-0">
        <Calendar size={11} />
        <span>{format(new Date(memory.date), "MMM d")}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(memory); }}
            className="text-muted-foreground hover:text-foreground p-1 rounded-full"
            aria-label="Edit memory"
          >
            <Pencil size={14} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(memory.id); }}
          className="text-muted-foreground hover:text-destructive p-1 rounded-full"
          aria-label="Delete memory"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default MemoryListItem;
