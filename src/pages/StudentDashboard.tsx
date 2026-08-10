import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Monitor, Trash2, LogOut, Key, BookOpen, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { useNavigate, Link } from "react-router-dom";

interface UserSession {
  id: string;
  session_id: string;
  device_info: string;
  created_at: string;
  last_active: string;
}

const MAX_DEVICES = 2;

const StudentDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Student";
  const userEmail = user?.email || "";
  const avatarUrl = user?.user_metadata?.avatar_url;

  const fetchSessions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("last_active", { ascending: false });
    setSessions((data as UserSession[]) || []);
    setLoadingSessions(false);
  };

  useEffect(() => {
    if (!user) return;
    const registerSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const sessionId = session.access_token.slice(-20);
      setCurrentSessionId(sessionId);
      const deviceInfo = getDeviceInfo();
      await supabase.from("user_sessions").upsert(
        { user_id: user.id, session_id: sessionId, device_info: deviceInfo, last_active: new Date().toISOString() },
        { onConflict: "user_id,session_id" }
      );
      fetchSessions();
    };
    registerSession();
  }, [user]);

  const getDeviceInfo = () => {
    const ua = navigator.userAgent;
    if (/Mobile|Android/i.test(ua)) return "Mobile Device";
    if (/Tablet|iPad/i.test(ua)) return "Tablet";
    if (/Windows/i.test(ua)) return "Windows PC";
    if (/Mac/i.test(ua)) return "Mac";
    if (/Linux/i.test(ua)) return "Linux PC";
    return "Unknown Device";
  };

  const handleRemoveSession = async (id: string) => {
    await supabase.from("user_sessions").delete().eq("id", id);
    toast({ title: "Device removed", description: "The device session has been removed." });
    fetchSessions();
  };

  const handleSignOut = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && user) {
      const sessionId = session.access_token.slice(-20);
      await supabase.from("user_sessions").delete().eq("user_id", user.id).eq("session_id", sessionId);
    }
    await signOut();
    navigate("/");
  };

  const handleForgotPassword = async () => {
    if (!userEmail) return;
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email Sent", description: "Check your email for a password reset link." });
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <Navbar />
      <div className="pt-24 pb-20 relative z-10">
        <div className="container mx-auto px-4 max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl md:text-3xl font-display font-bold mb-1">My Profile</h1>
            <p className="text-muted-foreground text-sm mb-8">Manage your account information</p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            <Link
              to="/learn"
              className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:shadow-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-display font-bold text-sm group-hover:text-primary transition-colors">My Learning</p>
                <p className="text-xs text-muted-foreground">Continue courses</p>
              </div>
            </Link>
            <Link
              to="/courses"
              className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:shadow-lg transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-display font-bold text-sm group-hover:text-primary transition-colors">Browse</p>
                <p className="text-xs text-muted-foreground">Find new courses</p>
              </div>
            </Link>
          </motion.div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card rounded-2xl p-6 md:p-8"
          >
            {/* Avatar & Name */}
            <div className="flex flex-col items-center mb-8">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-24 h-24 rounded-full object-cover shadow-lg mb-4 ring-3 ring-primary/20" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shadow-lg mb-4 ring-3 ring-primary/20">
                  <span className="text-3xl font-bold text-primary">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <h2 className="text-xl font-display font-bold uppercase">{userName}</h2>
            </div>

            {/* Info Fields */}
            <div className="space-y-4 mb-8">
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <User className="w-3.5 h-3.5" /> NAME
                </div>
                <p className="font-medium uppercase">{userName}</p>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Mail className="w-3.5 h-3.5" /> EMAIL
                </div>
                <p className="font-medium">{userEmail}</p>
              </div>
            </div>

            {/* Device Management */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Monitor className="w-5 h-5" /> Manage Devices
                </h3>
                <span className="text-xs text-muted-foreground bg-muted/30 backdrop-blur-sm px-2.5 py-1 rounded-full border border-border/30">
                  {sessions.length}/{MAX_DEVICES} devices
                </span>
              </div>

              {loadingSessions ? (
                <div className="space-y-3">
                  {[1, 2].map(i => <div key={i} className="h-16 glass rounded-xl animate-pulse" />)}
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No active devices</p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => {
                    const isCurrentDevice = s.session_id === currentSessionId;
                    return (
                      <div key={s.id} className={`flex items-center justify-between glass rounded-xl p-4 ${isCurrentDevice ? "ring-2 ring-primary/40" : ""}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isCurrentDevice ? "bg-primary/20" : "bg-primary/10"}`}>
                            <Monitor className={`w-4 h-4 ${isCurrentDevice ? "text-primary" : "text-primary"}`} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{s.device_info}</p>
                              {isCurrentDevice && (
                                <span className="text-[10px] font-bold bg-primary/15 text-primary px-2 py-0.5 rounded-full">This Device</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Last active: {new Date(s.last_active).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {!isCurrentDevice && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveSession(s.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {sessions.length >= MAX_DEVICES && (
                <p className="text-xs text-destructive mt-3">
                  You have reached the maximum of {MAX_DEVICES} devices. Remove a device to log in from a new one.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                className="h-12 rounded-xl gap-2 bg-primary hover:bg-primary/90"
                onClick={handleForgotPassword}
              >
                <Key className="w-4 h-4" /> Change Password
              </Button>
              <Button
                variant="destructive"
                className="h-12 rounded-xl gap-2"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default StudentDashboard;
