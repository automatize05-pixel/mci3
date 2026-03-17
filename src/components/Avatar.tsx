import { Link } from "react-router-dom";
import { ChefHat } from "lucide-react";

interface AvatarProps {
  userId?: string;
  src?: string | null;
  name?: string | null;
  username?: string | null;
  isChef?: boolean;
  isVerified?: boolean;
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
  sm: "w-3 h-3 -bottom-0.5 -right-0.5",
  md: "w-3.5 h-3.5 -bottom-0.5 -right-0.5",
  lg: "w-4.5 h-4.5 bottom-0 right-0",
  xl: "w-5.5 h-5.5 bottom-0.5 right-0.5",
};

const UserAvatar = ({ userId, src, name, username, isChef, isVerified, size = "md", linked = true }: AvatarProps) => {
  const initial = (name?.[0] || username?.[0] || "?").toUpperCase();

  const content = (
    <div className={`relative flex-shrink-0 ${linked && userId ? "cursor-pointer" : ""}`}>
      <div className={`${sizes[size]} rounded-full bg-accent flex items-center justify-center font-bold text-accent-foreground overflow-hidden ring-2 ring-background shadow-sm`}>
        {src ? (
          <img src={src} alt={name || ""} className="w-full h-full object-cover" />
        ) : (
          initial
        )}
      </div>
      {(isChef || isVerified) && (
        <div className={`absolute ${badgeSizes[size]} ${isVerified ? "bg-primary" : "bg-secondary"} rounded-full flex items-center justify-center ring-2 ring-background z-10 shadow-sm border-0`}>
          {isVerified ? (
            <svg viewBox="0 0 24 24" className="w-3/4 h-3/4 text-primary-foreground fill-current">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          ) : (
            <ChefHat className="w-2/3 h-2/3 text-secondary-foreground" />
          )}
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
