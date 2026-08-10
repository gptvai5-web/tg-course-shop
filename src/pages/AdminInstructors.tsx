import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, User, UserCog } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Instructor { id: string; name: string; title: string; avatar_url: string | null; bio: string; is_active: boolean; display_order: number; }
const emptyForm = { name: "", title: "Instructor", avatar_url: "", bio: "" };

const AdminInstructors = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const fetchInstructors = async () => {
    const { data } = await supabase.from("instructors").select("*").order("display_order");
    setInstructors((data as Instructor[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchInstructors(); }, []);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    const payload = { name: form.name.trim(), title: form.title.trim() || "Instructor", avatar_url: form.avatar_url.trim() || null, bio: form.bio.trim() };
    if (editId) {
      const { error } = await supabase.from("instructors").update(payload).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Instructor updated" });
    } else {
      const maxOrder = instructors.length > 0 ? Math.max(...instructors.map(i => i.display_order)) + 1 : 0;
      const { error } = await supabase.from("instructors").insert({ ...payload, display_order: maxOrder });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Instructor added" });
    }
    setDialogOpen(false); setEditId(null); setForm(emptyForm); fetchInstructors();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("instructors").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Instructor deleted" }); fetchInstructors();
  };

  const handleToggle = async (id: string, current: boolean) => {
    await supabase.from("instructors").update({ is_active: !current }).eq("id", id); fetchInstructors();
  };

  const openEdit = (inst: Instructor) => {
    setEditId(inst.id); setForm({ name: inst.name, title: inst.title, avatar_url: inst.avatar_url || "", bio: inst.bio }); setDialogOpen(true);
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };

  return (
    <AdminPageWrapper
      title="Instructors"
      subtitle="Manage course instructors"
      icon={UserCog}
      headerAction={
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Add Instructor</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Edit Instructor" : "Add Instructor"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><label className="text-sm font-medium mb-1 block">Name *</label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" /></div>
              <div><label className="text-sm font-medium mb-1 block">Title</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
              <div><label className="text-sm font-medium mb-1 block">Avatar URL</label><Input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} className="rounded-xl" /></div>
              <div><label className="text-sm font-medium mb-1 block">Bio</label><Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} /></div>
              <Button onClick={handleSave} className="w-full rounded-xl">{editId ? "Update" : "Add"} Instructor</Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-40 glass-card rounded-2xl animate-pulse" />)}
        </div>
      ) : instructors.length === 0 ? (
        <p className="text-muted-foreground text-sm py-12 text-center">No instructors yet</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {instructors.map((inst, i) => (
            <motion.div
              key={inst.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="glass-card rounded-2xl p-5 flex flex-col hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4 mb-3">
                {inst.avatar_url ? (
                  <img src={inst.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover shrink-0 ring-2 ring-primary/10" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 ring-2 ring-primary/10">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="font-display font-bold text-sm truncate">{inst.name}</h3>
                  <p className="text-xs text-muted-foreground">{inst.title}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 mb-4 flex-1">{inst.bio}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => handleToggle(inst.id, inst.is_active)} className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${inst.is_active ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"}`}>
                  {inst.is_active ? "Active" : "Hidden"}
                </button>
                <div className="flex-1" />
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(inst)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(inst.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AdminPageWrapper>
  );
};

export default AdminInstructors;
