import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Users, Video, BookOpen, ShieldCheck, Plus, Loader2, ArrowLeft, MessageCircle, PlayCircle, FileText, Lock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UserAvatar from "@/components/Avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

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
};

type Content = {
  id: string;
  type: "video" | "ebook" | "class";
  title: string;
  description: string | null;
  url: string;
  created_at: string;
};

const CommunityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [community, setCommunity] = useState<Community | null>(null);
  const [contents, setContents] = useState<Content[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      if (user) {
        const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
        setIsAdmin(!!roleData);
      }

      const [commRes, memberRes, contentRes] = await Promise.all([
        (supabase as any).from("communities").select("*, profiles:owner_id(name, username, profile_picture), members_count:community_members(count)").eq("id", id).single(),
        user ? (supabase as any).from("community_members").select("id").eq("community_id", id).eq("user_id", user.id).maybeSingle() : Promise.resolve({ data: null }),
        (supabase as any).from("community_content").select("*").eq("community_id", id).order("created_at", { ascending: false }),
      ]);

      if (commRes.data) setCommunity(commRes.data as any);
      setIsMember(!!memberRes.data);
      setContents((contentRes.data || []) as any);
      setLoading(false);
    };
    fetchDetails();
  }, [id]);

  const joinCommunity = async () => {
    if (!currentUserId || !community) { navigate("/login"); return; }
    
    // Check limits based on owner's plan
    const { data: subData } = await supabase.from("subscriptions").select("plan").eq("user_id", community.owner_id).single();
    const plan = (subData as any)?.plan || "free";
    const currentMemberCount = (community as any).members_count?.[0]?.count || 0;

    if (plan === "pro" && currentMemberCount >= 100) {
      toast({ title: "Comunidade Cheia", description: "Esta comunidade atingiu o limite de 100 membros do plano Pro.", variant: "destructive" });
      return;
    }

    // Simulação de pagamento/adesão
    const { error } = await (supabase as any).from("community_members").insert({
      community_id: id,
      user_id: currentUserId
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setIsMember(true);
      toast({ title: "Bem-vindo!", description: "Agora você tem acesso limitado a esta comunidade." });
    }
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  if (!community) return <AppLayout><div className="text-center py-20">Comunidade não encontrada.</div></AppLayout>;

  const isOwner = community.owner_id === currentUserId;
  const hasAccess = isMember || isOwner || isAdmin;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Button variant="ghost" onClick={() => navigate("/communities")} className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" /> Todas as Comunidades
        </Button>

        {/* Header Section */}
        <div className="bg-card rounded-3xl border border-border overflow-hidden shadow-card mb-8">
          <div className="aspect-[3/1] relative">
            {community.cover_url ? (
              <img src={community.cover_url} alt={community.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-warm opacity-30" />
            )}
          </div>
          <div className="p-8 -mt-12 relative flex flex-col md:flex-row items-end gap-6">
            <div className="bg-background p-2 rounded-3xl shadow-xl">
              <UserAvatar 
                userId={community.owner_id} 
                src={community.profiles?.profile_picture} 
                name={community.profiles?.name} 
                size="xl" 
                linked={false}
              />
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
                <ShieldCheck className="h-4 w-4" /> COMUNIDADE OFICIAL
              </div>
              <h1 className="text-3xl font-black font-display text-foreground">{community.title}</h1>
              <p className="text-muted-foreground flex items-center gap-2 mt-1">
                Criado por <span className="font-bold text-foreground">Chef {community.profiles?.name}</span>
              </p>
            </div>
            <div className="pb-2">
              {!hasAccess ? (
                <Button variant="hero" className="rounded-2xl px-8 py-6 text-lg" onClick={joinCommunity}>
                  Aderir por {community.price > 0 ? `${community.price} Kz` : "Grátis"}
                </Button>
              ) : (
                <div className="flex items-center gap-2 bg-green-500/10 text-green-600 px-4 py-2 rounded-xl border border-green-500/20 font-bold">
                  <CheckCircle className="h-5 w-5" /> MEMBRO ATIVO
                </div>
              )}
            </div>
          </div>
          <div className="px-8 pb-8">
            <p className="text-muted-foreground leading-relaxed max-w-3xl">
              {community.description || "Esta comunidade ainda não tem uma descrição detalhada."}
            </p>
          </div>
        </div>

        {/* Tabs Content */}
        {!hasAccess ? (
          <div className="bg-card rounded-3xl border border-border p-20 text-center shadow-sm">
            <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">Conteúdo Restrito</h2>
            <p className="text-muted-foreground mb-6">Aderir a esta comunidade para aceder a vídeos, ebooks e formações exclusivas.</p>
            <Button variant="outline" className="rounded-xl" onClick={joinCommunity}>Desbloquear Agora</Button>
          </div>
        ) : (
          <Tabs defaultValue="classroom" className="w-full">
            <TabsList className="bg-muted/50 p-1 rounded-2xl mb-8 w-fit">
              <TabsTrigger value="classroom" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Video className="h-4 w-4 mr-2" /> Sala de Aula
              </TabsTrigger>
              <TabsTrigger value="library" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <BookOpen className="h-4 w-4 mr-2" /> Biblioteca
              </TabsTrigger>
              <TabsTrigger value="feed" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <MessageCircle className="h-4 w-4 mr-2" /> Mural
              </TabsTrigger>
            </TabsList>

            <TabsContent value="classroom">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contents.filter(c => c.type === "video" || c.type === "class").length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-dashed border-border opacity-50">
                    Ainda não foram publicadas aulas em vídeo.
                  </div>
                ) : (
                  contents.filter(c => c.type === "video" || c.type === "class").map(item => (
                    <Card key={item.id} className="p-0 overflow-hidden border-border bg-card rounded-2xl hover:border-primary/50 transition-all group cursor-pointer">
                      <div className="aspect-video bg-muted relative flex items-center justify-center">
                        <PlayCircle className="h-12 w-12 text-white/50 group-hover:text-primary group-hover:scale-110 transition-all z-10" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                      </div>
                      <div className="p-5">
                        <h4 className="font-bold text-lg font-display text-foreground group-hover:text-primary transition-colors">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                      </div>
                    </Card>
                  ))
                )}
                {isOwner && (
                  <Button variant="outline" className="col-span-full border-dashed py-10 rounded-2xl border-2 hover:bg-primary/5 hover:border-primary">
                    <Plus className="h-5 w-5 mr-2" /> Adicionar Vídeo-aula
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="library">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {contents.filter(c => c.type === "ebook").length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-card rounded-2xl border border-dashed border-border opacity-50">
                    Nenhum ebook disponível nesta biblioteca.
                  </div>
                ) : (
                  contents.filter(c => c.type === "ebook").map(item => (
                    <Card key={item.id} className="p-5 border-border bg-card rounded-2xl hover:border-primary/50 transition-all flex items-start gap-4 cursor-pointer group">
                      <div className="bg-primary/10 p-4 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{item.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                        <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-primary font-bold">Download PDF</Button>
                      </div>
                    </Card>
                  ))
                )}
                {isOwner && (
                  <Button variant="outline" className="col-span-full border-dashed py-10 rounded-2xl border-2 hover:bg-primary/5 hover:border-primary">
                    <Plus className="h-5 w-5 mr-2" /> Adicionar Ebook / PDF
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="feed">
               <div className="bg-card rounded-3xl border border-border p-12 text-center shadow-sm">
                <MessageCircle className="h-10 w-10 text-muted-foreground mx-auto mb-4 opacity-20" />
                <p className="text-muted-foreground font-display">Espaço para discussões e novidades da comunidade.</p>
                <div className="mt-8">
                  <Button variant="hero" className="rounded-xl">Nova Publicação no Mural</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
};

export default CommunityDetails;
