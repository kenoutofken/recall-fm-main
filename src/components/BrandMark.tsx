import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  markOnly?: boolean;
};

const BrandMark = ({ className, markOnly = false }: BrandMarkProps) => (
  <span
    className={cn("inline-flex items-center gap-2 font-display font-bold text-foreground", className)}
    aria-label={markOnly ? "LifePlayback" : undefined}
  >
    <Heart size={17} fill="currentColor" strokeWidth={0} className="shrink-0 text-primary" aria-hidden="true" />
    {!markOnly && <span className="text-xl font-bold leading-none tracking-normal">LifePlayback</span>}
  </span>
);

export default BrandMark;
