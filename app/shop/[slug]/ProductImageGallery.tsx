"use client";

import { useState } from "react";
import Image from "next/image";

export function ProductImageGallery({ images, name }: { images: string[]; name: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="h-96 bg-[#020202] rounded-2xl border border-white/10 flex items-center justify-center">
        <span className="text-white/20 text-sm">Görsel yok</span>
      </div>
    );
  }

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
              className={`relative w-[64px] h-[64px] rounded-xl overflow-hidden border-2 transition-all bg-[#020202] flex-shrink-0 ${
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

      {/* Ana görsel */}
      <div className="relative flex-1 h-96 bg-[#020202] rounded-2xl overflow-hidden border border-white/10">
        <Image
          src={images[active]}
          alt={`${name} — ana görsel`}
          fill
          className="object-contain p-8"
          priority
        />
        {/* Görsel sıra sayacı */}
        {images.length > 1 && (
          <span className="absolute bottom-3 right-3 text-[10px] text-white/30 bg-black/40 px-2 py-0.5 rounded-full">
            {active + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}
