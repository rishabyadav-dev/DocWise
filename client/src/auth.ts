import NextAuth from "next-auth";
import type { JWT } from "next-auth/jwt";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { VerifyPassword } from "./lib/hash";
import { prisma } from "./lib/prisma";
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
    };
  }
  interface User {
    id: string;
    email: string;
    name: string | null;
  }
}
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      name: "Email and password",
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const email = String(credentials?.email).trim().toLowerCase();
        const password = String(credentials?.password).trim();

        try {
          const user = await prisma.user.findUnique({
            where: {
              email,
            },
          });
          if (!user?.password) {
            return null;
          }
          const passwordCorrect = await VerifyPassword(
            user?.password,
            password
          );
          console.log(`user:${user}`);
          if (!user || !passwordCorrect) return null;
          console.log(`user:${user}`);

          if (!user) return null;
          return {
            id: String(user.id),
            email: user.email,
            name: user.name,
          };
        } catch (error) {
          console.log("error while login:", error);

          return null;
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      if (account?.provider === "google" && user?.email && user.name) {
        try {
          let dbUser = await prisma.user.findUnique({
            where: { email: user.email },
          });

          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                name: user.name,
              },
            });
          }
          token.id = dbUser.id;
        } catch (error) {
          console.error("Error handling Google user:", error);
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (session.user) {
        if (token) {
          session.user.id = token.id;
          session.user.email = token.email;
          session.user.name = token.name;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/signin",
  },
  secret: process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",

  trustHost: true,
});
