import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, Users, Heart, Loader2, Sparkles, Bookmark, BookmarkCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Recipe = {
  id: string;
  title: string;
  cooking_time: string | null;
  servings: string | null;
  image_url: string | null;
  created_at: string;
  user_id: string;
  profiles: { name: string | null; username: string | null; profile_picture: string | null; account_type: string } | null;
};

const Recipes = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        const { data } = await supabase.from("saved_recipes").select("recipe_id").eq("user_id", user.id);
        setSavedRecipes(new Set(data?.map(r => r.recipe_id) || []));
      }
    });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("recipes")
        .select("*, profiles(name, username, profile_picture, account_type)")
        .order("created_at", { ascending: false })
        .limit(50);
      setRecipes((data || []) as any);
      setLoading(false);
    };
    load();
  }, []);

  const toggleSave = async (recipeId: string) => {
    if (!currentUserId) return;
    if (savedRecipes.has(recipeId)) {
      await supabase.from("saved_recipes").delete().eq("user_id", currentUserId).eq("recipe_id", recipeId);
      setSavedRecipes(prev => { const n = new Set(prev); n.delete(recipeId); return n; });
      toast({ title: "Receita removida dos favoritos" });
    } else {
      await supabase.from("saved_recipes").insert({ user_id: currentUserId, recipe_id: recipeId });
      setSavedRecipes(prev => new Set(prev).add(recipeId));
      toast({ title: "Receita guardada!" });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold font-display text-foreground">Receitas</h1>
          </div>
          <Link to="/ai-recipes">
            <Button variant="hero" size="sm" className="rounded-xl">
              <Sparkles className="h-4 w-4 mr-1" /> Gerar com IA
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : recipes.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center shadow-card">
            <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">Nenhuma receita ainda.</p>
            <Link to="/ai-recipes">
              <Button variant="hero" className="rounded-xl"><Sparkles className="h-4 w-4 mr-1" /> Gerar Receita com IA</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {recipes.map(recipe => (
              <div key={recipe.id} className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
                {recipe.image_url && (
                  <img src={recipe.image_url} alt={recipe.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display font-semibold text-foreground flex-1">{recipe.title}</h3>
                    <button onClick={() => toggleSave(recipe.id)} className="text-muted-foreground hover:text-primary transition-colors">
                      {savedRecipes.has(recipe.id) ? (
                        <BookmarkCheck className="h-5 w-5 text-primary fill-primary" />
                      ) : (
                        <Bookmark className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {recipe.cooking_time && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {recipe.cooking_time}</span>}
                    {recipe.servings && <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {recipe.servings}</span>}
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                    <UserAvatar
                      userId={recipe.user_id}
                      src={(recipe.profiles as any)?.profile_picture}
                      name={(recipe.profiles as any)?.name}
                      username={(recipe.profiles as any)?.username}
                      isChef={(recipe.profiles as any)?.account_type === "chef"}
                      size="sm"
                    />
                    <Link to={`/user/${recipe.user_id}`} className="text-xs font-medium text-foreground hover:underline">
                      {(recipe.profiles as any)?.name || (recipe.profiles as any)?.username}
                    </Link>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(recipe.created_at).toLocaleDateString("pt-PT")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Recipes;
