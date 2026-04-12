"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCart, User, Menu, X, ChevronDown } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/shop", label: "Ürünler" },
  { href: "/filament", label: "Filament" },
  {
    label: "Hizmetler",
    children: [
      { href: "/services/print", label: "3D Baskı" },
      { href: "/services/scanning", label: "3D Tarama" },
      { href: "/services/technical", label: "Teknik Servis" },
    ],
  },
];

export function Navbar() {
  const { data: session } = useSession();
  const itemCount  = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0));
  const toggleCart = useCartStore((s) => s.toggleCart);
  const syncUser   = useCartStore((s) => s.syncUser);
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  // Session değişince sepeti senkronize et (çıkış/giriş/farklı kullanıcı)
  useEffect(() => {
    syncUser(session?.user?.id ?? null);
  }, [session?.user?.id, syncUser]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-black/60 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1">
            <span className="text-xl font-black tracking-tighter text-white">
              DYN
            </span>
            <span className="w-2 h-2 rounded-full bg-[#FF6B35]" />
            <span className="text-xl font-black tracking-tighter text-white">
              EXA
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.children ? (
                <div key={link.label} className="relative">
                  <button
                    onClick={() => setServicesOpen(!servicesOpen)}
                    className="flex items-center gap-1 text-white/70 hover:text-white text-sm font-medium transition-colors"
                  >
                    {link.label}
                    <ChevronDown size={14} className={`transition-transform ${servicesOpen ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {servicesOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="absolute top-full left-0 mt-2 w-44 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden"
                        onMouseLeave={() => setServicesOpen(false)}
                      >
                        {link.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                            onClick={() => setServicesOpen(false)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={link.href}
                  href={link.href!}
                  className="text-white/70 hover:text-white text-sm font-medium transition-colors"
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-4">
            {/* Notifications — sadece giriş yapınca */}
            {session && <NotificationBell />}

            {/* Cart — sadece giriş yapılmışsa aktif */}
            <button
              onClick={session ? toggleCart : () => {}}
              className={`relative p-2 transition-colors ${
                session ? "text-white/70 hover:text-white" : "text-white/20 cursor-default"
              }`}
              title={session ? "Sepetim" : "Sepeti görmek için giriş yapın"}
            >
              <ShoppingCart size={20} />
              {session && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF6B35] text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </button>

            {/* User */}
            <div className="relative">
              {session ? (
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-2 text-white/70 hover:text-white transition-colors"
                >
                  <User size={20} />
                  <span className="hidden md:block text-sm">
                    {session.user?.name?.split(" ")[0]}
                  </span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white border border-white/20 rounded-lg hover:border-[#FF6B35] hover:text-[#FF6B35] transition-colors"
                >
                  Giriş Yap
                </Link>
              )}

              <AnimatePresence>
                {userMenuOpen && session && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-black/90 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden"
                  >
                    <Link
                      href="/account"
                      className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Hesabım
                    </Link>
                    <Link
                      href="/account/orders"
                      className="block px-4 py-3 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      Siparişlerim
                    </Link>
                    {session.user?.role === "ADMIN" && (
                      <Link
                        href="/admin"
                        className="block px-4 py-3 text-sm text-[#FF6B35] hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => signOut({ callbackUrl: window.location.origin })}
                      className="w-full text-left px-4 py-3 text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors border-t border-white/10"
                    >
                      Çıkış Yap
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-white/70 hover:text-white"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden bg-black/90 backdrop-blur-md border-t border-white/10"
          >
            <div className="px-4 py-4 space-y-2">
              <Link href="/shop" className="block py-2 text-white/70 hover:text-white" onClick={() => setMobileOpen(false)}>Ürünler</Link>
              <Link href="/filament" className="block py-2 text-white/70 hover:text-white" onClick={() => setMobileOpen(false)}>Filament</Link>
              <Link href="/services/print" className="block py-2 text-white/70 hover:text-white" onClick={() => setMobileOpen(false)}>3D Baskı</Link>
              <Link href="/services/scanning" className="block py-2 text-white/70 hover:text-white" onClick={() => setMobileOpen(false)}>3D Tarama</Link>
              <Link href="/services/technical" className="block py-2 text-white/70 hover:text-white" onClick={() => setMobileOpen(false)}>Teknik Servis</Link>
              {!session && (
                <Link href="/login" className="block py-2 text-[#FF6B35]" onClick={() => setMobileOpen(false)}>Giriş Yap</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
