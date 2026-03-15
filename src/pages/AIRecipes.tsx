import { useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, ChefHat, Clock, Users, Loader2, Save, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Recipe {
  recipe_name: string;
  ingredients: string[];
  steps: string[];
  cooking_time: string;
  servings: string;
}

const AIRecipes = () => {
  const [ingredients, setIngredients] = useState("");
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const generateRecipe = async () => {
    if (!ingredients.trim()) return;
    setLoading(true);
    setRecipe(null);

    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke("generate-recipe", {
        body: { ingredients: ingredients.trim() },
      });

      if (functionError) throw new Error(functionError.message);
      if (functionData.error) throw new Error(functionData.error);

      setRecipe(functionData.recipe);

      // Save generation to history
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("recipe_ai_generations").insert({
          user_id: user.id,
          ingredients_prompt: ingredients.trim(),
          ai_response: functionData.recipe,
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao gerar receita",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAsRecipe = async () => {
    if (!recipe) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase.from("recipes").insert({
        user_id: user.id,
        title: recipe.recipe_name,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        cooking_time: recipe.cooking_time,
        servings: recipe.servings,
      });

      if (error) throw error;

      toast({ title: "Receita guardada!", description: "A receita foi adicionada às suas receitas." });
    } catch (error: any) {
      toast({
        title: "Erro ao guardar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Gerador de Receitas com IA</h1>
        </div>

        {/* Input */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-card mb-6">
          <label className="block text-sm font-medium text-foreground mb-2">
            Que ingredientes tem disponíveis?
          </label>
          <Textarea
            placeholder="Ex: arroz, frango, tomate, cebola, alho..."
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            rows={3}
          />
          <Button
            onClick={generateRecipe}
            disabled={loading || !ingredients.trim()}
            className="mt-4 w-full"
            variant="hero"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                A gerar receita...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar Receita
              </>
            )}
          </Button>
        </div>

        {/* Result */}
        {recipe && (
          <div className="bg-card rounded-xl border border-border p-6 shadow-card animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <ChefHat className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-bold font-display text-foreground">{recipe.recipe_name}</h2>
              </div>
              <Button variant="outline" size="sm" onClick={saveAsRecipe} disabled={saving}>
                <Save className="h-4 w-4 mr-1" />
                {saving ? "A guardar..." : "Guardar"}
              </Button>
            </div>

            <div className="flex gap-4 mb-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {recipe.cooking_time}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" /> {recipe.servings}
              </span>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-1">
                <BookOpen className="h-4 w-4" /> Ingredientes
              </h3>
              <ul className="space-y-1">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary mt-1">•</span> {ing}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-2">Passos</h3>
              <ol className="space-y-3">
                {recipe.steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default AIRecipes;
