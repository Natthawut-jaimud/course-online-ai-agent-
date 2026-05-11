"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function submitReview(courseId: string, rating: number, comment: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) throw new Error("Unauthorized");
    
    const userId = (session.user as any).id;

    // 1. ตรวจสอบว่าลงทะเบียนเรียนจริงไหม
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: { userId, courseId }
      }
    });

    if (!enrollment) {
      throw new Error("You must be enrolled to review this course");
    }

    // 2. บันทึกหรืออัปเดตรีวิว
    const review = await prisma.review.upsert({
      where: {
        userId_courseId: { userId, courseId }
      },
      update: {
        rating,
        comment,
      },
      create: {
        userId,
        courseId,
        rating,
        comment,
      }
    });

    revalidatePath(`/courses/${courseId}`);
    return review;
  } catch (error: any) {
    console.error("Review Error:", error);
    throw new Error(error.message);
  }
}
