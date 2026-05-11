import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนลงทะเบียน" }, { status: 401 });
    }

    const { courseId } = await params;

    // ตรวจสอบว่าคอร์สนี้มีอยู่จริงหรือไม่
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: "ไม่พบคอร์สเรียนนี้" }, { status: 404 });
    }

    // ตรวจสอบว่าเคยลงทะเบียนไปแล้วหรือยัง
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json({ error: "คุณลงทะเบียนคอร์สนี้ไปแล้ว" }, { status: 400 });
    }

    // สร้างการลงทะเบียนใหม่ (Enrollment)
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: "ลงทะเบียนสำเร็จ!",
      enrollment 
    }, { status: 201 });

  } catch (error) {
    console.error("Enrollment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
