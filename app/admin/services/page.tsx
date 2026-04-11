export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/utils";

const STATUS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Beklemede", color: "text-yellow-400 bg-yellow-400/10" },
  REVIEWING: { label: "İnceleniyor", color: "text-blue-400 bg-blue-400/10" },
  QUOTED: { label: "Fiyat Verildi", color: "text-purple-400 bg-purple-400/10" },
  CONFIRMED: { label: "Onaylandı", color: "text-[#FF6B35] bg-[#FF6B35]/10" },
  IN_PROGRESS: { label: "İşlemde", color: "text-orange-400 bg-orange-400/10" },
  COMPLETED: { label: "Tamamlandı", color: "text-[#00D4AA] bg-[#00D4AA]/10" },
  CANCELLED: { label: "İptal", color: "text-red-400 bg-red-400/10" },
};

export default async function AdminServicesPage() {
  const services = await prisma.serviceRequest.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-8">Servis Talepleri</h1>
      <div className="space-y-3">
        {services.map((sr) => {
          const status = STATUS[sr.status];
          return (
            <div key={sr.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-white font-medium">{sr.title}</span>
                    <span className="text-white/30 text-xs px-2 py-0.5 bg-white/5 rounded-full">
                      {sr.type}
                    </span>
                  </div>
                  <p className="text-white/40 text-xs">
                    {sr.user.name} · {sr.user.email} · {new Date(sr.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                  <p className="text-white/60 text-sm mt-2 line-clamp-2">{sr.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${status.color}`}>
                    {status.label}
                  </span>
                  {sr.price && (
                    <span className="text-[#FF6B35] font-bold text-sm">
                      {formatPrice(Number(sr.price))}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
