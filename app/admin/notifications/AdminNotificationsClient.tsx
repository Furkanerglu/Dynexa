"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, Send, Users, User, Tag, Info, Package, Wrench, ChevronDown } from "lucide-react";

// ─── Tipler ──────────────────────────────────────────────────────────────────

type NotifRecord = {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  link: string | null;
  createdAt: string;
  user: { name: string | null; email: string };
};

type UserOption = { id: string; name: string | null; email: string };

// ─── Sabitler ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "INFO",           label: "Genel Bilgi",        icon: Info,    color: "text-blue-400" },
  { value: "DISCOUNT",       label: "İndirim / Kampanya", icon: Tag,     color: "text-[#00D4AA]" },
  { value: "ORDER_STATUS",   label: "Sipariş Durumu",     icon: Package, color: "text-[#FF6B35]" },
  { value: "SERVICE_STATUS", label: "Servis Durumu",      icon: Wrench,  color: "text-purple-400" },
];

function typeIcon(type: string) {
  const opt = TYPE_OPTIONS.find((t) => t.value === type);
  if (!opt) return <Info size={13} className="text-blue-400" />;
  const Icon = opt.icon;
  return <Icon size={13} className={opt.color} />;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "az önce";
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}sa önce`;
  return `${Math.floor(h / 24)}g önce`;
}

// ─── Ana Component ────────────────────────────────────────────────────────────

export default function AdminNotificationsClient({
  recentNotifications,
  users,
}: {
  recentNotifications: NotifRecord[];
  users: UserOption[];
}) {
  const [recent,   setRecent]   = useState<NotifRecord[]>(recentNotifications);
  const [sending,  setSending]  = useState(false);

  // Form state
  const [target,  setTarget]  = useState<"all" | "single">("all");
  const [userId,  setUserId]  = useState("");
  const [type,    setType]    = useState("INFO");
  const [title,   setTitle]   = useState("");
  const [body,    setBody]    = useState("");
  const [link,    setLink]    = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userDropOpen, setUserDropOpen] = useState(false);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.name ?? "").toLowerCase().includes(userSearch.toLowerCase())
  );

  const selectedUser = users.find((u) => u.id === userId);

  async function send() {
    if (!title.trim() || !body.trim()) { toast.error("Başlık ve içerik zorunlu"); return; }
    if (target === "single" && !userId) { toast.error("Kullanıcı seçin"); return; }

    setSending(true);
    try {
      const res = await fetch("/api/admin/notifications", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body:  body.trim(),
          type,
          link:   link.trim() || undefined,
          userId: target === "single" ? userId : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);

      toast.success(
        target === "all"
          ? `${data.sent} kullanıcıya bildirim gönderildi`
          : "Bildirim gönderildi"
      );

      // Formu sıfırla
      setTitle(""); setBody(""); setLink(""); setUserId(""); setUserSearch("");
      setTarget("all"); setType("INFO");

      // Listede güncelle (yaklaşık)
      const fake: NotifRecord = {
        id:        Math.random().toString(),
        title:     title.trim(),
        body:      body.trim(),
        type,
        read:      false,
        link:      link.trim() || null,
        createdAt: new Date().toISOString(),
        user:      target === "single"
          ? { name: selectedUser?.name ?? null, email: selectedUser?.email ?? "" }
          : { name: null, email: `${data.sent} kullanıcı` },
      };
      setRecent((prev) => [fake, ...prev].slice(0, 50));
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Hata");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="max-w-5xl space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Bell size={22} className="text-[#FF6B35]" />
          Bildirimler
        </h1>
        <p className="text-white/40 text-sm mt-0.5">Müşterilere anlık bildirim gönder, kampanya duyur</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* ─── Sol: Gönderme Formu ──────────────────────────────────────── */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-5">
          <h2 className="text-white font-semibold flex items-center gap-2">
            <Send size={16} className="text-[#FF6B35]" />
            Yeni Bildirim Gönder
          </h2>

          {/* Hedef seçimi */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">Hedef</p>
            <div className="flex gap-2">
              <button
                onClick={() => setTarget("all")}
                className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border transition-all ${
                  target === "all"
                    ? "border-[#FF6B35]/60 bg-[#FF6B35]/10 text-[#FF6B35]"
                    : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                <Users size={14} />
                Tüm Müşteriler
              </button>
              <button
                onClick={() => setTarget("single")}
                className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border transition-all ${
                  target === "single"
                    ? "border-[#FF6B35]/60 bg-[#FF6B35]/10 text-[#FF6B35]"
                    : "border-white/10 bg-white/5 text-white/50 hover:text-white"
                }`}
              >
                <User size={14} />
                Belirli Kullanıcı
              </button>
            </div>
          </div>

          {/* Kullanıcı arama (single modda) */}
          {target === "single" && (
            <div className="relative">
              <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">Kullanıcı</p>
              <div className="relative">
                <input
                  type="text"
                  placeholder="İsim veya e-posta ara..."
                  value={selectedUser ? `${selectedUser.name ?? ""} (${selectedUser.email})` : userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserId(""); setUserDropOpen(true); }}
                  onFocus={() => setUserDropOpen(true)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF6B35]/60 placeholder:text-white/20"
                />
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
              </div>
              {userDropOpen && !selectedUser && (
                <div className="absolute z-50 left-0 top-[calc(100%+4px)] w-full bg-[#111] border border-white/15 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <p className="px-3 py-3 text-white/30 text-sm text-center">Kullanıcı bulunamadı</p>
                  ) : (
                    filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => { setUserId(u.id); setUserSearch(""); setUserDropOpen(false); }}
                        className="w-full text-left px-3 py-2.5 hover:bg-white/5 transition-colors"
                      >
                        <p className="text-white text-sm">{u.name ?? "—"}</p>
                        <p className="text-white/40 text-xs">{u.email}</p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Bildirim tipi */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">Tür</p>
            <div className="grid grid-cols-2 gap-2">
              {TYPE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setType(opt.value)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-all ${
                      type === opt.value
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Icon size={14} className={opt.color} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Başlık */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">Başlık</p>
            <input
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bildirim başlığı..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF6B35]/60 placeholder:text-white/20"
            />
          </div>

          {/* İçerik */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">İçerik</p>
            <textarea
              maxLength={500}
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Bildirim metni..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-[#FF6B35]/60 placeholder:text-white/20"
            />
            <p className="text-[10px] text-white/20 text-right mt-0.5">{body.length}/500</p>
          </div>

          {/* Bağlantı (opsiyonel) */}
          <div>
            <p className="text-[11px] text-white/30 uppercase tracking-wide mb-2">
              Bağlantı <span className="text-white/20 normal-case tracking-normal">(opsiyonel)</span>
            </p>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/shop, /account/orders, vb."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-[#FF6B35]/60 placeholder:text-white/20"
            />
          </div>

          {/* Gönder butonu */}
          <button
            onClick={send}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 bg-[#FF6B35] hover:bg-[#e55a28] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            <Send size={16} />
            {sending
              ? "Gönderiliyor..."
              : target === "all"
              ? `Tüm Müşterilere Gönder (${users.length} kişi)`
              : "Kullanıcıya Gönder"}
          </button>
        </div>

        {/* ─── Sağ: Son Gönderilenler ──────────────────────────────────── */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10">
            <h2 className="text-white font-semibold text-sm">Son Gönderilenler</h2>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {recent.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={28} className="mx-auto text-white/10 mb-2" />
                <p className="text-white/30 text-sm">Henüz bildirim gönderilmedi</p>
              </div>
            ) : (
              recent.map((n) => (
                <div key={n.id} className="flex gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {typeIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{n.title}</p>
                    <p className="text-white/40 text-xs truncate">{n.body}</p>
                    <p className="text-white/25 text-[10px] mt-0.5">
                      {n.user.name ?? n.user.email} · {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
