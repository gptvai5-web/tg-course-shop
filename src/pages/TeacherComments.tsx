import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import AdminPageWrapper from "@/components/dashboard/AdminPageWrapper";
import { MessageSquare, Trash2, Search, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface CommentRow {
  id: string;
  comment: string;
  user_name: string;
  user_id: string;
  created_at: string;
  video_id: string;
  video_title: string;
  chapter_name: string;
  course_title: string;
}

const TeacherComments = () => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchComments = async () => {
    if (!user) return;
    setLoading(true);

    // Fetch comments with video info
    const { data: rawComments } = await (supabase.from as any)("video_comments")
      .select("id, comment, user_name, user_id, created_at, video_id")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!rawComments || rawComments.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    // Get unique video IDs
    const videoIds = [...new Set(rawComments.map((c: any) => c.video_id))];
    const { data: videos } = await (supabase.from as any)("chapter_videos")
      .select("id, title, chapter_id")
      .in("id", videoIds);

    // Get chapter info
    const chapterIds = [...new Set((videos || []).map((v: any) => v.chapter_id))];
    const { data: chapters } = await (supabase.from as any)("chapters")
      .select("id, name, subject_id")
      .in("id", chapterIds);

    // Get subject → course info
    const subjectIds = [...new Set((chapters || []).map((ch: any) => ch.subject_id))];
    const { data: subjects } = await (supabase.from as any)("subjects")
      .select("id, course_id")
      .in("id", subjectIds);

    const courseIds = [...new Set((subjects || []).map((s: any) => s.course_id))];
    const { data: courses } = await (supabase.from as any)("courses")
      .select("id, title")
      .in("id", courseIds);

    // Build lookup maps
    const videoMap = new Map((videos || []).map((v: any) => [v.id, v]));
    const chapterMap = new Map((chapters || []).map((ch: any) => [ch.id, ch]));
    const subjectMap = new Map((subjects || []).map((s: any) => [s.id, s]));
    const courseMap = new Map((courses || []).map((c: any) => [c.id, c]));

    const enriched: CommentRow[] = rawComments.map((c: any) => {
      const video = videoMap.get(c.video_id) as any;
      const chapter = video ? chapterMap.get(video.chapter_id) as any : null;
      const subject = chapter ? subjectMap.get(chapter.subject_id) as any : null;
      const course = subject ? courseMap.get(subject.course_id) as any : null;
      return {
        ...c,
        video_title: video?.title || "Unknown",
        chapter_name: chapter?.name || "Unknown",
        course_title: course?.title || "Unknown",
      };
    });

    setComments(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchComments(); }, [user]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await (supabase.from as any)("video_comments").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete comment", variant: "destructive" });
    } else {
      setComments((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Deleted", description: "Comment removed successfully" });
    }
    setDeleting(null);
  };

  const filtered = comments.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.comment.toLowerCase().includes(q) ||
      c.user_name.toLowerCase().includes(q) ||
      c.video_title.toLowerCase().includes(q) ||
      c.chapter_name.toLowerCase().includes(q) ||
      c.course_title.toLowerCase().includes(q)
    );
  });

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <AdminPageWrapper title="Comment Management" icon={MessageSquare} subtitle="Manage all video comments">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              Comment Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {comments.length} total comments
            </p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search comments..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-muted/20 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground">No comments found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-start gap-3"
              >
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{c.user_name}</span>
                    <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="text-sm text-foreground/80">{c.comment}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Video className="w-3 h-3" />
                    <span className="truncate">
                      {c.course_title} › {c.chapter_name} › {c.video_title}
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => handleDelete(c.id)}
                  disabled={deleting === c.id}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
};

export default TeacherComments;
