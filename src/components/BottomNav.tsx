import { BookOpen, BookOpenText, Compass, Plus, Map } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onNewMemory?: () => void;
}

const BottomNav = ({ onNewMemory }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border">
      <div className="max-w-lg mx-auto grid grid-cols-3 items-center py-2 px-4">
        <NavLink
          to="/journal"
          className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground transition-all"
          activeClassName="text-primary font-semibold"
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "p-2 rounded-xl transition-all",
                isActive && "bg-primary/20"
              )}>
                {isActive ? (
                  <BookOpenText size={22} strokeWidth={2.5} />
                ) : (
                  <BookOpen size={22} />
                )}
              </div>
              <span className="text-[11px]">Journal</span>
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
          to="/"
          end
          className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground transition-all"
          activeClassName="text-primary font-semibold"
        >
          {({ isActive }) => (
            <>
              <div className={cn(
                "p-2 rounded-xl transition-all",
                isActive && "bg-primary/20"
              )}>
                {isActive ? (
                  <Map size={22} strokeWidth={2.5} />
                ) : (
                  <Compass size={22} />
                )}
              </div>
              <span className="text-[11px]">Discover</span>
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
};

export default BottomNav;
