import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Users, Play, UserCheck, Video, ArrowRight, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedCourse {
  id: string;
  title: string;
  image_url: string;
  link_url: string;
}

const FeaturedCarousel = () => {
  const [courses, setCourses] = useState<FeaturedCourse[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, courses: 0, teachers: 0, lessons: 0 });

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data }, { data: statsData }] = await Promise.all([
        supabase.from("featured_courses").select("id, title, image_url, link_url").eq("is_active", true).order("display_order"),
        supabase.rpc("get_public_stats"),
      ]);
      setCourses(data || []);
      const statsResult = statsData as any;
      if (statsResult) {
        setStats({
          students: statsResult.total_enrollments || 0,
          courses: statsResult.total_courses || 0,
          teachers: statsResult.total_instructors || 0,
          lessons: statsResult.total_lessons || 0,
        });
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (courses.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % courses.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [courses.length]);

  const prev = () => setCurrent((c) => (c - 1 + courses.length) % courses.length);
  const next = () => setCurrent((c) => (c + 1) % courses.length);

  return (
    <section className="relative bg-gradient-hero overflow-hidden">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, hsl(var(--sidebar-foreground)) 1px, transparent 0)", backgroundSize: "40px 40px" }} />

      <div className="container mx-auto px-4 pt-20 pb-12 md:py-20 relative z-10">
        {/* Carousel Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8 md:mb-12"
        >
          <span className="inline-block text-xs font-semibold text-sidebar-primary bg-sidebar-primary/15 border border-sidebar-primary/30 px-4 py-1.5 rounded-full mb-3">
            Featured Courses
          </span>
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold text-sidebar-foreground">
            Discover Our Top Courses
          </h2>
        </motion.div>

        {courses.length > 0 && (
          <div className="relative max-w-5xl mx-auto mb-14 md:mb-20">
            <div className="flex items-center justify-center gap-3 md:gap-6">
              {/* Left preview */}
              {courses.length > 1 && (
                <div className="hidden md:block w-[180px] lg:w-[220px] h-[160px] lg:h-[200px] rounded-xl overflow-hidden opacity-40 flex-shrink-0 cursor-pointer" onClick={prev}>
                  <img
                    src={courses[(current - 1 + courses.length) % courses.length].image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Main slide */}
              <div className="relative w-full max-w-[calc(100vw-4rem)] sm:max-w-[500px] md:max-w-[500px] lg:max-w-[600px] h-[180px] sm:h-[250px] md:h-[280px] lg:h-[320px] rounded-2xl overflow-hidden shadow-2xl mx-auto">
                <AnimatePresence mode="wait">
                  <motion.a
                    key={courses[current]?.id}
                    href={courses[current]?.link_url || "#"}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 block"
                  >
                    <img
                      src={courses[current]?.image_url}
                      alt={courses[current]?.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4">
                      <h3 className="text-base md:text-xl font-display font-bold text-white drop-shadow-lg">
                        {courses[current]?.title}
                      </h3>
                    </div>
                  </motion.a>
                </AnimatePresence>
              </div>

              {/* Right preview */}
              {courses.length > 1 && (
                <div className="hidden md:block w-[180px] lg:w-[220px] h-[160px] lg:h-[200px] rounded-xl overflow-hidden opacity-40 flex-shrink-0 cursor-pointer" onClick={next}>
                  <img
                    src={courses[(current + 1) % courses.length].image_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* Nav buttons */}
            {courses.length > 1 && (
              <>
                <button
                  onClick={prev}
                  className="absolute -left-2 md:left-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-sidebar-accent/80 backdrop-blur-sm border border-sidebar-border flex items-center justify-center hover:bg-sidebar-primary/30 transition-colors z-10 text-sidebar-foreground"
                >
                  <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <button
                  onClick={next}
                  className="absolute -right-2 md:right-2 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 rounded-full bg-sidebar-accent/80 backdrop-blur-sm border border-sidebar-border flex items-center justify-center hover:bg-sidebar-primary/30 transition-colors z-10 text-sidebar-foreground"
                >
                  <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </>
            )}

            {/* Dots */}
            {courses.length > 1 && (
              <div className="flex justify-center gap-2 mt-5">
                {courses.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrent(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current ? "w-7 bg-sidebar-primary" : "w-2 bg-sidebar-foreground/25"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="max-w-[600px] mx-auto h-[280px] bg-sidebar-accent rounded-2xl animate-pulse mb-14 md:mb-20" />
        )}

        {!loading && courses.length === 0 && (
          <div className="max-w-[600px] mx-auto h-[200px] bg-sidebar-accent/50 rounded-2xl flex items-center justify-center mb-14 md:mb-20 border border-sidebar-border border-dashed">
            <p className="text-sidebar-foreground/40 text-sm">No featured courses yet</p>
          </div>
        )}

        {/* Bottom Info Cards */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 max-w-5xl mx-auto">
          {/* Online Batches Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-sidebar-accent/60 backdrop-blur-sm border border-sidebar-border rounded-2xl p-5 md:p-7"
          >
            <span className="inline-block text-[10px] md:text-xs font-semibold bg-sidebar-primary/15 text-sidebar-primary border border-sidebar-primary/30 px-3 py-1 rounded-full mb-3">
              Online Course
            </span>
            <h3 className="text-lg md:text-xl font-display font-bold text-sidebar-foreground mb-1">
              Online Batches are ongoing!
            </h3>
            <p className="text-sm text-sidebar-primary font-medium mb-5">Book your seat now!</p>

            <div className="space-y-3">
              {[
                { icon: BookOpen, label: "Class 9, 10", desc: "SSC Preparation" },
                { icon: BookOpen, label: "College", desc: "HSC Preparation" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-sidebar-accent/80 border border-sidebar-border rounded-xl p-3">
                  <div className="w-9 h-9 rounded-lg bg-sidebar-primary/15 flex items-center justify-center">
                    <item.icon className="w-4 h-4 text-sidebar-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-sidebar-foreground">{item.label}</p>
                    <p className="text-xs text-sidebar-foreground/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/courses" className="flex items-center gap-1.5 text-sm font-semibold text-sidebar-primary mt-5 hover:gap-3 transition-all">
              See All Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-sidebar-accent/60 backdrop-blur-sm border border-sidebar-border rounded-2xl p-5 md:p-7"
          >
            <span className="inline-block text-[10px] md:text-xs font-semibold bg-destructive/15 text-destructive border border-destructive/30 px-3 py-1 rounded-full mb-3">
              Online Course
            </span>
            <h3 className="text-lg md:text-xl font-display font-bold text-sidebar-foreground mb-1">
              See the stats!
            </h3>
            <p className="text-sm text-sidebar-primary font-medium mb-5">The trust we are building!</p>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Users, value: stats.students.toLocaleString(), label: "Students", color: "bg-blue-500/15 text-blue-400" },
                { icon: Play, value: stats.courses.toLocaleString(), label: "Courses", color: "bg-cyan-500/15 text-cyan-400" },
                { icon: UserCheck, value: stats.teachers.toLocaleString(), label: "Teachers", color: "bg-green-500/15 text-green-400" },
                { icon: Video, value: stats.lessons.toLocaleString(), label: "Lessons", color: "bg-indigo-500/15 text-indigo-400" },
              ].map((stat, i) => (
                <div key={i} className="flex items-center gap-3 bg-sidebar-accent/80 border border-sidebar-border rounded-xl p-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm md:text-base font-bold text-sidebar-foreground">{stat.value}</p>
                    <p className="text-xs text-sidebar-foreground/50">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link to="/courses" className="flex items-center gap-1.5 text-sm font-semibold text-sidebar-primary mt-5 hover:gap-3 transition-all">
              See All Courses <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedCarousel;
