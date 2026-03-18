import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Users, Heart, Loader2, Sparkles, Bookmark, BookmarkCheck, ShoppingCart, Calendar } from "lucide-react";
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
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [planDate, setPlanDate] = useState("");
  const [planMealType, setPlanMealType] = useState('almoço');
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

  const addToShoppingList = async (recipe: Recipe) => {
    if (!currentUserId) return;
    try {
      const { data } = await (supabase as any).from("shopping_lists").select("items").eq("user_id", currentUserId).maybeSingle();
      const currentItems = data?.items ? (typeof data.items === 'string' ? JSON.parse(data.items) : data.items) : [];
      const newItems = [{ id: crypto.randomUUID(), name: `Receita: ${recipe.title}`, checked: false }, ...currentItems];
      if (data) {
        await (supabase as any).from("shopping_lists").update({ items: newItems as any }).eq("user_id", currentUserId);
      } else {
        await (supabase as any).from("shopping_lists").insert({ user_id: currentUserId, items: newItems as any });
      }
      toast({ title: "Adicionado à Lista de Compras!" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  const confirmPlan = async () => {
    if (!currentUserId || !selectedRecipe || !planDate) return;
    try {
      const { error } = await (supabase as any).from("meal_plans").insert({
        user_id: currentUserId,
        recipe_id: selectedRecipe.id,
        meal_date: planDate,
        meal_type: planMealType
      });
      if (error) throw error;
      toast({ title: "Receita Planeada", description: `Agendado para ${planDate}` });
      setPlannerOpen(false);
    } catch (e: any) {
      toast({ title: "Erro ao planear", description: e.message, variant: "destructive" });
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
                  
                  <div className="mt-3 pt-3 border-t border-border flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1 rounded-xl text-xs bg-muted/50 hover:bg-muted" onClick={() => addToShoppingList(recipe)}>
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Compras
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 rounded-xl text-xs" onClick={() => { setSelectedRecipe(recipe); setPlannerOpen(true); setPlanDate(new Date().toISOString().split("T")[0]); }}>
                      <Calendar className="h-3 w-3 mr-1" />
                      Planear
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={plannerOpen} onOpenChange={setPlannerOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Planear Refeição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Receita</Label>
              <div className="p-3 bg-muted/30 rounded-xl font-medium text-sm border border-border">
                {selectedRecipe?.title}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input type="date" id="date" className="rounded-xl" value={planDate} onChange={e => setPlanDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo de Refeição</Label>
              <Select value={planMealType} onValueChange={setPlanMealType}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pequeno-almoço">Pequeno-almoço</SelectItem>
                  <SelectItem value="almoço">Almoço</SelectItem>
                  <SelectItem value="lanche">Lanche</SelectItem>
                  <SelectItem value="jantar">Jantar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPlannerOpen(false)} className="rounded-xl">Cancelar</Button>
            <Button variant="hero" onClick={confirmPlan} className="rounded-xl">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
};

export default Recipes;
