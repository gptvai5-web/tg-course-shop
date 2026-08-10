import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Volume1,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  RotateCw,
  Gauge,
} from "lucide-react";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

let apiLoaded = false;
let apiLoading = false;
const apiReadyCallbacks: (() => void)[] = [];

function loadYouTubeAPI(): Promise<void> {
  if (apiLoaded && window.YT?.Player) return Promise.resolve();
  return new Promise((resolve) => {
    apiReadyCallbacks.push(resolve);
    if (apiLoading) return;
    apiLoading = true;
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      prev?.();
      apiReadyCallbacks.forEach((cb) => cb());
      apiReadyCallbacks.length = 0;
    };
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });
}

interface YouTubePlayerProps {
  videoId: string;
}

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

const YouTubePlayer = ({ videoId }: YouTubePlayerProps) => {
  const { user } = useAuth();
  const userEmail = user?.email || "";
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQuality, setShowQuality] = useState(false);
  const [qualities, setQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState("");
  const [showVolSlider, setShowVolSlider] = useState(false);
  const [buffered, setBuffered] = useState(0);
  const [watermarkPos, setWatermarkPos] = useState({ top: 15, left: 20 });
  const [showSpeed, setShowSpeed] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [skipAnim, setSkipAnim] = useState<"back" | "fwd" | null>(null);

  // Floating watermark
  useEffect(() => {
    if (!userEmail) return;
    const move = () => {
      setWatermarkPos({
        top: 8 + Math.random() * 55,
        left: 5 + Math.random() * 70,
      });
    };
    move();
    const id = setInterval(move, 5000);
    return () => clearInterval(id);
  }, [userEmail]);

  const startTracking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      setCurrentTime(p.getCurrentTime());
      setDuration(p.getDuration?.() || 0);
      const loaded = p.getVideoLoadedFraction?.() || 0;
      setBuffered(loaded * 100);
    }, 250);
  }, []);

  const stopTracking = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
      setShowQuality(false);
      setShowSpeed(false);
    }, 3500);
  }, [playing]);

  useEffect(() => {
    let destroyed = false;
    const init = async () => {
      try {
        await loadYouTubeAPI();
        if (destroyed || !containerRef.current) return;
        if (playerRef.current) { try { playerRef.current.destroy(); } catch {} playerRef.current = null; }
        const playerDiv = document.createElement("div");
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(playerDiv);
        playerRef.current = new window.YT.Player(playerDiv, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: 1, playsinline: 1, rel: 0, modestbranding: 1,
            iv_load_policy: 3, controls: 0, showinfo: 0, disablekb: 1, fs: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (destroyed) return;
              event.target.playVideo();
              setVolume(event.target.getVolume());
              setMuted(event.target.isMuted());
              startTracking();
              setTimeout(() => {
                const levels = event.target.getAvailableQualityLevels?.() || [];
                setQualities(levels);
                setCurrentQuality(event.target.getPlaybackQuality?.() || "");
              }, 1500);
            },
            onStateChange: (event: any) => {
              if (destroyed) return;
              const state = event.data;
              if (state === window.YT.PlayerState.PLAYING) { setPlaying(true); startTracking(); }
              else if (state === window.YT.PlayerState.PAUSED) { setPlaying(false); setShowControls(true); }
              else if (state === window.YT.PlayerState.ENDED) { setPlaying(false); setShowControls(true); stopTracking(); }
            },
            onError: (event: any) => {
              const code = event.data;
              const msgs: Record<number, string> = {
                2: "Invalid video ID", 5: "HTML5 player error",
                100: "Video not found or removed",
                101: "Video owner does not allow embedded playback",
                150: "Video owner does not allow embedded playback",
              };
              setError(msgs[code] || `YouTube Error (${code})`);
            },
          },
        });
      } catch { if (!destroyed) setError("Failed to load YouTube player"); }
    };
    setError(null); setPlaying(false); setCurrentTime(0); setDuration(0); setSpeed(1);
    init();
    return () => { destroyed = true; stopTracking(); if (playerRef.current) { try { playerRef.current.destroy(); } catch {} playerRef.current = null; } };
  }, [videoId, startTracking, stopTracking]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!wrapperRef.current?.contains(document.activeElement) && document.activeElement !== document.body) return;
      const p = playerRef.current;
      if (!p) return;
      switch (e.key) {
        case " ": case "k": e.preventDefault(); togglePlay(); break;
        case "ArrowLeft": e.preventDefault(); doSeek(-10); break;
        case "ArrowRight": e.preventDefault(); doSeek(10); break;
        case "ArrowUp": e.preventDefault(); handleVolumeKey(Math.min(100, volume + 10)); break;
        case "ArrowDown": e.preventDefault(); handleVolumeKey(Math.max(0, volume - 10)); break;
        case "f": e.preventDefault(); toggleFullscreen(); break;
        case "m": e.preventDefault(); toggleMute(); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  const togglePlay = () => {
    const p = playerRef.current;
    if (!p) return;
    if (playing) p.pauseVideo(); else p.playVideo();
  };

  const doSeek = (seconds: number) => {
    const p = playerRef.current;
    if (!p?.seekTo) return;
    p.seekTo(Math.max(0, p.getCurrentTime() + seconds), true);
    setSkipAnim(seconds < 0 ? "back" : "fwd");
    setTimeout(() => setSkipAnim(null), 600);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const p = playerRef.current;
    if (!p?.seekTo || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    p.seekTo(ratio * duration, true);
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    handleVolumeKey(val);
  };

  const handleVolumeKey = (val: number) => {
    setVolume(val);
    const p = playerRef.current;
    if (!p) return;
    p.setVolume(val);
    if (val === 0) { p.mute(); setMuted(true); }
    else if (muted) { p.unMute(); setMuted(false); }
  };

  const toggleMute = () => {
    const p = playerRef.current;
    if (!p) return;
    if (muted) { p.unMute(); setMuted(false); } else { p.mute(); setMuted(true); }
  };

  const toggleFullscreen = () => {
    if (!wrapperRef.current) return;
    if (!document.fullscreenElement) wrapperRef.current.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  const qualityLabel = (q: string) => {
    const map: Record<string, string> = {
      highres: "4K", hd2160: "2160p", hd1440: "1440p", hd1080: "1080p",
      hd720: "720p", large: "480p", medium: "360p", small: "240p", tiny: "144p",
    };
    return map[q] || q;
  };

  const setQualityFn = (q: string) => {
    const p = playerRef.current;
    if (!p) return;
    p.setPlaybackQuality(q);
    setCurrentQuality(q);
    setShowQuality(false);
  };

  const setSpeedFn = (s: number) => {
    const p = playerRef.current;
    if (!p) return;
    p.setPlaybackRate(s);
    setSpeed(s);
    setShowSpeed(false);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 50 ? Volume1 : Volume2;

  return (
    <div
      ref={wrapperRef}
      className="relative w-full h-full bg-black group select-none"
      onContextMenu={(e) => e.preventDefault()}
      onMouseMove={resetHideTimer}
      tabIndex={0}
    >
      {/* YouTube iframe - blocked */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full pointer-events-none [&>div]:w-full [&>div]:h-full [&>iframe]:w-full [&>iframe]:h-full"
      />

      {/* Invisible shield - blocks YouTube, handles play/pause */}
      <div
        className="absolute inset-0 z-[25] cursor-pointer"
        onClick={(e) => {
          // Don't toggle if clicking on controls bar area
          if ((e.target as HTMLElement).closest("[data-controls-bar]")) return;
          togglePlay();
          resetHideTimer();
        }}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest("[data-controls-bar]")) return;
          toggleFullscreen();
        }}
      />

      {/* Floating email watermark */}
      {userEmail && (
        <div
          className="absolute z-[15] pointer-events-none transition-all duration-[2000ms] ease-in-out"
          style={{ top: `${watermarkPos.top}%`, left: `${watermarkPos.left}%` }}
        >
          <span className="text-[10px] md:text-xs font-mono text-red-500/50 whitespace-nowrap select-none">
            {userEmail}
          </span>
        </div>
      )}

      {/* Skip animation overlay */}
      {skipAnim && (
        <div className={`absolute top-1/2 -translate-y-1/2 z-[18] pointer-events-none animate-ping ${skipAnim === "back" ? "left-[15%]" : "right-[15%]"}`}>
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            {skipAnim === "back" ? <RotateCcw className="w-7 h-7 text-white" /> : <RotateCw className="w-7 h-7 text-white" />}
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div
        data-controls
        className={`absolute inset-0 z-[26] flex flex-col justify-end transition-opacity duration-300 pointer-events-none ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
        {/* Top gradient for "← Back to Course" area */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />

        {/* Center play button when paused */}
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" fill="white" />
            </div>
          </div>
        )}

        {/* Controls bar */}
        <div data-controls-bar className="relative z-[30] px-3 md:px-4 pb-3 md:pb-4 pt-2 space-y-1.5 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
          {/* Progress bar */}
          <div
            className="group/progress w-full h-[5px] hover:h-[7px] bg-white/20 rounded-full cursor-pointer transition-all relative"
            onClick={handleSeek}
          >
            <div className="absolute top-0 left-0 h-full bg-white/25 rounded-full" style={{ width: `${buffered}%` }} />
            <div className="absolute top-0 left-0 h-full bg-primary rounded-full transition-[width] duration-100" style={{ width: `${progress}%` }} />
            <div
              className="absolute top-1/2 w-[13px] h-[13px] bg-primary rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
            />
          </div>

          {/* Bottom row */}
          <div className="flex items-center gap-1.5 md:gap-2.5">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform p-1.5">
              {playing
                ? <Pause className="w-5 h-5 md:w-6 md:h-6" fill="white" />
                : <Play className="w-5 h-5 md:w-6 md:h-6" fill="white" />}
            </button>

            {/* Skip -10s */}
            <button onClick={() => doSeek(-10)} className="relative text-white/80 hover:text-white transition-colors p-1">
              <RotateCcw className="w-5 h-5 md:w-[22px] md:h-[22px]" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] md:text-[9px] font-bold mt-[1px]">10</span>
            </button>

            {/* Skip +10s */}
            <button onClick={() => doSeek(10)} className="relative text-white/80 hover:text-white transition-colors p-1">
              <RotateCw className="w-5 h-5 md:w-[22px] md:h-[22px]" />
              <span className="absolute inset-0 flex items-center justify-center text-[8px] md:text-[9px] font-bold mt-[1px]">10</span>
            </button>

            {/* Volume */}
            <div
              className="relative flex items-center"
              onMouseEnter={() => setShowVolSlider(true)}
              onMouseLeave={() => setShowVolSlider(false)}
            >
              <button onClick={toggleMute} className="text-white hover:scale-110 transition-transform p-1">
                <VolumeIcon className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <div className={`overflow-hidden transition-all duration-200 ${showVolSlider ? "w-[72px] ml-1 opacity-100" : "w-0 opacity-0"}`}>
                <input
                  type="range" min={0} max={100}
                  value={muted ? 0 : volume}
                  onChange={handleVolume}
                  className="w-full h-1 accent-white cursor-pointer appearance-none bg-white/30 rounded-full [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
                />
              </div>
            </div>

            {/* Time */}
            <span className="text-white/70 text-[11px] md:text-sm font-mono ml-0.5 tabular-nums">
              {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Speed */}
            <div className="relative">
              <button
                onClick={() => { setShowSpeed(!showSpeed); setShowQuality(false); }}
                className="text-white/80 hover:text-white transition-colors p-1 flex items-center gap-1"
              >
                <Gauge className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                {speed !== 1 && <span className="text-[10px] md:text-xs font-bold">{speed}x</span>}
              </button>
              {showSpeed && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-md rounded-lg border border-white/10 py-1 min-w-[100px]">
                  <div className="px-3 py-1.5 text-[10px] text-white/40 font-semibold uppercase tracking-wider">Speed</div>
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeedFn(s)}
                      className={`w-full text-left px-4 py-1.5 text-xs hover:bg-white/10 transition-colors ${
                        s === speed ? "text-primary font-bold" : "text-white/80"
                      }`}
                    >
                      {s === 1 ? "Normal" : `${s}x`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quality */}
            {qualities.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => { setShowQuality(!showQuality); setShowSpeed(false); }}
                  className="text-white/80 hover:text-white transition-colors p-1 flex items-center gap-1"
                >
                  <Settings className="w-4 h-4 md:w-[18px] md:h-[18px]" />
                  <span className="text-[10px] md:text-xs font-medium hidden sm:inline">{qualityLabel(currentQuality)}</span>
                </button>
                {showQuality && (
                  <div className="absolute bottom-full right-0 mb-2 bg-black/95 backdrop-blur-md rounded-lg border border-white/10 py-1 min-w-[120px] max-h-52 overflow-y-auto">
                    <div className="px-3 py-1.5 text-[10px] text-white/40 font-semibold uppercase tracking-wider">Quality</div>
                    {qualities.map((q) => (
                      <button
                        key={q}
                        onClick={() => setQualityFn(q)}
                        className={`w-full text-left px-4 py-1.5 text-xs hover:bg-white/10 transition-colors ${
                          q === currentQuality ? "text-primary font-bold" : "text-white/80"
                        }`}
                      >
                        {qualityLabel(q)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white/80 hover:text-white hover:scale-110 transition-all p-1">
              {isFullscreen ? <Minimize className="w-4 h-4 md:w-5 md:h-5" /> : <Maximize className="w-4 h-4 md:w-5 md:h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-4 text-center z-30">
          <div>
            <p className="text-sm text-white font-medium mb-2">{error}</p>
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Watch on YouTube →
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default YouTubePlayer;
