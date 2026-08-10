import { useEffect, useState } from "react";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2, GraduationCap, ArrowUp, ArrowDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CourseLevel {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

const AdminCourseLevels = () => {
  const [levels, setLevels] = useState<CourseLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => { fetchLevels(); }, []);

  const fetchLevels = async () => {
    const { data } = await (supabase.from as any)("course_levels").select("*").order("display_order");
    setLevels(data || []);
    setLoading(false);
  };

  const openNew = () => { setEditId(null); setName(""); setDialogOpen(true); };
  const openEdit = (l: CourseLevel) => { setEditId(l.id); setName(l.name); setDialogOpen(true); };

  const handleSave = async () => {
    if (!name.trim()) { toast({ title: "Error", description: "Name required", variant: "destructive" }); return; }
    if (editId) {
      const { error } = await (supabase.from as any)("course_levels").update({ name: name.trim() }).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Level updated" });
    } else {
      const { error } = await (supabase.from as any)("course_levels").insert({ name: name.trim(), display_order: levels.length });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Level created" });
    }
    setDialogOpen(false);
    fetchLevels();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this level?")) return;
    await (supabase.from as any)("course_levels").delete().eq("id", id);
    toast({ title: "Level deleted" });
    fetchLevels();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await (supabase.from as any)("course_levels").update({ is_active: !active }).eq("id", id);
    fetchLevels();
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= levels.length) return;
    const updates = [
      { id: levels[index].id, display_order: levels[newIndex].display_order },
      { id: levels[newIndex].id, display_order: levels[index].display_order },
    ];
    for (const u of updates) {
      await (supabase.from as any)("course_levels").update({ display_order: u.display_order }).eq("id", u.id);
    }
    fetchLevels();
  };

  return (
    <AdminPageWrapper
      title="Course Levels"
      subtitle="Manage course difficulty levels"
      icon={GraduationCap}
      headerAction={<Button onClick={openNew} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Add Level</Button>}
    >
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editId ? "Edit Level" : "Create Level"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium mb-1 block">Level Name *</label><Input value={name} onChange={e => setName(e.target.value)} className="rounded-xl" placeholder="e.g. Beginner" /></div>
            <Button onClick={handleSave} className="w-full rounded-xl">{editId ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : levels.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No levels yet. Create your first level!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {levels.map((l, i) => (
            <motion.div key={l.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg transition-shadow">
              <div className="flex flex-col gap-1">
                <button onClick={() => handleMove(i, -1)} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleMove(i, 1)} disabled={i === levels.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
              </div>
              <p className="text-sm font-bold flex-1">{l.name}</p>
              <button onClick={() => handleToggle(l.id, l.is_active)} className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${l.is_active ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"}`}>
                {l.is_active ? "Active" : "Hidden"}
              </button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(l)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(l.id)}><Trash2 className="w-4 h-4" /></Button>
            </motion.div>
          ))}
        </div>
      )}
    </AdminPageWrapper>
  );
};

export default AdminCourseLevels;
