import AppLayout from "@/components/AppLayout";
import { Sparkles } from "lucide-react";

const AIRecipes = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Gerador de Receitas com IA</h1>
        </div>
        <div className="bg-card rounded-xl border border-border p-8 text-center shadow-card">
          <p className="text-muted-foreground">
            Diga os ingredientes que tem e a IA vai criar uma receita para si (em breve).
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIRecipes;
