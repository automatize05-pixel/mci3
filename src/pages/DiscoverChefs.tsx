import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ChefHat, Loader2, UserPlus, Trophy, TrendingUp, Star, ArrowRight } from "lucide-react";

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
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, username, profile_picture, bio, account_type")
        .eq("account_type", "chef")
        .eq("account_status", "approved")
        .limit(50);

      if (!profiles || profiles.length === 0) { setChefs([]); setLoading(false); return; }

      const chefIds = profiles.map(p => p.id);
      const [followersRes, recipesRes] = await Promise.all([
        supabase.from("followers").select("following_id").in("following_id", chefIds),
        supabase.from("recipes").select("user_id").in("user_id", chefIds),
      ]);

      const fCounts: Record<string, number> = {};
      const rCounts: Record<string, number> = {};
      chefIds.forEach(id => { fCounts[id] = 0; rCounts[id] = 0; });
      followersRes.data?.forEach((f: any) => { fCounts[f.following_id]++; });
      recipesRes.data?.forEach((r: any) => { rCounts[r.user_id]++; });

      setChefs(
        profiles.map(p => ({ ...p, followers_count: fCounts[p.id], recipes_count: rCounts[p.id] }))
          .sort((a, b) => b.followers_count - a.followers_count)
      );
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
    if (followers >= 100) return { label: "Master Chef", color: "text-amber-500", bg: "bg-amber-500/10" };
    if (followers >= 50) return { label: "Gold Chef", color: "text-yellow-500", bg: "bg-yellow-500/10" };
    if (followers >= 20) return { label: "Silver Chef", color: "text-gray-400", bg: "bg-gray-400/10" };
    if (followers >= 5) return { label: "Bronze Chef", color: "text-orange-600", bg: "bg-orange-600/10" };
    return { label: "Chef Iniciante", color: "text-muted-foreground", bg: "bg-muted" };
  };

  const featured = chefs.slice(0, 3);
  const risingStar = chefs.slice(3, 8);
  const ranking = chefs;

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl gradient-fresh flex items-center justify-center">
            <ChefHat className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">Descobrir Chefs</h1>
            <p className="text-xs text-muted-foreground">Ranking Nacional de Angola</p>
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
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Main content */}
            <div className="flex-1 space-y-8">
              {/* Featured Master Chefs */}
              {featured.length > 0 && (
                <section>
                  <h2 className="font-display font-bold text-foreground text-lg mb-4 flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" /> Chefs em Destaque
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featured.map(chef => {
                      const rank = getRank(chef.followers_count);
                      return (
                        <div key={chef.id} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden group">
                          <div className="h-24 gradient-warm relative">
                            <div className="absolute top-3 left-3">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${rank.bg} ${rank.color} text-[10px] font-bold`}>
                                <Trophy className="h-3 w-3" /> {rank.label}
                              </span>
                            </div>
                          </div>
                          <div className="px-4 pb-4 -mt-8 relative">
                            <div className="ring-3 ring-card rounded-full w-fit">
                              <UserAvatar userId={chef.id} src={chef.profile_picture} name={chef.name} username={chef.username} isChef size="lg" />
                            </div>
                            <h3 className="font-display font-bold text-foreground mt-2">
                              <Link to={`/user/${chef.id}`} className="hover:underline">{chef.name || chef.username}</Link>
                            </h3>
                            {chef.bio && <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{chef.bio}</p>}
                            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                              <span>{chef.followers_count} seguidores</span>
                              <span>{chef.recipes_count} receitas</span>
                            </div>
                            {currentUserId !== chef.id && (
                              <Button
                                size="sm"
                                variant={followingIds.has(chef.id) ? "outline" : "hero"}
                                className="w-full rounded-xl mt-3 text-xs"
                                onClick={() => toggleFollow(chef.id)}
                              >
                                {followingIds.has(chef.id) ? "A seguir" : <><UserPlus className="h-3 w-3 mr-1" /> Seguir</>}
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Rising Stars */}
              {risingStar.length > 0 && (
                <section>
                  <h2 className="font-display font-bold text-foreground text-lg mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" /> Estrelas em Ascensão
                  </h2>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
                    {risingStar.map(chef => (
                      <div key={chef.id} className="bg-card rounded-2xl border border-border shadow-card p-4 min-w-[180px] shrink-0">
                        <div className="flex flex-col items-center text-center">
                          <UserAvatar userId={chef.id} src={chef.profile_picture} name={chef.name} username={chef.username} isChef size="lg" />
                          <Link to={`/user/${chef.id}`} className="font-display font-semibold text-foreground text-sm mt-2 hover:underline">
                            {chef.name || chef.username}
                          </Link>
                          <p className="text-[10px] text-muted-foreground">{chef.followers_count} seguidores</p>
                          {currentUserId !== chef.id && (
                            <Button size="sm" variant={followingIds.has(chef.id) ? "outline" : "default"} className="rounded-xl text-xs mt-2 w-full" onClick={() => toggleFollow(chef.id)}>
                              {followingIds.has(chef.id) ? "A seguir" : "Seguir"}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* CTA */}
              <div className="gradient-fresh rounded-2xl p-6 text-center">
                <ChefHat className="h-8 w-8 text-secondary-foreground mx-auto mb-2" />
                <h3 className="font-display font-bold text-secondary-foreground text-lg mb-1">Torne-se Chef Certificado</h3>
                <p className="text-secondary-foreground/80 text-sm mb-4">Partilhe as suas receitas e construa a sua reputação.</p>
                <Link to="/settings">
                  <Button variant="outline" size="sm" className="bg-card text-foreground border-none rounded-xl">
                    Candidatar-se <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Ranking sidebar */}
            <aside className="lg:w-72 shrink-0">
              <div className="bg-card rounded-2xl border border-border p-5 shadow-card sticky top-20">
                <h3 className="font-display font-bold text-foreground text-sm mb-4 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" /> Ranking Nacional
                </h3>
                <div className="space-y-3">
                  {ranking.map((chef, idx) => {
                    const rank = getRank(chef.followers_count);
                    return (
                      <div key={chef.id} className="flex items-center gap-3">
                        <div className="w-6 text-center shrink-0">
                          {idx < 3 ? (
                            <Trophy className={`h-4 w-4 mx-auto ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-gray-400" : "text-orange-600"}`} />
                          ) : (
                            <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                          )}
                        </div>
                        <UserAvatar userId={chef.id} src={chef.profile_picture} name={chef.name} username={chef.username} isChef size="sm" />
                        <div className="flex-1 min-w-0">
                          <Link to={`/user/${chef.id}`} className="text-sm font-medium text-foreground hover:underline truncate block">
                            {chef.name || chef.username}
                          </Link>
                          <p className={`text-[9px] font-semibold uppercase tracking-wider ${rank.color}`}>{rank.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default DiscoverChefs;
