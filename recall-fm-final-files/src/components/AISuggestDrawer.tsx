import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

const SUGGESTIONS = [
  "Show me something nostalgic 🌙",
  "Upbeat & energetic vibes",
  "Sports related memories",
  "Something about love or heartbreak",
];

// The drawer calls the discover-suggest edge function and passes matched memory ids back to Discover.
const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discover-suggest`;

interface AISuggestDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResults: (matchedIds: string[], reason: string) => void;
}

const AISuggestDrawer = ({ open, onOpenChange, onResults }: AISuggestDrawerProps) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const search = async (text: string) => {
    if (!text.trim() || isLoading) return;

    setIsLoading(true);

    try {
      // The edge function does the AI matching so the browser only receives approved public memories.
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: text.trim() }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      const data = await resp.json();
      const ids = (data.memories ?? []).map((m: { id: string }) => m.id);
      // Discover uses these ids as a temporary AI filter while keeping all other feed controls intact.
      onResults(ids, data.reason ?? "");
      onOpenChange(false);
      setInput("");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to get suggestions");
    }

    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search(input);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto flex w-full max-w-lg flex-col rounded-t-2xl p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border shrink-0">
          <SheetTitle className="flex items-center gap-2 font-display">
            <Sparkles size={18} className="text-primary" />
            AI Discover
          </SheetTitle>
          <SheetDescription className="text-xs">
            Describe what you're in the mood for and we'll tailor your feed
          </SheetDescription>
        </SheetHeader>

        <div className="px-5 py-5 space-y-4">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. 'sports memories' or 'sad vibes'"
                className="pl-9"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" size="sm" disabled={!input.trim() || isLoading}>
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : "Go"}
            </Button>
          </form>

          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); search(s); }}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-full text-xs border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-2">
              <Loader2 size={16} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Finding memories for you…</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AISuggestDrawer;
