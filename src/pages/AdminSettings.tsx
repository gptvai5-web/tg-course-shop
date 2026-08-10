import { useState } from "react";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { Settings, User, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const AdminSettings = () => {
  const { user } = useAuth();
  const userName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Admin";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const [newPassword, setNewPassword] = useState("");
  const [updating, setUpdating] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword.trim() || newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setUpdating(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully" });
      setNewPassword("");
    }
    setUpdating(false);
  };

  return (
    <AdminPageWrapper title="Settings" subtitle="Manage your admin profile" icon={Settings}>
      <div className="max-w-lg space-y-5">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            Profile
          </h3>
          <div className="flex items-center gap-4 mb-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-primary/20" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-primary/20">
                <span className="text-xl font-bold text-primary">{userName.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div>
              <p className="font-bold">{userName}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        </motion.div>

        {/* Change Password */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6"
        >
          <h3 className="font-display font-bold text-base mb-4 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-warning/10 flex items-center justify-center">
              <Key className="w-4 h-4 text-warning" />
            </div>
            Change Password
          </h3>
          <div className="flex gap-3">
            <Input
              type="password"
              placeholder="New password (min 6 chars)"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="rounded-xl bg-background/50"
            />
            <Button onClick={handleChangePassword} disabled={updating} className="rounded-xl shrink-0">
              {updating ? "Updating..." : "Update"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AdminPageWrapper>
  );
};

export default AdminSettings;
