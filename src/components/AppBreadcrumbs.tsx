import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type BreadcrumbItem = {
  label: string;
  onClick?: () => void;
};

interface AppBreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

const AppBreadcrumbs = ({ items, className }: AppBreadcrumbsProps) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-4 flex items-center gap-1.5 text-sm", className)}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <div key={`${item.label}-${index}`} className="flex items-center gap-1.5 min-w-0">
            {item.onClick && !isLast ? (
              <button
                type="button"
                onClick={item.onClick}
                className="truncate text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </button>
            ) : (
              <span className={cn("truncate", isLast ? "font-medium text-foreground" : "text-muted-foreground")}>
                {item.label}
              </span>
            )}
            {!isLast && <ChevronRight size={14} className="shrink-0 text-muted-foreground/70" />}
          </div>
        );
      })}
    </nav>
  );
};

export default AppBreadcrumbs;
