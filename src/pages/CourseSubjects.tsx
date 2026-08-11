import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, ArrowRight, Bell, Megaphone, Users, Calendar, ExternalLink, FileImage } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

interface Subject { id: string; name: string; color: string; display_order: number; }
interface CourseInfo { id: string; title: string; instructor_name: string; }
interface CourseUpdate {
  id: string; course_id: string; update_type: string; title: string;
  content: string; url: string | null; is_active: boolean; created_at: string;
}

const TABS = [
  { key: "subjects", label: "Subjects", icon: BookOpen },
  { key: "announcements", label: "Announcements", icon: Megaphone },
  { key: "group", label: "Group", icon: Users },
  { key: "routine", label: "Routine", icon: Calendar },
];

const CourseSubjects = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [course, setCourse] = useState<CourseInfo | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapterCounts, setChapterCounts] = useState<Record<string, number>>({});
  const [updates, setUpdates] = useState<CourseUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("subjects");
  
  // Cycle support
  const [cycles, setCycles] = useState<any[]>([]);
  const [enrolledCycleIds, setEnrolledCycleIds] = useState<Set<string>>(new Set());
  const [isFullCourseEnrolled, setIsFullCourseEnrolled] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    const fetchData = async () => {
      const [{ data: c }, { data: u }, { data: enrollData }] = await Promise.all([
        supabase.from("courses").select("id, title, instructor_name, has_cycles").eq("id", id).single(),
        (supabase.from as any)("course_updates").select("*").eq("course_id", id).eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("enrollments").select("id").eq("course_id", id).eq("user_id", user.id).maybeSingle()
      ]);
      setCourse(c as any);
      setUpdates((u as CourseUpdate[]) || []);
      
      const isEnrolled = !!enrollData;
      setIsFullCourseEnrolled(isEnrolled);

      if (c?.has_cycles) {
        const [{ data: cy }, { data: cyEn }] = await Promise.all([
          supabase.from("cycles").select("*").eq("course_id", id).eq("is_active", true).order("created_at"),
          supabase.from("cycle_enrollments").select("cycle_id").eq("course_id", id).eq("user_id", user.id)
        ]);
        
        const cyclesList = cy || [];
        setCycles(cyclesList);
        if (cyEn) {
          setEnrolledCycleIds(new Set(cyEn.map(e => e.cycle_id)));
        }

        if (cyclesList.length > 0) {
          const cycleIds = cyclesList.map(cy => cy.id);
          const { data: chapters } = await (supabase.from as any)("chapters").select("cycle_id").in("cycle_id", cycleIds).eq("is_active", true);
          const counts: Record<string, number> = {};
          (chapters || []).forEach((ch: any) => {
            if (ch.cycle_id) counts[ch.cycle_id] = (counts[ch.cycle_id] || 0) + 1;
          });
          setChapterCounts(counts);
        }
      } else {
        const { data: s } = await (supabase.from as any)("subjects").select("id, name, color, display_order").eq("course_id", id).eq("is_active", true).order("display_order");
        const subjectsList = (s as Subject[]) || [];
        setSubjects(subjectsList);
        
        if (subjectsList.length > 0) {
          const subjectIds = subjectsList.map(sub => sub.id);
          const { data: chapters } = await (supabase.from as any)("chapters").select("subject_id").in("subject_id", subjectIds).eq("is_active", true);
          const counts: Record<string, number> = {};
          (chapters || []).forEach((ch: any) => {
            if (ch.subject_id) counts[ch.subject_id] = (counts[ch.subject_id] || 0) + 1;
          });
          setChapterCounts(counts);
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const notices = updates.filter(u => u.update_type === "notice");
  const announcements = updates.filter(u => u.update_type === "announcement");
  const groupLinks = updates.filter(u => u.update_type === "group");
  const routines = updates.filter(u => u.update_type === "routine");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 max-w-6xl">
          <div className="h-8 w-60 bg-muted rounded animate-pulse mb-8" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="aspect-[3/4] bg-card border border-border rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-dot-grid">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Link to="/learn" className="inline-flex items-center gap-2 text-primary font-medium text-sm mb-4 hover:gap-3 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to My Learning
            </Link>
            <h1 className="text-2xl md:text-3xl font-bangla font-bold">{course?.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">by {course?.instructor_name}</p>
          </motion.div>

          {/* Notice Banner */}
          {notices.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-6 space-y-3">
              {notices.map(n => (
                <div key={n.id} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                  <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    {n.title && <p className="font-bangla font-bold text-sm text-amber-800 dark:text-amber-300">{n.title}</p>}
                    <p className="text-sm text-amber-700 dark:text-amber-400/80">{n.content}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-8 flex-wrap">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                }`}
              >
                <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
            ))}
          </div>

          {/* Subjects or Cycles Tab */}
          {activeTab === "subjects" && (
            <>
              {((course as any)?.has_cycles ? cycles : subjects).length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
                  <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No content available yet. Check back soon!</p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                  {(course as any)?.has_cycles ? cycles.map((c, i) => {
                    const isEnrolled = isFullCourseEnrolled || enrolledCycleIds.has(c.id);
                    return (
                      <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        {isEnrolled ? (
                          <Link to={`/course/${id}/cycle/${c.id}`} className="block hover:scale-[1.03] hover:shadow-2xl transition-all duration-300 group">
                            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden flex flex-col bg-primary">
                              <div className="flex-1 flex items-center justify-center px-4">
                                <h3 className="font-bangla font-extrabold text-white text-center text-lg sm:text-xl md:text-2xl leading-tight drop-shadow-lg">{c.title}</h3>
                              </div>
                              <div className="bg-black/20 backdrop-blur-md p-3 md:p-4 flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-1.5 text-white/90">
                                  <FileImage className="w-3.5 h-3.5" />
                                  <span className="text-xs md:text-sm font-medium">{chapterCounts[c.id] || 0} Chapters</span>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/40 transition-colors">
                                  <ArrowRight className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            </div>
                          </Link>
                        ) : (
                          <div className="block cursor-not-allowed group">
                            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden flex flex-col bg-muted border border-border">
                              <div className="flex-1 flex flex-col items-center justify-center px-4 opacity-50">
                                <h3 className="font-bangla font-extrabold text-foreground text-center text-lg sm:text-xl md:text-2xl leading-tight">{c.title}</h3>
                                <div className="mt-4 p-3 bg-background/80 backdrop-blur-sm rounded-full shadow-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                </div>
                              </div>
                              <div className="bg-background/80 backdrop-blur-md p-3 md:p-4 flex items-center justify-between mt-auto border-t border-border">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <span className="text-xs md:text-sm font-bold">৳{c.price}</span>
                                </div>
                                <Link to={`/course/${id}`} className="text-xs font-bold text-primary hover:underline">
                                  Buy Now
                                </Link>
                              </div>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    );
                  }) : subjects.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                      <Link to={`/course/${id}/subject/${s.id}`} className="block hover:scale-[1.03] hover:shadow-2xl transition-all duration-300 group">
                        <div className="relative aspect-[3/4] rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: s.color }}>
                          <div className="flex-1 flex items-center justify-center px-4">
                            <h3 className="font-bangla font-extrabold text-white text-center text-lg sm:text-xl md:text-2xl leading-tight drop-shadow-lg">{s.name}</h3>
                          </div>
                          <div className="bg-black/20 backdrop-blur-md p-3 md:p-4 flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-1.5 text-white/90">
                              <FileImage className="w-3.5 h-3.5" />
                              <span className="text-xs md:text-sm font-medium">{chapterCounts[s.id] || 0} Chapters</span>
                            </div>
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/40 transition-colors">
                              <ArrowRight className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Announcements Tab */}
          {activeTab === "announcements" && (
            <div className="space-y-4">
              {announcements.length === 0 ? (
                <div className="text-center py-20">
                  <Megaphone className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No announcements yet.</p>
                </div>
              ) : announcements.map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Megaphone className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {a.title && <h3 className="font-bangla font-bold text-sm mb-1">{a.title}</h3>}
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.content}</p>
                      <p className="text-[10px] text-muted-foreground/50 mt-2">{new Date(a.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Group Tab */}
          {activeTab === "group" && (
            <div className="space-y-4">
              {groupLinks.length === 0 ? (
                <div className="text-center py-20">
                  <Users className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No group links available yet.</p>
                </div>
              ) : groupLinks.map((g, i) => (
                <motion.div key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {g.title && <h3 className="font-display font-bold text-sm mb-1">{g.title}</h3>}
                      {g.content && <p className="text-sm text-muted-foreground mb-3">{g.content}</p>}
                      {g.url && (
                        <a href={g.url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors">
                          <ExternalLink className="w-4 h-4" /> Join Group
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Routine Tab */}
          {activeTab === "routine" && (
            <div className="space-y-4">
              {routines.length === 0 ? (
                <div className="text-center py-20">
                  <Calendar className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">No routines available yet.</p>
                </div>
              ) : routines.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      {r.title && <h3 className="font-display font-bold text-sm mb-1">{r.title}</h3>}
                      {r.content && <p className="text-sm text-muted-foreground mb-3">{r.content}</p>}
                      {r.url && (
                        r.url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                          <img src={r.url} alt={r.title || "Routine"} className="rounded-xl max-w-full border border-border" />
                        ) : (
                          <a href={r.url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors">
                            <FileImage className="w-4 h-4" /> View Routine
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CourseSubjects;
