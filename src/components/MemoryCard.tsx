import { Memory } from "@/types/memory";
import { Calendar, Trash2, Users, Pencil, Maximize2, MapPin } from "lucide-react";
import MiniPlayer from "@/components/MiniPlayer";
import { formatMemoryTime } from "@/lib/memoryTime";

interface MemoryCardProps {
  memory: Memory;
  onDelete: (id: string) => void;
  onEdit?: (memory: Memory) => void;
  onClick?: (memory: Memory) => void;
  index: number;
}

const MemoryCard = ({ memory, onDelete, onEdit, onClick }: MemoryCardProps) => {
  const actionButtonClass = "flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/70";

  return (
    <div className="group relative rounded-lg border border-border bg-card overflow-hidden transition-all hover:shadow-md">
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        {onClick && (
          <button
            onClick={(e) => { e.stopPropagation(); onClick(memory); }}
            className={actionButtonClass}
            aria-label="Open memory"
          >
            <Maximize2 size={19} />
          </button>
        )}
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(memory); }}
            className={actionButtonClass}
            aria-label="Edit memory"
          >
            <Pencil size={19} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(memory.id); }}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
          aria-label="Delete memory"
        >
          <Trash2 size={19} />
        </button>
      </div>

      {memory.imageUrl && (
        <img src={memory.imageUrl} alt="" className="w-full h-40 object-cover" />
      )}

      <div className="p-5">

      <h3 className="font-display text-lg font-semibold leading-snug text-foreground mb-2">
        {memory.title}
      </h3>

      <p className="text-sm text-muted-foreground leading-relaxed mb-4">
        {memory.description}
      </p>

      <div className="mb-3">
        <MiniPlayer songTitle={memory.songTitle} artist={memory.artist} />
      </div>

      {memory.people.length > 0 && (
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <Users size={12} className="text-muted-foreground shrink-0" />
          {memory.people.map((p) => (
            <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-foreground border border-primary/20">
              {p}
            </span>
          ))}
        </div>
      )}

      {memory.locationName && (
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <MapPin size={12} className="shrink-0" />
          <span className="min-w-0 truncate">{memory.locationName}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar size={12} />
        <span>{formatMemoryTime(memory)}</span>
      </div>
      </div>
    </div>
  );
};

export default MemoryCard;
