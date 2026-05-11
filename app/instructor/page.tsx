import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function InstructorDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session) redirect("/");
  
  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;
  
  if (userRole !== "INSTRUCTOR" && userRole !== "ADMIN") {
    redirect("/");
  }

  // ดึงข้อมูลคอร์สที่ผู้ใช้นี้เป็นคนสร้าง
  const courses = await prisma.course.findMany({
    where: { instructorId: userId },
    orderBy: { createdAt: 'desc' }
  });
  
  return (
    <div className="min-h-screen bg-[#f9f8ff] py-10 px-6 md:px-10">
      <div className="max-w-7xl mx-auto">
        {/* Header Redesign */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              👨‍🏫 จัดการคอร์สเรียนของคุณ
            </h1>
            <p className="text-slate-500 mt-2 font-medium">สร้างและจัดการเนื้อหาการสอนของคุณได้ที่นี่</p>
          </div>
          <Link href="/instructor/create" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:to-indigo-700 text-white px-8 py-3.5 rounded-xl font-black shadow-lg shadow-purple-200 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            สร้างคอร์สใหม่
          </Link>
        </div>
        
        {/* Course List Container */}
        {courses.length === 0 ? (
          /* Empty State */
          <div className="text-center py-24 px-6 bg-white rounded-3xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
            <div className="mx-auto h-24 w-24 bg-purple-50 rounded-full flex items-center justify-center mb-6 border border-purple-100">
              <span className="text-5xl">📚</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-800">คุณยังไม่มีคอร์สเรียน</h3>
            <p className="mt-3 text-slate-500 max-w-sm mx-auto font-medium">เริ่มต้นสร้างคอร์สแรกของคุณเลย! เพื่อแบ่งปันความรู้และสร้างรายได้จากการสอน</p>
            <div className="mt-10">
              <Link href="/instructor/create" className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-purple-200 transition-all inline-block hover:scale-105">
                เริ่มต้นสร้างคอร์สแรกเลย
              </Link>
            </div>
          </div>
        ) : (
          /* Course Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {courses.map(course => (
              <div key={course.id} className="group bg-white rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                {/* Course Image */}
                <div className="h-52 bg-slate-100 relative w-full overflow-hidden">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-300 bg-gradient-to-br from-slate-50 to-slate-100">
                      <span className="text-6xl opacity-50">📖</span>
                    </div>
                  )}
                  
                  {/* Status Badges - Pill style */}
                  <div className="absolute top-4 right-4">
                    {course.isPublished ? (
                      <span className="bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-2">
                        <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        เผยแพร่แล้ว
                      </span>
                    ) : (
                      <span className="bg-slate-800 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-2">
                        <span className="w-2 h-2 bg-slate-400 rounded-full" />
                        ฉบับร่าง
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Course Info */}
                <div className="p-7 flex flex-col flex-grow">
                  <h3 className="text-lg font-bold text-slate-800 mb-2 line-clamp-1 group-hover:text-purple-600 transition-colors leading-tight mt-2">
                    {course.title}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mb-6 flex-grow font-medium leading-relaxed">
                    {course.description || "ยังไม่มีรายละเอียดประกอบคอร์สเรียนนี้"}
                  </p>
                  
                  <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center">
                    <span className={`text-xl font-extrabold ${!course.price ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {course.price ? `฿${course.price.toLocaleString()}` : 'เรียนฟรี'}
                    </span>
                    <div className="flex gap-4">
                      <Link href={`/courses/${course.id}`} target="_blank" className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest">
                        ดูตัวอย่าง
                      </Link>
                      <Link href={`/instructor/courses/${course.id}`} className="text-[10px] font-bold text-purple-600 hover:text-purple-800 transition-colors flex items-center gap-1 uppercase tracking-widest">
                        จัดการคอร์ส <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
