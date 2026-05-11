"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function checkAuth() {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  
  const userRole = (session.user as any).role;
  if (userRole !== "INSTRUCTOR" && userRole !== "ADMIN") {
    throw new Error("Forbidden");
  }
  
  return (session.user as any).id;
}

export async function createSection(courseId: string, title: string, position: number) {
  await checkAuth();
  const section = await prisma.section.create({
    data: {
      title,
      position,
      courseId,
      isPublished: true,
    }
  });
  revalidatePath(`/instructor/courses/${courseId}`);
  return section;
}

export async function createLesson(sectionId: string, courseId: string, title: string, type: "VIDEO" | "PDF" | "QUIZ" | "ASSIGNMENT", position: number) {
  await checkAuth();
  const lesson = await prisma.lesson.create({
    data: {
      title,
      type,
      position,
      sectionId,
      isPublished: true,
    }
  });
  revalidatePath(`/instructor/courses/${courseId}`);
  return lesson;
}

export async function deleteSection(sectionId: string, courseId: string) {
  await checkAuth();
  await prisma.section.delete({
    where: { id: sectionId }
  });
  revalidatePath(`/instructor/courses/${courseId}`);
}

export async function deleteLesson(lessonId: string, courseId: string) {
  await checkAuth();
  await prisma.lesson.delete({
    where: { id: lessonId }
  });
  revalidatePath(`/instructor/courses/${courseId}`);
}

export async function updateLesson(
  lessonId: string, 
  courseId: string, 
  data: { videoUrl?: string; subtitleUrl?: string; pdfUrl?: string; description?: string; assignmentData?: any }
) {
  await checkAuth();
  await prisma.lesson.update({
    where: { id: lessonId },
    data
  });
  revalidatePath(`/instructor/courses/${courseId}`);
}

export async function updateCourse(courseId: string, data: { title?: string, description?: string, price?: number, imageUrl?: string | null }) {
  const userId = await checkAuth();
  
  // Verify ownership
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.instructorId !== userId) throw new Error("Forbidden");
  
  await prisma.course.update({
    where: { id: courseId },
    data
  });
  revalidatePath(`/instructor/courses/${courseId}`);
}

export async function deleteCourse(courseId: string) {
  const userId = await checkAuth();
  
  // Verify ownership
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.instructorId !== userId) throw new Error("Forbidden");
  
  await prisma.course.delete({
    where: { id: courseId }
  });
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath("/");
}

export async function togglePublishCourse(courseId: string) {
  const userId = await checkAuth();
  
  // Verify ownership
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course || course.instructorId !== userId) throw new Error("Forbidden");
  
  await prisma.course.update({
    where: { id: courseId },
    data: { isPublished: !course.isPublished }
  });
  
  revalidatePath(`/instructor/courses/${courseId}`);
  revalidatePath("/");
  revalidatePath("/instructor");
}

export async function toggleProgress(lessonId: string, courseId: string, completed: boolean) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  const userId = (session.user as any).id;

  await prisma.progress.upsert({
    where: {
      userId_lessonId: {
        userId,
        lessonId
      }
    },
    update: {
      completed
    },
    create: {
      userId,
      lessonId,
      completed
    }
  });

  revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
  revalidatePath(`/courses/${courseId}`);
}
