import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return new NextResponse("User ID is required", { status: 400 });
    }

    // Manual Cascading Delete: Delete all related records before deleting the user
    // This avoids foreign key constraint errors
    await prisma.$transaction([
      prisma.account.deleteMany({ where: { userId } }),
      prisma.session.deleteMany({ where: { userId } }),
      prisma.enrollment.deleteMany({ where: { userId } }),
      prisma.progress.deleteMany({ where: { userId } }),
      prisma.certificate.deleteMany({ where: { userId } }),
      prisma.review.deleteMany({ where: { userId } }),
      prisma.assignmentSubmission.deleteMany({ where: { userId } }),
      // Note: We don't delete courses if the user is an instructor, 
      // as courses might have other students' data. 
      // If the user MUST be deleted, their courses will be deleted by Prisma Cascade if configured,
      // but here we follow the safest manual path for student-related data.
      prisma.user.delete({
        where: {
          id: userId,
        },
      }),
    ]);

    return new NextResponse("User deleted", { status: 200 });
  } catch (error) {
    console.log("[USER_DELETE_ERROR]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
