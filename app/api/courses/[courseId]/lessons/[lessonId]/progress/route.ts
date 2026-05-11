import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export const dynamic = 'force-dynamic';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  try {
    const { courseId, lessonId } = await params;
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { isCompleted } = await req.json();

    // บันทึกข้อมูลลงฐานข้อมูลโดยตรง (ใช้ชื่อฟิลด์ completed ตาม schema จริง)
    const userProgress = await prisma.progress.upsert({
      where: {
        userId_lessonId: { userId, lessonId }
      },
      update: {
        completed: !!isCompleted
      },
      create: {
        userId,
        lessonId,
        completed: !!isCompleted
      }
    });

    // ล้าง Cache ของ Next.js อย่างเด็ดขาดเพื่อให้ UI อัปเดตทันที
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/lessons/${lessonId}`);
    revalidatePath("/profile");

    return NextResponse.json(userProgress);
  } catch (error) {
    // ส่ง 500 แบบเงียบๆ ไม่ให้หน้าเว็บพัง
    return new NextResponse("Internal Error", { status: 500 });
  }
}
