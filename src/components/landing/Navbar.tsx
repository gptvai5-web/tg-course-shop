import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, Menu, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoginDialog from "@/components/auth/LoginDialog";

const PUBLIC_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Courses", href: "/courses" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const LOGGED_IN_NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Learn", href: "/learn" },
  { label: "Courses", href: "/courses" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const NAV_ITEMS = user ? LOGGED_IN_NAV_ITEMS : PUBLIC_NAV_ITEMS;

  const getDashboardPath = () => {
    if (hasRole("admin")) return "/admin";
    if (hasRole("teacher")) return "/teacher";
    return "/student";
  };

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/30">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo - 2 lines */}
        <Link to="/" className="flex items-center gap-2.5 font-display font-bold">
          <div className="w-9 h-9 rounded-lg bg-gradient-primary flex items-center justify-center shadow-md shadow-primary/30">
            <GraduationCap className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-foreground">TG</div>
            <div className="text-sm font-bold text-primary">COURSE.SHOP</div>

          </div>
        </Link>

        {/* Center pill nav */}
        <div className="hidden md:flex items-center bg-card/80 border border-border/50 rounded-full px-1.5 py-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`text-sm font-medium px-4 py-1.5 rounded-full transition-all ${
                isActive(item.href)
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <Link to={getDashboardPath()}>
              {user.user_metadata?.avatar_url ? (
                <button className="flex items-center gap-2 border border-border rounded-full pl-1 pr-4 py-1 hover:bg-muted transition-colors">
                  <img src={user.user_metadata.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  <span className="text-sm font-medium text-foreground">Profile</span>
                </button>
              ) : (
                <button className="flex items-center gap-2 border border-border rounded-full pl-1 pr-4 py-1 hover:bg-muted transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-xs font-bold text-primary-foreground">
                      {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">Profile</span>
                </button>
              )}
            </Link>
          ) : (
            <Button size="sm" className="bg-gradient-primary hover:opacity-90 transition-opacity rounded-full px-6 shadow-md shadow-primary/30 text-primary-foreground" onClick={() => setLoginOpen(true)}>
              Log In
            </Button>
          )}
        </div>

        <button className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/30 bg-background/95 backdrop-blur-xl p-5 space-y-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={`block text-sm font-medium py-2.5 px-4 rounded-xl transition-colors ${
                isActive(item.href) ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
          {user ? (
            <div className="pt-3 border-t border-border">
              <Link to={getDashboardPath()} className="block">
                <Button variant="outline" className="w-full rounded-xl" size="sm">Profile</Button>
              </Link>
            </div>
          ) : (
            <div className="pt-2">
              <Button className="w-full bg-gradient-primary rounded-xl" size="sm" onClick={() => { setMobileOpen(false); setLoginOpen(true); }}>Log In</Button>
            </div>
          )}
        </div>
      )}
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </nav>
  );
};

export default Navbar;
