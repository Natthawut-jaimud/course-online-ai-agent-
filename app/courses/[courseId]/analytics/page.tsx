import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

interface AnalyticsPageProps {
  params: Promise<{
    courseId: string;
  }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { courseId } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      sections: {
        include: {
          lessons: {
            where: { type: "QUIZ" },
          }
        }
      }
    }
  });

  if (!course) {
    notFound();
  }

  // Authorization check
  const isInstructor = course.instructorId === userId || userRole === "ADMIN";
  
  if (!isInstructor) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <h1 className="text-4xl font-black text-slate-900 mb-4">403 Forbidden</h1>
        <p className="text-slate-500 font-medium mb-8 text-center max-w-md">
          ขออภัย คุณไม่มีสิทธิ์ในการเข้าถึงหน้านี้ เฉพาะผู้สอนและผู้ดูแลระบบเท่านั้นที่สามารถดูรายงานผลคะแนนได้
        </p>
        <Link 
          href={`/courses/${courseId}`}
          className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg active:scale-95"
        >
          กลับสู่หน้าคอร์สเรียน
        </Link>
      </div>
    );
  }

  // Fetch Quiz Lessons specifically
  const quizLessons = course.sections.flatMap(s => s.lessons);
  const quizLessonIds = quizLessons.map(l => l.id);

  // Fetch Progress for these quiz lessons
  const allProgress = await prisma.progress.findMany({
    where: {
      lessonId: { in: quizLessonIds }
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          image: true
        }
      },
      lesson: {
        select: {
          title: true
        }
      }
    },
    orderBy: {
      updatedAt: 'desc'
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <Link 
              href={`/courses/${courseId}`}
              className="flex items-center gap-2 text-sm font-medium text-purple-600 hover:text-purple-800 mb-6"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
              กลับสู่หน้าคอร์สเรียน
            </Link>
            <h1 className="text-3xl font-extrabold text-slate-900">รายงานผลคะแนนนักเรียน</h1>
            <p className="text-slate-500 font-medium mt-2">คอร์ส: {course.title}</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
            <div className="bg-purple-100 text-purple-700 w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold">
              {quizLessons.length}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Total Quizzes</p>
              <p className="text-sm font-bold text-slate-900">จำนวนชุดข้อสอบในคอร์สนี้</p>
            </div>
          </div>
        </div>

        {/* Analytics Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden mt-8">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
             <h2 className="text-lg font-bold text-slate-800">รายชื่อนักเรียนและผลคะแนน</h2>
             <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                {allProgress.length} Submissions
             </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Student</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Quiz Name</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">Score / Result</th>
                  <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-right">Last Attempt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allProgress.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16">
                       <div className="flex flex-col items-center justify-center text-slate-400 font-medium">
                          ยังไม่มีนักเรียนมาทำข้อสอบในขณะนี้
                       </div>
                    </td>
                  </tr>
                ) : (
                  allProgress.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold shadow-sm">
                             {p.user.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{p.user.name || "Anonymous Student"}</p>
                            <p className="text-xs font-medium text-slate-400">{p.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-700">{p.lesson.title}</p>
                      </td>
                      <td className="px-8 py-5">
                        {p.score !== null ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold border border-emerald-100 shadow-sm">
                              {p.score} Points
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 italic">Not taken yet</span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <p className="text-xs font-bold text-slate-500">
                          {p.updatedAt.toLocaleDateString('th-TH', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
