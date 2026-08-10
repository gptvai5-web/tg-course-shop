import { BookOpen, Video, Users, Award, BarChart3, Shield } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  { icon: Video, title: "Video Lectures", desc: "Watch HD quality video lectures anytime, anywhere with unlimited replays", color: "from-blue-500/10 to-cyan-500/10" },
  { icon: BookOpen, title: "Interactive Quizzes", desc: "Test your knowledge with quizzes after every chapter and track scores", color: "from-purple-500/10 to-pink-500/10" },
  { icon: Users, title: "Live Classes", desc: "Join live sessions with direct Q&A interaction with expert teachers", color: "from-green-500/10 to-emerald-500/10" },
  { icon: Award, title: "Certificates", desc: "Earn industry-recognized certificates upon course completion", color: "from-orange-500/10 to-amber-500/10" },
  { icon: BarChart3, title: "Progress Tracking", desc: "Visual dashboards to track your learning journey and milestones", color: "from-rose-500/10 to-red-500/10" },
  { icon: Shield, title: "Secure Platform", desc: "Enterprise-grade security for your data and payment information", color: "from-indigo-500/10 to-violet-500/10" },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 bg-card relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Features</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-4">
            Why <span className="text-gradient">TG COURSE.SHOP?</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto text-lg">
            Everything you need for an effective and enjoyable learning experience
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="group relative p-7 rounded-2xl bg-background border border-border hover:border-primary/30 hover:shadow-elevated transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                <f.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
