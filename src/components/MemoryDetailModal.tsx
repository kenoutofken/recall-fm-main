import { Memory } from "@/types/memory";
import { Calendar, Users, Pencil, Trash2, MapPin } from "lucide-react";
import MiniPlayer from "@/components/MiniPlayer";
import { formatMemoryTime } from "@/lib/memoryTime";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface MemoryDetailModalProps {
  memory: Memory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
  onEdit?: (memory: Memory) => void;
}

const MemoryDetailModal = ({ memory, open, onOpenChange, onDelete, onEdit }: MemoryDetailModalProps) => {
  if (!memory) return null;

  const moodParts = memory.mood.split(",").map((s) => s.trim()).filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] min-w-0 overflow-hidden p-0 sm:max-w-md [&>button]:z-50 [&>button]:flex [&>button]:h-9 [&>button]:w-9 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-black/55 [&>button]:text-white [&>button]:opacity-100 [&>button]:backdrop-blur-sm [&>button]:ring-offset-0 [&>button]:transition-colors [&>button:hover]:bg-black/70">
        {memory.imageUrl && (
          <img src={memory.imageUrl} alt="" className="w-full h-48 object-cover" />
        )}
        <div className="min-w-0 p-5 space-y-4">
          <DialogHeader className="min-w-0 space-y-1">
            <DialogTitle className="min-w-0 break-words font-display text-lg leading-snug">{memory.title}</DialogTitle>
            {memory.description && (
              <DialogDescription className="min-w-0 break-words text-sm text-muted-foreground leading-relaxed">
                {memory.description}
              </DialogDescription>
            )}
          </DialogHeader>

          {/* Moods */}
          {moodParts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {moodParts.map((m) => (
                <span key={m} className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-foreground border border-primary/20">
                  {m}
                </span>
              ))}
            </div>
          )}

          {/* Tags */}
          {memory.tags && memory.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {memory.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="min-w-0 max-w-full overflow-hidden">
            <MiniPlayer songTitle={memory.songTitle} artist={memory.artist} />
          </div>

          {memory.people.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Users size={12} className="text-muted-foreground shrink-0" />
              {memory.people.map((p) => (
                <span key={p} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-foreground border border-primary/20">
                  {p}
                </span>
              ))}
            </div>
          )}

          {memory.locationName && (
            <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin size={12} className="shrink-0" />
              <span className="min-w-0 break-words">{memory.locationName}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={12} />
              <span>{formatMemoryTime(memory)}</span>
            </div>
            <div className="flex gap-1">
              {onEdit && (
                <button
                  onClick={() => { onOpenChange(false); onEdit(memory); }}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-full transition-colors"
                  aria-label="Edit memory"
                >
                  <Pencil size={15} />
                </button>
              )}
              <button
                onClick={() => { onOpenChange(false); onDelete(memory.id); }}
                className="text-muted-foreground hover:text-destructive p-1.5 rounded-full transition-colors"
                aria-label="Delete memory"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemoryDetailModal;
