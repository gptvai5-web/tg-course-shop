import { useEffect, useState } from "react";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { Users, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface UserProfile { user_id: string; full_name: string | null; roles: string[]; }

const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
    ]);
    if (!profiles) { setLoading(false); return; }
    setUsers(profiles.map(p => ({
      user_id: p.user_id,
      full_name: p.full_name,
      roles: (roles || []).filter(r => r.user_id === p.user_id).map(r => r.role),
    })));
    setLoading(false);
  };

  const addRole = async (userId: string, role: string) => {
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
    if (error) {
      toast({ title: error.message.includes("duplicate") ? "Already has this role" : "Error", description: error.message, variant: error.message.includes("duplicate") ? undefined : "destructive" });
      return;
    }
    toast({ title: `${role} role added` }); fetchUsers();
  };

  const removeRole = async (userId: string, role: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role as any);
    toast({ title: `${role} role removed` }); fetchUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Remove all roles for this user?")) return;
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("profiles").delete().eq("user_id", userId);
    toast({ title: "User data removed" }); fetchUsers();
  };

  const filtered = users.filter(u =>
    (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminPageWrapper title="User Management" subtitle="Manage users and their roles" icon={Users}>
      <div className="mb-5 max-w-sm">
        <Input placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="rounded-xl bg-background/50" />
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 glass-card rounded-xl animate-pulse" />)}</div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Name</TableHead><TableHead>User ID</TableHead><TableHead>Roles</TableHead><TableHead>Add Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.user_id} className="hover:bg-muted/10">
                  <TableCell className="font-medium">{u.full_name || "Unnamed"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground font-mono">{u.user_id.slice(0, 12)}...</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map(r => (
                        <span key={r} className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full backdrop-blur-sm">
                          {r}
                          <button onClick={() => removeRole(u.user_id, r)} className="hover:text-destructive">×</button>
                        </span>
                      ))}
                      {u.roles.length === 0 && <span className="text-xs text-muted-foreground">No roles</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select onValueChange={v => addRole(u.user_id, v)}>
                      <SelectTrigger className="h-8 w-28 text-xs rounded-lg"><SelectValue placeholder="Add..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteUser(u.user_id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPageWrapper>
  );
};

export default AdminUserManagement;
