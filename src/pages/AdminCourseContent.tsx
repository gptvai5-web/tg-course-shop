import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { BookOpen, Plus, Trash2, Edit2, ChevronRight, Video, ArrowLeft, Save, X, FileText, StickyNote, ClipboardList, CheckSquare, Paperclip, Clock, Tag } from "lucide-react";
import { toast } from "sonner";

interface Course { id: string; title: string; offer_end_date: string | null; offer_label: string | null; }
interface Subject { id: string; course_id: string; name: string; color: string; display_order: number; is_active: boolean; }
interface Chapter { id: string; subject_id: string; name: string; color: string; display_order: number; is_active: boolean; cycle_id?: string | null; }
interface ChapterVideo { id: string; chapter_id: string; title: string; video_url: string; description: string | null; display_order: number; is_active: boolean; }
interface Material { id: string; chapter_id: string; material_type: string; title: string; url: string; is_active: boolean; display_order: number; }

type View = "courses" | "subjects" | "chapters" | "videos";

const MATERIAL_TYPES: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  lecture_sheet: { label: "Lecture Sheet", icon: FileText, color: "bg-blue-500" },
  note: { label: "Note", icon: StickyNote, color: "bg-orange-500" },
  practice_sheet: { label: "Practice Sheet", icon: ClipboardList, color: "bg-emerald-500" },
  solve_sheet: { label: "Solve Sheet", icon: CheckSquare, color: "bg-purple-500" },
};

const AdminCourseContent = () => {
  const [view, setView] = useState<View>("courses");
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [cycles, setCycles] = useState<{id: string, title: string}[]>([]);
  const [videos, setVideos] = useState<ChapterVideo[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#3B82F6");
  const [formVideoUrl, setFormVideoUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEmbedCode, setFormEmbedCode] = useState("");
  const [formCycleId, setFormCycleId] = useState<string>("none");

  // Material form
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [matType, setMatType] = useState("lecture_sheet");
  const [matTitle, setMatTitle] = useState("");
  const [matUrl, setMatUrl] = useState("");

  // Offer timer
  const [offerEndDate, setOfferEndDate] = useState("");
  const [offerLabel, setOfferLabel] = useState("");
  const [savingOffer, setSavingOffer] = useState(false);

  useEffect(() => { fetchCourses(); }, []);

  const fetchCourses = async () => { setLoading(true); const { data } = await supabase.from("courses").select("id, title, offer_end_date, offer_label").eq("is_active", true).order("display_order"); setCourses((data as Course[]) || []); setLoading(false); };
  const fetchSubjects = async (courseId: string) => { setLoading(true); const { data } = await (supabase.from as any)("subjects").select("*").eq("course_id", courseId).order("display_order"); setSubjects((data as Subject[]) || []); setLoading(false); };
  const fetchChapters = async (subjectId: string) => { setLoading(true); const { data } = await (supabase.from as any)("chapters").select("*").eq("subject_id", subjectId).order("display_order"); setChapters((data as Chapter[]) || []); setLoading(false); };
  const fetchVideos = async (chapterId: string) => { setLoading(true); const { data } = await (supabase.from as any)("chapter_videos").select("*").eq("chapter_id", chapterId).order("display_order"); setVideos((data as ChapterVideo[]) || []); setLoading(false); };
  const fetchMaterials = async (chapterId: string) => { const { data } = await (supabase.from as any)("chapter_materials").select("*").eq("chapter_id", chapterId).order("display_order"); setMaterials((data as Material[]) || []); };
  const fetchCycles = async (courseId: string) => { const { data } = await supabase.from("cycles").select("id, title").eq("course_id", courseId).eq("is_active", true); setCycles(data || []); };

  const openCourse = (c: Course) => { setSelectedCourse(c); setView("subjects"); fetchSubjects(c.id); fetchCycles(c.id); setOfferEndDate(c.offer_end_date || ""); setOfferLabel(c.offer_label || ""); };
  const openSubject = (s: Subject) => { setSelectedSubject(s); setView("chapters"); fetchChapters(s.id); };
  const openChapter = (ch: Chapter) => { setSelectedChapter(ch); setView("videos"); fetchVideos(ch.id); fetchMaterials(ch.id); };
  const goBack = () => { resetForm(); resetMaterialForm(); if (view === "videos") { setView("chapters"); setSelectedChapter(null); setMaterials([]); } else if (view === "chapters") { setView("subjects"); setSelectedSubject(null); } else if (view === "subjects") { setView("courses"); setSelectedCourse(null); setCycles([]); } };
  const resetForm = () => { setShowForm(false); setEditItem(null); setFormName(""); setFormColor("#3B82F6"); setFormVideoUrl(""); setFormDescription(""); setFormEmbedCode(""); setFormCycleId("none"); };
  const resetMaterialForm = () => { setShowMaterialForm(false); setEditMaterial(null); setMatTitle(""); setMatUrl(""); setMatType("lecture_sheet"); };

  const handleSaveOffer = async () => {
    if (!selectedCourse) return;
    setSavingOffer(true);
    const { error } = await supabase.from("courses").update({
      offer_end_date: offerEndDate || null,
      offer_label: offerLabel || null,
    }).eq("id", selectedCourse.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Offer timer updated!");
      setSelectedCourse({ ...selectedCourse, offer_end_date: offerEndDate || null, offer_label: offerLabel || null });
    }
    setSavingOffer(false);
  };

  const handleRemoveOffer = async () => {
    if (!selectedCourse) return;
    setSavingOffer(true);
    await supabase.from("courses").update({ offer_end_date: null, offer_label: null }).eq("id", selectedCourse.id);
    setOfferEndDate(""); setOfferLabel("");
    setSelectedCourse({ ...selectedCourse, offer_end_date: null, offer_label: null });
    toast.success("Offer timer removed");
    setSavingOffer(false);
  };
  const startEdit = (item: any) => { setEditItem(item); setFormName(item.name || item.title || ""); setFormColor(item.color || "#3B82F6"); setFormVideoUrl(item.video_url || ""); setFormDescription(item.description || ""); setFormEmbedCode(item.embed_code || ""); setFormCycleId(item.cycle_id || "none"); setShowForm(true); };
  const startEditMaterial = (item: Material) => { setEditMaterial(item); setMatType(item.material_type); setMatTitle(item.title); setMatUrl(item.url); setShowMaterialForm(true); };

  const handleSaveSubject = async () => {
    if (!formName.trim()) return;
    if (editItem) { await (supabase.from as any)("subjects").update({ name: formName, color: formColor }).eq("id", editItem.id); toast.success("Subject updated"); }
    else { await (supabase.from as any)("subjects").insert({ course_id: selectedCourse!.id, name: formName, color: formColor, display_order: subjects.length }); toast.success("Subject created"); }
    resetForm(); fetchSubjects(selectedCourse!.id);
  };
  const handleSaveChapter = async () => {
    if (!formName.trim()) return;
    const cycleVal = formCycleId === "none" ? null : formCycleId;
    if (editItem) { await (supabase.from as any)("chapters").update({ name: formName, color: formColor, cycle_id: cycleVal }).eq("id", editItem.id); toast.success("Chapter updated"); }
    else { await (supabase.from as any)("chapters").insert({ subject_id: selectedSubject!.id, name: formName, color: formColor, cycle_id: cycleVal, display_order: chapters.length }); toast.success("Chapter created"); }
    resetForm(); fetchChapters(selectedSubject!.id);
  };
  const handleSaveVideo = async () => {
    if (!formName.trim()) return;
    if (!formVideoUrl.trim() && !formEmbedCode.trim()) { toast.error("Please provide a Video URL or Embed Code"); return; }
    const payload = { title: formName, video_url: formVideoUrl || "", description: formDescription || null, embed_code: formEmbedCode || null };
    if (editItem) { await (supabase.from as any)("chapter_videos").update(payload).eq("id", editItem.id); toast.success("Video updated"); }
    else { await (supabase.from as any)("chapter_videos").insert({ ...payload, chapter_id: selectedChapter!.id, display_order: videos.length }); toast.success("Video created"); }
    resetForm(); fetchVideos(selectedChapter!.id);
  };

  const handleSaveMaterial = async () => {
    if (!matTitle.trim() || !matUrl.trim()) return;
    const payload = { material_type: matType, title: matTitle, url: matUrl, is_active: true };
    if (editMaterial) {
      await (supabase.from as any)("chapter_materials").update(payload).eq("id", editMaterial.id);
      toast.success("Material updated");
    } else {
      await (supabase.from as any)("chapter_materials").insert({ ...payload, chapter_id: selectedChapter!.id, display_order: materials.length });
      toast.success("Material created");
    }
    resetMaterialForm(); fetchMaterials(selectedChapter!.id);
  };

  const handleDelete = async (table: string, id: string, refreshFn: () => void) => {
    if (!confirm("Are you sure you want to delete this?")) return;
    await supabase.from(table as any).delete().eq("id", id);
    toast.success("Deleted"); refreshFn();
  };

  const breadcrumb = () => {
    const parts: string[] = ["Courses"];
    if (selectedCourse) parts.push(selectedCourse.title);
    if (selectedSubject) parts.push(selectedSubject.name);
    if (selectedChapter) parts.push(selectedChapter.name);
    return parts;
  };

  const renderForm = () => {
    const isVideo = view === "videos";
    return (
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-sm">{editItem ? "Edit" : "Create New"} {view === "subjects" ? "Subject" : view === "chapters" ? "Chapter" : "Video"}</h3>
          <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="text-xs font-medium text-muted-foreground mb-1 block">{isVideo ? "Title" : "Name"}</label><Input value={formName} onChange={e => setFormName(e.target.value)} className="rounded-xl bg-background/50" /></div>
          {!isVideo && (
            <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Color</label>
              <div className="flex items-center gap-3">
                <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className="w-10 h-10 rounded-lg border border-border/30 cursor-pointer" />
                <Input value={formColor} onChange={e => setFormColor(e.target.value)} className="flex-1 rounded-xl bg-background/50" />
              </div>
              <div className="flex gap-2 mt-2 flex-wrap">
                {["#E91E63", "#2979FF", "#00E5A0", "#FF6D00", "#AA00FF", "#FFD600"].map(c => (
                  <button key={c} onClick={() => setFormColor(c)} className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${formColor === c ? "border-foreground shadow-lg" : "border-transparent"}`} style={{ backgroundColor: c }} title={c} />
                ))}
              </div>
            </div>
          )}
          {isVideo && (<div><label className="text-xs font-medium text-muted-foreground mb-1 block">Video URL <span className="text-muted-foreground/50">(optional if embed code provided)</span></label><Input value={formVideoUrl} onChange={e => setFormVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="rounded-xl bg-background/50" /></div>)}
        </div>
        {isVideo && (
          <div className="mt-4">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Embed Code <span className="text-muted-foreground/50">(paste iframe embed code from YouTube/others)</span></label>
            <textarea value={formEmbedCode} onChange={e => setFormEmbedCode(e.target.value)} placeholder='<iframe src="https://www.youtube.com/embed/..." ...></iframe>' className="w-full min-h-[100px] rounded-xl border border-border/30 bg-background/50 px-3 py-2 text-sm font-mono" />
          </div>
        )}
        {isVideo && (<div className="mt-4"><label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label><textarea value={formDescription} onChange={e => setFormDescription(e.target.value)} className="w-full min-h-[100px] rounded-xl border border-border/30 bg-background/50 px-3 py-2 text-sm" /></div>)}
        {view === "chapters" && cycles.length > 0 && (
          <div className="mt-4">
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Assign to Cycle (Optional)</label>
            <Select value={formCycleId} onValueChange={setFormCycleId}>
              <SelectTrigger className="w-full bg-background/50 rounded-xl"><SelectValue placeholder="No Cycle" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Cycle (Available to all enrolled)</SelectItem>
                {cycles.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="mt-4 flex gap-2">
          <Button onClick={view === "subjects" ? handleSaveSubject : view === "chapters" ? handleSaveChapter : handleSaveVideo} className="gap-2 rounded-xl"><Save className="w-4 h-4" /> {editItem ? "Update" : "Create"}</Button>
          <Button variant="outline" onClick={resetForm} className="rounded-xl">Cancel</Button>
        </div>
      </motion.div>
    );
  };

  const renderMaterialForm = () => (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-sm">{editMaterial ? "Edit" : "New"} Material</h3>
        <Button variant="ghost" size="icon" onClick={resetMaterialForm}><X className="w-4 h-4" /></Button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(MATERIAL_TYPES).map(([key, cfg]) => (
              <button key={key} onClick={() => setMatType(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  matType === key ? `${cfg.color} text-white` : "glass-card text-muted-foreground"
                }`}>
                <cfg.icon className="w-3.5 h-3.5" /> {cfg.label}
              </button>
            ))}
          </div>
        </div>
        <div><label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
          <Input value={matTitle} onChange={e => setMatTitle(e.target.value)} placeholder="e.g. Lecture Sheet 1" className="rounded-xl bg-background/50" /></div>
        <div><label className="text-xs font-medium text-muted-foreground mb-1 block">URL (PDF/Image/Drive link)</label>
          <Input value={matUrl} onChange={e => setMatUrl(e.target.value)} placeholder="https://..." className="rounded-xl bg-background/50" /></div>
        <div className="flex gap-2">
          <Button onClick={handleSaveMaterial} className="gap-2 rounded-xl"><Save className="w-4 h-4" /> {editMaterial ? "Update" : "Create"}</Button>
          <Button variant="outline" onClick={resetMaterialForm} className="rounded-xl">Cancel</Button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <AdminPageWrapper title="Course Content Manager" icon={BookOpen}>
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4 flex-wrap -mt-4">
        {breadcrumb().map((part, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3" />}
            <span className={i === breadcrumb().length - 1 ? "text-foreground font-medium" : ""}>{part}</span>
          </span>
        ))}
      </div>

      {view !== "courses" && (
        <Button variant="ghost" onClick={goBack} className="gap-2 mb-4 rounded-xl text-sm"><ArrowLeft className="w-4 h-4" /> Back</Button>
      )}

      {view !== "courses" && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-base">{view === "subjects" ? "Subjects" : view === "chapters" ? "Chapters" : "Videos"}</h2>
          {!showForm && (<Button onClick={() => setShowForm(true)} className="gap-2 rounded-xl text-sm"><Plus className="w-4 h-4" /> Add {view === "subjects" ? "Subject" : view === "chapters" ? "Chapter" : "Video"}</Button>)}
        </div>
      )}

      {showForm && renderForm()}

      {/* Courses */}
      {view === "courses" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-24 glass-card rounded-2xl animate-pulse" />) : courses.map((c, i) => (
            <motion.button key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              onClick={() => openCourse(c)}
              className="glass-card rounded-2xl p-5 text-left hover:shadow-lg transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center backdrop-blur-sm"><BookOpen className="w-5 h-5 text-primary" /></div>
                <div className="flex-1 min-w-0"><p className="font-display font-bold text-sm truncate group-hover:text-primary transition-colors">{c.title}</p><p className="text-xs text-muted-foreground">Manage content</p></div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Subjects */}
      {view === "subjects" && !loading && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.length === 0 && !showForm ? (
              <div className="col-span-full text-center py-16 text-muted-foreground"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">No subjects yet</p></div>
            ) : subjects.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
                <div className="h-2" style={{ backgroundColor: s.color }} />
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <button onClick={() => openSubject(s)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.color + "20", color: s.color }}><BookOpen className="w-5 h-5" /></div>
                      <div className="min-w-0"><p className="font-display font-bold text-sm truncate group-hover:text-primary transition-colors">{s.name}</p><p className="text-xs text-muted-foreground">Manage chapters</p></div>
                    </button>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(s)}><Edit2 className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete("subjects", s.id, () => fetchSubjects(selectedCourse!.id))}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Offer Timer Section */}
          <div className="mt-8 glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-destructive" />
              <h3 className="font-display font-bold text-base">Offer Countdown Timer</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-4">সেট করলে Course Detail পেজে countdown timer দেখাবে।</p>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Offer End Date & Time</label>
                <Input type="datetime-local" value={offerEndDate} onChange={e => setOfferEndDate(e.target.value)} className="rounded-xl bg-background/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block flex items-center gap-1"><Tag className="w-3 h-3" /> Offer Label (optional)</label>
                <Input value={offerLabel} onChange={e => setOfferLabel(e.target.value)} placeholder="e.g. ঈদ স্পেশাল অফার!" className="rounded-xl bg-background/50" />
              </div>
            </div>
            {offerEndDate && (
              <div className="mb-4 rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-destructive shrink-0" />
                <span className="text-destructive font-medium">Timer active until: {new Date(offerEndDate).toLocaleString()}</span>
              </div>
            )}
            <div className="flex gap-2">
              <Button onClick={handleSaveOffer} disabled={savingOffer} className="gap-2 rounded-xl">
                <Save className="w-4 h-4" /> {savingOffer ? "Saving..." : "Save Timer"}
              </Button>
              {offerEndDate && (
                <Button variant="outline" onClick={handleRemoveOffer} disabled={savingOffer} className="gap-2 rounded-xl text-destructive">
                  <Trash2 className="w-4 h-4" /> Remove Timer
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Chapters */}
      {view === "chapters" && !loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {chapters.length === 0 && !showForm ? (
            <div className="col-span-full text-center py-16 text-muted-foreground"><BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">No chapters yet</p></div>
          ) : chapters.map((ch, i) => (
            <motion.div key={ch.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
              <div className="h-2" style={{ backgroundColor: ch.color }} />
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <button onClick={() => openChapter(ch)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: ch.color + "20", color: ch.color }}><BookOpen className="w-5 h-5" /></div>
                    <div className="min-w-0"><p className="font-display font-bold text-sm truncate group-hover:text-primary transition-colors">{ch.name}</p><p className="text-xs text-muted-foreground">Manage videos</p></div>
                  </button>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(ch)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete("chapters", ch.id, () => fetchChapters(selectedSubject!.id))}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Videos + Materials */}
      {view === "videos" && !loading && (
        <div className="space-y-6">
          {/* Videos */}
          <div className="space-y-3">
            {videos.length === 0 && !showForm ? (
              <div className="text-center py-16 text-muted-foreground"><Video className="w-12 h-12 mx-auto mb-3 opacity-30" /><p className="text-sm">No videos yet</p></div>
            ) : videos.map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className="glass-card rounded-2xl p-5 hover:shadow-lg transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0"><Video className="w-5 h-5 text-destructive" /></div>
                    <div className="min-w-0"><p className="font-display font-bold text-sm">{v.title}</p><p className="text-xs text-muted-foreground truncate mt-0.5">{v.video_url}</p>{v.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{v.description}</p>}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(v)}><Edit2 className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete("chapter_videos", v.id, () => fetchVideos(selectedChapter!.id))}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Materials Section */}
          <div className="border-t border-border/30 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-primary" />
                <h2 className="font-display font-bold text-base">Course Materials</h2>
              </div>
              {!showMaterialForm && (
                <Button onClick={() => setShowMaterialForm(true)} className="gap-2 rounded-xl text-sm" variant="outline">
                  <Plus className="w-4 h-4" /> Add Material
                </Button>
              )}
            </div>

            {showMaterialForm && renderMaterialForm()}

            <div className="space-y-3">
              {materials.length === 0 && !showMaterialForm ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Paperclip className="w-10 h-10 mx-auto mb-2 opacity-30" />
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
                          <p className="text-xs text-muted-foreground truncate">{cfg.label} · <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-primary">Open link ↗</a></p>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEditMaterial(item)}><Edit2 className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete("chapter_materials", item.id, () => fetchMaterials(selectedChapter!.id))}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  );
};

export default AdminCourseContent;
