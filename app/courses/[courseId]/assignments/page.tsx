import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import GradeAssignmentModal from "@/components/GradeAssignmentModal";

export default async function AssignmentReviewPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    redirect("/login");
  }

  const userId = (session.user as any).id;
  const userRole = (session.user as any).role;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { instructorId: true, title: true }
  });

  if (!course) {
    notFound();
  }

  const isInstructor = course.instructorId === userId || userRole === "ADMIN";

  if (!isInstructor) {
    redirect("/");
  }

  const submissions = await prisma.assignmentSubmission.findMany({
    where: {
      lesson: {
        section: {
          courseId: courseId
        }
      }
    },
    include: {
      user: {
        select: { name: true, email: true }
      },
      lesson: {
        select: { title: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link 
              href={`/courses/${courseId}`}
              className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              กลับสู่หน้าคอร์ส
            </Link>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">รายการส่งการบ้าน (Assignment Submissions)</h1>
            <p className="text-slate-500 font-medium">{course.title}</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm text-center">
            <span className="block text-2xl font-black text-slate-900">{submissions.length}</span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Submissions</span>
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">นักเรียน</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">ชื่องาน / บทเรียน</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">เนื้อหาที่ส่ง</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">สถานะ</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">วันที่ส่ง</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">แอคชัน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {submissions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                      ยังไม่มีนักเรียนส่งการบ้านในคอร์สนี้
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="font-black text-slate-900">{sub.user.name || "ไม่ระบุชื่อ"}</p>
                        <p className="text-xs text-slate-400 font-medium">{sub.user.email}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm font-bold text-slate-700">{sub.lesson.title}</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="max-w-xs">
                          <p className="text-sm text-slate-600 line-clamp-1 italic">
                            {sub.content || "ไม่มีเนื้อหาข้อความ"}
                          </p>
                          {sub.fileUrl && (
                            <a 
                              href={sub.fileUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest mt-1"
                            >
                              📎 ดูไฟล์แนบ
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        {sub.isGraded ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-700 uppercase tracking-wider w-fit">
                              Graded
                            </span>
                            <span className="text-xs font-bold text-slate-500 mt-1">{sub.score} / 100</span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-700 uppercase tracking-wider">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-sm text-slate-500 font-medium">
                          {new Date(sub.createdAt).toLocaleDateString('th-TH')}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <GradeAssignmentModal submission={sub} />
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
