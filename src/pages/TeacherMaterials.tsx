import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Paperclip, Plus, Trash2, Edit2, Save, X, ChevronRight, FileText, StickyNote, ClipboardList, CheckSquare } from "lucide-react";
import { toast } from "sonner";

interface Course { id: string; title: string; offer_end_date: string | null; offer_label: string | null; }
interface Subject { id: string; name: string; }
interface Chapter { id: string; name: string; }
interface Material {
  id: string; chapter_id: string; material_type: string; title: string;
  url: string; is_active: boolean; display_order: number;
}

const MATERIAL_TYPES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  lecture_sheet: { label: "Lecture Sheet", icon: FileText, color: "bg-blue-500" },
  note: { label: "Note", icon: StickyNote, color: "bg-orange-500" },
  practice_sheet: { label: "Practice Sheet", icon: ClipboardList, color: "bg-emerald-500" },
  solve_sheet: { label: "Solve Sheet", icon: CheckSquare, color: "bg-purple-500" },
};

const TeacherMaterials = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  // Form
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Material | null>(null);
  const [formType, setFormType] = useState("lecture_sheet");
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");

  // Offer timer form
  const [offerDate, setOfferDate] = useState("");
  const [offerLabel, setOfferLabel] = useState("Discount Offer Ends In:");

  useEffect(() => {
    supabase.from("courses").select("id, title, offer_end_date, offer_label").eq("is_active", true).order("display_order")
      .then(({ data }) => { setCourses((data as Course[]) || []); setLoading(false); });
  }, []);

  const openCourse = (c: Course) => {
    setSelectedCourse(c);
    setOfferDate(c.offer_end_date ? c.offer_end_date.slice(0, 16) : "");
    setOfferLabel(c.offer_label || "Discount Offer Ends In:");
    (supabase.from as any)("subjects").select("id, name").eq("course_id", c.id).eq("is_active", true).order("display_order")
      .then(({ data }: any) => setSubjects(data || []));
  };

  const openSubject = (s: Subject) => {
    setSelectedSubject(s);
    (supabase.from as any)("chapters").select("id, name").eq("subject_id", s.id).eq("is_active", true).order("display_order")
      .then(({ data }: any) => setChapters(data || []));
  };

  const openChapter = (ch: Chapter) => {
    setSelectedChapter(ch);
    fetchMaterials(ch.id);
  };

  const fetchMaterials = (chapterId: string) => {
    setLoading(true);
    (supabase.from as any)("chapter_materials").select("*").eq("chapter_id", chapterId).order("display_order")
      .then(({ data }: any) => { setMaterials(data || []); setLoading(false); });
  };

  const goBack = () => {
    if (selectedChapter) { setSelectedChapter(null); setMaterials([]); resetForm(); }
    else if (selectedSubject) { setSelectedSubject(null); setChapters([]); }
    else { setSelectedCourse(null); setSubjects([]); }
  };

  const resetForm = () => { setShowForm(false); setEditItem(null); setFormTitle(""); setFormUrl(""); setFormType("lecture_sheet"); };

  const startEdit = (item: Material) => {
    setEditItem(item); setFormType(item.material_type); setFormTitle(item.title); setFormUrl(item.url); setShowForm(true);
  };

  const handleSave = async () => {
    if (!formTitle.trim() || !formUrl.trim()) return;
    const payload = { material_type: formType, title: formTitle, url: formUrl, is_active: true };
    if (editItem) {
      await (supabase.from as any)("chapter_materials").update(payload).eq("id", editItem.id);
      toast.success("Updated");
    } else {
      await (supabase.from as any)("chapter_materials").insert({
        ...payload, chapter_id: selectedChapter!.id, display_order: materials.length,
      });
      toast.success("Created");
    }
    resetForm(); fetchMaterials(selectedChapter!.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this material?")) return;
    await (supabase.from as any)("chapter_materials").delete().eq("id", id);
    toast.success("Deleted"); fetchMaterials(selectedChapter!.id);
  };

  const saveOffer = async () => {
    if (!selectedCourse) return;
    await supabase.from("courses").update({
      offer_end_date: offerDate || null,
      offer_label: offerLabel || "Discount Offer Ends In:",
    } as any).eq("id", selectedCourse.id);
    toast.success("Offer timer updated");
  };

  // Course list
  if (!selectedCourse) {
    return (
      <AdminPageWrapper title="Course Materials & Offers" icon={Paperclip}>
        <p className="text-sm text-muted-foreground mb-6 -mt-4">Manage materials per chapter and offer timers per course</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />) :
            courses.map((c, i) => (
              <motion.button key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => openCourse(c)} className="glass-card rounded-2xl p-5 text-left hover:shadow-lg transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center"><Paperclip className="w-5 h-5 text-primary" /></div>
                  <div className="flex-1 min-w-0"><p className="font-display font-bold text-sm truncate group-hover:text-primary transition-colors">{c.title}</p></div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </motion.button>
            ))}
        </div>
      </AdminPageWrapper>
    );
  }

  // Subject list
  if (!selectedSubject) {
    return (
      <AdminPageWrapper title={selectedCourse.title} icon={Paperclip}>
        <Button variant="ghost" onClick={goBack} className="gap-2 mb-4 rounded-xl text-sm -mt-4"><X className="w-4 h-4" /> Back</Button>

        {/* Offer Timer Settings */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <h3 className="font-display font-bold text-sm mb-4">⏰ Offer Timer</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Offer Label</label>
              <Input value={offerLabel} onChange={e => setOfferLabel(e.target.value)} className="rounded-xl bg-background/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">End Date & Time</label>
              <Input type="datetime-local" value={offerDate} onChange={e => setOfferDate(e.target.value)} className="rounded-xl bg-background/50" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={saveOffer} className="gap-2 rounded-xl text-sm"><Save className="w-4 h-4" /> Save Offer</Button>
            {offerDate && <Button variant="outline" className="rounded-xl text-sm" onClick={() => { setOfferDate(""); saveOffer(); }}>Remove Timer</Button>}
          </div>
        </div>

        <h3 className="font-display font-bold text-sm mb-3">Select Subject</h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {subjects.map((s, i) => (
            <motion.button key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => openSubject(s)} className="glass-card rounded-2xl p-4 text-left hover:shadow-lg transition-all group">
              <div className="flex items-center gap-3">
                <div className="flex-1"><p className="font-display font-bold text-sm group-hover:text-primary transition-colors">{s.name}</p></div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.button>
          ))}
        </div>
      </AdminPageWrapper>
    );
  }

  // Chapter list
  if (!selectedChapter) {
    return (
      <AdminPageWrapper title={selectedSubject.name} icon={Paperclip}>
        <Button variant="ghost" onClick={goBack} className="gap-2 mb-4 rounded-xl text-sm -mt-4"><X className="w-4 h-4" /> Back to Subjects</Button>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {chapters.map((ch, i) => (
            <motion.button key={ch.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => openChapter(ch)} className="glass-card rounded-2xl p-4 text-left hover:shadow-lg transition-all group">
              <div className="flex items-center gap-3">
                <div className="flex-1"><p className="font-display font-bold text-sm group-hover:text-primary transition-colors">{ch.name}</p></div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </motion.button>
          ))}
        </div>
      </AdminPageWrapper>
    );
  }

  // Materials management
  return (
    <AdminPageWrapper title={selectedChapter.name} icon={Paperclip}>
      <Button variant="ghost" onClick={goBack} className="gap-2 mb-4 rounded-xl text-sm -mt-4"><X className="w-4 h-4" /> Back to Chapters</Button>

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl text-sm mb-4">
          <Plus className="w-4 h-4" /> Add Material
        </Button>
      )}

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-sm">{editItem ? "Edit" : "New"} Material</h3>
            <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
              <div className="flex gap-2 flex-wrap">
                {Object.entries(MATERIAL_TYPES).map(([key, cfg]) => (
                  <button key={key} onClick={() => setFormType(key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      formType === key ? `${cfg.color} text-white` : "glass-card text-muted-foreground"
                    }`}>
                    <cfg.icon className="w-3.5 h-3.5" /> {cfg.label}
                  </button>
                ))}
              </div>
            </div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
              <Input value={formTitle} onChange={e => setFormTitle(e.target.value)} placeholder="e.g. Lecture Sheet" className="rounded-xl bg-background/50" /></div>
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">URL (PDF/Image/Drive link)</label>
              <Input value={formUrl} onChange={e => setFormUrl(e.target.value)} placeholder="https://..." className="rounded-xl bg-background/50" /></div>
            <div className="flex gap-2">
              <Button onClick={handleSave} className="gap-2 rounded-xl"><Save className="w-4 h-4" /> {editItem ? "Update" : "Create"}</Button>
              <Button variant="outline" onClick={resetForm} className="rounded-xl">Cancel</Button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-3">
        {materials.length === 0 && !showForm ? (
          <div className="text-center py-16 text-muted-foreground">
            <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No materials yet. Add lecture sheets, notes, practice sheets.</p>
          </div>
        ) : materials.map((item, i) => {
          const cfg = MATERIAL_TYPES[item.material_type] || MATERIAL_TYPES.lecture_sheet;
          return (
            <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`glass-card rounded-2xl p-4 transition-all ${!item.is_active ? "opacity-50" : ""}`}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-10 h-10 rounded-xl ${cfg.color} flex items-center justify-center shrink-0`}>
                    <cfg.icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{cfg.label}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(item)}><Edit2 className="w-3.5 h-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </AdminPageWrapper>
  );
};

export default TeacherMaterials;
