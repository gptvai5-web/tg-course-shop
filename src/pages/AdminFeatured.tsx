import { useState, useEffect } from "react";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Trash2, Star, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface Course { id: string; title: string; image_url: string; is_active: boolean; }
interface FeaturedCourse { id: string; title: string; image_url: string; link_url: string | null; display_order: number; is_active: boolean; }

const AdminFeatured = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [featured, setFeatured] = useState<FeaturedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [{ data: coursesData }, { data: featuredData }] = await Promise.all([
      supabase.from("courses").select("id, title, image_url, is_active").eq("is_active", true).order("title"),
      supabase.from("featured_courses").select("*").order("display_order"),
    ]);
    setCourses(coursesData || []);
    setFeatured(featuredData || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const isFeatured = (courseId: string) => featured.some(f => f.link_url === `/courses/${courseId}`);

  const toggleFeatured = async (course: Course) => {
    const link = `/courses/${course.id}`;
    const existing = featured.find(f => f.link_url === link);
    if (existing) {
      const { error } = await supabase.from("featured_courses").delete().eq("id", existing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Removed from featured");
    } else {
      const { error } = await supabase.from("featured_courses").insert({ title: course.title, image_url: course.image_url || "", link_url: link, display_order: featured.length });
      if (error) { toast.error(error.message); return; }
      toast.success("Added to featured!");
    }
    fetchData();
  };

  const handleToggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase.from("featured_courses").update({ is_active: active }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    setFeatured(f => f.map(item => item.id === id ? { ...item, is_active: active } : item));
  };

  const handleDeleteFeatured = async (id: string) => {
    const { error } = await supabase.from("featured_courses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removed from featured");
    fetchData();
  };

  return (
    <AdminPageWrapper
      title="Featured Courses"
      subtitle="Set courses as featured to show on the home page carousel"
      icon={ImageIcon}
    >
      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : (
        <>
          <h2 className="font-display font-bold text-base mb-3">All Courses</h2>
          <div className="space-y-2 mb-8">
            {courses.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-4"
              >
                <img src={c.image_url || "/placeholder.svg"} alt={c.title} className="w-16 h-12 md:w-24 md:h-16 rounded-xl object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{c.title}</p>
                </div>
                <Button
                  variant={isFeatured(c.id) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleFeatured(c)}
                  className="gap-1.5 rounded-xl shrink-0"
                >
                  <Star className={`w-4 h-4 ${isFeatured(c.id) ? "fill-current" : ""}`} />
                  {isFeatured(c.id) ? "Featured" : "Set Featured"}
                </Button>
              </motion.div>
            ))}
            {courses.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No courses found.</p>}
          </div>

          {featured.length > 0 && (
            <>
              <h2 className="font-display font-bold text-base mb-3">Currently Featured</h2>
              <div className="space-y-2">
                {featured.map((f) => (
                  <div key={f.id} className="glass-card rounded-2xl p-3 md:p-4 flex items-center gap-3 md:gap-4">
                    <img src={f.image_url} alt={f.title} className="w-16 h-12 md:w-24 md:h-16 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{f.title}</p>
                      <p className="text-xs text-muted-foreground">{f.link_url}</p>
                    </div>
                    <Switch checked={f.is_active} onCheckedChange={(checked) => handleToggleActive(f.id, checked)} />
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteFeatured(f.id)} className="text-destructive h-8 w-8">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </AdminPageWrapper>
  );
};

export default AdminFeatured;
