export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import AdminServicesClient from "./AdminServicesClient";

export default async function AdminServicesPage() {
  const requests = await prisma.serviceRequest.findMany({
    where:   { type: "TECHNICAL" },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const serialized = requests.map((r) => ({
    ...r,
    price:     r.price != null ? Number(r.price) : null,
    specs:     (r.specs as Record<string, unknown>) ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return <AdminServicesClient initialRequests={serialized} />;
}
