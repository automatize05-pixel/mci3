import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, Users, BookOpen, Heart, Loader2, MessageSquare, UserPlus, UserMinus, Share2, TrendingUp, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [totalLikes, setTotalLikes] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      const [profileRes, postsRes, recipesRes, followersRes, followingRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("recipes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", userId),
      ]);

      setProfile(profileRes.data);
      setPosts(postsRes.data || []);
      setRecipes(recipesRes.data || []);
      setFollowersCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);

      // Total likes on user's posts
      if (postsRes.data && postsRes.data.length > 0) {
        const { count } = await supabase.from("likes").select("*", { count: "exact", head: true })
          .in("post_id", postsRes.data.map((p: any) => p.id));
        setTotalLikes(count || 0);
      }

      if (currentUserId && currentUserId !== userId) {
        const { data: followData } = await supabase
          .from("followers").select("id")
          .eq("follower_id", currentUserId).eq("following_id", userId).maybeSingle();
        setIsFollowing(!!followData);
      }
      setLoading(false);
    };
    load();
  }, [userId, currentUserId]);

  const toggleFollow = async () => {
    if (!currentUserId || !userId) return;
    if (isFollowing) {
      await supabase.from("followers").delete().eq("follower_id", currentUserId).eq("following_id", userId);
      setIsFollowing(false);
      setFollowersCount(prev => prev - 1);
    } else {
      await supabase.from("followers").insert({ follower_id: currentUserId, following_id: userId });
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    }
  };

  const isChef = profile?.account_type === "chef";
  const isOwnProfile = currentUserId === userId;
  const avgLikes = posts.length > 0 ? Math.round(totalLikes / posts.length) : 0;
  const engagementRate = followersCount > 0 ? ((totalLikes / Math.max(posts.length, 1)) / followersCount * 100).toFixed(1) : "0";

  if (loading) {
    return <AppLayout><div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;
  }
  if (!profile) {
    return <AppLayout><div className="container mx-auto px-4 py-16 text-center"><p className="text-muted-foreground">Utilizador não encontrado.</p></div></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Profile Header */}
        <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden mb-6">
          {/* Cover gradient */}
          <div className="h-28 gradient-warm relative" />

          <div className="px-6 pb-6">
            {/* Avatar overlapping cover */}
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12 mb-4">
              <div className="ring-4 ring-card rounded-full">
                <UserAvatar src={profile.profile_picture} name={profile.name} username={profile.username} isChef={isChef} size="xl" linked={false} />
              </div>
              <div className="flex-1 min-w-0 sm:pb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold font-display text-foreground">{profile.name || profile.username}</h1>
                  {isChef && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-chef/10 text-chef text-xs font-semibold">
                      <ChefHat className="h-3 w-3" /> Chef
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
              {/* Actions */}
              {!isOwnProfile && (
                <div className="flex gap-2 shrink-0">
                  <Button onClick={toggleFollow} variant={isFollowing ? "outline" : "hero"} className="rounded-xl" size="sm">
                    {isFollowing ? <><UserMinus className="h-4 w-4 mr-1" /> A seguir</> : <><UserPlus className="h-4 w-4 mr-1" /> Seguir</>}
                  </Button>
                  <Link to="/messages">
                    <Button variant="outline" className="rounded-xl" size="sm">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" className="rounded-xl" size="sm" onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Link copiado!" });
                  }}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {isOwnProfile && (
                <Link to="/settings">
                  <Button variant="outline" className="rounded-xl" size="sm">Editar Perfil</Button>
                </Link>
              )}
            </div>

            {profile.bio && <p className="text-sm text-foreground/80 mb-4">{profile.bio}</p>}

            {/* Stats row */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 bg-muted/50 rounded-xl p-4">
              <div className="text-center">
                <p className="text-lg font-bold font-display text-foreground">{followersCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-display text-foreground">{followingCount}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">A seguir</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold font-display text-foreground">{recipes.length}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Receitas</p>
              </div>
              <div className="text-center hidden sm:block">
                <p className="text-lg font-bold font-display text-foreground">{avgLikes}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Méd. Likes</p>
              </div>
              <div className="text-center hidden sm:block">
                <p className="text-lg font-bold font-display text-foreground">{engagementRate}%</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Engagement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts">
          <TabsList className="w-full rounded-xl bg-muted p-1">
            <TabsTrigger value="posts" className="flex-1 rounded-lg text-sm">Posts ({posts.length})</TabsTrigger>
            {isChef && <TabsTrigger value="recipes" className="flex-1 rounded-lg text-sm">Receitas ({recipes.length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="posts" className="mt-4">
            {posts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sem publicações.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {posts.map(post => (
                  <div key={post.id} className="aspect-square bg-card rounded-xl border border-border overflow-hidden relative group cursor-pointer">
                    {post.image_url ? (
                      <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full gradient-warm flex items-center justify-center p-3">
                        <p className="text-primary-foreground text-xs font-medium text-center line-clamp-3">{post.title}</p>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex items-center gap-3 text-primary-foreground text-sm font-semibold">
                        <span className="flex items-center gap-1"><Heart className="h-4 w-4" /> {post.likes_count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {isChef && (
            <TabsContent value="recipes" className="mt-4 space-y-3">
              {recipes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sem receitas.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {recipes.map(recipe => (
                    <div key={recipe.id} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden group">
                      {recipe.image_url ? (
                        <img src={recipe.image_url} alt={recipe.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-36 gradient-fresh flex items-center justify-center">
                          <BookOpen className="h-8 w-8 text-secondary-foreground" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-display font-semibold text-foreground text-sm">{recipe.title}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {recipe.cooking_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {recipe.cooking_time}</span>}
                          {recipe.servings && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {recipe.servings}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default UserProfile;
