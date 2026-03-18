import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, FileText, BookOpen, MessageSquare, CheckCircle, XCircle, Ban, Trash2, Loader2, CreditCard } from "lucide-react";

type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  email: string | null;
  account_status: "pending" | "approved" | "suspended";
  created_at: string;
};

type Post = {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
  profiles: { name: string | null; username: string | null } | null;
};

type Recipe = {
  id: string;
  title: string;
  created_at: string;
  user_id: string;
  profiles: { name: string | null; username: string | null } | null;
};

const Admin = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, posts: 0, recipes: 0, subRequests: 0 });

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, postsRes, recipesRes, subRequestsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("posts").select("*, profiles(name, username)").order("created_at", { ascending: false }).limit(50),
      supabase.from("recipes").select("*, profiles(name, username)").order("created_at", { ascending: false }).limit(50),
      (supabase as any).from("subscription_requests").select("*, profiles(name, username, email)").order("created_at", { ascending: false }),
    ]);

    const u = (usersRes.data || []) as Profile[];
    setUsers(u);
    setPosts((postsRes.data || []) as any);
    setRecipes((recipesRes.data || []) as any);
    setSubscriptionRequests(subRequestsRes.data || []);
    setStats({
      total: u.length,
      approved: u.filter((x) => x.account_status === "approved").length,
      pending: u.filter((x) => x.account_status === "pending").length,
      posts: postsRes.data?.length || 0,
      recipes: recipesRes.data?.length || 0,
      subRequests: (subRequestsRes.data || []).filter((r: any) => r.status === 'pending').length,
    });
    setLoading(false);
  };

  const [dbStatus, setDbStatus] = useState<Record<string, { exists: boolean; error?: string }>>({});

  const checkDatabase = async () => {
    const tables = ['communities', 'community_members', 'subscription_requests'];
    const status: Record<string, { exists: boolean; error?: string }> = {};
    
    for (const table of tables) {
      const { error } = await (supabase as any).from(table).select('count', { count: 'exact', head: true });
      status[table] = { exists: !error, error: error?.message };
    }
    
    // Check for column on posts
    const { error: colError } = await (supabase as any).from('posts').select('community_id').limit(1);
    status['posts.community_id'] = { exists: !colError, error: colError?.message };
    
    setDbStatus(status);
  };

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const [profilesRes, postsRes, recipesRes, requestsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("posts").select("*, profiles(name, username, profile_picture)").order("created_at", { ascending: false }),
        supabase.from("recipes").select("*, profiles(name, username, profile_picture)").order("created_at", { ascending: false }),
        (supabase as any).from("subscription_requests").select("*, profiles(name, username, email)").order("created_at", { ascending: false }),
      ]);

      if (profilesRes.data) setProfiles(profilesRes.data);
      if (postsRes.data) setPosts(postsRes.data as any);
      if (recipesRes.data) setRecipes(recipesRes.data as any);
      
      if (requestsRes.error) {
        console.error("Subscription requests error:", requestsRes.error);
        setFetchError(requestsRes.error.message);
      }
      if (requestsRes.data) setSubscriptionRequests(requestsRes.data);
    } catch (err: any) {
      console.error("fetchData error:", err);
      setFetchError(err.message);
    }
    setLoading(false);
  };

  const deletePost = async (postId: string) => {
    setActionLoading(postId);
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Post eliminado" }); fetchData(); }
    setActionLoading(null);
  };

  const deleteRecipe = async (recipeId: string) => {
    setActionLoading(recipeId);
    const { error } = await supabase.from("recipes").delete().eq("id", recipeId);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else { toast({ title: "Receita eliminada" }); fetchData(); }
    setActionLoading(null);
  };

  const handleSubscriptionRequest = async (requestId: string, userId: string, planId: string, status: 'approved' | 'rejected') => {
    setActionLoading(requestId);
    
    // 1. Update request status
    const { error: reqError } = await (supabase as any)
      .from("subscription_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", requestId);

    if (reqError) {
      toast({ title: "Erro", description: reqError.message, variant: "destructive" });
    } else if (status === 'approved') {
      // 2. Update actual subscription
      const { data: existing } = await supabase.from("subscriptions").select("id").eq("user_id", userId).single();
      
      let subError;
      if (existing) {
        const { error } = await supabase.from("subscriptions").update({ 
          plan: planId as any, 
          started_at: new Date().toISOString() 
        }).eq("user_id", userId);
        subError = error;
      } else {
        const { error } = await supabase.from("subscriptions").insert({ 
          user_id: userId, 
          plan: planId as any 
        });
        subError = error;
      }

      if (subError) {
        toast({ title: "Erro na subscrição", description: subError.message, variant: "destructive" });
      } else {
        toast({ title: "Sucesso", description: `Plano ${planId.toUpperCase()} activado para o utilizador.` });
        fetchData();
      }
    } else {
      toast({ title: "Sucesso", description: "Pedido de subscrição rejeitado." });
      fetchData();
    }
    setActionLoading(null);
  };

  const statusBadge = (s: string) => {
    if (s === "approved") return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Aprovado</Badge>;
    if (s === "pending") return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendente</Badge>;
    return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Suspenso</Badge>;
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
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-bold font-display text-foreground">Painel de Administração</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total Utilizadores", value: stats.total, icon: Users },
            { label: "Aprovados", value: stats.approved, icon: CheckCircle },
            { label: "Pendentes", value: stats.pending, icon: XCircle },
            { label: "Posts", value: stats.posts, icon: FileText },
            { label: "Receitas", value: stats.recipes, icon: BookOpen },
            { label: "Aprovações Plano", value: stats.subRequests, icon: CreditCard },
          ].map((s) => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <s.icon className="h-4 w-4" />
                {s.label}
              </div>
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Database Status Diagnostics */}
        <div className="bg-card rounded-xl border border-border p-5 mb-8 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> Diagnóstico da Base de Dados
            </h3>
            <Button variant="outline" size="sm" onClick={checkDatabase} className="rounded-lg h-8 text-xs">Atualizar</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(dbStatus).map(([item, status]) => (
              <div key={item} className={`flex items-center justify-between p-3 rounded-xl border ${status.exists ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{item}</p>
                  <p className={`text-xs font-semibold truncate ${status.exists ? 'text-green-600' : 'text-red-600'}`}>
                    {status.exists ? 'EXISTE' : 'FALTA'}
                  </p>
                </div>
                {status.exists ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : <XCircle className="h-4 w-4 text-red-500 shrink-0" />}
              </div>
            ))}
          </div>
          {!Object.values(dbStatus).every(s => s.exists) && (
            <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
              <p className="text-xs text-yellow-700 leading-relaxed">
                <strong>Atenção:</strong> Foram detetados elementos em falta na base de dados. Isto impedirá o funcionamento correto das Comunidades e do Checkout. Por favor, contacte o suporte técnico para aplicar as migrações SQL necessárias.
              </p>
            </div>
          )}
        </div>

        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Utilizadores</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="recipes">Receitas</TabsTrigger>
            <TabsTrigger value="subscriptions" className="relative">
              Subscrições
              {stats.subRequests > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground animate-pulse font-bold">
                  {stats.subRequests}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{u.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">@{u.username || "—"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                      <TableCell>{statusBadge(u.account_status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("pt-PT")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {u.account_status !== "approved" && (
                            <Button size="sm" variant="ghost" onClick={() => updateUserStatus(u.id, "approved")} disabled={actionLoading === u.id}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                          )}
                          {u.account_status !== "suspended" && (
                            <Button size="sm" variant="ghost" onClick={() => updateUserStatus(u.id, "suspended")} disabled={actionLoading === u.id}>
                              <Ban className="h-4 w-4 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="posts">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium text-foreground">{p.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(p.profiles as any)?.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString("pt-PT")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => deletePost(p.id)} disabled={actionLoading === p.id}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {posts.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhum post encontrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="recipes">
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipes.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium text-foreground">{r.title}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(r.profiles as any)?.name || "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("pt-PT")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => deleteRecipe(r.id)} disabled={actionLoading === r.id}>
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recipes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma receita encontrada.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            {fetchError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6">
                <p className="text-red-500 text-sm font-bold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" /> ATENÇÃO: Erro na Tabela de Subscrições
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Não foi possível carregar os pedidos: "{fetchError}". Verifique se a tabela "subscription_requests" foi criada.
                </p>
              </div>
            )}
            <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilizador</TableHead>
                    <TableHead>Plano Pedido</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptionRequests.map((req) => (
                    <TableRow key={req.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{req.profiles?.name || "—"}</p>
                          <p className="text-xs text-muted-foreground">{req.profiles?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase font-bold text-[10px] tracking-widest border-primary/30 text-primary bg-primary/5">
                          {req.plan_id}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(req.created_at).toLocaleDateString("pt-PT")}
                      </TableCell>
                      <TableCell>
                        {req.status === 'pending' ? (
                          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pendente</Badge>
                        ) : req.status === 'approved' ? (
                          <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">Aprovado</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">Rejeitado</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === 'pending' && (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="hover:bg-green-50" 
                              onClick={() => handleSubscriptionRequest(req.id, req.user_id, req.plan_id, 'approved')} 
                              disabled={actionLoading === req.id}>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button size="sm" variant="ghost" className="hover:bg-red-50" 
                              onClick={() => handleSubscriptionRequest(req.id, req.user_id, req.plan_id, 'rejected')} 
                              disabled={actionLoading === req.id}>
                              <XCircle className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {subscriptionRequests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum pedido de subscrição.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Admin;
