import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Bell, Heart, MessageSquare, UserPlus, Trophy, CheckCheck, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type NotifFilter = "todas" | "atividade" | "sistema";

const iconMap: Record<string, React.ElementType> = {
  like: Heart,
  comment: MessageSquare,
  follow: UserPlus,
  challenge: Trophy,
};

const colorMap: Record<string, string> = {
  like: "text-primary bg-primary/10",
  comment: "text-secondary bg-secondary/10",
  follow: "text-chef bg-chef/10",
  challenge: "text-accent-foreground bg-accent",
};

const Notifications = () => {
  const { toast } = useToast();
  const [filter, setFilter] = useState<NotifFilter>("todas");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekStats, setWeekStats] = useState({ followers: 0, likes: 0, comments: 0 });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      setNotifications(data || []);

      // Week stats
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const [{ count: fCount }, { count: lCount }, { count: cCount }] = await Promise.all([
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", user.id).gte("created_at", weekAgo),
        supabase.from("likes").select("*", { count: "exact", head: true })
          .in("post_id", (await supabase.from("posts").select("id").eq("user_id", user.id)).data?.map(p => p.id) || [])
          .gte("created_at", weekAgo),
        supabase.from("comments").select("*", { count: "exact", head: true })
          .in("post_id", (await supabase.from("posts").select("id").eq("user_id", user.id)).data?.map(p => p.id) || [])
          .gte("created_at", weekAgo),
      ]);

      setWeekStats({ followers: fCount || 0, likes: lCount || 0, comments: cCount || 0 });
      setLoading(false);
    };
    load();
  }, []);

  const markAllRead = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("notifications").update({ read_status: true }).eq("user_id", user.id).eq("read_status", false);
    setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
    toast({ title: "Todas marcadas como lidas" });
  };

  const filtered = notifications.filter(n => {
    if (filter === "todas") return true;
    if (filter === "atividade") return ["like", "comment", "follow"].includes(n.type);
    return ["system", "challenge", "reward"].includes(n.type);
  });

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
            <Bell className="h-5 w-5" /> Notificações
          </h1>
          <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1" onClick={markAllRead}>
            <CheckCheck className="h-3 w-3" /> Marcar todas como lidas
          </Button>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Notifications list */}
          <div className="flex-1 space-y-2">
            {/* Filters */}
            <div className="flex gap-2 mb-4">
              {(["todas", "atividade", "sistema"] as NotifFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                    filter === f ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhuma notificação</p>
              </div>
            ) : (
              filtered.map(n => {
                const Icon = iconMap[n.type] || Bell;
                const colors = colorMap[n.type] || "text-muted-foreground bg-muted";
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                      n.read_status ? "bg-card border-border" : "bg-accent/30 border-primary/20"
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colors}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{n.content}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read_status && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Week summary sidebar */}
          <div className="md:w-64 shrink-0 space-y-4">
            <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
              <h3 className="font-display font-semibold text-foreground text-sm mb-4">Resumo da Semana</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    <UserPlus className="h-3 w-3" /> Novos seguidores
                  </span>
                  <span className="text-sm font-bold text-foreground">{weekStats.followers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    <Heart className="h-3 w-3" /> Likes recebidos
                  </span>
                  <span className="text-sm font-bold text-foreground">{weekStats.likes}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground flex items-center gap-2">
                    <MessageSquare className="h-3 w-3" /> Comentários
                  </span>
                  <span className="text-sm font-bold text-foreground">{weekStats.comments}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Notifications;
