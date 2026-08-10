import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Users, BookOpen, User } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface TeacherUser {
  user_id: string;
  full_name: string;
}

const TeacherDashboard = () => {
  const [teachers, setTeachers] = useState<TeacherUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const { data: teacherRoles } = await supabase.from("user_roles").select("user_id").eq("role", "teacher");
    if (!teacherRoles || teacherRoles.length === 0) { setLoading(false); return; }
    
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", teacherRoles.map(t => t.user_id));
    setTeachers(teacherRoles.map(t => ({
      user_id: t.user_id,
      full_name: profiles?.find(p => p.user_id === t.user_id)?.full_name || "Teacher",
    })));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8 transition-all duration-300">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-display font-bold">Teacher Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">All registered teachers on the platform</p>
        </motion.div>

        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-card rounded-2xl animate-pulse border border-border" />)}
          </div>
        ) : teachers.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No teachers registered yet</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {teachers.map((t, i) => (
              <motion.div
                key={t.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm truncate">{t.full_name}</p>
                  <p className="text-xs text-muted-foreground">Teacher</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherDashboard;
