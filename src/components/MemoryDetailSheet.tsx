import { useMemo } from "react";
import { Calendar, Heart, MapPin, Minus, Pencil, Plus, Trash2, Users } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import MiniPlayer from "@/components/MiniPlayer";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLikes } from "@/hooks/useLikes";
import { usePlaylist } from "@/hooks/usePlaylist";
import { formatMemoryTime } from "@/lib/memoryTime";
import { cn } from "@/lib/utils";
import { Memory } from "@/types/memory";

interface MemoryDetailSheetProps {
  memory: Memory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source: "discover" | "journal";
  onEdit?: (memory: Memory) => void;
  onDelete?: (memory: Memory) => void | Promise<void>;
  onShowProfile?: (memory: Memory) => void;
}

const actionButtonClassName =
  "relative inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-foreground/70 bg-card text-foreground shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

const MemoryDetailSheet = ({
  memory,
  open,
  onOpenChange,
  source,
  onEdit,
  onDelete,
  onShowProfile,
}: MemoryDetailSheetProps) => {
  const moodParts = useMemo(() => {
    return memory?.mood.split(",").map((mood) => mood.trim()).filter(Boolean) ?? [];
  }, [memory]);
  const { likeCounts, userLikes, toggleLike } = useLikes(memory ? [memory.id] : []);
  const { songs, addSong, removeSong, isSongInPlaylist } = usePlaylist();

  if (!memory) return null;

  const isLiked = userLikes.has(memory.id);
  const isInPlaylist = isSongInPlaylist(memory.songTitle, memory.artist);
  const canEdit = Boolean(onEdit || onDelete);

  const handleToggleLike = () => {
    toggleLike(memory.id);
    toast.success(isLiked ? "Removed like" : "Liked this memory!");
  };

  const handleTogglePlaylist = () => {
    const inList = isSongInPlaylist(memory.songTitle, memory.artist);

    if (inList) {
      const song = songs.find(
        (item) =>
          item.songTitle.toLowerCase() === memory.songTitle.toLowerCase() &&
          item.artist.toLowerCase() === memory.artist.toLowerCase(),
      );

      if (song) {
        removeSong(song.id);
        toast.success("Removed from your playlist");
      }
      return;
    }

    addSong(memory.songTitle, memory.artist, memory.id);
    toast.success("Added to your playlist!");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto flex h-[92dvh] w-full max-w-lg flex-col rounded-t-[28px] p-0 sm:h-[88vh]"
      >
        <SheetHeader className="shrink-0 border-b border-border px-5 pb-3 pt-5 text-left">
          <div className="pr-12">
            <SheetTitle className="font-display text-xl">
              {source === "discover" ? "Story details" : "Memory details"}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <article className="space-y-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-3">
                {source === "discover" && memory.username && (
                  <button
                    type="button"
                    onClick={() => onShowProfile?.(memory)}
                    className="w-fit rounded-full border-2 border-foreground/70 bg-white px-3 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:bg-muted"
                  >
                    @{memory.username}
                  </button>
                )}

                <div className="space-y-2">
                  <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">
                    {memory.title}
                  </h1>
                  {moodParts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {moodParts.map((mood) => (
                        <span
                          key={mood}
                          className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          {mood}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      type="button"
                      onClick={handleToggleLike}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 500, damping: 28 }}
                      aria-label={isLiked ? "Unlike this memory" : "Like this memory"}
                      className={cn(
                        actionButtonClassName,
                        isLiked && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                    >
                      <Heart size={18} className={isLiked ? "fill-current" : ""} />
                      {(likeCounts[memory.id] || 0) > 0 && (
                        <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-primary px-1 text-[10px] font-semibold leading-4 text-primary-foreground">
                          {likeCounts[memory.id]}
                        </span>
                      )}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>{isLiked ? "Unlike" : "Like"}</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <motion.button
                      type="button"
                      onClick={handleTogglePlaylist}
                      whileHover={{ scale: 1.03, y: -1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 500, damping: 28 }}
                      aria-label={isInPlaylist ? "Remove from playlist" : "Add to playlist"}
                      className={cn(
                        actionButtonClassName,
                        isInPlaylist && "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
                      )}
                    >
                      {isInPlaylist ? <Minus size={18} className="fill-current" /> : <Plus size={18} />}
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent>{isInPlaylist ? "Remove from playlist" : "Add to playlist"}</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {memory.imageUrl && (
              <img src={memory.imageUrl} alt="" className="h-64 w-full rounded-2xl object-cover" />
            )}

            {memory.description && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                {memory.description}
              </p>
            )}

            <MiniPlayer songTitle={memory.songTitle} artist={memory.artist} />

            <div className="card-strong space-y-3 rounded-2xl p-4">
              <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={14} className="shrink-0" />
                <span>{formatMemoryTime(memory)}</span>
              </div>
              {memory.locationName && (
                <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                  <MapPin size={14} className="shrink-0" />
                  <span className="min-w-0 break-words">{memory.locationName}</span>
                </div>
              )}
              {memory.people.length > 0 && (
                <div className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                  <Users size={14} className="mt-0.5 shrink-0" />
                  <div className="flex flex-wrap gap-1.5">
                    {memory.people.map((person) => (
                      <span key={person} className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-xs text-foreground">
                        {person}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {memory.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {canEdit && (
              <div className="grid grid-cols-2 gap-2">
                {onEdit ? (
                  <button
                    type="button"
                    onClick={() => onEdit(memory)}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Pencil size={16} />
                    Edit
                  </button>
                ) : (
                  <div />
                )}

                {onDelete && (
                  <Sheet>
                    <SheetTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive hover:text-destructive-foreground"
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
                            onClick={async () => {
                              await onDelete(memory);
                              onOpenChange(false);
                            }}
                            className="h-11 rounded-lg bg-destructive px-3 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                          >
                            Delete Memory
                          </button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                )}
              </div>
            )}
          </article>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MemoryDetailSheet;
