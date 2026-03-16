import { useState, useRef, useEffect } from "react";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Loader2, ChefHat, Trash2, UtensilsCrossed, Salad, CookingPot, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chef`;

const quickActions = [
  { icon: UtensilsCrossed, label: "Tenho frango, arroz e tomate", prompt: "Tenho frango, arroz, tomate, cebola e alho. Que receita posso fazer?" },
  { icon: Salad, label: "Receita saudável rápida", prompt: "Sugere uma receita saudável e rápida com ingredientes simples angolanos." },
  { icon: CookingPot, label: "Muamba tradicional", prompt: "Ensina-me a fazer uma muamba de galinha tradicional angolana." },
  { icon: ShoppingCart, label: "Menu semanal 5000 Kz", prompt: "Planeia um menu semanal para 4 pessoas com orçamento de 5000 Kz." },
];

async function streamChat({
  messages,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    onError(body.error || `Erro ${resp.status}`);
    return;
  }

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
      } catch {
        buffer = line + "\n" + buffer;
        break;
      }
    }
  }

  // Flush remaining
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
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
      onDone: () => setIsLoading(false),
      onError: (msg) => {
        setIsLoading(false);
        toast({ title: "Erro", description: msg, variant: "destructive" });
      },
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  const clearChat = () => {
    setMessages([]);
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
              <p className="text-xs text-muted-foreground">O seu assistente de cozinha inteligente</p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1 text-muted-foreground" onClick={clearChat}>
              <Trash2 className="h-3 w-3" /> Limpar
            </Button>
          )}
        </div>

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
                  <button
                    key={action.label}
                    onClick={() => send(action.prompt)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:bg-muted transition-colors text-left group"
                  >
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
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "gradient-warm text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground/90 prose-li:text-foreground/90 prose-strong:text-foreground">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p>{msg.content}</p>
                    )}
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
          <form
            onSubmit={e => { e.preventDefault(); send(input); }}
            className="flex items-end gap-2"
          >
            <textarea
              ref={inputRef}
              placeholder="Escreva uma mensagem ao Chef IA..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
              className="flex-1 resize-none text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground text-foreground min-h-[36px] max-h-[120px] py-2"
              style={{ height: "auto", overflowY: input.split("\n").length > 3 ? "auto" : "hidden" }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="rounded-xl gradient-warm text-primary-foreground shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </AppLayout>
  );
};

export default AIRecipes;
