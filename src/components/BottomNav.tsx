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
    "my-2 flex flex-col items-center gap-1 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  const activeNavItemClass = "bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary hover:text-primary-foreground";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border">
      <div className="max-w-lg mx-auto grid grid-cols-3 items-center gap-2 px-4 pb-2 pt-0">
        <NavLink
          to="/"
          end
          className={cn(navItemClass, isDiscoverActive && activeNavItemClass)}
        >
          {() => (
            <>
              <div className="transition-colors">
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
              <div className="transition-colors">
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
