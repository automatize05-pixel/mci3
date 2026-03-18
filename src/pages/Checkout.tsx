import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, ShieldCheck, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams, useNavigate } from "react-router-dom";

const plans = [
  {
    id: "starter",
    name: "Chef Starter",
    price: "3.500 Kz",
    description: "Para quem está a começar na cozinha.",
    features: ["50 receitas IA/mês", "Planeamento semanal", "Badge Starter"],
  },
  {
    id: "pro",
    name: "Chef Pro",
    price: "7.000 Kz",
    description: "Para os amantes da cozinha profissional.",
    features: ["IA ilimitada", "Analytics", "Badge Pro", "Monetização"],
    highlight: true
  },
  {
    id: "elite",
    name: "Chef Elite",
    price: "15.000 Kz",
    description: "Para grandes chefs e formadores.",
    features: ["Tudo do Pro", "Consultoria IA", "Destaque", "API access"],
  }
];

const Checkout = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(searchParams.get("plan"));
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdminId = async () => {
      // Find admin by email as it is more reliable than user_roles table which might have RLS blocks
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", "ageusilva905@gmail.com")
        .maybeSingle();
      
      if (data) setAdminId(data.id);
    };
    fetchAdminId();
  }, []);

  const plan = plans.find(p => p.id === selectedPlan) || plans[1];

  const handleConfirmRequest = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({ title: "Erro", description: "Inicie sessão para continuar.", variant: "destructive" });
      navigate("/");
      return;
    }

    const { error } = await (supabase as any)
      .from("subscription_requests")
      .insert({ 
        user_id: user.id, 
        plan_id: plan.id, 
        status: 'pending'
      });

    if (error) {
      console.error("Subscription request error:", error);
      toast({ 
        title: "Nota", 
        description: "Envia mensagem ao admin para ativar o teu plano manually.",
      });
    } else {
      toast({ 
        title: "Pedido enviado!", 
        description: "O seu pedido está pendente de aprovação após o pagamento.",
      });
    }
    
    // Always attempt redirection to admin profile so they can talk
    if (adminId) {
      navigate(`/user/${adminId}`);
    } else {
      // Fallback to a search for the admin name if ID fetch failed
      navigate("/settings");
    }
    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl font-bold font-display mb-4 text-foreground">Escolha o seu plano</h1>
          <p className="text-muted-foreground text-lg">
            Potencialize sua criatividade culinária com as nossas ferramentas de IA e conecte-se com os melhores chefs.
          </p>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="bg-card rounded-3xl border-2 border-primary shadow-2xl p-8 flex flex-col mb-8">
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold font-display text-foreground mb-2">Pagamento por Referência</h3>
              <p className="text-sm text-muted-foreground">Utilize os dados abaixo para efectuar o pagamento via PayPay</p>
            </div>

            <div className="space-y-4 bg-muted/50 rounded-2xl p-6 mb-8 border border-border">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Plano Seleccionado:</span>
                <span className="font-bold text-foreground">{plan.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Valor a Pagar:</span>
                <span className="font-bold text-primary text-xl">{plan.price}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm font-semibold">Entidade:</span>
                <span className="font-black text-foreground text-lg tracking-widest">10116</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm font-semibold">Referência:</span>
                <span className="font-black text-foreground text-lg tracking-widest">947005277</span>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
              <p className="text-xs text-primary font-medium text-center leading-relaxed">
                "depois do pagamento, entre em contacto com o admin para dar acesso ao plano escolhido"
              </p>
            </div>

            <Button 
              variant="hero" 
              className="w-full rounded-2xl h-14 text-lg font-bold shadow-warm transition-all active:scale-95"
              onClick={handleConfirmRequest}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Já fiz o Pagamento"}
            </Button>
            
            <p className="text-[10px] text-muted-foreground text-center mt-4 uppercase tracking-widest">
              A activação será feita manualmente pelo administrador
            </p>
          </div>
        </div>

        <div className="mt-20 flex flex-wrap justify-center gap-12 text-muted-foreground/40">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" />
            <span className="font-medium">Pagamento Seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6" />
            <span className="font-medium">Ativação Instantânea</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            <span className="font-medium">Cancele a qualquer momento</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Checkout;
