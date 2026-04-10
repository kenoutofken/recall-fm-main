import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MiniPlayerProps {
  songTitle: string;
  artist: string;
  autoPlay?: boolean;
  variant?: "default" | "overlay";
}

interface DeezerTrack {
  preview: string;
  title: string;
  artist: string;
  album: string;
  albumCover: string;
  duration: number;
}

const MiniPlayer = ({ songTitle, artist, autoPlay = false, variant = "default" }: MiniPlayerProps) => {
  const isOverlay = variant === "overlay";
  const [track, setTrack] = useState<DeezerTrack | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [muted, setMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animRef = useRef<number>(0);

  const searchTrack = useCallback(async () => {
    if (searched) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data, error } = await supabase.functions.invoke("deezer-search", {
        body: { query: `${songTitle} ${artist}` },
      });
      if (!error && data?.track) {
        setTrack(data.track);
      }
    } catch (e) {
      console.error("Deezer search failed:", e);
    }
    setLoading(false);
  }, [songTitle, artist, searched]);

  // Lazy-load: search on mount
  useEffect(() => {
    searchTrack();
  }, [searchTrack]);

  // Auto-play when active, stop when not
  useEffect(() => {
    if (autoPlay && track && audioRef.current && !playing) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
    if (!autoPlay && audioRef.current && playing) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
      setProgress(0);
    }
  }, [autoPlay, track]);

  const togglePlay = () => {
    if (!audioRef.current || !track) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const updateProgress = useCallback(() => {
    if (audioRef.current) {
      const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isNaN(pct) ? 0 : pct);
    }
    animRef.current = requestAnimationFrame(updateProgress);
  }, []);

  useEffect(() => {
    if (playing) {
      animRef.current = requestAnimationFrame(updateProgress);
    } else {
      cancelAnimationFrame(animRef.current);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [playing, updateProgress]);

  const handleEnded = () => {
    setPlaying(false);
    setProgress(0);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
    setProgress(pct * 100);
  };

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 rounded-md px-3 py-2", isOverlay ? "bg-black/50 backdrop-blur-sm" : "bg-muted")}>
        <Loader2 size={14} className={cn("animate-spin", isOverlay ? "text-white" : "text-primary")} />
        <span className={cn("text-xs", isOverlay ? "text-white/70" : "text-muted-foreground")}>Finding preview…</span>
      </div>
    );
  }

  if (!track) {
    return (
      <div className={cn("flex items-center gap-2 rounded-md px-3 py-2", isOverlay ? "bg-black/50 backdrop-blur-sm" : "bg-muted")}>
        <span className={cn("text-xs", isOverlay ? "text-white/70" : "text-muted-foreground")}>No preview available</span>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg overflow-hidden", isOverlay ? "bg-black/50 backdrop-blur-sm border-0" : "border border-border bg-muted/50")}>
      <div className="flex items-center gap-3 p-3">
        {track.albumCover && (
          <img
            src={track.albumCover}
            alt={track.album}
            className="h-10 w-10 rounded-md object-cover shrink-0"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium truncate", isOverlay ? "text-white" : "text-foreground")}>{track.title}</p>
          <p className={cn("text-xs truncate", isOverlay ? "text-white/70" : "text-muted-foreground")}>{track.artist}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setMuted(!muted)}
            className={cn("transition-colors p-1", isOverlay ? "text-white/70 hover:text-white" : "text-muted-foreground hover:text-foreground")}
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button
            onClick={togglePlay}
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center transition-colors",
              isOverlay ? "bg-white text-black hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div
        className={cn("h-1 cursor-pointer", isOverlay ? "bg-white/20" : "bg-muted")}
        onClick={handleProgressClick}
      >
        <div
          className={cn("h-full transition-[width] duration-100", isOverlay ? "bg-white" : "bg-primary")}
          style={{ width: `${progress}%` }}
        />
      </div>
      <audio
        ref={audioRef}
        src={track.preview}
        muted={muted}
        onEnded={handleEnded}
        preload="none"
      />
    </div>
  );
};

export default MiniPlayer;
