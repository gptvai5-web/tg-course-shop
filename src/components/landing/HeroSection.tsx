import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import heroImg from "@/assets/hero-illustration.png";
import { supabase } from "@/integrations/supabase/client";

const HeroSection = () => {
  const [stats, setStats] = useState({ courses: 0, teachers: 0, students: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [{ data: coursesData }, { data: instructorsData }, { count: enrollmentCount }] = await Promise.all([
        supabase.from("courses").select("id").eq("is_active", true),
        supabase.from("instructors").select("id").eq("is_active", true),
        supabase.from("enrollments").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        courses: coursesData?.length || 0,
        teachers: instructorsData?.length || 0,
        students: enrollmentCount || 0,
      });
    };
    fetchStats();
  }, []);

  return (
    <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/30 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-5 py-2.5 rounded-full text-sm font-semibold text-primary mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              #1 Online Learning Platform
            </motion.div>

            <h1 className="text-4xl md:text-5xl lg:text-[3.5rem] font-display font-extrabold leading-[1.1] mb-6 tracking-tight">
              Learn, Grow,{" "}
              <span className="text-gradient">Succeed</span>
              <br />
              <span className="text-muted-foreground font-bold text-3xl md:text-4xl lg:text-[2.5rem]">
                with Expert Guidance
              </span>
            </h1>

            <p className="text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Learn from the best instructors. Develop your skills through video lectures, live classes, and interactive quizzes.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link to="/login">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 transition-all gap-2 text-base px-8 h-13 rounded-xl shadow-lg shadow-primary/25">
                  Get Started <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2 text-base h-13 rounded-xl border-2">
                <Play className="w-4 h-4 fill-current" /> Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {[
                { value: stats.courses.toLocaleString(), label: "Courses" },
                { value: stats.teachers.toLocaleString(), label: "Teachers" },
                { value: stats.students.toLocaleString(), label: "Students" },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  {i > 0 && <div className="w-px h-10 bg-border hidden sm:block" />}
                  <div className={i > 0 ? "pl-3 sm:pl-6" : ""}>
                    <div className="text-2xl font-display font-extrabold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="hidden lg:block relative"
          >
            <div className="absolute inset-0 bg-gradient-primary rounded-3xl opacity-10 blur-2xl scale-90" />
            <img
              src={heroImg}
              alt="TG COURSE.SHOP Hero"
              className="w-full max-w-xl mx-auto drop-shadow-2xl relative z-10"
            />
            {/* Floating cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute top-8 -left-4 bg-card rounded-xl shadow-elevated p-3 flex items-center gap-2 border border-border"
            >
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="text-sm font-medium">100+ Live Classes</span>
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
              className="absolute bottom-12 -right-4 bg-card rounded-xl shadow-elevated p-3 flex items-center gap-2 border border-border"
            >
              <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-foreground">A+</span>
              </div>
              <span className="text-sm font-medium">Get Certified</span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
