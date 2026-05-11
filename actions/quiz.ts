"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

async function checkInstructorAuth(courseId: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");
  
  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  // ตรวจสอบว่าคนนี้เป็นเจ้าของคอร์สหรือแอดมินหรือไม่
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true }
  });

  if (!course || (course.instructorId !== userId && userRole !== "ADMIN")) {
    throw new Error("Forbidden");
  }
  
  return userId;
}

export async function createQuiz(lessonId: string, courseId: string) {
  await checkInstructorAuth(courseId);
  
  const quiz = await prisma.quiz.upsert({
    where: { lessonId },
    update: {},
    create: { lessonId }
  });

  revalidatePath(`/instructor/courses/${courseId}`);
  return quiz;
}

export async function addQuestion(quizId: string, courseId: string, data: { question: string, options: string[], correctAnswer: string }) {
  await checkInstructorAuth(courseId);

  const question = await prisma.question.create({
    data: {
      question: data.question,
      options: data.options,
      correctAnswer: data.correctAnswer,
      quizId
    }
  });

  revalidatePath(`/instructor/courses/${courseId}`);
  return question;
}

export async function updateQuestion(questionId: string, courseId: string, data: { question?: string, options?: string[], correctAnswer?: string }) {
  await checkInstructorAuth(courseId);

  const question = await prisma.question.update({
    where: { id: questionId },
    data
  });

  revalidatePath(`/instructor/courses/${courseId}`);
  return question;
}

export async function deleteQuestion(questionId: string, courseId: string) {
  await checkInstructorAuth(courseId);

  await prisma.question.delete({
    where: { id: questionId }
  });

  revalidatePath(`/instructor/courses/${courseId}`);
}
