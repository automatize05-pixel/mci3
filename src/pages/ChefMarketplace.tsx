import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, PlayCircle, Lock, GraduationCap, DollarSign, Trash2, ArrowRight } from "lucide-react";
import UserAvatar from "@/components/Avatar";
import { Link } from "react-router-dom";

type Masterclass = {
  id: string;
  title: string;
  description: string;
  video_url: string;
  price: number;
  created_at: string;
  chef_id: string;
  profiles: {
    name: string | null;
    username: string | null;
    profile_picture: string | null;
  } | null;
};

const PLAN_LIMITS: Record<string, number> = { free: 0, starter: 1, pro: 5, elite: 9999 };
const PLAN_LABELS: Record<string, string> = { free: "Gratuito", starter: "Starter", pro: "Pro", elite: "Elite" };

const ChefMarketplace = () => {
  const [classes, setClasses] = useState<Masterclass[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [isChef, setIsChef] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Chef limits
  const [userPlan, setUserPlan] = useState("free");
  const [myClassesCount, setMyClassesCount] = useState(0);
  
  // Create Dialog State
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [price, setPrice] = useState("0");

  const { toast } = useToast();

  useEffect(() => {
    loadPageData();
  }, []);

  const loadPageData = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Check account type
        const { data: profile } = await supabase.from("profiles").select("account_type, email").eq("id", user.id).single();
        const isUserChef = profile?.account_type === "chef";
        setIsChef(isUserChef);
        
        // Admin
        const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
        const IsUserAdmin = !!roleData || user.email === 'ageusilva905@gmail.com' || profile?.email === 'ageusilva905@gmail.com';
        setIsAdmin(IsUserAdmin);

        if (isUserChef || IsUserAdmin) {
          // Get subscription plan
          const { data: subData } = await supabase.from("subscriptions").select("plan").eq("user_id", user.id).maybeSingle();
          const currentPlan = (subData as any)?.plan || "free";
          setUserPlan(currentPlan);

          // Get my classes count
          const { count, error: countError } = await (supabase as any)
            .from("masterclasses")
            .select('*', { count: 'exact', head: true })
            .eq("chef_id", user.id);
            
          if (countError && countError.code === '42P01') {
            setDbError(true);
            setLoading(false);
            return;
          }
          setMyClassesCount(count || 0);
        }
      }

      // Load all masterclasses
      const { data: mcData, error: mcError } = await (supabase as any)
        .from("masterclasses")
        .select("*, profiles(name, username, profile_picture)")
        .order("created_at", { ascending: false });

      if (mcError && mcError.code === '42P01') {
        setDbError(true);
        return;
      }

      setClasses(mcData || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const limit = isAdmin ? 9999 : (PLAN_LIMITS[userPlan] || 0);
  const canPublish = isAdmin || myClassesCount < limit;

  const handleCreate = async () => {
    if (!currentUserId || !title.trim() || !videoUrl.trim()) return;
    if (!canPublish) {
      toast({ title: "Limite atingido", description: `O plano ${PLAN_LABELS[userPlan]} permite apenas ${limit} Masterclass(es).`, variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await (supabase as any).from("masterclasses").insert({
        chef_id: currentUserId,
        title: title.trim(),
        description: desc.trim(),
        video_url: videoUrl.trim(),
        price: parseFloat(price) || 0
      }).select("*, profiles(name, username, profile_picture)").single();

      if (error) throw error;

      setClasses([data, ...classes]);
      setMyClassesCount(prev => prev + 1);
      setCreateOpen(false);
      setTitle(""); setDesc(""); setVideoUrl(""); setPrice("0");
      toast({ title: "Masterclass publicada com sucesso!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja eliminar esta aula?")) return;
    try {
      const { error } = await (supabase as any).from("masterclasses").delete().eq("id", id);
      if (error) throw error;
      setClasses(classes.filter(c => c.id !== id));
      setMyClassesCount(prev => Math.max(0, prev - 1));
      toast({ title: "Masterclass eliminada." });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const openVideo = (url: string) => {
    window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display text-foreground">Masterclasses</h1>
              <p className="text-sm text-muted-foreground">Aprenda com os melhores Chefs da plataforma.</p>
            </div>
          </div>
          
          {(isChef || isAdmin) && !dbError && (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-foreground">Plano {PLAN_LABELS[userPlan]}</p>
                <p className="text-[10px] text-muted-foreground">{isAdmin ? "Ilimitado" : `${myClassesCount} de ${limit} aulas`}</p>
              </div>
              <Button onClick={() => setCreateOpen(true)} variant="hero" className="rounded-xl shadow-lg shadow-primary/20">
                <Plus className="h-4 w-4 mr-2" /> Nova Aula
              </Button>
            </div>
          )}
        </div>

        {dbError ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center max-w-xl mx-auto mt-12">
            <Lock className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-red-600 mb-2">Área Indisponível</h3>
            <p className="text-sm text-red-700">A área de Masterclasses requer a migração da Base de Dados. Executem o SQL para criar as tabelas premium.</p>
          </div>
        ) : loading ? (
           <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : classes.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-3xl border border-border shadow-sm">
            <GraduationCap className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-xl font-bold font-display text-foreground mb-2">Sem aulas disponíveis</h3>
            <p className="text-muted-foreground max-w-sm mx-auto">Ainda nenhum Chef publicou uma Masterclass. Volte mais tarde para aprender novos segredos culinários!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map(cls => (
              <div key={cls.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-card group hover:shadow-lg transition-all duration-300 flex flex-col">
                <div className="aspect-video bg-muted relative flex items-center justify-center overflow-hidden">
                  <PlayCircle className="h-12 w-12 text-white/50 group-hover:text-primary group-hover:scale-110 transition-all z-10 drop-shadow-lg" />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                  {/* Pseudo thumbnail based on title string hash to give some color */}
                  <div className="absolute inset-0 opacity-40 mix-blend-overlay gradient-warm" />
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-bold text-lg font-display text-foreground leading-tight line-clamp-2">{cls.title}</h3>
                    <div className="flex items-center gap-1 font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg shrink-0">
                      {cls.price > 0 ? (
                        <>
                          <span>{cls.price}</span>
                          <span className="text-[10px] uppercase">Kz</span>
                        </>
                      ) : (
                        <span className="text-xs uppercase">Grátis</span>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-6 flex-1">{cls.description}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                    <div className="flex items-center gap-2">
                      <UserAvatar 
                        userId={cls.chef_id} 
                        src={cls.profiles?.profile_picture} 
                        name={cls.profiles?.name} 
                        username={cls.profiles?.username} 
                        isChef={true} 
                        size="sm" 
                      />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground hover:underline cursor-pointer">{cls.profiles?.name || cls.profiles?.username}</span>
                        <span className="text-[10px] text-muted-foreground">Chef</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {(isAdmin || currentUserId === cls.chef_id) && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0" onClick={() => handleDelete(cls.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <Button size="sm" variant="default" className="rounded-xl h-8 text-xs font-bold shadow-md shadow-primary/20" onClick={() => openVideo(cls.video_url)}>
                        Assistir
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Criar Nova Masterclass</DialogTitle>
          </DialogHeader>
          
          {!canPublish ? (
            <div className="py-6 text-center">
               <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                 <Lock className="h-8 w-8 text-destructive" />
               </div>
               <h3 className="text-lg font-bold mb-2">Limite do Plano Atingido</h3>
               <p className="text-sm text-muted-foreground mb-6">O plano {PLAN_LABELS[userPlan]} permite publicar até {limit} aula(s). Faça upgrade para publicar mais conteúdo e rentabilizar a sua página.</p>
               <Link to="/checkout" className="w-full block">
                 <Button className="w-full rounded-xl" variant="hero">Fazer Upgrade</Button>
               </Link>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Título da Aula *</Label>
                <Input placeholder="Ex: Segredos da Pastelaria Francesa" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Aprenda a fazer...</Label>
                <Textarea placeholder="Descreva o que os alunos vão aprender nesta aula..." value={desc} onChange={e => setDesc(e.target.value)} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Link do Vídeo (YouTube, Vimeo...) *</Label>
                <Input placeholder="https://youtube.com/watch?v=..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} type="url" />
              </div>
              <div className="space-y-2">
                <Label>Preço (Kz) - Deixe 0 para gratuito</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type="number" min="0" step="50" className="pl-10" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {canPublish && (
            <DialogFooter>
              <Button variant="ghost" className="rounded-xl" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button variant="hero" className="rounded-xl" onClick={handleCreate} disabled={creating || !title.trim() || !videoUrl.trim()}>
                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Publicar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default ChefMarketplace;
