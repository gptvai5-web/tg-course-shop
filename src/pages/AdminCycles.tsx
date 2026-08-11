import { useEffect, useState } from "react";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Layers, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Cycle { id: string; course_id: string; title: string; description: string; price: number; original_price: number | null; image_url: string; is_active: boolean; display_order: number; }
interface Course { id: string; title: string; category: string; has_cycles: boolean; }

const emptyForm = { title: "", description: "", price: "", original_price: "", image_url: "" };

const AdminCycles = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => { fetchCourses(); }, []);

  useEffect(() => {
    if (selectedCourseId) fetchCycles(selectedCourseId);
    else setCycles([]);
  }, [selectedCourseId]);

  const fetchCourses = async () => {
    const { data } = await supabase.from("courses").select("id, title, category, has_cycles").eq("has_cycles", true).order("title");
    setCourses((data as Course[]) || []);
    setLoading(false);
  };

  const fetchCycles = async (courseId: string) => {
    setLoading(true);
    const { data } = await supabase.from("cycles").select("*").eq("course_id", courseId).order("display_order");
    setCycles((data as Cycle[]) || []);
    setLoading(false);
  };

  const openNew = () => { 
    if (!selectedCourseId) {
      toast({ title: "Error", description: "Select a course first", variant: "destructive" });
      return;
    }
    setEditId(null); setForm(emptyForm); setDialogOpen(true); 
  };

  const openEdit = (c: Cycle) => {
    setEditId(c.id);
    setForm({ title: c.title, description: c.description, price: String(c.price), original_price: c.original_price ? String(c.original_price) : "", image_url: c.image_url });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: "Error", description: "Title required", variant: "destructive" }); return; }
    const payload = { title: form.title, description: form.description, price: Number(form.price) || 0, original_price: form.original_price ? Number(form.original_price) : null, image_url: form.image_url, course_id: selectedCourseId };
    
    if (editId) {
      const { error } = await supabase.from("cycles").update(payload).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { error } = await supabase.from("cycles").insert({ ...payload, display_order: cycles.length });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    }
    
    toast({ title: editId ? "Cycle updated" : "Cycle created" });
    setDialogOpen(false); fetchCycles(selectedCourseId);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this cycle? All chapter associations and enrollments will be lost.")) return;
    await supabase.from("cycles").delete().eq("id", id);
    toast({ title: "Cycle deleted" }); fetchCycles(selectedCourseId);
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from("cycles").update({ is_active: !active }).eq("id", id); fetchCycles(selectedCourseId);
  };

  return (
    <AdminPageWrapper
      title="Course Cycles"
      subtitle="Manage separately purchasable cycles (modules) for courses"
      icon={Layers}
      headerAction={<Button onClick={openNew} className="gap-2 rounded-xl" disabled={!selectedCourseId}><Plus className="w-4 h-4" /> Create Cycle</Button>}
    >
      <div className="mb-6 p-4 glass-card rounded-2xl">
        <label className="text-sm font-medium mb-2 block">Select Course</label>
        <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
          <SelectTrigger className="w-full md:w-96 rounded-xl">
            <SelectValue placeholder="Select a course with cycles enabled" />
          </SelectTrigger>
          <SelectContent>
            {courses.length === 0 && <SelectItem value="none" disabled>No courses with cycles enabled</SelectItem>}
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-2">Only courses with "Enable Cycle System" checked are shown here.</p>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Cycle" : "Create Cycle"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium mb-1 block">Cycle Title *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" placeholder="e.g. Cycle 1: Mechanics" /></div>
            <div><label className="text-sm font-medium mb-1 block">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">Cycle Price (৳)</label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl" /></div>
              <div><label className="text-sm font-medium mb-1 block">Original Price (৳)</label><Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className="rounded-xl" /></div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Cover Image URL</label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="rounded-xl" placeholder="https://..." /></div>
            <Button onClick={handleSave} className="w-full rounded-xl mt-2">{editId ? "Update" : "Create"} Cycle</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : !selectedCourseId ? (
        <div className="text-center py-20 text-muted-foreground">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Please select a course above to manage its cycles.</p>
        </div>
      ) : cycles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No cycles found for this course. Create your first cycle!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cycles.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
            >
              {c.image_url && <img src={c.image_url} alt="" className="w-16 h-12 rounded-xl object-cover shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground">৳{c.price} {c.original_price && <span className="line-through text-muted-foreground/50 ml-1">৳{c.original_price}</span>}</p>
              </div>
              <button onClick={() => handleToggle(c.id, c.is_active)} className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 transition-colors ${c.is_active ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"}`}>
                {c.is_active ? "Active" : "Hidden"}
              </button>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
            </motion.div>
          ))}
        </div>
      )}
    </AdminPageWrapper>
  );
};

export default AdminCycles;
