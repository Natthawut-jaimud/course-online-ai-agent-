import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !(session.user as any)?.id) {
      return NextResponse.json({ error: "Unauthorized: กรุณาเข้าสู่ระบบ" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();
    const { name, image } = body;

    const updateData: any = {};
    if (name !== undefined) {
      if (name.trim() === "") {
        return NextResponse.json({ error: "ชื่อไม่สามารถเว้นว่างได้" }, { status: 400 });
      }
      updateData.name = name.trim();
    }
    
    if (image !== undefined) {
      updateData.image = image;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "ไม่มีข้อมูลให้อัปเดต" }, { status: 400 });
    }

    // Update user in the database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "อัปเดตโปรไฟล์สำเร็จ",
      user: {
        name: updatedUser.name,
        image: updatedUser.image,
      },
    });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
