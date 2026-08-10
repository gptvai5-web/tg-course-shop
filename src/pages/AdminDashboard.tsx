import { useEffect, useState } from "react";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import StatsCard from "@/components/dashboard/StatsCard";
import { Users, BookOpen, DollarSign, TrendingUp, ShieldCheck, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AdminUser {
  user_id: string;
  email: string;
  full_name: string;
}

const AdminDashboard = () => {
  const [totalStudents, setTotalStudents] = useState(0);
  const [totalCourses, setTotalCourses] = useState(0);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [totalTeachers, setTotalTeachers] = useState(0);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [recentEnrollments, setRecentEnrollments] = useState<any[]>([]);

  useEffect(() => {
    fetchStats();
    fetchAdmins();
    fetchRecentEnrollments();
  }, []);

  const fetchStats = async () => {
    const [{ count: studentsCount }, { count: coursesCount }, { count: enrollCount }, { count: teachersCount }] = await Promise.all([
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
      supabase.from("courses").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("enrollments").select("*", { count: "exact", head: true }),
      supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "teacher"),
    ]);
    setTotalStudents(studentsCount || 0);
    setTotalCourses(coursesCount || 0);
    setTotalEnrollments(enrollCount || 0);
    setTotalTeachers(teachersCount || 0);
  };

  const fetchAdmins = async () => {
    const { data } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    if (!data) return;
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name").in("user_id", data.map(d => d.user_id));
    const adminList = data.map(d => {
      const profile = profiles?.find(p => p.user_id === d.user_id);
      return { user_id: d.user_id, email: "", full_name: profile?.full_name || "Admin" };
    });
    setAdmins(adminList);
  };

  const fetchRecentEnrollments = async () => {
    const { data } = await supabase
      .from("enrollments")
      .select("id, user_id, course_id, enrolled_at")
      .order("enrolled_at", { ascending: false })
      .limit(5);
    if (!data) return;
    const courseIds = [...new Set(data.map(e => e.course_id))];
    const userIds = [...new Set(data.map(e => e.user_id))];
    const [{ data: courses }, { data: profiles }] = await Promise.all([
      supabase.from("courses").select("id, title").in("id", courseIds),
      supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
    ]);
    setRecentEnrollments(data.map(e => ({
      ...e,
      course_title: courses?.find(c => c.id === e.course_id)?.title || "Unknown",
      user_name: profiles?.find(p => p.user_id === e.user_id)?.full_name || "Student",
    })));
  };

  const handleAddAdmin = async () => {
    const input = newAdminEmail.trim();
    if (!input) return;
    setAddingAdmin(true);

    let userId = input;

    // If input looks like an email, look up user_id via edge function
    if (input.includes("@")) {
      const { data: lookupData, error: lookupError } = await supabase.functions.invoke("lookup-user-by-email", {
        body: { email: input },
      });

      if (lookupError || !lookupData?.user_id) {
        toast({ title: "User not found", description: "No account found with this email. Make sure the user has signed up first.", variant: "destructive" });
        setAddingAdmin(false);
        return;
      }
      userId = lookupData.user_id;
    }

    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: "admin" as any });
    if (error) {
      if (error.message.includes("duplicate")) {
        toast({ title: "Already an admin", description: "This user is already an admin.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Admin added successfully" });
      setNewAdminEmail("");
      fetchAdmins();
    }
    setAddingAdmin(false);
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (!confirm("Remove this admin?")) return;
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin" as any);
    toast({ title: "Admin removed" });
    fetchAdmins();
  };

  return (
    <AdminPageWrapper title="Admin Dashboard" subtitle="Platform overview and management" icon={ShieldCheck}>
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <StatsCard title="Total Students" value={String(totalStudents)} icon={Users} accentColor="hsl(217, 91%, 55%)" />
        <StatsCard title="Total Courses" value={String(totalCourses)} icon={BookOpen} accentColor="hsl(142, 71%, 45%)" />
        <StatsCard title="Total Enrollments" value={String(totalEnrollments)} icon={DollarSign} accentColor="hsl(38, 92%, 50%)" />
        <StatsCard title="Total Teachers" value={String(totalTeachers)} icon={TrendingUp} accentColor="hsl(280, 70%, 55%)" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        {/* Manage Admins */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-5 md:p-6"
        >
          <h3 className="font-display font-bold text-base md:text-lg mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            Manage Admins
          </h3>
          <div className="flex gap-3 mb-4">
            <Input
              placeholder="Email or User ID (UUID)..."
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="rounded-xl bg-background/50"
            />
            <Button onClick={handleAddAdmin} disabled={addingAdmin} className="rounded-xl shrink-0">
              Add Admin
            </Button>
          </div>
          <div className="space-y-2">
            {admins.map((a) => (
              <div key={a.user_id} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-muted/20 backdrop-blur-sm border border-border/30 hover:bg-muted/30 transition-colors">
                <div>
                  <p className="text-sm font-medium">{a.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px] font-mono">{a.user_id}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveAdmin(a.user_id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            {admins.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No admins found</p>}
          </div>
        </motion.div>

        {/* Recent Enrollments */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl p-5 md:p-6"
        >
          <h3 className="font-display font-bold text-base md:text-lg mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-success" />
            </div>
            Recent Enrollments
          </h3>
          <div className="space-y-2">
            {recentEnrollments.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-2.5 px-3.5 rounded-xl hover:bg-muted/20 transition-colors">
                <div>
                  <p className="text-sm font-medium">{e.user_name}</p>
                  <p className="text-xs text-muted-foreground">{e.course_title}</p>
                </div>
                <span className="text-xs text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-full">{new Date(e.enrolled_at).toLocaleDateString()}</span>
              </div>
            ))}
            {recentEnrollments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No enrollments yet</p>}
          </div>
        </motion.div>
      </div>
    </AdminPageWrapper>
  );
};

export default AdminDashboard;
