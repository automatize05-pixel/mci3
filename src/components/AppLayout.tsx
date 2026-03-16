import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Home, PlusCircle, BookOpen, Sparkles, MessageSquare, User, LogOut, Search, ChefHat, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMci from "@/assets/logo-mci.png";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { href: "/feed", icon: Home, label: "Início" },
  { href: "/recipes", icon: BookOpen, label: "Receitas" },
  { href: "/create-post", icon: PlusCircle, label: "Publicar" },
  { href: "/ai-recipes", icon: Sparkles, label: "IA" },
  { href: "/messages", icon: MessageSquare, label: "Chat" },
];

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/50 h-14">
        <div className="container mx-auto flex items-center justify-between h-full px-4">
          <Link to="/feed" className="flex items-center gap-2">
            <img src={logoMci} alt="MCI" className="h-7" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  location.pathname === item.href
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <Link to="/search">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Search className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/discover-chefs">
              <Button variant="ghost" size="icon" className="rounded-xl hidden md:flex">
                <ChefHat className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="ghost" size="icon" className="rounded-xl hidden md:flex">
                <User className="h-4 w-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="rounded-xl hidden md:flex">
              <LogOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden rounded-xl"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile slide menu */}
      {mobileMenu && (
        <div className="fixed inset-0 z-40 pt-14 bg-background/95 backdrop-blur-xl md:hidden animate-in fade-in duration-200">
          <nav className="flex flex-col p-4 gap-1">
            <Link to="/discover-chefs" onClick={() => setMobileMenu(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
              <ChefHat className="h-5 w-5" /> Descobrir Chefs
            </Link>
            <Link to="/profile" onClick={() => setMobileMenu(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted">
              <User className="h-5 w-5" /> Perfil
            </Link>
            <button onClick={() => { setMobileMenu(false); handleLogout(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-destructive hover:bg-destructive/10 text-left">
              <LogOut className="h-5 w-5" /> Sair
            </button>
          </nav>
        </div>
      )}

      {/* Content */}
      <main className="pt-14 pb-safe md:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            const isCreate = item.href === "/create-post";
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all ${
                  isCreate
                    ? "relative -mt-3"
                    : isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {isCreate ? (
                  <div className="w-12 h-12 rounded-2xl gradient-warm flex items-center justify-center shadow-warm">
                    <PlusCircle className="h-6 w-6 text-primary-foreground" />
                  </div>
                ) : (
                  <>
                    <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} />
                    <span>{item.label}</span>
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AppLayout;
