"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  Sparkles,
  Zap,
  Clock,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  Play,
} from "lucide-react";

const TOTAL_FRAMES = 295;

// Parallax Narrative Chapters across the 295-frame sequence
const CHAPTERS = [
  {
    id: "core",
    title: "Autonomous Subscription Core",
    phase: "PHASE 01 // FOUNDATION",
    center: 0.28,
    radius: 0.13,
    description:
      "Self-orchestrating billing loops continuously process customer lifecycles from instant quotation to active contract without manual handoffs.",
    statLabel: "Engine Latency",
    statValue: "< 8ms",
    accentColor: "#287D73",
    icon: Sparkles,
    metrics: [
      { label: "Pipeline Status", value: "Autopilot Active" },
      { label: "Sync Fidelity", value: "100% Real-time" },
    ],
  },
  {
    id: "cadence",
    title: "Multi-Cadence Synchronization",
    phase: "PHASE 02 // RECURRING ENGINE",
    center: 0.52,
    radius: 0.13,
    description:
      "Run daily, weekly, monthly, and multi-year subscription cadences concurrently. Mathematical duplicate prevention ensures zero double-billing.",
    statLabel: "Duplicate Prevention",
    statValue: "100% Math Proof",
    accentColor: "#287D73",
    icon: Zap,
    metrics: [
      { label: "Cadences", value: "Daily, Weekly, Monthly, Annual" },
      { label: "Invoice Collision", value: "0 Detected" },
    ],
  },
  {
    id: "time-machine",
    title: "Predictive Time Machine Simulation",
    phase: "PHASE 03 // SIMULATION & AUDIT",
    center: 0.74,
    radius: 0.13,
    description:
      "Simulate the passage of time into future billing cycles. Preview draft invoices, inspect proration schedules, and mathematically verify financial health before live execution.",
    statLabel: "Lookahead Range",
    statValue: "365 Days",
    accentColor: "#315F82",
    icon: Clock,
    metrics: [
      { label: "Draft Simulation", value: "Pre-execution Sandbox" },
      { label: "Proration Accuracy", value: "Exact to the Second" },
    ],
  },
  {
    id: "guardian",
    title: "Autonomous Revenue Operations",
    phase: "PHASE 04 // RECONCILIATION & RESOLUTION",
    center: 0.90,
    radius: 0.12,
    description:
      "Full revenue loop closed. Heuristic intelligence guarantees zero missed renewals, autonomous invoice generation, and real-time ledger settlement at the final frame.",
    statLabel: "Revenue Status",
    statValue: "100% Reconciled",
    accentColor: "#287D73",
    icon: CheckCircle2,
    metrics: [
      { label: "Cycle Completion", value: "295 / 295 Frames" },
      { label: "Revenue Leakage", value: "₹0 Prevented" },
    ],
  },
];

interface SmoothScrollCanvasProps {
  onOpenDemo?: () => void;
}

export function SmoothScrollCanvas({ onOpenDemo }: SmoothScrollCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<(HTMLImageElement | null)[]>(new Array(TOTAL_FRAMES).fill(null));
  const loadedCountRef = useRef(0);

  // Smooth scroll interpolation state
  const targetProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const lastRenderedFrameRef = useRef(-1);
  const animationFrameIdRef = useRef<number | null>(null);

  // UI state for reactive indicators
  const [loadProgress, setLoadProgress] = useState(0);
  const [activeChapterIndex, setActiveChapterIndex] = useState(-1); // -1 = Hero
  const [displayProgress, setDisplayProgress] = useState(0);

  // DOM Refs for direct 60fps style mutations (bypassing React re-renders)
  const heroContentRef = useRef<HTMLDivElement>(null);
  const heroTelemetryRef = useRef<HTMLDivElement>(null);
  const topHudRef = useRef<HTMLDivElement>(null);
  const finalFooterRef = useRef<HTMLDivElement>(null);
  const hudProgressRef = useRef<HTMLDivElement>(null);
  const hudFrameTextRef = useRef<HTMLSpanElement>(null);
  const chapterOverlayRefs = useRef<(HTMLDivElement | null)[]>([]);
  const telemetryCardRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Format frame URL
  const getFrameUrl = (index: number) => {
    const frameNum = String(index + 1).padStart(3, "0");
    return `/Frames/frame_${frameNum}.png`;
  };

  // Safe frame retriever: returns closest loaded frame to guarantee ZERO blank screens or flashing
  const getLoadedImage = useCallback((targetIndex: number): HTMLImageElement | null => {
    const images = imagesRef.current;
    if (images[targetIndex]?.complete && (images[targetIndex]?.naturalWidth || 0) > 0) {
      return images[targetIndex];
    }
    // Search nearby loaded keyframes
    for (let offset = 1; offset < TOTAL_FRAMES; offset++) {
      const prev = targetIndex - offset;
      if (prev >= 0 && images[prev]?.complete && (images[prev]?.naturalWidth || 0) > 0) {
        return images[prev];
      }
      const next = targetIndex + offset;
      if (next < TOTAL_FRAMES && images[next]?.complete && (images[next]?.naturalWidth || 0) > 0) {
        return images[next];
      }
    }
    return null;
  }, []);

  // Canvas drawing function with High-DPI support and aspect-ratio cover
  const renderFrameToCanvas = useCallback(
    (frameIndex: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const img = getLoadedImage(frameIndex);
      if (!img) return;

      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth || 1280;
      const ih = img.naturalHeight || 720;

      // Mathematical cover fill
      const scale = Math.max(cw / iw, ch / ih);
      const nw = iw * scale;
      const nh = ih * scale;
      const nx = (cw - nw) / 2;
      const ny = (ch - nh) / 2;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, nx, ny, nw, nh);

      // Subtle atmospheric vignette on the sides & bottom for high-end cinematic blend
      const gradient = ctx.createRadialGradient(
        cw / 2,
        ch / 2,
        Math.min(cw, ch) * 0.35,
        cw / 2,
        ch / 2,
        Math.max(cw, ch) * 0.85
      );
      gradient.addColorStop(0, "rgba(7, 14, 19, 0)");
      gradient.addColorStop(0.7, "rgba(7, 14, 19, 0.2)");
      gradient.addColorStop(1, "rgba(7, 14, 19, 0.85)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, cw, ch);
    },
    [getLoadedImage]
  );

  // Resize canvas according to container dimensions and Device Pixel Ratio
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const targetWidth = Math.floor(rect.width * dpr);
    const targetHeight = Math.floor(rect.height * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const currentFrame = Math.round(currentProgressRef.current * (TOTAL_FRAMES - 1));
      renderFrameToCanvas(currentFrame);
    }
  }, [renderFrameToCanvas]);

  // Progressive Priority Preloader
  useEffect(() => {
    let isCancelled = false;
    const images = imagesRef.current;

    // Helper to load a single image
    const loadSingleImage = (index: number): Promise<void> => {
      return new Promise((resolve) => {
        if (images[index]) {
          resolve();
          return;
        }
        const img = new Image();
        img.src = getFrameUrl(index);
        img.onload = () => {
          if (!isCancelled) {
            images[index] = img;
            loadedCountRef.current += 1;
            setLoadProgress(Math.round((loadedCountRef.current / TOTAL_FRAMES) * 100));
            // As soon as Frame 1 loads, render Frame 1 immediately
            if (index === 0 && lastRenderedFrameRef.current === -1) {
              renderFrameToCanvas(0);
              lastRenderedFrameRef.current = 0;
            }
          }
          resolve();
        };
        img.onerror = () => {
          resolve();
        };
      });
    };

    // Phase 1: Load Frame 1 immediately
    loadSingleImage(0).then(() => {
      if (isCancelled) return;

      // Phase 2: Keyframe wave (every 8th frame). 37 images provide full scroll preview in ~1 second
      const keyframeIndices: number[] = [];
      for (let i = 8; i < TOTAL_FRAMES; i += 8) {
        keyframeIndices.push(i);
      }
      keyframeIndices.push(TOTAL_FRAMES - 1);

      Promise.all(keyframeIndices.map((idx) => loadSingleImage(idx))).then(() => {
        if (isCancelled) return;

        // Phase 3: Background queue for all remaining frames in non-blocking batches
        const remainingIndices: number[] = [];
        for (let i = 0; i < TOTAL_FRAMES; i++) {
          if (!images[i]) {
            remainingIndices.push(i);
          }
        }

        const BATCH_SIZE = 6;
        let batchIndex = 0;

        const loadNextBatch = () => {
          if (isCancelled || batchIndex >= remainingIndices.length) return;
          const slice = remainingIndices.slice(batchIndex, batchIndex + BATCH_SIZE);
          batchIndex += BATCH_SIZE;

          Promise.all(slice.map((idx) => loadSingleImage(idx))).then(() => {
            if (!isCancelled) {
              if (typeof window !== "undefined" && "requestIdleCallback" in window) {
                (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(loadNextBatch);
              } else {
                setTimeout(loadNextBatch, 20);
              }
            }
          });
        };

        loadNextBatch();
      });
    });

    return () => {
      isCancelled = true;
    };
  }, [renderFrameToCanvas]);

  // Window resize observer
  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [handleResize]);

  // Scroll listener: computes target progress based on container bounding rect
  useEffect(() => {
    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const scrollableDistance = rect.height - window.innerHeight;

      if (scrollableDistance <= 0) return;

      // Progress ranges from 0.0 (top of page/hero) to 1.0 (end of sequence)
      const progress = Math.min(1, Math.max(0, -rect.top / scrollableDistance));
      targetProgressRef.current = progress;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Main 60fps/120fps physics RAF animation loop
  useEffect(() => {
    let isRunning = true;
    let throttleCounter = 0;

    const animate = () => {
      if (!isRunning) return;

      const current = currentProgressRef.current;
      const target = targetProgressRef.current;
      const delta = target - current;

      // Smooth damped spring / LERP factor (0.12 = butter-smooth gliding)
      const nextProgress = Math.abs(delta) < 0.0002 ? target : current + delta * 0.12;
      currentProgressRef.current = nextProgress;

      // Determine target frame index [0..294]
      const frameIndex = Math.min(TOTAL_FRAMES - 1, Math.max(0, Math.round(nextProgress * (TOTAL_FRAMES - 1))));

      if (frameIndex !== lastRenderedFrameRef.current) {
        renderFrameToCanvas(frameIndex);
        lastRenderedFrameRef.current = frameIndex;
      }

      // -------------------------------------------------------------
      // INITIAL HERO CONTENT PARALLAX (progress 0.00 -> 0.15)
      // Floats away with vertical parallax as frames start animating
      // -------------------------------------------------------------
      if (heroContentRef.current) {
        const heroOpacity = Math.max(0, 1 - nextProgress * 7);
        const heroTranslate = nextProgress * -220;
        heroContentRef.current.style.opacity = `${heroOpacity.toFixed(3)}`;
        heroContentRef.current.style.transform = `translateY(${heroTranslate.toFixed(1)}px)`;
        heroContentRef.current.style.pointerEvents = heroOpacity > 0.2 ? "auto" : "none";
      }

      if (heroTelemetryRef.current) {
        const telemetryOpacity = Math.max(0, 1 - nextProgress * 6);
        const telemetryTranslate = nextProgress * -160;
        heroTelemetryRef.current.style.opacity = `${telemetryOpacity.toFixed(3)}`;
        heroTelemetryRef.current.style.transform = `translateY(${telemetryTranslate.toFixed(1)}px)`;
        heroTelemetryRef.current.style.pointerEvents = telemetryOpacity > 0.2 ? "auto" : "none";
      }

      // Cockpit HUD & Scrubber Fade In (when progress > 0.10)
      const hudProgress = Math.min(1, Math.max(0, (nextProgress - 0.10) / 0.08));
      if (topHudRef.current) {
        topHudRef.current.style.opacity = `${hudProgress.toFixed(3)}`;
        topHudRef.current.style.pointerEvents = hudProgress > 0.5 ? "auto" : "none";
      }

      if (finalFooterRef.current) {
        const footerProgress = Math.min(1, Math.max(0, (nextProgress - 0.88) / 0.08));
        finalFooterRef.current.style.opacity = `${footerProgress.toFixed(3)}`;
        finalFooterRef.current.style.pointerEvents = footerProgress > 0.5 ? "auto" : "none";
      }
      if (hudProgressRef.current) {
        hudProgressRef.current.style.width = `${nextProgress * 100}%`;
      }
      if (hudFrameTextRef.current) {
        hudFrameTextRef.current.innerText = `FRAME ${String(frameIndex + 1).padStart(3, "0")} / 295`;
      }

      // -------------------------------------------------------------
      // PARALLAX NARRATIVE CHAPTERS (0.16 -> 0.98)
      // Glides in and out over the expanding 3D loop
      // -------------------------------------------------------------
      CHAPTERS.forEach((chapter, idx) => {
        const overlay = chapterOverlayRefs.current[idx];
        if (!overlay) return;

        const distance = Math.abs(nextProgress - chapter.center);
        if (distance > chapter.radius) {
          overlay.style.opacity = "0";
          overlay.style.pointerEvents = "none";
          overlay.style.transform = `translateY(${nextProgress < chapter.center ? 35 : -35}px) scale(0.96)`;
        } else {
          const rawRatio = 1 - distance / chapter.radius;
          const easedRatio = Math.sin((rawRatio * Math.PI) / 2);
          const parallaxOffset = (nextProgress - chapter.center) * -90;

          overlay.style.opacity = `${easedRatio.toFixed(3)}`;
          overlay.style.pointerEvents = easedRatio > 0.4 ? "auto" : "none";
          overlay.style.transform = `translateY(${parallaxOffset.toFixed(1)}px) scale(${(0.96 + easedRatio * 0.04).toFixed(3)})`;
        }
      });

      // Floating telemetry nodes on the right
      telemetryCardRefs.current.forEach((telemetry, idx) => {
        if (!telemetry) return;
        const chapter = CHAPTERS[idx];
        if (!chapter) return;
        const distance = Math.abs(nextProgress - chapter.center);
        if (distance > chapter.radius) {
          telemetry.style.opacity = "0";
          telemetry.style.transform = `translateY(${nextProgress < chapter.center ? 45 : -45}px) scale(0.94)`;
        } else {
          const rawRatio = 1 - distance / chapter.radius;
          const easedRatio = Math.sin((rawRatio * Math.PI) / 2);
          const counterDrift = (nextProgress - chapter.center) * 65;

          telemetry.style.opacity = `${easedRatio.toFixed(3)}`;
          telemetry.style.transform = `translateY(${counterDrift.toFixed(1)}px) scale(${(0.95 + easedRatio * 0.05).toFixed(3)})`;
        }
      });

      // Throttle React state updates to ~15fps for UI indicators
      throttleCounter++;
      if (throttleCounter % 4 === 0) {
        setDisplayProgress(Math.round(nextProgress * 100));

        if (nextProgress < 0.15) {
          setActiveChapterIndex(-1); // Hero
        } else {
          let activeIdx = 0;
          let minDistance = 999;
          CHAPTERS.forEach((c, i) => {
            const d = Math.abs(nextProgress - c.center);
            if (d < minDistance) {
              minDistance = d;
              activeIdx = i;
            }
          });
          setActiveChapterIndex(activeIdx);
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      isRunning = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [renderFrameToCanvas]);



  // Timeline scrubber click
  const handleScrubberInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));

    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const containerTop = window.scrollY + containerRect.top;
    const scrollableDistance = containerRect.height - window.innerHeight;
    const targetScrollY = containerTop + scrollableDistance * percentage;

    window.scrollTo({
      top: targetScrollY,
      behavior: "smooth",
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#070E13] text-white"
      style={{ height: "380vh" }} // Sized to the 295-frame sequence: terminates at Frame 295
    >
      {/* Sticky Fullscreen Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-[#070E13]">
        {/* Layer 0: Fullscreen Canvas (NO White Background, Full-Bleed 3D Frames) */}
        <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover select-none pointer-events-none"
          />

          {/* Seamless Atmospheric Vignettes blending with dark viewport */}
          <div className="absolute top-0 left-0 right-0 h-36 bg-gradient-to-b from-[#070E13] via-[#070E13]/80 to-transparent pointer-events-none z-10" />
          <div className="absolute bottom-0 left-0 right-0 h-36 bg-gradient-to-t from-[#070E13] via-[#070E13]/80 to-transparent pointer-events-none z-10" />
        </div>

        {/* ============================================================== */}
        {/* INITIAL HERO OVERLAY (Starts immediately at Frame 001)         */}
        {/* Floating directly over the 3D loop with zero white backgrounds */}
        {/* ============================================================== */}
        <div
          ref={heroContentRef}
          className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full flex flex-col justify-center pointer-events-none"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Content (Floats gracefully in the dark left half) */}
            <div className="lg:col-span-7 space-y-6 pointer-events-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#287D73]/20 border border-[#287D73]/40 text-[#A3D9D2] text-xs font-mono font-bold tracking-wider uppercase backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-[#287D73] animate-pulse" />
                Subscription Management Platform
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12]">
                From subscription to revenue,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#287D73] to-[#A3D9D2]">
                  on autopilot.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-[#9EB1BC] leading-relaxed max-w-xl">
                Unify products, recurring billing, invoices, and payment reconciliation in one intelligent engine. Eliminate missed renewals and catch revenue leaks before they happen.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                <Link
                  href="/signup"
                  className="inline-flex justify-center items-center gap-2 px-6 py-3.5 rounded-lg bg-[#287D73] text-white font-semibold text-sm hover:bg-[#20665E] transition-all shadow-lg hover:shadow-[#287D73]/25"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => onOpenDemo && onOpenDemo()}
                  className="inline-flex justify-center items-center gap-2 px-5 py-3.5 rounded-lg bg-white/10 border border-white/20 text-white font-semibold text-sm hover:bg-white/15 backdrop-blur-md transition-colors shadow-xs"
                >
                  <Play className="w-4 h-4 text-[#A3D9D2] fill-[#A3D9D2]/20" />
                  <span>Interactive Walkthrough</span>
                </button>
              </div>

              {/* 4 Compact Benefit Tiles (Frosted Dark Glass) */}
              <div className="grid grid-cols-2 gap-3.5 pt-6 border-t border-white/10">
                <div className="p-3.5 rounded-xl bg-[#12222B]/75 backdrop-blur-md border border-white/10 shadow-xs hover:border-[#287D73]/50 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                    <Zap className="w-3.5 h-3.5 text-[#A3D9D2]" />
                    <span>Automated Billing</span>
                  </div>
                  <p className="text-[12px] text-[#9EB1BC]">
                    Multi-cadence renewals & zero-duplicate invoices
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#12222B]/75 backdrop-blur-md border border-white/10 shadow-xs hover:border-[#287D73]/50 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-[#B86F4B]" />
                    <span>Revenue Intelligence</span>
                  </div>
                  <p className="text-[12px] text-[#9EB1BC]">
                    Autonomous revenue guardian with 1-click recovery
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#12222B]/75 backdrop-blur-md border border-white/10 shadow-xs hover:border-[#287D73]/50 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#24734D]" />
                    <span>Customer Self-Service</span>
                  </div>
                  <p className="text-[12px] text-[#9EB1BC]">
                    Dedicated subscriber portal for pause/resume
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-[#12222B]/75 backdrop-blur-md border border-white/10 shadow-xs hover:border-[#287D73]/50 transition-colors">
                  <div className="flex items-center gap-2 text-xs font-bold text-white mb-1">
                    <Clock className="w-3.5 h-3.5 text-[#315F82]" />
                    <span>Billing Time Machine</span>
                  </div>
                  <p className="text-[12px] text-[#9EB1BC]">
                    Simulate future cycles with mathematical audit proof
                  </p>
                </div>
              </div>
            </div>

            {/* Right Side: Floating Live Telemetry Badge (Completely unobscured 3D loop behind) */}
            <div
              ref={heroTelemetryRef}
              className="lg:col-span-5 hidden lg:flex flex-col items-end pointer-events-auto"
            >
              <div className="p-5 rounded-2xl bg-[#12222B]/75 backdrop-blur-xl border border-white/15 shadow-2xl max-w-sm w-full space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#287D73] animate-pulse" />
                    <span className="text-xs font-mono font-semibold text-[#D6E0E1]">
                      BRIGHTLOOP COMMAND NODE
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#A3D9D2] bg-[#287D73]/30 px-2 py-0.5 rounded border border-[#287D73]/40">
                    FRAME 001 LIVE
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-[10px] uppercase font-mono text-[#9EB1BC]">
                      Active MRR
                    </div>
                    <div className="text-base font-bold text-white tabular-nums mt-0.5">
                      ₹12,45,000
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-[10px] uppercase font-mono text-[#9EB1BC]">
                      System Health
                    </div>
                    <div className="text-base font-bold text-[#A3D9D2] tabular-nums mt-0.5">
                      99.4%
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#A3D9D2]" />
                    <span className="text-xs text-white font-medium">Time Machine Mode</span>
                  </div>
                  <span className="text-[11px] font-mono text-[#A3D9D2]">Armed</span>
                </div>

                <div className="text-[11px] text-[#9EB1BC] flex items-center gap-1.5 pt-1">
                  <ChevronDown className="w-3.5 h-3.5 text-[#A3D9D2] animate-bounce" />
                  <span>Scroll down to advance the 3D loop</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TOP COCKPIT HUD (Fades in as user scrolls into sequence)       */}
        {/* ============================================================== */}
        <div
          ref={topHudRef}
          className="absolute top-0 left-0 right-0 z-30 px-4 sm:px-8 py-4 flex items-center justify-between border-b border-white/10 backdrop-blur-md bg-[#070E13]/80 transition-opacity"
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-[#287D73] flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-3.5 h-3.5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-white uppercase">
                  Brightloop OS
                </span>
                <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#287D73]/30 text-[#A3D9D2] border border-[#287D73]/40">
                  3D PARALLAX LOOP
                </span>
              </div>
              <p className="text-[11px] text-[#9EB1BC] hidden sm:block">
                Autonomous Revenue Operations in Motion
              </p>
            </div>
          </div>

          {/* Center: Frame Scrubber Bar */}
          <div className="hidden md:flex flex-col items-center gap-1.5 w-72 lg:w-96">
            <div className="w-full flex justify-between text-[10px] font-mono text-[#9EB1BC]">
              <span ref={hudFrameTextRef}>FRAME 001 / 295</span>
              <span>{displayProgress}% CYCLE</span>
            </div>
            <div
              className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden cursor-pointer relative group"
              onClick={handleScrubberInteraction}
              title="Click to jump to any point in the cycle"
            >
              <div
                ref={hudProgressRef}
                className="h-full bg-gradient-to-r from-[#287D73] to-[#A3D9D2] rounded-full transition-all duration-75 group-hover:brightness-125"
                style={{ width: "0%" }}
              />
            </div>
          </div>

          {/* Right Status Indicator */}
          <div className="flex items-center gap-3">
            {loadProgress < 100 && (
              <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-[#A3D9D2] bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-[#A3D9D2] animate-ping" />
                <span>Preloading ({loadProgress}%)</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#287D73]/20 border border-[#287D73]/40 text-[#A3D9D2] text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#287D73] animate-pulse" />
              <span>Autopilot Active</span>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PARALLAX NARRATIVE CARDS (Gliding 3D Editorial Focus Panels)   */}
        {/* ============================================================== */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between pointer-events-none">
          {/* Left Column: Editorial Focus Cards */}
          <div className="relative w-full max-w-xl">
            {CHAPTERS.map((chapter, idx) => {
              const Icon = chapter.icon;
              return (
                <div
                  key={chapter.id}
                  ref={(el) => {
                    chapterOverlayRefs.current[idx] = el;
                  }}
                  className="absolute top-1/2 -translate-y-1/2 left-0 w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-[#12222B]/85 backdrop-blur-xl border border-white/15 shadow-2xl transition-all duration-150"
                  style={{
                    opacity: 0,
                    pointerEvents: "none",
                  }}
                >
                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#287D73]/25 border border-[#287D73]/50 text-[#A3D9D2] text-[11px] font-mono font-bold tracking-wider uppercase mb-4">
                    <Icon className="w-3.5 h-3.5 text-[#A3D9D2]" />
                    <span>{chapter.phase}</span>
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                    {chapter.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-[#D6E0E1] mt-3 leading-relaxed">
                    {chapter.description}
                  </p>

                  {/* Chapter Metrics Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-6 pt-5 border-t border-white/10">
                    {chapter.metrics.map((metric, mIdx) => (
                      <div
                        key={mIdx}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                      >
                        <div className="text-[10px] uppercase font-mono text-[#9EB1BC]">
                          {metric.label}
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {metric.value}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Primary CTA */}
                  <div className="flex items-center gap-3 mt-6">
                    <Link
                      href="/signup"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#287D73] text-white text-xs font-bold hover:bg-[#20665E] transition-colors shadow-xs"
                    >
                      <span>Explore this module</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                    <span className="text-[11px] text-[#9EB1BC]">
                      Scroll down to advance sequence
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Floating Telemetry Badges (Multi-Plane Parallax) */}
          <div className="hidden lg:block relative w-80 h-96">
            {CHAPTERS.map((chapter, idx) => (
              <div
                key={`telemetry-${chapter.id}`}
                ref={(el) => {
                  telemetryCardRefs.current[idx] = el;
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 w-80 p-5 rounded-2xl bg-[#12222B]/85 backdrop-blur-xl border border-white/15 shadow-2xl transition-all duration-150"
                style={{
                  opacity: 0,
                }}
              >
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#287D73] animate-pulse" />
                    <span className="text-[11px] font-mono uppercase text-[#9EB1BC]">
                      Telemetry Node {idx + 1}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#A3D9D2] bg-[#287D73]/20 px-1.5 py-0.5 rounded border border-[#287D73]/30">
                    LIVE
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="text-[11px] text-[#9EB1BC]">{chapter.statLabel}</div>
                    <div className="text-2xl font-extrabold text-white tabular-nums tracking-tight mt-0.5">
                      {chapter.statValue}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#070E13]/70 border border-white/5 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#9EB1BC]">Simulation Integrity</span>
                      <span className="text-[#A3D9D2] font-semibold">100%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#287D73] rounded-full w-[98%]" />
                    </div>
                  </div>

                  <div className="text-[11px] text-[#9EB1BC] flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#287D73]" />
                    <span>Auditable transaction log</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>



        {/* ============================================================== */}
        {/* FINAL FOOTER STRIP (Visible at Frame 295 / End of Landing Page) */}
        {/* ============================================================== */}
        <div
          ref={finalFooterRef}
          className="absolute bottom-4 left-0 right-0 z-30 px-6 sm:px-10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#82929E] pointer-events-auto transition-opacity duration-200"
          style={{ opacity: 0, pointerEvents: "none" }}
        >
          <div className="flex items-center gap-2 text-white/90 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-[#287D73]" />
            <span>Brightloop OS — Autonomous Revenue Operations</span>
          </div>
          <div className="flex items-center gap-6 mt-2 sm:mt-0 font-medium text-[#9EB1BC]">
            <Link href="/login" className="hover:text-white transition-colors">Admin Login</Link>
            <Link href="/portal" className="hover:text-white transition-colors">Customer Portal</Link>
            <Link href="/time-machine" className="hover:text-white transition-colors">Time Machine</Link>
            <Link href="/guardian" className="hover:text-white transition-colors">Revenue Guardian</Link>
          </div>
          <p className="text-[#82929E] mt-2 sm:mt-0 font-mono text-[11px]">
            FRAME 295 // END OF LANDING PAGE
          </p>
        </div>
      </div>
    </div>
  );
}
