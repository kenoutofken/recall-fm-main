import { Memory } from "@/types/memory";
import { Calendar, Trash2, Users, Pencil } from "lucide-react";
import MiniPlayer from "@/components/MiniPlayer";
import { format } from "date-fns";

interface MemoryCardProps {
  memory: Memory;
  onDelete: (id: string) => void;
  onEdit?: (memory: Memory) => void;
  onClick?: (memory: Memory) => void;
  index: number;
}

const MemoryCard = ({ memory, onDelete, onEdit, onClick }: MemoryCardProps) => {
  return (
    <div
      className="group relative rounded-lg border border-border bg-card overflow-hidden transition-all hover:shadow-md cursor-pointer"
      onClick={() => onClick?.(memory)}
    >
      <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onEdit && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(memory); }}
            className="text-muted-foreground hover:text-foreground bg-background/60 backdrop-blur-sm rounded-full p-1"
            aria-label="Edit memory"
          >
            <Pencil size={16} />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(memory.id); }}
          className="text-muted-foreground hover:text-destructive bg-background/60 backdrop-blur-sm rounded-full p-1"
          aria-label="Delete memory"
        >
          <Trash2 size={16} />
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

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Calendar size={12} />
        <span>{format(new Date(memory.date), "MMM d, yyyy")}</span>
      </div>
      </div>
    </div>
  );
};

export default MemoryCard;
