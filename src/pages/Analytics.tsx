import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Users, Heart, Eye, TrendingUp, ChefHat, Star, Crown,
  Loader2, ArrowUpRight, Utensils, MessageSquare, Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  starter: "Chef Starter",
  pro: "Chef Pro",
  elite: "Chef Elite",
};

const PLAN_COLORS: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  starter: "bg-accent text-accent-foreground",
  pro: "gradient-warm text-primary-foreground",
  elite: "bg-foreground text-background",
};

const AI_LIMITS: Record<string, number> = { free: 5, starter: 50, pro: 9999, elite: 9999 };

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0, totalRecipes: 0, totalLikes: 0, totalComments: 0,
    followers: 0, following: 0, aiUsage: 0, plan: "free",
    recentFollowers: 0, accountType: "user",
  });
  const [monthlyData, setMonthlyData] = useState<{ month: string; posts: number; likes: number }[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [
        { count: postsCount },
        { count: recipesCount },
        { data: postsData },
        { count: followersCount },
        { count: followingCount },
        { count: commentsCount },
        { data: subData },
        { data: profile },
      ] = await Promise.all([
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("recipes").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("posts").select("likes_count").eq("user_id", user.id),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("subscriptions").select("plan").eq("user_id", user.id).single(),
        supabase.from("profiles").select("account_type").eq("id", user.id).single(),
      ]);

      // AI usage this month
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { data: aiData } = await supabase.from("ai_usage_log")
        .select("usage_count").eq("user_id", user.id).eq("month_year", currentMonth).single();

      // Recent followers (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count: recentFollowersCount } = await supabase.from("followers")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id).gte("created_at", weekAgo);

      const totalLikes = postsData?.reduce((s, p) => s + (p.likes_count || 0), 0) || 0;

      setStats({
        totalPosts: postsCount || 0,
        totalRecipes: recipesCount || 0,
        totalLikes,
        totalComments: commentsCount || 0,
        followers: followersCount || 0,
        following: followingCount || 0,
        aiUsage: aiData?.usage_count || 0,
        plan: (subData as any)?.plan || "free",
        recentFollowers: recentFollowersCount || 0,
        accountType: profile?.account_type || "user",
      });

      // Build simple monthly data (last 6 months)
      const months: { month: string; posts: number; likes: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const label = d.toLocaleDateString("pt-PT", { month: "short" });
        const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString();
        const { count: mp } = await supabase.from("posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id).gte("created_at", start).lte("created_at", end);
        const { data: ml } = await supabase.from("posts")
          .select("likes_count").eq("user_id", user.id).gte("created_at", start).lte("created_at", end);
        const likes = ml?.reduce((s, p) => s + (p.likes_count || 0), 0) || 0;
        months.push({ month: label, posts: mp || 0, likes });
      }
      setMonthlyData(months);
      setLoading(false);
    };
    load();
  }, []);

  const aiLimit = AI_LIMITS[stats.plan] || 5;
  const aiPercent = aiLimit >= 9999 ? 0 : Math.min((stats.aiUsage / aiLimit) * 100, 100);
  const engagementRate = stats.totalPosts > 0
    ? ((stats.totalLikes + stats.totalComments) / stats.totalPosts).toFixed(1)
    : "0";
  const maxBar = Math.max(...monthlyData.map(d => d.likes), 1);

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
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-display text-foreground">Analytics</h1>
            <p className="text-sm text-muted-foreground">Acompanhe o desempenho do seu perfil</p>
          </div>
          <Badge className={`${PLAN_COLORS[stats.plan]} text-xs px-3 py-1`}>
            {stats.accountType === "chef" && <ChefHat className="h-3 w-3 mr-1" />}
            {PLAN_LABELS[stats.plan]}
          </Badge>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Seguidores", value: stats.followers, icon: Users, change: `+${stats.recentFollowers} esta semana`, color: "text-primary" },
            { label: "Total Likes", value: stats.totalLikes, icon: Heart, change: `${stats.totalPosts} publicações`, color: "text-destructive" },
            { label: "Receitas", value: stats.totalRecipes, icon: Utensils, change: stats.accountType === "chef" ? "Conta Chef" : "Conta User", color: "text-secondary" },
            { label: "Engagement", value: `${engagementRate}x`, icon: TrendingUp, change: `${stats.totalComments} comentários`, color: "text-accent-foreground" },
          ].map(kpi => (
            <Card key={kpi.label} className="rounded-2xl border-border shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                  <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold font-display text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.label}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">{kpi.change}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {/* Activity Chart */}
          <Card className="md:col-span-2 rounded-2xl border-border shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Actividade (últimos 6 meses)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-2 h-40">
                {monthlyData.map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col items-center gap-0.5">
                      <div
                        className="w-full rounded-t-lg gradient-warm transition-all"
                        style={{ height: `${Math.max((d.likes / maxBar) * 120, 4)}px` }}
                      />
                      <div
                        className="w-full rounded-t-lg bg-secondary/60"
                        style={{ height: `${Math.max(d.posts * 15, 2)}px` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground capitalize">{d.month}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded gradient-warm inline-block" /> Likes</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-secondary/60 inline-block" /> Posts</span>
              </div>
            </CardContent>
          </Card>

          {/* AI Usage */}
          <Card className="rounded-2xl border-border shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Uso do Chef IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Este mês</span>
                  <span className="font-semibold text-foreground">
                    {stats.aiUsage}/{aiLimit >= 9999 ? "∞" : aiLimit}
                  </span>
                </div>
                <Progress value={aiLimit >= 9999 ? 100 : aiPercent} className="h-2.5" />
              </div>
              <div className="text-xs text-muted-foreground space-y-2">
                <p>Plano actual: <strong className="text-foreground">{PLAN_LABELS[stats.plan]}</strong></p>
                {stats.plan === "free" && (
                  <p className="text-primary">Faça upgrade para mais receitas IA!</p>
                )}
                {(stats.plan === "pro" || stats.plan === "elite") && (
                  <p className="text-secondary">IA ilimitada incluída ✨</p>
                )}
              </div>
              <Link to="/settings">
                <Button variant="outline" size="sm" className="w-full rounded-xl text-xs">
                  Gerir Plano
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Monetization & Audience */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Monetization */}
          <Card className="rounded-2xl border-border shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Crown className="h-4 w-4 text-primary" /> Monetização
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {stats.accountType === "chef" ? (
                <>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-accent/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">Status Chef</p>
                      <p className="text-xs text-muted-foreground">Conta verificada</p>
                    </div>
                    <Badge className="bg-secondary text-secondary-foreground text-xs">Activo</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <p className="text-lg font-bold font-display text-foreground">{stats.totalRecipes}</p>
                      <p className="text-[10px] text-muted-foreground">Receitas publicadas</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted text-center">
                      <p className="text-lg font-bold font-display text-foreground">{stats.followers}</p>
                      <p className="text-[10px] text-muted-foreground">Audiência</p>
                    </div>
                  </div>
                  {(stats.plan === "pro" || stats.plan === "elite") ? (
                    <p className="text-xs text-secondary flex items-center gap-1"><Star className="h-3 w-3" /> Monetização activa no seu plano</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Upgrade para Pro para activar monetização</p>
                  )}
                </>
              ) : (
                <div className="text-center py-4">
                  <ChefHat className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">Torne-se Chef para desbloquear monetização</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Publique receitas, ganhe seguidores e monetize o seu talento</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Audience insights */}
          <Card className="rounded-2xl border-border shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" /> Audiência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {[
                  { label: "Seguidores", value: stats.followers, icon: Users },
                  { label: "Seguindo", value: stats.following, icon: Users },
                  { label: "Comentários recebidos", value: stats.totalComments, icon: MessageSquare },
                  { label: "Novos esta semana", value: stats.recentFollowers, icon: TrendingUp },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-1.5">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <item.icon className="h-3.5 w-3.5" /> {item.label}
                    </span>
                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Taxa de engagement: <strong className="text-foreground">{engagementRate}x</strong> por publicação
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Analytics;
