import { BookOpen, Compass, Plus } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

interface BottomNavProps {
  onNewMemory?: () => void;
}

const BottomNav = ({ onNewMemory }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border">
      <div className="max-w-lg mx-auto grid grid-cols-3 items-center px-4 pb-2 pt-0">
        <NavLink
          to="/"
          end
          className="relative flex flex-col items-center gap-1 px-3 pb-2 pt-3 text-muted-foreground transition-colors"
          activeClassName="text-primary font-semibold"
        >
          {({ isActive }) => (
            <>
              <span className={cn(
                "absolute left-1/2 top-0 h-0.5 w-12 -translate-x-1/2 rounded-full bg-primary opacity-0 transition-opacity",
                isActive && "opacity-100"
              )} />
              <div className="p-2 transition-colors">
                <Compass
                  size={23}
                  strokeWidth={isActive ? 2.5 : 2}
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
          className="relative flex flex-col items-center gap-1 px-3 pb-2 pt-3 text-muted-foreground transition-colors"
          activeClassName="text-primary font-semibold"
        >
          {({ isActive }) => (
            <>
              <span className={cn(
                "absolute left-1/2 top-0 h-0.5 w-12 -translate-x-1/2 rounded-full bg-primary opacity-0 transition-opacity",
                isActive && "opacity-100"
              )} />
              <div className="p-2 transition-colors">
                <BookOpen
                  size={23}
                  strokeWidth={isActive ? 2.5 : 2}
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
