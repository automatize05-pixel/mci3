import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { Home, PlusCircle, BookOpen, Sparkles, MessageSquare, User, LogOut, Search, ChefHat, Menu, X, Settings, Bell, Bookmark, PlaySquare, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoMci from "@/assets/logo-mci.png";

interface AppLayoutProps {
  children: React.ReactNode;
}

const mainNav = [
  { href: "/feed", icon: Home, label: "Início" },
  { href: "/recipes", icon: BookOpen, label: "Receitas" },
  { href: "/communities", icon: Users, label: "Comunidades" },
  { href: "/ai-recipes", icon: Sparkles, label: "IA Chef" },
  { href: "/messages", icon: MessageSquare, label: "Mensagens" },
  { href: "/keels", icon: PlaySquare, label: "Keels" },
  { href: "/discover-chefs", icon: ChefHat, label: "Chefs" },
];

const secondaryNav = [
  { href: "/notifications", icon: Bell, label: "Notificações" },
  { href: "/search", icon: Search, label: "Pesquisar" },
  { href: "/profile", icon: User, label: "Perfil" },
  { href: "/settings", icon: Settings, label: "Definições" },
];

const mobileBottomNav = [
  { href: "/feed", icon: Home, label: "Início" },
  { href: "/communities", icon: Users, label: "Comunidades" },
  { href: "/create-post", icon: PlusCircle, label: "Publicar" },
  { href: "/ai-recipes", icon: Sparkles, label: "IA" },
  { href: "/messages", icon: MessageSquare, label: "Chat" },
];

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const initNotifications = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get initial count
      const { count } = await (supabase as any)
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      
      setUnreadCount(count || 0);

      // Subscribe to new notifications
      const channel = supabase
        .channel("app-notifications")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    initNotifications();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav - mobile only */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-b border-border/50 h-14 md:hidden">
        <div className="flex items-center justify-between h-full px-4">
          <Link to="/feed" className="flex items-center gap-2">
            <img src={logoMci} alt="MCI" className="h-7" />
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/search">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Search className="h-4 w-4" />
              </Button>
            </Link>
            <Link to="/notifications" className="relative">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full ring-2 ring-card" />
                )}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl"
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
            {[...mainNav, ...secondaryNav].map(item => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setMobileMenu(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
            <Link
              to="/create-post"
              onClick={() => setMobileMenu(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <PlusCircle className="h-5 w-5" />
              Publicar
            </Link>
            <button
              onClick={() => { setMobileMenu(false); handleLogout(); }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-destructive hover:bg-destructive/10 text-left"
            >
              <LogOut className="h-5 w-5" /> Sair
            </button>
          </nav>
        </div>
      )}

      {/* Desktop left sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-40 w-60 bg-card border-r border-border/50 flex-col">
        <div className="p-5">
          <Link to="/feed" className="flex items-center gap-2">
            <img src={logoMci} alt="MCI" className="h-8" />
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {mainNav.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          ))}

          {/* Create post button */}
          <Link to="/create-post">
            <Button variant="hero" size="sm" className="w-full rounded-xl mt-3 gap-2">
              <PlusCircle className="h-4 w-4" />
              Publicar
            </Button>
          </Link>

          <div className="h-px bg-border my-4" />

          {secondaryNav.map(item => (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" />
              {item.label}
              {item.href === "/notifications" && unreadCount > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border/50">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full transition-colors"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Sair
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="pt-14 md:pt-0 md:pl-60 pb-safe md:pb-0 min-h-screen">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/50 md:hidden safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {mobileBottomNav.map((item) => {
            const active = isActive(item.href);
            const isCreate = item.href === "/create-post";
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all ${
                  isCreate
                    ? "relative -mt-3"
                    : active
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
                    <item.icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
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
