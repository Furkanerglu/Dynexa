"use client";

import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

// ─── Tipler ───────────────────────────────────────────────────────────────────

export type BannerSection = {
  type: "banner";
  title: string;
  description: string;
  image?: string;
};

export type CardsSection = {
  type: "cards";
  title: string;
  items: Array<{ title: string; description: string; image?: string }>;
};

export type SplitSection = {
  type: "split";
  title: string;
  image?: string;
  imagePosition: "left" | "right";
  items: Array<{ title: string; description: string }>;
};

export type FeatureSection = BannerSection | CardsSection | SplitSection;

// ─── Banner ───────────────────────────────────────────────────────────────────

function BannerBlock({ section }: { section: BannerSection }) {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden min-h-[280px] flex items-center border border-white/10">
      {section.image && (
        <div className="absolute inset-0">
          <Image src={section.image} alt={section.title} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020202]/95 via-[#020202]/75 to-[#020202]/30" />
        </div>
      )}
      {!section.image && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/8 via-[#020202] to-[#00D4AA]/5" />
      )}
      <div className="relative z-10 p-10 md:p-14 max-w-2xl">
        <div className="w-10 h-0.5 bg-[#FF6B35] mb-5" />
        <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-white mb-4 leading-tight">
          {section.title}
        </h3>
        <p className="text-white/60 text-sm md:text-base leading-relaxed">
          {section.description}
        </p>
      </div>
    </div>
  );
}

// ─── Kart Izgara ─────────────────────────────────────────────────────────────

function CardsBlock({ section }: { section: CardsSection }) {
  const count = section.items.length;
  const cols =
    count === 1 ? "grid-cols-1" :
    count === 2 ? "grid-cols-1 sm:grid-cols-2" :
    count === 4 ? "grid-cols-2 sm:grid-cols-4" :
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div>
      {section.title && (
        <div className="mb-10">
          <div className="w-8 h-0.5 bg-[#FF6B35] mb-4" />
          <h3 className="text-xl md:text-2xl font-black tracking-tighter text-white">
            {section.title}
          </h3>
        </div>
      )}
      <div className={`grid ${cols} gap-8`}>
        {section.items.map((item, i) => (
          <div key={i} className="group">
            {item.image && (
              <div className="relative h-48 rounded-2xl overflow-hidden mb-5">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020202]/50 to-transparent" />
              </div>
            )}
            <div className="w-5 h-0.5 bg-[#FF6B35]/60 mb-3" />
            <h4 className="text-white font-bold text-sm mb-2">{item.title}</h4>
            <p className="text-white/50 text-xs leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bölünmüş Düzen ──────────────────────────────────────────────────────────

function SplitBlock({ section }: { section: SplitSection }) {
  const imgLeft = section.imagePosition !== "right";

  return (
    <div className={`flex flex-col ${imgLeft ? "lg:flex-row" : "lg:flex-row-reverse"} gap-10 lg:gap-16 items-center`}>
      {/* Görsel */}
      <div className="relative lg:w-[48%] w-full min-h-[280px] lg:min-h-[360px] flex-shrink-0 rounded-2xl overflow-hidden">
        {section.image ? (
          <>
            <Image src={section.image} alt={section.title} fill className="object-cover" />
            <div className={`absolute inset-0 ${imgLeft
              ? "bg-gradient-to-r from-transparent to-[#020202]/40"
              : "bg-gradient-to-l from-transparent to-[#020202]/40"}`} />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FF6B35]/10 to-[#00D4AA]/10 flex items-center justify-center min-h-[280px]">
            <div className="w-12 h-12 rounded-full bg-[#FF6B35]/30" />
          </div>
        )}
      </div>

      {/* İçerik */}
      <div className="flex-1">
        <div className="w-8 h-0.5 bg-[#FF6B35] mb-5" />
        <h3 className="text-xl md:text-2xl font-black tracking-tighter text-white mb-8">
          {section.title}
        </h3>
        <div className="space-y-5">
          {section.items.map((item, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="mt-1 flex-shrink-0">
                <CheckCircle2 size={16} className="text-[#FF6B35]" />
              </div>
              <div>
                <p className="text-white text-sm font-semibold leading-snug">{item.title}</p>
                {item.description && (
                  <p className="text-white/45 text-xs mt-1 leading-relaxed">{item.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Ana Component ────────────────────────────────────────────────────────────

export function ProductFeatures({ sections }: { sections: FeatureSection[] }) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="mt-20 space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-1 h-6 bg-[#FF6B35] rounded-full" />
        <h2 className="text-xl font-bold text-white">Ürün Özellikleri</h2>
      </div>
      {sections.map((section, i) => (
        <div key={i}>
          {section.type === "banner" && <BannerBlock section={section} />}
          {section.type === "cards"  && <CardsBlock  section={section} />}
          {section.type === "split"  && <SplitBlock  section={section} />}
        </div>
      ))}
    </div>
  );
}
