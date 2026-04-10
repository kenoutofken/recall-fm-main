import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useLikes(memoryIds: string[]) {
  const { user } = useAuth();
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  const fetchLikes = useCallback(async () => {
    if (memoryIds.length === 0) return;

    // Fetch counts
    const { data: allLikes } = await supabase
      .from("memory_likes")
      .select("memory_id")
      .in("memory_id", memoryIds);

    const counts: Record<string, number> = {};
    (allLikes ?? []).forEach((l) => {
      counts[l.memory_id] = (counts[l.memory_id] || 0) + 1;
    });
    setLikeCounts(counts);

    // Fetch user's likes
    if (user) {
      const { data: myLikes } = await supabase
        .from("memory_likes")
        .select("memory_id")
        .in("memory_id", memoryIds)
        .eq("user_id", user.id);

      setUserLikes(new Set((myLikes ?? []).map((l) => l.memory_id)));
    }
  }, [memoryIds.join(","), user]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const toggleLike = async (memoryId: string) => {
    if (!user) return;

    if (userLikes.has(memoryId)) {
      // Unlike
      setUserLikes((prev) => {
        const next = new Set(prev);
        next.delete(memoryId);
        return next;
      });
      setLikeCounts((prev) => ({ ...prev, [memoryId]: Math.max(0, (prev[memoryId] || 1) - 1) }));

      await supabase
        .from("memory_likes")
        .delete()
        .eq("memory_id", memoryId)
        .eq("user_id", user.id);
    } else {
      // Like
      setUserLikes((prev) => new Set(prev).add(memoryId));
      setLikeCounts((prev) => ({ ...prev, [memoryId]: (prev[memoryId] || 0) + 1 }));

      await supabase
        .from("memory_likes")
        .insert({ memory_id: memoryId, user_id: user.id });
    }
  };

  return { likeCounts, userLikes, toggleLike };
}
