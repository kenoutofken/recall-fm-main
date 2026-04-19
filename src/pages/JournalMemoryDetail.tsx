import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Calendar, ChevronLeft, Heart, MapPin, Minus, Pencil, Plus, Trash2, Users } from "lucide-react";
import AddMemoryForm from "@/components/AddMemoryForm";
import MiniPlayer from "@/components/MiniPlayer";
import UserAvatar from "@/components/UserAvatar";
import AudioToggleButton from "@/components/AudioToggleButton";
import NotificationButton from "@/components/NotificationButton";
import { useMemories } from "@/hooks/useMemories";
import { useLikes } from "@/hooks/useLikes";
import { usePlaylist } from "@/hooks/usePlaylist";
import { formatMemoryTime } from "@/lib/memoryTime";
import { Memory } from "@/types/memory";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type DetailLocationState = {
  from?: {
    pathname?: string;
    search?: string;
  };
};

const JournalMemoryDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { memories, loading, updateMemory, deleteMemory } = useMemories();
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [publicMemory, setPublicMemory] = useState<Memory | null>(null);
  const [publicLoading, setPublicLoading] = useState(false);
  const [publicChecked, setPublicChecked] = useState(false);

  const isDiscoverDetail = location.pathname.startsWith("/discover/");
  const memory = useMemo(() => {
    if (isDiscoverDetail) return publicMemory;
    return memories.find((item) => item.id === id) ?? null;
  }, [id, isDiscoverDetail, memories, publicMemory]);
  const moodParts = memory?.mood.split(",").map((mood) => mood.trim()).filter(Boolean) ?? [];
  const backLabel = isDiscoverDetail ? "Discover" : "Journal";
  const backPath = isDiscoverDetail ? "/" : "/journal";
  const locationState = location.state as DetailLocationState | null;
  const returnPath = locationState?.from?.pathname
    ? `${locationState.from.pathname}${locationState.from.search ?? ""}`
    : backPath;
  const { likeCounts, userLikes, toggleLike } = useLikes(memory ? [memory.id] : []);
  const { songs, addSong, removeSong, isSongInPlaylist } = usePlaylist();
  const canEditMemory = Boolean(memory && !isDiscoverDetail);

  useEffect(() => {
    if (!isDiscoverDetail || !id) {
      setPublicMemory(null);
      setPublicLoading(false);
      setPublicChecked(false);
      return;
    }

    let cancelled = false;

    const fetchPublicMemory = async () => {
      setPublicLoading(true);
      setPublicChecked(false);
      const { data, error } = await supabase
        .from("memories")
        .select("*")
        .eq("id", id)
        .eq("is_public", true)
        .maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        if (error) console.error(error);
        setPublicMemory(null);
        setPublicLoading(false);
        setPublicChecked(true);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("username, display_name, avatar_url")
        .eq("user_id", data.user_id)
        .maybeSingle();

      if (cancelled) return;

      setPublicMemory({
        id: data.id,
        title: data.title,
        description: data.description ?? "",
        songTitle: data.song_title,
        artist: data.artist,
        date: data.date,
        memoryYear: data.memory_year ?? null,
        memorySeason: data.memory_season ?? null,
        locationName: data.location_name ?? null,
        locationLat: data.location_lat ?? null,
        locationLng: data.location_lng ?? null,
        locationPlaceId: data.location_place_id ?? null,
        mood: data.mood,
        people: data.people ?? [],
        isPublic: true,
        imageUrl: data.image_url ?? null,
        tags: data.tags ?? [],
        createdAt: data.created_at,
        userId: data.user_id,
        username: profile?.username ?? null,
        displayName: profile?.display_name ?? null,
        avatarUrl: profile?.avatar_url ?? null,
      });
      setPublicLoading(false);
      setPublicChecked(true);
    };

    fetchPublicMemory();

    return () => {
      cancelled = true;
    };
  }, [id, isDiscoverDetail]);

  const pageLoading = isDiscoverDetail ? publicLoading || !publicChecked : loading;

  const handleDelete = async () => {
    if (!memory) return;
    await deleteMemory(memory.id);
    navigate(returnPath, { replace: true });
  };

  const togglePlaylist = () => {
    if (!memory) return;
    const inList = isSongInPlaylist(memory.songTitle, memory.artist);

    if (inList) {
      const song = songs.find(
        (s) => s.songTitle.toLowerCase() === memory.songTitle.toLowerCase() && s.artist.toLowerCase() === memory.artist.toLowerCase()
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="font-display text-xl font-bold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Recall.fm
          </button>
          <div className="flex items-center gap-2">
            <NotificationButton />
            <AudioToggleButton />
            <UserAvatar />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        <button
          type="button"
          onClick={() => navigate(returnPath)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft size={18} />
          {backLabel}
        </button>

        {pageLoading ? (
          <p className="text-center text-sm text-muted-foreground py-20">Loading memory...</p>
        ) : !memory ? (
          <div className="text-center py-20">
            <h1 className="font-display text-lg font-semibold text-foreground mb-2">Memory not found</h1>
            <p className="text-sm text-muted-foreground mb-6">This memory may have been deleted.</p>
            <button
              type="button"
              onClick={() => navigate(returnPath)}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Back to {backLabel}
            </button>
          </div>
        ) : (
          <article className="space-y-5">
            {memory.imageUrl && (
              <img src={memory.imageUrl} alt="" className="h-64 w-full rounded-lg object-cover" />
            )}

            <div className="space-y-3">
              {isDiscoverDetail && memory.username && (
                <button
                  type="button"
                  onClick={() => navigate(`/?profile=${memory.userId}&username=${memory.username}`)}
                  className="w-fit rounded-full px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  @{memory.username}
                </button>
              )}
              <h1 className="font-display text-3xl font-semibold leading-tight text-foreground">
                {memory.title}
              </h1>
              {moodParts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {moodParts.map((mood) => (
                    <span key={mood} className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-foreground">
                      {mood}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {memory.description && (
              <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-muted-foreground">
                {memory.description}
              </p>
            )}

            <MiniPlayer songTitle={memory.songTitle} artist={memory.artist} />

            <div className="space-y-3 rounded-lg border border-border bg-card p-4">
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

            {isDiscoverDetail ? (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const wasLiked = userLikes.has(memory.id);
                    toggleLike(memory.id);
                    toast.success(wasLiked ? "Removed like" : "Liked this memory!");
                  }}
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    userLikes.has(memory.id) && "border-primary text-primary"
                  )}
                >
                  <Heart size={16} className={userLikes.has(memory.id) ? "fill-primary" : ""} />
                  Like{(likeCounts[memory.id] || 0) > 0 ? ` ${likeCounts[memory.id]}` : ""}
                </button>
                <button
                  type="button"
                  onClick={togglePlaylist}
                  className={cn(
                    "inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isSongInPlaylist(memory.songTitle, memory.artist)
                      ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  )}
                >
                  {isSongInPlaylist(memory.songTitle, memory.artist) ? <Minus size={16} /> : <Plus size={16} />}
                  Playlist
                </button>
              </div>
            ) : canEditMemory && (
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditingMemory(memory)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Pencil size={16} />
                Edit
              </button>
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
                        onClick={handleDelete}
                        className="h-11 rounded-lg bg-destructive px-3 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                      >
                        Delete Memory
                      </button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
            )}
          </article>
        )}
      </main>

      {editingMemory && (
        <AddMemoryForm
          onAdd={(data) => updateMemory(editingMemory.id, { ...data, tags: data.tags ?? [] })}
          onClose={() => setEditingMemory(null)}
          editingMemory={editingMemory}
        />
      )}
    </div>
  );
};

export default JournalMemoryDetail;
