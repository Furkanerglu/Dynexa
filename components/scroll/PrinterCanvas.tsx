"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useImagePreloader } from "./useImagePreloader";
import { LoadingScreen } from "./LoadingScreen";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const SECTIONS = [
  {
    title: "DYNEXA'YA HOŞ GELDİNİZ",
    subtitle: "Türkiye'nin en kapsamlı 3D baskı platformu — tek adreste her şey",
    color: "#FF6B35",
    start: 0.00, end: 0.20,
    cta: null,
  },
  {
    title: "PARÇANIZI BİZ BASIYORUZ",
    subtitle: "STL dosyanızı yükleyin, malzeme ve kaliteyi seçin — gerisini biz halledelim",
    color: "#FF6B35",
    start: 0.20, end: 0.40,
    cta: { label: "Baskı Talebi Oluştur", href: "/services/print" },
  },
  {
    title: "3D BASKI ÜRÜNLER",
    subtitle: "Figürler, dekorasyon, koleksiyon ve fonksiyonel ürünler — hepsi 3D baskı ile",
    color: "#00D4AA",
    start: 0.40, end: 0.60,
    cta: { label: "Ürünleri İncele", href: "/shop" },
  },
  {
    title: "TEKNİK SERVİS YANINDA",
    subtitle: "Yazıcınız mı bozuldu? Uzman ekibimiz onarım ve bakımda her zaman hazır",
    color: "#00D4AA",
    start: 0.60, end: 0.80,
    cta: { label: "Servis Talebi Oluştur", href: "/services/technical" },
  },
  {
    title: "HER ŞEY DYNEXA'DA",
    subtitle: "Filament, yedek parça, baskı ve servis — 3D baskının tek durağı",
    color: "#FF6B35",
    start: 0.80, end: 1.00,
    cta: { label: "Platformu Keşfet", href: "/shop" },
  },
] as const;

const SECTION_COUNT = SECTIONS.length;
const TOTAL_FRAMES  = 40;
const SCROLL_PAGES  = 6;   // container yüksekliği (vh)

function getSectionIndex(p: number) {
  for (let i = SECTION_COUNT - 1; i >= 0; i--)
    if (p >= SECTIONS[i].start) return i;
  return 0;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function PrinterCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef    = useRef<HTMLCanvasElement>(null);

  const { images, progress: loadProgress, isLoaded } = useImagePreloader(TOTAL_FRAMES);

  // Context bir kez cache'le
  const ctxRef          = useRef<CanvasRenderingContext2D | null>(null);
  const lastFrameRef    = useRef(-1);   // son çizilen integer frame
  const tickingRef      = useRef(false); // rAF throttle flag
  const progressRef     = useRef(0);    // son scroll progress

  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef(0);

  // ─── Canvas init & resize ─────────────────────────────────────────
  const initCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (canvas.width === w && canvas.height === h) return;
    canvas.width  = w;
    canvas.height = h;
    // Context'i yeniden al (resize sonrası invalidate olur)
    ctxRef.current = canvas.getContext("2d", { alpha: false }) ?? null;
    if (ctxRef.current) ctxRef.current.imageSmoothingQuality = "low";
    lastFrameRef.current = -1; // zorla yeniden çiz
  }, []);

  // ─── Tek frame çizimi ─────────────────────────────────────────────
  const drawFrame = useCallback(
    (frameIdx: number) => {
      const intIdx = Math.min(Math.max(0, Math.round(frameIdx)), TOTAL_FRAMES - 1);
      if (intIdx === lastFrameRef.current) return; // aynı frame, atla
      lastFrameRef.current = intIdx;

      const ctx = ctxRef.current;
      const img = images[intIdx];
      if (!ctx || !img) return;

      const w = ctx.canvas.width;
      const h = ctx.canvas.height;

      ctx.fillStyle = "#020202";
      ctx.fillRect(0, 0, w, h);

      const iw = img.naturalWidth  || img.width;
      const ih = img.naturalHeight || img.height;
      const imgAsp = iw / ih;
      const cnvAsp = w  / h;

      let dw: number, dh: number, dx: number, dy: number;
      if (imgAsp > cnvAsp) {
        dh = h; dw = dh * imgAsp; dx = (w - dw) / 2; dy = 0;
      } else {
        dw = w; dh = dw / imgAsp; dx = 0; dy = (h - dh) / 2;
      }

      ctx.drawImage(img, dx, dy, dw, dh);
    },
    [images]
  );

  // ─── rAF-throttled scroll ─────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    const onScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const scrollRange = container.offsetHeight - window.innerHeight;
      const scrolled    = Math.max(0, window.scrollY - container.offsetTop);
      const p           = Math.min(1, scrolled / scrollRange);
      progressRef.current = p;

      // Section güncelle (React state — throttle'a gerek yok, seyrek değişir)
      const sec = getSectionIndex(p);
      if (sec !== activeSectionRef.current) {
        activeSectionRef.current = sec;
        setActiveSection(sec);
      }

      // rAF throttle: frame başına en fazla 1 draw
      if (!tickingRef.current) {
        tickingRef.current = true;
        requestAnimationFrame(() => {
          drawFrame(progressRef.current * (TOTAL_FRAMES - 1));
          tickingRef.current = false;
        });
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // initial draw
    return () => window.removeEventListener("scroll", onScroll);
  }, [isLoaded, drawFrame]);

  // ─── Mount & images ready ─────────────────────────────────────────
  useEffect(() => { initCanvas(); }, [initCanvas]);

  useEffect(() => {
    if (!isLoaded || images.length === 0) return;
    initCanvas();
    lastFrameRef.current = -1;
    drawFrame(0);
  }, [isLoaded, images, initCanvas, drawFrame]);

  // ─── Resize ───────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      initCanvas();
      drawFrame(progressRef.current * (TOTAL_FRAMES - 1));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [initCanvas, drawFrame]);

  const section = SECTIONS[activeSection];

  return (
    <>
      <LoadingScreen progress={loadProgress} isLoaded={isLoaded} />

      <div
        ref={containerRef}
        className="relative"
        style={{ height: `${SCROLL_PAGES * 100}vh` }}
      >
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ background: "#020202" }}
          />

          {/* Alt gradient */}
          <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-[#020202] to-transparent pointer-events-none" />

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
                {section.cta && (
                  <div className="pointer-events-auto flex justify-center mb-8">
                    <Link
                      href={section.cta.href}
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 active:scale-95 transition-all"
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
                <div className="flex items-center justify-center gap-2">
                  {SECTIONS.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ width: i === activeSection ? 24 : 6, opacity: i === activeSection ? 1 : 0.3 }}
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
            animate={{ opacity: [0.3, 0.8, 0.3], y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-white/35 text-[10px] tracking-widest uppercase">Kaydır</span>
            <div className="w-[1px] h-7 bg-gradient-to-b from-white/40 to-transparent" />
          </motion.div>
        </div>
      </div>
    </>
  );
}
