import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#020202] border-t border-white/10 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-1 mb-4">
              <span className="text-xl font-black tracking-tighter text-white">DYN</span>
              <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
              <span className="text-xl font-black tracking-tighter text-white">EXA</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              3D baskı ekosisteminiz için tek adres. Parçalar, filamentler ve profesyonel hizmetler.
            </p>
            <p className="text-white/20 text-xs mt-4 tracking-widest uppercase">
              Precision in Every Layer
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Ürünler</h4>
            <ul className="space-y-2">
              <li><Link href="/shop" className="text-white/40 text-sm hover:text-white transition-colors">3D Yazıcı Parçaları</Link></li>
              <li><Link href="/filament" className="text-white/40 text-sm hover:text-white transition-colors">Filament</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm">Hizmetler</h4>
            <ul className="space-y-2">
              <li><Link href="/services/print" className="text-white/40 text-sm hover:text-white transition-colors">3D Baskı</Link></li>
              <li><Link href="/services/scanning" className="text-white/40 text-sm hover:text-white transition-colors">3D Tarama</Link></li>
              <li><Link href="/services/technical" className="text-white/40 text-sm hover:text-white transition-colors">Teknik Servis</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/20 text-xs">
            © {new Date().getFullYear()} DYNEXA. Tüm hakları saklıdır.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-white/20 text-xs hover:text-white/40 transition-colors">Gizlilik</Link>
            <Link href="/terms" className="text-white/20 text-xs hover:text-white/40 transition-colors">Kullanım Koşulları</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
