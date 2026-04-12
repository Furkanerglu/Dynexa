"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useImagePreloader } from "./useImagePreloader";
import { LoadingScreen } from "./LoadingScreen";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    title: "DYNEXA'YA HOŞ GELDİNİZ",
    subtitle: "Türkiye'nin en kapsamlı 3D baskı platformu — tek adreste her şey",
    color: "#FF6B35",
    frameStart: 0,
    frameEnd: 7,
    cta: null,
  },
  {
    title: "PARÇANIZI BİZ BASIYORUZ",
    subtitle: "STL dosyanızı yükleyin, malzeme ve kaliteyi seçin — gerisini biz halledelim",
    color: "#FF6B35",
    frameStart: 8,
    frameEnd: 15,
    cta: { label: "Baskı Talebi Oluştur", href: "/services/print" },
  },
  {
    title: "HAZIR PARÇALAR, ANINDA TESLİM",
    subtitle: "Stokta yüzlerce hazır 3D baskı parça — sipariş ver, kapında olsun",
    color: "#00D4AA",
    frameStart: 16,
    frameEnd: 23,
    cta: { label: "Mağazaya Gözat", href: "/shop" },
  },
  {
    title: "TEKNİK SERVİS YANINDA",
    subtitle: "Yazıcınız mı bozuldu? Uzman ekibimiz onarım ve bakımda her zaman hazır",
    color: "#00D4AA",
    frameStart: 24,
    frameEnd: 31,
    cta: { label: "Servis Talebi Oluştur", href: "/services/technical" },
  },
  {
    title: "HER ŞEY DYNEXA'DA",
    subtitle: "Filament, yedek parça, baskı ve servis — 3D baskının tek durağı",
    color: "#FF6B35",
    frameStart: 32,
    frameEnd: 39,
    cta: { label: "Platformu Keşfet", href: "/shop" },
  },
];

const SECTION_COUNT = SECTIONS.length;
const SECTION_FRAMES = SECTIONS.map((s) => Math.round((s.frameStart + s.frameEnd) / 2));
const TRANSITION_DURATION = 800;

export function PrinterCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);

  const { images, progress: loadProgress, isLoaded } = useImagePreloader(40);

  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef   = useRef(0);
  const isTransitioningRef = useRef(false);
  const currentFrameRef    = useRef(0);
  const animRafRef         = useRef<number>(0);

  // ─── Offscreen canvas boyutlandır (sadece resize'da) ──────────────
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (canvas.width === w && canvas.height === h) return;
    canvas.width  = w;
    canvas.height = h;

    if (!offscreenRef.current) offscreenRef.current = document.createElement("canvas");
    offscreenRef.current.width  = w;
    offscreenRef.current.height = h;
  }, []);

  // ─── Canvas çizim (boyut DEĞİŞTİRMEDEN) ─────────────────────────
  const drawFrame = useCallback(
    (frameIdx: number) => {
      const canvas = canvasRef.current;
      const offscreen = offscreenRef.current;
      if (!canvas || !offscreen || images.length === 0) return;

      const ctx = canvas.getContext("2d", { alpha: false });
      const offCtx = offscreen.getContext("2d", { alpha: false });
      if (!ctx || !offCtx) return;

      const idx = Math.min(Math.max(0, Math.round(frameIdx)), images.length - 1);
      const img = images[idx];
      if (!img) return;

      const w = canvas.width;
      const h = canvas.height;

      // Offscreen'e çiz (double buffering)
      offCtx.fillStyle = "#020202";
      offCtx.fillRect(0, 0, w, h);

      const imgAspect    = img.naturalWidth  / img.naturalHeight;
      const canvasAspect = w / h;
      let dw: number, dh: number, dx: number, dy: number;

      if (imgAspect > canvasAspect) {
        dh = h;
        dw = dh * imgAspect;
        dx = (w - dw) / 2;
        dy = 0;
      } else {
        dw = w;
        dh = dw / imgAspect;
        dx = 0;
        dy = (h - dh) / 2;
      }

      offCtx.drawImage(img, dx, dy, dw, dh);

      // Tek seferde ekrana kopyala
      ctx.drawImage(offscreen, 0, 0);
      currentFrameRef.current = frameIdx;
    },
    [images]
  );

  // ─── Kare animasyonu (RAF tabanlı, smooth) ────────────────────────
  const animateToFrame = useCallback(
    (targetFrame: number) => {
      if (animRafRef.current) cancelAnimationFrame(animRafRef.current);

      const startFrame = currentFrameRef.current;
      const diff = targetFrame - startFrame;
      if (Math.abs(diff) < 0.5) return;

      const duration  = 500;
      const startTime = performance.now();

      const step = (now: number) => {
        const t      = Math.min(1, (now - startTime) / duration);
        // ease-out cubic — başta hızlı, sonda yavaşlar
        const eased  = 1 - Math.pow(1 - t, 3);
        drawFrame(startFrame + diff * eased);
        if (t < 1) animRafRef.current = requestAnimationFrame(step);
      };

      animRafRef.current = requestAnimationFrame(step);
    },
    [drawFrame]
  );

  // ─── Section scroll pozisyonu ─────────────────────────────────────
  const scrollToSection = useCallback((idx: number) => {
    if (!containerRef.current) return;
    const containerTop = containerRef.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top:      containerTop + idx * window.innerHeight,
      behavior: "smooth",
    });
  }, []);

  // ─── Section geçişi ───────────────────────────────────────────────
  const goToSection = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, idx));
      if (clamped === activeSectionRef.current) return;
      activeSectionRef.current = clamped;
      setActiveSection(clamped);
      scrollToSection(clamped);
      animateToFrame(SECTION_FRAMES[clamped]);
    },
    [scrollToSection, animateToFrame]
  );

  // ─── İlk render + resize ──────────────────────────────────────────
  useEffect(() => {
    resizeCanvas();
  }, [resizeCanvas]);

  useEffect(() => {
    if (isLoaded && images.length > 0) {
      resizeCanvas();
      drawFrame(SECTION_FRAMES[0]);
    }
  }, [isLoaded, images, drawFrame, resizeCanvas]);

  // ─── Wheel ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    let wheelAccum = 0;
    let wheelTimer: ReturnType<typeof setTimeout> | null = null;

    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const isActive = rect.top <= 2 && rect.bottom > window.innerHeight - 2;
      if (!isActive) return;

      e.preventDefault();

      // Accumulate wheel delta to debounce trackpad micro-scrolls
      wheelAccum += e.deltaY;
      if (wheelTimer) clearTimeout(wheelTimer);

      wheelTimer = setTimeout(() => {
        if (Math.abs(wheelAccum) < 20) { wheelAccum = 0; return; }
        const direction = wheelAccum > 0 ? 1 : -1;
        wheelAccum = 0;

        const current = activeSectionRef.current;

        if (direction > 0 && current >= SECTION_COUNT - 1) {
          if (!isTransitioningRef.current) {
            isTransitioningRef.current = true;
            const containerTop = containerRef.current!.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: containerTop + SECTION_COUNT * window.innerHeight, behavior: "smooth" });
            setTimeout(() => { isTransitioningRef.current = false; }, TRANSITION_DURATION);
          }
          return;
        }
        if (direction < 0 && current <= 0) {
          if (!isTransitioningRef.current) {
            isTransitioningRef.current = true;
            const containerTop = containerRef.current!.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: containerTop, behavior: "smooth" });
            setTimeout(() => { isTransitioningRef.current = false; }, TRANSITION_DURATION);
          }
          return;
        }

        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;
        goToSection(current + direction);
        setTimeout(() => { isTransitioningRef.current = false; }, TRANSITION_DURATION);
      }, 50);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", handleWheel);
      if (wheelTimer) clearTimeout(wheelTimer);
    };
  }, [isLoaded, goToSection]);

  // ─── Touch ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => { touchStartY = e.touches[0].clientY; };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (!(rect.top <= 2 && rect.bottom > window.innerHeight - 2)) return;

      const deltaY = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) < 40) return;

      const direction = deltaY > 0 ? 1 : -1;
      const current   = activeSectionRef.current;
      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      if (direction > 0 && current >= SECTION_COUNT - 1) {
        const containerTop = containerRef.current.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: containerTop + SECTION_COUNT * window.innerHeight, behavior: "smooth" });
      } else if (direction < 0 && current <= 0) {
        const containerTop = containerRef.current.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: containerTop, behavior: "smooth" });
      } else {
        goToSection(current + direction);
      }

      setTimeout(() => { isTransitioningRef.current = false; }, TRANSITION_DURATION);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend",   handleTouchEnd,   { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend",   handleTouchEnd);
    };
  }, [isLoaded, goToSection]);

  // ─── Scrollbar sync ───────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isTransitioningRef.current) return;
      const containerTop = containerRef.current.offsetTop;
      const scrolled     = window.scrollY - containerTop;
      const sectionIdx   = Math.round(scrolled / window.innerHeight);
      const clamped      = Math.max(0, Math.min(SECTION_COUNT - 1, sectionIdx));

      if (clamped !== activeSectionRef.current) {
        activeSectionRef.current = clamped;
        setActiveSection(clamped);
        drawFrame(SECTION_FRAMES[clamped]);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [drawFrame]);

  // ─── Resize ───────────────────────────────────────────────────────
  useEffect(() => {
    const handleResize = () => {
      resizeCanvas();
      drawFrame(currentFrameRef.current);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [resizeCanvas, drawFrame]);

  const section = SECTIONS[activeSection];

  return (
    <>
      <LoadingScreen progress={loadProgress} isLoaded={isLoaded} />

      <div
        ref={containerRef}
        className="relative"
        style={{ height: `${SECTION_COUNT * 100}vh` }}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ background: "#020202" }}
          />

          {/* Alt gradient */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#020202] to-transparent pointer-events-none" />

          {/* Section metni */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
              animate={{ opacity: 1, y: 0,  filter: "blur(0px)"  }}
              exit={{    opacity: 0, y: -16, filter: "blur(8px)"  }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-end pb-24 px-6 text-center pointer-events-none"
            >
              <div className="max-w-3xl w-full">
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-4 leading-none">
                  {section.title}
                </h2>

                <p className="text-lg md:text-xl text-white/55 font-light tracking-wide mb-8">
                  {section.subtitle}
                </p>

                {/* CTA butonu */}
                {section.cta && (
                  <div className="pointer-events-auto flex justify-center mb-8">
                    <Link
                      href={section.cta.href}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all"
                      style={{
                        background: section.color,
                        color: section.color === "#00D4AA" ? "#000" : "#fff",
                      }}
                    >
                      {section.cta.label}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                )}

                {/* Nokta göstergesi */}
                <div className="flex items-center justify-center gap-2">
                  {SECTIONS.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        width:   i === activeSection ? 24 : 6,
                        opacity: i === activeSection ? 1  : 0.3,
                      }}
                      transition={{ duration: 0.3 }}
                      className="h-1.5 rounded-full"
                      style={{ background: i === activeSection ? section.color : "white" }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Scroll göstergesi */}
          <motion.div
            className="absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none"
            animate={{ opacity: [0.35, 0.9, 0.35], y: [0, 6, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-white/35 text-[10px] tracking-widest uppercase">
              {activeSection === SECTION_COUNT - 1 ? "Kaydır" : "Kaydır"}
            </span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-white/40 to-transparent" />
          </motion.div>
        </div>
      </div>
    </>
  );
}
