import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "UpSkill - ยกระดับทักษะของคุณ",
  description: "เรียนรู้จากผู้เชี่ยวชาญตัวจริง พัฒนาศักยภาพไร้ขีดจำกัด",
};

import Navbar from "@/components/Navbar";
import AuthProvider from "@/components/AuthProvider";
import prisma from "@/lib/prisma";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const courses = await prisma.course.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: 6,
    include: {
      instructor: {
        select: { name: true }
      }
    }
  });

  return (
    <html
      lang="th"
      className={`${prompt.variable} h-full antialiased`}
    >
      <body className={`${prompt.className} min-h-full flex flex-col bg-gray-50 text-gray-900`}>
        <AuthProvider>
          <Navbar courses={courses} />
          <div className="flex-1">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
