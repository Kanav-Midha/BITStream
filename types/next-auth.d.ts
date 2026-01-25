import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      email: string;
      role: "student" | "admin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "student" | "admin";
  }
}
