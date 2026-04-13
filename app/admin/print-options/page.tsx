export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import PrintOptionsClient from "./PrintOptionsClient";

export default async function PrintOptionsPage() {
  const materials = await prisma.printMaterial.findMany({
    orderBy: { sortOrder: "asc" },
    include: { colors: { orderBy: { sortOrder: "asc" } } },
  });
  return <PrintOptionsClient initialMaterials={materials} />;
}
