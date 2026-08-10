import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical, Pencil, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { motion } from "framer-motion";

interface Category {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchCategories = async () => {
    const { data } = await supabase.from("course_categories").select("*").order("display_order");
    setCategories((data as Category[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.display_order)) + 1 : 0;
    const { error } = await supabase.from("course_categories").insert({ name: newName.trim(), display_order: maxOrder });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setNewName("");
      toast({ title: "Category added" });
      fetchCategories();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("course_categories").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Category deleted" });
      fetchCategories();
    }
  };

  const handleToggle = async (id: string, currentActive: boolean) => {
    await supabase.from("course_categories").update({ is_active: !currentActive }).eq("id", id);
    fetchCategories();
  };

  const handleSaveEdit = async () => {
    if (!editId || !editName.trim()) return;
    const { error } = await supabase.from("course_categories").update({ name: editName.trim() }).eq("id", editId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setEditId(null);
      setEditName("");
      toast({ title: "Category updated" });
      fetchCategories();
    }
  };

  return (
    <AdminPageWrapper title="Course Categories" subtitle="Manage categories shown on the Courses page" icon={FileText}>
      {/* Add new */}
      <div className="flex gap-3 mb-8 max-w-lg">
        <Input
          placeholder="New category name..."
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          className="rounded-xl bg-background/50"
        />
        <Button onClick={handleAdd} className="gap-2 shrink-0 rounded-xl">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      {/* List */}
      <div className="space-y-2 max-w-lg">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 glass-card rounded-xl animate-pulse" />
          ))
        ) : categories.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center">No categories yet</p>
        ) : (
          categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-center gap-3 glass-card rounded-xl px-4 py-3"
            >
              <GripVertical className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              {editId === cat.id ? (
                <div className="flex-1 flex gap-2">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()} className="h-8" autoFocus />
                  <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditId(null)}>Cancel</Button>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  <button
                    onClick={() => handleToggle(cat.id, cat.is_active)}
                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                      cat.is_active ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"
                    }`}
                  >
                    {cat.is_active ? "Active" : "Hidden"}
                  </button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditId(cat.id); setEditName(cat.name); }}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDelete(cat.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </motion.div>
          ))
        )}
      </div>
    </AdminPageWrapper>
  );
};

export default AdminCategories;
