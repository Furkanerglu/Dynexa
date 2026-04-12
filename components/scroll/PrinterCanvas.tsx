"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useImagePreloader } from "./useImagePreloader";
import { LoadingScreen } from "./LoadingScreen";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// ─── Section tanımları ────────────────────────────────────────────────────────
const SECTIONS = [
  {
    title: "DYNEXA'YA HOŞ GELDİNİZ",
    subtitle: "Türkiye'nin en kapsamlı 3D baskı platformu — tek adreste her şey",
    color: "#FF6B35",
    progressStart: 0.00,
    progressEnd:   0.20,
    cta: null,
  },
  {
    title: "PARÇANIZI BİZ BASIYORUZ",
    subtitle: "STL dosyanızı yükleyin, malzeme ve kaliteyi seçin — gerisini biz halledelim",
    color: "#FF6B35",
    progressStart: 0.20,
    progressEnd:   0.40,
    cta: { label: "Baskı Talebi Oluştur", href: "/services/print" },
  },
  {
    title: "HAZIR PARÇALAR, ANINDA TESLİM",
    subtitle: "Stokta yüzlerce hazır 3D baskı parça — sipariş ver, kapında olsun",
    color: "#00D4AA",
    progressStart: 0.40,
    progressEnd:   0.60,
    cta: { label: "Mağazaya Gözat", href: "/shop" },
  },
  {
    title: "TEKNİK SERVİS YANINDA",
    subtitle: "Yazıcınız mı bozuldu? Uzman ekibimiz onarım ve bakımda her zaman hazır",
    color: "#00D4AA",
    progressStart: 0.60,
    progressEnd:   0.80,
    cta: { label: "Servis Talebi Oluştur", href: "/services/technical" },
  },
  {
    title: "HER ŞEY DYNEXA'DA",
    subtitle: "Filament, yedek parça, baskı ve servis — 3D baskının tek durağı",
    color: "#FF6B35",
    progressStart: 0.80,
    progressEnd:   1.00,
    cta: { label: "Platformu Keşfet", href: "/shop" },
  },
];

const SECTION_COUNT  = SECTIONS.length;
const TOTAL_FRAMES   = 40;
// Sayfa kaç vh yüksekliğinde (scroll mesafesi)
const SCROLL_PAGES   = 6;

// Progress değerine göre hangi section aktif?
function getSectionIndex(progress: number): number {
  for (let i = SECTION_COUNT - 1; i >= 0; i--) {
    if (progress >= SECTIONS[i].progressStart) return i;
  }
  return 0;
}

// Section içindeki lokal ilerleme (0-1) — text fade için
function getSectionProgress(progress: number, idx: number): number {
  const s = SECTIONS[idx];
  return Math.min(1, Math.max(0, (progress - s.progressStart) / (s.progressEnd - s.progressStart)));
}

export function PrinterCanvas() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);
  const offscreenRef  = useRef<HTMLCanvasElement | null>(null);

  const { images, progress: loadProgress, isLoaded } = useImagePreloader(TOTAL_FRAMES);

  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef(0);

  // Scroll-driven frame state (RAF loop)
  const targetFrameRef  = useRef(0);
  const currentFrameRef = useRef(0);
  const rafRef          = useRef<number>(0);
  const isRafRunning    = useRef(false);

  // ─── Canvas resize (sadece mount + resize) ───────────────────────
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

  // ─── Tek frame çizimi (boyut değiştirmeden) ──────────────────────
  const drawFrame = useCallback(
    (frameIdx: number) => {
      const canvas    = canvasRef.current;
      const offscreen = offscreenRef.current;
      if (!canvas || !offscreen || images.length === 0) return;

      const ctx    = canvas.getContext("2d",    { alpha: false });
      const offCtx = offscreen.getContext("2d", { alpha: false });
      if (!ctx || !offCtx) return;

      const idx = Math.min(Math.max(0, Math.round(frameIdx)), images.length - 1);
      const img = images[idx];
      if (!img) return;

      const w = canvas.width;
      const h = canvas.height;

      offCtx.fillStyle = "#020202";
      offCtx.fillRect(0, 0, w, h);

      const imgAspect    = (img.naturalWidth  || img.width)  / (img.naturalHeight || img.height);
      const canvasAspect = w / h;
      let dw: number, dh: number, dx: number, dy: number;

      if (imgAspect > canvasAspect) {
        dh = h; dw = dh * imgAspect;
        dx = (w - dw) / 2; dy = 0;
      } else {
        dw = w; dh = dw / imgAspect;
        dx = 0; dy = (h - dh) / 2;
      }

      offCtx.drawImage(img, dx, dy, dw, dh);
      ctx.drawImage(offscreen, 0, 0);
      currentFrameRef.current = frameIdx;
    },
    [images]
  );

  // ─── RAF döngüsü: target'a doğru lerp ────────────────────────────
  const startRaf = useCallback(() => {
    if (isRafRunning.current) return;
    isRafRunning.current = true;

    const loop = () => {
      const diff = targetFrameRef.current - currentFrameRef.current;

      if (Math.abs(diff) < 0.05) {
        // Hedefe ulaştık, tam frame'e snap et
        drawFrame(targetFrameRef.current);
        isRafRunning.current = false;
        return;
      }

      // Hızlı yaklaşım — lerp faktörü 0.18 (çok hızlı hissettirirse 0.12'ye düşür)
      const next = currentFrameRef.current + diff * 0.18;
      drawFrame(next);
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, [drawFrame]);

  // ─── Scroll handler ───────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerTop    = container.offsetTop;
      const containerHeight = container.offsetHeight;
      const scrollRange     = containerHeight - window.innerHeight;
      const scrolled        = Math.max(0, window.scrollY - containerTop);
      const progress        = Math.min(1, scrolled / scrollRange);

      // Hedef frame
      targetFrameRef.current = progress * (TOTAL_FRAMES - 1);

      // Section güncelle
      const secIdx = getSectionIndex(progress);
      if (secIdx !== activeSectionRef.current) {
        activeSectionRef.current = secIdx;
        setActiveSection(secIdx);
      }

      startRaf();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // İlk render: scroll pozisyona göre başlat
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLoaded, startRaf]);

  // ─── Mount / resize ───────────────────────────────────────────────
  useEffect(() => {
    resizeCanvas();
  }, [resizeCanvas]);

  useEffect(() => {
    if (isLoaded && images.length > 0) {
      resizeCanvas();
      drawFrame(0);
    }
  }, [isLoaded, images, drawFrame, resizeCanvas]);

  useEffect(() => {
    const onResize = () => {
      resizeCanvas();
      drawFrame(currentFrameRef.current);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [resizeCanvas, drawFrame]);

  const section = SECTIONS[activeSection];

  return (
    <>
      <LoadingScreen progress={loadProgress} isLoaded={isLoaded} />

      {/* Scroll alanı */}
      <div
        ref={containerRef}
        className="relative"
        style={{ height: `${SCROLL_PAGES * 100}vh` }}
      >
        {/* Sticky canvas */}
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
              initial={{ opacity: 0, y: 28, filter: "blur(14px)" }}
              animate={{ opacity: 1, y: 0,  filter: "blur(0px)"  }}
              exit={{    opacity: 0, y: -18, filter: "blur(10px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
                      className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 active:scale-95"
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
            animate={{ opacity: [0.35, 0.85, 0.35], y: [0, 6, 0] }}
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
