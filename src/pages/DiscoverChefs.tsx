import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChefHat, Loader2, UserPlus, Trophy } from "lucide-react";

type Chef = {
  id: string;
  name: string | null;
  username: string | null;
  profile_picture: string | null;
  bio: string | null;
  followers_count: number;
  recipes_count: number;
};

const DiscoverChefs = () => {
  const [chefs, setChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        const { data } = await supabase.from("followers").select("following_id").eq("follower_id", user.id);
        setFollowingIds(new Set(data?.map(f => f.following_id) || []));
      }
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Get chef profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, username, profile_picture, bio, account_type")
        .eq("account_type", "chef")
        .eq("account_status", "approved")
        .limit(50);

      if (!profiles || profiles.length === 0) {
        setChefs([]);
        setLoading(false);
        return;
      }

      // Get follower counts and recipe counts
      const chefIds = profiles.map(p => p.id);
      const [followersRes, recipesRes] = await Promise.all([
        supabase.from("followers").select("following_id").in("following_id", chefIds),
        supabase.from("recipes").select("user_id").in("user_id", chefIds),
      ]);

      const followerCounts: Record<string, number> = {};
      const recipeCounts: Record<string, number> = {};
      chefIds.forEach(id => { followerCounts[id] = 0; recipeCounts[id] = 0; });
      followersRes.data?.forEach((f: any) => { followerCounts[f.following_id] = (followerCounts[f.following_id] || 0) + 1; });
      recipesRes.data?.forEach((r: any) => { recipeCounts[r.user_id] = (recipeCounts[r.user_id] || 0) + 1; });

      const chefsWithStats = profiles.map(p => ({
        ...p,
        followers_count: followerCounts[p.id] || 0,
        recipes_count: recipeCounts[p.id] || 0,
      })).sort((a, b) => b.followers_count - a.followers_count);

      setChefs(chefsWithStats);
      setLoading(false);
    };

    load();
  }, []);

  const toggleFollow = async (chefId: string) => {
    if (!currentUserId) return;
    if (followingIds.has(chefId)) {
      await supabase.from("followers").delete().eq("follower_id", currentUserId).eq("following_id", chefId);
      setFollowingIds(prev => { const n = new Set(prev); n.delete(chefId); return n; });
      setChefs(prev => prev.map(c => c.id === chefId ? { ...c, followers_count: c.followers_count - 1 } : c));
    } else {
      await supabase.from("followers").insert({ follower_id: currentUserId, following_id: chefId });
      setFollowingIds(prev => new Set(prev).add(chefId));
      setChefs(prev => prev.map(c => c.id === chefId ? { ...c, followers_count: c.followers_count + 1 } : c));
    }
  };

  const getRank = (followers: number) => {
    if (followers >= 100) return { label: "Master Chef", color: "text-amber-500" };
    if (followers >= 50) return { label: "Gold Chef", color: "text-yellow-500" };
    if (followers >= 20) return { label: "Silver Chef", color: "text-gray-400" };
    if (followers >= 5) return { label: "Bronze Chef", color: "text-orange-600" };
    return { label: "Chef Iniciante", color: "text-muted-foreground" };
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl gradient-fresh flex items-center justify-center">
            <ChefHat className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">Descobrir Chefs</h1>
            <p className="text-xs text-muted-foreground">Ranking Nacional</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : chefs.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
            <ChefHat className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Nenhum chef registado ainda.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {chefs.map((chef, index) => {
              const rank = getRank(chef.followers_count);
              return (
                <div key={chef.id} className="flex items-center gap-3 bg-card rounded-2xl border border-border p-4 shadow-card">
                  <div className="flex-shrink-0 w-8 text-center">
                    {index < 3 ? (
                      <Trophy className={`h-5 w-5 mx-auto ${index === 0 ? "text-yellow-500" : index === 1 ? "text-gray-400" : "text-orange-600"}`} />
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{index + 1}</span>
                    )}
                  </div>
                  <UserAvatar
                    userId={chef.id}
                    src={chef.profile_picture}
                    name={chef.name}
                    username={chef.username}
                    isChef
                    size="lg"
                  />
                  <div className="flex-1 min-w-0">
                    <Link to={`/user/${chef.id}`} className="font-semibold text-foreground hover:underline">
                      {chef.name || chef.username}
                    </Link>
                    <p className={`text-[10px] font-semibold uppercase tracking-wider ${rank.color}`}>{rank.label}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{chef.followers_count} seguidores</span>
                      <span>{chef.recipes_count} receitas</span>
                    </div>
                  </div>
                  {currentUserId !== chef.id && (
                    <Button
                      size="sm"
                      variant={followingIds.has(chef.id) ? "outline" : "default"}
                      className="rounded-xl text-xs"
                      onClick={() => toggleFollow(chef.id)}
                    >
                      {followingIds.has(chef.id) ? "A seguir" : <><UserPlus className="h-3 w-3 mr-1" /> Seguir</>}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DiscoverChefs;
