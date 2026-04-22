/**
 * Generates a unique gradient cover image as a data URL using Canvas API.
 * Based on mood keywords, title, and artist to create Spotify-style gradients.
 * Free, instant, unlimited — no API calls needed.
 */

// Simple hash function to get deterministic but varied numbers from a string
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Mood-to-color palette mapping
const MOOD_PALETTES: Record<string, [string, string, string]> = {
  happy: ["#FFD700", "#FF6B35", "#FF1493"],
  joyful: ["#FFD700", "#FF6B35", "#FF1493"],
  excited: ["#FF4500", "#FF1493", "#FFD700"],
  energetic: ["#FF6B35", "#FF4500", "#FFEA00"],
  chill: ["#1DB954", "#0EA5E9", "#6366F1"],
  relaxed: ["#0EA5E9", "#6366F1", "#1DB954"],
  peaceful: ["#0EA5E9", "#38BDF8", "#A78BFA"],
  nostalgic: ["#D97706", "#92400E", "#FDE68A"],
  melancholic: ["#6366F1", "#4338CA", "#1E1B4B"],
  sad: ["#3B82F6", "#1E3A5F", "#6366F1"],
  romantic: ["#EC4899", "#F43F5E", "#FB7185"],
  dreamy: ["#A78BFA", "#818CF8", "#C084FC"],
  angry: ["#DC2626", "#7F1D1D", "#F97316"],
  intense: ["#DC2626", "#9333EA", "#F97316"],
  grateful: ["#F59E0B", "#10B981", "#FBBF24"],
  inspired: ["#8B5CF6", "#EC4899", "#F59E0B"],
  lonely: ["#1E3A5F", "#374151", "#6B7280"],
  adventurous: ["#059669", "#D97706", "#0EA5E9"],
  wild: ["#F43F5E", "#D946EF", "#FBBF24"],
  bittersweet: ["#D97706", "#6366F1", "#F9A8D4"],
};

const DEFAULT_PALETTES: [string, string, string][] = [
  ["#6366F1", "#EC4899", "#F59E0B"],
  ["#0EA5E9", "#8B5CF6", "#F43F5E"],
  ["#10B981", "#3B82F6", "#F59E0B"],
  ["#D946EF", "#F43F5E", "#FFD700"],
  ["#059669", "#0EA5E9", "#A78BFA"],
];

function getPalette(mood: string, title: string): [string, string, string] {
  // Check mood keywords against palette map
  const moodLower = mood.toLowerCase();
  for (const [key, palette] of Object.entries(MOOD_PALETTES)) {
    if (moodLower.includes(key)) return palette;
  }
  // Fallback: pick from defaults based on title hash
  const hash = hashString(title + mood);
  return DEFAULT_PALETTES[hash % DEFAULT_PALETTES.length];
}

export function generateGradientCover(
  title: string,
  mood: string,
  artist?: string,
  size = 512
): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  const seed = hashString(title + mood + (artist || ""));
  const palette = getPalette(mood, title);

  // Background fill
  ctx.fillStyle = palette[2];
  ctx.fillRect(0, 0, size, size);

  // Draw multiple radial gradients for depth
  const numBlobs = 3 + (seed % 3);
  for (let i = 0; i < numBlobs; i++) {
    const blobSeed = hashString(title + i.toString());
    const x = (blobSeed % size) * 0.8 + size * 0.1;
    const y = ((blobSeed >> 8) % size) * 0.8 + size * 0.1;
    const radius = size * (0.3 + (blobSeed % 40) / 100);

    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    const color = palette[i % palette.length];
    grad.addColorStop(0, color + "CC");
    grad.addColorStop(0.6, color + "66");
    grad.addColorStop(1, color + "00");

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }

  // Add a subtle diagonal linear gradient overlay
  ctx.globalCompositeOperation = "overlay";
  const angle = (seed % 360) * (Math.PI / 180);
  const lx = size / 2 + Math.cos(angle) * size;
  const ly = size / 2 + Math.sin(angle) * size;
  const lg = ctx.createLinearGradient(size / 2 - Math.cos(angle) * size, size / 2 - Math.sin(angle) * size, lx, ly);
  lg.addColorStop(0, "rgba(255,255,255,0.15)");
  lg.addColorStop(0.5, "rgba(0,0,0,0)");
  lg.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = lg;
  ctx.fillRect(0, 0, size, size);

  // Add subtle grain texture
  ctx.globalCompositeOperation = "overlay";
  const imageData = ctx.getImageData(0, 0, size, size);
  const data = imageData.data;
  for (let p = 0; p < data.length; p += 4) {
    const noise = (hashString(p.toString() + seed.toString()) % 30) - 15;
    data[p] = Math.min(255, Math.max(0, data[p] + noise));
    data[p + 1] = Math.min(255, Math.max(0, data[p + 1] + noise));
    data[p + 2] = Math.min(255, Math.max(0, data[p + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.85);
}
