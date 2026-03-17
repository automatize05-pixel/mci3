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
            <div className="inline-flex items-center justify-center text-blue-500 bg-blue-50 dark:bg-blue-500/10 rounded-full p-0.5 ml-1">
              <BadgeCheck className={`${iconSize} text-white dark:text-blue-500`} fill="currentColor" />
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
