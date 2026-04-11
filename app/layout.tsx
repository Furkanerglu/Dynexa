import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "DYNEXA — Precision in Every Layer",
    template: "%s | DYNEXA",
  },
  description:
    "3D baskı ekosisteminiz için tek adres. Yedek parçalar, premium filamentler, 3D baskı ve tarama hizmetleri.",
  keywords: [
    "3D baskı",
    "filament",
    "3D yazıcı parçaları",
    "hotend",
    "nozzle",
    "PLA",
    "PETG",
  ],
  openGraph: {
    title: "DYNEXA — Precision in Every Layer",
    description: "3D baskı ekosisteminiz için tek adres.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="bg-[#020202] text-white min-h-screen">
        <Providers>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
