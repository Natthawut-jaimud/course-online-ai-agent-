import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // 1. ตรวจสอบการเข้าสู่ระบบ
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized: กรุณาเข้าสู่ระบบก่อนทำรายการ" }, 
        { status: 401 }
      );
    }

    // Cast session user to include role and id
    const userRole = (session.user as any).role;
    const userId = (session.user as any).id;

    // 2. ตรวจสอบสิทธิ์ (Role Based Access Control)
    if (userRole !== "INSTRUCTOR" && userRole !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: คุณไม่มีสิทธิ์สร้างคอร์สเรียน (เฉพาะผู้สอนเท่านั้น)" }, 
        { status: 403 }
      );
    }

    // 3. ดำเนินการสร้างคอร์ส
    const body = await req.json();
    const { title, description, price, imageUrl } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // 4. บันทึกลงฐานข้อมูลจริง (Prisma)
    const newCourse = await prisma.course.create({
      data: {
        title,
        description,
        price: price ? parseFloat(price) : 0,
        imageUrl: imageUrl || null,
        instructorId: userId,
        isPublished: false, // Default เป็นฉบับร่าง
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: "สร้างคอร์สสำเร็จ!",
      courseId: newCourse.id 
    }, { status: 201 });

  } catch (error) {
    console.error("API Create Course Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
