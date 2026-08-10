import { useEffect, useState } from "react";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Review {
  id: string;
  student_name: string;
  review_text: string;
  rating: number;
  avatar_url: string | null;
  course_name: string;
}

const ReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("student_reviews")
        .select("*")
        .eq("is_visible", true)
        .order("created_at", { ascending: false })
        .limit(9);
      setReviews(data || []);
    };
    fetch();
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="py-20 md:py-28 bg-gradient-hero">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14 md:mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">Student Reviews</span>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-sidebar-foreground mt-3">
            What Our Students Say
          </h2>
          <p className="text-sidebar-foreground/60 max-w-xl mx-auto mt-3 text-base">
            Feedbacks from students who have transformed their learning journey with TG COURSE.SHOP
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {reviews.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="bg-sidebar-accent/80 backdrop-blur-sm border border-sidebar-border rounded-2xl p-5 md:p-6 hover:border-primary/30 transition-colors"
            >
              {/* Rating & Quote */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={`w-4 h-4 ${s < Math.round(review.rating) ? "text-warning fill-warning" : "text-sidebar-foreground/20"}`}
                    />
                  ))}
                  <span className="text-xs text-sidebar-foreground/50 ml-1">({review.rating})</span>
                </div>
                <Quote className="w-6 h-6 text-primary/40" />
              </div>

              {/* Review text */}
              <p className="text-sm text-sidebar-foreground/80 leading-relaxed mb-5 line-clamp-4">
                "{review.review_text}"
              </p>

              {/* Student info */}
              <div className="flex items-center gap-3 pt-4 border-t border-sidebar-border">
                {review.avatar_url ? (
                  <img src={review.avatar_url} alt={review.student_name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-foreground">
                      {review.student_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-sidebar-foreground">{review.student_name}</p>
                  <p className="text-xs text-sidebar-foreground/50">{review.course_name} · TG COURSE.SHOP</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsSection;
