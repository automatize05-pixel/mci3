import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import logoMci from "@/assets/logo-mci.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_status")
        .eq("id", data.user.id)
        .single();

      if (profile?.account_status === "pending") {
        await supabase.auth.signOut();
        toast({ title: "Conta pendente", description: "A sua conta está a aguardar aprovação.", variant: "destructive" });
        return;
      }

      if (profile?.account_status === "suspended") {
        await supabase.auth.signOut();
        toast({ title: "Conta suspensa", description: "Contacte o administrador.", variant: "destructive" });
        return;
      }

      navigate("/feed");
    } catch (error: any) {
      toast({ title: "Erro ao entrar", description: error.message || "Verifique as suas credenciais.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src={logoMci} alt="MCI" className="h-10" />
          </Link>
          <h1 className="text-2xl font-bold font-display text-foreground">Bem-vindo de volta</h1>
          <p className="text-muted-foreground mt-1">Entre na sua conta para continuar</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Palavra-passe</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="rounded-xl" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" variant="hero" className="w-full rounded-xl" size="lg" disabled={loading}>
            {loading ? "A entrar..." : "Entrar"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Não tem conta?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">Criar conta</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
