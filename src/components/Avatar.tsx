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
  md: "w-4 h-4 -bottom-0.5 -right-0.5",
  lg: "w-5 h-5 bottom-0 right-0",
  xl: "w-6 h-6 bottom-0 right-0",
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
        <div className={`absolute ${badgeSizes[size]} ${isVerified ? "text-[#1d9bf0] bg-background" : "bg-secondary"} rounded-full flex items-center justify-center ring-2 ring-background z-10 shadow-sm border-0 overflow-hidden`}>
          {isVerified ? (
            <svg viewBox="0 0 24 24" className="w-[85%] h-[85%] fill-current flex-shrink-0">
              <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2l-3.53-3.53 1.41-1.41 2.12 2.12 4.96-4.96L16.91 9.84l-6.37 6.36z" />
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
