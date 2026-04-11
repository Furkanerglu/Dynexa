import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Wrench, Users } from "lucide-react";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/products", icon: Package, label: "Ürünler" },
  { href: "/admin/orders", icon: ShoppingCart, label: "Siparişler" },
  { href: "/admin/services", icon: Wrench, label: "Servisler" },
  { href: "/admin/users", icon: Users, label: "Kullanıcılar" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="min-h-screen bg-[#020202] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-black/40 border-r border-white/10 fixed left-0 top-0 h-full pt-8 flex flex-col">
        <div className="px-6 mb-8">
          <Link href="/" className="flex items-center gap-1">
            <span className="text-lg font-black tracking-tighter text-white">DYN</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35]" />
            <span className="text-lg font-black tracking-tighter text-white">EXA</span>
          </Link>
          <p className="text-white/30 text-xs mt-1">Admin Panel</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/60 hover:text-white hover:bg-white/5 transition-all text-sm font-medium group"
            >
              <Icon size={18} className="group-hover:text-[#FF6B35] transition-colors" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-6 pb-6">
          <Link href="/" className="text-white/30 text-xs hover:text-white transition-colors">
            ← Siteye Dön
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="ml-56 flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
