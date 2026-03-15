import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, PlusCircle, Loader2, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Post = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  likes_count: number;
  created_at: string;
  user_id: string;
  profiles: { name: string | null; username: string | null; profile_picture: string | null } | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  profiles: { name: string | null; username: string | null } | null;
};

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsData, setCommentsData] = useState<Record<string, Comment[]>>({});
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("*, profiles(name, username, profile_picture)")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((data || []) as any);
    setLoading(false);
  };

  const fetchNotifications = async () => {
    if (!currentUserId) return;
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", currentUserId)
      .eq("read_status", false);
    setUnreadNotifs(count || 0);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    fetchNotifications();

    // Realtime notifications
    const channel = supabase
      .channel("notifs")
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${currentUserId}`,
      }, () => {
        setUnreadNotifs((n) => n + 1);
        toast({ title: "Nova notificação", description: "Recebeu uma nova mensagem!" });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId]);

  const markNotifsRead = async () => {
    if (!currentUserId || unreadNotifs === 0) return;
    await supabase
      .from("notifications")
      .update({ read_status: true })
      .eq("user_id", currentUserId)
      .eq("read_status", false);
    setUnreadNotifs(0);
  };

  const toggleComments = async (postId: string) => {
    const isOpen = expandedComments[postId];
    setExpandedComments((prev) => ({ ...prev, [postId]: !isOpen }));

    if (!isOpen && !commentsData[postId]) {
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(name, username)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      setCommentsData((prev) => ({ ...prev, [postId]: (data || []) as any }));
    }
  };

  const submitComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text || !currentUserId) return;

    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: currentUserId, content: text })
      .select("*, profiles(name, username)")
      .single();

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    setCommentsData((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), data as any],
    }));
    setCommentText((prev) => ({ ...prev, [postId]: "" }));
  };

  const likePost = async (postId: string, currentLikes: number) => {
    await supabase.from("posts").update({ likes_count: currentLikes + 1 }).eq("id", postId);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes_count: currentLikes + 1 } : p))
    );
  };

  const timeAgo = (d: string) => {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const avatar = (profile: any) => (
    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm flex-shrink-0 overflow-hidden">
      {profile?.profile_picture ? (
        <img src={profile.profile_picture} alt="" className="w-full h-full object-cover" />
      ) : (
        (profile?.name?.[0] || profile?.username?.[0] || "?").toUpperCase()
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-display text-foreground">Início</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative" onClick={markNotifsRead}>
              <Bell className="h-5 w-5" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </Button>
            <Link to="/create-post">
              <Button variant="hero" size="sm">
                <PlusCircle className="h-4 w-4 mr-1" /> Publicar
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center shadow-card">
            <p className="text-muted-foreground mb-4">Nenhuma publicação ainda. Seja o primeiro!</p>
            <Link to="/create-post">
              <Button variant="hero">
                <PlusCircle className="h-4 w-4 mr-1" /> Criar Publicação
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {posts.map((post) => (
              <article key={post.id} className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
                {/* Author */}
                <div className="flex items-center gap-3 p-4 pb-2">
                  {avatar(post.profiles)}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground text-sm truncate">
                      {(post.profiles as any)?.name || (post.profiles as any)?.username || "Anónimo"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      @{(post.profiles as any)?.username || "—"} · {timeAgo(post.created_at)}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-3">
                  <h2 className="font-display font-semibold text-foreground text-lg">{post.title}</h2>
                  {post.description && (
                    <p className="text-sm text-muted-foreground mt-1">{post.description}</p>
                  )}
                </div>

                {/* Image */}
                {post.image_url && (
                  <img src={post.image_url} alt={post.title} className="w-full max-h-96 object-cover" />
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 p-4 border-t border-border">
                  <button
                    onClick={() => likePost(post.id, post.likes_count)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Heart className="h-5 w-5" />
                    <span>{post.likes_count}</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>Comentar</span>
                  </button>
                </div>

                {/* Comments */}
                {expandedComments[post.id] && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    {(commentsData[post.id] || []).map((c) => (
                      <div key={c.id} className="flex gap-2">
                        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs flex-shrink-0">
                          {((c.profiles as any)?.name?.[0] || "?").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            {(c.profiles as any)?.name || (c.profiles as any)?.username}
                          </p>
                          <p className="text-sm text-muted-foreground">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input
                        placeholder="Escreva um comentário..."
                        value={commentText[post.id] || ""}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === "Enter" && submitComment(post.id)}
                        className="flex-1 text-sm bg-muted rounded-lg px-3 py-2 border-none outline-none placeholder:text-muted-foreground"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => submitComment(post.id)}
                        disabled={!commentText[post.id]?.trim()}
                      >
                        Enviar
                      </Button>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Feed;
