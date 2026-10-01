import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { credentialVersion, isValidSession } from "@/lib/session-security";

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(credentials, request) {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;
      if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 256) return null;
      const normalizedEmail = email.trim().toLowerCase();
      const [ipLimit, accountLimit] = await Promise.all([
        rateLimit(`login-ip:${clientIp(request.headers)}`, { limit: 30, windowMs: 15 * 60 * 1000 }),
        rateLimit(`login-account:${normalizedEmail}`, { limit: 10, windowMs: 15 * 60 * 1000 }),
      ]);
      if (!ipLimit.success || !accountLimit.success) return null;

      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user || !user.passwordHash) return null;
      if (user.blocked) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      await prisma.user.update({
        where: { id: user.id },
        data: { lastAccess: new Date() },
      });

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
        restaurantId: user.restaurantId,
        isPlatformAdmin: user.isPlatformAdmin,
      };
    },
  }),
];

// Login com Google só é ativado se as credenciais estiverem configuradas no .env
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "CLIENTE";
        token.restaurantId = (user as { restaurantId?: string | null }).restaurantId ?? null;
        token.isPlatformAdmin = (user as { isPlatformAdmin?: boolean }).isPlatformAdmin ?? false;
        token.roleCheckedAt = Date.now();
      }

      if (token.id) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, blocked: true, name: true, image: true, restaurantId: true, isPlatformAdmin: true, passwordHash: true },
          });
          const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
          if (!dbUser || !secret || dbUser.blocked) return null;
          if (user) token.credentialVersion = credentialVersion(dbUser.passwordHash, secret);
          if (!isValidSession(token.credentialVersion, dbUser.passwordHash, secret, dbUser.blocked)) return null;
            token.role = dbUser.role;
            token.blocked = dbUser.blocked;
            token.name = dbUser.name;
            token.picture = dbUser.image;
            token.restaurantId = dbUser.restaurantId;
            token.isPlatformAdmin = dbUser.isPlatformAdmin;
            token.roleCheckedAt = Date.now();
        } catch {
          console.error("Session validation failed; access denied.");
          return null;
        }
      }
      return token.id ? token : null;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.blocked = token.blocked as boolean;
        session.user.restaurantId = token.restaurantId as string | null;
        session.user.isPlatformAdmin = Boolean(token.isPlatformAdmin);
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Usuários criados via OAuth (Google) começam como CLIENTE por padrão
      if (user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "CLIENTE" },
        });
      }
    },
  },
});
