export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ChevronLeft, Wrench, Zap, Scan } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Beklemede", color: "text-yellow-400 bg-yellow-400/10" },
  REVIEWING: { label: "İnceleniyor", color: "text-blue-400 bg-blue-400/10" },
  QUOTED: { label: "Fiyat Verildi", color: "text-purple-400 bg-purple-400/10" },
  CONFIRMED: { label: "Onaylandı", color: "text-[#FF6B35] bg-[#FF6B35]/10" },
  IN_PROGRESS: { label: "İşlemde", color: "text-[#FF6B35] bg-[#FF6B35]/10" },
  COMPLETED: { label: "Tamamlandı", color: "text-[#00D4AA] bg-[#00D4AA]/10" },
  CANCELLED: { label: "İptal", color: "text-red-400 bg-red-400/10" },
};

const TYPE_ICONS: Record<string, typeof Wrench> = {
  PRINT: Zap,
  SCANNING: Scan,
  TECHNICAL: Wrench,
};

const TYPE_LABELS: Record<string, string> = {
  PRINT: "3D Baskı",
  SCANNING: "3D Tarama",
  TECHNICAL: "Teknik Servis",
};

export default async function ServiceRequestsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const requests = await prisma.serviceRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/account" className="text-white/40 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wrench size={22} className="text-[#FF6B35]" />
            Servis Taleplerim
          </h1>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-24">
            <Wrench size={64} className="mx-auto text-white/10 mb-4" />
            <p className="text-white/40 mb-6">Henüz servis talebiniz yok</p>
            <div className="flex gap-3 justify-center">
              <Link href="/services/print" className="px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-sm font-semibold">3D Baskı</Link>
              <Link href="/services/technical" className="px-4 py-2 border border-white/20 text-white rounded-xl text-sm font-semibold">Teknik Servis</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => {
              const Icon = TYPE_ICONS[req.type] || Wrench;
              const status = STATUS[req.status];
              return (
                <div key={req.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center flex-shrink-0">
                        <Icon size={18} className="text-[#FF6B35]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{req.title}</p>
                        <p className="text-white/40 text-xs mt-1">
                          {TYPE_LABELS[req.type]} · {new Date(req.createdAt).toLocaleDateString("tr-TR")}
                        </p>
                        <p className="text-white/50 text-sm mt-2 line-clamp-2">{req.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                        {status.label}
                      </span>
                      {req.price && (
                        <span className="text-[#FF6B35] font-bold text-sm">
                          {formatPrice(Number(req.price))}
                        </span>
                      )}
                    </div>
                  </div>
                  {req.adminNotes && (
                    <div className="mt-4 p-3 bg-white/5 rounded-lg">
                      <p className="text-white/40 text-xs mb-1">Admin Notu:</p>
                      <p className="text-white/70 text-sm">{req.adminNotes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
