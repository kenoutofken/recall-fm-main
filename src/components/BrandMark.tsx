import { Heart, Play } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  markOnly?: boolean;
};

const BrandMark = ({ className, markOnly = false }: BrandMarkProps) => (
  <span className={cn("inline-flex items-center gap-2 font-display font-bold text-foreground", className)}>
    <span className="relative flex h-7 w-7 shrink-0 items-center justify-center text-primary" aria-hidden="true">
      <Heart size={27} fill="currentColor" strokeWidth={0} />
      <Play size={10} fill="hsl(var(--background))" strokeWidth={0} className="absolute left-[10px] top-[8px]" />
    </span>
    {!markOnly && (
      <span className="text-xl leading-none tracking-normal">
        <span className="font-semibold">Life</span>
        <span className="font-bold">Playback</span>
      </span>
    )}
  </span>
);

export default BrandMark;
