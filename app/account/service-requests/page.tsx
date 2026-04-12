export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, Wrench } from "lucide-react";
import Link from "next/link";
import ServiceRequestsClient from "./ServiceRequestsClient";

export default async function ServiceRequestsPage() {
  const session = await auth();
  if (!session) redirect("/login");

  let requests: import("@prisma/client").ServiceRequest[] = [];
  try {
    requests = await prisma.serviceRequest.findMany({
      where:   { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    // DB bağlantısı yoksa boş liste
  }

  const serialized = requests.map((r) => ({
    ...r,
    price:     r.price !== null ? Number(r.price) : null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    specs:     r.specs as Record<string, unknown> | null,
  }));

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

        <ServiceRequestsClient initialRequests={serialized} />
      </div>
    </div>
  );
}
