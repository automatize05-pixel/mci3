import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, UserPlus, ChefHat, Loader2 } from "lucide-react";

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
  const [results, setResults] = useState<Profile[]>([]);
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
    if (!query.trim()) { setResults([]); return; }

    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, name, username, profile_picture, bio, account_type")
        .or(`name.ilike.%${query}%,username.ilike.%${query}%`)
        .neq("id", currentUserId || "")
        .limit(20);
      setResults((data || []) as any);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, currentUserId]);

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
            placeholder="Pesquisar utilizadores e chefs..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-10 rounded-xl"
            autoFocus
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : results.length > 0 ? (
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
        ) : query.trim() ? (
          <p className="text-center text-muted-foreground py-8">Nenhum resultado encontrado.</p>
        ) : (
          <div className="text-center py-12">
            <SearchIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Pesquise por nome ou username</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Search;
