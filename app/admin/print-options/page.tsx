export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import PrintOptionsClient from "./PrintOptionsClient";

export default async function PrintOptionsPage() {
  const [materials, colors] = await Promise.all([
    prisma.printMaterial.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.printColor.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return <PrintOptionsClient initialMaterials={materials} initialColors={colors} />;
}
