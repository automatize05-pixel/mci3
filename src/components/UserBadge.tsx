import { BadgeCheck, ChefHat } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface UserBadgeProps {
  type: "verified" | "creator";
  size?: "sm" | "md";
}

export const UserBadge = ({ type, size = "md" }: UserBadgeProps) => {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  
  if (type === "verified") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center justify-center text-[#1d9bf0] ml-1">
              <svg viewBox="0 0 24 24" className={`${iconSize} fill-current`}>
                <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.67-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.67-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2l-3.53-3.53 1.41-1.41 2.12 2.12 4.96-4.96L16.91 9.84l-6.37 6.36z" />
              </svg>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Conta Verificada (Administrador)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (type === "creator") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center gap-1 bg-primary/10 text-primary px-1.5 py-0.5 rounded-full ml-1 border border-primary/20">
              <ChefHat className={iconSize} />
              <span className="text-[10px] font-bold uppercase tracking-wider leading-none">Criador</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Chef Criador Oficial</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
};

export default UserBadge;
