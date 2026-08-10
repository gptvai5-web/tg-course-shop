import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Megaphone, Plus, Trash2, Edit2, Save, X, Bell, Users, Calendar, ChevronRight } from "lucide-react";
import { toast } from "sonner";

interface Course { id: string; title: string; }
interface CourseUpdate {
  id: string; course_id: string; update_type: string; title: string;
  content: string; url: string | null; is_active: boolean; display_order: number; created_at: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; placeholder: string; hasUrl: boolean; urlLabel?: string }> = {
  notice: { label: "Notice", icon: Bell, color: "bg-amber-500", placeholder: "Write your notice message...", hasUrl: false },
  announcement: { label: "Announcement", icon: Megaphone, color: "bg-primary", placeholder: "Write announcement text...", hasUrl: false },
  group: { label: "Group Link", icon: Users, color: "bg-green-500", placeholder: "Group description...", hasUrl: true, urlLabel: "Telegram/Facebook Group URL" },
  routine: { label: "Routine", icon: Calendar, color: "bg-purple-500", placeholder: "Routine description...", hasUrl: true, urlLabel: "PDF or Image URL" },
};

const TeacherCourseUpdates = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [updates, setUpdates] = useState<CourseUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<CourseUpdate | null>(null);
  const [formType, setFormType] = useState("announcement");
  const [formTitle, setFormTitle] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [activeTab, setActiveTab] = useState("notice");

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => {
    setLoading(true);
    const { data } = await supabase.from("courses").select("id, title").eq("is_active", true).order("display_order");
    setCourses(data || []);
    setLoading(false);
  };

  const fetchUpdates = async (courseId: string) => {
    setLoading(true);
    const { data } = await (supabase.from as any)("course_updates").select("*").eq("course_id", courseId).order("display_order");
    setUpdates((data as CourseUpdate[]) || []);
    setLoading(false);
  };

  const openCourse = (c: Course) => { setSelectedCourse(c); fetchUpdates(c.id); };
  const goBack = () => { setSelectedCourse(null); setUpdates([]); resetForm(); };

  const resetForm = () => {
    setShowForm(false); setEditItem(null); setFormTitle(""); setFormContent(""); setFormUrl(""); setFormType(activeTab);
  };

  const startEdit = (item: CourseUpdate) => {
    setEditItem(item); setFormType(item.update_type); setFormTitle(item.title);
    setFormContent(item.content); setFormUrl(item.url || ""); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formContent.trim() && !formTitle.trim()) return;
    const payload = {
      update_type: formType, title: formTitle, content: formContent,
      url: formUrl || null, is_active: true,
    };
    if (editItem) {
      await (supabase.from as any)("course_updates").update(payload).eq("id", editItem.id);
      toast.success("Updated");
    } else {
      await (supabase.from as any)("course_updates").insert({
        ...payload, course_id: selectedCourse!.id, display_order: updates.filter(u => u.update_type === formType).length,
      });
      toast.success("Created");
    }
    resetForm(); fetchUpdates(selectedCourse!.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    await (supabase.from as any)("course_updates").delete().eq("id", id);
    toast.success("Deleted"); fetchUpdates(selectedCourse!.id);
  };

  const toggleActive = async (item: CourseUpdate) => {
    await (supabase.from as any)("course_updates").update({ is_active: !item.is_active }).eq("id", item.id);
    fetchUpdates(selectedCourse!.id);
  };

  const filteredUpdates = updates.filter(u => u.update_type === activeTab);
  const config = TYPE_CONFIG[activeTab];

  if (!selectedCourse) {
    return (
      <AdminPageWrapper title="Course Updates Manager" icon={Megaphone}>
        <p className="text-sm text-muted-foreground mb-6 -mt-4">Manage notices, announcements, group links, and routines per course</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />) : courses.map((c, i) => (
            <motion.button key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => openCourse(c)} className="glass-card rounded-2xl p-5 text-left hover:shadow-lg transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Megaphone className="w-5 h-5 text-primary" /></div>
                <div className="flex-1 min-w-0"><p className="font-display font-bold text-sm truncate group-hover:text-primary transition-colors">{c.title}</p><p className="text-xs text-muted-foreground">Manage updates</p></div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title={selectedCourse.title} icon={Megaphone}>
      <Button variant="ghost" onClick={goBack} className="gap-2 mb-4 rounded-xl text-sm -mt-4"><X className="w-4 h-4" /> Back to Courses</Button>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
          <button key={key} onClick={() => { setActiveTab(key); resetForm(); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === key ? `${cfg.color} text-white shadow-lg` : "glass-card text-muted-foreground hover:text-foreground"
            }`}>
            <cfg.icon className="w-4 h-4" /> {cfg.label}
          </button>
        ))}
      </div>

      {/* Add button */}
      {!showForm && (
        <Button onClick={() => { setFormType(activeTab); setShowForm(true); }} className="gap-2 rounded-xl text-sm mb-4">
          <Plus className="w-4 h-4" /> Add {config.label}
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm">{editItem ? "Edit" : "New"} {config.label}</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-4">
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder={`${config.label} title...`} className="rounded-xl bg-background/50" /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Content</label>
              <textarea value={formContent} onChange={e => setFormContent(e.target.value)} placeholder={config.placeholder}
                className="w-full min-h-[100px] rounded-xl border border-border/30 bg-background/50 px-3 py-2 text-sm" /></div>
            {config.hasUrl && (
              <div><label className="text-xs font-medium text-muted-foreground mb-1 block">{config.urlLabel}</label>
                <Input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://..." className="rounded-xl bg-background/50" /></div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSave} className="gap-2 rounded-xl"><Save className="w-4 h-4" /> {editItem ? "Update" : "Create"}</Button>
              <Button variant="outline" onClick={resetForm} className="rounded-xl">Cancel</Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* List */}
      <div className="space-y-3">
        {filteredUpdates.length === 0 && !showForm ? (
          <div className="text-center py-16 text-muted-foreground">
            <config.icon className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No {config.label.toLowerCase()}s yet</p>
          </div>
        ) : filteredUpdates.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
            className={`glass-card rounded-2xl p-5 transition-all ${!item.is_active ? "opacity-50" : ""}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-xl ${config.color}/10 flex items-center justify-center shrink-0`}>
                  <config.icon className={`w-5 h-5`} style={{ color: config.color.replace("bg-", "") }} />
                </div>
                <div className="min-w-0">
                  {item.title && <p className="font-display font-bold text-sm">{item.title}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.content}</p>
                  {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline mt-1 block truncate">{item.url}</a>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleActive(item)} title={item.is_active ? "Deactivate" : "Activate"}>
                  <div className={`w-3 h-3 rounded-full ${item.is_active ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(item)}><Edit2 className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </AdminPageWrapper>
  );
};

export default TeacherCourseUpdates;
