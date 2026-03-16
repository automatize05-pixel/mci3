import { Link } from "react-router-dom";
import { ChefHat } from "lucide-react";

interface AvatarProps {
  userId?: string;
  src?: string | null;
  name?: string | null;
  username?: string | null;
  isChef?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  linked?: boolean;
}

const sizes = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-2xl",
};

const badgeSizes = {
  sm: "w-3.5 h-3.5 -bottom-0.5 -right-0.5",
  md: "w-4 h-4 -bottom-0.5 -right-0.5",
  lg: "w-5 h-5 bottom-0 right-0",
  xl: "w-6 h-6 bottom-0.5 right-0.5",
};

const UserAvatar = ({ userId, src, name, username, isChef, size = "md", linked = true }: AvatarProps) => {
  const initial = (name?.[0] || username?.[0] || "?").toUpperCase();

  const content = (
    <div className={`relative flex-shrink-0 ${linked && userId ? "cursor-pointer" : ""}`}>
      <div className={`${sizes[size]} rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground overflow-hidden ring-2 ring-background`}>
        {src ? (
          <img src={src} alt={name || ""} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>
      {isChef && (
        <div className={`absolute ${badgeSizes[size]} bg-chef rounded-full flex items-center justify-center ring-2 ring-background`}>
          <ChefHat className="w-2/3 h-2/3 text-chef-foreground" />
        </div>
      )}
    </div>
  );

  if (linked && userId) {
    return <Link to={`/user/${userId}`}>{content}</Link>;
  }

  return content;
};

export default UserAvatar;
