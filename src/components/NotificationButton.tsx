import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, Heart, Loader2, Music, UserPlus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PressableButton } from "@/components/ui/pressable-button";
import { toast } from "sonner";

type ProfileSummary = {
  username: string | null;
  displayName: string | null;
};

type OwnedMemorySummary = {
  id: string;
  title: string;
  songTitle: string;
};

type NotificationItem = {
  id: string;
  type: "memory_like" | "follow" | "playlist_add";
  actorId: string | null;
  actorName: string;
  createdAt: string;
  readAt: string | null;
  memory?: OwnedMemorySummary;
};

const formatActorName = (profile: ProfileSummary | undefined) => {
  if (!profile) return "Someone";
  if (profile.displayName) return profile.displayName;
  if (profile.username) return `@${profile.username}`;
  return "Someone";
};

const NotificationButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followSavingId, setFollowSavingId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    // Notifications store ids only, so this joins actor profiles and memory titles for display.
    if (!user) return;

    setLoading(true);

    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, actor_id, memory_id, created_at, read_at")
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    const rawNotifications = (data ?? [])
      .filter((notification) =>
        notification.type === "memory_like" ||
        notification.type === "follow" ||
        notification.type === "playlist_add"
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 40);

    const actorIds = Array.from(new Set(rawNotifications.map((notification) => notification.actor_id).filter(Boolean)));
    const memoryIds = Array.from(new Set(rawNotifications.map((notification) => notification.memory_id).filter(Boolean)));

    const [profilesResult, memoriesResult, followingResult] = await Promise.all([
      actorIds.length > 0
        ? supabase
            .from("profiles")
            .select("user_id, username, display_name")
            .in("user_id", actorIds)
        : Promise.resolve({ data: [], error: null }),
      memoryIds.length > 0
        ? supabase
            .from("memories")
            .select("id, title, song_title")
            .in("id", memoryIds)
        : Promise.resolve({ data: [], error: null }),
      actorIds.length > 0
        ? supabase
            .from("follows")
            .select("following_id")
            .eq("follower_id", user.id)
            .in("following_id", actorIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (profilesResult.error || memoriesResult.error || followingResult.error) {
      console.error(profilesResult.error ?? memoriesResult.error ?? followingResult.error);
      setLoading(false);
      return;
    }

    const profilesById = new Map<string, ProfileSummary>(
      (profilesResult.data ?? []).map((profile) => [
        profile.user_id,
        {
          username: profile.username,
          displayName: profile.display_name,
        },
      ]),
    );
    setFollowingIds(new Set((followingResult.data ?? []).map((follow) => follow.following_id)));

    const memoriesById = new Map<string, OwnedMemorySummary>(
      (memoriesResult.data ?? []).map((memory) => [
        memory.id,
        {
          id: memory.id,
          title: memory.title,
          songTitle: memory.song_title,
        },
      ]),
    );

    setNotifications(rawNotifications.map((notification) => ({
      id: notification.id,
      type: notification.type as "memory_like" | "follow" | "playlist_add",
      actorId: notification.actor_id,
      actorName: notification.actor_id ? formatActorName(profilesById.get(notification.actor_id)) : "Someone",
      createdAt: notification.created_at,
      readAt: notification.read_at,
      memory: notification.memory_id ? memoriesById.get(notification.memory_id) : undefined,
    })));
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const markNotificationsRead = async () => {
      // Opening the drawer marks unread items locally first, then persists read_at in Supabase.
      if (!open || !user) return;
      const unreadIds = notifications
        .filter((notification) => !notification.readAt)
        .map((notification) => notification.id);
      if (unreadIds.length === 0) return;

      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) =>
          unreadIds.includes(notification.id) ? { ...notification, readAt } : notification
        )
      );

      const { error } = await supabase
        .from("notifications")
        .update({ read_at: readAt })
        .in("id", unreadIds)
        .eq("user_id", user.id);

      if (error) {
        console.error(error);
        fetchNotifications();
      }
    };

    markNotificationsRead();
  }, [fetchNotifications, notifications, open, user]);

  useEffect(() => {
    if (!user) return;

    // Realtime updates the bell badge immediately when someone likes or follows.
    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => fetchNotifications(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchNotifications, user]);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.readAt).length;
  }, [notifications]);

  const openMemory = (memoryId: string) => {
    setOpen(false);
    navigate(`/journal/memories/${memoryId}`);
  };

  const followBack = async (notification: NotificationItem) => {
    if (!user || !notification.actorId || followSavingId === notification.actorId) return;

    setFollowSavingId(notification.actorId);
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, following_id: notification.actorId });

    if (error) {
      toast.error(error.message);
    } else {
      setFollowingIds((current) => new Set(current).add(notification.actorId as string));
      toast.success(`Following ${notification.actorName}`);
    }

    setFollowSavingId(null);
  };

  const clearNotifications = async () => {
    // Clear all is optimistic; if the delete fails, the previous list is restored.
    if (!user || notifications.length === 0 || clearing) return;

    const previousNotifications = notifications;
    setClearing(true);
    setNotifications([]);

    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error(error);
      setNotifications(previousNotifications);
    }

    setClearing(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <PressableButton
          type="button"
          className={cn(
            "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-transparent text-foreground transition-all hover:scale-105 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            unreadCount > 0
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
          title="Notifications"
        >
          <Bell size={20} strokeWidth={2.6} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </PressableButton>
      </SheetTrigger>
      <SheetContent side="right" className="flex h-full w-[92vw] flex-col overflow-hidden p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border px-5 pb-3 pt-5 pr-16 text-left">
          <div className="flex min-h-10 items-center justify-between gap-3">
            <SheetTitle className="min-w-0 font-display leading-none">Notifications</SheetTitle>
            {notifications.length > 0 && (
              <PressableButton
                type="button"
                onClick={clearNotifications}
                disabled={clearing}
                className="inline-flex h-8 shrink-0 items-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                {clearing ? "Clearing" : "Clear all"}
              </PressableButton>
            )}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className="card-strong flex items-center justify-center gap-2 rounded-lg py-6 text-sm text-muted-foreground">
              <Loader2 size={16} className="animate-spin" />
              Loading notifications
            </div>
          ) : notifications.length === 0 ? (
            <p className="card-strong rounded-lg px-3 py-4 text-center text-sm text-muted-foreground">
              Likes, playlist saves, and new followers will appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const isUnread = !notification.readAt;
                const Icon = notification.type === "memory_like"
                  ? Heart
                  : notification.type === "playlist_add"
                    ? Music
                    : UserPlus;
                const canFollowBack = (
                  notification.type === "follow" &&
                  Boolean(notification.actorId) &&
                  !followingIds.has(notification.actorId as string)
                );
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "card-strong flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                      notification.memory ? "hover:bg-muted" : "cursor-default",
                    )}
                    >
                    <button
                      type="button"
                      onClick={() => notification.memory && openMemory(notification.memory.id)}
                      disabled={!notification.memory}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left disabled:cursor-default"
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          notification.type === "memory_like"
                            ? "bg-destructive/10 text-destructive"
                            : notification.type === "playlist_add"
                              ? "bg-emerald-500/10 text-emerald-600"
                              : "bg-primary/10 text-primary",
                        )}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-snug text-foreground">
                          <span className="font-medium">{notification.actorName}</span>{" "}
                          {notification.type === "memory_like"
                            ? "liked your memory"
                            : notification.type === "playlist_add"
                              ? "saved your song to their playlist"
                              : "followed you"}
                        </span>
                        {notification.memory && (
                          <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                            {notification.type === "playlist_add"
                              ? `${notification.memory.songTitle} from ${notification.memory.title}`
                              : notification.memory.title}
                          </span>
                        )}
                        <span className="mt-1 block text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </span>
                    </button>
                    {canFollowBack && (
                      <PressableButton
                        type="button"
                        onClick={() => followBack(notification)}
                        disabled={followSavingId === notification.actorId}
                        className="mt-0.5 shrink-0 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
                      >
                        {followSavingId === notification.actorId ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          "Follow back"
                        )}
                      </PressableButton>
                    )}
                    {isUnread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NotificationButton;
