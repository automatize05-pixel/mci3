import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, ChefHat, User } from "lucide-react";
import logoMci from "@/assets/logo-mci.png";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<"user" | "chef">("user");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            name: name.trim(),
            username: username.trim().toLowerCase(),
            account_type: accountType,
          },
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      if (accountType === "chef") {
        toast({
          title: "Conta de Chef em processo",
          description: "Por favor, escolha um plano e aguarde aprovação da gerência.",
        });
        navigate("/checkout");
      } else {
        toast({
          title: "Conta criada com sucesso!",
          description: "Verifique o seu email e faça login para entrar na comunidade.",
        });
        navigate("/login");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
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
          <h1 className="text-2xl font-bold font-display text-foreground">Criar conta</h1>
          <p className="text-muted-foreground mt-1">Junte-se à comunidade culinária angolana</p>
        </div>

        <form onSubmit={handleRegister} className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4">
          {/* Account Type Selector */}
          <div className="space-y-2">
            <Label>Tipo de conta</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAccountType("user")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  accountType === "user"
                    ? "border-primary bg-primary/5 shadow-warm"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  accountType === "user" ? "gradient-warm" : "bg-muted"
                }`}>
                  <User className={`h-6 w-6 ${accountType === "user" ? "text-primary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div className="text-center">
                  <p className="font-display font-semibold text-sm text-foreground">Utilizador</p>
                  <p className="text-[11px] text-muted-foreground">Explore e partilhe</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setAccountType("chef")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                  accountType === "chef"
                    ? "border-secondary bg-secondary/5"
                    : "border-border hover:border-secondary/30"
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  accountType === "chef" ? "gradient-fresh" : "bg-muted"
                }`}>
                  <ChefHat className={`h-6 w-6 ${accountType === "chef" ? "text-secondary-foreground" : "text-muted-foreground"}`} />
                </div>
                <div className="text-center">
                  <p className="font-display font-semibold text-sm text-foreground">Chef</p>
                  <p className="text-[11px] text-muted-foreground">Publique receitas</p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nome completo</Label>
            <Input id="name" placeholder="O seu nome" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Nome de utilizador</Label>
            <Input id="username" placeholder="chef_angolano" value={username} onChange={(e) => setUsername(e.target.value)} required maxLength={30} className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Palavra-passe</Label>
            <div className="relative">
              <Input id="password" type={showPassword ? "text" : "password"} placeholder="Mínimo 6 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="rounded-xl" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <Button type="submit" variant="hero" className="w-full rounded-xl" size="lg" disabled={loading}>
            {loading ? "A criar conta..." : "Criar Conta"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Já tem conta?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">Entrar</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
