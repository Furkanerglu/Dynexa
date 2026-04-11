import type { Metadata } from "next";
import { PrinterCanvas } from "@/components/scroll/PrinterCanvas";
import Link from "next/link";
import { ArrowRight, Zap, Package, Layers, Scan, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "DYNEXA — Precision in Every Layer",
  description:
    "3D baskı ekosisteminiz için tek adres. Yedek parçalar, premium filamentler, 3D baskı ve tarama hizmetleri.",
};

const services = [
  {
    icon: Package,
    title: "3D Parça Mağazası",
    description: "Hotend, nozzle, ekstruder, motor ve daha fazlası. Orijinal ve uyumlu parçalar.",
    href: "/shop",
    color: "#FF6B35",
  },
  {
    icon: Layers,
    title: "Filament Shop",
    description: "PLA, PETG, ABS, TPU, CF, PA ve daha fazlası. Premium markaların en iyi filamentleri.",
    href: "/filament",
    color: "#00D4AA",
  },
  {
    icon: Zap,
    title: "Print-on-Demand",
    description: "STL dosyanızı yükleyin, malzeme ve kaliteyi seçin, fiyat teklifi alın.",
    href: "/services/print",
    color: "#FF6B35",
  },
  {
    icon: Scan,
    title: "3D Tarama",
    description: "Fiziksel nesnelerinizi dijital dünyaya taşıyın. Profesyonel 3D tarama hizmeti.",
    href: "/services/scanning",
    color: "#00D4AA",
  },
  {
    icon: Wrench,
    title: "Teknik Servis",
    description: "Yazıcınızda sorun mu var? Uzman ekibimiz onarım ve bakım hizmeti sunar.",
    href: "/services/technical",
    color: "#FF6B35",
  },
];

const stats = [
  { value: "500+", label: "Ürün Çeşidi" },
  { value: "5000+", label: "Mutlu Müşteri" },
  { value: "24h", label: "Hızlı Kargo" },
  { value: "0.05mm", label: "Hassasiyet" },
];

export default function HomePage() {
  return (
    <div className="bg-[#020202]">
      {/* Hero - Scroll Animation */}
      <PrinterCanvas />

      {/* Hizmetler Bölümü */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[#FF6B35] text-sm font-medium tracking-widest uppercase mb-4">
            Ekosistem
          </p>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-6">
            Her İhtiyacınız İçin{" "}
            <span className="text-[#FF6B35]">Bir Çözüm</span>
          </h2>
          <p className="text-white/40 max-w-xl mx-auto">
            3D baskı dünyasında ihtiyacınız olan her şey tek platformda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.href}
                href={service.href}
                className="group p-6 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-[#FF6B35]/30 hover:bg-white/[0.05] transition-all duration-300"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${service.color}15`, border: `1px solid ${service.color}30` }}
                >
                  <Icon size={22} style={{ color: service.color }} />
                </div>
                <h3 className="text-white font-semibold mb-2 group-hover:text-[#FF6B35] transition-colors">
                  {service.title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed">
                  {service.description}
                </p>
                <div className="flex items-center gap-2 mt-4 text-white/30 group-hover:text-[#FF6B35] transition-colors text-sm">
                  <span>Keşfet</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-[#FF6B35] mb-2">
                {stat.value}
              </div>
              <div className="text-white/40 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-6">
            Hayalinizdeki Parçayı
            <br />
            <span className="text-[#FF6B35]">Birlikte Üretelim</span>
          </h2>
          <p className="text-white/40 mb-8">
            STL dosyanızı yükleyin, malzeme ve kaliteyi seçin. Kalan her şeyi biz hallediyoruz.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/services/print"
              className="px-8 py-4 bg-[#FF6B35] hover:bg-[#ff5a1f] text-white font-semibold rounded-xl transition-colors inline-flex items-center gap-2"
            >
              Baskı Talebi Oluştur
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/shop"
              className="px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors"
            >
              Mağazaya Gözat
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
