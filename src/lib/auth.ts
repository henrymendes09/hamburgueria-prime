import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const providers: Provider[] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.passwordHash) return null;
      if (user.blocked) throw new Error("CONTA_BLOQUEADA");

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
      }
      // Mantém a role atualizada em cada requisição, refletindo mudanças feitas no admin
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, blocked: true, name: true, image: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.blocked = dbUser.blocked;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.blocked = token.blocked as boolean;
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
