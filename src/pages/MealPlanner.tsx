import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Calendar as CalendarIcon, AlertCircle, Trash2, Clock, Users } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type MealPlan = {
  id: string;
  meal_date: string;
  meal_type: string;
  recipes: {
    id: string;
    title: string;
    image_url: string | null;
    cooking_time: string | null;
    servings: string | null;
  };
};

const mealTypes = ['pequeno-almoço', 'almoço', 'lanche', 'jantar'];

const MealPlanner = () => {
  const [plans, setPlans] = useState<MealPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();

  const loadPlans = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from("meal_plans")
        .select("*, recipes(id, title, image_url, cooking_time, servings)")
        .eq("user_id", user.id)
        .order("meal_date", { ascending: true });

      if (error) {
        if (error.code === '42P01') {
          setDbError(true);
        } else {
          console.error("Meal planner error:", error);
        }
        return;
      }

      setPlans(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const removePlan = async (id: string) => {
    try {
      const { error } = await (supabase as any).from("meal_plans").delete().eq("id", id);
      if (error) throw error;
      setPlans(prev => prev.filter(p => p.id !== id));
      toast({ title: "Refeição removida do calendário" });
    } catch (e: any) {
      toast({ title: "Erro", description: e.message, variant: "destructive" });
    }
  };

  // Generate week days
  const startOfWk = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWk, i));

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center">
            <CalendarIcon className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Planeador de Refeições</h1>
            <p className="text-sm text-muted-foreground">Organiza a tua semana com as melhores receitas.</p>
          </div>
        </div>

        {dbError ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-600 mb-2">Base de Dados Desatualizada</h3>
            <p className="text-sm text-red-700">O Planeador Semanal requer a execução da migração de Base de Dados. Peça ao Administrador para executar o script SQL.</p>
          </div>
        ) : loading ? (
           <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-6">
            <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x">
              {weekDays.map(date => {
                const dateStr = format(date, 'yyyy-MM-dd');
                const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                const dayPlans = plans.filter(p => p.meal_date === dateStr);
                
                return (
                  <div key={dateStr} className={`min-w-[280px] sm:min-w-[320px] snap-center rounded-2xl border bg-card shadow-card overflow-hidden flex flex-col ${isToday ? 'border-primary ring-1 ring-primary/20' : 'border-border'}`}>
                    <div className={`p-4 border-b ${isToday ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-border'}`}>
                      <h3 className="font-display font-bold text-lg capitalize">{format(date, 'EEEE', { locale: ptBR })}</h3>
                      <p className="text-xs text-muted-foreground">{format(date, "d 'de' MMMM", { locale: ptBR })}</p>
                    </div>
                    
                    <div className="p-4 flex-1 flex flex-col gap-4">
                      {mealTypes.map(type => {
                        const meal = dayPlans.find(p => p.meal_type === type);
                        return (
                          <div key={type} className="flex flex-col gap-2">
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{type}</h4>
                            {meal ? (
                              <div className="relative group rounded-xl border border-border bg-background p-3 shadow-sm flex items-start gap-3">
                                {meal.recipes.image_url ? (
                                  <img src={meal.recipes.image_url} alt="" className="w-12 h-12 rounded-lg object-cover bg-muted shrink-0" />
                                ) : (
                                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                    <CalendarIcon className="h-5 w-5 text-muted-foreground/30" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-foreground truncate">{meal.recipes.title}</p>
                                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                                    {meal.recipes.cooking_time && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{meal.recipes.cooking_time}</span>}
                                    {meal.recipes.servings && <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{meal.recipes.servings}</span>}
                                  </div>
                                </div>
                                <button onClick={() => removePlan(meal.id)} className="absolute -top-2 -right-2 bg-background border border-border rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-red-500/10 shadow-sm">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-3 flex items-center justify-center text-xs text-muted-foreground/50 italic h-14">
                                Vazio
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <p className="text-center text-xs text-muted-foreground italic">
              Para adicionar refeições a este planeador, vá até à aba <b>Receitas</b> e clique no botão "Planear" em qualquer receita!
            </p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default MealPlanner;
