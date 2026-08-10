import { Star, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const courses = [
  { title: "Complete Web Development Course", teacher: "John Smith", rating: 4.8, students: 1200, duration: "40 Hours", price: "$49", category: "Programming", color: "from-blue-500 to-cyan-400" },
  { title: "Graphic Design Masterclass", teacher: "Sarah Johnson", rating: 4.9, students: 850, duration: "30 Hours", price: "$39", category: "Design", color: "from-purple-500 to-pink-400" },
  { title: "Digital Marketing A-Z", teacher: "Emily Davis", rating: 4.7, students: 2100, duration: "25 Hours", price: "$59", category: "Marketing", color: "from-green-500 to-emerald-400" },
  { title: "English Speaking Course", teacher: "Michael Brown", rating: 4.6, students: 3500, duration: "20 Hours", price: "$29", category: "Language", color: "from-orange-500 to-amber-400" },
];

const CoursesSection = () => {
  return (
    <section id="courses" className="py-24">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4"
        >
          <div>
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Courses</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold mt-3 mb-2">
              Popular <span className="text-gradient">Courses</span>
            </h2>
            <p className="text-muted-foreground text-lg">Explore our most in-demand courses</p>
          </div>
          <Button variant="outline" className="gap-2 rounded-xl self-start md:self-auto">
            View All Courses <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {courses.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl border border-border overflow-hidden hover:shadow-elevated hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={`h-28 sm:h-40 bg-gradient-to-br ${c.color} flex items-center justify-center relative`}>
                <span className="text-[10px] sm:text-sm font-semibold bg-card/90 backdrop-blur-sm px-2 sm:px-4 py-1 sm:py-1.5 rounded-full text-foreground shadow-sm">
                  {c.category}
                </span>
              </div>
              <div className="p-3 sm:p-5">
                <h3 className="font-display font-bold text-xs sm:text-base mb-1 sm:mb-1.5 line-clamp-2 group-hover:text-primary transition-colors">
                  {c.title}
                </h3>
                <p className="text-[10px] sm:text-sm text-muted-foreground mb-2 sm:mb-4">{c.teacher}</p>
                <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                    <span className="font-medium text-foreground">{c.rating}</span>
                  </span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.students.toLocaleString()}</span>
                  <span className="w-1 h-1 rounded-full bg-border" />
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{c.duration}</span>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 sm:pt-4 border-t border-border gap-2">
                  <span className="font-display font-extrabold text-base sm:text-xl text-primary">{c.price}</span>
                  <Button size="sm" className="rounded-lg bg-gradient-primary hover:opacity-90 text-[10px] sm:text-xs px-2 sm:px-4 h-7 sm:h-8 w-full sm:w-auto">
                    Enroll Now
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
