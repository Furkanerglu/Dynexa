export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, MapPin } from "lucide-react";
import Link from "next/link";
import AddressManager from "./AddressManager";

export default async function AddressesPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isDefault: "desc" }, { id: "asc" }],
  });

  return (
    <div className="min-h-screen bg-[#020202] pt-24 pb-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/account" className="text-white/40 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin size={22} className="text-[#FF6B35]" />
            Adreslerim
          </h1>
        </div>

        <AddressManager initialAddresses={addresses} />
      </div>
    </div>
  );
}
