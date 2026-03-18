import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, MoreHorizontal, Pencil, Trash2, Reply, Share2, Loader2, ArrowLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Post = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  likes_count: number;
  created_at: string;
  user_id: string;
  profiles: { 
    name: string | null; 
    username: string | null; 
    profile_picture: string | null; 
    account_type: string;
  } | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: { 
    name: string | null; 
    username: string | null; 
    profile_picture: string | null;
    account_type: string;
  } | null;
  reactions_count?: number;
  is_liked?: boolean;
};

const PostDetails = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editPostTitle, setEditPostTitle] = useState("");
  const [editPostDesc, setEditPostDesc] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchAdmins = async () => {
    // Find admins by email as it is more reliable than user_roles table
    const { data } = await supabase.from("profiles").select("id").eq("email", "ageusilva905@gmail.com");
    if (data) setAdminIds(new Set(data.map((r: any) => r.id)));
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
    fetchAdmins();
  }, []);

  const fetchPost = async () => {
    if (!postId) return;
    setLoading(true);
    
    // Fetch post with profile and likes count
    const { data, error } = await (supabase as any)
      .from("posts")
      .select("*, profiles(name, username, profile_picture, account_type), likes_count:likes(count)")
      .eq("id", postId)
      .single();

    if (error || !data) {
      toast({ title: "Erro", description: "Publicação não encontrada.", variant: "destructive" });
      navigate("/feed");
      return;
    }

    const processedPost = {
      ...data,
      likes_count: (data.likes_count as any)?.[0]?.count || 0
    };

    setPost(processedPost as any);
    setEditPostTitle(data.title);
    setEditPostDesc(data.description || "");

    // Fetch comments
    const { data: commentsData } = await (supabase as any)
      .from("comments")
      .select("*, profiles(name, username, profile_picture, account_type)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (commentsData) {
      const commentIds = commentsData.map(c => c.id);
      const { data: reactions } = await (supabase as any).from("comment_reactions").select("comment_id").in("comment_id", commentIds).eq("reaction_type", "like");
      
      const counts: Record<string, number> = {};
      commentIds.forEach(id => counts[id] = 0);
      reactions?.forEach((r: any) => { counts[r.comment_id] = (counts[r.comment_id] || 0) + 1; });
      
      const enriched = commentsData.map(c => ({
        ...c,
        reactions_count: counts[c.id] || 0
      }));
      setComments(enriched as any);
    }

    // Check likes
    if (currentUserId) {
      const { data: postLike } = await (supabase as any).from("likes").select("id").eq("user_id", currentUserId).eq("post_id", postId).maybeSingle();
      if (postLike) setLikedPosts(new Set([postId]));

      const { data: commLikes } = await (supabase as any).from("comment_reactions").select("comment_id").eq("user_id", currentUserId).eq("reaction_type", "like");
      setLikedComments(new Set(commLikes?.map((l: any) => l.comment_id) || []));
    }

    setLoading(false);
  };

  useEffect(() => {
    if (postId) fetchPost();
  }, [postId, currentUserId]);

  const toggleLike = async () => {
    if (!currentUserId || !post) return;
    const isLiked = likedPosts.has(post.id);
    if (isLiked) {
      await (supabase as any).from("likes").delete().eq("user_id", currentUserId).eq("post_id", post.id);
      setLikedPosts(new Set());
      setPost(prev => prev ? { ...prev, likes_count: Math.max(0, prev.likes_count - 1) } : null);
    } else {
      await (supabase as any).from("likes").insert({ user_id: currentUserId, post_id: post.id });
      setLikedPosts(new Set([post.id]));
      setPost(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : null);
    }
  };

  const toggleCommentLike = async (commentId: string) => {
    if (!currentUserId) return;
    const isLiked = likedComments.has(commentId);
    if (isLiked) {
      await (supabase as any).from("comment_reactions").delete().eq("user_id", currentUserId).eq("comment_id", commentId).eq("reaction_type", "like");
      setLikedComments(prev => { const n = new Set(prev); n.delete(commentId); return n; });
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions_count: Math.max(0, (c.reactions_count || 0) - 1) } : c));
    } else {
      await (supabase as any).from("comment_reactions").insert({ user_id: currentUserId, comment_id: commentId, reaction_type: "like" });
      setLikedComments(prev => new Set(prev).add(commentId));
      setComments(prev => prev.map(c => c.id === commentId ? { ...c, reactions_count: (c.reactions_count || 0) + 1 } : c));
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !currentUserId || !postId) return;
    const parentId = replyTo?.id || null;
    const { data, error } = await (supabase as any)
      .from("comments")
      .insert({ post_id: postId, user_id: currentUserId, content: commentText.trim(), parent_id: parentId })
      .select("*, profiles(name, username, profile_picture, account_type)")
      .single();
    
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    
    setComments(prev => [...prev, { ...data, reactions_count: 0 } as any]);
    setCommentText("");
    setReplyTo(null);
    toast({ title: "Comentário enviado!" });
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await (supabase as any).from("comments").delete().eq("id", commentId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setComments(prev => prev.filter(c => c.id !== commentId && c.parent_id !== commentId));
    toast({ title: "Comentário removido." });
  };

  const updateComment = async (commentId: string) => {
    if (!editCommentText.trim()) return;
    const { error } = await (supabase as any).from("comments").update({ content: editCommentText.trim() }).eq("id", commentId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: editCommentText.trim() } : c));
    setEditingComment(null);
    setEditCommentText("");
    toast({ title: "Comentário atualizado!" });
  };

  const deletePost = async () => {
    if (!post) return;
    const confirm = window.confirm("Tem certeza que deseja eliminar esta publicação?");
    if (!confirm) return;

    const { error } = await (supabase as any).from("posts").delete().eq("id", post.id);
    if (error) {
      toast({ title: "Erro ao eliminar", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Publicação eliminada." });
    navigate("/feed");
  };

  const updatePost = async () => {
    if (!post || !editPostTitle.trim()) return;
    const { error } = await (supabase as any)
      .from("posts")
      .update({ title: editPostTitle.trim(), description: editPostDesc.trim() || null })
      .eq("id", post.id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      return;
    }

    setPost(prev => prev ? { ...prev, title: editPostTitle, description: editPostDesc || null } : null);
    setIsEditingPost(false);
    toast({ title: "Publicação atualizada!" });
  };

  const timeAgo = (d: string) => {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const renderComments = (parentId: string | null = null, depth = 0) => {
    const items = comments.filter(c => c.parent_id === parentId);
    return items.map(c => (
      <div key={c.id} className={`${depth > 0 ? "ml-8 border-l-2 border-border pl-3 mt-3" : "mt-4"}`}>
        <div className="flex gap-3 group">
          <UserAvatar userId={c.user_id} src={c.profiles?.profile_picture} name={c.profiles?.name} username={c.profiles?.username} isVerified={adminIds.has(c.user_id)} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link to={`/user/${c.user_id}`} className="text-sm font-semibold text-foreground hover:underline">
                {c.profiles?.name || c.profiles?.username}
              </Link>
              <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
            </div>
            
            {editingComment === c.id ? (
              <div className="mt-1 space-y-2">
                <Textarea value={editCommentText} onChange={e => setEditCommentText(e.target.value)} className="text-sm min-h-[60px]" autoFocus />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => updateComment(c.id)}>Guardar</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>Cancelar</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground/90 mt-0.5 leading-relaxed">{c.content}</p>
            )}

            <div className="flex items-center gap-4 mt-2">
              <button onClick={() => setReplyTo({ id: c.id, name: c.profiles?.name || "..." })} className="text-[11px] text-muted-foreground hover:text-primary font-bold uppercase tracking-tight">Responder</button>
              <button 
                onClick={() => toggleCommentLike(c.id)}
                className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${likedComments.has(c.id) ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
              >
                <Heart className={`h-3 w-3 ${likedComments.has(c.id) ? "fill-primary" : ""}`} />
                {c.reactions_count || 0}
              </button>
            </div>
          </div>
          
          {(c.user_id === currentUserId || post?.user_id === currentUserId) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {c.user_id === currentUserId && (
                  <DropdownMenuItem onClick={() => { setEditingComment(c.id); setEditCommentText(c.content); }}>
                    <Pencil className="h-3.5 w-3.5 mr-2" /> Editar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => deleteComment(c.id)} className="text-destructive">
                  <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {renderComments(c.id, depth + 1)}
      </div>
    ));
  };

  if (loading) return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  if (!post) return null;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="rounded-xl">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
          <div className="flex items-center text-xs text-muted-foreground">
            <Link to="/feed" className="hover:text-primary">Início</Link>
            <ChevronRight className="h-3 w-3 mx-1" />
            <span className="truncate max-w-[150px]">{post.title}</span>
          </div>
        </div>

        <article className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <UserAvatar 
              userId={post.user_id} 
              src={post.profiles?.profile_picture} 
              name={post.profiles?.name} 
              username={post.profiles?.username} 
              isChef={post.profiles?.account_type === 'chef'}
              isVerified={adminIds.has(post.user_id)}
            />
            <div className="flex-1 min-w-0">
              <Link to={`/user/${post.user_id}`} className="font-bold text-foreground hover:underline">{post.profiles?.name || post.profiles?.username}</Link>
              <p className="text-xs text-muted-foreground">@{post.profiles?.username} · {timeAgo(post.created_at)}</p>
            </div>
            {(post.user_id === currentUserId || adminIds.has(currentUserId || "")) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {post.user_id === currentUserId && (
                    <DropdownMenuItem onClick={() => setIsEditingPost(true)}>
                      <Pencil className="h-4 w-4 mr-2" /> Editar Publicação
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={deletePost} className="text-destructive font-semibold">
                    <Trash2 className="h-4 w-4 mr-2" /> Eliminar Publicação
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="px-4 pb-4">
            <h1 className="text-2xl font-black font-display text-foreground leading-tight mb-2">{post.title}</h1>
            {post.description && <p className="text-base text-muted-foreground leading-relaxed italic border-l-4 border-muted pl-4 py-1">{post.description}</p>}
          </div>

          {post.image_url && (
            <div className="relative aspect-video sm:aspect-auto">
              <img src={post.image_url} alt={post.title} className="w-full object-contain bg-black/5 max-h-[600px]" />
            </div>
          )}

          <div className="flex items-center gap-4 p-4 border-t border-border">
            <button onClick={toggleLike} className={`flex items-center gap-2 text-sm font-bold transition-all ${likedPosts.has(post.id) ? "text-primary scale-110" : "text-muted-foreground hover:text-primary"}`}>
              <Heart className={`h-6 w-6 ${likedPosts.has(post.id) ? "fill-primary" : ""}`} />
              <span>{post.likes_count}</span>
            </button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-bold">
              <MessageCircle className="h-6 w-6" />
              <span>{comments.length}</span>
            </div>
            <button onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copiado!" }); }} className="ml-auto text-muted-foreground hover:text-primary transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 bg-muted/20 border-t border-border">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Comentários</h3>
            
            <div className="space-y-4 mb-6">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-6">Ainda não há comentários. Seja o primeiro!</p>
              ) : (
                renderComments()
              )}
            </div>

            <div className="bg-card rounded-xl border border-border p-3 shadow-sm sticky bottom-4">
              {replyTo && (
                <div className="flex items-center gap-2 text-xs text-primary mb-2 px-1">
                  <Reply className="h-3 w-3" /> 
                  A responder a <span className="font-bold">{replyTo.name}</span>
                  <button onClick={() => setReplyTo(null)} className="ml-auto text-muted-foreground transition-colors hover:text-foreground">✕</button>
                </div>
              )}
              <div className="flex gap-2">
                <Textarea 
                  placeholder={replyTo ? "Escreva a sua resposta..." : "O que achou deste prato?"} 
                  value={commentText} 
                  onChange={e => setCommentText(e.target.value)}
                  className="min-h-[44px] max-h-[120px] bg-muted/50 border-none resize-none px-3 py-2 text-sm shadow-none"
                />
                <Button size="icon" variant="hero" onClick={submitComment} disabled={!commentText.trim()} className="shrink-0 h-11 w-11 rounded-xl shadow-lg shadow-primary/20">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </article>

        <Dialog open={isEditingPost} onOpenChange={setIsEditingPost}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl">
            <DialogHeader>
              <DialogTitle className="font-display">Editar Publicação</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input id="edit-title" value={editPostTitle} onChange={e => setEditPostTitle(e.target.value)} maxLength={200} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-desc">Descrição</Label>
                <Textarea id="edit-desc" value={editPostDesc} onChange={e => setEditPostDesc(e.target.value)} rows={4} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingPost(false)} className="rounded-xl">Cancelar</Button>
              <Button variant="hero" onClick={updatePost} disabled={!editPostTitle.trim()} className="rounded-xl px-8">Guardar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default PostDetails;
