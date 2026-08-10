import { useEffect, useState } from "react";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { DollarSign, Search, Download, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface SaleRecord {
  id: string;
  user_id: string;
  course_id: string;
  amount: number;
  currency: string;
  status: string;
  payment_method: string | null;
  coupon_code: string | null;
  trx_id: string | null;
  invoice_number: string;
  created_at: string;
  user_name: string | null;
  user_email: string | null;
  course_title: string;
}

interface EnrollmentRecord {
  id: string;
  user_id: string;
  course_id: string;
  enrolled_at: string;
  status: string;
  enrolled_by: string;
  user_name: string | null;
  course_title: string;
  has_payment: boolean;
}

const AdminSales = () => {
  const [sales, setSales] = useState<SaleRecord[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCourse, setFilterCourse] = useState("all");
  const [tab, setTab] = useState<"payments" | "enrollments">("payments");
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: paymentsData }, { data: profilesData }, { data: coursesData }, { data: enrollmentsData }] = await Promise.all([
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("courses").select("id, title"),
      supabase.from("enrollments").select("*").order("enrolled_at", { ascending: false }),
    ]);

    const profileMap = new Map((profilesData || []).map(p => [p.user_id, p.full_name]));
    const courseMap = new Map((coursesData || []).map(c => [c.id, c.title]));
    setCourses(coursesData || []);

    setSales((paymentsData || []).map(p => ({
      ...p,
      user_name: profileMap.get(p.user_id) || null,
      user_email: null,
      course_title: courseMap.get(p.course_id) || "Unknown",
    })));

    const paymentUserCourseSet = new Set((paymentsData || []).map(p => `${p.user_id}_${p.course_id}`));

    setEnrollments((enrollmentsData || []).map((e: any) => ({
      ...e,
      status: e.status || "active",
      enrolled_by: e.enrolled_by || "self",
      user_name: profileMap.get(e.user_id) || null,
      course_title: courseMap.get(e.course_id) || "Unknown",
      has_payment: paymentUserCourseSet.has(`${e.user_id}_${e.course_id}`),
    })));

    setLoading(false);
  };

  const filteredSales = sales.filter(s => {
    const matchSearch = search === "" ||
      (s.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
      s.course_title.toLowerCase().includes(search.toLowerCase()) ||
      s.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (s.trx_id || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.coupon_code || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" || s.status === filterStatus;
    const matchCourse = filterCourse === "all" || s.course_id === filterCourse;
    return matchSearch && matchStatus && matchCourse;
  });

  const filteredEnrollments = enrollments.filter(e => {
    const matchSearch = search === "" ||
      (e.user_name || "").toLowerCase().includes(search.toLowerCase()) ||
      e.course_title.toLowerCase().includes(search.toLowerCase());
    const matchCourse = filterCourse === "all" || e.course_id === filterCourse;
    return matchSearch && matchCourse;
  });

  const totalRevenue = sales.filter(s => s.status === "completed").reduce((sum, s) => sum + s.amount, 0);
  const totalPaid = sales.filter(s => s.status === "completed").length;
  const totalCoupon = sales.filter(s => s.coupon_code).length;

  const statusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-[10px]">Completed</Badge>;
      case "pending": return <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/20 text-[10px]">Pending</Badge>;
      case "failed": return <Badge variant="destructive" className="text-[10px]">Failed</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const exportCSV = () => {
    const headers = ["Invoice", "Student", "Course", "Amount", "Currency", "Status", "Payment Method", "Coupon", "Transaction ID", "Date"];
    const rows = filteredSales.map(s => [
      s.invoice_number, s.user_name || "Unknown", s.course_title, s.amount, s.currency, s.status, s.payment_method || "", s.coupon_code || "", s.trx_id || "", new Date(s.created_at).toLocaleDateString()
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "sales-report.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminPageWrapper title="Sales & Transactions" subtitle="View all payments, enrollments, and coupon usage" icon={DollarSign}>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total Revenue", value: `৳${totalRevenue.toLocaleString()}`, color: "text-emerald-500" },
          { label: "Paid Orders", value: totalPaid, color: "text-primary" },
          { label: "Coupon Used", value: totalCoupon, color: "text-amber-500" },
          { label: "Total Enrollments", value: enrollments.length, color: "text-blue-500" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button variant={tab === "payments" ? "default" : "outline"} size="sm" onClick={() => setTab("payments")} className="rounded-lg text-xs">
          Payments ({sales.length})
        </Button>
        <Button variant={tab === "enrollments" ? "default" : "outline"} size="sm" onClick={() => setTab("enrollments")} className="rounded-lg text-xs">
          All Enrollments ({enrollments.length})
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs w-48 rounded-lg" />
        </div>
        {tab === "payments" && (
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="h-8 w-32 text-xs rounded-lg"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        )}
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="h-8 w-40 text-xs rounded-lg"><SelectValue placeholder="All Courses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={fetchAll}><RefreshCw className="w-3.5 h-3.5" /></Button>
        {tab === "payments" && (
          <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg gap-1 ml-auto" onClick={exportCSV}>
            <Download className="w-3 h-3" /> Export CSV
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : tab === "payments" ? (
        <div className="rounded-xl overflow-hidden border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Invoice</TableHead>
                <TableHead className="text-xs">Student</TableHead>
                <TableHead className="text-xs">Course</TableHead>
                <TableHead className="text-xs">Amount</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Method</TableHead>
                <TableHead className="text-xs">Coupon</TableHead>
                <TableHead className="text-xs">Trx ID</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No payments found</TableCell></TableRow>
              ) : filteredSales.map(s => (
                <TableRow key={s.id} className="hover:bg-muted/10">
                  <TableCell className="text-xs font-mono">{s.invoice_number}</TableCell>
                  <TableCell className="text-sm">{s.user_name || "Unknown"}</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">{s.course_title}</TableCell>
                  <TableCell className="text-sm font-semibold">{s.currency === "BDT" ? "৳" : "$"}{s.amount}</TableCell>
                  <TableCell>{statusBadge(s.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.payment_method || "-"}</TableCell>
                  <TableCell>{s.coupon_code ? <Badge variant="outline" className="text-[10px]">{s.coupon_code}</Badge> : <span className="text-muted-foreground text-xs">-</span>}</TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{s.trx_id || "-"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Student</TableHead>
                <TableHead className="text-xs">Course</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Enrolled By</TableHead>
                <TableHead className="text-xs">Paid</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No enrollments found</TableCell></TableRow>
              ) : filteredEnrollments.map(e => (
                <TableRow key={e.id} className="hover:bg-muted/10">
                  <TableCell className="text-sm">{e.user_name || "Unknown"}</TableCell>
                  <TableCell className="text-sm max-w-[150px] truncate">{e.course_title}</TableCell>
                  <TableCell>
                    {e.status === "blocked"
                      ? <Badge variant="destructive" className="text-[10px]">Blocked</Badge>
                      : <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-[10px]">Active</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground capitalize">{e.enrolled_by}</TableCell>
                  <TableCell>
                    {e.has_payment
                      ? <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/20 text-[10px]">Paid</Badge>
                      : <Badge variant="outline" className="text-[10px]">Free/Manual</Badge>}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{new Date(e.enrolled_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPageWrapper>
  );
};

export default AdminSales;
