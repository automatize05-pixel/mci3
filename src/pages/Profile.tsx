import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import UserAvatar from "@/components/Avatar";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Camera, Loader2, Save, Shield, ChefHat, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { BADGES } from "@/utils/gamification";

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
    account_type: "user",
    xp: 0,
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [myBadges, setMyBadges] = useState<string[]>([]);

  useEffect(() => {
    const loadProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [{ data: profileData }, { data: roleData }, { data: badgesData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
        (supabase as any).from("user_badges").select("badge_type").eq("user_id", user.id),
      ]);

      if (profileData) {
        setProfile({
          name: profileData.name || "",
          username: profileData.username || "",
          email: profileData.email || "",
          bio: profileData.bio || "",
          profile_picture: profileData.profile_picture || "",
          account_type: (profileData as any).account_type || "user",
          xp: (profileData as any).xp || 0,
        });
      }

      setMyBadges(badgesData?.map((b: any) => b.badge_type) || []);
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
      .update({ name: profile.name.trim(), username: profile.username.trim(), bio: profile.bio.trim() })
      .eq("id", user.id);

    if (error) toast({ title: "Erro ao guardar", description: error.message, variant: "destructive" });
    else toast({ title: "Perfil actualizado!" });
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

    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    await supabase.from("profiles").update({ profile_picture: publicUrl }).eq("id", user.id);
    setProfile(prev => ({ ...prev, profile_picture: publicUrl }));
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
      <div className="container mx-auto px-4 py-6 max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold font-display text-foreground">O Meu Perfil</h1>
          <div className="flex gap-2">
            {userId && (
              <Link to={`/user/${userId}`}>
                <Button variant="outline" size="sm" className="rounded-xl text-xs">Ver Público</Button>
              </Link>
            )}
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="rounded-xl text-xs">
                  <Shield className="h-3 w-3 mr-1" /> Admin
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <UserAvatar
                src={profile.profile_picture}
                name={profile.name}
                username={profile.username}
                isChef={profile.account_type === "chef"}
                isVerified={isAdmin}
                size="xl"
                linked={false}
              />
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors ring-2 ring-background">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            {profile.account_type === "chef" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-chef/10 text-chef text-xs font-semibold mt-2">
                <ChefHat className="h-3 w-3" /> Conta Chef
              </span>
            )}
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} maxLength={100} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={profile.username} onChange={e => setProfile(p => ({ ...p, username: e.target.value }))} maxLength={30} className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile.email} disabled className="opacity-60 rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" placeholder="Conte um pouco sobre si..." value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} maxLength={300} className="rounded-xl" />
            </div>
          </div>

          <Button onClick={handleSave} variant="hero" size="lg" className="w-full rounded-xl" disabled={saving}>
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> A guardar...</> : <><Save className="h-4 w-4" /> Guardar Alterações</>}
          </Button>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6 shadow-card space-y-4 mt-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              <h3 className="font-bold text-foreground font-display text-lg">Emblemas & Nível</h3>
            </div>
            <div className="text-right">
              <span className="text-xl font-black text-primary bg-primary/10 px-3 py-1 rounded-xl shadow-inner">{profile.xp} XP</span>
            </div>
          </div>
          
          <div className="grid grid-cols-5 gap-2 sm:gap-4 mt-4">
            {BADGES.map((badge, i) => {
              const isEarned = myBadges.includes(badge.id);
              return (
                <div key={i} className={`flex flex-col items-center justify-center p-2 sm:p-3 rounded-2xl border shadow-sm transition-all ${isEarned ? 'bg-background border-primary/30 shadow-primary/5' : 'bg-muted/50 border-transparent opacity-40 grayscale hover:grayscale-0'}`}>
                  <span className="text-2xl sm:text-3xl mb-2 drop-shadow-sm">{badge.icon}</span>
                  <span className="text-[9px] sm:text-[10px] font-bold leading-tight text-center text-foreground">{badge.name}</span>
                  {!isEarned && <span className="text-[8px] text-muted-foreground mt-1">{badge.xp_required} XP</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Profile;
