import { useEffect, useState } from "react";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { MessageSquare, Trash2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

interface ContactMessage { id: string; name: string; email: string; subject: string | null; message: string; is_read: boolean; created_at: string; }

const AdminContactMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => { fetchMessages(); }, []);

  const fetchMessages = async () => {
    const { data } = await supabase.from("contact_messages" as any).select("*").order("created_at", { ascending: false });
    setMessages((data as any as ContactMessage[]) || []);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await supabase.from("contact_messages" as any).update({ is_read: true } as any).eq("id", id);
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, is_read: true } : m));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this message?")) return;
    await supabase.from("contact_messages" as any).delete().eq("id", id);
    toast({ title: "Message deleted" });
    setMessages(msgs => msgs.filter(m => m.id !== id));
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    const msg = messages.find(m => m.id === id);
    if (msg && !msg.is_read) markRead(id);
  };

  const unreadCount = messages.filter(m => !m.is_read).length;

  return (
    <AdminPageWrapper
      title="Contact Messages"
      subtitle="Messages from the contact form"
      icon={MessageSquare}
      badge={unreadCount > 0 ? (
        <span className="text-xs bg-primary text-primary-foreground px-2.5 py-0.5 rounded-full ml-2">{unreadCount} new</span>
      ) : undefined}
    >
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : messages.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Mail className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No contact messages yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`glass-card rounded-2xl p-4 md:p-5 cursor-pointer transition-all hover:shadow-lg ${!m.is_read ? "ring-1 ring-primary/30 bg-primary/5" : ""}`}
              onClick={() => toggleExpand(m.id)}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {!m.is_read && <span className="w-2 h-2 rounded-full bg-primary shrink-0 animate-pulse" />}
                    <p className="text-sm font-bold truncate">{m.name}</p>
                    <span className="text-xs text-muted-foreground">{m.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{m.subject || "No subject"} · {new Date(m.created_at).toLocaleDateString()}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              {expandedId === m.id && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 pt-3 border-t border-border/30">
                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </AdminPageWrapper>
  );
};

export default AdminContactMessages;
