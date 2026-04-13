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
        <div className="mb-8 text-center">
          <div className="w-8 h-0.5 bg-[#FF6B35] mx-auto mb-4" />
          <h3 className="text-xl md:text-2xl font-black tracking-tighter text-white">
            {section.title}
          </h3>
        </div>
      )}
      <div className={`grid ${cols} gap-4`}>
        {section.items.map((item, i) => (
          <div
            key={i}
            className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden hover:border-[#FF6B35]/30 transition-colors group"
          >
            {item.image && (
              <div className="relative h-44 bg-[#020202] overflow-hidden">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020202]/60 to-transparent" />
              </div>
            )}
            <div className="p-5">
              <h4 className="text-white font-bold text-sm mb-2">{item.title}</h4>
              <p className="text-white/50 text-xs leading-relaxed">{item.description}</p>
            </div>
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
    <div className="border border-white/10 rounded-3xl overflow-hidden bg-white/[0.02]">
      <div className={`flex flex-col ${imgLeft ? "lg:flex-row" : "lg:flex-row-reverse"} min-h-[340px]`}>
        {/* Görsel */}
        <div className="relative lg:w-[45%] min-h-[240px] lg:min-h-0 flex-shrink-0">
          {section.image ? (
            <>
              <Image src={section.image} alt={section.title} fill className="object-cover" />
              <div className={`absolute inset-0 ${imgLeft
                ? "bg-gradient-to-r from-transparent to-[#020202]/60"
                : "bg-gradient-to-l from-transparent to-[#020202]/60"}`} />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF6B35]/10 to-[#00D4AA]/10 flex items-center justify-center">
              <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/20 flex items-center justify-center">
                <div className="w-6 h-6 rounded-full bg-[#FF6B35]/60" />
              </div>
            </div>
          )}
        </div>

        {/* İçerik */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
          <div className="w-8 h-0.5 bg-[#FF6B35] mb-4" />
          <h3 className="text-xl md:text-2xl font-black tracking-tighter text-white mb-6">
            {section.title}
          </h3>
          <div className="space-y-3">
            {section.items.map((item, i) => (
              <div
                key={i}
                className="border border-white/10 rounded-xl px-4 py-3 bg-white/[0.02] hover:border-[#FF6B35]/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={15} className="text-[#FF6B35] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-white text-sm font-semibold leading-tight">{item.title}</p>
                    {item.description && (
                      <p className="text-white/45 text-xs mt-0.5 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
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
