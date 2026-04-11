import { useState } from "react";
import { usePlaylist } from "@/hooks/usePlaylist";
import { Trash2, Copy, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import UserAvatar from "@/components/UserAvatar";
import AddMemoryForm from "@/components/AddMemoryForm";
import { useMemories } from "@/hooks/useMemories";
import { toast } from "sonner";
import MiniPlayer from "@/components/MiniPlayer";

const TUNEMYMUSIC_URL = "https://www.tunemymusic.com/";

const Playlist = () => {
  const { songs, loading, removeSong } = usePlaylist();
  const { addMemory } = useMemories();
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);




  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-display text-xl font-bold text-foreground">Recall.fm</span>
            <span className="text-muted-foreground/30">|</span>
            <h1 className="font-display text-xl font-normal text-foreground">My Playlist</h1>
          </div>
          <UserAvatar />
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24">
        {/* TuneMyMusic Export Card */}
        {songs.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🎵</span>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Export to Spotify, Apple Music & more</p>
                <p className="text-xs text-muted-foreground">
                  One tap copies your playlist & opens TuneMyMusic — just paste and go
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => {
                const text = songs.map((s) => `${s.songTitle} - ${s.artist}`).join("\n");
                navigator.clipboard.writeText(text).then(() => {
                  setCopied(true);
                  toast.success("Playlist copied! Paste it into the text box on TuneMyMusic.");
                  setTimeout(() => {
                    window.open(TUNEMYMUSIC_URL, "_blank");
                  }, 400);
                  setTimeout(() => setCopied(false), 3000);
                });
              }}
              className="gap-1.5 mt-3 w-full"
              variant={copied ? "secondary" : "default"}
            >
              {copied ? <Check size={14} /> : <><Copy size={14} /> <ExternalLink size={14} /></>}
              {copied ? "Copied! Opening TuneMyMusic…" : "Copy & Open TuneMyMusic"}
            </Button>
          </div>
        )}

        {loading ? (
          <p className="text-center text-sm text-muted-foreground py-20">Loading playlist...</p>
        ) : songs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🎵</div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">
              Your playlist is empty
            </h2>
            <p className="text-sm text-muted-foreground">
              Save songs from Discover to build your playlist
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              {songs.length} song{songs.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-2">
              {songs.map((song, i) => (
                <div
                  key={song.id}
                  className="rounded-lg border border-border bg-card p-4 flex items-center gap-3"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-xs font-semibold text-primary">{i + 1}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{song.songTitle}</p>
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                  </div>
                  <button
                    onClick={() => removeSong(song.id)}
                    className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove from playlist"
                  >
                    <Trash2 size={14} />
                  </button>
                  <MiniPlayer songTitle={song.songTitle} artist={song.artist} variant="compact" />
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <BottomNav onNewMemory={() => setShowForm(true)} />

      {showForm && (
        <AddMemoryForm
          onAdd={addMemory}
          onClose={() => setShowForm(false)}
          editingMemory={null}
        />
      )}
    </div>
  );
};

export default Playlist;
