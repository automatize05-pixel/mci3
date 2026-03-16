import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Send, Loader2, ChefHat, Trash2, UtensilsCrossed, Salad, CookingPot, ShoppingCart, Lock, Plus, MessageSquare, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { Link } from "react-router-dom";

type Msg = { role: "user" | "assistant"; content: string };
type Conversation = { id: string; title: string; messages: Msg[]; created_at: string; updated_at: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chef`;

const PLAN_LABELS: Record<string, string> = { free: "Gratuito", starter: "Starter", pro: "Pro", elite: "Elite" };
const AI_LIMITS: Record<string, number> = { free: 5, starter: 50, pro: 9999, elite: 9999 };

const quickActions = [
  { icon: UtensilsCrossed, label: "Tenho frango, arroz e tomate", prompt: "Tenho frango, arroz, tomate, cebola e alho. Que receita posso fazer?" },
  { icon: Salad, label: "Receita saudável rápida", prompt: "Sugere uma receita saudável e rápida com ingredientes simples angolanos." },
  { icon: CookingPot, label: "Muamba tradicional", prompt: "Ensina-me a fazer uma muamba de galinha tradicional angolana." },
  { icon: ShoppingCart, label: "Menu semanal 5000 Kz", prompt: "Planeia um menu semanal para 4 pessoas com orçamento de 5000 Kz." },
];

async function streamChat({ messages, onDelta, onDone, onError }: {
  messages: Msg[]; onDelta: (text: string) => void; onDone: () => void; onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
    body: JSON.stringify({ messages }),
  });
  if (!resp.ok) { const body = await resp.json().catch(() => ({})); onError(body.error || `Erro ${resp.status}`); return; }
  if (!resp.body) { onError("Sem resposta do servidor"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let done = false;
  while (!done) {
    const { done: readerDone, value } = await reader.read();
    if (readerDone) break;
    buffer += decoder.decode(value, { stream: true });
    let newlineIdx: number;
    while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIdx);
      buffer = buffer.slice(newlineIdx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { buffer = line + "\n" + buffer; break; }
    }
  }
  if (buffer.trim()) {
    for (let raw of buffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }
  onDone();
}

const AIRecipes = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [plan, setPlan] = useState("free");
  const [aiUsage, setAiUsage] = useState(0);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const aiLimit = AI_LIMITS[plan] || 5;
  const isUnlimited = aiLimit >= 9999;
  const isLimitReached = !isUnlimited && aiUsage >= aiLimit;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingPlan(false); return; }
      setUserId(user.id);
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [{ data: subData }, { data: usageData }, { data: convData }] = await Promise.all([
        supabase.from("subscriptions").select("plan").eq("user_id", user.id).single(),
        supabase.from("ai_usage_log").select("usage_count").eq("user_id", user.id).eq("month_year", currentMonth).single(),
        supabase.from("ai_conversations").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(50),
      ]);
      setPlan((subData as any)?.plan || "free");
      setAiUsage(usageData?.usage_count || 0);
      setConversations((convData as any[]) || []);
      setLoadingPlan(false);
    };
    init();
  }, []);

  const saveConversation = async (msgs: Msg[], convId: string | null) => {
    if (!userId || msgs.length === 0) return convId;
    const title = msgs[0]?.content?.slice(0, 60) || "Nova conversa";
    
    if (convId) {
      await supabase.from("ai_conversations")
        .update({ messages: msgs as any, title, updated_at: new Date().toISOString() })
        .eq("id", convId);
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: msgs, title, updated_at: new Date().toISOString() } : c));
      return convId;
    } else {
      const { data } = await supabase.from("ai_conversations")
        .insert({ user_id: userId, title, messages: msgs as any })
        .select("id, title, messages, created_at, updated_at")
        .single();
      if (data) {
        const newConv = data as any as Conversation;
        setConversations(prev => [newConv, ...prev]);
        setActiveConvId(newConv.id);
        return newConv.id;
      }
      return null;
    }
  };

  const incrementUsage = async () => {
    if (!userId) return;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const { data: existing } = await supabase.from("ai_usage_log")
      .select("id, usage_count").eq("user_id", userId).eq("month_year", currentMonth).single();
    if (existing) {
      await supabase.from("ai_usage_log").update({ usage_count: existing.usage_count + 1 }).eq("id", existing.id);
      setAiUsage(existing.usage_count + 1);
    } else {
      await supabase.from("ai_usage_log").insert({ user_id: userId, month_year: currentMonth, usage_count: 1 });
      setAiUsage(1);
    }
  };

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    if (isLimitReached) {
      toast({ title: "Limite atingido", description: `Atingiu o limite de ${aiLimit} pedidos este mês.`, variant: "destructive" });
      return;
    }
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    let currentConvId = activeConvId;

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    await streamChat({
      messages: newMessages,
      onDelta: upsertAssistant,
      onDone: async () => {
        setIsLoading(false);
        const finalMsgs = [...newMessages, { role: "assistant" as const, content: assistantSoFar }];
        setMessages(finalMsgs);
        currentConvId = await saveConversation(finalMsgs, currentConvId);
        if (currentConvId) setActiveConvId(currentConvId);
        await incrementUsage();
      },
      onError: (msg) => {
        setIsLoading(false);
        toast({ title: "Erro", description: msg, variant: "destructive" });
      },
    });
  };

  const loadConversation = (conv: Conversation) => {
    setMessages(conv.messages);
    setActiveConvId(conv.id);
    setShowHistory(false);
  };

  const newConversation = () => {
    setMessages([]);
    setActiveConvId(null);
    setShowHistory(false);
  };

  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("ai_conversations").delete().eq("id", convId);
    setConversations(prev => prev.filter(c => c.id !== convId));
    if (activeConvId === convId) { setMessages([]); setActiveConvId(null); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 h-[calc(100vh-3.5rem)] md:h-screen flex flex-col max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-display text-foreground">Chef IA</h1>
              <p className="text-xs text-muted-foreground">Plano {PLAN_LABELS[plan]}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!loadingPlan && (
              <div className="text-right">
                <p className="text-xs font-semibold text-foreground">
                  {aiUsage}/{isUnlimited ? "∞" : aiLimit}
                </p>
                {!isUnlimited && (
                  <Progress value={(aiUsage / aiLimit) * 100} className="h-1.5 w-16 mt-0.5" />
                )}
              </div>
            )}
            <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1 text-muted-foreground" onClick={() => setShowHistory(!showHistory)}>
              <Clock className="h-3 w-3" /> Histórico
            </Button>
            <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1 text-muted-foreground" onClick={newConversation}>
              <Plus className="h-3 w-3" /> Nova
            </Button>
          </div>
        </div>

        {/* Limit banner */}
        {isLimitReached && (
          <div className="shrink-0 mb-3 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium text-foreground">Limite de IA atingido</p>
                <p className="text-xs text-muted-foreground">Usou {aiUsage}/{aiLimit} pedidos este mês</p>
              </div>
            </div>
            <Link to="/settings">
              <Button variant="hero" size="sm" className="rounded-xl text-xs">Upgrade</Button>
            </Link>
          </div>
        )}

        {/* History sidebar overlay */}
        {showHistory && (
          <div className="shrink-0 mb-4 bg-card rounded-2xl border border-border shadow-card overflow-hidden max-h-64">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Conversas anteriores</h3>
              <span className="text-xs text-muted-foreground">{conversations.length} conversas</span>
            </div>
            <ScrollArea className="max-h-48">
              {conversations.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Sem conversas guardadas</p>
              ) : (
                <div className="p-2 space-y-1">
                  {conversations.map(conv => (
                    <button key={conv.id} onClick={() => loadConversation(conv)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-colors group ${activeConvId === conv.id ? "bg-primary/10" : "hover:bg-muted"}`}>
                      <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground truncate">{conv.title}</p>
                        <p className="text-[10px] text-muted-foreground">{timeAgo(conv.updated_at)} · {(conv.messages?.length || 0)} msgs</p>
                      </div>
                      <button onClick={(e) => deleteConversation(conv.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-destructive/10 transition-all">
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </button>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto rounded-2xl bg-card border border-border shadow-card mb-4 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <div className="w-16 h-16 rounded-2xl gradient-warm flex items-center justify-center mb-4">
                <ChefHat className="h-8 w-8 text-primary-foreground" />
              </div>
              <h2 className="font-display font-bold text-foreground text-lg mb-2">Olá! Sou o Chef IA 👨‍🍳</h2>
              <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
                Diga-me os ingredientes que tem, peça uma receita ou pergunte qualquer coisa sobre culinária angolana!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {quickActions.map(action => (
                  <button key={action.label} onClick={() => send(action.prompt)}
                    disabled={isLimitReached}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-left group disabled:opacity-50">
                    <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                      <action.icon className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <span className="text-sm text-foreground">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center shrink-0 mr-2 mt-1">
                      <ChefHat className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                    msg.role === "user" ? "gradient-warm text-primary-foreground rounded-br-md" : "bg-muted text-foreground rounded-bl-md"
                  }`}>
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : <p>{msg.content}</p>}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-lg gradient-warm flex items-center justify-center shrink-0 mr-2">
                    <ChefHat className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="shrink-0 bg-card rounded-2xl border border-border shadow-card p-3">
          <form onSubmit={e => { e.preventDefault(); send(input); }} className="flex items-end gap-2">
            <textarea ref={inputRef} placeholder={isLimitReached ? "Limite atingido — faça upgrade do plano" : "Escreva uma mensagem ao Chef IA..."}
              value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              disabled={isLoading || isLimitReached} rows={1}
              className="flex-1 resize-none text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground text-foreground min-h-[36px] max-h-[120px] py-2"
              style={{ height: "auto", overflowY: input.split("\n").length > 3 ? "auto" : "hidden" }} />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim() || isLimitReached}
              className="rounded-xl gradient-warm text-primary-foreground shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIRecipes;
