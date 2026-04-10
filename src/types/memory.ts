export interface Memory {
  id: string;
  title: string;
  description: string;
  songTitle: string;
  artist: string;
  date: string;
  mood: string;
  people: string[];
  isPublic: boolean;
  imageUrl?: string | null;
  tags: string[];
  createdAt: string;
}

export const MEMORY_TYPES = [
  "Family",
  "Friends",
  "Travel",
  "Holiday",
  "Adventure",
  "Relationship",
  "Solo",
  "Work",
] as const;

export const MOODS = [
  { emoji: "☀️", label: "Joyful" },
  { emoji: "🌧️", label: "Melancholy" },
  { emoji: "🌙", label: "Nostalgic" },
  { emoji: "🌸", label: "Peaceful" },
  { emoji: "🔥", label: "Energized" },
  { emoji: "🍂", label: "Bittersweet" },
] as const;
