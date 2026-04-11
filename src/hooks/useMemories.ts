import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Memory } from "@/types/memory";
import { toast } from "sonner";

export function useMemories() {
  const { user } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMemories = useCallback(async () => {
    if (!user) { setMemories([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("memories")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) {
      toast.error("Failed to load memories");
      console.error(error);
    } else {
      setMemories(
        (data ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description ?? "",
          songTitle: r.song_title,
          artist: r.artist,
          date: r.date,
          memoryYear: r.memory_year ?? null,
          memorySeason: r.memory_season ?? null,
          locationName: r.location_name ?? null,
          locationLat: r.location_lat ?? null,
          locationLng: r.location_lng ?? null,
          locationPlaceId: r.location_place_id ?? null,
          mood: r.mood,
          people: r.people ?? [],
          isPublic: r.is_public ?? false,
          imageUrl: r.image_url ?? null,
          tags: r.tags ?? [],
          createdAt: r.created_at,
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`journal-memories-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "memories",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchMemories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchMemories]);

  const addMemory = async (memory: Omit<Memory, "id" | "createdAt">) => {
    if (!user) return;
    const { error } = await supabase.from("memories").insert({
      user_id: user.id,
      title: memory.title,
      description: memory.description,
      song_title: memory.songTitle,
      artist: memory.artist,
      date: memory.date,
      memory_year: memory.memoryYear ?? null,
      memory_season: memory.memorySeason ?? null,
      location_name: memory.locationName ?? null,
      location_lat: memory.locationLat ?? null,
      location_lng: memory.locationLng ?? null,
      location_place_id: memory.locationPlaceId ?? null,
      mood: memory.mood,
      people: memory.people,
      is_public: memory.isPublic,
      image_url: memory.imageUrl ?? null,
      tags: memory.tags ?? [],
    });
    if (error) {
      toast.error(error.message || "Failed to save memory");
      console.error(error);
    } else {
      toast.success("Memory saved!");
      fetchMemories();
    }
  };

  const updateMemory = async (id: string, memory: Omit<Memory, "id" | "createdAt">) => {
    const { error } = await supabase.from("memories").update({
      title: memory.title,
      description: memory.description,
      song_title: memory.songTitle,
      artist: memory.artist,
      date: memory.date,
      memory_year: memory.memoryYear ?? null,
      memory_season: memory.memorySeason ?? null,
      location_name: memory.locationName ?? null,
      location_lat: memory.locationLat ?? null,
      location_lng: memory.locationLng ?? null,
      location_place_id: memory.locationPlaceId ?? null,
      mood: memory.mood,
      people: memory.people,
      is_public: memory.isPublic,
      image_url: memory.imageUrl ?? null,
      tags: memory.tags ?? [],
    }).eq("id", id);
    if (error) {
      toast.error(error.message || "Failed to update memory");
      console.error(error);
    } else {
      toast.success("Memory updated!");
      fetchMemories();
    }
  };

  const deleteMemory = async (id: string) => {
    const { error } = await supabase.from("memories").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete memory");
    } else {
      setMemories((prev) => prev.filter((m) => m.id !== id));
    }
  };

  return { memories, loading, addMemory, updateMemory, deleteMemory };
}
