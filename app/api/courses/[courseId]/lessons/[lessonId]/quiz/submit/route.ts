import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { lessonId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    const body = await req.json();
    const { answers } = body;

    if (!answers) return new NextResponse('Missing answers', { status: 400 });

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId },
      include: { questions: { include: { options: true } } }
    });

    if (!quiz) return new NextResponse('Quiz not found', { status: 404 });

    let score = 0;
    const total = quiz.questions.length;

    quiz.questions.forEach((question) => {
      const submittedOptionId = answers[question.id];
      const correctOption = question.options.find(opt => opt.isCorrect);
      if (correctOption && submittedOptionId === correctOption.id) {
        score += 1;
      }
    });

    // 🌟 แก้ตรงจุด: เปลี่ยนวิธีบันทึก Progress ให้ปลอดภัย 100%
    const existingProgress = await prisma.progress.findFirst({
      where: { userId: userId, lessonId: lessonId }
    });

    if (existingProgress) {
      await prisma.progress.update({
        where: { id: existingProgress.id },
        data: { completed: true, score: score } // <-- Added score
      });
    } else {
      await prisma.progress.create({
        data: { userId: userId, lessonId: lessonId, completed: true, score: score } // <-- Added score
      });
    }

    return NextResponse.json({ score, total });

  } catch (error: any) {
    console.error('[QUIZ_SUBMIT_ERROR]', error);
    // 🌟 บังคับให้คาย Error ตัวจริงออกมาโชว์ จะได้รู้ว่าพังที่ไหนถ้ามีปัญหาอีก
    return new NextResponse(error.message || String(error), { status: 500 });
  }
}