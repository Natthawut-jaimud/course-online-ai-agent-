import prisma from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { toggleProgress } from "@/actions/course";
import VideoPlayer from "@/components/VideoPlayer";
import MarkCompleteButton from "@/components/MarkCompleteButton";
import QuizPlayer from "@/components/QuizPlayer";
import QuizEditor from "@/components/QuizEditor";
import AssignmentPlayer from "@/components/AssignmentPlayer";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface LessonPageProps {
  params: Promise<{
    courseId: string;
    lessonId: string;
  }>;
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { courseId, lessonId } = await params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  const userRole = (session?.user as any)?.role;

  const course = await prisma.course.findUnique({
    where: { id: courseId },
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
    notFound();
  }

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: true
    }
  });

  if (!lesson || lesson.section.courseId !== courseId) {
    notFound();
  }

  // Check access
  const enrollment = userId ? await prisma.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId,
        courseId
      }
    }
  }) : null;

  const isInstructor = course.instructorId === userId || userRole === "ADMIN";
  const hasAccess = lesson.isFree || !!enrollment || isInstructor;

  if (!hasAccess) {
    redirect(`/courses/${courseId}`);
  }

  // Fetch all progresses for this user in this course
  const userProgresses = userId ? await prisma.progress.findMany({
    where: {
      userId,
      lesson: {
        section: {
          courseId
        }
      }
    }
  }) : [];

  const completedLessonIds = userProgresses.filter(p => p.completed).map(p => p.lessonId);
  const isCurrentLessonCompleted = completedLessonIds.includes(lessonId);
  const currentProgress = userProgresses.find(p => p.lessonId === lessonId);
  const initialWatchTime = currentProgress?.watchTime || 0;

  // Fetch assignment submission if applicable
  const currentAssignment = (userId && lesson.type === "ASSIGNMENT") ? await prisma.assignmentSubmission.findUnique({
    where: {
      userId_lessonId: {
        userId,
        lessonId
      }
    }
  }) : null;

  // Calculate Course Progress
  const allLessons = course.sections.flatMap(s => s.lessons);
  const totalLessonsCount = allLessons.length;
  const completedCount = completedLessonIds.length;
  const progressPercentage = totalLessonsCount > 0 ? Math.round((completedCount / totalLessonsCount) * 100) : 0;

  // Helper function to extract YouTube ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = lesson.videoUrl ? getYouTubeId(lesson.videoUrl) : null;

  // Helper function to prepare PDF/Embed URL (especially for Google Drive)
  const getEmbedUrl = (url: string) => {
    if (!url) return "";
    if (url.includes("drive.google.com")) {
      return url.replace(/\/view(\?.*)?$/, "/preview");
    }
    return url;
  };

  const rawPdfUrl = lesson.pdfUrl || lesson.videoUrl || "";
  const embedPdfUrl = getEmbedUrl(rawPdfUrl);

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-white overflow-hidden">
      {/* Main Content Area - Left Side */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-900">
        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          {lesson.type === 'VIDEO' ? (
            <VideoPlayer 
              key={lessonId}
              videoUrl={lesson.videoUrl} 
              subtitleUrl={lesson.subtitleUrl} 
              youtubeId={youtubeId} 
              initialWatchTime={initialWatchTime}
              courseId={courseId}
              lessonId={lessonId}
            />
          ) : lesson.type === 'PDF' ? (
            <div className="w-full h-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
              <div className="bg-gray-100 p-4 border-b flex justify-between items-center">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  เอกสารประกอบการเรียน: {lesson.title}
                </h3>
                {lesson.pdfUrl && (
                  <a 
                    href={lesson.pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-4 py-1.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-blue-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    เปิดในแท็บใหม่
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
              {lesson.pdfUrl ? (
                <iframe
                  src={lesson.pdfUrl}
                  className="w-full flex-1 min-h-[600px]"
                ></iframe>
              ) : (
                <div className="flex-1 flex items-center justify-center p-20 text-gray-400 italic">
                  ยังไม่ได้อัปโหลดไฟล์เอกสาร
                </div>
              )}
            </div>
          ) : lesson.type === 'QUIZ' ? (
            <div className="w-full max-w-5xl text-center py-20">
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl shadow-inner">📝</div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight">แบบทดสอบ: {lesson.title}</h2>
              <p className="text-slate-400 text-lg font-medium">กรุณาเลื่อนลงไปด้านล่างเพื่อทำแบบทดสอบ</p>
            </div>
          ) : lesson.type === 'ASSIGNMENT' ? (
            <div className="w-full h-full max-w-5xl overflow-y-auto px-4 py-8 custom-scrollbar">
              <AssignmentPlayer 
                courseId={courseId} 
                lessonId={lessonId} 
                description={lesson.description || "Please submit your work below."} 
                existingSubmission={currentAssignment} 
              />
            </div>
          ) : (
            <div className="text-white p-8 text-center bg-gray-800 rounded-2xl shadow-xl max-w-md">
              <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className="text-2xl font-bold mb-2">ยังไม่รองรับเนื้อหาประเภทนี้</h1>
              <p className="text-gray-400">ชื่อบทเรียน: {lesson.title}</p>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 border-t flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{lesson.title}</h1>
            {lesson.description && (
              <div className="prose max-w-none text-gray-600">
                {lesson.description}
              </div>
            )}
          </div>
          {userId && (enrollment || isInstructor) && (
            <MarkCompleteButton 
              lessonId={lessonId} 
              courseId={courseId} 
              initialCompleted={isCurrentLessonCompleted} 
            />
          )}
        </div>

        {/* QUIZ SECTION (SAFE ADD-ON) */}
        {lesson.type === "QUIZ" && (
          <div className="mt-12 w-full border-t border-gray-200 pt-8 bg-white">
            <div className="max-w-5xl mx-auto px-4 md:px-8 pb-12">
              {userRole === "STUDENT" ? (
                <QuizPlayer courseId={course.id} lessonId={lesson.id} />
              ) : isInstructor ? (
                <QuizEditor courseId={course.id} lessonId={lesson.id} />
              ) : (
                <QuizPlayer courseId={course.id} lessonId={lesson.id} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - Right Side */}
      <div className="w-full lg:w-96 border-l border-gray-200 flex flex-col bg-gray-50 overflow-hidden">
        <div className="p-4 border-b bg-white">
          <Link href={`/courses/${courseId}`} className="text-blue-600 hover:underline text-sm font-medium flex items-center gap-2 mb-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            กลับสู่หน้ารายละเอียดคอร์ส
          </Link>
          <h2 className="font-bold text-gray-900 line-clamp-2 mb-4">{course.title}</h2>
          
          {/* Progress Bar in Sidebar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
              <span>ความคืบหน้าการเรียน</span>
              <span>{progressPercentage}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-500" 
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {course.sections.map((section, sIndex) => (
            <div key={section.id}>
              <div className="px-4 py-3 bg-gray-100 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  บทที่ {sIndex + 1}: {section.title}
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {section.lessons.map((item) => {
                  const isActive = item.id === lessonId;
                  const isCompleted = completedLessonIds.includes(item.id);
                  const itemHasAccess = item.isFree || !!enrollment || isInstructor;

                  return (
                    <div
                      key={item.id}
                      className={`group ${isActive ? 'bg-blue-50' : ''} ${!itemHasAccess ? 'opacity-60 grayscale cursor-not-allowed' : ''}`}
                    >
                      {itemHasAccess ? (
                        <Link
                          href={`/courses/${courseId}/lessons/${item.id}`}
                          className={`flex items-center gap-3 px-4 py-4 hover:bg-blue-50 transition-colors ${isActive ? 'text-blue-700' : 'text-gray-700'}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isCompleted ? 'bg-emerald-100 text-emerald-600' : (isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500')
                          }`}>
                            {isCompleted ? (
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className={`text-sm font-medium ${isActive ? 'font-bold' : ''} ${isCompleted ? 'text-emerald-700' : ''}`}>
                            {item.title}
                          </span>
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 px-4 py-4 text-gray-500">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <span className="text-sm font-medium">{item.title}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
