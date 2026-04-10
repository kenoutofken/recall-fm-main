import { Memory } from "@/types/memory";
import { Calendar, Users, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import MiniPlayer from "@/components/MiniPlayer";
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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {memory.imageUrl && (
          <img src={memory.imageUrl} alt="" className="w-full h-48 object-cover" />
        )}
        <div className="p-5 space-y-4">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-display text-lg leading-snug">{memory.title}</DialogTitle>
            {memory.description && (
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
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

          <MiniPlayer songTitle={memory.songTitle} artist={memory.artist} />

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

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={12} />
              <span>{format(new Date(memory.date), "MMM d, yyyy")}</span>
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
