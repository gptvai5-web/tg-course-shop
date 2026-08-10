import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Trash2, Send, ThumbsUp, ThumbsDown, ChevronDown } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  video_id: string;
  user_id: string;
  user_name: string;
  comment: string;
  created_at: string;
}

interface ReactionCounts {
  likes: number;
  dislikes: number;
  userReaction: "like" | "dislike" | null;
}

interface VideoCommentsProps {
  videoId: string;
}

const COMMENTS_PER_PAGE = 10;

const VideoComments = ({ videoId }: VideoCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(COMMENTS_PER_PAGE);
  const [reactions, setReactions] = useState<Record<string, ReactionCounts>>({});

  useEffect(() => {
    if (!user) return;
    supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }).then(({ data }) => {
      setIsAdmin(!!data);
    });
  }, [user]);

  const fetchReactions = useCallback(async (commentIds: string[]) => {
    if (commentIds.length === 0) return;
    const { data } = await (supabase.from as any)("comment_reactions")
      .select("comment_id, reaction_type, user_id")
      .in("comment_id", commentIds);

    const map: Record<string, ReactionCounts> = {};
    for (const id of commentIds) {
      map[id] = { likes: 0, dislikes: 0, userReaction: null };
    }
    if (data) {
      for (const r of data as { comment_id: string; reaction_type: string; user_id: string }[]) {
        if (!map[r.comment_id]) map[r.comment_id] = { likes: 0, dislikes: 0, userReaction: null };
        if (r.reaction_type === "like") map[r.comment_id].likes++;
        else map[r.comment_id].dislikes++;
        if (user && r.user_id === user.id) map[r.comment_id].userReaction = r.reaction_type as "like" | "dislike";
      }
    }
    setReactions((prev) => ({ ...prev, ...map }));
  }, [user]);

  useEffect(() => {
    if (!videoId) return;
    const fetchComments = async () => {
      const { data } = await (supabase.from as any)("video_comments")
        .select("*")
        .eq("video_id", videoId)
        .order("created_at", { ascending: false });
      const list = (data as Comment[]) || [];
      setComments(list);
      setLoading(false);
      fetchReactions(list.map((c) => c.id));
    };
    fetchComments();
  }, [videoId, fetchReactions]);

  const handleSubmit = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Student";
    const { data, error } = await (supabase.from as any)("video_comments").insert({
      video_id: videoId,
      user_id: user.id,
      user_name: userName,
      comment: newComment.trim(),
    }).select().single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      const c = data as Comment;
      setComments((prev) => [c, ...prev]);
      setReactions((prev) => ({ ...prev, [c.id]: { likes: 0, dislikes: 0, userReaction: null } }));
      setNewComment("");
    }
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await (supabase.from as any)("video_comments").delete().eq("id", commentId);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  const handleReaction = async (commentId: string, type: "like" | "dislike") => {
    if (!user) return;
    const current = reactions[commentId]?.userReaction;

    if (current === type) {
      // Remove reaction
      await (supabase.from as any)("comment_reactions")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);
      setReactions((prev) => ({
        ...prev,
        [commentId]: {
          ...prev[commentId],
          [type === "like" ? "likes" : "dislikes"]: Math.max(0, (prev[commentId]?.[type === "like" ? "likes" : "dislikes"] || 0) - 1),
          userReaction: null,
        },
      }));
    } else {
      // Upsert reaction
      const { error } = await (supabase.from as any)("comment_reactions")
        .upsert(
          { comment_id: commentId, user_id: user.id, reaction_type: type },
          { onConflict: "comment_id,user_id" }
        );
      if (error) return;

      setReactions((prev) => {
        const old = prev[commentId] || { likes: 0, dislikes: 0, userReaction: null };
        const updated = { ...old, userReaction: type as "like" | "dislike" };
        if (type === "like") {
          updated.likes = old.likes + 1;
          if (current === "dislike") updated.dislikes = Math.max(0, old.dislikes - 1);
        } else {
          updated.dislikes = old.dislikes + 1;
          if (current === "like") updated.likes = Math.max(0, old.likes - 1);
        }
        return { ...prev, [commentId]: updated };
      });
    }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const visibleComments = comments.slice(0, visibleCount);
  const hasMore = comments.length > visibleCount;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-lg">Comments ({comments.length})</h3>
      </div>

      {/* New comment input */}
      {user && (
        <div className="glass-card rounded-2xl p-4 mb-4">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[80px] rounded-xl bg-background/50 border-border/50 resize-none"
            maxLength={1000}
          />
          <div className="flex justify-end mt-2">
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              className="rounded-xl gap-2"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/20 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first to comment!</p>
      ) : (
        <>
          <AnimatePresence>
            <div className="space-y-3">
              {visibleComments.map((c) => {
                const r = reactions[c.id] || { likes: 0, dislikes: 0, userReaction: null };
                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="glass-card rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-bold text-primary">
                            {c.user_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold">{c.user_name}</span>
                            <span className="text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words">{c.comment}</p>

                          {/* Like / Dislike buttons */}
                          <div className="flex items-center gap-3 mt-2">
                            <button
                              onClick={() => handleReaction(c.id, "like")}
                              disabled={!user}
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                r.userReaction === "like"
                                  ? "text-primary font-semibold"
                                  : "text-muted-foreground hover:text-primary"
                              }`}
                            >
                              <ThumbsUp className={`w-3.5 h-3.5 ${r.userReaction === "like" ? "fill-primary" : ""}`} />
                              {r.likes > 0 && <span>{r.likes}</span>}
                            </button>
                            <button
                              onClick={() => handleReaction(c.id, "dislike")}
                              disabled={!user}
                              className={`flex items-center gap-1 text-xs transition-colors ${
                                r.userReaction === "dislike"
                                  ? "text-destructive font-semibold"
                                  : "text-muted-foreground hover:text-destructive"
                              }`}
                            >
                              <ThumbsDown className={`w-3.5 h-3.5 ${r.userReaction === "dislike" ? "fill-destructive" : ""}`} />
                              {r.dislikes > 0 && <span>{r.dislikes}</span>}
                            </button>
                          </div>
                        </div>
                      </div>
                      {(isAdmin || c.user_id === user?.id) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(c.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>

          {/* Show More button */}
          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVisibleCount((prev) => prev + COMMENTS_PER_PAGE)}
                className="rounded-xl gap-2"
              >
                <ChevronDown className="w-4 h-4" />
                Show More ({comments.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoComments;
