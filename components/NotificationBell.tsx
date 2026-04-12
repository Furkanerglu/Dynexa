"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Package, Wrench, Tag, Info, X, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

type Notif = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
};

function typeIcon(type: string) {
  switch (type) {
    case "ORDER_STATUS":   return <Package size={14} className="text-[#FF6B35]" />;
    case "SERVICE_STATUS": return <Wrench  size={14} className="text-purple-400" />;
    case "DISCOUNT":       return <Tag     size={14} className="text-[#00D4AA]" />;
    default:               return <Info    size={14} className="text-blue-400"   />;
  }
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "az önce";
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa önce`;
  return `${Math.floor(h / 24)}g önce`;
}

export function NotificationBell() {
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const unread = notifs.filter((n) => !n.read).length;

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifs(await res.json());
    } catch { /* network error */ }
  }, []);

  // İlk yüklemede ve her 30sn'de bir yenile
  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30_000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  // Dışarı tıklanınca kapat
  useEffect(() => {
    function out(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  async function markAllRead() {
    setLoading(true);
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifs([]);
    setLoading(false);
  }

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    // Okundu işaretlendikten sonra listeden kaldır
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  }

  function handleOpen() {
    setOpen((v) => !v);
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-white/70 hover:text-white transition-colors"
        aria-label="Bildirimler"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-0.5 bg-[#FF6B35] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 bg-[#0d0d0d] border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <span className="text-white font-semibold text-sm">Bildirimler</span>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    disabled={loading}
                    className="flex items-center gap-1 text-[11px] text-white/40 hover:text-[#00D4AA] transition-colors disabled:opacity-40"
                  >
                    <Check size={11} /> Tümünü oku
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/30 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="max-h-[360px] overflow-y-auto">
              {notifs.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={28} className="mx-auto text-white/15 mb-2" />
                  <p className="text-white/30 text-sm">Bildirim yok</p>
                </div>
              ) : (
                notifs.map((n) => {
                  const Inner = (
                    <div
                      key={n.id}
                      className={`flex gap-3 px-4 py-3 border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.03] cursor-pointer ${n.read ? "opacity-60" : ""}`}
                      onClick={() => !n.read && markRead(n.id)}
                    >
                      <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        {typeIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-sm leading-snug ${n.read ? "text-white/50" : "text-white font-medium"}`}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] mt-1 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-white/35 text-xs mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-white/20 text-[10px] mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  );

                  return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => { setOpen(false); if (!n.read) markRead(n.id); }}>
                      {Inner}
                    </Link>
                  ) : (
                    <div key={n.id}>{Inner}</div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifs.length > 0 && (
              <div className="px-4 py-2.5 border-t border-white/10 text-center">
                <p className="text-white/25 text-[11px]">{notifs.length} bildirim · Son 50 gösteriliyor</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
