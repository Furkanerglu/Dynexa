import type { Metadata } from "next";
import { PrintOrderForm } from "@/components/PrintOrderForm";
import { Zap, Clock, Shield, Award } from "lucide-react";

export const metadata: Metadata = {
  title: "3D Baskı Hizmeti",
  description: "STL dosyanızı yükleyin, malzeme ve kaliteyi seçin. Kalan her şeyi biz halledelim.",
};

const features = [
  { icon: Zap, title: "Hızlı Üretim", desc: "24-72 saat içinde üretim" },
  { icon: Shield, title: "Kalite Garantisi", desc: "Her baskı kalite kontrolünden geçer" },
  { icon: Clock, title: "Gerçek Zamanlı Takip", desc: "Siparişinizi anlık takip edin" },
  { icon: Award, title: "Profesyonel Ekip", desc: "Uzman teknisyen kadrosu" },
];

export default function PrintServicePage() {
  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-[#FF6B35] text-sm font-medium tracking-widest uppercase mb-4">
            Hizmet
          </p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-white mb-4">
            Print-on-Demand
          </h1>
          <p className="text-white/40 max-w-lg mx-auto">
            STL dosyanızı yükleyin, tercihlerinizi seçin ve fiyat teklifimizi bekleyin.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="p-4 bg-white/[0.03] border border-white/10 rounded-xl text-center">
                <Icon size={24} className="mx-auto text-[#FF6B35] mb-2" />
                <p className="text-white text-sm font-medium">{f.title}</p>
                <p className="text-white/40 text-xs mt-1">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Form */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-8">
          <h2 className="text-white font-bold text-xl mb-6">Baskı Talebi Oluştur</h2>
          <PrintOrderForm />
        </div>
      </div>
    </div>
  );
}
