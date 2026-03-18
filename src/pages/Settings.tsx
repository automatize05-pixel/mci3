import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Camera, Loader2, Save, User, Shield, CreditCard, Bell, ChefHat, Check, Lock, Sparkles, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

type SettingsTab = "perfil" | "seguranca" | "assinaturas" | "notificacoes";

const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "perfil", label: "Perfil", icon: User },
  { id: "seguranca", label: "Segurança", icon: Shield },
  { id: "assinaturas", label: "Assinaturas", icon: CreditCard },
  { id: "notificacoes", label: "Notificações", icon: Bell },
];

const plans = [
  { id: "free" as const, name: "Gratuito", price: "0", period: "para sempre", aiLimit: 5, features: ["5 receitas IA/mês", "Feed social", "Perfil básico"], current: false },
  { id: "starter" as const, name: "Chef Starter", price: "3.500", period: "Kz/mês", aiLimit: 50, features: ["50 receitas IA/mês", "Planeamento semanal", "Badge Starter"], current: false },
  { id: "pro" as const, name: "Chef Pro", price: "7.000", period: "Kz/mês", aiLimit: 9999, features: ["IA ilimitada", "Analytics", "Badge Pro", "Monetização"], current: false, popular: true },
  { id: "elite" as const, name: "Chef Elite", price: "15.000", period: "Kz/mês", aiLimit: 9999, features: ["Tudo do Pro", "Consultoria IA", "Destaque", "API access"], current: false },
];

const Settings = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SettingsTab>("perfil");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [aiUsage, setAiUsage] = useState(0);
  const [changingPlan, setChangingPlan] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    name: "", username: "", email: "", bio: "", profile_picture: "", account_type: "user",
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState({ email: true, push: true, likes: true, comments: true, follows: true });

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const currentMonth = new Date().toISOString().slice(0, 7);
      const [{ data: p }, { data: r }, { data: sub }, { data: usage }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
        supabase.from("subscriptions").select("plan").eq("user_id", user.id).single(),
        supabase.from("ai_usage_log").select("usage_count").eq("user_id", user.id).eq("month_year", currentMonth).single(),
      ]);
      if (p) {
        setProfile({
          name: p.name || "", username: p.username || "", email: p.email || "",
          bio: p.bio || "", profile_picture: p.profile_picture || "",
          account_type: p.account_type || "user",
        });
      }
      setIsAdmin(r?.role === "admin");
      setCurrentPlan((sub as any)?.plan || "free");
      setAiUsage(usage?.usage_count || 0);
      setLoading(false);
    };
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("profiles")
      .update({ name: profile.name.trim(), username: profile.username.trim(), bio: profile.bio.trim() })
      .eq("id", user.id);
    if (error) toast({ title: "Erro ao guardar", description: error.message, variant: "destructive" });
    else toast({ title: "Perfil actualizado!" });
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Ficheiro muito grande", description: "Máximo 2MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ profile_picture: publicUrl }).eq("id", user.id);
    setProfile(prev => ({ ...prev, profile_picture: publicUrl }));
    toast({ title: "Foto actualizada!" });
    setUploading(false);
  };

  const handleChangePlan = async (planId: string) => {
    console.log("handleChangePlan called with:", planId, "Current plan:", currentPlan);
    if (planId === currentPlan) {
      console.log("Plane is same as current, returning.");
      return;
    }
    
    if (planId !== "free") {
      console.log("Redirecting to checkout for plan:", planId);
      navigate(`/checkout?plan=${planId}`);
      return;
    }

    setChangingPlan(planId);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if subscription exists
    const { data: existing } = await supabase.from("subscriptions").select("id").eq("user_id", user.id).single();
    if (existing) {
      await supabase.from("subscriptions").update({ plan: planId as any, started_at: new Date().toISOString() }).eq("user_id", user.id);
    } else {
      await supabase.from("subscriptions").insert({ user_id: user.id, plan: planId as any });
    }
    setCurrentPlan(planId);
    setChangingPlan(null);
    toast({ title: "Plano actualizado!", description: `Agora está no plano ${plans.find(p => p.id === planId)?.name}` });
  };

  const aiLimit = plans.find(p => p.id === currentPlan)?.aiLimit || 5;
  const isUnlimited = aiLimit >= 9999;

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
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold font-display text-foreground">Definições</h1>
          <div className="flex gap-2">
            {userId && (
              <Link to={`/user/${userId}`}>
                <Button variant="outline" size="sm" className="rounded-xl text-xs">Ver Público</Button>
              </Link>
            )}
            <Link to="/analytics">
              <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1">
                <BarChart3 className="h-3 w-3" /> Analytics
              </Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="rounded-xl text-xs">
                  <Shield className="h-3 w-3 mr-1" /> Admin
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar tabs */}
          <div className="md:w-56 shrink-0">
            <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}>
                  <tab.icon className="h-4 w-4" /> {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 max-w-2xl">
            {activeTab === "perfil" && (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-6">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <UserAvatar src={profile.profile_picture} name={profile.name} username={profile.username}
                      isChef={profile.account_type === "chef"} size="xl" linked={false} />
                    <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors ring-2 ring-background">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                      <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
                    </label>
                  </div>
                  {profile.account_type === "chef" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-chef/10 text-chef text-xs font-semibold mt-2">
                      <ChefHat className="h-3 w-3" /> Conta Chef
                    </span>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="space-y-2"><Label htmlFor="name">Nome</Label>
                    <Input id="name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} maxLength={100} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label htmlFor="username">Username</Label>
                    <Input id="username" value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} maxLength={30} className="rounded-xl" /></div>
                  <div className="space-y-2"><Label htmlFor="email">Email</Label>
                    <Input id="email" value={profile.email} disabled className="opacity-60 rounded-xl" /></div>
                  <div className="space-y-2"><Label htmlFor="bio">Bio</Label>
                    <Textarea id="bio" placeholder="Conte um pouco sobre si..." value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} maxLength={300} className="rounded-xl" /></div>
                </div>
                <Button onClick={handleSave} variant="hero" size="lg" className="w-full rounded-xl" disabled={saving}>
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> A guardar...</> : <><Save className="h-4 w-4" /> Guardar Alterações</>}
                </Button>
              </div>
            )}

            {activeTab === "seguranca" && (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-6">
                <h2 className="font-display font-semibold text-foreground text-lg">Segurança</h2>
                <div className="space-y-4">
                  <div className="space-y-2"><Label>Palavra-passe actual</Label><Input type="password" placeholder="••••••••" className="rounded-xl" /></div>
                  <div className="space-y-2"><Label>Nova palavra-passe</Label><Input type="password" placeholder="••••••••" className="rounded-xl" /></div>
                  <div className="space-y-2"><Label>Confirmar nova palavra-passe</Label><Input type="password" placeholder="••••••••" className="rounded-xl" /></div>
                </div>
                <Button variant="hero" className="rounded-xl gap-2"><Lock className="h-4 w-4" /> Alterar Palavra-passe</Button>
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground text-sm">Autenticação de dois factores</p>
                      <p className="text-xs text-muted-foreground">Adicione uma camada extra de segurança</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "assinaturas" && (
              <div className="space-y-4">
                {/* AI Usage bar */}
                <div className="bg-card rounded-2xl border border-border p-5 shadow-card">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="font-display font-semibold text-foreground text-sm">Uso do Chef IA este mês</h3>
                  </div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">Pedidos utilizados</span>
                    <span className="font-semibold text-foreground">{aiUsage}/{isUnlimited ? "∞" : aiLimit}</span>
                  </div>
                  <Progress value={isUnlimited ? 100 : Math.min((aiUsage / aiLimit) * 100, 100)} className="h-2.5" />
                </div>

                <h2 className="font-display font-semibold text-foreground text-lg">Escolha o seu plano</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {plans.map(plan => {
                    const isCurrent = plan.id === currentPlan;
                    return (
                      <div key={plan.name}
                        className={`bg-card rounded-2xl p-5 border shadow-card ${
                          isCurrent ? "border-primary ring-1 ring-primary/20" : plan.popular ? "border-primary/50" : "border-border"
                        }`}>
                        {isCurrent && (
                          <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">Plano Actual</span>
                        )}
                        {plan.popular && !isCurrent && (
                          <span className="inline-block px-2 py-0.5 rounded-full gradient-warm text-primary-foreground text-xs font-semibold mb-2">Popular</span>
                        )}
                        <h3 className="font-display font-bold text-foreground">{plan.name}</h3>
                        <div className="mt-1 mb-3">
                          <span className="text-2xl font-extrabold font-display text-foreground">{plan.price}</span>
                          <span className="text-xs text-muted-foreground ml-1">{plan.period}</span>
                        </div>
                        <ul className="space-y-1.5 mb-4">
                          {plan.features.map(f => (
                            <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Check className="h-3 w-3 text-secondary shrink-0" /> {f}
                            </li>
                          ))}
                        </ul>
                        <Button variant={isCurrent ? "outline" : "hero"} size="sm" className="w-full rounded-xl"
                          disabled={isCurrent || changingPlan !== null}
                          onClick={() => handleChangePlan(plan.id)}>
                          {changingPlan === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : isCurrent ? "Actual" : "Escolher"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "notificacoes" && (
              <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-5">
                <h2 className="font-display font-semibold text-foreground text-lg">Preferências de Notificações</h2>
                {[
                  { key: "email" as const, label: "Notificações por email", desc: "Receba updates por email" },
                  { key: "push" as const, label: "Notificações push", desc: "Notificações no navegador" },
                  { key: "likes" as const, label: "Likes", desc: "Quando alguém gostar das suas publicações" },
                  { key: "comments" as const, label: "Comentários", desc: "Quando alguém comentar" },
                  { key: "follows" as const, label: "Novos seguidores", desc: "Quando alguém começar a seguir" },
                ].map(item => (
                  <div key={item.key} className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={notifPrefs[item.key]} onCheckedChange={v => setNotifPrefs(p => ({ ...p, [item.key]: v }))} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Settings;
