import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import CertificateViewer from "@/components/CertificateViewer";

export default async function CourseCertificatePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const userId = (session.user as any).id;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: { select: { name: true } },
      sections: {
        where: { isPublished: true },
        include: {
          lessons: {
            where: { isPublished: true },
            select: { id: true }
          }
        }
      }
    }
  });

  if (!course) {
    notFound();
  }

  // 1. Verify Completion
  const allLessonIds = course.sections.flatMap(s => s.lessons).map(l => l.id);
  const completedCount = await prisma.progress.count({
    where: {
      userId,
      lessonId: { in: allLessonIds },
      completed: true
    }
  });

  if (completedCount < allLessonIds.length && allLessonIds.length > 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-200 text-center max-w-lg">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">⚠️</div>
          <h1 className="text-2xl font-black text-slate-900 mb-4 tracking-tight text-center">Access Denied</h1>
          <p className="text-slate-500 font-medium mb-8">
            You must complete all lessons to view your certificate. 
            Currently: {completedCount} / {allLessonIds.length} lessons completed.
          </p>
          <a 
            href={`/courses/${courseId}`}
            className="inline-block px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
          >
            Go Back to Course
          </a>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 py-12 px-4">
      <CertificateViewer 
        studentName={session.user?.name || session.user?.email || "Student"} 
        courseTitle={course.title} 
      />
    </main>
  );
}
