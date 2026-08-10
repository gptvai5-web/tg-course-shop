import { useState, useEffect } from "react";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Ticket, Globe } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface Course { id: string; title: string; }
interface ComboCourse { id: string; title: string; }
interface Coupon {
  id: string; code: string; course_id: string | null; combo_id: string | null;
  is_universal: boolean; discount_type: string; discount_value: number;
  max_uses: number | null; used_count: number; is_active: boolean; created_at: string;
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [combos, setCombos] = useState<ComboCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [code, setCode] = useState("");
  const [couponTarget, setCouponTarget] = useState("course"); // course | combo | universal
  const [courseId, setCourseId] = useState("");
  const [comboId, setComboId] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [maxUses, setMaxUses] = useState("");

  const fetchData = async () => {
    const [{ data: cData }, { data: coData }, { data: comboData }] = await Promise.all([
      supabase.from("coupons").select("*").order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title").eq("is_active", true).order("title"),
      (supabase.from as any)("combo_courses").select("id, title").eq("is_active", true).order("title"),
    ]);
    setCoupons((cData as Coupon[]) || []);
    setCourses((coData as Course[]) || []);
    setCombos((comboData as ComboCourse[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const resetForm = () => {
    setCode(""); setCourseId(""); setComboId(""); setCouponTarget("course");
    setDiscountType("percentage"); setDiscountValue(""); setMaxUses(""); setEditingCoupon(null);
  };

  const openEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setCode(c.code);
    if (c.is_universal) {
      setCouponTarget("universal");
      setCourseId(""); setComboId("");
    } else if (c.combo_id) {
      setCouponTarget("combo");
      setComboId(c.combo_id);
      setCourseId("");
    } else {
      setCouponTarget("course");
      setCourseId(c.course_id || "");
      setComboId("");
    }
    setDiscountType(c.discount_type);
    setDiscountValue(String(c.discount_value));
    setMaxUses(c.max_uses ? String(c.max_uses) : "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!code.trim() || !discountValue) {
      toast({ title: "Error", description: "Please fill code and discount value.", variant: "destructive" }); return;
    }
    if (couponTarget === "course" && !courseId) {
      toast({ title: "Error", description: "Please select a course.", variant: "destructive" }); return;
    }
    if (couponTarget === "combo" && !comboId) {
      toast({ title: "Error", description: "Please select a combo package.", variant: "destructive" }); return;
    }

    const payload: any = {
      code: code.trim().toUpperCase(),
      discount_type: discountType,
      discount_value: Number(discountValue),
      max_uses: maxUses ? Number(maxUses) : null,
      is_universal: couponTarget === "universal",
      course_id: couponTarget === "course" ? courseId : null,
      combo_id: couponTarget === "combo" ? comboId : null,
    };

    if (editingCoupon) {
      const { error } = await supabase.from("coupons").update(payload).eq("id", editingCoupon.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Updated", description: "Coupon updated successfully." });
    } else {
      const { error } = await supabase.from("coupons").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Created", description: "Coupon created successfully." });
    }
    setDialogOpen(false); resetForm(); fetchData();
  };

  const handleDelete = async (id: string) => { if (!confirm("Delete this coupon?")) return; await supabase.from("coupons").delete().eq("id", id); fetchData(); };
  const toggleActive = async (c: Coupon) => { await supabase.from("coupons").update({ is_active: !c.is_active }).eq("id", c.id); fetchData(); };

  const getTargetName = (c: Coupon) => {
    if (c.is_universal) return "All Courses";
    if (c.combo_id) return combos.find(co => co.id === c.combo_id)?.title || "Unknown Combo";
    return courses.find(co => co.id === c.course_id)?.title || "Unknown";
  };

  const getTargetBadge = (c: Coupon) => {
    if (c.is_universal) return <Badge variant="outline" className="text-[10px] gap-1"><Globe className="w-3 h-3" /> Universal</Badge>;
    if (c.combo_id) return <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Combo</Badge>;
    return <Badge variant="outline" className="text-[10px]">Course</Badge>;
  };

  return (
    <AdminPageWrapper
      title="Coupon Management"
      subtitle="Create and manage discount coupons for courses and combos"
      icon={Ticket}
      headerAction={
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2"><Plus className="w-4 h-4" /> Add Coupon</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingCoupon ? "Edit Coupon" : "Create Coupon"}</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div><Label>Coupon Code *</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. SAVE20" className="mt-1 rounded-xl" /></div>
              
              {/* Target selection */}
              <div>
                <Label>Apply To *</Label>
                <Select value={couponTarget} onValueChange={setCouponTarget}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="course">Specific Course</SelectItem>
                    <SelectItem value="combo">Combo Package</SelectItem>
                    <SelectItem value="universal">All Courses (Universal)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {couponTarget === "course" && (
                <div><Label>Course *</Label>
                  <Select value={courseId} onValueChange={setCourseId}>
                    <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select a course" /></SelectTrigger>
                    <SelectContent>{courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {couponTarget === "combo" && (
                <div><Label>Combo Package *</Label>
                  <Select value={comboId} onValueChange={setComboId}>
                    <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="Select a combo" /></SelectTrigger>
                    <SelectContent>{combos.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              )}

              {couponTarget === "universal" && (
                <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl">
                  <p className="text-sm text-primary font-medium">🌐 This coupon will work on all courses and combos</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><Label>Discount Type</Label>
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="percentage">Percentage (%)</SelectItem><SelectItem value="fixed">Fixed (৳)</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Discount Value *</Label><Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} className="mt-1 rounded-xl" /></div>
              </div>
              <div><Label>Max Uses (empty = unlimited)</Label><Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Unlimited" className="mt-1 rounded-xl" /></div>
              <Button onClick={handleSave} className="w-full rounded-xl">{editingCoupon ? "Update Coupon" : "Create Coupon"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 glass-card rounded-xl animate-pulse" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No coupons yet. Create your first coupon!</div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id} className="hover:bg-muted/10">
                  <TableCell className="font-mono font-bold">{c.code}</TableCell>
                  <TableCell>{getTargetBadge(c)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{getTargetName(c)}</TableCell>
                  <TableCell>{c.discount_type === "percentage" ? `${c.discount_value}%` : `৳${c.discount_value}`}</TableCell>
                  <TableCell>{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : " / ∞"}</TableCell>
                  <TableCell><Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} /></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPageWrapper>
  );
};

export default AdminCoupons;
