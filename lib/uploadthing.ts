import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@/lib/auth";

const f = createUploadthing();

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 8 } })
    .middleware(async () => {
      const session = await auth();
      if (!session || session.user.role !== "ADMIN") throw new Error("Yetkisiz");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),

  // 3D Baskı ve Tarama hizmetleri için STL / fotoğraf yükleme
  serviceFiles: f({
    blob: { maxFileSize: "32MB", maxFileCount: 5 },
  })
    .middleware(async () => {
      const session = await auth();
      if (!session) throw new Error("Giriş yapmanız gerekiyor");
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
