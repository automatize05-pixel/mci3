import { useEffect, useState, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Search, ArrowLeft, Loader2 } from "lucide-react";
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
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, []);

  // Load conversations (users who have exchanged messages)
  useEffect(() => {
    if (!currentUserId) return;

    const loadConversations = async () => {
      setLoading(true);
      const { data: msgs } = await supabase
        .from("messages")
        .select("sender_id, receiver_id")
        .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
        .order("created_at", { ascending: false });

      if (msgs) {
        const userIds = new Set<string>();
        msgs.forEach((m) => {
          if (m.sender_id !== currentUserId) userIds.add(m.sender_id);
          if (m.receiver_id !== currentUserId) userIds.add(m.receiver_id);
        });

        if (userIds.size > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, username, profile_picture")
            .in("id", Array.from(userIds));
          setConversations(profiles || []);
        }
      }
      setLoading(false);
    };

    loadConversations();
  }, [currentUserId]);

  // Load messages for selected user
  useEffect(() => {
    if (!currentUserId || !selectedUser) return;

    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUserId})`
        )
        .order("created_at", { ascending: true });

      setMessages(data || []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };

    loadMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`msgs-${selectedUser.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new as Message;
          if (
            (msg.sender_id === currentUserId && msg.receiver_id === selectedUser.id) ||
            (msg.sender_id === selectedUser.id && msg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, msg]);
            setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, selectedUser]);

  // Search users
  useEffect(() => {
    if (!search.trim() || !currentUserId) {
      setAllUsers([]);
      return;
    }

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, username, profile_picture")
        .neq("id", currentUserId)
        .or(`name.ilike.%${search}%,username.ilike.%${search}%`)
        .limit(10);
      setAllUsers(data || []);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, currentUserId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || !selectedUser) return;
    setSending(true);

    const { error } = await supabase.from("messages").insert({
      sender_id: currentUserId,
      receiver_id: selectedUser.id,
      message: newMessage.trim(),
    });

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      setNewMessage("");
      // Add to conversations if new
      if (!conversations.find((c) => c.id === selectedUser.id)) {
        setConversations((prev) => [selectedUser, ...prev]);
      }
    }
    setSending(false);
  };

  const selectUser = (user: Profile) => {
    setSelectedUser(user);
    setShowSearch(false);
    setSearch("");
    setAllUsers([]);
  };

  const formatTime = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }) + " " + date.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
  };

  const avatar = (user: Profile) => (
    <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-sm flex-shrink-0">
      {user.profile_picture ? (
        <img src={user.profile_picture} alt="" className="w-full h-full rounded-full object-cover" />
      ) : (
        (user.name?.[0] || user.username?.[0] || "?").toUpperCase()
      )}
    </div>
  );

  return (
    <AppLayout>
      <div className="container mx-auto px-0 md:px-4 py-0 md:py-8 max-w-4xl">
        <div className="bg-card md:rounded-xl md:border md:border-border md:shadow-card flex h-[calc(100vh-3.5rem)] md:h-[calc(100vh-7rem)] overflow-hidden">
          {/* Sidebar */}
          <div className={`w-full md:w-80 border-r border-border flex flex-col ${selectedUser ? "hidden md:flex" : "flex"}`}>
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between mb-3">
                <h1 className="text-lg font-bold font-display text-foreground">Mensagens</h1>
                <Button variant="ghost" size="icon" onClick={() => setShowSearch(!showSearch)}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              {showSearch && (
                <Input
                  placeholder="Procurar utilizadores..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  autoFocus
                />
              )}
            </div>

            <ScrollArea className="flex-1">
              {/* Search results */}
              {showSearch && allUsers.length > 0 && (
                <div className="p-2">
                  <p className="text-xs text-muted-foreground px-2 mb-1">Resultados</p>
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => selectUser(u)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors text-left"
                    >
                      {avatar(u)}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{u.name || u.username}</p>
                        <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Conversations */}
              <div className="p-2">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : conversations.length === 0 && !showSearch ? (
                  <div className="text-center py-12 px-4">
                    <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">Sem conversas ainda.</p>
                    <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowSearch(true)}>
                      <Search className="h-3 w-3 mr-1" /> Procurar utilizadores
                    </Button>
                  </div>
                ) : (
                  conversations.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => selectUser(u)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                        selectedUser?.id === u.id ? "bg-accent" : "hover:bg-muted"
                      }`}
                    >
                      {avatar(u)}
                      <div className="min-w-0">
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
                {/* Header */}
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedUser(null)}>
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {avatar(selectedUser)}
                  <div>
                    <p className="font-medium text-foreground text-sm">{selectedUser.name || selectedUser.username}</p>
                    <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isMine = msg.sender_id === currentUserId;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                              isMine
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-muted text-foreground rounded-bl-md"
                            }`}
                          >
                            <p>{msg.message}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {formatTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-border">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      placeholder="Escreva uma mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={sending}
                      className="flex-1"
                    />
                    <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Selecione uma conversa para começar.</p>
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
