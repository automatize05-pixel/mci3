import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, UserPlus, ChefHat, Loader2, UtensilsCrossed, Users } from "lucide-react";

type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  profile_picture: string | null;
  bio: string | null;
  account_type: string;
};

const Search = () => {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"users" | "recipes">("users");
  const [results, setResults] = useState<Profile[]>([]);
  const [recipeResults, setRecipeResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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
    if (!query.trim()) { 
      setResults([]); 
      setRecipeResults([]);
      return; 
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      if (activeTab === "users") {
        const { data } = await supabase
          .from("profiles")
          .select("id, name, username, profile_picture, bio, account_type")
          .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
          .neq("id", currentUserId || "")
          .limit(20);
        setResults((data || []) as any);
      } else {
        // Advanced Ingredient Search
        const terms = query.split(',').map(t => t.trim()).filter(Boolean);
        const orQuery = terms.map(t => `title.ilike.%${t}%`).join(',');
        
        const { data } = await supabase
          .from("recipes")
          .select("*, profiles(name, username, profile_picture, account_type)")
          .or(orQuery || `title.ilike.%${query}%`)
          .order("created_at", { ascending: false })
          .limit(20);
        setRecipeResults((data || []) as any);
      }
      setLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, currentUserId, activeTab]);

  const toggleFollow = async (userId: string) => {
    if (!currentUserId) return;
    if (followingIds.has(userId)) {
      await supabase.from("followers").delete().eq("follower_id", currentUserId).eq("following_id", userId);
      setFollowingIds(prev => { const n = new Set(prev); n.delete(userId); return n; });
    } else {
      await supabase.from("followers").insert({ follower_id: currentUserId, following_id: userId });
      setFollowingIds(prev => new Set(prev).add(userId));
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-xl">
        <h1 className="text-xl font-bold font-display text-foreground mb-4">Pesquisar</h1>

        <div className="relative mb-6">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={activeTab === "users" ? "Pesquisar utilizadores e chefs..." : "Pesquise por ingredientes (ex: frango, arroz, tomate)"}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-10 rounded-xl"
            autoFocus
          />
        </div>

        <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl">
          <button 
            onClick={() => { setActiveTab("users"); setQuery(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === "users" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Users className="h-4 w-4" /> Pessoas
          </button>
          <button 
            onClick={() => { setActiveTab("recipes"); setQuery(""); }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all flex-col sm:flex-row ${activeTab === "recipes" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"}`}
          >
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-4 w-4" /> 
              <span>Receitas <span className="hidden sm:inline">(Frigorífico)</span></span>
            </div>
            {activeTab === "recipes" && <span className="text-[10px] sm:hidden text-primary">Beta</span>}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (activeTab === "users" && results.length > 0) ? (
          <div className="space-y-2">
            {results.map(user => (
              <div key={user.id} className="flex items-center gap-3 bg-card rounded-2xl border border-border p-3 shadow-card">
                <UserAvatar
                  userId={user.id}
                  src={user.profile_picture}
                  name={user.name}
                  username={user.username}
                  isChef={user.account_type === "chef"}
                />
                <div className="flex-1 min-w-0">
                  <Link to={`/user/${user.id}`} className="font-semibold text-sm text-foreground hover:underline">
                    {user.name || user.username}
                  </Link>
                  <p className="text-xs text-muted-foreground">@{user.username}</p>
                </div>
                <Button
                  size="sm"
                  variant={followingIds.has(user.id) ? "outline" : "default"}
                  className="rounded-xl text-xs"
                  onClick={() => toggleFollow(user.id)}
                >
                  {followingIds.has(user.id) ? "A seguir" : <><UserPlus className="h-3 w-3 mr-1" /> Seguir</>}
                </Button>
              </div>
            ))}
          </div>
        ) : (activeTab === "recipes" && recipeResults.length > 0) ? (
          <div className="grid grid-cols-1 gap-3">
             {recipeResults.map(recipe => (
               <div key={recipe.id} className="flex items-center gap-3 bg-card rounded-2xl border border-border p-3 shadow-card">
                  {recipe.image_url ? (
                    <img src={recipe.image_url} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="h-6 w-6 text-muted-foreground/30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground mb-1 line-clamp-2">{recipe.title}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <UserAvatar 
                         userId={recipe.user_id} 
                         src={recipe.profiles?.profile_picture} 
                         name={recipe.profiles?.name} 
                         username={recipe.profiles?.username}
                         isChef={recipe.profiles?.account_type === 'chef'}
                         size="sm" 
                      />
                      <span className="truncate">{recipe.profiles?.name || recipe.profiles?.username}</span>
                    </div>
                  </div>
               </div>
             ))}
          </div>
        ) : query.trim() ? (
          <p className="text-center text-muted-foreground py-8">Nenhum resultado encontrado.</p>
        ) : (
          <div className="text-center py-12">
            {activeTab === "users" ? (
              <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            ) : (
              <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            )}
            <p className="text-muted-foreground">
              {activeTab === "users" ? "Pesquise por nome ou username" : "A pesquisa suporta múltiplos ingredientes. Ex: alho, azeite, batata"}
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Search;
