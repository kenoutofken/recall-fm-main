import { Memory, MOODS } from "@/types/memory";
import { Calendar, Users, MapPin } from "lucide-react";
import MiniPlayer from "@/components/MiniPlayer";
import { formatMemoryTime } from "@/lib/memoryTime";
import { cn } from "@/lib/utils";

interface MemoryCardProps {
  memory: Memory;
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

const MemoryCard = ({ memory, onClick }: MemoryCardProps) => {
  const moodParts = memory.mood.split(",").map((mood) => mood.trim()).filter(Boolean);

  return (
    <div
      className={cn(
        "card-strong group relative h-72 overflow-hidden rounded-lg text-white transition-all hover:shadow-md",
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
