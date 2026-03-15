import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChefHat, Sparkles, Users, BookOpen, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroFood from "@/assets/hero-food.jpg";
import logoMci from "@/assets/logo-mci.png";

const features = [
  {
    icon: ChefHat,
    title: "Partilhe Pratos",
    description: "Publique as suas criações culinárias e inspire a comunidade angolana.",
  },
  {
    icon: Sparkles,
    title: "Receitas com IA",
    description: "Diga os ingredientes que tem e a IA cria uma receita perfeita para si.",
  },
  {
    icon: Users,
    title: "Siga Chefs",
    description: "Conecte-se com cozinheiros talentosos e descubra novos sabores.",
  },
  {
    icon: BookOpen,
    title: "Guarde Receitas",
    description: "Salve as suas receitas favoritas e acesse a qualquer momento.",
  },
];

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="h-8 w-8 text-primary" />
            <span className="font-display text-xl font-bold text-foreground">MCI</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button variant="hero" size="sm">Criar Conta</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-10" />
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
                🇦🇴 A primeira rede social culinária de Angola
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground leading-tight mb-6">
                Descubra, cozinhe e{" "}
                <span className="text-primary">partilhe receitas</span>{" "}
                com a comunidade angolana.
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg">
                Junte-se a milhares de cozinheiros, partilhe os seus pratos favoritos e gere receitas com inteligência artificial.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/register">
                  <Button variant="hero" size="xl">
                    Começar Agora <ArrowRight className="ml-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="xl">
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src={heroFood}
                  alt="Pratos tradicionais angolanos coloridos"
                  className="w-full h-[400px] md:h-[500px] object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/20 to-transparent" />
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-card p-4 border border-border"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-primary" />
                  <div>
                    <p className="font-display font-semibold text-foreground text-sm">Receita com IA</p>
                    <p className="text-xs text-muted-foreground">Gerada em segundos</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
              Tudo o que precisa para cozinhar melhor
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Uma plataforma completa para a comunidade culinária angolana.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-background rounded-xl p-6 shadow-card border border-border hover:shadow-warm transition-shadow duration-300"
              >
                <div className="w-12 h-12 rounded-lg gradient-warm flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="font-display font-semibold text-foreground text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="gradient-warm rounded-2xl p-10 md:p-16 text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display text-primary-foreground mb-4">
              Pronto para começar a cozinhar?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
              Junte-se à comunidade MCI e descubra um mundo de sabores angolanos.
            </p>
            <Link to="/register">
              <Button variant="outline" size="xl" className="bg-card text-foreground border-none hover:bg-card/90">
                Criar Conta Gratuita <ArrowRight className="ml-1" />
              </Button>
            </Link>
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
