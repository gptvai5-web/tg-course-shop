import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, BookOpen, X, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  price: number;
  original_price: number | null;
  image_url: string;
  instructor_name: string;
  lessons_count: number;
  is_active: boolean;
  slug: string | null;
  has_cycles: boolean;
}

const emptyForm = {
  title: "", description: "", category: "", level: "Beginner", duration: "",
  price: "", original_price: "", image_url: "", instructor_name: "", lessons_count: "0", slug: "",
  has_cycles: false,
};

const TeacherManageCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [levels, setLevels] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: coursesData }, { data: catsData }, { data: levelsData }] = await Promise.all([
      supabase.from("courses").select("*").order("display_order"),
      supabase.from("course_categories").select("id, name").eq("is_active", true).order("display_order"),
      (supabase.from as any)("course_levels").select("id, name").eq("is_active", true).order("display_order"),
    ]);
    setCourses((coursesData as Course[]) || []);
    setCategories(catsData || []);
    setLevels(levelsData || []);
    setLoading(false);
  };

  const openNew = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (c: Course) => {
    setEditId(c.id);
    setForm({
      title: c.title, description: c.description, category: c.category, level: c.level,
      duration: c.duration, price: String(c.price), original_price: c.original_price ? String(c.original_price) : "",
      image_url: c.image_url, instructor_name: c.instructor_name, lessons_count: String(c.lessons_count),
      slug: c.slug || "",
      has_cycles: c.has_cycles || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast({ title: "Error", description: "Title required", variant: "destructive" }); return; }
    const payload = {
      title: form.title, description: form.description, category: form.category, level: form.level,
      duration: form.duration, price: Number(form.price) || 0, original_price: form.original_price ? Number(form.original_price) : null,
      image_url: form.image_url, instructor_name: form.instructor_name, lessons_count: Number(form.lessons_count) || 0,
      slug: form.slug.trim() || null,
      has_cycles: form.has_cycles,
    };
    if (editId) {
      const { error } = await supabase.from("courses").update(payload).eq("id", editId);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Course updated" });
    } else {
      const { error } = await supabase.from("courses").insert({ ...payload, display_order: courses.length });
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Course created" });
    }
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this course?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Course deleted" });
    fetchData();
  };

  const handleToggle = async (id: string, active: boolean) => {
    await supabase.from("courses").update({ is_active: !active }).eq("id", id);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8 transition-all duration-300">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6 md:mb-8">
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold">Manage Courses</h1>
            <p className="text-muted-foreground text-sm mt-1">Create and manage courses, subjects, chapters and videos</p>
          </div>
          <Button onClick={openNew} className="gap-2 rounded-xl"><Plus className="w-4 h-4" /> Create Course</Button>
        </motion.div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editId ? "Edit Course" : "Create Course"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Title *</label>
                <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Description</label>
                <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Category</label>
                  <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Level</label>
                  <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {levels.map(l => <SelectItem key={l.id} value={l.name}>{l.name}</SelectItem>)}
                      {levels.length === 0 && <>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </>}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Price (৳)</label>
                  <Input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Original Price (৳)</label>
                  <Input type="number" value={form.original_price} onChange={e => setForm({ ...form, original_price: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Duration</label>
                  <Input value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} placeholder="e.g. 20 hours" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Lessons Count</label>
                  <Input type="number" value={form.lessons_count} onChange={e => setForm({ ...form, lessons_count: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Instructor Name</label>
                <Input value={form.instructor_name} onChange={e => setForm({ ...form, instructor_name: e.target.value })} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Image URL</label>
                <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Course Slug (URL)</label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground shrink-0">/course/</span>
                  <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })} placeholder="e.g. basic-to-pro" />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Leave empty for auto-generated URL</p>
              </div>
              <div className="flex items-center justify-between p-3 border border-border rounded-xl bg-muted/20 mt-2">
                <div>
                  <h4 className="text-sm font-bold">Enable Cycle System</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Allow students to purchase modules (cycles) separately</p>
                </div>
                <Switch 
                  checked={form.has_cycles} 
                  onCheckedChange={(c) => setForm({ ...form, has_cycles: c })} 
                />
              </div>
              <Button onClick={handleSave} className="w-full mt-4">{editId ? "Update" : "Create"} Course</Button>
            </div>
          </DialogContent>
        </Dialog>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse border border-border" />)}</div>
        ) : courses.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No courses yet. Create your first course!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4"
              >
                <img src={c.image_url || "/placeholder.svg"} alt="" className="w-16 h-12 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground">{c.category} · {c.level} · ৳{c.price}</p>
                </div>
                <button
                  onClick={() => handleToggle(c.id, c.is_active)}
                  className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${c.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}
                >
                  {c.is_active ? "Active" : "Hidden"}
                </button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive shrink-0" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherManageCourses;
