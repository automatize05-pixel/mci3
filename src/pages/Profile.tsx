import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { User, Camera, Loader2, Save, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const Profile = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    username: "",
    email: "",
    bio: "",
    profile_picture: "",
  });

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: profileData }, { data: roleData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).single(),
      ]);

      if (profileData) {
        setProfile({
          name: profileData.name || "",
          username: profileData.username || "",
          email: profileData.email || "",
          bio: profileData.bio || "",
          profile_picture: profileData.profile_picture || "",
        });
      }

      setIsAdmin(roleData?.role === "admin");
      setLoading(false);
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        name: profile.name.trim(),
        username: profile.username.trim(),
        bio: profile.bio.trim(),
      })
      .eq("id", user.id);

    if (error) {
      toast({ title: "Erro ao guardar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil actualizado!" });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Ficheiro muito grande", description: "Máximo 2MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ profile_picture: publicUrl }).eq("id", user.id);
    setProfile((prev) => ({ ...prev, profile_picture: publicUrl }));
    toast({ title: "Foto actualizada!" });
    setUploading(false);
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold font-display text-foreground">O Meu Perfil</h1>
          </div>
          {isAdmin && (
            <Link to="/admin">
              <Button variant="outline" size="sm">
                <Shield className="h-4 w-4 mr-1" /> Admin
              </Button>
            </Link>
          )}
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-card space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-accent flex items-center justify-center overflow-hidden border-4 border-border">
                {profile.profile_picture ? (
                  <img src={profile.profile_picture} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-accent-foreground">
                    {(profile.name?.[0] || profile.username?.[0] || "?").toUpperCase()}
                  </span>
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Clique na câmera para alterar</p>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Nome de utilizador</Label>
              <Input
                id="username"
                value={profile.username}
                onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled className="opacity-60" />
              <p className="text-xs text-muted-foreground">O email não pode ser alterado.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                placeholder="Conte um pouco sobre si..."
                value={profile.bio}
                onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
                rows={3}
                maxLength={300}
              />
            </div>
          </div>

          <Button onClick={handleSave} variant="hero" size="lg" className="w-full" disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> A guardar...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> Guardar Alterações
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
