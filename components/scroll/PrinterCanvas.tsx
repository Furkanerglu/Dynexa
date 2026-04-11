"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useImagePreloader } from "./useImagePreloader";
import { LoadingScreen } from "./LoadingScreen";

const SECTIONS = [
  {
    title: "DYNEXA'YA HOŞ GELDİNİZ",
    subtitle: "Türkiye'nin en kapsamlı 3D baskı platformu — tek adreste her şey",
    color: "#FF6B35",
    frameStart: 0,
    frameEnd: 7,
  },
  {
    title: "PARÇANIZI BİZ BASIYORUZ",
    subtitle: "STL dosyanızı yükleyin, malzeme ve kaliteyi seçin — gerisini biz halledelim",
    color: "#FF6B35",
    frameStart: 8,
    frameEnd: 15,
  },
  {
    title: "HAZIR PARÇALAR, ANINDA TESLİM",
    subtitle: "Stokta yüzlerce hazır 3D baskı parça — sipariş ver, kapında olsun",
    color: "#00D4AA",
    frameStart: 16,
    frameEnd: 23,
  },
  {
    title: "TEKNİK SERVİS YANINDA",
    subtitle: "Yazıcınız mı bozuldu? Uzman ekibimiz onarım ve bakımda her zaman hazır",
    color: "#00D4AA",
    frameStart: 24,
    frameEnd: 31,
  },
  {
    title: "HER ŞEY DYNEXA'DA",
    subtitle: "Filament, yedek parça, baskı ve servis — 3D baskının tek durağı",
    color: "#FF6B35",
    frameStart: 32,
    frameEnd: 39,
  },
];

const SECTION_COUNT = SECTIONS.length;
// Orta kare her section için
const SECTION_FRAMES = SECTIONS.map((s) =>
  Math.round((s.frameStart + s.frameEnd) / 2)
);
// Geçiş süresi (ms) — wheel'i tekrar kabul etmeden önce bekleme
const TRANSITION_DURATION = 850;

export function PrinterCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { images, progress: loadProgress, isLoaded } = useImagePreloader(40);

  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef(0);
  const isTransitioningRef = useRef(false);
  const currentFrameRef = useRef(0);
  const animRafRef = useRef<number>(0);

  // ─── Canvas çizim ────────────────────────────────────────────────
  const drawFrame = useCallback(
    (frameIdx: number) => {
      const canvas = canvasRef.current;
      if (!canvas || images.length === 0) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const img = images[Math.min(Math.max(0, Math.round(frameIdx)), images.length - 1)];
      if (!img) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      ctx.fillStyle = "#020202";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const imgAspect = img.width / img.height;
      const canvasAspect = canvas.width / canvas.height;
      let dw: number, dh: number, dx: number, dy: number;

      if (imgAspect > canvasAspect) {
        dh = canvas.height;
        dw = dh * imgAspect;
        dx = (canvas.width - dw) / 2;
        dy = 0;
      } else {
        dw = canvas.width;
        dh = dw / imgAspect;
        dx = 0;
        dy = (canvas.height - dh) / 2;
      }

      ctx.drawImage(img, dx, dy, dw, dh);
      currentFrameRef.current = frameIdx;
    },
    [images]
  );

  // ─── Kare animasyonu ──────────────────────────────────────────────
  const animateToFrame = useCallback(
    (targetFrame: number) => {
      if (animRafRef.current) cancelAnimationFrame(animRafRef.current);

      const startFrame = currentFrameRef.current;
      const diff = targetFrame - startFrame;
      if (diff === 0) return;

      const duration = 550;
      const startTime = performance.now();

      const step = (now: number) => {
        const t = Math.min(1, (now - startTime) / duration);
        // ease-in-out cubic
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        drawFrame(startFrame + diff * eased);
        if (t < 1) animRafRef.current = requestAnimationFrame(step);
      };

      animRafRef.current = requestAnimationFrame(step);
    },
    [drawFrame]
  );

  // ─── Section'a scroll konumu ayarla ──────────────────────────────
  const scrollToSection = useCallback((idx: number) => {
    if (!containerRef.current) return;
    const containerTop =
      containerRef.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({
      top: containerTop + idx * window.innerHeight,
      behavior: "smooth",
    });
  }, []);

  // ─── Section geçişi ───────────────────────────────────────────────
  const goToSection = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, idx));
      if (clamped === activeSectionRef.current && !isTransitioningRef.current) return;

      activeSectionRef.current = clamped;
      setActiveSection(clamped);
      scrollToSection(clamped);
      animateToFrame(SECTION_FRAMES[clamped]);
    },
    [scrollToSection, animateToFrame]
  );

  // ─── İlk render ───────────────────────────────────────────────────
  useEffect(() => {
    if (isLoaded && images.length > 0) {
      drawFrame(SECTION_FRAMES[0]);
    }
  }, [isLoaded, images, drawFrame]);

  // ─── Wheel (masaüstü) ─────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    const handleWheel = (e: WheelEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      // Canvas sticky mi? (container içindeyiz ve scroll devam ediyor)
      const isActive = rect.top <= 2 && rect.bottom > window.innerHeight - 2;
      if (!isActive) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      const current = activeSectionRef.current;

      // Son section'dan aşağı gidince → container sonu, normal scroll
      if (direction > 0 && current >= SECTION_COUNT - 1) {
        e.preventDefault();
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true;
          const containerTop =
            containerRef.current.getBoundingClientRect().top + window.scrollY;
          // Container'ın tamamen dışına çık
          window.scrollTo({
            top: containerTop + SECTION_COUNT * window.innerHeight,
            behavior: "smooth",
          });
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, TRANSITION_DURATION);
        }
        return;
      }

      // İlk section'dan yukarı gidince → container başı
      if (direction < 0 && current <= 0) {
        e.preventDefault();
        if (!isTransitioningRef.current) {
          isTransitioningRef.current = true;
          const containerTop =
            containerRef.current.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: containerTop, behavior: "smooth" });
          setTimeout(() => {
            isTransitioningRef.current = false;
          }, TRANSITION_DURATION);
        }
        return;
      }

      // Normal section geçişi
      e.preventDefault();
      if (isTransitioningRef.current) return;

      isTransitioningRef.current = true;
      goToSection(current + direction);
      setTimeout(() => {
        isTransitioningRef.current = false;
      }, TRANSITION_DURATION);
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isLoaded, goToSection]);

  // ─── Touch (mobil) ────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const isActive = rect.top <= 2 && rect.bottom > window.innerHeight - 2;
      if (!isActive) return;

      const deltaY = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(deltaY) < 30) return; // küçük kaydırmalar yoksay

      const direction = deltaY > 0 ? 1 : -1;
      const current = activeSectionRef.current;

      if (isTransitioningRef.current) return;
      isTransitioningRef.current = true;

      if (direction > 0 && current >= SECTION_COUNT - 1) {
        const containerTop =
          containerRef.current.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({
          top: containerTop + SECTION_COUNT * window.innerHeight,
          behavior: "smooth",
        });
      } else if (direction < 0 && current <= 0) {
        const containerTop =
          containerRef.current.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: containerTop, behavior: "smooth" });
      } else {
        goToSection(current + direction);
      }

      setTimeout(() => {
        isTransitioningRef.current = false;
      }, TRANSITION_DURATION);
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isLoaded, goToSection]);

  // ─── Scrollbar ile sayfada gezilince section senkronize et ────────
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isTransitioningRef.current) return;
      const containerTop = containerRef.current.offsetTop;
      const scrolled = window.scrollY - containerTop;
      const sectionIdx = Math.round(scrolled / window.innerHeight);
      const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, sectionIdx));

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
    const handleResize = () => drawFrame(currentFrameRef.current);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [drawFrame]);

  return (
    <>
      <LoadingScreen progress={loadProgress} isLoaded={isLoaded} />

      {/* 5 section × 100vh — her section bir "sayfa" */}
      <div
        ref={containerRef}
        className="relative"
        style={{ height: `${SECTION_COUNT * 100}vh` }}
      >
        {/* Sticky canvas — section geçişleri boyunca ekranda kalır */}
        <div className="sticky top-0 h-screen w-full overflow-hidden">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ background: "#020202" }}
          />

          {/* Alt gradient — içerikle kaynaşma */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#020202] to-transparent pointer-events-none" />

          {/* Section metni — section değişince animasyonla giriş/çıkış */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 30, filter: "blur(10px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 flex flex-col items-center justify-end pb-20 px-6 text-center pointer-events-none"
            >
              <div className="max-w-3xl">
                <motion.h2 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-4">
                  {SECTIONS[activeSection].title.split("").map((char, ci) => (
                    <span
                      key={ci}
                      style={
                        ci % 3 === 0
                          ? { color: SECTIONS[activeSection].color }
                          : {}
                      }
                    >
                      {char}
                    </span>
                  ))}
                </motion.h2>

                <p className="text-lg md:text-xl text-white/60 font-light tracking-wide">
                  {SECTIONS[activeSection].subtitle}
                </p>

                {/* Nokta göstergesi */}
                <div className="flex items-center justify-center gap-2 mt-8">
                  {SECTIONS.map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        width: i === activeSection ? 24 : 6,
                        opacity: i === activeSection ? 1 : 0.3,
                      }}
                      transition={{ duration: 0.3 }}
                      className="h-1.5 rounded-full"
                      style={{
                        background:
                          i === activeSection
                            ? SECTIONS[activeSection].color
                            : "white",
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Birleşik scroll göstergesi — tüm section'larda görünür */}
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
            animate={{ opacity: [0.4, 1, 0.4], y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={activeSection === SECTION_COUNT - 1 ? "kesfet" : "kaydır"}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25 }}
                className="text-white/40 text-xs tracking-widest uppercase"
              >
                {activeSection === SECTION_COUNT - 1 ? "Keşfet" : "Kaydır"}
              </motion.span>
            </AnimatePresence>

            <div className="relative w-5 h-10 flex items-center justify-center">
              {/* Dikey çizgi */}
              <div className="w-[1px] h-full bg-gradient-to-b from-white/40 to-transparent" />
              {/* Son section'da ok başı */}
              <AnimatePresence>
                {activeSection === SECTION_COUNT - 1 && (
                  <motion.svg
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    width="10"
                    height="6"
                    viewBox="0 0 10 6"
                    fill="none"
                    className="absolute bottom-0 text-white/40"
                  >
                    <path
                      d="M1 1l4 4 4-4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
