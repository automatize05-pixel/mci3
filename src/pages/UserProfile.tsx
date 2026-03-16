import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, Users, BookOpen, Heart, Loader2, MessageSquare, UserPlus, UserMinus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const UserProfile = () => {
  const { userId } = useParams<{ userId: string }>();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
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
        supabase.from("posts").select("*, profiles(name, username, profile_picture)").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("recipes").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", userId),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", userId),
      ]);

      setProfile(profileRes.data);
      setPosts(postsRes.data || []);
      setRecipes(recipesRes.data || []);
      setFollowersCount(followersRes.count || 0);
      setFollowingCount(followingRes.count || 0);

      if (currentUserId && currentUserId !== userId) {
        const { data: followData } = await supabase
          .from("followers")
          .select("id")
          .eq("follower_id", currentUserId)
          .eq("following_id", userId)
          .maybeSingle();
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Utilizador não encontrado.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-xl">
        {/* Profile Header */}
        <div className="bg-card rounded-2xl border border-border shadow-card p-6 mb-4">
          <div className="flex items-start gap-4">
            <UserAvatar
              src={profile.profile_picture}
              name={profile.name}
              username={profile.username}
              isChef={isChef}
              size="xl"
              linked={false}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold font-display text-foreground">{profile.name || profile.username}</h1>
                {isChef && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-chef/10 text-chef text-xs font-semibold">
                    <ChefHat className="h-3 w-3" /> Chef
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              {profile.bio && <p className="text-sm text-foreground/80 mt-2">{profile.bio}</p>}

              {/* Stats */}
              <div className="flex items-center gap-5 mt-3">
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{followersCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Seguidores</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-foreground">{followingCount}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">A seguir</p>
                </div>
                {isChef && (
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">{recipes.length}</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Receitas</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isOwnProfile && (
            <div className="flex gap-2 mt-4">
              <Button
                onClick={toggleFollow}
                variant={isFollowing ? "outline" : "hero"}
                className="flex-1 rounded-xl"
                size="sm"
              >
                {isFollowing ? (
                  <><UserMinus className="h-4 w-4 mr-1" /> A seguir</>
                ) : (
                  <><UserPlus className="h-4 w-4 mr-1" /> Seguir</>
                )}
              </Button>
              <Link to="/messages" className="flex-1">
                <Button variant="outline" className="w-full rounded-xl" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" /> Mensagem
                </Button>
              </Link>
            </div>
          )}
          {isOwnProfile && (
            <Link to="/profile" className="block mt-4">
              <Button variant="outline" className="w-full rounded-xl" size="sm">Editar Perfil</Button>
            </Link>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts">
          <TabsList className="w-full rounded-xl bg-muted p-1">
            <TabsTrigger value="posts" className="flex-1 rounded-lg text-sm">Posts ({posts.length})</TabsTrigger>
            {isChef && <TabsTrigger value="recipes" className="flex-1 rounded-lg text-sm">Receitas ({recipes.length})</TabsTrigger>}
          </TabsList>

          <TabsContent value="posts" className="mt-4 space-y-3">
            {posts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Sem publicações.</p>
            ) : (
              posts.map(post => (
                <div key={post.id} className="bg-card rounded-2xl border border-border p-4 shadow-card">
                  <h3 className="font-display font-semibold text-foreground">{post.title}</h3>
                  {post.description && <p className="text-sm text-muted-foreground mt-1">{post.description}</p>}
                  {post.image_url && (
                    <img src={post.image_url} alt={post.title} className="w-full rounded-xl mt-3 max-h-60 object-cover" />
                  )}
                  <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {post.likes_count}</span>
                    <span>{new Date(post.created_at).toLocaleDateString("pt-PT")}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {isChef && (
            <TabsContent value="recipes" className="mt-4 space-y-3">
              {recipes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sem receitas.</p>
              ) : (
                recipes.map(recipe => (
                  <div key={recipe.id} className="bg-card rounded-2xl border border-border p-4 shadow-card">
                    <div className="flex items-start gap-3">
                      {recipe.image_url && (
                        <img src={recipe.image_url} alt={recipe.title} className="w-16 h-16 rounded-xl object-cover" />
                      )}
                      <div>
                        <h3 className="font-display font-semibold text-foreground">{recipe.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          {recipe.cooking_time && <span>⏱ {recipe.cooking_time}</span>}
                          {recipe.servings && <span>👥 {recipe.servings}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default UserProfile;
