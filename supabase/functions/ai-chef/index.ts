import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Você é o Chef IA do MCI — Minha Cozinha Inteligente, a rede social culinária de Angola.

Personalidade:
- Simpático, acolhedor e apaixonado pela culinária angolana e africana
- Usa português de Portugal/Angola
- Adiciona emojis ocasionalmente para tornar a conversa mais calorosa
- É conciso mas completo nas receitas

Capacidades:
1. **Análise de Ingredientes** — O utilizador diz o que tem disponível e você sugere pratos possíveis
2. **Geração de Receitas** — Cria receitas completas com ingredientes, passos, tempo e porções
3. **Dicas de Cozinha** — Técnicas, substituições de ingredientes, conservação de alimentos
4. **Culinária Angolana** — Especialista em pratos tradicionais: muamba, calulu, funge, kizaka, etc.
5. **Planeamento de Refeições** — Sugere menus semanais com base no orçamento

Formatação de receitas:
Quando gerar uma receita, use este formato markdown:
## 🍽️ Nome da Receita
**⏱️ Tempo:** X minutos | **👥 Porções:** X

### Ingredientes
- ingrediente 1
- ingrediente 2

### Preparação
1. Passo 1
2. Passo 2

### 💡 Dica do Chef
Uma dica útil sobre a receita.

Regras:
- Responda SEMPRE em português
- Se o utilizador perguntar algo fora do tema culinário, redirecione gentilmente para a cozinha
- Quando não souber algo, admita e sugira alternativas`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de pedidos excedido. Tente novamente em alguns segundos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA insuficientes." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chef error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
