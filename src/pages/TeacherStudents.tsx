import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Users, User, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface StudentWithCourses {
  user_id: string;
  full_name: string;
  courses: string[];
}

const TeacherStudents = () => {
  const [students, setStudents] = useState<StudentWithCourses[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    // Get all enrollments with course titles
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("user_id, course_id")
      .order("enrolled_at", { ascending: false });

    if (!enrollments || enrollments.length === 0) { setLoading(false); return; }

    const userIds = [...new Set(enrollments.map(e => e.user_id))];
    const courseIds = [...new Set(enrollments.map(e => e.course_id))];

    const [{ data: profiles }, { data: courses }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
      supabase.from("courses").select("id, title").in("id", courseIds),
    ]);

    const studentMap: Record<string, StudentWithCourses> = {};
    enrollments.forEach(e => {
      if (!studentMap[e.user_id]) {
        const profile = profiles?.find(p => p.user_id === e.user_id);
        studentMap[e.user_id] = { user_id: e.user_id, full_name: profile?.full_name || "Student", courses: [] };
      }
      const courseName = courses?.find(c => c.id === e.course_id)?.title || "Unknown";
      if (!studentMap[e.user_id].courses.includes(courseName)) {
        studentMap[e.user_id].courses.push(courseName);
      }
    });

    setStudents(Object.values(studentMap));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8 transition-all duration-300">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-display font-bold">My Students</h1>
          <p className="text-muted-foreground text-sm mt-1">All enrolled students with their course names</p>
        </motion.div>

        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-card rounded-2xl animate-pulse border border-border" />)}</div>
        ) : students.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No enrolled students yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {students.map((s, i) => (
              <motion.div
                key={s.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border rounded-2xl p-4 md:p-5"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm">{s.full_name}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.courses.map((course, ci) => (
                        <span key={ci} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                          {course}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TeacherStudents;
