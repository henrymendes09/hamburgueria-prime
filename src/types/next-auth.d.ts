import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      blocked: boolean;
      restaurantId: string | null;
      isPlatformAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
    blocked: boolean;
    restaurantId: string | null;
    isPlatformAdmin: boolean;
  }
}
