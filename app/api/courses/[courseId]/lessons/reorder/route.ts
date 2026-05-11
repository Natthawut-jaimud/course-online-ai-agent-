import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { courseId } = await params;
    const { list } = await req.json(); // [{ id: string, position: number }, ...]

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

    // ทำ Bulk Update
    const updates = list.map((item: { id: string; position: number }) => 
      prisma.lesson.update({
        where: { id: item.id },
        data: { position: item.position }
      })
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[REORDER_PUT]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
