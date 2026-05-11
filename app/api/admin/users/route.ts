import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = (session.user as any).role;
    
    // สำคัญมาก: ป้องกันไม่ให้ Role อื่นเข้าถึง
    if (userRole !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: ต้องเป็นผู้ดูแลระบบเท่านั้น" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, newRole } = body;

    if (!userId || !newRole) {
      return NextResponse.json({ error: "ข้อมูลไม่ครบถ้วน" }, { status: 400 });
    }

    // อัปเดต Role ใน Database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    return NextResponse.json({ 
      success: true, 
      message: "อัปเดตสิทธิ์สำเร็จ",
      user: { id: updatedUser.id, role: updatedUser.role }
    });
  } catch (error) {
    console.error("Admin Update Role Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
