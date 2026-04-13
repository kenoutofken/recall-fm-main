import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Calendar, ChevronLeft, MapPin, Pencil, Trash2, Users } from "lucide-react";
import AddMemoryForm from "@/components/AddMemoryForm";
import MiniPlayer from "@/components/MiniPlayer";
import UserAvatar from "@/components/UserAvatar";
import { useMemories } from "@/hooks/useMemories";
import { formatMemoryTime } from "@/lib/memoryTime";
import { Memory } from "@/types/memory";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const JournalMemoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { memories, loading, updateMemory, deleteMemory } = useMemories();
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);

  const memory = useMemo(() => memories.find((item) => item.id === id) ?? null, [id, memories]);
  const moodParts = memory?.mood.split(",").map((mood) => mood.trim()).filter(Boolean) ?? [];

  const handleDelete = async () => {
    if (!memory) return;
    await deleteMemory(memory.id);
    navigate("/journal", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <span className="font-display text-xl font-bold text-foreground">Recall.fm</span>
          <UserAvatar />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 pb-24">
        <button
          type="button"
          onClick={() => navigate("/journal")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft size={18} />
          Journal
        </button>

        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-20">Loading memory...</p>
        ) : !memory ? (
          <div className="text-center py-20">
            <h1 className="font-display text-lg font-semibold text-foreground mb-2">Memory not found</h1>
            <p className="text-sm text-muted-foreground mb-6">This memory may have been deleted.</p>
            <button
              type="button"
              onClick={() => navigate("/journal")}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Back to Journal
            </button>
          </div>
        ) : (
          <article className="space-y-5">
            {memory.imageUrl && (
              <img src={memory.imageUrl} alt="" className="h-64 w-full rounded-lg object-cover" />
            )}

            <div className="space-y-3">
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
