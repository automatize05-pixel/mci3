import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChefHat, Sparkles, Users, BookOpen, ArrowRight, Heart, MessageCircle, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import heroFood from "@/assets/hero-food.jpg";
import logoMci from "@/assets/logo-mci.png";

const features = [
  { icon: ChefHat, title: "Partilhe Pratos", description: "Publique as suas criações e inspire a comunidade angolana.", color: "gradient-warm" },
  { icon: Sparkles, title: "Receitas com IA", description: "Diga os ingredientes e a IA cria uma receita perfeita.", color: "gradient-fresh" },
  { icon: Users, title: "Siga Chefs", description: "Descubra e siga os melhores chefs de Angola.", color: "gradient-warm" },
  { icon: BookOpen, title: "Guarde Receitas", description: "Salve as receitas favoritas e aceda a qualquer momento.", color: "gradient-fresh" },
];

const stats = [
  { icon: Heart, value: "100K+", label: "Receitas partilhadas" },
  { icon: Users, value: "50K+", label: "Cozinheiros activos" },
  { icon: TrendingUp, value: "1M+", label: "Interações mensais" },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoMci} alt="MCI" className="h-8" />
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="rounded-xl">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button variant="hero" size="sm" className="rounded-xl">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16">
        <div className="absolute inset-0 gradient-hero opacity-[0.07]" />
        <div className="container mx-auto px-4 py-16 md:py-28">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-5">
                🇦🇴 A rede social culinária de Angola
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display text-foreground leading-[1.1] mb-5">
                Descubra, cozinhe e{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">partilhe</span>{" "}
                com a comunidade.
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                Junte-se a milhares de cozinheiros, partilhe pratos e gere receitas com inteligência artificial.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/register">
                  <Button variant="hero" size="xl" className="rounded-2xl">
                    Começar Agora <ArrowRight className="ml-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="xl" className="rounded-2xl">Já tenho conta</Button>
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-3xl overflow-hidden shadow-elevated">
                <img src={heroFood} alt="Pratos tradicionais angolanos" className="w-full h-[360px] md:h-[460px] object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
              </div>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -bottom-4 -left-4 bg-card rounded-2xl shadow-elevated p-4 border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-foreground text-sm">Receita com IA</p>
                    <p className="text-xs text-muted-foreground">Gerada em segundos</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ repeat: Infinity, duration: 3, delay: 1.5 }}
                className="absolute -top-2 -right-2 bg-card rounded-2xl shadow-elevated p-3 border border-border"
              >
                <div className="flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-chef" />
                  <span className="text-xs font-semibold text-foreground">Chef Verificado</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 gap-6">
            {stats.map(s => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-2xl md:text-3xl font-extrabold font-display text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-foreground mb-3">
              Tudo para cozinhar melhor
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Uma plataforma completa para a comunidade culinária angolana.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl p-6 shadow-card border border-border hover:shadow-elevated transition-all duration-300 group"
              >
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-lg mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gradient-warm rounded-3xl p-10 md:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/10" />
            <div className="relative">
              <h2 className="text-3xl md:text-4xl font-extrabold font-display text-primary-foreground mb-4">
                Pronto para começar?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                Junte-se à comunidade MCI e descubra um mundo de sabores angolanos.
              </p>
              <Link to="/register">
                <Button variant="outline" size="xl" className="bg-card text-foreground border-none hover:bg-card/90 rounded-2xl shadow-elevated">
                  Criar Conta Gratuita <ArrowRight className="ml-1" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2026 MCI – Minha Cozinha Inteligente. Feito com ❤️ em Angola.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
