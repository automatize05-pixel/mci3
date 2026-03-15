import AppLayout from "@/components/AppLayout";

const CreatePost = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold font-display text-foreground mb-6">Nova Publicação</h1>
        <div className="bg-card rounded-xl border border-border p-8 text-center shadow-card">
          <p className="text-muted-foreground">Formulário de criação de publicação (em breve).</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default CreatePost;
