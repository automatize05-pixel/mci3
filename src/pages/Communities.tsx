import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Users, Plus, Loader2, Sparkles, BookOpen, Video, ShieldCheck, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "@/components/Avatar";

type Community = {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  price: number;
  owner_id: string;
  profiles?: {
    name: string | null;
    username: string | null;
    profile_picture: string | null;
  };
  member_count?: number;
};

const Communities = () => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [myCommunities, setMyCommunities] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const [commRes, profileRes, planRes, myCommRes, roleRes] = await Promise.all([
        (supabase as any).from("communities").select("*, profiles:owner_id(name, username, profile_picture)"),
        user ? supabase.from("profiles").select("*").eq("id", user.id).single() : Promise.resolve({ data: null }),
        user ? supabase.from("subscriptions").select("plan").eq("user_id", user.id).single() : Promise.resolve({ data: null }),
        user ? (supabase as any).from("community_members").select("community_id").eq("user_id", user.id) : Promise.resolve({ data: [] }),
        user ? supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle() : Promise.resolve({ data: null }),
      ]);

      if (commRes.data) {
        // Enriquecer com contagem de membros (idealmente via view ou subquery)
        setCommunities(commRes.data as any);
      }
      
      setUserProfile(profileRes.data);
      setCurrentPlan((planRes.data as any)?.plan || "free");
      if (myCommRes.data) {
        setMyCommunities(new Set(myCommRes.data.map((m: any) => m.community_id)));
      }
      setIsAdmin(!!roleRes.data);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const canCreate = isAdmin || (userProfile?.account_type === "chef" && ["pro", "elite"].includes(currentPlan));

  if (loading) return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black font-display text-foreground flex items-center gap-2">
              <Users className="h-8 w-8 text-primary" /> Comunidades
            </h1>
            <p className="text-muted-foreground mt-1">Aprenda com os melhores Chefs e partilhe conhecimentos.</p>
          </div>
          {canCreate && (
            <Link to="/create-community">
              <Button variant="hero" className="rounded-xl">
                <Plus className="h-4 w-4 mr-2" /> Criar Comunidade
              </Button>
            </Link>
          )}
        </div>

        {!canCreate && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 mb-8 flex items-center gap-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-foreground font-display">Monetize o seu Talento</h3>
              <p className="text-sm text-muted-foreground">
                Para criares a tua comunidade, torna-te um chef premium e ative o plano para ativares a tua comunidade.
              </p>
            </div>
            <Link to="/settings">
              <Button size="sm" variant="outline" className="rounded-lg">Ver Planos</Button>
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {communities.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-card rounded-3xl border border-dashed border-border">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground">Ainda não existem comunidades. Seja o primeiro a explorar!</p>
            </div>
          ) : (
            communities.map((comm) => (
              <Link key={comm.id} to={`/community/${comm.id}`} className="group h-full">
                <article className="bg-card rounded-2xl border border-border shadow-card overflow-hidden h-full flex flex-col transition-all hover:border-primary/50 hover:shadow-lg">
                  <div className="aspect-[2/1] relative overflow-hidden bg-muted">
                    {comm.cover_url ? (
                      <img src={comm.cover_url} alt={comm.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full gradient-warm opacity-20" />
                    )}
                    <div className="absolute top-3 left-3 flex gap-2">
                      <div className="bg-background/80 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-border shadow-sm">
                        <Video className="h-3 w-3 text-red-500" /> VÍDEOS
                      </div>
                      <div className="bg-background/80 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-border shadow-sm">
                        <BookOpen className="h-3 w-3 text-blue-500" /> EBOOKS
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <UserAvatar 
                        userId={comm.owner_id} 
                        src={comm.profiles?.profile_picture} 
                        name={comm.profiles?.name} 
                        username={comm.profiles?.username} 
                        size="sm"
                        linked={false}
                      />
                      <span className="text-xs font-semibold text-muted-foreground truncate">
                        Chef {comm.profiles?.name || comm.profiles?.username}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-foreground font-display line-clamp-1 mb-2 group-hover:text-primary transition-colors">
                      {comm.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                      {comm.description || "Sem descrição disponível."}
                    </p>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                      <div className="text-xs font-bold text-primary flex items-center gap-1">
                        <ShieldCheck className="h-4 w-4" /> COMUNIDADE VERIFICADA
                      </div>
                      <div className="font-black text-foreground">
                        {comm.price > 0 ? `${comm.price} Kz` : "GRATUITO"}
                      </div>
                    </div>
                  </div>
                </article>
              </Link>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Communities;
