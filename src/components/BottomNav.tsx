import { BookOpen, Compass, Plus } from "lucide-react";
import { useLocation } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onNewMemory?: () => void;
}

const BottomNav = ({ onNewMemory }: BottomNavProps) => {
  const location = useLocation();
  const isDiscoverActive = location.pathname === "/" || location.pathname.startsWith("/discover");
  const isJournalActive = location.pathname.startsWith("/journal");
  const navItemClass =
    "group relative flex flex-col items-center gap-1 px-3 pb-2 pt-3 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const activeNavItemClass = "text-primary font-semibold hover:text-primary";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border">
      <div className="max-w-lg mx-auto grid grid-cols-3 items-center px-4 pb-2 pt-0">
        <NavLink
          to="/"
          end
          className={cn(navItemClass, isDiscoverActive && activeNavItemClass)}
        >
          {() => (
            <>
              <span className={cn(
                "absolute left-1/2 top-0 h-1 w-12 -translate-x-1/2 rounded-full bg-primary opacity-0 transition-opacity",
                isDiscoverActive && "opacity-100"
              )} />
              <div className={cn(
                "flex h-8 w-12 items-center justify-center transition-colors",
                !isDiscoverActive && "group-hover:text-foreground"
              )}>
                <Compass
                  size={23}
                  strokeWidth={isDiscoverActive ? 2.5 : 2}
                />
              </div>
              <span className="text-[11px]">Discover</span>
            </>
          )}
        </NavLink>

        <div className="flex justify-center">
          <button
            onClick={onNewMemory}
            className="flex items-center justify-center w-12 h-12 -mt-5 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={22} />
          </button>
        </div>

        <NavLink
          to="/journal"
          className={cn(navItemClass, isJournalActive && activeNavItemClass)}
        >
          {() => (
            <>
              <span className={cn(
                "absolute left-1/2 top-0 h-1 w-12 -translate-x-1/2 rounded-full bg-primary opacity-0 transition-opacity",
                isJournalActive && "opacity-100"
              )} />
              <div className={cn(
                "flex h-8 w-12 items-center justify-center transition-colors",
                !isJournalActive && "group-hover:text-foreground"
              )}>
                <BookOpen
                  size={23}
                  strokeWidth={isJournalActive ? 2.5 : 2}
                />
              </div>
              <span className="text-[11px]">Journal</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
