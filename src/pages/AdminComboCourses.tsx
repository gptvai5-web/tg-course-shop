import { useEffect, useState } from "react";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ComboCourse { id: string; title: string; description: string; price: number; original_price: number | null; image_url: string; category: string; is_active: boolean; display_order: number; }
interface Course { id: string; title: string; category: string; }
interface Category { id: string; name: string; }

const emptyForm = { title: "", description: "", price: "", original_price: "", image_url: "", category: "", offer_end_date: "", offer_label: "", slug: "" };

const AdminComboCourses = () => {
  const [combos, setCombos] = useState<ComboCourse[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedCourseIds, setSelectedCourseIds] = useState<Set<string>>(new Set());

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [{ data: combosData }, { data: coursesData }, { data: catsData }] = await Promise.all([
      (supabase.from as any)("combo_courses").select("*").order("display_order"),
      supabase.from("courses").select("id, title, category").order("title"),
      supabase.from("course_categories").select("id, name").eq("is_active", true).order("display_order"),
    ]);
    setCombos(combosData || []);
    setCourses((coursesData as Course[]) || []);
    setCategories(catsData || []);
    setLoading(false);
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setSelectedCourseIds(new Set()); setDialogOpen(true); };

  const openEdit = async (c: ComboCourse) => {
    setEditId(c.id);
    setForm({ title: c.title, description: c.description, price: String(c.price), original_price: c.original_price ? String(c.original_price) : "", image_url: c.image_url, category: c.category, offer_end_date: (c as any).offer_end_date || "", offer_label: (c as any).offer_label || "", slug: (c as any).slug || "" });
    const { data: items } = await (supabase.from as any)("combo_course_items").select("course_id").eq("combo_id", c.id);
    setSelectedCourseIds(new Set((items || []).map((i: any) => i.course_id)));
    setDialogOpen(true);
  };

  const toggleCourse = (courseId: string) => {
    setSelectedCourseIds((prev) => { const next = new Set(prev); if (next.has(courseId)) next.delete(courseId); else next.add(courseId); return next; });
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: "Error", description: "Title required", variant: "destructive" }); return; }
    if (selectedCourseIds.size < 2) { toast({ title: "Error", description: "Select at least 2 courses", variant: "destructive" }); return; }
    const payload = { title: form.title, description: form.description, price: Number(form.price) || 0, original_price: form.original_price ? Number(form.original_price) : null, image_url: form.image_url, category: form.category, offer_end_date: form.offer_end_date || null, offer_label: form.offer_label || null, slug: form.slug || null };
    let comboId = editId;
    if (editId) {
      const { error } = await (supabase.from as any)("combo_courses").update(payload).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    } else {
      const { data, error } = await (supabase.from as any)("combo_courses").insert({ ...payload, display_order: combos.length }).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      comboId = data.id;
    }
    await (supabase.from as any)("combo_course_items").delete().eq("combo_id", comboId);
    const items = Array.from(selectedCourseIds).map((course_id) => ({ combo_id: comboId, course_id }));
    if (items.length > 0) await (supabase.from as any)("combo_course_items").insert(items);
    toast({ title: editId ? "Combo updated" : "Combo created" });
    setDialogOpen(false); fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this combo course?")) return;
    await (supabase.from as any)("combo_courses").delete().eq("id", id);
    toast({ title: "Combo deleted" }); fetchData();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await (supabase.from as any)("combo_courses").update({ is_active: !active }).eq("id", id); fetchData();
  };

  return (
    <AdminPageWrapper
      title="Combo Courses"
      subtitle="Bundle multiple courses together at a special price"
      icon={Package}
      headerAction={<Button onClick={openNew} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Create Combo</Button>}
    >
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Combo" : "Create Combo"}</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div><label className="text-sm font-medium mb-1 block">Title *</label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="rounded-xl" /></div>
            <div><label className="text-sm font-medium mb-1 block">Description</label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div><label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium mb-1 block">Combo Price (৳)</label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="rounded-xl" /></div>
              <div><label className="text-sm font-medium mb-1 block">Original Price (৳)</label><Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} className="rounded-xl" /></div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Image URL</label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} className="rounded-xl" /></div>
            <div><label className="text-sm font-medium mb-1 block">Slug (URL)</label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} placeholder="e.g. ssc27-combo" className="rounded-xl" /></div>
            <div><label className="text-sm font-medium mb-1 block">Offer End Date</label><Input type="datetime-local" value={form.offer_end_date} onChange={(e) => setForm({ ...form, offer_end_date: e.target.value })} className="rounded-xl" /></div>
            <div><label className="text-sm font-medium mb-1 block">Offer Label</label><Input value={form.offer_label} onChange={(e) => setForm({ ...form, offer_label: e.target.value })} placeholder="e.g. এই কুপন কোড ইউজ করুন..." className="rounded-xl" /></div>
            <div>
              <label className="text-sm font-medium mb-2 block">Select Courses * (min 2)</label>
              <div className="border border-border/30 rounded-xl max-h-60 overflow-y-auto divide-y divide-border/20">
                {courses.map((course) => (
                  <label key={course.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 cursor-pointer transition-colors">
                    <Checkbox checked={selectedCourseIds.has(course.id)} onCheckedChange={() => toggleCourse(course.id)} />
                    <div className="min-w-0"><p className="text-sm font-medium truncate">{course.title}</p><p className="text-xs text-muted-foreground">{course.category}</p></div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{selectedCourseIds.size} courses selected</p>
            </div>
            <Button onClick={handleSave} className="w-full rounded-xl">{editId ? "Update" : "Create"} Combo</Button>
          </div>
        </DialogContent>
      </Dialog>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : combos.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No combo courses yet. Create your first combo!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {combos.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-card rounded-2xl p-4 flex items-center gap-4 hover:shadow-lg transition-shadow"
            >
              <img src={c.image_url || "/placeholder.svg"} alt="" className="w-16 h-12 rounded-xl object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground">{c.category} · ৳{c.price}</p>
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

export default AdminComboCourses;
