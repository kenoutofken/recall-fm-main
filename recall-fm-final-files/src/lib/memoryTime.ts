import { MEMORY_SEASONS } from "@/types/memory";

export const dateFromYearSeason = (year: number, season: string) => {
  const monthBySeason: Record<string, string> = {
    Winter: "01",
    Spring: "04",
    Summer: "07",
    Fall: "10",
  };

  return `${year}-${monthBySeason[season] ?? "01"}-01`;
};

export const seasonFromDate = (date: string) => {
  const month = new Date(date).getMonth();
  if (month <= 1 || month === 11) return "Winter";
  if (month <= 4) return "Spring";
  if (month <= 7) return "Summer";
  return "Fall";
};

export const yearFromDate = (date: string) => new Date(date).getFullYear();

export const formatMemoryTime = (memory: { date: string; memoryYear?: number | null; memorySeason?: string | null }) => {
  const year = memory.memoryYear ?? yearFromDate(memory.date);
  const season = memory.memorySeason ?? seasonFromDate(memory.date);
  return MEMORY_SEASONS.includes(season as any) ? `${season} ${year}` : `${year}`;
};
