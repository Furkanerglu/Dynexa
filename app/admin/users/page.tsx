export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { orders: true, serviceReqs: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-black text-white mb-8">
        Kullanıcılar <span className="text-white/30 font-normal text-lg">({users.length})</span>
      </h1>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Kullanıcı</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Rol</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Sipariş</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Servis</th>
              <th className="text-left px-4 py-3 text-white/40 text-xs font-medium">Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <p className="text-white text-sm font-medium">{user.name || "—"}</p>
                  <p className="text-white/40 text-xs">{user.email}</p>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    user.role === "ADMIN" ? "bg-[#FF6B35]/10 text-[#FF6B35]" : "bg-white/10 text-white/50"
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-white/60 text-sm">{user._count.orders}</td>
                <td className="px-4 py-3 text-white/60 text-sm">{user._count.serviceReqs}</td>
                <td className="px-4 py-3 text-white/40 text-xs">
                  {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
