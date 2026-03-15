import AppLayout from "@/components/AppLayout";

const Profile = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-2xl font-bold font-display text-foreground mb-6">O Meu Perfil</h1>
        <div className="bg-card rounded-xl border border-border p-8 text-center shadow-card">
          <p className="text-muted-foreground">Informações do perfil aparecerão aqui.</p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
