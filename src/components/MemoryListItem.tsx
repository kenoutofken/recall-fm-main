import { Memory } from "@/types/memory";
import { Calendar, MapPin } from "lucide-react";
import MiniPlayer from "@/components/MiniPlayer";
import { formatMemoryTime } from "@/lib/memoryTime";

interface MemoryListItemProps {
  memory: Memory;
  onClick?: (memory: Memory) => void;
}

const MemoryListItem = ({ memory, onClick }: MemoryListItemProps) => {
  return (
    <div
      className="card-strong group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:shadow-sm cursor-pointer"
      onClick={() => onClick?.(memory)}
    >
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

      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
        <MiniPlayer songTitle={memory.songTitle} artist={memory.artist} variant="compact" />
      </div>
    </div>
  );
};

export default MemoryListItem;
