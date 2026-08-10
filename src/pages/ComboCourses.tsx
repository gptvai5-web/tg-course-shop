import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, BookOpen, Clock, Package, PlayCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

interface IncludedCourse {
  id: string;
  title: string;
  image_url: string;
  category: string;
  instructor_name: string;
  duration: string;
  lessons_count: number;
  level: string;
}

const ComboCourses = () => {
  const { comboId } = useParams<{ comboId: string }>();
  const { user } = useAuth();
  const [comboTitle, setComboTitle] = useState("");
  const [courses, setCourses] = useState<IncludedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!comboId) return;
      const { data: combo } = await (supabase.from as any)("combo_courses").select("title").eq("id", comboId).single();
      if (combo) setComboTitle(combo.title);

      const { data: items } = await (supabase.from as any)("combo_course_items").select("course_id").eq("combo_id", comboId);
      if (items && items.length > 0) {
        const courseIds = items.map((i: any) => i.course_id);
        const { data: coursesData } = await supabase.from("courses").select("id, title, image_url, category, instructor_name, duration, lessons_count, level").in("id", courseIds);
        setCourses((coursesData as IncludedCourse[]) || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [comboId]);

  return (
    <div className="min-h-screen bg-background bg-dot-grid relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[120px]" />
      </div>
      <Navbar />
      <div className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link to="/learn" className="inline-flex items-center gap-2 text-primary font-medium text-sm mb-6 hover:gap-3 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to My Learning
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">{comboTitle || "Combo Courses"}</h1>
            </div>
            <p className="text-muted-foreground text-sm mb-8 ml-[52px]">
              All courses included in this combo package
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-muted/30" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-muted/30 rounded w-3/4" />
                    <div className="h-3 bg-muted/30 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {courses.map((course, i) => (
                <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <div className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
                    <Link to={`/course/${course.id}/content`} className="block">
                      <div className="relative h-36 sm:h-40 overflow-hidden">
                        <img src={course.image_url || "/placeholder.svg"} alt={course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        <div className="absolute top-3 left-3">
                          <span className="bg-primary/90 backdrop-blur-sm text-primary-foreground text-[10px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">
                            {course.level}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5 pb-2 sm:pb-3">
                        <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">{course.category}</p>
                        <h3 className="font-display font-bold text-sm sm:text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {course.title}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground mb-3">by {course.instructor_name}</p>
                        <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {course.duration}</span>
                          <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> {course.lessons_count} lessons</span>
                        </div>
                      </div>
                    </Link>
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                      <Link to={`/course/${course.id}/content`}
                        className="flex items-center justify-center gap-2 w-full h-10 bg-primary text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity">
                        <PlayCircle className="w-4 h-4" /> Start Learning
                      </Link>
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

export default ComboCourses;
