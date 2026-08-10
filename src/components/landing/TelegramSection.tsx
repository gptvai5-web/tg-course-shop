import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const TelegramSection = () => {
  return (
    <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-border/40"
          style={{
            background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--background)) 100%)",
          }}
        >
          {/* Glow effect */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[70%] h-[60%] rounded-full opacity-30 blur-[80px] pointer-events-none"
            style={{ background: "hsl(var(--primary))" }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-1/3 opacity-40 pointer-events-none"
            style={{
              background: "linear-gradient(0deg, hsl(var(--primary) / 0.25) 0%, transparent 100%)",
            }}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 sm:px-12 py-16 sm:py-24">
            <h2 className="text-foreground font-display font-bold text-2xl sm:text-3xl md:text-4xl leading-tight max-w-lg">
              Join our Telegram channel today
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base mt-3 sm:mt-4 max-w-md">
              Get instant updates, free resources, and connect with thousands of learners.
            </p>
            <a
              href="https://t.me/Free_Paid_Course01"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 sm:mt-8"
            >
              <Button
                size="lg"
                className="rounded-full px-8 gap-2 text-sm font-semibold shadow-lg"
              >
                <Send className="w-4 h-4" />
                Join Telegram
              </Button>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TelegramSection;
