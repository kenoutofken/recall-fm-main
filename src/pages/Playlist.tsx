import { useMemo, useState } from "react";
import { usePlaylist } from "@/hooks/usePlaylist";
import { Trash2, Copy, ExternalLink, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import BrandMark from "@/components/BrandMark";
import UserAvatar from "@/components/UserAvatar";
import AudioToggleButton from "@/components/AudioToggleButton";
import NotificationButton from "@/components/NotificationButton";
import AddMemoryForm from "@/components/AddMemoryForm";
import { useMemories } from "@/hooks/useMemories";
import { toast } from "sonner";
import MiniPlayer from "@/components/MiniPlayer";

const TUNEMYMUSIC_URL = "https://www.tunemymusic.com/transfer";

const Playlist = () => {
  const navigate = useNavigate();
  const { songs, loading, removeSong } = usePlaylist();
  const { addMemory } = useMemories();
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const playlistText = useMemo(() => {
    // TuneMyMusic accepts a simple "Song - Artist" list, one track per line.
    return songs.map((s) => `${s.songTitle} - ${s.artist}`).join("\n");
  }, [songs]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <BrandMark />
            </button>
            <span className="text-muted-foreground/30">|</span>
            <h1 className="font-display text-xl font-normal text-foreground">My Playlist</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationButton />
            <AudioToggleButton />
            <UserAvatar />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-4 pb-24">
        {/* Exports saved songs into a plain text format the external playlist-transfer tool can import. */}
        {songs.length > 0 && (
          <div className="rounded-lg border border-border bg-card p-4 mb-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-lg">🎵</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Transfer with TuneMyMusic</p>
                <p className="text-xs text-muted-foreground">
                  Copy this song list, then paste it into TuneMyMusic's text import.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-background p-3">
              <p className="mb-2 text-xs font-medium text-foreground">What gets copied</p>
              <textarea
                readOnly
                value={playlistText}
                rows={Math.min(6, Math.max(3, songs.length))}
                className="w-full resize-none rounded-md border border-input bg-card px-3 py-2 text-xs leading-relaxed text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label="Song list to paste into TuneMyMusic"
              />
            </div>

            <div className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
              <p className="font-medium text-foreground">How to import</p>
              <p>1. Copy the song list above.</p>
              <p>2. Open TuneMyMusic and start a New Transfer.</p>
              <p>3. Choose Free text as the source, paste the list, then pick Spotify, Apple Music, or another destination.</p>
            </div>

            <Button
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(playlistText).then(() => {
                  setCopied(true);
                  toast.success("Playlist copied. Paste it into TuneMyMusic's text import.");
                  setTimeout(() => {
                    window.open(TUNEMYMUSIC_URL, "_blank");
                  }, 400);
                  setTimeout(() => setCopied(false), 3000);
                }).catch(() => {
                  toast.error("Could not copy playlist. Select the song list and copy it manually.");
                });
              }}
              className="gap-1.5 w-full"
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
          onAdd={async (data) => {
            const createdMemory = await addMemory(data);
            if (!createdMemory) return false;
            navigate(`/journal/memories/${createdMemory.id}`);
            return true;
          }}
          onClose={() => setShowForm(false)}
          editingMemory={null}
        />
      )}
    </div>
  );
};

export default Playlist;
