import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { GraduationCap, Users, BookOpen, Target, Heart, Award, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const AboutUs = () => {
  const [stats, setStats] = useState({ students: 0, courses: 0, teachers: 0, lessons: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { data: statsData } = await supabase.rpc("get_public_stats");
      const statsResult = statsData as any;
      if (statsResult) {
        setStats({
          students: statsResult.total_enrollments || 0,
          courses: statsResult.total_courses || 0,
          teachers: statsResult.total_instructors || 0,
          lessons: statsResult.total_lessons || 0,
        });
      }
    };
    fetchStats();
  }, []);

  const values = [
    { icon: Target, title: "Our Mission", description: "To make quality education accessible to every student, regardless of their location or background." },
    { icon: Heart, title: "Our Vision", description: "A world where every student has the tools and guidance to achieve their academic dreams." },
    { icon: Award, title: "Our Promise", description: "Expert instructors, comprehensive courses, and unwavering support throughout your learning journey." },
  ];

  return (
    <div className="min-h-screen bg-background bg-dot-grid">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-20 relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-primary/8 rounded-full blur-[80px]" />
        </div>
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 px-5 py-2 rounded-full text-sm font-semibold text-primary mb-6">
              <GraduationCap className="w-4 h-4" /> About TG COURSE.SHOP
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-extrabold mb-6 tracking-tight">
              Empowering Students to <span className="text-gradient">Achieve More</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              TG COURSE.SHOP is Bangladesh's leading online education platform, dedicated to providing world-class
              learning experiences through expert instruction, interactive content, and personalized support.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: stats.students.toLocaleString(), label: "Students Enrolled", icon: Users },
              { value: stats.courses.toLocaleString(), label: "Active Courses", icon: BookOpen },
              { value: stats.teachers.toLocaleString(), label: "Expert Teachers", icon: Star },
              { value: stats.lessons.toLocaleString(), label: "Total Lessons", icon: GraduationCap },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-3xl font-display font-extrabold">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-display font-bold">What Drives Us</h2>
            <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Our core values shape everything we do</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="bg-card border border-border rounded-2xl p-8 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <v.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-display font-bold mb-3">{v.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{v.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-6">Our Story</h2>
            <div className="text-muted-foreground space-y-4 leading-relaxed text-base">
              <p>
                TG COURSE.SHOP was founded with a simple belief: every student deserves access to quality education.
                What started as a small initiative to help local students prepare for exams has grown into a
                comprehensive learning platform serving thousands of students across Bangladesh.
              </p>
              <p>
                Our team of dedicated instructors brings years of teaching experience, combining traditional
                academic excellence with modern learning techniques. Through video lectures, live classes,
                interactive quizzes, and personalized mentoring, we create an engaging learning environment
                that helps students not just pass exams, but truly understand and master their subjects.
              </p>
              <p>
                Today, we continue to expand our course offerings, improve our platform, and most importantly,
                empower students to achieve their dreams — one lesson at a time.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default AboutUs;
