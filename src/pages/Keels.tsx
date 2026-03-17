import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Heart, MessageCircle, Share2, Music2, UserPlus, Loader2, PlusCircle } from "lucide-react";
import UserAvatar from "@/components/Avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Keel {
  id: string;
  video_url: string;
  title: string | null;
  description: string | null;
  likes_count: number;
  user_id: string;
  profiles: {
    name: string | null;
    username: string | null;
    profile_picture: string | null;
  } | null;
}

const Keels = () => {
  const [keels, setKeels] = useState<Keel[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const fetchKeels = async () => {
    const { data } = await (supabase as any)
      .from("keels")
      .select("*, profiles(name, username, profile_picture)")
      .order("created_at", { ascending: false });
    setKeels((data || []) as any);
    setLoading(false);
  };

  const fetchAdmins = async () => {
    const { data } = await (supabase as any).from("user_roles").select("user_id").eq("role", "admin");
    if (data) setAdminIds(new Set(data.map((r: any) => r.user_id)));
  };

  useEffect(() => {
    fetchKeels();
    fetchAdmins();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const fileName = `${user.id}-${Math.random()}.mp4`;
      const filePath = `keels/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error("Falha ao obter URL pública");

      const { error: dbError } = await (supabase as any)
        .from('keels')
        .insert({
          user_id: user.id,
          video_url: publicUrl,
          title: "Novo Keel",
          description: "Partilhado através do MCI3"
        });

      if (dbError) throw dbError;

      toast({ title: "Keel publicado!", description: "O teu vídeo já está disponível." });
      fetchKeels();
    } catch (error: any) {
      toast({ title: "Erro ao publicar Keel", description: error.message, variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[80vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="absolute top-4 right-4 z-40">
        <label className="cursor-pointer">
          <div className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all active:scale-95">
            {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
            <span className="text-sm font-bold">Publicar Keel</span>
          </div>
          <input type="file" className="hidden" accept="video/*" onChange={handleUpload} disabled={publishing} />
        </label>
      </div>
      <div className="h-[calc(100vh-3.5rem)] md:h-screen overflow-y-scroll snap-y snap-mandatory scrollbar-hide">
        {keels.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <p className="text-muted-foreground mb-4">Ainda não há Keels para mostrar.</p>
            <Button variant="hero">Seja o primeiro a publicar!</Button>
          </div>
        ) : (
          keels.map(keel => (
            <div key={keel.id} className="h-full w-full snap-start relative bg-black flex items-center justify-center">
              {/* Video Placeholder (Actual video tag would go here) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-full bg-gradient-to-b from-transparent to-black/60 absolute z-10" />
                <video 
                  src={keel.video_url} 
                  className="w-full h-full object-cover"
                  loop
                  muted
                  autoPlay
                />
              </div>

              {/* Sidebar Actions */}
              <div className="absolute right-4 bottom-24 z-20 flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-1 group">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                    <Heart className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white text-xs font-medium">{keel.likes_count}</span>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-white text-xs font-medium">0</span>
                </div>

                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors">
                  <Share2 className="h-6 w-6 text-white" />
                </div>
              </div>

              {/* Info Overlay */}
              <div className="absolute left-4 bottom-8 right-16 z-20 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <UserAvatar 
                    src={keel.profiles?.profile_picture} 
                    name={keel.profiles?.name} 
                    username={keel.profiles?.username} 
                    isVerified={adminIds.has(keel.user_id)}
                    size="md" 
                  />
                  <div>
                    <p className="font-bold text-sm">@{keel.profiles?.username}</p>
                    <p className="text-[10px] opacity-80 flex items-center gap-1">
                      <Music2 className="h-3 w-3" /> Som original
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="bg-white/20 hover:bg-white/30 text-white text-[10px] h-7 px-3 rounded-lg ml-2">
                    Seguir
                  </Button>
                </div>
                <h3 className="font-bold mb-1">{keel.title}</h3>
                <p className="text-sm opacity-90 line-clamp-2">{keel.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </AppLayout>
  );
};

export default Keels;
