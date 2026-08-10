import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  accentColor?: string;
}

const StatsCard = ({ title, value, change, icon: Icon, accentColor }: Props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, scale: 1.01 }}
      transition={{ duration: 0.3 }}
      className="glass-stats rounded-2xl p-5 sm:p-6 relative overflow-hidden group cursor-default"
    >
      {/* Subtle glow accent */}
      <div
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl group-hover:opacity-30 transition-opacity"
        style={{ background: accentColor || "hsl(var(--primary))" }}
      />

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-xs sm:text-sm text-muted-foreground font-medium mb-1.5">{title}</p>
          <p className="text-2xl sm:text-3xl font-display font-extrabold tracking-tight">{value}</p>
          {change && (
            <p className="text-xs text-success mt-2 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              {change}
            </p>
          )}
        </div>
        <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center backdrop-blur-sm">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        </div>
      </div>
    </motion.div>
  );
};

export default StatsCard;
