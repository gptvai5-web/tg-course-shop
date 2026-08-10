import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  GraduationCap, LayoutDashboard, BookOpen, Users,
  LogOut, ShieldCheck, Image as ImageIcon,
  ChevronLeft, ChevronRight, Menu, X, Settings, FileText,
  UserCog, Ticket, MessageSquare, UserPlus, Package, Timer, DollarSign, LayoutGrid, Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

const DashboardSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, hasRole, user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadContact, setUnreadContact] = useState(0);
  const [newComments, setNewComments] = useState(0);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Fetch notification counts
  useEffect(() => {
    if (!hasRole("teacher") && !hasRole("admin")) return;
    const fetchCounts = async () => {
      const [{ count: contactCount }, { count: commentCount }] = await Promise.all([
        supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("video_comments").select("*", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 86400000).toISOString()),
      ]);
      setUnreadContact(contactCount || 0);
      setNewComments(commentCount || 0);
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [hasRole]);

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  const navSections: { title: string; items: { label: string; icon: React.ElementType; path: string; badge?: number }[] }[] = [];

  navSections.push({
    title: "Student",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, path: "/student" },
    ],
  });

  if (hasRole("teacher") || hasRole("admin")) {
    navSections.push({
      title: "Teacher",
      items: [
        { label: "Teacher Panel", icon: LayoutDashboard, path: "/teacher" },
        { label: "Manage Courses", icon: BookOpen, path: "/teacher/courses" },
        { label: "Course Content", icon: BookOpen, path: "/teacher/content" },
        { label: "Course Updates", icon: MessageSquare, path: "/teacher/updates" },
        { label: "Categories", icon: FileText, path: "/teacher/categories" },
        { label: "Course Levels", icon: Layers, path: "/teacher/levels" },
        { label: "My Students", icon: Users, path: "/teacher/students" },
        { label: "Manual Enroll", icon: UserPlus, path: "/teacher/enroll" },
        { label: "Comments", icon: MessageSquare, path: "/teacher/comments", badge: newComments },
      ],
    });
  }

  if (hasRole("admin")) {
    navSections.push({
      title: "Admin",
      items: [
        { label: "Admin Panel", icon: ShieldCheck, path: "/admin" },
        { label: "Featured", icon: ImageIcon, path: "/admin/featured" },
        { label: "Course Display", icon: LayoutGrid, path: "/admin/display" },
        { label: "Combo Courses", icon: Package, path: "/admin/combos" },
        { label: "Instructors", icon: UserCog, path: "/admin/instructors" },
        { label: "Coupons", icon: Ticket, path: "/admin/coupons" },
        { label: "Offer Timer", icon: Timer, path: "/admin/offers" },
        { label: "User Management", icon: Users, path: "/admin/users" },
        { label: "Contact", icon: MessageSquare, path: "/admin/contact", badge: unreadContact },
        { label: "Sales", icon: DollarSign, path: "/admin/sales" },
        { label: "Settings", icon: Settings, path: "/admin/settings" },
      ],
    });
  }

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const userAvatar = user?.user_metadata?.avatar_url;

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border/50 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden group">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-sidebar-primary/30 transition-colors">
            <GraduationCap className="w-5 h-5 text-sidebar-primary" />
          </div>
          {!collapsed && (
            <span className="font-display font-bold text-sidebar-foreground text-sm whitespace-nowrap">
              TG COURSE.SHOP
            </span>
          )}
        </Link>
        <button onClick={() => setMobileOpen(false)} className="md:hidden p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground/60">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User profile */}
      <div className={cn("p-4 border-b border-sidebar-border/50", collapsed && "flex justify-center")}>
        <div className="flex items-center gap-3">
          {userAvatar ? (
            <img src={userAvatar} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-sidebar-primary/20" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sidebar-primary/30 to-sidebar-primary/10 flex items-center justify-center ring-2 ring-sidebar-primary/20">
              <span className="text-sm font-bold text-sidebar-foreground">{userName[0]?.toUpperCase()}</span>
            </div>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sidebar-foreground truncate">{userName}</p>
              <p className="text-[11px] text-sidebar-foreground/40 truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navSections.map((section, si) => (
          <div key={section.title}>
            {si > 0 && <div className="my-3 h-px bg-sidebar-border/30" />}
            {!collapsed && (
              <div className="px-3 mb-2 text-[10px] font-bold text-sidebar-foreground/25 uppercase tracking-[0.15em]">
                {section.title}
              </div>
            )}
            {section.items.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 relative group",
                    collapsed && "justify-center px-0",
                    active
                      ? "text-sidebar-primary-foreground"
                      : "text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  )}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-xl bg-sidebar-primary shadow-lg shadow-sidebar-primary/25"
                      transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <item.icon className="w-[18px] h-[18px] flex-shrink-0 relative z-10" />
                  {!collapsed && <span className="relative z-10 flex-1">{item.label}</span>}
                  {!collapsed && item.badge && item.badge > 0 && (
                    <span className="relative z-10 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                      <span className="text-[10px] font-bold text-destructive">{item.badge}</span>
                    </span>
                  )}
                  {collapsed && item.badge && item.badge > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-pulse z-20" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border/30 space-y-0.5">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-sidebar-foreground/40 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors justify-center md:justify-start"
        >
          {collapsed ? <ChevronRight className="w-[18px] h-[18px]" /> : <><ChevronLeft className="w-[18px] h-[18px]" /><span>Collapse</span></>}
        </button>
        <button
          onClick={handleSignOut}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-sidebar-foreground/40 hover:bg-destructive/10 hover:text-destructive transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 glass-sidebar border-b border-sidebar-border/30 flex items-center justify-between px-4">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground">
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-sidebar-foreground text-sm">
          <div className="w-7 h-7 rounded-md bg-sidebar-primary/20 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-sidebar-primary" />
          </div>
          TG COURSE.SHOP
        </Link>
        <div className="w-9" />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && <div className="md:hidden fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />}

      {/* Mobile sidebar */}
      <aside className={cn(
        "md:hidden fixed left-0 top-0 bottom-0 w-72 glass-sidebar flex flex-col z-50 transition-transform duration-300 border-r border-sidebar-border/20",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className={cn(
        "hidden md:flex fixed left-0 top-0 bottom-0 glass-sidebar border-r border-sidebar-border/20 flex-col z-40 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
};

export default DashboardSidebar;
