import { ChevronLeft, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AddMemoryForm from "@/components/AddMemoryForm";
import AudioToggleButton from "@/components/AudioToggleButton";
import BottomNav from "@/components/BottomNav";
import BrandMark from "@/components/BrandMark";
import NotificationButton from "@/components/NotificationButton";
import UserAvatar from "@/components/UserAvatar";
import { useMemories } from "@/hooks/useMemories";
import { Memory } from "@/types/memory";
import { useState } from "react";

const WhatsNew = () => {
  const navigate = useNavigate();
  const { addMemory } = useMemories();
  const [showForm, setShowForm] = useState(false);

  const handleAddMemory = async (data: Omit<Memory, "id" | "createdAt">) => {
    const createdMemory = await addMemory({ ...data, tags: data.tags ?? [] });
    if (!createdMemory) return false;

    navigate(`/journal/memories/${createdMemory.id}`);
    return true;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <BrandMark />
          </button>
          <div className="flex items-center gap-2">
            <NotificationButton />
            <AudioToggleButton />
            <UserAvatar />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5 pb-24">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft size={18} />
          Discover
        </button>

        <div className="mb-5">
          <h1 className="font-display text-2xl font-semibold text-foreground">What's new</h1>
          <p className="mt-1 text-sm text-muted-foreground">New features and small improvements from LifePlayback.</p>
        </div>

        <article className="rounded-lg border border-border bg-card px-4 py-4">
          <div className="mb-3 flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <UserPlus size={18} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Follow back from notifications</p>
              <p className="mt-0.5 text-xs text-muted-foreground">New feature</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We updated the app so when someone follows you, you can follow them back right from the notification.
            It is now easier to keep up with friends who find you on LifePlayback.
          </p>
        </article>
      </main>

      <BottomNav onNewMemory={() => setShowForm(true)} />

      {showForm && (
        <AddMemoryForm
          onAdd={handleAddMemory}
          onClose={() => setShowForm(false)}
          editingMemory={null}
        />
      )}
    </div>
  );
};

export default WhatsNew;
