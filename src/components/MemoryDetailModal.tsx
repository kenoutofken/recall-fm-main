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
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

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
      <DialogContent className="h-full max-h-full w-full min-w-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[85vh] sm:w-[calc(100vw-2rem)] sm:max-w-md sm:rounded-lg [&>button]:z-50 [&>button]:flex [&>button]:h-9 [&>button]:w-9 [&>button]:items-center [&>button]:justify-center [&>button]:rounded-full [&>button]:bg-black/55 [&>button]:text-white [&>button]:opacity-100 [&>button]:backdrop-blur-sm [&>button]:ring-offset-0 [&>button]:transition-colors [&>button:hover]:bg-black/70">
        <div className="h-full min-w-0 overflow-y-auto sm:h-auto">
        {memory.imageUrl && (
          <img src={memory.imageUrl} alt="" className="w-full h-48 object-cover" />
        )}
        <div className="min-w-0 p-5 pt-12 space-y-4 sm:pt-5">
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

          <div className="space-y-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar size={12} />
              <span>{formatMemoryTime(memory)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {onEdit && (
                <button
                  onClick={() => { onOpenChange(false); onEdit(memory); }}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  aria-label="Edit memory"
                >
                  <Pencil size={16} />
                  Edit
                </button>
              )}
              <Sheet>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
                    aria-label="Delete memory"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="flex w-[86vw] max-w-sm flex-col p-0">
                  <SheetHeader className="border-b border-border px-5 py-5 text-left">
                    <SheetTitle>Delete this memory?</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-1 flex-col justify-between gap-6 px-5 py-5">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      This will permanently remove "{memory.title}" from your journal.
                    </p>
                    <div className="grid gap-2">
                      <SheetClose asChild>
                        <button
                          type="button"
                          className="h-11 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                        >
                          Cancel
                        </button>
                      </SheetClose>
                      <button
                        type="button"
                        onClick={() => {
                          onOpenChange(false);
                          onDelete(memory.id);
                        }}
                        className="h-11 rounded-lg bg-destructive px-3 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                      >
                        Delete Memory
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MemoryDetailModal;
