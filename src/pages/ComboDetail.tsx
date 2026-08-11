import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Users, Package, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import LoginDialog from "@/components/auth/LoginDialog";
import confetti from "canvas-confetti";

interface ComboCourse {
  id: string;
  title: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string;
  category: string;
  offer_end_date: string | null;
  offer_label: string | null;
  instructor_name: string;
  duration: string;
  lessons_count: number;
  level: string;
  slug: string | null;
}

interface IncludedCourse {
  id: string;
  title: string;
  image_url: string;
  category: string;
  instructor_name: string;
  duration: string;
}

const ComboDetail = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [combo, setCombo] = useState<ComboCourse | null>(null);
  const [includedCourses, setIncludedCourses] = useState<IncludedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ discount_type: string; discount_value: number; code: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!combo?.offer_end_date) { setCountdown(null); return; }
    const tick = () => {
      const end = new Date(combo.offer_end_date!).getTime();
      const diff = end - Date.now();
      if (diff <= 0) { setCountdown(null); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [combo?.offer_end_date]);

  useEffect(() => {
    const fetchCombo = async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paramId || "");
      let data: any = null;
      if (isUuid) {
        const res = await (supabase.from as any)("combo_courses").select("*").eq("id", paramId).single();
        data = res.data;
      } else {
        const res = await (supabase.from as any)("combo_courses").select("*").eq("slug", paramId).single();
        data = res.data;
      }
      if (data) {
        setCombo(data);
        // Fetch included courses
        const { data: items } = await (supabase.from as any)("combo_course_items").select("course_id").eq("combo_id", data.id);
        if (items && items.length > 0) {
          const courseIds = items.map((i: any) => i.course_id);
          const { data: courses } = await supabase.from("courses").select("id, title, image_url, category, instructor_name, duration").in("id", courseIds);
          setIncludedCourses((courses as IncludedCourse[]) || []);
        }
      }
      setLoading(false);
    };
    if (paramId) fetchCombo();
  }, [paramId]);

  useEffect(() => {
    if (!user || !combo) return;
    (supabase.from as any)("combo_enrollments").select("id").eq("user_id", user.id).eq("combo_id", combo.id).then(({ data }: any) => {
      if (data && data.length > 0) setIsEnrolled(true);
    });
  }, [user, combo]);

  const getFinalPrice = () => {
    if (!combo || !couponApplied) return combo?.price || 0;
    if (couponApplied.discount_type === "percentage") {
      return Math.max(0, Math.round(combo.price * (1 - couponApplied.discount_value / 100)));
    }
    return Math.max(0, combo.price - couponApplied.discount_value);
  };

  const applyCoupon = async () => {
    if (!couponCode.trim() || !combo) return;
    setApplyingCoupon(true);
    setCouponError("");
    
    // Try combo-specific coupon
    const { data: comboData } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.trim().toUpperCase())
      .eq("is_active", true)
      .or(`combo_id.eq.${combo.id},is_universal.eq.true`)
      .limit(1);

    const coupon = comboData?.[0];
    if (!coupon) {
      setCouponError("Invalid or expired coupon code.");
      setCouponApplied(null);
    } else if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
      setCouponError("This coupon has reached its usage limit.");
      setCouponApplied(null);
    } else {
      setCouponApplied({ discount_type: coupon.discount_type, discount_value: Number(coupon.discount_value), code: coupon.code });
      setCouponError("");
    }
    setApplyingCoupon(false);
  };

  const handleEnroll = async () => {
    if (!user) { setLoginDialogOpen(true); return; }
    if (!combo) return;
    setEnrolling(true);

    const finalPrice = couponApplied ? getFinalPrice() : combo.price;

    if (finalPrice <= 0) {
      // Free — enroll directly in combo + all courses
      await (supabase.from as any)("combo_enrollments").insert({ user_id: user.id, combo_id: combo.id });
      const courseIds = includedCourses.map(c => c.id);
      if (courseIds.length > 0) {
        const rows = courseIds.map(course_id => ({ user_id: user.id, course_id }));
        await supabase.from("enrollments").insert(rows);
      }
      setIsEnrolled(true);
      toast({ title: "Enrolled!", description: "You have been successfully enrolled in this combo." });
      // confetti
      const end = Date.now() + 1500;
      const fire = () => {
        confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 }, colors: ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"] });
        if (Date.now() < end) requestAnimationFrame(fire);
      };
      fire();
      setTimeout(() => navigate("/learn"), 2000);
      setEnrolling(false);
      return;
    }

    // Paid — initiate payment
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/initiate-payment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            course_id: includedCourses[0]?.id || combo.id, // reference course
            combo_id: combo.id,
            amount: finalPrice,
            coupon_code: couponApplied?.code || null,
            cust_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Student",
            cust_email: user.email || "",
            cust_phone: user.user_metadata?.phone || "01700000000",
          }),
        }
      );
      const data = await res.json();
      if (data.success && data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        toast({ title: "Payment Error", description: data.error || "Could not initiate payment", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Payment failed", variant: "destructive" });
    }
    setEnrolling(false);
  };

  const discount = combo?.original_price && combo.original_price > combo.price
    ? Math.round(((combo.original_price - combo.price) / combo.original_price) * 100) : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 container mx-auto px-4">
          <div className="h-8 w-40 bg-muted rounded animate-pulse mb-8" />
          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            <div className="bg-card rounded-2xl h-[500px] animate-pulse border border-border" />
            <div className="bg-card rounded-2xl h-[500px] animate-pulse border border-border" />
          </div>
        </div>
      </div>
    );
  }

  if (!combo) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 container mx-auto px-4 text-center py-20">
          <h1 className="text-2xl font-display font-bold mb-4">Combo not found</h1>
          <Link to="/courses"><Button variant="outline">Back to Courses</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-dot-grid">
      <Navbar />
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link to="/courses" className="inline-flex items-center gap-2 text-primary font-medium text-sm mb-8 hover:gap-3 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>
          </motion.div>

          {/* Offer Countdown */}
          {countdown && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-destructive" />
                <span className="font-display font-bold text-sm md:text-base text-destructive">
                  {combo?.offer_label || "Offer Ends In:"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {[
                  { value: countdown.hours, label: "HOURS" },
                  { value: countdown.minutes, label: "MINUTES" },
                  { value: countdown.seconds, label: "SECONDS" },
                ].map((item, i) => (
                  <React.Fragment key={item.label}>
                    {i > 0 && <span className="text-xl font-bold text-destructive">:</span>}
                    <div className="bg-card border border-border rounded-xl w-14 h-14 md:w-16 md:h-16 flex flex-col items-center justify-center shadow-sm">
                      <span className="text-lg md:text-2xl font-display font-extrabold text-destructive leading-none">
                        {String(item.value).padStart(2, "0")}
                      </span>
                      <span className="text-[7px] md:text-[9px] font-bold text-muted-foreground tracking-widest mt-0.5">{item.label}</span>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          )}

          <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
            {/* Left — Overview */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl overflow-hidden order-2 lg:order-1">
              <div className="border-b border-border">
                <div className="flex">
                  <button className="flex items-center gap-2 px-6 py-4 text-sm font-semibold text-primary border-b-2 border-primary">
                    <Package className="w-4 h-4" /> Combo Overview
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                {/* Description */}
                <div>
                  <h3 className="font-display font-bold text-lg mb-3">About This Combo</h3>
                  <div className={`text-muted-foreground text-sm leading-relaxed ${!showMore ? "line-clamp-4" : ""}`}>
                    <p>{combo.description}</p>
                  </div>
                  {combo.description.length > 200 && (
                    <button onClick={() => setShowMore(!showMore)} className="text-primary text-sm font-medium mt-2 hover:underline">
                      {showMore ? "Show less" : "See more"}
                    </button>
                  )}
                </div>

                {/* Included Courses */}
                <div>
                  <h3 className="font-display font-bold text-lg mb-4">
                    Included Courses ({includedCourses.length})
                  </h3>
                  <div className="space-y-3">
                    {includedCourses.map((course) => (
                      <div key={course.id} className="flex items-center gap-4 p-3 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 transition-colors">
                        <img src={course.image_url || "/placeholder.svg"} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">{course.title}</p>
                          <p className="text-xs text-muted-foreground">{course.category} · {course.instructor_name}</p>
                        </div>
                        <CheckCircle className="w-5 h-5 text-primary shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* What you'll learn */}
                <div className="bg-accent/50 border border-primary/10 rounded-xl p-5">
                  <h3 className="font-display font-bold text-lg mb-3">What you'll learn</h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      "Complete syllabus coverage",
                      "Live doubt clearing sessions",
                      "Practice MCQs & worksheets",
                      "Exam preparation tips",
                      "Video lectures on demand",
                      "Certificate of completion",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right — Pricing */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="lg:sticky lg:top-24 order-1 lg:order-2">
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <div className="relative h-56 overflow-hidden">
                  <img src={combo.image_url || "/placeholder.svg"} alt={combo.title} className="w-full h-full object-cover" />
                  <div className="absolute top-3 right-3">
                    <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-md">COMBO</span>
                  </div>
                </div>

                <div className="p-5 space-y-5">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-display font-extrabold">৳{couponApplied ? getFinalPrice() : combo.price}</span>
                    {couponApplied && <span className="text-lg text-muted-foreground line-through">৳{combo.price}</span>}
                    {!couponApplied && combo.original_price && combo.original_price > combo.price && (
                      <span className="text-lg text-muted-foreground line-through">৳{combo.original_price}</span>
                    )}
                  </div>

                  {discount && !couponApplied && <span className="inline-block text-sm font-bold text-destructive">{discount}% OFF</span>}
                  {couponApplied && (
                    <span className="inline-block text-sm font-bold text-green-600">
                      Coupon "{couponApplied.code}" applied — {couponApplied.discount_type === "percentage" ? `${couponApplied.discount_value}%` : `৳${couponApplied.discount_value}`} OFF
                    </span>
                  )}

                  {/* Coupon */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter coupon code"
                        className="flex-1 rounded-xl" disabled={!!couponApplied} />
                      {couponApplied ? (
                        <Button variant="outline" className="rounded-xl" onClick={() => { setCouponApplied(null); setCouponCode(""); }}>Remove</Button>
                      ) : (
                        <Button variant="outline" className="rounded-xl" onClick={applyCoupon} disabled={applyingCoupon || !couponCode.trim()}>
                          {applyingCoupon ? "..." : "Apply"}
                        </Button>
                      )}
                    </div>
                    {couponError && <p className="text-sm text-destructive">{couponError}</p>}
                  </div>

                  {/* Enroll Button */}
                  {isEnrolled ? (
                    <Button className="w-full h-14 text-base font-bold rounded-xl bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
                      onClick={() => navigate(`/combo/${combo.id}/courses`)}>
                      View Courses →
                    </Button>
                  ) : (
                    <Button className="w-full h-14 text-base font-bold rounded-xl bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
                      disabled={enrolling} onClick={handleEnroll}>
                      {enrolling ? "Processing..." : (couponApplied ? getFinalPrice() : combo.price) <= 0 ? "Enroll Free" : "Pay & Enroll Now"}
                    </Button>
                  )}

                  {/* Stats */}
                  <div className="space-y-0 divide-y divide-border">
                    <div className="flex items-center justify-between py-3">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4" /> Courses Included
                      </span>
                      <span className="text-sm font-bold">{includedCourses.length}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Package className="w-4 h-4" /> Category
                      </span>
                      <span className="text-sm font-bold">{combo.category}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      <Footer />
      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </div>
  );
};

export default ComboDetail;
