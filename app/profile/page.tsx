import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import ProfileEditForm from "@/components/ProfileEditForm";
import ProfileImageUpload from "@/components/ProfileImageUpload";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  const userId = (session.user as any).id;

  // Fetch enrollments and course data
  const enrollments = await prisma.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          instructor: { select: { name: true } },
          sections: {
            include: {
              lessons: { select: { id: true, title: true } }
            }
          }
        }
      }
    }
  });

  // Fetch all completed progresses for percentage calculation
  const userProgress = await prisma.progress.findMany({
    where: { userId, completed: true }
  });

  const completedLessonIds = userProgress.map(p => p.lessonId);

  // Fetch existing certificates
  const certificates = await prisma.certificate.findMany({
    where: { userId }
  });

  // Fetch graded assignments
  const gradedSubmissions = await prisma.assignmentSubmission.findMany({
    where: {
      userId: userId,
      isGraded: true
    },
    include: {
      lesson: {
        include: {
          section: {
            include: {
              course: true
            }
          }
        }
      }
    },
    orderBy: { updatedAt: 'desc' }
  });

  const enrolledCourses = enrollments.map(enrollment => {
    const allLessons = enrollment.course.sections.flatMap(s => s.lessons);
    const totalLessons = allLessons.length;
    const completedInThisCourse = allLessons.filter(l => completedLessonIds.includes(l.id)).length;
    const percentage = totalLessons > 0 ? Math.round((completedInThisCourse / totalLessons) * 100) : 0;
    
    const nextLesson = allLessons.find(l => !completedLessonIds.includes(l.id)) || allLessons[0];
    const cert = certificates.find(c => c.courseId === enrollment.courseId);

    return {
      ...enrollment.course,
      percentage,
      totalLessons,
      completedCount: completedInThisCourse,
      nextLessonId: nextLesson?.id,
      certificateId: cert?.certificateId
    };
  });

  const totalCertificates = enrolledCourses.filter(c => c.percentage === 100).length;

  return (
    <main className="min-h-screen bg-[#f8f7ff] pb-20">
      {/* Top Background Banner */}
      <div className="h-64 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-500/10 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-end pb-12 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-6 w-full">
            {/* Avatar */}
            <ProfileImageUpload 
              currentImage={session.user?.image || null} 
              userName={session.user?.name} 
            />
            
            <div className="flex-1 text-center md:text-left space-y-2">
              <div className="flex flex-col md:flex-row items-center md:items-baseline gap-3">
                <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">{session.user?.name}</h1>
                <span className="px-3 py-1 bg-purple-500/20 backdrop-blur-md border border-purple-400/30 text-purple-200 text-[10px] font-bold rounded-full uppercase tracking-widest">
                  {(session.user as any).role || 'STUDENT'}
                </span>
              </div>
              <p className="text-slate-300 font-medium">{session.user?.email}</p>
            </div>

            <div className="flex gap-3">
               <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl text-center">
                 <span className="block text-2xl font-black text-white">{enrolledCourses.length}</span>
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">คอร์สเรียน</span>
               </div>
               <div className="bg-white/10 backdrop-blur-md border border-white/10 px-6 py-3 rounded-2xl text-center">
                 <span className="block text-2xl font-black text-emerald-400">{totalCertificates}</span>
                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">ใบประกาศ</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden break-words">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">ตั้งค่าบัญชีผู้ใช้</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">อีเมล</label>
                  <p className="text-sm font-medium text-slate-700 break-all">{session.user?.email}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">บทบาท</label>
                  <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-lg uppercase">
                    {(session.user as any).role || 'STUDENT'}
                  </span>
                </div>
              </div>

              <hr className="my-6 border-slate-100" />

              <div className="space-y-6">
                <ProfileEditForm initialName={session.user?.name || ""} />
              </div>
            </div>

            {(session.user as any).role !== 'STUDENT' && (
              <Link href="/instructor" className="group flex items-center justify-between p-6 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Instructor Mode</p>
                  <p className="text-lg font-black">จัดการคอร์สเรียน</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
              </Link>
            )}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <div className="w-2 h-8 bg-purple-600 rounded-full"></div>
                  ความคืบหน้าการเรียนของคุณ
                </h2>
              </div>

              {enrolledCourses.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 text-4xl">📚</div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">ยังไม่มีคอร์สเรียน</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">เริ่มต้นการเดินทางของคุณวันนี้ด้วยการสำรวจคอร์สเรียนระดับโลกของเรา</p>
                  <Link href="/#courses" className="inline-block px-10 py-4 bg-purple-600 text-white rounded-xl font-black text-sm hover:bg-purple-700 transition-all shadow-xl shadow-purple-600/20">
                    เลือกดูคอร์สเรียน
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {enrolledCourses.map((course) => (
                    <div key={course.id} className="group flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full">
                      <Link href={course.nextLessonId ? `/courses/${course.id}/lessons/${course.nextLessonId}` : `/courses/${course.id}`} className="flex flex-col flex-grow cursor-pointer">
                        {/* Image Container (Strict 16:9 Aspect Ratio) */}
                        <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
                          {course.imageUrl ? (
                            <img 
                              src={course.imageUrl} 
                              alt={course.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-full h-full text-slate-400 font-bold">No Image</div>
                          )}
                          {/* Status Badge */}
                          <div className={`absolute top-2 right-2 backdrop-blur-sm px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase shadow-sm ${course.percentage === 100 ? 'bg-emerald-500/90 text-white' : 'bg-white/90 text-purple-700'}`}>
                            {course.percentage === 100 ? 'เสร็จสิ้น' : 'กำลังเรียน'}
                          </div>
                        </div>

                        {/* Content Container */}
                        <div className="p-4 flex flex-col flex-grow">
                          <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-1 group-hover:text-purple-700 transition-colors leading-snug">
                            {course.title}
                          </h3>
                          <p className="text-[10px] font-bold text-slate-400 mb-4 line-clamp-1 uppercase tracking-wider">
                            ผู้สอน: {course.instructor?.name || "Platform Instructor"}
                          </p>

                          {/* Progress Bar (Pushed to bottom) */}
                          <div className="mt-auto pt-4 border-t border-slate-100">
                            <div className="flex justify-between items-center text-[10px] font-black text-slate-600 mb-2 uppercase tracking-tight">
                              <span>เรียนไปแล้ว {course.percentage}%</span>
                              <span>{course.completedCount} / {course.totalLessons} บทเรียน</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-1000 ${course.percentage === 100 ? 'bg-emerald-500' : 'bg-purple-600'}`}
                                style={{ width: `${course.percentage}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </Link>

                      {/* Certificate Button Area */}
                      <div className="px-4 pb-4">
                        {/* Certificate Button */}
                        <div className="mt-4">
                          {course.percentage === 100 ? (
                            <Link 
                              href={`/courses/${course.id}/certificate`} 
                              className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-amber-400 to-amber-600 text-white rounded-lg font-bold shadow-md hover:from-amber-500 hover:to-amber-700 transition-all"
                            >
                              🎓 รับใบประกาศนียบัตร
                            </Link>
                          ) : (
                            <div className="flex items-center justify-center gap-2 w-full py-2 bg-slate-100 text-slate-400 rounded-lg font-medium cursor-not-allowed text-sm">
                              🔒 เรียนให้จบ 100% เพื่อรับใบเซอร์
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Graded Assignments Section */}
              {gradedSubmissions.length > 0 && (
                <div className="mt-12 pt-10 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">📝 ผลการตรวจการบ้าน</h2>
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                        {gradedSubmissions.length} รายการ
                      </span>
                    </div>
                  </div>
                  
                  {/* Scrollable Container */}
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {gradedSubmissions.map((sub) => (
                      <div key={sub.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition-all gap-4 group">
                        
                        {/* Left: Icon & Info */}
                        <div className="flex items-start gap-4 w-full sm:w-3/4">
                          <div className="flex-shrink-0 mt-0.5 w-8 h-8 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xs shadow-inner">
                            ✅
                          </div>
                          <div className="w-full overflow-hidden">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5 truncate">
                              {sub.lesson.section.course.title}
                            </p>
                            <h4 className="text-sm font-black text-slate-900 truncate">{sub.lesson.title}</h4>
                            <p className="text-xs text-slate-500 mt-1 truncate group-hover:whitespace-normal transition-all font-medium">
                              <span className="font-black text-slate-400 uppercase text-[9px] tracking-widest">💬 Feedback: </span> 
                              {sub.feedback || "-"}
                            </p>
                          </div>
                        </div>

                        {/* Right: Score & Link */}
                        <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center w-full sm:w-auto border-t sm:border-t-0 border-slate-200 pt-3 sm:pt-0 pl-12 sm:pl-0 flex-shrink-0">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-emerald-600 tabular-nums">{sub.score}</span>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">คะแนน</span>
                          </div>
                          <Link 
                            href={`/courses/${sub.lesson.section.courseId}/lessons/${sub.lessonId}`} 
                            className="text-[10px] font-black text-purple-600 hover:text-purple-800 uppercase tracking-widest mt-1 flex items-center gap-1 group-hover:gap-2 transition-all"
                          >
                            ดูงาน 
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          </Link>
                        </div>
                        
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
