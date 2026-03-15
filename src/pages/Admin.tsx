import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Users, FileText, BookOpen, MessageSquare, CheckCircle, XCircle, Ban, Trash2, Loader2 } from "lucide-react";

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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0, posts: 0, recipes: 0 });

  const fetchData = async () => {
    setLoading(true);
    const [usersRes, postsRes, recipesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("posts").select("*, profiles(name, username)").order("created_at", { ascending: false }).limit(50),
      supabase.from("recipes").select("*, profiles(name, username)").order("created_at", { ascending: false }).limit(50),
    ]);

    const u = (usersRes.data || []) as Profile[];
    setUsers(u);
    setPosts((postsRes.data || []) as any);
    setRecipes((recipesRes.data || []) as any);
    setStats({
      total: u.length,
      approved: u.filter((x) => x.account_status === "approved").length,
      pending: u.filter((x) => x.account_status === "pending").length,
      posts: postsRes.data?.length || 0,
      recipes: recipesRes.data?.length || 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateUserStatus = async (userId: string, status: "approved" | "suspended" | "pending") => {
    setActionLoading(userId);
    const { error } = await supabase.from("profiles").update({ account_status: status }).eq("id", userId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: `Utilizador ${status === "approved" ? "aprovado" : status === "suspended" ? "suspenso" : "pendente"}.` });
      fetchData();
    }
    setActionLoading(null);
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

        <Tabs defaultValue="users">
          <TabsList className="mb-4">
            <TabsTrigger value="users">Utilizadores</TabsTrigger>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="recipes">Receitas</TabsTrigger>
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
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Admin;
