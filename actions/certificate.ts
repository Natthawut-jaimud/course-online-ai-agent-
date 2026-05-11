"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function issueCertificate(courseId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");
    
    const userId = (session.user as any).id;

    // 1. ตรวจสอบว่าเรียนครบจริงไหม
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            lessons: { select: { id: true } }
          }
        }
      }
    });

    if (!course) throw new Error("Course not found");

    const allLessonIds = course.sections.flatMap(s => s.lessons).map(l => l.id);
    const progressCount = await prisma.progress.count({
      where: {
        userId,
        lessonId: { in: allLessonIds },
        completed: true
      }
    });

    if (progressCount < allLessonIds.length) {
      throw new Error("Course not fully completed yet");
    }

    // 2. ออกรหัส Certificate (Unique ID)
    const uniqueId = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    // 3. บันทึกลงฐานข้อมูล
    const certificate = await prisma.certificate.upsert({
      where: {
        userId_courseId: { userId, courseId }
      },
      update: {},
      create: {
        userId,
        courseId,
        certificateId: uniqueId
      }
    });

    revalidatePath("/profile");
    return certificate;
  } catch (error: any) {
    console.error("Certificate Issue Error:", error);
    throw new Error(error.message);
  }
}
