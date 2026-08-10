import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Eye, EyeOff, GraduationCap, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/landing/Navbar";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  const rules = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "One uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { label: "One lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { label: "One number (0-9)", met: /[0-9]/.test(password) },
  ];

  useEffect(() => {
    // Check if this is a recovery flow from the URL hash
    const hash = window.location.hash;
    if (hash && hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    // Also listen for auth state changes for recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rules.every(r => r.met)) {
      toast.error("Please meet all password requirements");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);

    // Update the password
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast.error(error.message);
      setIsLoading(false);
      return;
    }

    // After password change, clear all old device sessions
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Delete all existing sessions for this user (old devices auto-removed)
      await supabase.from("user_sessions").delete().eq("user_id", user.id);
    }

    // Sign out all other sessions
    await supabase.auth.signOut({ scope: "others" });

    toast.success("Password updated! All other devices have been signed out.");
    setIsLoading(false);
    navigate("/student");
  };

  if (!isRecovery) {
    return (
      <div className="min-h-screen bg-accent">
        <Navbar />
        <div className="flex items-center justify-center pt-24 pb-12 px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md bg-card rounded-2xl shadow-elevated p-8 text-center">
            <GraduationCap className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-display font-bold mb-2">Invalid Reset Link</h1>
            <p className="text-sm text-muted-foreground mb-6">This password reset link is invalid or has expired. Please request a new one.</p>
            <Button onClick={() => navigate("/login")} className="bg-gradient-primary">Back to Login</Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-accent">
      <Navbar />
      <div className="flex items-center justify-center pt-24 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card rounded-2xl shadow-elevated p-8 md:p-10"
        >
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-1">Set New Password</h1>
            <p className="text-sm text-muted-foreground text-center">
              Enter your new password. All other devices will be signed out automatically.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleResetPassword}>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 pr-10 h-12 bg-card border border-border rounded-lg text-sm"
                required
              />
              <button type="button" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="pl-10 h-12 bg-card border border-border rounded-lg text-sm"
                required
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground mb-1">Password must contain:</p>
              {rules.map(r => (
                <div key={r.label} className="flex items-center gap-2 text-xs">
                  {r.met ? <Check className="w-3.5 h-3.5 text-success" /> : <X className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className={r.met ? "text-success" : "text-muted-foreground"}>{r.label}</span>
                </div>
              ))}
            </div>

            {password && confirmPassword && password !== confirmPassword && (
              <p className="text-sm text-destructive">Passwords do not match</p>
            )}

            <Button
              type="submit"
              disabled={isLoading || !rules.every(r => r.met) || password !== confirmPassword}
              className="w-full h-12 bg-gradient-primary hover:opacity-90 transition-opacity text-base font-semibold rounded-lg"
            >
              {isLoading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
