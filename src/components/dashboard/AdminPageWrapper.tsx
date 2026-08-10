import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import DashboardSidebar from "./DashboardSidebar";

interface AdminPageWrapperProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
  badge?: React.ReactNode;
}

const AdminPageWrapper = ({ title, subtitle, icon: Icon, headerAction, children, badge }: AdminPageWrapperProps) => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Background decorative elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/3 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <DashboardSidebar />
      <main className="pt-14 md:pt-0 md:ml-64 p-4 md:p-8 transition-all duration-300 relative z-10">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start sm:items-center justify-between mb-6 md:mb-8 flex-col sm:flex-row gap-4"
        >
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold flex items-center gap-2.5">
              {Icon && (
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
              )}
              <span>{title}</span>
              {badge}
            </h1>
            {subtitle && <p className="text-muted-foreground text-sm mt-1 ml-[46px]">{subtitle}</p>}
          </div>
          {headerAction}
        </motion.div>

        {children}
      </main>
    </div>
  );
};

export default AdminPageWrapper;
