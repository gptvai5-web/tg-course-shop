import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, ArrowRight, Play, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

interface Chapter { id: string; name: string; color: string; display_order: number; cycle_id: string | null; }
interface Subject { id: string; name: string; color: string; course_id: string; }

const SubjectChapters = () => {
  const { id, subjectId } = useParams<{ id: string; subjectId: string }>();
  const { user } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [videoCounts, setVideoCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [hasFullAccess, setHasFullAccess] = useState(false);
  const [ownedCycles, setOwnedCycles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!subjectId || !user || !id) return;
    const fetch = async () => {
      const [{ data: s }, { data: ch }] = await Promise.all([
        (supabase.from as any)("subjects").select("id, name, color, course_id").eq("id", subjectId).single(),
        (supabase.from as any)("chapters").select("id, name, color, display_order, cycle_id").eq("subject_id", subjectId).eq("is_active", true).order("display_order"),
      ]);
      setSubject(s as Subject | null);
      const chaptersList = (ch as Chapter[]) || [];
      setChapters(chaptersList);
      
      // Check full enrollment
      const { data: enrolls } = await supabase.from("enrollments").select("id").eq("user_id", user.id).eq("course_id", id);
      const fullAccess = !!(enrolls && enrolls.length > 0);
      setHasFullAccess(fullAccess);
      
      // Check cycle enrollments
      if (!fullAccess) {
        const { data: cycleEnrolls } = await supabase.from("cycle_enrollments").select("cycle_id").eq("user_id", user.id).eq("course_id", id);
        if (cycleEnrolls) {
          setOwnedCycles(new Set(cycleEnrolls.map(e => e.cycle_id)));
        }
      }

      // Fetch video counts per chapter
      if (chaptersList.length > 0) {
        const chapterIds = chaptersList.map(c => c.id);
        const { data: videos } = await supabase
          .from("chapter_videos")
          .select("chapter_id")
          .in("chapter_id", chapterIds)
          .eq("is_active", true);
        const counts: Record<string, number> = {};
        (videos || []).forEach((v) => {
          counts[v.chapter_id] = (counts[v.chapter_id] || 0) + 1;
        });
        setVideoCounts(counts);
      }
      setLoading(false);
    };
    fetch();
  }, [subjectId, user, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background bg-dot-grid">
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <Link to={`/course/${id}/content`} className="inline-flex items-center gap-2 text-primary font-medium text-sm mb-4 hover:gap-3 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Subjects
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: subject?.color || "#B13BFF" }}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bangla font-bold">{subject?.name}</h1>
                <p className="text-sm text-muted-foreground">All chapters</p>
              </div>
            </div>
          </motion.div>

          {chapters.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <BookOpen className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No chapters available yet. Check back soon!</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
              {chapters.map((ch, i) => {
                const isLocked = !hasFullAccess && ch.cycle_id !== null && !ownedCycles.has(ch.cycle_id);
                
                return (
                  <motion.div key={ch.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link to={isLocked ? `/course/${id}` : `/course/${id}/subject/${subjectId}/chapter/${ch.id}`} 
                      className={`block transition-all duration-300 group ${isLocked ? 'cursor-not-allowed opacity-80' : 'hover:scale-[1.03] hover:shadow-2xl'}`}>
                      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden flex flex-col" style={{ backgroundColor: isLocked ? '#64748b' : ch.color }}>
                        
                        {isLocked && (
                          <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-sm rounded-full p-2">
                            <Lock className="w-4 h-4 text-white" />
                          </div>
                        )}
                        
                        {/* Centered chapter name */}
                        <div className="flex-1 flex items-center justify-center px-4 relative z-10">
                          <h3 className="font-bangla font-extrabold text-white text-center text-lg sm:text-xl md:text-2xl leading-tight drop-shadow-lg">
                            {ch.name}
                            {isLocked && <span className="block text-xs font-normal mt-2 opacity-80">Locked - Requires Cycle</span>}
                          </h3>
                        </div>
                        
                        {/* Bottom bar with video count and arrow */}
                        <div className="flex items-center justify-between px-3 pb-3 relative z-10">
                          <div className="flex items-center gap-1.5 text-white/80 text-xs font-medium">
                            <Play className="w-3.5 h-3.5" />
                            <span>{videoCounts[ch.id] || 0} Videos</span>
                          </div>
                          {!isLocked && (
                            <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 transition-colors">
                              <ArrowRight className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        {isLocked && (
                          <div className="absolute inset-0 bg-slate-900/40 mix-blend-multiply pointer-events-none" />
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default SubjectChapters;
