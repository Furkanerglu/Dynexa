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

// ─── Banner — tam genişlik ─────────────────────────────────────────────────────

function BannerBlock({ section }: { section: BannerSection }) {
  return (
    <div className="relative w-full min-h-[380px] md:min-h-[480px] flex items-center overflow-hidden">
      {section.image ? (
        <>
          <Image
            src={section.image}
            alt={section.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#020202]/90 via-[#020202]/60 to-[#020202]/20" />
        </>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6B35]/8 via-[#020202] to-[#00D4AA]/5" />
      )}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 w-full">
        <div className="w-12 h-0.5 bg-[#FF6B35] mb-6" />
        <h3 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-5 leading-tight max-w-2xl">
          {section.title}
        </h3>
        <p className="text-white/55 text-sm md:text-base leading-relaxed max-w-xl">
          {section.description}
        </p>
      </div>
    </div>
  );
}

// ─── Kart Izgara — tam genişlik ───────────────────────────────────────────────

function CardsBlock({ section }: { section: CardsSection }) {
  const count = section.items.length;
  const cols =
    count === 1 ? "grid-cols-1 max-w-lg" :
    count === 2 ? "grid-cols-1 sm:grid-cols-2" :
    count === 4 ? "grid-cols-2 sm:grid-cols-4" :
    "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 w-full">
      {section.title && (
        <div className="mb-12">
          <div className="w-8 h-0.5 bg-[#FF6B35] mb-5" />
          <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-white">
            {section.title}
          </h3>
        </div>
      )}
      <div className={`grid ${cols} gap-10`}>
        {section.items.map((item, i) => (
          <div key={i} className="group">
            {item.image && (
              <div className="relative h-52 rounded-2xl overflow-hidden mb-6">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#020202]/40 to-transparent" />
              </div>
            )}
            <div className="w-5 h-0.5 bg-[#FF6B35]/60 mb-3" />
            <h4 className="text-white font-bold text-base mb-2">{item.title}</h4>
            <p className="text-white/50 text-sm leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Bölünmüş Düzen — tam genişlik ───────────────────────────────────────────

function SplitBlock({ section }: { section: SplitSection }) {
  const imgLeft = section.imagePosition !== "right";

  return (
    <div className={`flex flex-col ${imgLeft ? "lg:flex-row" : "lg:flex-row-reverse"} w-full min-h-[440px]`}>
      {/* Görsel — sayfanın yarısını kaplar */}
      <div className="relative w-full lg:w-1/2 min-h-[300px] lg:min-h-0 flex-shrink-0 overflow-hidden">
        {section.image ? (
          <>
            <Image
              src={section.image}
              alt={section.title}
              fill
              className="object-cover"
            />
            <div className={`absolute inset-0 ${imgLeft
              ? "bg-gradient-to-r from-transparent to-[#020202]/50"
              : "bg-gradient-to-l from-transparent to-[#020202]/50"}`}
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#FF6B35]/10 to-[#00D4AA]/10 min-h-[300px]" />
        )}
      </div>

      {/* İçerik — sayfanın diğer yarısı */}
      <div className="w-full lg:w-1/2 flex items-center bg-[#020202]">
        <div className="px-8 md:px-12 lg:px-16 xl:px-20 py-14 w-full max-w-2xl">
          <div className="w-8 h-0.5 bg-[#FF6B35] mb-6" />
          <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-white mb-8">
            {section.title}
          </h3>
          <div className="space-y-6">
            {section.items.map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="mt-0.5 flex-shrink-0">
                  <CheckCircle2 size={17} className="text-[#FF6B35]" />
                </div>
                <div>
                  <p className="text-white text-sm font-semibold leading-snug">{item.title}</p>
                  {item.description && (
                    <p className="text-white/45 text-xs mt-1.5 leading-relaxed">{item.description}</p>
                  )}
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
    <div className="w-full mt-16">
      {sections.map((section, i) => (
        <div key={i} className="w-full">
          {section.type === "banner" && <BannerBlock section={section} />}
          {section.type === "cards"  && <CardsBlock  section={section} />}
          {section.type === "split"  && <SplitBlock  section={section} />}
        </div>
      ))}
    </div>
  );
}
