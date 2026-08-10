import { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, PlayCircle, Video, FileText, StickyNote, ClipboardList, CheckSquare, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Hls from "hls.js";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import YouTubePlayer from "@/components/YouTubePlayer";
import VideoComments from "@/components/VideoComments";

interface ChapterVideo { id: string; title: string; video_url: string; description: string | null; display_order: number; embed_code?: string | null; }
interface Chapter { id: string; name: string; color: string; subject_id: string; }
interface ChapterMaterial { id: string; material_type: string; title: string; url: string; }

const HlsPlayer = ({ src }: { src: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setErrorMessage(null);
    let hls: Hls | null = null;
    const handleVideoError = () => { setErrorMessage("Video failed to load. Please check the stream URL."); };
    video.addEventListener("error", handleVideoError);
    if (Hls.isSupported()) {
      hls = new Hls();
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => {}); });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        const code = (data as any)?.response?.code;
        if (code === 403) { setErrorMessage("Stream blocked by host permissions (403)."); return; }
        if (data?.fatal) { setErrorMessage("HLS stream failed to load."); }
      });
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      video.addEventListener("loadedmetadata", () => video.play().catch(() => {}));
    } else {
      setErrorMessage("This browser does not support HLS playback.");
    }
    return () => { video.removeEventListener("error", handleVideoError); if (hls) hls.destroy(); };
  }, [src]);

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} className="w-full h-full" controls controlsList="nodownload" />
      {errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 p-4 text-center">
          <p className="text-sm text-primary-foreground">{errorMessage}</p>
        </div>
      )}
    </div>
  );
};

const ChapterVideos = () => {
  const { id, subjectId, chapterId } = useParams<{ id: string; subjectId: string; chapterId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [videos, setVideos] = useState<ChapterVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<ChapterVideo | null>(null);
  const [materials, setMaterials] = useState<ChapterMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chapterId || !user) return;
    const fetchData = async () => {
      const [{ data: ch }, { data: v }, { data: m }] = await Promise.all([
        (supabase.from as any)("chapters").select("id, name, color, subject_id").eq("id", chapterId).single(),
        (supabase.from as any)("chapter_videos").select("id, title, video_url, description, display_order, embed_code").eq("chapter_id", chapterId).eq("is_active", true).order("display_order"),
        (supabase.from as any)("chapter_materials").select("id, material_type, title, url").eq("chapter_id", chapterId).eq("is_active", true).order("display_order"),
      ]);
      setChapter(ch as Chapter | null);
      const vids = (v as ChapterVideo[]) || [];
      setVideos(vids);
      if (vids.length > 0) setSelectedVideo(vids[0]);
      setMaterials((m as ChapterMaterial[]) || []);
      setLoading(false);
    };
    fetchData();
  }, [chapterId, user]);

  const getYouTubeVideoId = (url: string): string | null => {
    try {
      if (url.includes("youtube.com/watch")) return new URL(url).searchParams.get("v");
      if (url.includes("youtu.be/")) return url.split("youtu.be/")[1]?.split(/[?&#]/)[0] || null;
      if (url.includes("youtube.com/embed/") || url.includes("youtube-nocookie.com/embed/")) {
        return url.split("/embed/")[1]?.split(/[?&#"]/)[0] || null;
      }
      if (url.includes("youtube.com/shorts/")) return url.split("youtube.com/shorts/")[1]?.split(/[?&#]/)[0] || null;
    } catch { return null; }
    return null;
  };

  // Extract YouTube video ID from embed_code HTML or video_url
  const getVideoYouTubeId = (video: ChapterVideo): string | null => {
    // First check embed_code for YouTube iframe
    if (video.embed_code) {
      const srcMatch = video.embed_code.match(/src=["']([^"']+)["']/);
      if (srcMatch) {
        const id = getYouTubeVideoId(srcMatch[1]);
        if (id) return id;
      }
    }
    // Then check video_url
    if (video.video_url) return getYouTubeVideoId(video.video_url);
    return null;
  };

  const isYouTube = (url: string) => getYouTubeVideoId(url) !== null;

  const getEmbedUrl = (url: string) => {
    // YouTube — use youtube-nocookie for better embed compatibility & avoid Error 153
    const ytId = getYouTubeVideoId(url);
    if (ytId) {
      const origin = encodeURIComponent(window.location.origin);
      return `https://www.youtube-nocookie.com/embed/${ytId}?rel=0&modestbranding=1&enablejsapi=0&origin=${origin}&playsinline=1`;
    }
    // Vimeo
    if (url.includes("vimeo.com/") && !url.includes("player.vimeo.com")) return url.replace("vimeo.com/", "player.vimeo.com/video/");
    // Dailymotion
    if (url.includes("dailymotion.com/video/")) return url.replace("dailymotion.com/video/", "dailymotion.com/embed/video/");
    // Google Drive
    if (url.includes("drive.google.com/file/d/")) {
      const match = url.match(/\/d\/([^/]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  const isHls = (url: string) => url.toLowerCase().includes(".m3u8");
  const toProxyHlsUrl = (url: string) => {
    const base = import.meta.env.VITE_SUPABASE_URL;
    if (!base) return url;
    return `${base}/functions/v1/video-proxy?url=${encodeURIComponent(url)}`;
  };
  
  const isNonYouTubeIframeEmbed = (url: string) =>
    url.includes("vimeo.com/") ||
    url.includes("dailymotion.com/video/") ||
    url.includes("drive.google.com/file/d/");

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-24 container mx-auto px-4 max-w-6xl">
          <div className="h-8 w-60 bg-muted/30 rounded animate-pulse mb-6" />
          <div className="aspect-video bg-muted/30 rounded-2xl animate-pulse mb-6" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-dot-grid relative">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-0 w-[400px] h-[400px] rounded-full bg-primary/4 blur-[120px]" />
      </div>

      <Navbar />
      <div className="pt-20 sm:pt-24 pb-12 sm:pb-20 relative z-10">
        <div className="container mx-auto px-3 sm:px-4 max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <Link to={`/course/${id}/subject/${subjectId}`} className="inline-flex items-center gap-2 text-primary font-medium text-sm mb-4 hover:gap-3 transition-all">
              <ArrowLeft className="w-4 h-4" /> Back to Chapters
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: chapter?.color || "#8B5CF6" }}>
                <Video className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl md:text-2xl font-display font-bold">{chapter?.name}</h1>
            </div>
          </motion.div>

          {videos.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center mx-auto mb-4">
                <Video className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground">No videos available yet.</p>
            </motion.div>
          ) : (
            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_320px] gap-4 sm:gap-6">
              {/* Video player */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {selectedVideo && (
                  <div>
                    <div
                      className="aspect-video rounded-xl sm:rounded-2xl overflow-hidden bg-black shadow-2xl relative"
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ WebkitUserSelect: "none", userSelect: "none" }}
                    >
                      {(() => {
                        const ytId = getVideoYouTubeId(selectedVideo);
                        if (ytId) {
                          return <YouTubePlayer key={selectedVideo.id} videoId={ytId} />;
                        }
                        if (selectedVideo.embed_code) {
                          return (
                            <div
                              key={selectedVideo.id}
                              className="w-full h-full [&>iframe]:w-full [&>iframe]:h-full [&>iframe]:border-0"
                              dangerouslySetInnerHTML={{ __html: selectedVideo.embed_code }}
                            />
                          );
                        }
                        if (isHls(selectedVideo.video_url)) {
                          return <HlsPlayer key={selectedVideo.id} src={toProxyHlsUrl(selectedVideo.video_url)} />;
                        }
                        if (isNonYouTubeIframeEmbed(selectedVideo.video_url)) {
                          return (
                            <iframe
                              key={selectedVideo.id}
                              src={getEmbedUrl(selectedVideo.video_url)}
                              className="w-full h-full"
                              allowFullScreen
                              referrerPolicy="no-referrer"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                            />
                          );
                        }
                        return (
                          <video
                            key={selectedVideo.id}
                            src={selectedVideo.video_url}
                            className="w-full h-full"
                            controls autoPlay playsInline
                            controlsList="nodownload"
                            preload="metadata"
                          />
                        );
                      })()}
                    </div>
                    <div className="mt-5">
                      <h2 className="font-display font-bold text-lg">{selectedVideo.title}</h2>
                      {selectedVideo.description && (
                        <div className="mt-3 glass-card rounded-2xl p-5">
                          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{selectedVideo.description}</p>
                        </div>
                      )}
                    </div>

                    {/* Course Materials */}
                    {materials.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <h3 className="font-display font-bold text-lg">Course Materials</h3>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {materials.map((mat) => {
                            const config: Record<string, { icon: React.ElementType; bg: string; iconBg: string; iconColor: string }> = {
                              lecture_sheet: { icon: FileText, bg: "bg-blue-500/10 border-blue-500/20", iconBg: "bg-blue-500", iconColor: "text-white" },
                              note: { icon: StickyNote, bg: "bg-destructive/10 border-destructive/20", iconBg: "bg-destructive", iconColor: "text-white" },
                              practice_sheet: { icon: ClipboardList, bg: "bg-success/10 border-success/20", iconBg: "bg-success", iconColor: "text-white" },
                              solve_sheet: { icon: CheckSquare, bg: "bg-primary/10 border-primary/20", iconBg: "bg-primary", iconColor: "text-white" },
                            };
                            const c = config[mat.material_type] || config.lecture_sheet;
                            const Icon = c.icon;
                            return (
                              <button
                                key={mat.id}
                                onClick={() => {
                                  const isImg = /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(mat.url);
                                  const viewerUrl = `/view-document?url=${encodeURIComponent(mat.url)}&title=${encodeURIComponent(mat.title)}&type=${isImg ? "image" : "pdf"}`;
                                  navigate(viewerUrl);
                                }}
                                className={`flex flex-col items-center gap-3 p-4 rounded-2xl border ${c.bg} hover:shadow-md transition-all group`}
                              >
                                <div className={`w-12 h-12 rounded-xl ${c.iconBg} flex items-center justify-center shadow-md`}>
                                  <Icon className={`w-6 h-6 ${c.iconColor}`} />
                                </div>
                                <p className="font-display font-bold text-xs text-center line-clamp-2">{mat.title}</p>
                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                                  <ExternalLink className="w-3 h-3" /> Open
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Right sidebar: Video list + Comments */}
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {/* Video list */}
                <div className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-4 border-b border-border/30">
                    <h3 className="font-display font-bold text-sm">Videos</h3>
                    <p className="text-xs text-muted-foreground">{videos.length} videos</p>
                  </div>
                  <div className="divide-y divide-border/20 max-h-[40vh] overflow-y-auto">
                    {videos.map((v, i) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVideo(v)}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/20 transition-colors ${
                          selectedVideo?.id === v.id ? "bg-primary/5 border-l-2 border-primary" : ""
                        }`}
                      >
                        <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          selectedVideo?.id === v.id ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground"
                        }`}>
                          <PlayCircle className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium line-clamp-2 ${selectedVideo?.id === v.id ? "text-primary" : ""}`}>
                            {v.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Video {i + 1}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comments in right sidebar */}
                {selectedVideo && (
                  <div className="glass-card rounded-2xl p-4 max-h-[50vh] overflow-y-auto">
                    <VideoComments videoId={selectedVideo.id} />
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ChapterVideos;
