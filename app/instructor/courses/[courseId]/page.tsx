import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import CourseBuilder from "@/components/CourseBuilder";

export default async function CourseManagementPage({ params }: { params: Promise<{ courseId: string }> | { courseId: string } }) {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/");
  
  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;
  
  if (userRole !== "INSTRUCTOR" && userRole !== "ADMIN") {
    redirect("/");
  }

  // Await params object for Next.js 15 compatibility
  const resolvedParams = await params;
  const courseId = resolvedParams.courseId;

  // ดึงข้อมูล Course พร้อม Section และ Lesson
  const course = await prisma.course.findUnique({
    where: { 
      id: courseId,
      // Only allow owner or admin
      ...(userRole === "ADMIN" ? {} : { instructorId: userId })
    },
    include: {
      sections: {
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            orderBy: { position: 'asc' }
          }
        }
      }
    }
  });

  if (!course) {
    redirect("/instructor");
  }

  return (
    <div className="min-h-screen bg-[#f8f7ff] py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Redesign */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <Link href="/instructor" className="p-3 rounded-2xl bg-white text-slate-400 hover:bg-purple-50 hover:text-purple-600 transition-all shadow-sm border border-slate-100">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">จัดการคอร์สเรียน</h1>
              <p className="text-slate-500 font-medium mt-1">ตั้งค่ารายละเอียดและโครงสร้างเนื้อหาบทเรียน</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center px-4 py-2 bg-white rounded-full border border-slate-100 shadow-sm">
              {course.isPublished ? (
                <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  เผยแพร่แล้ว
                </span>
              ) : (
                <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
                  <span className="w-2 h-2 bg-slate-300 rounded-full" />
                  ฉบับร่าง
                </span>
              )}
            </div>
            
            <Link 
              href={`/courses/${course.id}`} 
              target="_blank"
              className="px-6 py-3 bg-purple-900 text-white text-sm font-extrabold rounded-full hover:bg-black transition-all shadow-lg shadow-purple-100 flex items-center gap-2 uppercase tracking-wider"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              ดูหน้าคอร์สแบบผู้เรียน
            </Link>
          </div>
        </div>

        {/* Client Component สำหรับจัดการ UI แบบ Interactive */}
        <CourseBuilder initialCourse={course} />

      </div>
    </div>
  );
}
