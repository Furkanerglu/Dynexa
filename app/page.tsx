import type { Metadata } from "next";
import { PrinterCanvas } from "@/components/scroll/PrinterCanvas";

export const metadata: Metadata = {
  title: "DYNEXA — Precision in Every Layer",
  description:
    "3D baskı ekosisteminiz için tek adres. Yedek parçalar, premium filamentler, 3D baskı ve tarama hizmetleri.",
};

export default function HomePage() {
  return (
    <div className="bg-[#020202]">
      <PrinterCanvas />
    </div>
  );
}
