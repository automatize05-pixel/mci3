import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, PlusCircle, Loader2, Bell, Send, MoreHorizontal, Pencil, Trash2, Reply, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Post = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  likes_count: number;
  created_at: string;
  user_id: string;
  profiles: { name: string | null; username: string | null; profile_picture: string | null; account_type: string } | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profiles: { name: string | null; username: string | null; profile_picture: string | null } | null;
};

const Feed = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<Record<string, { id: string; name: string } | null>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsData, setCommentsData] = useState<Record<string, Comment[]>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
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
      .select("*, profiles(name, username, profile_picture, account_type)")
      .order("created_at", { ascending: false })
      .limit(50);
    setPosts((data || []) as any);

    // Fetch like counts for all posts
    if (data && data.length > 0) {
      const postIds = data.map((p: any) => p.id);
      const { data: likes } = await supabase.from("likes").select("post_id").in("post_id", postIds);
      const counts: Record<string, number> = {};
      postIds.forEach(id => counts[id] = 0);
      likes?.forEach((l: any) => { counts[l.post_id] = (counts[l.post_id] || 0) + 1; });
      setLikeCounts(counts);
    }

    setLoading(false);
  };

  const fetchMyLikes = useCallback(async () => {
    if (!currentUserId) return;
    const { data } = await supabase.from("likes").select("post_id").eq("user_id", currentUserId);
    setLikedPosts(new Set(data?.map((l: any) => l.post_id) || []));
  }, [currentUserId]);

  const fetchNotifications = async () => {
    if (!currentUserId) return;
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", currentUserId)
      .eq("read_status", false);
    setUnreadNotifs(count || 0);
  };

  useEffect(() => { fetchPosts(); }, []);
  useEffect(() => { if (currentUserId) { fetchMyLikes(); fetchNotifications(); } }, [currentUserId, fetchMyLikes]);

  const toggleLike = async (postId: string) => {
    if (!currentUserId) return;
    const isLiked = likedPosts.has(postId);

    if (isLiked) {
      await supabase.from("likes").delete().eq("user_id", currentUserId).eq("post_id", postId);
      setLikedPosts(prev => { const n = new Set(prev); n.delete(postId); return n; });
      setLikeCounts(prev => ({ ...prev, [postId]: Math.max(0, (prev[postId] || 0) - 1) }));
    } else {
      await supabase.from("likes").insert({ user_id: currentUserId, post_id: postId });
      setLikedPosts(prev => new Set(prev).add(postId));
      setLikeCounts(prev => ({ ...prev, [postId]: (prev[postId] || 0) + 1 }));
    }
  };

  const toggleComments = async (postId: string) => {
    const isOpen = expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: !isOpen }));
    if (!isOpen && !commentsData[postId]) {
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(name, username, profile_picture)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      setCommentsData(prev => ({ ...prev, [postId]: (data || []) as any }));
    }
  };

  const submitComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text || !currentUserId) return;

    const parentId = replyTo[postId]?.id || null;
    const { data, error } = await supabase
      .from("comments")
      .insert({ post_id: postId, user_id: currentUserId, content: text, parent_id: parentId })
      .select("*, profiles(name, username, profile_picture)")
      .single();

    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }

    setCommentsData(prev => ({ ...prev, [postId]: [...(prev[postId] || []), data as any] }));
    setCommentText(prev => ({ ...prev, [postId]: "" }));
    setReplyTo(prev => ({ ...prev, [postId]: null }));
  };

  const deleteComment = async (postId: string, commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setCommentsData(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).filter(c => c.id !== commentId && c.parent_id !== commentId),
    }));
  };

  const updateComment = async (postId: string, commentId: string) => {
    if (!editText.trim()) return;
    const { error } = await supabase.from("comments").update({ content: editText.trim() }).eq("id", commentId);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setCommentsData(prev => ({
      ...prev,
      [postId]: (prev[postId] || []).map(c => c.id === commentId ? { ...c, content: editText.trim() } : c),
    }));
    setEditingComment(null);
    setEditText("");
  };

  const markNotifsRead = async () => {
    if (!currentUserId || unreadNotifs === 0) return;
    await supabase.from("notifications").update({ read_status: true }).eq("user_id", currentUserId).eq("read_status", false);
    setUnreadNotifs(0);
  };

  const timeAgo = (d: string) => {
    const diff = (Date.now() - new Date(d).getTime()) / 1000;
    if (diff < 60) return "agora";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const sharePost = (post: Post) => {
    const url = `${window.location.origin}/feed`;
    const text = `${post.title} — MCI`;
    if (navigator.share) {
      navigator.share({ title: post.title, text, url });
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast({ title: "Link copiado!" });
    }
  };

  const renderComments = (postId: string, parentId: string | null = null, depth = 0) => {
    const comments = (commentsData[postId] || []).filter(c => c.parent_id === parentId);
    const post = posts.find(p => p.id === postId);

    return comments.map(c => (
      <div key={c.id} className={`${depth > 0 ? "ml-8 border-l-2 border-border pl-3" : ""}`}>
        <div className="flex gap-2 group">
          <UserAvatar userId={c.user_id} src={(c.profiles as any)?.profile_picture} name={(c.profiles as any)?.name} username={(c.profiles as any)?.username} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Link to={`/user/${c.user_id}`} className="text-xs font-semibold text-foreground hover:underline">
                {(c.profiles as any)?.name || (c.profiles as any)?.username}
              </Link>
              <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
            </div>
            {editingComment === c.id ? (
              <div className="flex gap-1 mt-1">
                <input value={editText} onChange={e => setEditText(e.target.value)} className="flex-1 text-sm bg-muted rounded-lg px-2 py-1 border-none outline-none" autoFocus />
                <Button size="sm" variant="ghost" onClick={() => updateComment(postId, c.id)}>✓</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingComment(null)}>✕</Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{c.content}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setReplyTo(prev => ({ ...prev, [postId]: { id: c.id, name: (c.profiles as any)?.name || "..." } }))}
                className="text-[10px] text-muted-foreground hover:text-primary font-medium"
              >
                Responder
              </button>
            </div>
          </div>
          {(c.user_id === currentUserId || post?.user_id === currentUserId) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {c.user_id === currentUserId && (
                  <DropdownMenuItem onClick={() => { setEditingComment(c.id); setEditText(c.content); }}>
                    <Pencil className="h-3 w-3 mr-2" /> Editar
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => deleteComment(postId, c.id)} className="text-destructive">
                  <Trash2 className="h-3 w-3 mr-2" /> Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {/* Nested replies */}
        {renderComments(postId, c.id, depth + 1)}
      </div>
    ));
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold font-display text-foreground">Início</h1>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative rounded-xl" onClick={markNotifsRead}>
              <Bell className="h-5 w-5" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {unreadNotifs > 9 ? "9+" : unreadNotifs}
                </span>
              )}
            </Button>
            <Link to="/create-post">
              <Button variant="hero" size="sm" className="rounded-xl">
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
          <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
            <p className="text-muted-foreground mb-4">Nenhuma publicação ainda. Seja o primeiro!</p>
            <Link to="/create-post">
              <Button variant="hero" className="rounded-xl"><PlusCircle className="h-4 w-4 mr-1" /> Criar Publicação</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <article key={post.id} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                {/* Author */}
                <div className="flex items-center gap-3 p-4 pb-2">
                  <UserAvatar
                    userId={post.user_id}
                    src={(post.profiles as any)?.profile_picture}
                    name={(post.profiles as any)?.name}
                    username={(post.profiles as any)?.username}
                    isChef={(post.profiles as any)?.account_type === "chef"}
                  />
                  <div className="min-w-0 flex-1">
                    <Link to={`/user/${post.user_id}`} className="font-semibold text-foreground text-sm hover:underline">
                      {(post.profiles as any)?.name || (post.profiles as any)?.username || "Anónimo"}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      @{(post.profiles as any)?.username || "—"} · {timeAgo(post.created_at)}
                    </p>
                  </div>
                </div>

                {/* Content */}
                <div className="px-4 pb-3">
                  <h2 className="font-display font-semibold text-foreground">{post.title}</h2>
                  {post.description && <p className="text-sm text-muted-foreground mt-1">{post.description}</p>}
                </div>

                {post.image_url && (
                  <img src={post.image_url} alt={post.title} className="w-full max-h-[28rem] object-cover" />
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 px-2 py-2 border-t border-border">
                  <button
                    onClick={() => toggleLike(post.id)}
                    className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl transition-all duration-200 ${
                      likedPosts.has(post.id)
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <Heart className={`h-5 w-5 transition-all ${likedPosts.has(post.id) ? "fill-primary" : ""}`} />
                    <span>{likeCounts[post.id] || 0}</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary px-3 py-2 rounded-xl transition-colors"
                  >
                    <MessageCircle className="h-5 w-5" />
                    <span>{(commentsData[post.id] || []).length || ""}</span>
                  </button>
                  <button
                    onClick={() => sharePost(post)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary px-3 py-2 rounded-xl transition-colors ml-auto"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Comments */}
                {expandedComments[post.id] && (
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    {renderComments(post.id)}

                    {replyTo[post.id] && (
                      <div className="flex items-center gap-1 text-xs text-primary bg-primary/5 rounded-lg px-2 py-1">
                        <Reply className="h-3 w-3" />
                        A responder a {replyTo[post.id]?.name}
                        <button onClick={() => setReplyTo(prev => ({ ...prev, [post.id]: null }))} className="ml-auto text-muted-foreground hover:text-foreground">✕</button>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        placeholder={replyTo[post.id] ? "Escreva uma resposta..." : "Escreva um comentário..."}
                        value={commentText[post.id] || ""}
                        onChange={e => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={e => e.key === "Enter" && submitComment(post.id)}
                        className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 border-none outline-none placeholder:text-muted-foreground"
                      />
                      <Button size="icon" variant="ghost" onClick={() => submitComment(post.id)} disabled={!commentText[post.id]?.trim()} className="rounded-xl">
                        <Send className="h-4 w-4" />
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
