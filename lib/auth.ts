import bcrypt from "bcryptjs"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import NextAuth, { type NextAuthOptions } from "next-auth"
import prisma from "@/lib/prisma"

const originalAdapter = PrismaAdapter(prisma);

export const authOptions: NextAuthOptions = {
  adapter: {
    ...originalAdapter,
    async linkAccount(account) {
      try {
        return await originalAdapter.linkAccount!(account);
      } catch (error: any) {
        if (error.message?.includes("Unique constraint failed")) {
          // If the account is already linked, just return it instead of crashing
          const existingAccount = await prisma.account.findUnique({
            where: {
              provider_providerAccountId: {
                provider: account.provider,
                providerAccountId: account.providerAccountId,
              },
            },
          });
          if (existingAccount) return existingAccount as any;
        }
        throw error;
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("กรุณากรอกอีเมลและรหัสผ่าน")
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          })

          if (!user) {
            throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
          }

          if (!user.password) {
            throw new Error("บัญชีนี้ใช้การเข้าสู่ระบบด้วย Google กรุณาเลือก 'ดำเนินการต่อด้วย Google'")
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isPasswordValid) {
            throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        } catch (error: any) {
          if (error.message === "อีเมลหรือรหัสผ่านไม่ถูกต้อง") {
            throw error;
          }
          console.error("Auth Error:", error);
          throw new Error("ไม่สามารถเข้าสู่ระบบได้เนื่องจากปัญหาการเชื่อมต่อฐานข้อมูล")
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // เมื่อ Login ครั้งแรก
      if (user) {
        token.role = (user as { role?: string }).role
        token.id = user.id
        token.picture = (user as any).image // picture เป็น field มาตรฐานของ NextAuth Token
      }
      
      // เมื่อมีการเรียก update() จากฝั่ง client
      if (trigger === "update") {
        // ดึงข้อมูลใหม่ล่าสุดจาก Database เสมอเมื่อมีการสั่ง Update
        const updatedUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { name: true, role: true, image: true }
        });
        
        if (updatedUser) {
          token.name = updatedUser.name;
          token.role = updatedUser.role;
          token.picture = updatedUser.image;
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string | undefined
        // @ts-ignore
        session.user.id = token.id as string
        session.user.image = token.picture as string | null | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
}
