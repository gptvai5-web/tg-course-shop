import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, Clock, GraduationCap, PlayCircle, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Link } from "react-router-dom";

interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  image_url: string;
  instructor_name: string;
  duration: string;
  lessons_count: number;
  level: string;
  category: string;
  enrolled_at: string;
}

interface EnrolledCombo {
  id: string;
  title: string;
  image_url: string;
  category: string;
  description: string;
  courseCount: number;
}

const Learn = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [combos, setCombos] = useState<EnrolledCombo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Fetch enrolled courses
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, enrolled_at")
        .eq("user_id", user.id);

      if (enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map((e) => e.course_id);
        const { data: coursesData } = await supabase
          .from("courses")
          .select("*")
          .in("id", courseIds);
        if (coursesData) {
          setCourses(coursesData.map((c) => ({
            ...c,
            enrolled_at: enrollments.find((e) => e.course_id === c.id)?.enrolled_at || "",
          })));
        }
      }

      // Fetch enrolled combos
      const { data: comboEnrollments } = await (supabase.from as any)("combo_enrollments")
        .select("combo_id")
        .eq("user_id", user.id);

      if (comboEnrollments && comboEnrollments.length > 0) {
        const comboIds = comboEnrollments.map((e: any) => e.combo_id);
        const { data: combosData } = await (supabase.from as any)("combo_courses")
          .select("id, title, image_url, category, description")
          .in("id", comboIds);
        
        if (combosData) {
          // Get course counts for each combo
          const { data: allItems } = await (supabase.from as any)("combo_course_items")
            .select("combo_id, course_id")
            .in("combo_id", comboIds);
          
          const countMap = new Map<string, number>();
          (allItems || []).forEach((item: any) => {
            countMap.set(item.combo_id, (countMap.get(item.combo_id) || 0) + 1);
          });

          setCombos(combosData.map((c: any) => ({
            ...c,
            courseCount: countMap.get(c.id) || 0,
          })));
        }
      }

      setLoading(false);
    };
    fetchData();
  }, [user]);

  const hasContent = courses.length > 0 || combos.length > 0;

  return (
    <div className="min-h-screen bg-background bg-dot-grid relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[120px]" />
        <div className="absolute bottom-20 right-0 w-[350px] h-[350px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <Navbar />
      <div className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center backdrop-blur-sm">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-bold">My Learning</h1>
            </div>
            <p className="text-muted-foreground text-sm mb-8 ml-[52px]">
              All courses and combos you are enrolled in
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-muted/30" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-muted/30 rounded w-3/4" />
                    <div className="h-3 bg-muted/30 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !hasContent ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-10 h-10 text-primary/40" />
              </div>
              <h2 className="text-xl font-display font-bold mb-2">No courses yet</h2>
              <p className="text-muted-foreground text-sm mb-6">
                You haven't enrolled in any courses. Browse our catalog to get started!
              </p>
              <Link to="/courses" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity">
                Browse Courses
              </Link>
            </motion.div>
          ) : (
            <>
              {/* Combo Courses */}
              {combos.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <Package className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-display font-bold">My Combo Packages</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {combos.map((combo, i) => (
                      <motion.div key={combo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all group border-2 border-primary/20">
                          <Link to={`/combo/${combo.id}/courses`} className="block">
                            <div className="relative h-36 sm:h-40 overflow-hidden">
                              <img src={combo.image_url || "/placeholder.svg"} alt={combo.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                              <div className="absolute top-3 right-3">
                                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">COMBO</span>
                              </div>
                            </div>
                            <div className="p-4 sm:p-5 pb-2 sm:pb-3">
                              <p className="text-[10px] sm:text-xs text-muted-foreground mb-1">{combo.category}</p>
                              <h3 className="font-display font-bold text-sm sm:text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
                                {combo.title}
                              </h3>
                              <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-muted-foreground">
                                <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                <span>{combo.courseCount} courses included</span>
                              </div>
                            </div>
                          </Link>
                          <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                            <Link to={`/combo/${combo.id}/courses`}
                              className="flex items-center justify-center gap-2 w-full h-10 bg-primary text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold hover:opacity-90 transition-opacity">
                              <Package className="w-4 h-4" /> View Courses
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Individual Courses */}
              {courses.length > 0 && (
                <div>
                  {combos.length > 0 && (
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-5 h-5 text-primary" />
                      <h2 className="text-lg font-display font-bold">My Courses</h2>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {courses.map((course, i) => (
                      <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                        <div className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all group">
                          <Link to={`/courses/${course.id}`} className="block">
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
                              <PlayCircle className="w-4 h-4" /> Continue the Course
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Learn;
