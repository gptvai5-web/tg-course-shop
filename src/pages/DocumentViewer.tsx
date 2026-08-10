import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, FileText, Shield } from "lucide-react";
import { motion } from "framer-motion";

const DocumentViewer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const url = searchParams.get("url") || "";
  const title = searchParams.get("title") || "Document";
  const type = searchParams.get("type") || "pdf";
  const [watermarkPos, setWatermarkPos] = useState({ top: 20, left: 30 });

  const userEmail = user?.email || "Protected";

  // Floating watermark position
  useEffect(() => {
    const interval = setInterval(() => {
      setWatermarkPos({
        top: 10 + Math.random() * 70,
        left: 5 + Math.random() * 70,
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Block keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (
      (e.ctrlKey && (e.key === "s" || e.key === "S" || e.key === "p" || e.key === "P" || e.key === "u" || e.key === "U")) ||
      (e.ctrlKey && e.shiftKey && (e.key === "i" || e.key === "I" || e.key === "j" || e.key === "J" || e.key === "c" || e.key === "C")) ||
      e.key === "F12" ||
      e.key === "PrintScreen"
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  // Block right-click
  useEffect(() => {
    const handler = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handler);
    return () => document.removeEventListener("contextmenu", handler);
  }, []);

  // Block print
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `@media print { body { display: none !important; } }`;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  const isImage = type === "image" || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(url);

  // For Google Drive links, convert to embed preview
  const getViewUrl = (rawUrl: string) => {
    if (rawUrl.includes("drive.google.com/file/d/")) {
      const match = rawUrl.match(/\/d\/([^/]+)/);
      if (match) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    if (rawUrl.includes("drive.google.com/open")) {
      const idParam = new URL(rawUrl).searchParams.get("id");
      if (idParam) return `https://drive.google.com/file/d/${idParam}/preview`;
    }
    return rawUrl;
  };

  const viewUrl = getViewUrl(url);

  return (
    <div
      className="fixed inset-0 bg-background flex flex-col z-50"
      style={{ WebkitUserSelect: "none", userSelect: "none", MozUserSelect: "none" } as React.CSSProperties}
    >
      {/* Header */}
      <div className="h-12 sm:h-14 bg-card border-b border-border flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0 z-20 relative">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 sm:gap-2 text-primary text-sm font-medium hover:gap-2.5 sm:hover:gap-3 transition-all shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <div className="h-5 w-px bg-border shrink-0" />
        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
        <h1 className="text-xs sm:text-sm font-display font-bold truncate flex-1">{title}</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <Shield className="w-3.5 h-3.5 text-primary" />
          <span className="hidden sm:inline">Protected</span>
        </div>
      </div>

      {/* Document viewer area - fills remaining space */}
      <div className="flex-1 relative overflow-hidden min-h-0">
        {/* Floating watermark */}
        <motion.div
          className="absolute z-30 pointer-events-none select-none"
          animate={{ top: `${watermarkPos.top}%`, left: `${watermarkPos.left}%` }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          <p className="text-primary/15 font-bold text-sm sm:text-lg md:text-2xl whitespace-nowrap rotate-[-25deg] font-display">
            {userEmail}
          </p>
        </motion.div>

        {/* Second watermark */}
        <motion.div
          className="absolute z-30 pointer-events-none select-none"
          animate={{ top: `${100 - watermarkPos.top}%`, left: `${100 - watermarkPos.left - 20}%` }}
          transition={{ duration: 2, ease: "easeInOut" }}
        >
          <p className="text-primary/10 font-bold text-xs sm:text-base md:text-xl whitespace-nowrap rotate-[-25deg] font-display">
            {userEmail}
          </p>
        </motion.div>

        {isImage ? (
          <div className="w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-auto">
            <img
              src={viewUrl}
              alt={title}
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <iframe
              src={viewUrl}
              className="w-full h-full border-0"
              title={title}
              sandbox="allow-scripts allow-same-origin"
              allow="fullscreen"
              style={{ minHeight: "100%" }}
            />
            {/* Block Google Drive "open in new window" button (top-right) */}
            <div className="absolute top-0 right-0 w-16 h-16 z-40 bg-black/90" />
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
