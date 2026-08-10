import { useEffect, useState } from "react";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Search, Trash2, Ban, CheckCircle, RefreshCw, Mail, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Course {
  id: string;
  title: string;
}

interface ComboCourse {
  id: string;
  title: string;
  courseIds: string[];
}

interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  status: string;
  enrolled_by: string;
  profile_name: string | null;
  profile_email: string | null;
  course_title: string;
}

const ManualEnroll = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [combos, setCombos] = useState<ComboCourse[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [lookupResult, setLookupResult] = useState<{ user_id: string; email: string } | null>(null);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState("");
  const [enrollmentSearch, setEnrollmentSearch] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedComboId, setSelectedComboId] = useState("");
  const [enrollType, setEnrollType] = useState("course");
  const [enrolling, setEnrolling] = useState(false);
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [profileMap, setProfileMap] = useState<Record<string, { name: string | null; email: string | null }>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: profilesData }, { data: coursesData }, { data: enrollmentsData }, { data: combosData }, { data: comboItemsData }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("courses").select("id, title").eq("is_active", true).order("title"),
      supabase.from("enrollments").select("*").order("enrolled_at", { ascending: false }),
      (supabase.from as any)("combo_courses").select("id, title").eq("is_active", true).order("title"),
      (supabase.from as any)("combo_course_items").select("combo_id, course_id"),
    ]);

    const pMap: Record<string, { name: string | null; email: string | null }> = {};
    (profilesData || []).forEach(p => {
      pMap[p.user_id] = { name: p.full_name, email: null };
    });
    setProfileMap(pMap);
    setCourses(coursesData || []);

    // Build combos with course IDs
    const itemsMap = new Map<string, string[]>();
    ((comboItemsData as any[]) || []).forEach((item: any) => {
      if (!itemsMap.has(item.combo_id)) itemsMap.set(item.combo_id, []);
      itemsMap.get(item.combo_id)!.push(item.course_id);
    });
    const combosWithIds = ((combosData as any[]) || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      courseIds: itemsMap.get(c.id) || [],
    }));
    setCombos(combosWithIds);

    const mapped = (enrollmentsData || []).map((e: any) => ({
      ...e,
      status: e.status || "active",
      enrolled_by: e.enrolled_by || "self",
      profile_name: pMap[e.user_id]?.name || null,
      profile_email: pMap[e.user_id]?.email || null,
      course_title: coursesData?.find(c => c.id === e.course_id)?.title || "Unknown Course",
    }));
    setEnrollments(mapped);
  };

  const handleEmailLookup = async () => {
    if (!emailInput.trim()) return;
    setLookupLoading(true);
    setLookupError("");
    setLookupResult(null);

    const { data, error } = await supabase.functions.invoke("lookup-user-by-email", {
      body: { email: emailInput.trim() },
    });

    if (error || data?.error) {
      setLookupError(data?.error || error?.message || "User not found");
      setLookupLoading(false);
      return;
    }

    setLookupResult({ user_id: data.user_id, email: data.email });
    setLookupLoading(false);
  };

  const filteredEnrollments = enrollments.filter(e => {
    const matchesSearch = enrollmentSearch === "" ||
      (e.profile_name || "").toLowerCase().includes(enrollmentSearch.toLowerCase()) ||
      e.course_title.toLowerCase().includes(enrollmentSearch.toLowerCase()) ||
      e.user_id.toLowerCase().includes(enrollmentSearch.toLowerCase());
    const matchesCourse = filterCourse === "all" || e.course_id === filterCourse;
    const matchesStatus = filterStatus === "all" || e.status === filterStatus;
    return matchesSearch && matchesCourse && matchesStatus;
  }).sort((a, b) => {
    if (lookupResult) {
      const aMatch = a.user_id === lookupResult.user_id ? 0 : 1;
      const bMatch = b.user_id === lookupResult.user_id ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }
    return 0;
  });

  const handleEnroll = async () => {
    if (!lookupResult) {
      toast({ title: "Error", description: "Look up a student by email first", variant: "destructive" });
      return;
    }

    if (enrollType === "combo") {
      if (!selectedComboId) {
        toast({ title: "Error", description: "Select a combo package", variant: "destructive" });
        return;
      }
      await handleComboEnroll();
    } else {
      if (!selectedCourseId) {
        toast({ title: "Error", description: "Select a course", variant: "destructive" });
        return;
      }
      await handleCourseEnroll();
    }
  };

  const handleCourseEnroll = async () => {
    setEnrolling(true);
    const userId = lookupResult!.user_id;

    const { data: existing } = await supabase
      .from("enrollments")
      .select("id, status")
      .eq("user_id", userId)
      .eq("course_id", selectedCourseId);

    if (existing && existing.length > 0) {
      const e = existing[0] as any;
      if (e.status === "blocked") {
        const { error } = await supabase.from("enrollments").update({ status: "active", enrolled_by: "admin" } as any).eq("id", e.id);
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Success", description: "Enrollment reactivated!" });
        }
      } else {
        toast({ title: "Already enrolled", description: "This student is already enrolled.", variant: "destructive" });
      }
      setEnrolling(false);
      fetchData();
      return;
    }

    const { error } = await supabase.from("enrollments").insert({
      user_id: userId,
      course_id: selectedCourseId,
      status: "active",
      enrolled_by: "admin",
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Student enrolled successfully!" });
      resetForm();
    }
    setEnrolling(false);
    fetchData();
  };

  const handleComboEnroll = async () => {
    setEnrolling(true);
    const userId = lookupResult!.user_id;
    const combo = combos.find(c => c.id === selectedComboId);
    if (!combo) { setEnrolling(false); return; }

    // Enroll in combo_enrollments
    const { data: existingCombo } = await (supabase.from as any)("combo_enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("combo_id", selectedComboId)
      .maybeSingle();

    if (!existingCombo) {
      await (supabase.from as any)("combo_enrollments").insert({
        user_id: userId,
        combo_id: selectedComboId,
      });
    }

    // Enroll in all courses within the combo
    let enrolledCount = 0;
    for (const courseId of combo.courseIds) {
      const { data: existing } = await supabase
        .from("enrollments")
        .select("id")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .maybeSingle();

      if (!existing) {
        await supabase.from("enrollments").insert({
          user_id: userId,
          course_id: courseId,
          status: "active",
          enrolled_by: "admin",
        } as any);
        enrolledCount++;
      }
    }

    toast({ title: "Success", description: `Combo enrolled! ${enrolledCount} new course(s) added.` });
    resetForm();
    setEnrolling(false);
    fetchData();
  };

  const resetForm = () => {
    setLookupResult(null);
    setEmailInput("");
    setSelectedCourseId("");
    setSelectedComboId("");
  };

  const handleBlock = async (enrollmentId: string) => {
    if (!confirm("Block this student from this course?")) return;
    const { error } = await supabase.from("enrollments").update({ status: "blocked" } as any).eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Student blocked from course" });
      fetchData();
    }
  };

  const handleUnblock = async (enrollmentId: string) => {
    const { error } = await supabase.from("enrollments").update({ status: "active" } as any).eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Student unblocked" });
      fetchData();
    }
  };

  const handleRemove = async (enrollmentId: string) => {
    if (!confirm("Remove this enrollment completely?")) return;
    const { error } = await supabase.from("enrollments").delete().eq("id", enrollmentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Enrollment removed" });
      fetchData();
    }
  };

  const statusBadge = (status: string) => {
    if (status === "blocked") return <Badge variant="destructive" className="text-[10px]">Blocked</Badge>;
    return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-[10px]">Active</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8 transition-all duration-300">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 md:mb-8">
          <h1 className="text-xl md:text-2xl font-display font-bold">Course Enrollment Management</h1>
          <p className="text-muted-foreground text-sm mt-1">Enroll, remove, or block students from courses</p>
        </motion.div>

        {/* Enroll Form */}
        <div className="max-w-lg bg-card border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2"><UserPlus className="w-4 h-4 text-primary" /> Manual Enroll</h2>
          
          {/* Email lookup */}
          <div className="mb-4">
            <label className="text-sm font-medium mb-2 block">Student Email</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Enter student email..."
                  value={emailInput}
                  onChange={e => { setEmailInput(e.target.value); setLookupError(""); setLookupResult(null); }}
                  onKeyDown={e => e.key === "Enter" && handleEmailLookup()}
                  className="pl-10 rounded-xl"
                />
              </div>
              <Button onClick={handleEmailLookup} disabled={lookupLoading || !emailInput.trim()} variant="outline" className="rounded-xl gap-2">
                <Search className="w-4 h-4" />
                {lookupLoading ? "..." : "Find"}
              </Button>
            </div>
            {lookupError && <p className="text-xs text-destructive mt-2">{lookupError}</p>}
            {lookupResult && (
              <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <p className="text-sm font-medium text-emerald-600">✓ User found: {lookupResult.email}</p>
                <p className="text-xs text-muted-foreground">ID: {lookupResult.user_id.slice(0, 12)}...</p>
              </div>
            )}
          </div>

          {/* Enroll type tabs */}
          <div className="mb-4">
            <Tabs value={enrollType} onValueChange={setEnrollType}>
              <TabsList className="w-full">
                <TabsTrigger value="course" className="flex-1 gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Course
                </TabsTrigger>
                <TabsTrigger value="combo" className="flex-1 gap-1.5">
                  <Package className="w-3.5 h-3.5" /> Combo Package
                </TabsTrigger>
              </TabsList>
              <TabsContent value="course" className="mt-3">
                <label className="text-sm font-medium mb-2 block">Select Course</label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
              <TabsContent value="combo" className="mt-3">
                <label className="text-sm font-medium mb-2 block">Select Combo Package</label>
                <Select value={selectedComboId} onValueChange={setSelectedComboId}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select a combo package" /></SelectTrigger>
                  <SelectContent>
                    {combos.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.title} ({c.courseIds.length} courses)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TabsContent>
            </Tabs>
          </div>

          <Button onClick={handleEnroll} disabled={enrolling || !lookupResult || (enrollType === "course" ? !selectedCourseId : !selectedComboId)} className="w-full rounded-xl gap-2">
            <UserPlus className="w-4 h-4" /> {enrolling ? "Enrolling..." : enrollType === "combo" ? "Enroll in Combo" : "Enroll Student"}
          </Button>
        </div>

        {/* Enrollment List */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 mb-5">
            <h2 className="text-base font-semibold">All Enrollments ({filteredEnrollments.length})</h2>
            <div className="flex flex-wrap gap-2 ml-auto">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input placeholder="Search..." value={enrollmentSearch} onChange={e => setEnrollmentSearch(e.target.value)} className="pl-8 h-8 text-xs w-40 rounded-lg" />
              </div>
              <Select value={filterCourse} onValueChange={setFilterCourse}>
                <SelectTrigger className="h-8 w-36 text-xs rounded-lg"><SelectValue placeholder="All Courses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="h-8 w-28 text-xs rounded-lg"><SelectValue placeholder="All Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchData}><RefreshCw className="w-3.5 h-3.5" /></Button>
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Course</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Enrolled By</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEnrollments.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">No enrollments found</TableCell></TableRow>
                ) : filteredEnrollments.map(e => (
                  <TableRow key={e.id} className={`hover:bg-muted/10 ${lookupResult && e.user_id === lookupResult.user_id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
                    <TableCell className="text-sm font-medium">{e.profile_name || "Unnamed"}</TableCell>
                    <TableCell className="text-sm">{e.course_title}</TableCell>
                    <TableCell>{statusBadge(e.status)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground capitalize">{e.enrolled_by}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {e.status === "active" ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-500 hover:text-amber-600" onClick={() => handleBlock(e.id)} title="Block">
                            <Ban className="w-3.5 h-3.5" />
                          </Button>
                        ) : (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500 hover:text-emerald-600" onClick={() => handleUnblock(e.id)} title="Unblock">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemove(e.id)} title="Remove">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManualEnroll;
