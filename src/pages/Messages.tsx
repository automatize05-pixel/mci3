import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Search, ArrowLeft, Loader2, Paperclip, Smile, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Profile = {
  id: string;
  name: string | null;
  username: string | null;
  profile_picture: string | null;
};

type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  message: string;
  created_at: string;
};

const Messages = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const targetUserId = searchParams.get("userId");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Profile[]>([]);
  const [allUsers, setAllUsers] = useState<Profile[]>([]);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  useEffect(() => {
    if (!currentUserId) return;
    const loadConversations = async () => {
      setLoading(true);
      const { data: msgs } = await supabase
        .from("messages")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });
      
      const userIds = new Set<string>();
      if (msgs) {
        msgs.forEach(m => {
          if (m.sender_id !== currentUserId) userIds.add(m.sender_id);
          if (m.receiver_id !== currentUserId) userIds.add(m.receiver_id);
        });
      }

      // If we have a targetUserId from query param, add it to the list to ensure we can select it
      if (targetUserId && targetUserId !== currentUserId) {
        userIds.add(targetUserId);
      }

      if (userIds.size > 0) {
        const { data: profiles } = await supabase.from("profiles").select("id, name, username, profile_picture").in("id", Array.from(userIds));
        if (profiles) {
          setConversations(profiles);
        }
      }

      // Separate logic to ensure targetUserId is selected even if the profiles fetch above was skipped/empty
      if (targetUserId) {
        const { data: targetProfile } = await supabase.from("profiles").select("id, name, username, profile_picture").eq("id", targetUserId).maybeSingle();
        if (targetProfile) {
          setSelectedUser(targetProfile);
          // Also ensure it's in the conversations list if not already there
          setConversations(prev => {
            if (prev.find(p => p.id === targetProfile.id)) return prev;
            return [targetProfile, ...prev];
          });
        }
      }
      setLoading(false);
    };
    loadConversations();
  }, [currentUserId, targetUserId]);

  useEffect(() => {
    if (!currentUserId || !selectedUser) return;
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages").select("*")
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUserId})`)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    loadMessages();

    const channel = supabase.channel(`msgs-${selectedUser.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as Message;
        if ((msg.sender_id === currentUserId && msg.receiver_id === selectedUser.id) ||
            (msg.sender_id === selectedUser.id && msg.receiver_id === currentUserId)) {
          
          if (msg.sender_id !== currentUserId) {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
            audio.play().catch(e => console.log("Audio play failed:", e));
          }

          setMessages(prev => [...prev, msg]);
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [currentUserId, selectedUser]);

  useEffect(() => {
    if (!search.trim() || !currentUserId) { setAllUsers([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id, name, username, profile_picture")
        .neq("id", currentUserId).or(`name.ilike.%${search}%,username.ilike.%${search}%`).limit(10);
      setAllUsers(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, currentUserId]);

  const sendMessage = async () => {
    if ((!newMessage.trim() && !mediaFile) || !currentUserId || !selectedUser) return;
    setSending(true);

    let finalMessage = newMessage.trim();

    if (mediaFile) {
      const ext = mediaFile.name.split(".").pop();
      const path = `chat/${currentUserId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, mediaFile);

      if (uploadError) {
        toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
        setSending(false);
        return;
      }

      const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
      const fileType = mediaFile.type.startsWith("image/") ? "IMAGE:" : "AUDIO:";
      finalMessage = `${fileType}${urlData.publicUrl}`;
    }

    const { error } = await supabase.from("messages").insert({ sender_id: currentUserId, receiver_id: selectedUser.id, message: finalMessage });
    if (error) toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    else {
      setNewMessage("");
      setMediaFile(null);
      if (!conversations.find(c => c.id === selectedUser.id)) setConversations(prev => [selectedUser, ...prev]);
    }
    setSending(false);
  };

  const selectUser = (user: Profile) => { 
    setSelectedUser(user); setShowSearch(false); setSearch(""); setAllUsers([]); setMediaFile(null); setNewMessage("");
  };

  const renderMessageContent = (text: string) => {
    if (text.startsWith("IMAGE:")) {
      return <img src={text.substring(6)} alt="Imagem enviada" className="max-w-[200px] h-auto rounded-lg mt-1" />;
    }
    if (text.startsWith("AUDIO:")) {
      return <audio controls src={text.substring(6)} className="w-[200px] md:w-[250px] mt-1 h-10" />;
    }
    return <p>{text}</p>;
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  };

  const getDateLabel = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) return "HOJE";
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "ONTEM";
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const avatar = (user: Profile, size = "w-10 h-10") => (
    <div className={`${size} rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm shrink-0 relative`}>
      {user.profile_picture ? (
        <img src={user.profile_picture} alt="" className="w-full h-full rounded-full object-cover" />
      ) : (
        (user.name?.[0] || user.username?.[0] || "?").toUpperCase()
      )}
      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-secondary border-2 border-card" />
    </div>
  );

  // Group messages by date
  const groupedMessages: { date: string; msgs: Message[] }[] = [];
  messages.forEach(msg => {
    const dateKey = new Date(msg.created_at).toDateString();
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateKey) last.msgs.push(msg);
    else groupedMessages.push({ date: dateKey, msgs: [msg] });
  });

  return (
    <AppLayout>
      <div className="container mx-auto px-0 md:px-4 py-0 md:py-6 max-w-4xl">
        <div className="bg-card md:rounded-2xl md:border md:border-border md:shadow-card flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-6rem)] overflow-hidden">
          {/* Sidebar */}
          <div className={`w-full md:w-80 border-r border-border flex flex-col ${selectedUser ? "hidden md:flex" : "flex"}`}>
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-bold font-display text-foreground">Mensagens</h1>
                <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setShowSearch(!showSearch)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {showSearch && (
                <Input placeholder="Procurar utilizadores..." value={search} onChange={e => setSearch(e.target.value)} autoFocus className="rounded-xl" />
              )}
            </div>

            <ScrollArea className="flex-1">
              {showSearch && allUsers.length > 0 && (
                <div className="p-2">
                  <p className="text-xs text-muted-foreground px-2 mb-1">Resultados</p>
                  {allUsers.map(u => (
                    <button key={u.id} onClick={() => selectUser(u)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left">
                      {avatar(u)}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{u.name || u.username}</p>
                        <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              <div className="p-2">
                {loading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : conversations.length === 0 && !showSearch ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Sem conversas ainda.</p>
                    <Button variant="outline" size="sm" className="mt-3 rounded-xl" onClick={() => setShowSearch(true)}>
                      <Search className="h-3 w-3 mr-1" /> Procurar
                    </Button>
                  </div>
                ) : (
                  conversations.map(u => (
                    <button
                      key={u.id}
                      onClick={() => selectUser(u)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${
                        selectedUser?.id === u.id ? "bg-primary/10" : "hover:bg-muted"
                      }`}
                    >
                      {avatar(u)}
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground text-sm truncate">{u.name || u.username}</p>
                        <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Chat area */}
          <div className={`flex-1 flex flex-col ${!selectedUser ? "hidden md:flex" : "flex"}`}>
            {selectedUser ? (
              <>
                <div className="p-4 border-b border-border flex items-center gap-3 bg-card">
                  <Button variant="ghost" size="icon" className="md:hidden rounded-xl" onClick={() => setSelectedUser(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {avatar(selectedUser)}
                  <div className="flex-1">
                    <p className="font-semibold text-foreground text-sm">{selectedUser.name || selectedUser.username}</p>
                    <p className="text-[10px] text-secondary font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary inline-block" /> Online
                    </p>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-1">
                    {groupedMessages.map(group => (
                      <div key={group.date}>
                        <div className="flex items-center justify-center my-4">
                          <span className="text-[10px] text-muted-foreground bg-muted px-3 py-1 rounded-full font-medium">
                            {getDateLabel(group.msgs[0].created_at)}
                          </span>
                        </div>
                        {group.msgs.map(msg => {
                          const isMine = msg.sender_id === currentUserId;
                          return (
                            <div key={msg.id} className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`max-w-[75%] px-4 py-2.5 text-sm ${
                                  isMine
                                    ? "gradient-warm text-primary-foreground rounded-2xl rounded-br-md"
                                    : "bg-muted text-foreground rounded-2xl rounded-bl-md"
                                }`}
                                >
                                  {renderMessageContent(msg.message)}
                                  <p className={`text-[10px] mt-1 text-right ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                                  {formatTime(msg.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>

                <div className="p-4 border-t border-border bg-card">
                  {mediaFile && (
                    <div className="flex items-center gap-2 mb-3 bg-muted/50 p-2 rounded-xl text-xs">
                      {mediaFile.type.startsWith("image/") ? <Paperclip className="h-4 w-4" /> : <Loader2 className="h-4 w-4" />}
                      <span className="flex-1 truncate">{mediaFile.name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setMediaFile(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                  <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} accept="image/*, audio/*" className="hidden" onChange={e => e.target.files && setMediaFile(e.target.files[0])} />
                    <Button type="button" variant="ghost" size="icon" className="rounded-xl text-muted-foreground shrink-0" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Escreva uma mensagem..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      disabled={sending}
                      className="flex-1 rounded-xl"
                    />
                    <Button type="button" variant="ghost" size="icon" className="rounded-xl text-muted-foreground shrink-0">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Button type="submit" size="icon" disabled={sending || (!newMessage.trim() && !mediaFile)} className="rounded-xl gradient-warm text-primary-foreground shrink-0">
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground font-medium">Selecione uma conversa</p>
                  <p className="text-xs text-muted-foreground mt-1">Ou procure um utilizador para iniciar</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Messages;
