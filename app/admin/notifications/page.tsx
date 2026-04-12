export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminNotificationsClient from "./AdminNotificationsClient";

export default async function AdminNotificationsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  // Son gönderilen bildirimleri getir
  const recent = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { user: { select: { name: true, email: true } } },
  });

  // Kullanıcı listesi (bildirim hedefi için)
  const users = await prisma.user.findMany({
    where:   { role: "USER" },
    select:  { id: true, name: true, email: true },
    orderBy: { createdAt: "desc" },
  });

  const serializedRecent = recent.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  return (
    <AdminNotificationsClient
      recentNotifications={serializedRecent}
      users={users}
    />
  );
}
