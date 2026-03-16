import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChefHat, Sparkles, Users, BookOpen, ArrowRight, Heart, TrendingUp, Search, Star, Check, Instagram, Facebook, Twitter } from "lucide-react";
import { Link } from "react-router-dom";
import heroFood from "@/assets/hero-food.jpg";
import logoMci from "@/assets/logo-mci.png";

const features = [
  {
    icon: Search,
    title: "Análise de Ingredientes",
    description: "Tire uma foto dos ingredientes disponíveis e a IA identifica e sugere combinações perfeitas.",
    color: "gradient-warm",
  },
  {
    icon: Sparkles,
    title: "Geração de Receitas",
    description: "Descreva o que deseja cozinhar e receba receitas personalizadas com instruções passo a passo.",
    color: "gradient-fresh",
  },
  {
    icon: BookOpen,
    title: "Planeamento Semanal",
    description: "Planeie as suas refeições da semana com sugestões inteligentes baseadas no seu orçamento.",
    color: "gradient-warm",
  },
  {
    icon: TrendingUp,
    title: "Análise Nutricional",
    description: "Obtenha informações nutricionais detalhadas de cada receita gerada pela IA.",
    color: "gradient-fresh",
  },
];

const trendingRecipes = [
  { title: "Muamba de Galinha", author: "Chef Ana", likes: 234, image: "🍗" },
  { title: "Calulu de Peixe", author: "Chef Carlos", likes: 189, image: "🐟" },
  { title: "Funge com Molho", author: "Chef Maria", likes: 156, image: "🍲" },
  { title: "Kizaka com Amendoim", author: "Chef Pedro", likes: 143, image: "🥜" },
];

const plans = [
  {
    name: "Gratuito",
    price: "0",
    period: "para sempre",
    features: ["5 receitas IA/mês", "Feed social", "Guardar receitas", "Perfil básico"],
    cta: "Começar Grátis",
    popular: false,
  },
  {
    name: "Chef Starter",
    price: "2.500",
    period: "Kz/mês",
    features: ["50 receitas IA/mês", "Planeamento semanal", "Sem anúncios", "Badge Chef Starter"],
    cta: "Experimentar",
    popular: false,
  },
  {
    name: "Chef Pro",
    price: "5.000",
    period: "Kz/mês",
    features: ["Receitas IA ilimitadas", "Analytics completo", "Prioridade no feed", "Badge Chef Pro", "Monetização"],
    cta: "Escolher Pro",
    popular: true,
  },
  {
    name: "Chef Elite",
    price: "10.000",
    period: "Kz/mês",
    features: ["Tudo do Pro", "Consultoria culinária IA", "Destaque na homepage", "Badge Chef Elite", "API access"],
    cta: "Contactar",
    popular: false,
  },
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
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a>
            <a href="#trending" className="hover:text-foreground transition-colors">Tendências</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Planos</a>
          </div>
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
        <div className="absolute inset-0 gradient-hero opacity-[0.05]" />
        <div className="container mx-auto px-4 py-16 md:py-24 lg:py-32">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-5">
                🇦🇴 A rede social culinária de Angola
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold font-display text-foreground leading-[1.08] mb-5">
                Cozinha Inteligente{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">com IA</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                Descubra receitas, partilhe pratos e use inteligência artificial para transformar a sua cozinha angolana.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/register">
                  <Button variant="hero" size="xl" className="rounded-2xl shadow-warm">
                    Começar Agora <ArrowRight className="ml-1" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="xl" className="rounded-2xl">Já tenho conta</Button>
                </Link>
              </div>
              {/* Mini stats */}
              <div className="flex items-center gap-6 mt-8">
                {stats.map(s => (
                  <div key={s.label} className="text-center">
                    <p className="text-lg font-bold font-display text-foreground">{s.value}</p>
                    <p className="text-[11px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
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
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-card/90 backdrop-blur-md rounded-2xl p-4 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl gradient-warm flex items-center justify-center shrink-0">
                        <Sparkles className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-semibold text-foreground text-sm">Receita gerada com IA</p>
                        <p className="text-xs text-muted-foreground truncate">"Muamba de Galinha com toque moderno"</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="absolute -top-3 -right-3 bg-card rounded-2xl shadow-elevated p-3 border border-border"
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

      {/* AI Features */}
      <section id="features" className="py-20 bg-card/50 border-y border-border/50">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-4">
              <Sparkles className="h-3 w-3" /> Inteligência Artificial
            </span>
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-foreground mb-3">
              Cozinha Inteligente com IA
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tecnologia de ponta ao serviço da gastronomia angolana.
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

      {/* Trending */}
      <section id="trending" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-foreground mb-3">
              Tendências em Luanda
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              As receitas mais populares da comunidade esta semana.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {trendingRecipes.map((r, i) => (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="bg-card rounded-2xl overflow-hidden shadow-card border border-border hover:shadow-elevated transition-all group"
              >
                <div className="h-40 gradient-warm flex items-center justify-center text-5xl group-hover:scale-105 transition-transform">
                  {r.image}
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-foreground mb-1">{r.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{r.author}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Heart className="h-3 w-3 text-primary" />
                    <span>{r.likes}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 bg-card/50 border-y border-border/50">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold font-display text-foreground mb-3">
              Escolha o Seu Plano
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Do cozinheiro caseiro ao chef profissional.
            </p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`bg-card rounded-2xl p-6 border shadow-card relative ${
                  plan.popular ? "border-primary shadow-warm ring-1 ring-primary/20" : "border-border"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full gradient-warm text-primary-foreground text-xs font-semibold">
                    Popular
                  </span>
                )}
                <h3 className="font-display font-bold text-foreground text-lg mb-1">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold font-display text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">{plan.period}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-secondary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register">
                  <Button
                    variant={plan.popular ? "hero" : "outline"}
                    size="sm"
                    className="w-full rounded-xl"
                  >
                    {plan.cta}
                  </Button>
                </Link>
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
      <footer className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={logoMci} alt="MCI" className="h-8 mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                A plataforma culinária inteligente de Angola. Receitas, comunidade e IA.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-3">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Funcionalidades</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Planos</a></li>
                <li><Link to="/ai-recipes" className="hover:text-foreground transition-colors">IA Chef</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-3">Comunidade</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/discover-chefs" className="hover:text-foreground transition-colors">Chefs</Link></li>
                <li><Link to="/recipes" className="hover:text-foreground transition-colors">Receitas</Link></li>
                <li><Link to="/feed" className="hover:text-foreground transition-colors">Feed Social</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-3">Social</h4>
              <div className="flex items-center gap-3">
                <a href="#" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Instagram className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="#" className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <Twitter className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center text-muted-foreground text-sm">
            <p>© 2026 MCI – Minha Cozinha Inteligente. Feito com ❤️ em Angola.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
