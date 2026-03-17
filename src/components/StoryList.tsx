import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import UserAvatar from "./Avatar";
import { Plus, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "./ui/dialog";

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  created_at: string;
  profiles: {
    name: string | null;
    username: string | null;
    profile_picture: string | null;
  } | null;
}

export const StoryList = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [viewingStory, setViewingStory] = useState<Story | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const fetchStories = async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await (supabase as any)
      .from("stories")
      .select("*, profiles(name, username, profile_picture)")
      .gt("created_at", yesterday)
      .order("created_at", { ascending: false });
    
    const uniqueStories: Record<string, Story> = {};
    data?.forEach((s: any) => {
      if (!uniqueStories[s.user_id]) uniqueStories[s.user_id] = s;
    });
    
    setStories(Object.values(uniqueStories));
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });

    fetchStories();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUserId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUserId}-${Math.random()}.${fileExt}`;
      const filePath = `stories/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('recipe-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('recipe-images')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error("Falha ao obter URL pública");

      const { error: dbError } = await (supabase as any)
        .from('stories')
        .insert({
          user_id: currentUserId,
          media_url: publicUrl,
          media_type: file.type.startsWith('video') ? 'video' : 'image'
        });

      if (dbError) throw dbError;

      toast({ title: "Story publicado!", description: "O teu story ficará visível por 24 horas." });
      fetchStories();
    } catch (error: any) {
      toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-1 items-center">
      {/* Create Story Button */}
      <div className="flex flex-col items-center gap-1 shrink-0">
        <label className="relative cursor-pointer group">
          <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center group-hover:border-primary transition-all duration-300 overflow-hidden">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
            )}
          </div>
          <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 ring-2 ring-background">
            <Plus className="h-3 w-3" />
          </div>
          <input 
            type="file" 
            className="hidden" 
            accept="image/*,video/*" 
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
        <span className="text-[10px] font-medium text-muted-foreground">O meu</span>
      </div>

      {/* Story Items */}
      {stories.map(story => (
        <div key={story.id} className="flex flex-col items-center gap-1 shrink-0">
          <div 
            className="w-16 h-16 rounded-full p-0.5 ring-2 ring-primary cursor-pointer active:scale-95 transition-transform overflow-hidden"
            onClick={() => setViewingStory(story)}
          >
            <UserAvatar 
              src={story.profiles?.profile_picture} 
              name={story.profiles?.name} 
              username={story.profiles?.username} 
              size="lg" 
              linked={false} 
            />
          </div>
          <span className="text-[10px] font-medium text-foreground truncate w-16 text-center">
            {story.profiles?.name?.split(" ")[0] || story.profiles?.username}
          </span>
        </div>
      ))}

      {/* Story Viewer Modal */}
      <Dialog open={!!viewingStory} onOpenChange={(open) => !open && setViewingStory(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-black border-none h-[80vh] sm:h-[90vh] flex flex-col items-center justify-center rounded-3xl">
          <button 
            onClick={() => setViewingStory(null)} 
            className="absolute top-4 right-4 z-50 text-white hover:text-gray-300 bg-black/20 p-2 rounded-full backdrop-blur-sm"
          >
            <X className="h-6 w-6" />
          </button>
          
          {viewingStory && (
            <div className="relative w-full h-full flex items-center justify-center">
              {/* Profile Bar in Viewer */}
              <div className="absolute top-4 left-4 flex items-center gap-2 z-50">
                <UserAvatar 
                  src={viewingStory.profiles?.profile_picture} 
                  name={viewingStory.profiles?.name} 
                  username={viewingStory.profiles?.username} 
                  size="sm" 
                  linked={false} 
                />
                <div className="flex flex-col">
                  <span className="text-white text-xs font-bold leading-tight">
                    {viewingStory.profiles?.username}
                  </span>
                  <span className="text-white/60 text-[10px]">
                    {new Date(viewingStory.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {viewingStory.media_type === 'video' ? (
                <video src={viewingStory.media_url} className="w-full h-full object-contain" autoPlay controls />
              ) : (
                <img src={viewingStory.media_url} className="w-full h-full object-contain" alt="Story" />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StoryList;
