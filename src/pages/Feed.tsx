import AppLayout from "@/components/AppLayout";

const Feed = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold font-display text-foreground mb-6">Início</h1>
        <div className="bg-card rounded-xl border border-border p-8 text-center shadow-card">
          <p className="text-muted-foreground">
            O feed de publicações aparecerá aqui. Comece por criar a sua primeira publicação!
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Feed;
