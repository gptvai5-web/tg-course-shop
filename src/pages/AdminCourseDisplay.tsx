import { useEffect, useState, useRef, useCallback } from "react";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { LayoutGrid, Package, GripVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface CourseItem {
  id: string;
  title: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  type: "course" | "combo";
}

interface Category { id: string; name: string; }

const AdminCourseDisplay = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchItems(); }, [activeCategory]);

  const fetchCategories = async () => {
    const { data } = await supabase.from("course_categories").select("id, name").eq("is_active", true).order("display_order");
    setCategories(data || []);
  };

  const fetchItems = async () => {
    setLoading(true);
    const [{ data: courses }, { data: combos }] = await Promise.all([
      activeCategory === "All"
        ? supabase.from("courses").select("id, title, image_url, display_order, is_active").order("display_order")
        : supabase.from("courses").select("id, title, image_url, display_order, is_active").eq("category", activeCategory).order("display_order"),
      activeCategory === "All"
        ? (supabase.from as any)("combo_courses").select("id, title, image_url, display_order, is_active").order("display_order")
        : (supabase.from as any)("combo_courses").select("id, title, image_url, display_order, is_active").eq("category", activeCategory).order("display_order"),
    ]);
    const all: CourseItem[] = [
      ...(courses || []).map((c: any) => ({ ...c, type: "course" as const })),
      ...(combos || []).map((c: any) => ({ ...c, type: "combo" as const })),
    ].sort((a, b) => a.display_order - b.display_order);
    setItems(all);
    setLoading(false);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setOverIndex(index);
  };

  const handleDrop = async (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setOverIndex(null);
      return;
    }

    // Reorder locally
    const newItems = [...items];
    const [moved] = newItems.splice(dragIndex, 1);
    newItems.splice(dropIndex, 0, moved);

    // Update display_order sequentially
    const updated = newItems.map((item, i) => ({ ...item, display_order: i + 1 }));
    setItems(updated);
    setDragIndex(null);
    setOverIndex(null);

    // Save to DB
    setSaving(true);
    const promises = updated.map(item => {
      const table = item.type === "combo" ? "combo_courses" : "courses";
      return (supabase.from as any)(table).update({ display_order: item.display_order }).eq("id", item.id);
    });
    await Promise.all(promises);
    setSaving(false);
    toast({ title: "✓ Order saved" });
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const handleToggle = async (item: CourseItem) => {
    const table = item.type === "combo" ? "combo_courses" : "courses";
    await (supabase.from as any)(table).update({ is_active: !item.is_active }).eq("id", item.id);
    fetchItems();
  };

  // Touch drag support
  const touchStartY = useRef(0);
  const touchItemIndex = useRef<number | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    touchStartY.current = e.touches[0].clientY;
    touchItemIndex.current = index;
    setDragIndex(index);
  };

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchItemIndex.current === null || !listRef.current) return;
    const touch = e.touches[0];
    const children = Array.from(listRef.current.children) as HTMLElement[];
    for (let i = 0; i < children.length; i++) {
      const rect = children[i].getBoundingClientRect();
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        setOverIndex(i);
        break;
      }
    }
  }, []);

  const handleTouchEnd = () => {
    if (touchItemIndex.current !== null && overIndex !== null) {
      handleDrop(overIndex);
    }
    touchItemIndex.current = null;
  };

  return (
    <AdminPageWrapper
      title="Course Display Order"
      subtitle="Drag and drop to arrange how courses appear on the website"
      icon={LayoutGrid}
      badge={saving ? <span className="text-xs text-muted-foreground animate-pulse ml-2">Saving...</span> : undefined}
    >
      {/* Category tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[{ name: "All" }, ...categories].map(cat => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(cat.name)}
            className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
              activeCategory === cat.name
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/40"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-16 glass-card rounded-2xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No courses in this category</p>
        </div>
      ) : (
        <div ref={listRef} className="space-y-2">
          {items.map((item, i) => (
            <div
              key={`${item.type}-${item.id}`}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={() => handleDrop(i)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(e, i)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className={`glass-card rounded-2xl p-3 flex items-center gap-3 transition-all cursor-grab active:cursor-grabbing select-none ${
                dragIndex === i ? "opacity-40 scale-95" : ""
              } ${overIndex === i && dragIndex !== i ? "border-2 border-primary/50 scale-[1.02]" : "border-2 border-transparent"}`}
            >
              <GripVertical className="w-5 h-5 text-muted-foreground shrink-0" />
              <span className="text-xs font-bold text-muted-foreground w-6 text-center">{i + 1}</span>
              <img src={item.image_url || "/placeholder.svg"} alt="" className="w-14 h-10 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{item.title}</p>
              </div>
              {item.type === "combo" && (
                <Badge variant="outline" className="text-[10px] shrink-0 border-primary/30 text-primary">
                  <Package className="w-3 h-3 mr-1" /> COMBO
                </Badge>
              )}
              <button onClick={() => handleToggle(item)} className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${item.is_active ? "bg-success/10 text-success" : "bg-muted/50 text-muted-foreground"}`}>
                {item.is_active ? "Active" : "Hidden"}
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminPageWrapper>
  );
};

export default AdminCourseDisplay;
