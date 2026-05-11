import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { lessonId, courseId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: {
        questions: {
          orderBy: { position: "asc" },
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) return NextResponse.json(null);

    // Shuffle function (Fisher-Yates)
    const shuffle = (array: any[]) => {
      for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
      }
      return array;
    };

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });

    const isInstructor = course?.instructorId === userId || userRole === "ADMIN";

    if (!isInstructor) {
      // Randomize questions for students
      quiz.questions = shuffle([...quiz.questions]);
      
      quiz.questions.forEach(q => {
        // Randomize options for each question
        q.options = shuffle([...q.options]);
        
        q.options.forEach(opt => {
          // @ts-ignore
          delete (opt as any).isCorrect;
        });
      });
    }

    return NextResponse.json(quiz);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { lessonId, courseId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true }
    });

    if (!course || (course.instructorId !== userId && userRole !== "ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    // ดักไว้ก่อนเลยว่าถ้าไม่มี questions ส่งมา ให้มองเป็น Array ว่างๆ ป้องกัน Error
    const questions = body.questions || [];

    // บันทึกข้อมูลด้วยระบบ Clean Delete-and-Recreate Transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. ค้นหาและลบ Quiz เดิม (Cascade Deletion จะจัดการ Question และ Option อัตโนมัติ)
      const existingQuiz = await tx.quiz.findUnique({
        where: { lessonId }
      });

      if (existingQuiz) {
        await tx.quiz.delete({
          where: { id: existingQuiz.id }
        });
      }

      // 2. สร้าง Quiz ใหม่พร้อมบังคับชนิดข้อมูลให้ตรง Schema 100%
      return await tx.quiz.create({
        data: {
          lessonId,
          questions: {
            create: questions.map((q: any, index: number) => ({
              prompt: String(q.prompt || ""), // บังคับเป็น String ป้องกัน null
              position: Number(index),        // บังคับเป็น Number
              options: {
                create: (q.options || []).map((opt: any) => ({
                  text: String(opt.text || ""),   // บังคับเป็น String
                  isCorrect: Boolean(opt.isCorrect) // บังคับเป็น Boolean
                }))
              }
            }))
          }
        },
        include: {
          questions: {
            include: {
              options: true
            }
          }
        }
      });
    });

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('[QUIZ_SAVE_ERROR]:', error);
    return NextResponse.json(
      { error: error.message || "Internal Database Error" },
      { status: 500 }
    );
  }
}