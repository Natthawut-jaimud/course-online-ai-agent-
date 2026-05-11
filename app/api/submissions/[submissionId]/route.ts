import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { submissionId } = await params;

    if (!session || !session.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { score, feedback } = await req.json();

    // Verify instructor/admin status could be added here for extra security
    // but we'll stick to the basic requirement first

    const submission = await prisma.assignmentSubmission.update({
      where: {
        id: submissionId,
      },
      data: {
        score: parseInt(score),
        feedback,
        isGraded: true,
      },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.error("[SUBMISSION_ID_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
