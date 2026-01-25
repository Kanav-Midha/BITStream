import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { isAdminEmail, isAllowedCampusEmail, ALLOWED_EMAIL_DOMAIN } from "@/backend/auth/config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
      authorization: {
        params: {
          hd: ALLOWED_EMAIL_DOMAIN,
          prompt: "select_account",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, profile }) {
      const email = user.email || profile?.email;
      const emailVerified =
        typeof profile?.email_verified === "boolean" ? profile.email_verified : true;

      return emailVerified && isAllowedCampusEmail(email);
    },
    async jwt({ token, user }) {
      const email = (user?.email || token.email || "").toLowerCase();

      if (email) {
        token.email = email;
        token.role = isAdminEmail(email) ? "admin" : "student";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email || session.user.email || "";
        session.user.role = token.role === "admin" ? "admin" : "student";
      }

      return session;
    },
  },
});
