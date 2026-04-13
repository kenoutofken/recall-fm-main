import { Memory, MOODS } from "@/types/memory";
import { Calendar, Trash2, Users, MapPin } from "lucide-react";
import MiniPlayer from "@/components/MiniPlayer";
import { formatMemoryTime } from "@/lib/memoryTime";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface MemoryCardProps {
  memory: Memory;
  onDelete: (id: string) => void;
  onEdit?: (memory: Memory) => void;
  onClick?: (memory: Memory) => void;
  index: number;
}

const MOOD_GRADIENTS: Record<string, string> = {
  Joyful: "bg-gradient-to-br from-amber-300 to-orange-400",
  Melancholy: "bg-gradient-to-br from-slate-400 to-blue-500",
  Energized: "bg-gradient-to-br from-red-400 to-rose-500",
  Nostalgic: "bg-gradient-to-br from-indigo-400 to-purple-500",
  Peaceful: "bg-gradient-to-br from-pink-300 to-rose-300",
  Bittersweet: "bg-gradient-to-br from-orange-400 to-amber-600",
};

const getMoodGradient = (mood: string) => {
  const first = mood.split(",")[0].trim();
  const label = MOODS.find((m) => first.includes(m.label))?.label ?? "Nostalgic";
  return MOOD_GRADIENTS[label] ?? "bg-gradient-to-br from-muted to-muted-foreground/20";
};

const MemoryCard = ({ memory, onDelete, onClick }: MemoryCardProps) => {
  const moodParts = memory.mood.split(",").map((mood) => mood.trim()).filter(Boolean);

  return (
    <div
      className={cn(
        "group relative h-72 overflow-hidden rounded-lg border border-border bg-card text-white transition-all hover:shadow-md",
        onClick && "cursor-pointer"
      )}
      onClick={() => onClick?.(memory)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(memory);
        }
      }}
    >
      <div className={cn("absolute inset-0", !memory.imageUrl && getMoodGradient(memory.mood))}>
        {memory.imageUrl && <img src={memory.imageUrl} alt="" className="size-full object-cover" />}
        <div className="absolute inset-0 bg-black/45" />
        <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/88 via-black/48 to-transparent" />
      </div>

      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-all hover:scale-105 hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="Delete memory"
            >
              <Trash2 size={19} />
            </button>
          </SheetTrigger>
          <SheetContent side="right" onClick={(e) => e.stopPropagation()} className="flex w-[86vw] max-w-sm flex-col p-0">
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
                  onClick={() => onDelete(memory.id)}
                  className="h-11 rounded-lg bg-destructive px-3 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                >
                  Delete Memory
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 space-y-3 p-4">
        <div className="space-y-2">
          {moodParts.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {moodParts.slice(0, 3).map((mood) => (
                <span key={mood} className="rounded-full border border-white/15 bg-white/18 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                  {mood}
                </span>
              ))}
            </div>
          )}

          <h3 className="font-display text-xl font-semibold leading-tight text-white">
            {memory.title}
          </h3>
        </div>

        <MiniPlayer songTitle={memory.songTitle} artist={memory.artist} variant="overlay" />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-white/72">
          <div className="flex items-center gap-1.5">
            <Calendar size={12} />
            <span>{formatMemoryTime(memory)}</span>
          </div>
          {memory.locationName && (
            <div className="flex min-w-0 items-center gap-1.5">
              <MapPin size={12} className="shrink-0" />
              <span className="min-w-0 truncate">{memory.locationName}</span>
            </div>
          )}
          {memory.people.length > 0 && (
            <div className="flex min-w-0 items-center gap-1.5">
              <Users size={12} className="shrink-0" />
              <span className="min-w-0 truncate">{memory.people.slice(0, 2).join(", ")}{memory.people.length > 2 ? ` +${memory.people.length - 2}` : ""}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MemoryCard;
