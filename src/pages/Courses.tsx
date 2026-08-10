import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, Star, BookOpen, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

interface Course {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  instructor_name: string;
  price: number;
  original_price: number | null;
  duration: string;
  lessons_count: number;
  level: string;
  students_count: number;
}

interface Category {
  id: string;
  name: string;
}

interface ComboCourse {
  id: string;
  title: string;
  description: string;
  image_url: string;
  category: string;
  price: number;
  original_price: number | null;
  is_active: boolean;
  courseIds: string[];
}

const Courses = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [combos, setCombos] = useState<ComboCourse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [courseStudentCounts, setCourseStudentCounts] = useState<Record<string, number>>({});
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [comboEnrollingId, setComboEnrollingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [coursesRes, catsRes, combosRes, comboItemsRes, { data: statsData }] = await Promise.all([
        supabase.from("courses").select("*").eq("is_active", true).order("display_order"),
        supabase.from("course_categories").select("id, name").eq("is_active", true).order("display_order"),
        (supabase.from as any)("combo_courses").select("*").eq("is_active", true).order("display_order"),
        (supabase.from as any)("combo_course_items").select("combo_id, course_id"),
        supabase.rpc("get_public_stats"),
      ]);
      setCourses((coursesRes.data as Course[]) || []);
      setCategories((catsRes.data as Category[]) || []);
      setCourseStudentCounts((statsData as any)?.course_student_counts || {});

      // Map combo items
      const itemsMap = new Map<string, string[]>();
      ((comboItemsRes.data as any[]) || []).forEach((item: any) => {
        if (!itemsMap.has(item.combo_id)) itemsMap.set(item.combo_id, []);
        itemsMap.get(item.combo_id)!.push(item.course_id);
      });
      const combosWithIds = ((combosRes.data as any[]) || []).map((c: any) => ({
        ...c,
        courseIds: itemsMap.get(c.id) || [],
      }));
      setCombos(combosWithIds);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("enrollments").select("course_id").eq("user_id", user.id).then(({ data }) => {
      setEnrolledIds(new Set((data || []).map((e: any) => e.course_id)));
    });
  }, [user]);

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to enroll.", variant: "destructive" });
      return;
    }
    setEnrollingId(courseId);
    const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: courseId });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEnrolledIds((prev) => new Set(prev).add(courseId));
      toast({ title: "Enrolled!", description: "You have been successfully enrolled." });
    }
    setEnrollingId(null);
  };

  const handleComboEnroll = async (combo: ComboCourse) => {
    if (!user) {
      toast({ title: "Please log in", description: "You need to be logged in to enroll.", variant: "destructive" });
      return;
    }
    setComboEnrollingId(combo.id);
    // Enroll in all courses in the combo
    const newIds = combo.courseIds.filter((cid) => !enrolledIds.has(cid));
    if (newIds.length > 0) {
      const rows = newIds.map((course_id) => ({ user_id: user.id, course_id }));
      const { error } = await supabase.from("enrollments").insert(rows);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        setComboEnrollingId(null);
        return;
      }
      setEnrolledIds((prev) => {
        const next = new Set(prev);
        newIds.forEach((id) => next.add(id));
        return next;
      });
    }
    toast({ title: "Combo Enrolled!", description: `You now have access to all ${combo.courseIds.length} courses in this combo.` });
    setComboEnrollingId(null);
  };

  // Count courses per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: courses.length };
    courses.forEach((c) => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return counts;
  }, [courses]);

  const filtered = activeCategory === "All" ? courses : courses.filter((c) => c.category === activeCategory);

  const discountPercent = (price: number, original: number | null) => {
    if (!original || original <= price) return null;
    return Math.round(((original - price) / original) * 100);
  };

  return (
    <div className="min-h-screen bg-background bg-dot-grid">
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-8 md:pt-36 md:pb-12 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-10 left-1/3 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <BookOpen className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-extrabold">
              All <span className="text-gradient">Courses</span>
            </h1>
          </motion.div>

          {/* Category Pills */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="flex flex-wrap justify-center gap-3 mt-8"
          >
            {[{ name: "All" }, ...categories].map((cat) => {
              const count = categoryCounts[cat.name] || 0;
              const active = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                      : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-primary/5"
                  }`}
                >
                  {cat.name}
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Combo Courses Section */}
      {!loading && combos.filter(c => activeCategory === "All" || c.category === activeCategory).length > 0 && (
        <section className="pb-10">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-3 mb-6">
              <Package className="w-6 h-6 text-primary" />
              <h2 className="text-xl font-display font-bold">Combo Packages</h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {combos.filter(c => activeCategory === "All" || c.category === activeCategory).map((combo, i) => {
                const allEnrolled = combo.courseIds.every((cid) => enrolledIds.has(cid));
                const discount = discountPercent(combo.price, combo.original_price);
                return (
                  <Link to={`/combo/${(combo as any).slug || combo.id}`} key={combo.id}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-card border-2 border-primary/20 rounded-2xl overflow-hidden hover:shadow-elevated transition-all duration-300 flex flex-col relative"
                  >
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-primary text-primary-foreground text-xs font-bold shadow-md">
                        COMBO
                      </Badge>
                    </div>
                    <div className="relative h-48 sm:h-52 overflow-hidden">
                      <img
                        src={combo.image_url || "/placeholder.svg"}
                        alt={combo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <span className="text-xs font-semibold text-primary mb-1">{combo.category}</span>
                      <h3 className="font-display font-bold text-base mb-2 line-clamp-2 group-hover:text-primary transition-colors uppercase">
                        {combo.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{combo.description}</p>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                        <BookOpen className="w-4 h-4" />
                        <span>{combo.courseIds.length} courses included</span>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-display font-extrabold text-foreground">৳{combo.price}</span>
                          {combo.original_price && combo.original_price > combo.price && (
                            <span className="text-sm text-muted-foreground line-through">৳{combo.original_price}</span>
                          )}
                        </div>
                        {discount && <span className="text-sm font-bold text-destructive">{discount}% OFF</span>}
                      </div>
                      <div className="w-full mt-3 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center text-sm font-semibold">
                        {allEnrolled ? "View Details" : "See Details & Enroll"}
                      </div>
                    </div>
                  </motion.div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Course Grid */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          {activeCategory !== "All" && (
            <h2 className="text-xl font-display font-bold mb-6">{activeCategory} Courses</h2>
          )}

          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-card rounded-2xl h-[420px] animate-pulse border border-border" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No courses found</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((course, i) => {
                const isEnrolled = enrolledIds.has(course.id);
                const discount = discountPercent(course.price, course.original_price);
                return (
                  <Link to={`/courses/${(course as any).slug || course.id}`} key={course.id}>
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-elevated transition-all duration-300 flex flex-col"
                  >
                    {/* Image */}
                    <div className="relative h-48 sm:h-52 overflow-hidden">
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-bold shadow-md">
                        {course.category}
                      </Badge>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex flex-col flex-1">
                      {/* Category tag + star */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-primary">{course.category}</span>
                        <Star className="w-4 h-4 text-warning fill-warning" />
                      </div>

                      <h3 className="font-display font-bold text-base mb-3 line-clamp-2 group-hover:text-primary transition-colors uppercase">
                        {course.title}
                      </h3>

                      {/* Students count */}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                        <Users className="w-4 h-4" />
                        <span>{(courseStudentCounts[course.id] || 0).toLocaleString()} students</span>
                      </div>

                      {/* Price & Discount */}
                      <div className="mt-auto flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xl font-display font-extrabold text-foreground">৳{course.price}</span>
                          {course.original_price && course.original_price > course.price && (
                            <span className="text-sm text-muted-foreground line-through">৳{course.original_price}</span>
                          )}
                        </div>
                        {discount ? (
                          <span className="text-sm font-bold text-destructive">{discount}% OFF</span>
                        ) : (
                          <Button
                            size="sm"
                            className="rounded-full text-xs h-8 px-4"
                            disabled={isEnrolled || enrollingId === course.id}
                            onClick={() => handleEnroll(course.id)}
                          >
                            {isEnrolled ? "Enrolled" : "Enroll"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Courses;
