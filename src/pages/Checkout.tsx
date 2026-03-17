import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Check, CreditCard, ShieldCheck, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const plans = [
  {
    name: "Gratuito",
    price: "0€",
    description: "Para quem está a começar na cozinha.",
    features: ["5 receitas por mês", "Acesso à comunidade", "Dicas básicas de IA"],
    type: "free"
  },
  {
    name: "Pro",
    price: "9.99€",
    description: "Para os amantes da cozinha criativa.",
    features: ["Receitas ilimitadas", "Modo Multimodal (Foto + Texto)", "Histórico ilimitado", "Acesso antecipado"],
    type: "pro",
    highlight: true
  },
  {
    name: "Enterprise",
    price: "24.99€",
    description: "Para chefs profissionais e empresas.",
    features: ["Tudo no Pro", "Suporte prioritário", "Consultoria de Cardápio", "API Access"],
    type: "enterprise"
  }
];

const Checkout = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planType: string) => {
    setLoading(planType);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({ title: "Erro", description: "Inicie sessão para continuar.", variant: "destructive" });
      navigate("/");
      return;
    }

    // Simulate payment processing
    setTimeout(async () => {
      const { error } = await (supabase as any)
        .from("user_subscriptions")
        .upsert({ 
          user_id: user.id, 
          plan_type: planType, 
          status: 'active',
          updated_at: new Date().toISOString()
        });

      if (error) {
        toast({ title: "Erro no pagamento", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Parabéns!", description: `Agora és um membro ${planType.toUpperCase()}!` });
        navigate("/feed");
      }
      setLoading(null);
    }, 1500);
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div 
              key={plan.name}
              className={`relative bg-card rounded-3xl border ${plan.highlight ? 'border-primary ring-2 ring-primary/20 shadow-2xl' : 'border-border shadow-card'} p-8 flex flex-col transition-all hover:translate-y-[-4px]`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Mais Popular
                </div>
              )}

              <div className="mb-8">
                <h3 className="text-2xl font-bold font-display text-foreground mb-2">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
              </div>

              <div className="space-y-4 mb-10 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3 text-sm text-foreground/80">
                    <Check className="h-5 w-5 text-primary shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                variant={plan.highlight ? "hero" : "outline"} 
                className="w-full rounded-2xl h-12 text-base font-bold transition-all active:scale-95"
                onClick={() => handleSubscribe(plan.type)}
                disabled={!!loading}
              >
                {loading === plan.type ? "A processar..." : "Começar Agora"}
              </Button>
            </div>
          ))}
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
