import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import CourseEnrollButton from "./CourseEnrollButton";
import ReviewSection from "@/components/ReviewSection";

export default async function CourseDetailsPage({ params }: { params: Promise<{ courseId: string }> | { courseId: string } }) {
  const resolvedParams = await params;
  const courseId = resolvedParams.courseId;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string })?.id;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: {
        select: { name: true, image: true }
      },
      sections: {
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            orderBy: { position: 'asc' }
          }
        }
      },
      reviews: {
        include: {
          user: { select: { name: true, image: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!course) {
    notFound();
  }

  // คำนวณจำนวนบทเรียนทั้งหมด
  const totalLessons = course.sections.reduce((acc, section) => acc + section.lessons.length, 0);
  const isOwner = userId === course.instructorId;

  // Check enrollment
  const enrollment = userId ? await prisma.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId }
    }
  }) : null;

  const existingReview = course.reviews.find(r => r.userId === userId);
  const averageRating = course.reviews.length > 0 
    ? (course.reviews.reduce((acc, r) => acc + r.rating, 0) / course.reviews.length).toFixed(1)
    : "ใหม่";

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 skew-x-12 transform translate-x-20"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-600/30 rounded-full text-xs font-black uppercase tracking-widest">
                  คอร์สเรียนยอดนิยม
                </span>
                <div className="flex items-center gap-1.5 text-yellow-400 font-bold">
                  <span>★ {averageRating}</span>
                  <span className="text-slate-400 text-xs">({course.reviews.length} รีวิว)</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tight">
                {course.title}
              </h1>
              
              <p className="text-xl text-slate-300 max-w-xl leading-relaxed">
                {course.description || "ไม่มีรายละเอียดสำหรับคอร์สนี้"}
              </p>
              
              <div className="flex items-center gap-4 pt-4 border-t border-slate-800 w-fit">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-2xl shadow-xl">
                  {course.instructor.name?.[0] || "U"}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">ผู้สอนหลัก</p>
                  <p className="text-lg font-bold text-white">{course.instructor.name || "ผู้สอนไม่ระบุชื่อ"}</p>
                </div>
              </div>

              <div className="pt-8 flex flex-col sm:flex-row gap-4">
                {isOwner ? (
                  <>
                    <Link href={`/instructor/courses/${course.id}`} className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-600/20 text-center">
                      จัดการคอร์สของคุณ
                    </Link>
                    <Link 
                      href={`/courses/${course.id}/analytics`} 
                      className="px-10 py-4 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-purple-600/20 text-center flex items-center justify-center gap-2"
                    >
                      📊 ดูคะแนนนักเรียน
                    </Link>
                    <Link 
                      href={`/courses/${course.id}/assignments`} 
                      className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-600/20 text-center flex items-center justify-center gap-2"
                    >
                      📝 ตรวจการบ้านนักเรียน
                    </Link>
                  </>
                ) : enrollment ? (
                  <Link 
                    href={`/courses/${course.id}/lessons/${course.sections[0]?.lessons[0]?.id || ""}`} 
                    className="px-10 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-emerald-600/20 text-center flex items-center justify-center gap-2"
                  >
                    เข้าสู่บทเรียน <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </Link>
                ) : (
                  <CourseEnrollButton courseId={courseId} price={course.price || 0} />
                )}
              </div>
            </div>

            {/* Preview Card */}
            <div className="relative group">
              <div className="absolute inset-0 bg-blue-600 rounded-3xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-800 group-hover:scale-[1.02] transition-transform duration-500">
                {course.imageUrl ? (
                  <img src={course.imageUrl} alt={course.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                    <svg className="w-24 h-24 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum & Reviews */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {/* Curriculum */}
            <div className="space-y-8">
              <div>
                <h2 className="text-3xl font-black text-slate-900 mb-2 tracking-tight">เนื้อหาหลักสูตร</h2>
                <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">{course.sections.length} หมวดหมู่ • {totalLessons} บทเรียน</p>
              </div>

              <div className="space-y-4">
                {course.sections.map((section, index) => (
                  <div key={section.id} className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-5 bg-slate-50/50 flex justify-between items-center border-b border-slate-50">
                      <h3 className="font-black text-slate-800">บทที่ {index + 1}: {section.title}</h3>
                      <span className="text-[10px] font-black text-slate-400 uppercase">{section.lessons.length} บทเรียน</span>
                    </div>
                    
                    <div className="divide-y divide-slate-50">
                      {section.lessons.map((lesson, lIndex) => {
                        const canAccess = lesson.isFree || !!enrollment || isOwner;
                        const Content = (
                          <div className={`p-4 flex items-center justify-between transition-colors ${canAccess ? 'hover:bg-purple-50/50 cursor-pointer' : 'opacity-50'}`}>
                            <div className="flex items-center gap-5">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${canAccess ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-400'}`}>
                                {lIndex + 1}
                              </div>
                              <div>
                                <p className={`font-bold ${canAccess ? 'text-slate-900' : 'text-slate-500'}`}>{lesson.title}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase">
                                    {lesson.type}
                                  </span>
                                  {lesson.isFree && (
                                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-wider">ดูฟรี</span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              {canAccess ? (
                                <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                                </div>
                              ) : (
                                <svg className="w-5 h-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                              )}
                            </div>
                          </div>
                        );

                        return canAccess ? (
                          <Link key={lesson.id} href={`/courses/${course.id}/lessons/${lesson.id}`}>{Content}</Link>
                        ) : (
                          <div key={lesson.id} className="cursor-not-allowed">{Content}</div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reviews Section */}
            <div className="pt-8 border-t border-slate-200">
              <ReviewSection 
                courseId={course.id} 
                existingReview={existingReview} 
                allReviews={course.reviews} 
                isEnrolled={!!enrollment} 
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
