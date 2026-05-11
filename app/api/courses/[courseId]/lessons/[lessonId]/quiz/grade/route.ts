import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; lessonId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { lessonId } = params;
    const body = await req.json();
    const { submissions } = body as { 
      submissions: { questionId: string; optionId: string }[] 
    };

    if (!submissions || !Array.isArray(submissions)) {
      return new NextResponse("Invalid submissions", { status: 400 });
    }

    // 1. Fetch the quiz and its questions/options for this lesson
    const quiz = await prisma.quiz.findUnique({
      where: {
        lessonId: lessonId,
      },
      include: {
        questions: {
          include: {
            options: true,
          },
        },
      },
    });

    if (!quiz) {
      return new NextResponse("Quiz not found", { status: 404 });
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    // 2. Grade the submissions
    quiz.questions.forEach((question) => {
      const userSubmission = submissions.find((s) => s.questionId === question.id);
      const correctOption = question.options.find((o) => o.isCorrect);

      if (userSubmission && correctOption && userSubmission.optionId === correctOption.id) {
        correctCount++;
      }
    });

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const isPassed = score >= 80; // Threshold of 80%

    // 3. Optional: Update user progress with the quiz score
    // We update the Progress model for this user and lesson
    await prisma.progress.upsert({
      where: {
        userId_lessonId: {
          userId: session.user.id,
          lessonId: lessonId,
        },
      },
      update: {
        quizScore: correctCount,
        quizTotal: totalQuestions,
        score: score,
        completed: isPassed ? true : undefined, // Mark as completed if passed
      },
      create: {
        userId: session.user.id,
        lessonId: lessonId,
        quizScore: correctCount,
        quizTotal: totalQuestions,
        score: score,
        completed: isPassed,
      },
    });

    return NextResponse.json({
      score,
      correctCount,
      totalQuestions,
      isPassed,
    });
  } catch (error) {
    console.error("[QUIZ_GRADE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
