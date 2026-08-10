import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, GraduationCap, BookOpen, Calculator, FlaskConical, Code, Users } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const iconMap: Record<string, React.ElementType> = {
  GraduationCap, BookOpen, Calculator, FlaskConical, Code, Users,
};

const colorStyles: Record<string, { bg: string; iconBg: string }> = {
  "from-blue-50 to-cyan-50": { bg: "linear-gradient(135deg, hsl(248, 60%, 12%), hsl(270, 40%, 16%))", iconBg: "#B13BFF" },
  "from-green-50 to-emerald-50": { bg: "linear-gradient(135deg, hsl(248, 60%, 12%), hsl(142, 40%, 14%))", iconBg: "#22c55e" },
  "from-purple-50 to-violet-50": { bg: "linear-gradient(135deg, hsl(270, 50%, 14%), hsl(274, 40%, 18%))", iconBg: "#B13BFF" },
  "from-orange-50 to-amber-50": { bg: "linear-gradient(135deg, hsl(248, 60%, 12%), hsl(20, 40%, 16%))", iconBg: "#f85200" },
  "from-indigo-50 to-blue-50": { bg: "linear-gradient(135deg, hsl(248, 60%, 14%), hsl(260, 40%, 16%))", iconBg: "#6366f1" },
  "from-pink-50 to-rose-50": { bg: "linear-gradient(135deg, hsl(248, 50%, 12%), hsl(340, 40%, 16%))", iconBg: "#ec4899" },
};

interface LearningPath {
  id: string;
  title: string;
  description: string;
  icon_name: string;
  color: string;
  icon_color: string;
}

const LearningPathSection = () => {
  const [paths, setPaths] = useState<LearningPath[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("learning_paths")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      setPaths(data || []);
    };
    fetch();
  }, []);

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold">
            <span className="text-gradient">Choose Your Learning Path</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mt-4 text-base md:text-lg font-body">
            Discover diverse courses across multiple disciplines designed to help you excel in your academic and admission journey.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {paths.map((path, i) => {
            const Icon = iconMap[path.icon_name] || BookOpen;
            const styles = colorStyles[path.color] || { bg: "linear-gradient(135deg, hsl(248, 60%, 12%), hsl(270, 40%, 16%))", iconBg: "#B13BFF" };
            return (
              <Link to="/courses" key={path.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                style={{ background: styles.bg }}
                className="group relative p-6 md:p-8 rounded-2xl border border-border/50 hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 cursor-pointer hover:border-primary/30"
              >
                <div
                  style={{ backgroundColor: styles.iconBg }}
                  className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center mb-5 shadow-lg"
                >
                  <Icon className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-lg md:text-xl text-primary mb-2">
                  {path.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 font-body">
                  {path.description}
                </p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                  Explore <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default LearningPathSection;
