import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { courseId, lessonId } = await params;

    // ตรวจสอบความเป็นเจ้าของคอร์ส
    const course = await prisma.course.findUnique({
      where: {
        id: courseId,
        instructorId: userId,
      },
    });

    if (!course) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const lesson = await prisma.lesson.delete({
      where: {
        id: lessonId,
      },
    });

    return NextResponse.json(lesson);
  } catch (error) {
    console.error("[LESSON_ID_DELETE]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
