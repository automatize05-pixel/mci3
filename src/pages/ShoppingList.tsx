import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Plus, Check, Loader2, Trash2, AlertCircle } from "lucide-react";

type ShoppingItem = {
  id: string;
  name: string;
  checked: boolean;
};

const ShoppingList = () => {
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbError, setDbError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadList();
  }, []);

  const loadList = async () => {
    setLoading(true);
    setDbError(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from("shopping_lists")
        .select("items")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') {
          setDbError(true);
        } else {
          console.error("Shopping list error:", error);
        }
        return;
      }

      if (data && data.items) {
        setItems(typeof data.items === 'string' ? JSON.parse(data.items) : data.items);
      } else if (!data) {
        // Create initial list if table exists but row doesn't
        await (supabase as any).from("shopping_lists").insert({ user_id: user.id, items: [] });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const syncList = async (newItems: ShoppingItem[]) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await (supabase as any)
        .from("shopping_lists")
        .update({ items: newItems as any })
        .eq("user_id", user.id);

      if (error) throw error;
      setItems(newItems);
    } catch (e: any) {
      toast({ title: "Erro ao guardar lista", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newItem: ShoppingItem = {
      id: crypto.randomUUID(),
      name: inputValue.trim(),
      checked: false
    };

    const newItems = [newItem, ...items];
    setItems(newItems);
    setInputValue("");
    await syncList(newItems);
  };

  const toggleItem = async (id: string) => {
    const newItems = items.map(i => i.id === id ? { ...i, checked: !i.checked } : i);
    // Optimistic UI
    setItems(newItems);
    await syncList(newItems);
  };

  const removeItem = async (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    await syncList(newItems);
  };

  const clearChecked = async () => {
    const newItems = items.filter(i => !i.checked);
    setItems(newItems);
    await syncList(newItems);
    toast({ title: "Itens comprados limpos!" });
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Lista de Compras</h1>
            <p className="text-sm text-muted-foreground">O que falta ir buscar ao supermercado?</p>
          </div>
        </div>

        {dbError ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-600 mb-2">Base de Dados Desatualizada</h3>
            <p className="text-sm text-red-700">A funcionalidade de Lista de Compras requer a execução da migração de Base de Dados. Peça ao Administrador para executar o script SQL de Atualização.</p>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="bg-card rounded-2xl border border-border shadow-card overflow-hidden">
            <form onSubmit={handleAddItem} className="p-4 border-b border-border flex gap-2 w-full bg-muted/30">
              <Input 
                placeholder="Adicionar ingrediente (ex: 2 Cebolas)" 
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                className="rounded-xl border-border bg-background"
              />
              <Button type="submit" variant="hero" className="rounded-xl shrink-0" disabled={saving || !inputValue.trim()}>
                <Plus className="h-5 w-5" />
              </Button>
            </form>

            <div className="p-2 space-y-1">
              {items.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <ShoppingCart className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">A tua lista está vazia!</p>
                  <p className="text-xs text-muted-foreground mt-1">Adiciona itens acima ou a partir de receitas no feed.</p>
                </div>
              ) : (
                items.map(item => (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors hover:bg-muted/50 group ${item.checked ? 'opacity-60' : ''}`}>
                    <button 
                      onClick={() => toggleItem(item.id)}
                      className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${item.checked ? 'bg-primary border-primary' : 'border-muted-foreground/30 hover:border-primary'}`}
                    >
                      {item.checked && <Check className="h-4 w-4 text-white" />}
                    </button>
                    <span className={`flex-1 font-medium transition-all ${item.checked ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                      {item.name}
                    </span>
                    <button 
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500 hover:bg-red-500/10 rounded-lg"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {items.some(i => i.checked) && (
              <div className="p-4 border-t border-border bg-muted/10 flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">
                  {items.filter(i => i.checked).length} items comprados
                </span>
                <Button variant="outline" size="sm" className="rounded-lg h-8 text-xs hover:text-red-600 hover:bg-red-500/10 border-red-500/20" onClick={clearChecked}>
                  Limpar Comprados
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ShoppingList;
