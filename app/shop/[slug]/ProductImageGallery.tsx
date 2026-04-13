"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";

const ZOOM       = 2.8;   // büyütme katsayısı
const LENS_SIZE  = 150;   // mercek çapı (px)

interface ZoomPos { x: number; y: number; lensX: number; lensY: number }

export function ProductImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active,  setActive]  = useState(0);
  const [zoomPos, setZoomPos] = useState<ZoomPos | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse hareketi → mercek konumunu hesapla
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // % konum — arka plan için
    const pctX = ((e.clientX - rect.left)  / rect.width)  * 100;
    const pctY = ((e.clientY - rect.top)   / rect.height) * 100;

    // Mercek DOM konumu — container içinde merkezleme
    const lensX = e.clientX - rect.left - LENS_SIZE / 2;
    const lensY = e.clientY - rect.top  - LENS_SIZE / 2;

    setZoomPos({
      x:     Math.max(0, Math.min(100, pctX)),
      y:     Math.max(0, Math.min(100, pctY)),
      lensX: Math.max(0, Math.min(rect.width  - LENS_SIZE, lensX)),
      lensY: Math.max(0, Math.min(rect.height - LENS_SIZE, lensY)),
    });
  }, []);

  const handleMouseLeave = useCallback(() => setZoomPos(null), []);

  if (images.length === 0) {
    return (
      <div className="h-96 bg-[#020202] rounded-2xl border border-white/10 flex items-center justify-center">
        <span className="text-white/20 text-sm">Görsel yok</span>
      </div>
    );
  }

  const activeImage = images[active];

  return (
    <div className="flex gap-3">
      {/* Thumbnails — sol dikey şerit */}
      {images.length > 1 && (
        <div className="flex flex-col gap-2 flex-shrink-0">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative w-[64px] h-[64px] rounded-xl overflow-hidden border-2 transition-all bg-white flex-shrink-0 ${
                active === i
                  ? "border-[#FF6B35] shadow-[0_0_12px_#FF6B3540]"
                  : "border-white/10 hover:border-white/30 opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img}
                alt={`${name} — ${i + 1}`}
                fill
                className="object-contain p-1.5"
              />
              {active === i && (
                <div className="absolute inset-0 ring-2 ring-inset ring-[#FF6B35]/30 rounded-xl pointer-events-none" />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Ana görsel + büyüteç */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative flex-1 h-96 bg-white rounded-2xl overflow-hidden border border-white/10 select-none"
        style={{ cursor: zoomPos ? "crosshair" : "default" }}
      >
        {/* Temel görsel */}
        <Image
          src={activeImage}
          alt={`${name} — ana görsel`}
          fill
          className="object-contain p-8 pointer-events-none"
          priority
        />

        {/* Büyüteç mercek */}
        {zoomPos && (
          <div
            className="absolute rounded-full border-2 border-[#FF6B35]/60 shadow-[0_0_0_1px_rgba(255,107,53,0.2),0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden pointer-events-none z-20"
            style={{
              width:  LENS_SIZE,
              height: LENS_SIZE,
              left:   zoomPos.lensX,
              top:    zoomPos.lensY,
              backgroundImage:    `url(${activeImage})`,
              backgroundSize:     `${ZOOM * 100}%`,
              backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
              backgroundRepeat:   "no-repeat",
              backgroundColor:    "#ffffff",
            }}
          />
        )}

        {/* Görsel sıra sayacı */}
        {images.length > 1 && !zoomPos && (
          <span className="absolute bottom-3 right-3 text-[10px] text-white/30 bg-black/40 px-2 py-0.5 rounded-full pointer-events-none">
            {active + 1} / {images.length}
          </span>
        )}

        {/* Zoom ipucu — hover olmadığında */}
        {!zoomPos && (
          <span className="absolute bottom-3 left-3 text-[10px] text-white/20 pointer-events-none select-none">
            🔍 Büyütmek için üzerine gelin
          </span>
        )}
      </div>
    </div>
  );
}
