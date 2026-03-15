import AppLayout from "@/components/AppLayout";

const Messages = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold font-display text-foreground mb-6">Mensagens</h1>
        <div className="bg-card rounded-xl border border-border p-8 text-center shadow-card">
          <p className="text-muted-foreground">As suas conversas aparecerão aqui.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
