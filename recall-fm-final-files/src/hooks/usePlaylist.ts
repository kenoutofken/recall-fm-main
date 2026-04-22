import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PlaylistSong {
  id: string;
  songTitle: string;
  artist: string;
  memoryId: string | null;
  createdAt: string;
}

export function usePlaylist() {
  const { user } = useAuth();
  const [songs, setSongs] = useState<PlaylistSong[]>([]);
  const [songKeys, setSongKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // A normalized title/artist key prevents duplicate songs without needing an extra database query.
  const makeKey = (title: string, artist: string) => `${title.toLowerCase()}::${artist.toLowerCase()}`;

  const fetchSongs = useCallback(async () => {
    // Playlist rows are owned per user and ordered newest-first for the playlist page.
    if (!user) return;
    const { data, error } = await supabase
      .from("playlist_songs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      const mapped = (data ?? []).map((r) => ({
        id: r.id,
        songTitle: r.song_title,
        artist: r.artist,
        memoryId: r.memory_id,
        createdAt: r.created_at,
      }));
      setSongs(mapped);
      setSongKeys(new Set(mapped.map((s) => makeKey(s.songTitle, s.artist))));
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  const addSong = async (songTitle: string, artist: string, memoryId?: string) => {
    if (!user) return;
    const key = makeKey(songTitle, artist);
    if (songKeys.has(key)) {
      return;
      return;
    }

    // Optimistic update prevents repeated clicks while the insert is in flight.
    setSongKeys((prev) => new Set(prev).add(key));

    const { error } = await supabase.from("playlist_songs").insert({
      user_id: user.id,
      song_title: songTitle,
      artist: artist,
      memory_id: memoryId || null,
    });

    if (error) {
      console.error(error);
      toast.error("Failed to add to playlist");
      setSongKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    } else {
      fetchSongs();
      fetchSongs();
    }
  };

  const removeSong = async (id: string) => {
    if (!user) return;
    const song = songs.find((s) => s.id === id);
    
    // Optimistically remove the song and roll back by refetching if Supabase rejects the delete.
    setSongs((prev) => prev.filter((s) => s.id !== id));
    if (song) {
      setSongKeys((prev) => {
        const next = new Set(prev);
        next.delete(makeKey(song.songTitle, song.artist));
        return next;
      });
    }

    const { error } = await supabase.from("playlist_songs").delete().eq("id", id);
    if (error) {
      console.error(error);
      toast.error("Failed to remove from playlist");
      fetchSongs();
    }
  };

  const isSongInPlaylist = (songTitle: string, artist: string) => {
    return songKeys.has(makeKey(songTitle, artist));
  };

  return { songs, loading, addSong, removeSong, isSongInPlaylist };
}
