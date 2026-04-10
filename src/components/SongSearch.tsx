import { useState, useEffect, useRef, useCallback } from "react";
import { Music, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DeezerTrack {
  title: string;
  artist: string;
  album: string;
  albumCover: string;
}

interface SongSearchProps {
  songTitle: string;
  artist: string;
  onSelect: (songTitle: string, artist: string) => void;
  onSongTitleChange: (value: string) => void;
  onArtistChange: (value: string) => void;
}

const SongSearch = ({
  songTitle,
  artist,
  onSelect,
  onSongTitleChange,
  onArtistChange,
}: SongSearchProps) => {
  const [suggestions, setSuggestions] = useState<DeezerTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("deezer-search", {
        body: { query, limit: 5 },
      });
      if (!error && data?.tracks) {
        setSuggestions(data.tracks);
        setShowSuggestions(true);
      }
    } catch {
      // silent fail
    }
    setLoading(false);
  }, []);

  const handleInputChange = (value: string, field: "song" | "artist") => {
    if (field === "song") onSongTitleChange(value);
    else onArtistChange(value);

    const query = field === "song" ? `${value} ${artist}` : `${songTitle} ${value}`;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query.trim()), 350);
  };

  const handleSelect = (track: DeezerTrack) => {
    onSelect(track.title, track.artist);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={containerRef} className="relative space-y-3">
      <div className="relative">
        <input
          value={songTitle}
          onChange={(e) => handleInputChange(e.target.value, "song")}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Song name"
          className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          required
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {loading ? (
            <Loader2 size={14} className="text-muted-foreground animate-spin" />
          ) : (
            <Search size={14} className="text-muted-foreground" />
          )}
        </div>
      </div>
      <input
        value={artist}
        onChange={(e) => handleInputChange(e.target.value, "artist")}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder="Artist"
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        required
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
          {suggestions.map((track, i) => (
            <button
              key={`${track.title}-${track.artist}-${i}`}
              type="button"
              onClick={() => handleSelect(track)}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
            >
              {track.albumCover ? (
                <img src={track.albumCover} alt="" className="h-8 w-8 rounded object-cover shrink-0" />
              ) : (
                <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0">
                  <Music size={14} className="text-muted-foreground" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{track.title}</p>
                <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SongSearch;
