import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

// Veritabanı olmadan çalışan geliştirme kullanıcıları
const DEV_USERS = [
  {
    id: "dev-admin-1",
    email: "admin@dynexa.com",
    password: "Admin123!",
    name: "Admin",
    image: null,
    role: "ADMIN" as Role,
  },
  {
    id: "dev-user-1",
    email: "test@dynexa.com",
    password: "Test123!",
    name: "Test Kullanıcı",
    image: null,
    role: "USER" as Role,
  },
];

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Şifre", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const email = credentials.email as string;
        const password = credentials.password as string;

        // 1. Veritabanında ara (DB varsa)
        try {
          const user = await prisma.user.findUnique({ where: { email } });

          if (user && user.password) {
            const isValid = await bcrypt.compare(password, user.password);
            if (!isValid) return null;
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
              role: user.role,
            };
          }
        } catch {
          // DB bağlanamadı — geliştirme kullanıcılarına geç
        }

        // 2. Geliştirme kullanıcılarında ara (DB yokken)
        const devUser = DEV_USERS.find(
          (u) => u.email === email && u.password === password
        );
        if (devUser) {
          return {
            id: devUser.id,
            email: devUser.email,
            name: devUser.name,
            image: devUser.image,
            role: devUser.role,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
});
