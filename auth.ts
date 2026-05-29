import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  pages: {
    error: "/admin",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      return !!email && ADMIN_EMAILS.has(email);
    },
  },
});