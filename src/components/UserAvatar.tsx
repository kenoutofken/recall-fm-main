import { LogOut, ListMusic } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const UserAvatar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "??";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
          {user?.email}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/playlist")} className="gap-2 cursor-pointer">
          <ListMusic size={14} />
          My Playlist
        </DropdownMenuItem>
        <DropdownMenuItem onClick={signOut} className="gap-2 cursor-pointer">
          <LogOut size={14} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatar;
