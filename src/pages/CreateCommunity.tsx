import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Users, Image as ImageIcon, Loader2, ArrowLeft, Plus } from "lucide-react";

const CreateCommunity = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkChef = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      
      const { data: profile } = await supabase.from("profiles").select("account_type").eq("id", user.id).single();
      const { data: sub } = await supabase.from("subscriptions").select("plan").eq("user_id", user.id).single();
      
      const plan = (sub as any)?.plan || "free";
      if (profile?.account_type !== "chef" || !["pro", "elite"].includes(plan)) {
        toast({ title: "Acesso Restrito", description: "Apenas Chefs com plano Pro ou Elite podem criar comunidades.", variant: "destructive" });
        navigate("/communities");
        return;
      }
      setUser(user);
    };
    checkChef();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setLoading(true);
    const { data, error } = await (supabase as any).from("communities").insert({
      owner_id: user.id,
      title: title.trim(),
      description: description.trim(),
      price: parseFloat(price) || 0,
      cover_url: coverUrl.trim() || null
    }).select().single();

    if (error) {
      toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Comunidade criada!", description: "Agora pode começar a adicionar conteúdos." });
      navigate(`/community/${data.id}`);
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>

        <div className="bg-card rounded-3xl border border-border p-8 shadow-card">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-primary/10 p-3 rounded-2xl text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black font-display text-foreground">Nova Comunidade</h1>
              <p className="text-sm text-muted-foreground">Crie um espaço exclusivo para partilhar o seu saber.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-bold ml-1">Nome da Comunidade</Label>
              <Input 
                id="title" 
                placeholder="Ex: Segredos da Culinária Angolana" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
                className="rounded-xl border-border bg-muted/50 focus:bg-background transition-colors"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-bold ml-1">Descrição</Label>
              <Textarea 
                id="description" 
                placeholder="Descreva o que os membros vão aprender..." 
                value={description} 
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl border-border bg-muted/50 focus:bg-background transition-colors min-h-[120px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-bold ml-1">Preço de Adesão (Kz)</Label>
                <Input 
                  id="price" 
                  type="number" 
                  placeholder="0 para gratuito" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)}
                  className="rounded-xl border-border bg-muted/50 focus:bg-background transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover" className="text-sm font-bold ml-1">Link da Foto de Capa</Label>
                <div className="relative">
                  <Input 
                    id="cover" 
                    placeholder="URL da imagem..." 
                    value={coverUrl} 
                    onChange={(e) => setCoverUrl(e.target.value)}
                    className="rounded-xl border-border bg-muted/50 focus:bg-background transition-colors pl-10"
                  />
                  <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>

            <Button type="submit" variant="hero" className="w-full rounded-2xl py-6 text-lg" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
              Criar Comunidade
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreateCommunity;
