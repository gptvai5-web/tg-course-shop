import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { Clock, Save, X, Search, Timer, Tag } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Course {
  id: string;
  title: string;
  image_url: string;
  price: number;
  category: string;
  offer_end_date: string | null;
  offer_label: string | null;
}

const AdminOfferTimer = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [offerLabel, setOfferLabel] = useState("");
  const [offerDate, setOfferDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchCourses = async () => {
    const { data } = await supabase
      .from("courses")
      .select("id, title, image_url, price, category, offer_end_date, offer_label")
      .eq("is_active", true)
      .order("display_order");
    setCourses((data as Course[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCourses(); }, []);

  const startEdit = (course: Course) => {
    setEditingId(course.id);
    setOfferLabel(course.offer_label || "");
    setOfferDate(course.offer_end_date ? course.offer_end_date.slice(0, 16) : "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setOfferLabel("");
    setOfferDate("");
  };

  const saveOffer = async (courseId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("courses")
      .update({
        offer_label: offerLabel || null,
        offer_end_date: offerDate ? new Date(offerDate).toISOString() : null,
      })
      .eq("id", courseId);

    if (error) {
      toast.error("Failed to save offer");
    } else {
      toast.success("Offer timer updated!");
      cancelEdit();
      fetchCourses();
    }
    setSaving(false);
  };

  const removeOffer = async (courseId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("courses")
      .update({ offer_label: null, offer_end_date: null })
      .eq("id", courseId);

    if (error) {
      toast.error("Failed to remove offer");
    } else {
      toast.success("Offer removed!");
      fetchCourses();
    }
    setSaving(false);
  };

  const getTimeRemaining = (endDate: string) => {
    const diff = new Date(endDate).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${days}d ${hours}h ${mins}m remaining`;
  };

  const filtered = courses.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPageWrapper title="Offer Timer" icon={Timer}>
      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 rounded-xl"
        />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Timer className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No courses found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((course, idx) => {
            const isEditing = editingId === course.id;
            const hasOffer = course.offer_end_date && new Date(course.offer_end_date).getTime() > Date.now();

            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Course row */}
                <div className="flex items-center gap-4 p-4">
                  <img
                    src={course.image_url}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{course.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {course.category} • ৳{course.price}
                    </p>
                    {hasOffer && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-[11px] font-bold">
                          <Clock className="w-3 h-3" />
                          {getTimeRemaining(course.offer_end_date!)}
                        </span>
                        {course.offer_label && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                            <Tag className="w-3 h-3" />
                            {course.offer_label}
                          </span>
                        )}
                      </div>
                    )}
                    {course.offer_end_date && !hasOffer && (
                      <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[11px] font-bold">
                        Expired
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!isEditing && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-xs"
                          onClick={() => startEdit(course)}
                        >
                          {hasOffer ? "Edit" : "Set Offer"}
                        </Button>
                        {(course.offer_end_date) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="rounded-lg text-xs text-destructive hover:text-destructive"
                            onClick={() => removeOffer(course.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Edit panel */}
                {isEditing && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-border bg-accent/30 p-4"
                  >
                    <div className="grid sm:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Offer Title
                        </label>
                        <Input
                          placeholder="e.g. Eid Special Offer!"
                          value={offerLabel}
                          onChange={(e) => setOfferLabel(e.target.value)}
                          className="h-10 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                          Offer End Date & Time
                        </label>
                        <Input
                          type="datetime-local"
                          value={offerDate}
                          onChange={(e) => setOfferDate(e.target.value)}
                          className="h-10 rounded-lg"
                          min={new Date().toISOString().slice(0, 16)}
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="rounded-lg"
                        onClick={cancelEdit}
                      >
                        <X className="w-4 h-4 mr-1" /> Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-lg bg-primary"
                        onClick={() => saveOffer(course.id)}
                        disabled={saving}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {saving ? "Saving..." : "Save Offer"}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </AdminPageWrapper>
  );
};

export default AdminOfferTimer;
