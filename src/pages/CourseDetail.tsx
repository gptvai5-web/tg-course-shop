import React, { useEffect, useState, useCallback } from "react";
import confetti from "canvas-confetti";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { ArrowLeft, BookOpen, Users, Play, ClipboardCheck, CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { User } from "lucide-react";
import PaymentDialog from "@/components/payment/PaymentDialog";
import LoginDialog from "@/components/auth/LoginDialog";

interface InstructorData {
  id: string;
  name: string;
  title: string;
  avatar_url: string | null;
}

const InstructorDisplay = ({ name }: { name: string }) => {
  const [instructor, setInstructor] = useState<InstructorData | null>(null);

  useEffect(() => {
    supabase
      .from("instructors")
      .select("id, name, title, avatar_url")
      .eq("name", name)
      .eq("is_active", true)
      .maybeSingle()
      .then(({ data }) => setInstructor(data as InstructorData | null));
  }, [name]);

  return (
    <div className="flex items-center gap-4">
      {instructor?.avatar_url ? (
        <img src={instructor.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover shadow-md" />
      ) : (
        <div className="w-14 h-14 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg shadow-md">
          {name.charAt(0)}
        </div>
      )}
      <div>
        <p className="font-semibold">{instructor?.name || name}</p>
        <p className="text-sm text-muted-foreground">{instructor?.title || "Instructor"}</p>
      </div>
    </div>
  );
};

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
  offer_end_date: string | null;
  offer_label: string | null;
  slug: string | null;
}

const CourseDetail = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const id = paramId; // paramId can be UUID or slug
  const [resolvedCourseId, setResolvedCourseId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ discount_type: string; discount_value: number; code: string } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paymentInvoice, setPaymentInvoice] = useState("");
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const [realStudentCount, setRealStudentCount] = useState(0);
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!course?.offer_end_date) { setCountdown(null); return; }
    const tick = () => {
      const end = new Date(course.offer_end_date!).getTime();
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
  }, [course?.offer_end_date]);

  useEffect(() => {
    const fetchCourse = async () => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");
      let data: any = null;

      if (isUuid) {
        const res = await supabase.from("courses").select("*").eq("id", id).single();
        data = res.data;
      } else {
        // Try slug
        const res = await supabase.from("courses").select("*").eq("slug", id).single();
        data = res.data;
      }

      if (data) {
        setCourse(data as Course);
        setResolvedCourseId(data.id);
        // Use public stats function to get student count (works for anonymous users too)
        const { data: statsData } = await supabase.rpc("get_public_stats");
        const courseCounts = (statsData as any)?.course_student_counts || {};
        setRealStudentCount(courseCounts[data.id] || 0);
      } else {
        setCourse(null);
      }
      setLoading(false);
    };
    if (id) fetchCourse();
  }, [id]);

  useEffect(() => {
    if (!user || !resolvedCourseId) return;
    supabase
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", resolvedCourseId)
      .then(({ data }) => {
        if (data && data.length > 0) setIsEnrolled(true);
      });
  }, [user, resolvedCourseId]);

  const handleEnroll = async () => {
    if (!user) {
      setLoginDialogOpen(true);
      return;
    }
    if (!course) return;
    setEnrolling(true);

    const finalPrice = couponApplied ? getFinalPrice() : course.price;

    // Free course — enroll directly
    if (finalPrice <= 0) {
      const { error } = await supabase.from("enrollments").insert({ user_id: user.id, course_id: course.id });
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        setIsEnrolled(true);
        toast({ title: "Enrolled!", description: "You have been successfully enrolled in this course." });
        navigate("/learn");
      }
      setEnrolling(false);
      return;
    }

    // Paid course — initiate PayStation payment
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
            course_id: course.id,
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
        // Open payment in same tab
        window.location.href = data.payment_url;
      } else {
        toast({ title: "Payment Error", description: data.error || "Could not initiate payment", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Payment failed", variant: "destructive" });
    }
    setEnrolling(false);
  };

  const discount = course?.original_price && course.original_price > course.price
    ? Math.round(((course.original_price - course.price) / course.original_price) * 100)
    : null;

  const applyCoupon = async () => {
    if (!couponCode.trim() || !resolvedCourseId) return;
    setApplyingCoupon(true);
    setCouponError("");
    
    // Try course-specific coupon first, then universal
    const { data: specificData } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", couponCode.trim().toUpperCase())
      .eq("course_id", resolvedCourseId)
      .eq("is_active", true)
      .maybeSingle();

    let data = specificData;
    if (!data) {
      // Try universal coupon
      const { data: universalData } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .eq("is_universal", true)
        .eq("is_active", true)
        .maybeSingle();
      data = universalData;
    }

    if (!data) {
      setCouponError("Invalid or expired coupon code.");
      setCouponApplied(null);
    } else if (data.max_uses && data.used_count >= data.max_uses) {
      setCouponError("This coupon has reached its usage limit.");
      setCouponApplied(null);
    } else {
      setCouponApplied({ discount_type: data.discount_type, discount_value: Number(data.discount_value), code: data.code });
      setCouponError("");
    }
    setApplyingCoupon(false);
  };

  const getFinalPrice = () => {
    if (!course || !couponApplied) return course?.price || 0;
    if (couponApplied.discount_type === "percentage") {
      return Math.max(0, Math.round(course.price * (1 - couponApplied.discount_value / 100)));
    }
    return Math.max(0, course.price - couponApplied.discount_value);
  };

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

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-28 container mx-auto px-4 text-center py-20">
          <h1 className="text-2xl font-display font-bold mb-4">Course not found</h1>
          <Link to="/courses">
            <Button variant="outline">Back to Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-dot-grid">
      <Navbar />

      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          {/* Back link */}
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
            <Link to="/courses" className="inline-flex items-center gap-2 text-primary font-medium text-sm mb-8 hover:gap-3 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>
          </motion.div>

          {/* Offer Countdown Timer */}
          {countdown && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-2xl border-2 border-destructive/20 bg-destructive/5 p-4 md:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-destructive" />
                <span className="font-display font-bold text-sm md:text-base text-destructive">
                  {course?.offer_label || "Discount Offer Ends In:"}
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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-2xl overflow-hidden order-2 lg:order-1"
            >
              {/* Tab bar */}
              <div className="border-b border-border">
                <div className="flex">
                  <button className="flex items-center gap-2 px-6 py-4 text-sm font-semibold text-primary border-b-2 border-primary">
                    <BookOpen className="w-4 h-4" />
                    Overview
                  </button>
                </div>
              </div>

              <div className="p-6 md:p-8 space-y-8">
                {/* Instructor */}
                <div>
                  <h3 className="font-display font-bold text-lg mb-4">Course Instructors</h3>
                  <InstructorDisplay name={course.instructor_name} />
                </div>

                {/* Description */}
                <div>
                  <h3 className="font-display font-bold text-lg mb-3">Course Description</h3>
                  <div className={`text-muted-foreground text-sm leading-relaxed ${!showMore ? "line-clamp-4" : ""}`}>
                    <p>{course.description}</p>
                    <p className="mt-3">
                      This comprehensive course covers {course.lessons_count} lessons over {course.duration}. 
                      Designed for {course.level.toLowerCase()} level students, you'll gain practical skills 
                      and deep understanding of the subject matter through video lectures, live classes, 
                      and interactive assessments.
                    </p>
                    <p className="mt-3">
                      Join {realStudentCount.toLocaleString()}+ students who are already learning with us. 
                      Get lifetime access to all course materials, live doubt-clearing sessions, and a certificate 
                      of completion.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMore(!showMore)}
                    className="text-primary text-sm font-medium mt-2 hover:underline"
                  >
                    {showMore ? "Show less" : "See more"}
                  </button>
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

            {/* Right — Pricing Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="lg:sticky lg:top-24 order-1 lg:order-2"
            >
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {/* Course Image */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-5 space-y-5">
                  {/* Price */}
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <span className="text-3xl font-display font-extrabold">
                      ৳{couponApplied ? getFinalPrice() : course.price}
                    </span>
                    {couponApplied && (
                      <span className="text-lg text-muted-foreground line-through">৳{course.price}</span>
                    )}
                    {!couponApplied && course.original_price && course.original_price > course.price && (
                      <span className="text-lg text-muted-foreground line-through">৳{course.original_price}</span>
                    )}
                  </div>

                  {discount && !couponApplied && (
                    <span className="inline-block text-sm font-bold text-destructive">{discount}% OFF</span>
                  )}
                  {couponApplied && (
                    <span className="inline-block text-sm font-bold text-green-600">
                      Coupon "{couponApplied.code}" applied — {couponApplied.discount_type === "percentage" ? `${couponApplied.discount_value}%` : `৳${couponApplied.discount_value}`} OFF
                    </span>
                  )}

                  {/* Coupon input */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Enter coupon code"
                        className="flex-1 rounded-xl"
                        disabled={!!couponApplied}
                      />
                      {couponApplied ? (
                        <Button variant="outline" className="rounded-xl" onClick={() => { setCouponApplied(null); setCouponCode(""); }}>
                          Remove
                        </Button>
                      ) : (
                        <Button variant="outline" className="rounded-xl" onClick={applyCoupon} disabled={applyingCoupon || !couponCode.trim()}>
                          {applyingCoupon ? "..." : "Apply"}
                        </Button>
                      )}
                    </div>
                    {couponError && <p className="text-sm text-destructive">{couponError}</p>}
                  </div>

                  {/* Enroll / Continue Button */}
                  {isEnrolled ? (
                    <Button
                      className="w-full h-14 text-base font-bold rounded-xl bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
                      onClick={() => navigate(`/course/${course.id}/content`)}
                    >
                      Continue Course →
                    </Button>
                  ) : (
                    <Button
                      className="w-full h-14 text-base font-bold rounded-xl bg-gradient-primary hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
                      disabled={enrolling}
                      onClick={handleEnroll}
                    >
                      {enrolling ? "Processing..." : (couponApplied ? getFinalPrice() : course.price) <= 0 ? "Enroll Free" : "Pay & Enroll Now"}
                    </Button>
                  )}

                  {/* Stats */}
                  <div className="space-y-0 divide-y divide-border">
                    <div className="flex items-center justify-between py-3">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="w-4 h-4" /> Students
                      </span>
                      <span className="text-sm font-bold">{realStudentCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Play className="w-4 h-4" /> Live Class
                      </span>
                      <span className="text-sm font-bold text-success">Included</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <ClipboardCheck className="w-4 h-4" /> Exam System
                      </span>
                      <span className="text-sm font-bold text-success">Included</span>
                    </div>
                    <div className="flex items-center justify-between py-3">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <BookOpen className="w-4 h-4" /> Lessons
                      </span>
                      <span className="text-sm font-bold">{course.lessons_count}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        paymentUrl={paymentUrl}
        courseName={course?.title || ""}
        amount={couponApplied ? getFinalPrice() : (course?.price || 0)}
        invoiceNumber={paymentInvoice}
        onPaymentComplete={(status) => {
          setPaymentDialogOpen(false);
          if (status === "success") {
            setIsEnrolled(true);
            // Fire confetti 🎉
            const end = Date.now() + 1500;
            const fire = () => {
              confetti({ particleCount: 80, spread: 100, origin: { y: 0.6 }, colors: ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"] });
              if (Date.now() < end) requestAnimationFrame(fire);
            };
            fire();
            toast({ title: "🎉 Payment Successful!", description: "You are now enrolled in this course." });
            setTimeout(() => navigate("/learn"), 2000);
          } else {
            toast({ title: "Payment Failed", description: "Please try again.", variant: "destructive" });
          }
        }}
      />

      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </div>
  );
};

export default CourseDetail;
