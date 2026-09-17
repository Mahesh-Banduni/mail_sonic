import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name: string };
  }
  interface User {
    id: string;
    email: string;
    name: string;
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        if (!email || !credentials?.password)
          throw new Error("Email and password are required.");
        const user = await prisma.user.findUnique({ where: { email } });
        if (
          !user ||
          !(await bcrypt.compare(credentials.password, user.passwordHash))
        )
          throw new Error("Invalid email or password.");
        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.id = user.id;
      return token;
    },
    session: ({ session, token }) => {
      if (session.user && token.id) session.user.id = token.id;
      return session;
    },
  },
  pages: { signIn: "/signin" },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};
