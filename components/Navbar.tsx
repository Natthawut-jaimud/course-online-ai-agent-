"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Navbar({ courses = [] }: { courses?: any[] }) {
  const { data: session, update } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoveredCourse, setHoveredCourse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRoleChange = async (newRole: string) => {
    const currentRole = (session?.user as any)?.role;
    if (newRole === currentRole) return;
    
    setLoading(true);

    try {
      const response = await fetch("/api/user/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("เกิดข้อผิดพลาดในการเปลี่ยนสิทธิ์");
      }

      // Update NextAuth session cookie so UI reflects the new role instantly
      await update({ role: newRole });
      
      // Refresh the page to update server components
      router.refresh();
    } catch (err: any) {
      console.error(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initialize and update hoveredCourse when courses change
  useEffect(() => {
    if (courses.length > 0 && !hoveredCourse) {
      setHoveredCourse(courses[0]);
    }
  }, [courses, hoveredCourse]);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo */}
          <div className="flex items-center gap-12">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/20 group-hover:rotate-6 transition-transform">
                <span className="text-white font-black text-xl">U</span>
              </div>
              <span className="text-2xl font-bold tracking-tighter text-slate-900">
                UpSkill<span className="text-purple-600">.</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {/* Mega Menu Link */}
              <div className="group relative py-8">
                <Link href="/#courses" className="text-sm font-semibold text-slate-600 group-hover:text-purple-600 transition-colors uppercase tracking-widest flex items-center gap-1">
                  คอร์สเรียน
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Link>

                {/* Mega Menu Dropdown */}
                <div className="absolute top-full left-0 w-[800px] bg-white rounded-xl shadow-2xl border border-purple-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 flex overflow-hidden">
                  {/* Col 1: Sidebar */}
                  <div className="w-1/4 bg-slate-50 p-6 border-r border-slate-100 flex flex-col gap-2">
                    <p className="text-xs font-bold text-slate-400 mb-2 tracking-wider uppercase">UpSkill</p>
                    <Link href="/#courses" className="text-sm font-medium text-purple-700 bg-purple-50 px-3 py-2.5 rounded-lg flex items-center justify-between">
                      คอร์สเรียนทั้งหมด <span>›</span>
                    </Link>
                  </div>

                  {/* Col 2: Dynamic Course List */}
                  <div className="w-1/3 p-6 flex flex-col gap-1">
                    <p className="text-xs font-bold text-slate-400 mb-2 tracking-wider uppercase">คอร์สล่าสุด</p>
                    {courses.length > 0 ? (
                      courses.map(course => (
                        <Link 
                          key={course.id} 
                          href={`/courses/${course.id}`} 
                          onMouseEnter={() => setHoveredCourse(course)}
                          className={`text-sm px-3 py-2 rounded-lg transition-colors truncate block ${
                            hoveredCourse?.id === course.id 
                              ? 'text-purple-600 bg-purple-50 font-medium' 
                              : 'text-slate-700 hover:text-purple-600 hover:bg-purple-50'
                          }`}
                        >
                          {course.title}
                        </Link>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 px-3 py-2">ยังไม่มีคอร์สเรียน</p>
                    )}
                  </div>

                  {/* Col 3: Highlight Hovered Course */}
                  <div className="w-5/12 p-6 border-l border-slate-100 bg-white min-h-[300px] flex flex-col">
                    {hoveredCourse ? (
                      <>
                        <div className="flex justify-between items-center mb-4">
                          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Preview</p>
                          <Link href={`/courses/${hoveredCourse.id}`} className="text-xs font-bold text-purple-600 hover:underline">ดูรายละเอียด</Link>
                        </div>
                        <Link href={`/courses/${hoveredCourse.id}`} className="group/card block cursor-pointer flex-1">
                          <div className="w-full h-36 bg-slate-100 rounded-xl mb-3 overflow-hidden">
                            {hoveredCourse.imageUrl ? (
                              <img 
                                src={hoveredCourse.imageUrl} 
                                alt={hoveredCourse.title} 
                                className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500" 
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                                <svg className="w-12 h-12 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </div>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-slate-800 line-clamp-2 mb-1 group-hover/card:text-purple-600 transition-colors">
                            {hoveredCourse.title}
                          </h4>
                          <p className="text-xs text-slate-500 mb-2">โดย {hoveredCourse.instructor?.name || 'ผู้เชี่ยวชาญ'}</p>
                          <p className="text-xs text-purple-600 font-bold flex items-center gap-1 mt-auto">
                            เรียนเลยตอนนี้ <span className="transition-transform group-hover/card:translate-x-1">→</span>
                          </p>
                        </Link>
                      </>
                    ) : (
                      <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
                        เลือกคอร์สเพื่อดูตัวอย่าง
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {session && (
                <Link href="/profile" className="text-sm font-bold text-slate-500 hover:text-purple-600 transition-colors uppercase tracking-widest">
                  การเรียนรู้ของฉัน
                </Link>
              )}
            </div>
          </div>

          {/* Right Side Buttons */}
          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-6">
                {/* Admin/Dev Quick Links Dropdown */}
                <div className="group relative py-4 mr-2 hidden md:block">
                  <button className="text-xs font-bold text-slate-500 hover:text-purple-600 flex items-center gap-1 bg-slate-100 hover:bg-purple-50 px-3 py-1.5 rounded-full transition-colors">
                    ⚙️ ระบบทดสอบ
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>

                  {/* Dropdown Content */}
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 flex flex-col">
                    <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 rounded-t-xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Developer Menu</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <div className="relative group/nested">
                        <button className="w-full text-left text-sm font-medium text-slate-700 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-md flex items-center justify-between transition-colors">
                          <span className="flex items-center gap-2">👤 จัดการโปรไฟล์ (สลับ Role)</span>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        
                        {/* Nested Submenu - Opens to the right */}
                        <div className="absolute top-0 left-full ml-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 opacity-0 invisible group-hover/nested:opacity-100 group-hover/nested:visible transition-all duration-200 p-3 flex flex-col gap-2 z-[60]">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center border-b border-slate-100 pb-2 mb-1">Select Role</p>
                          
                          <button 
                            onClick={() => handleRoleChange("STUDENT")}
                            disabled={loading}
                            className={`w-full text-xs font-bold px-3 py-2.5 rounded-lg transition-colors ${
                              (session?.user as any)?.role === "STUDENT" 
                                ? "bg-blue-500 text-white" 
                                : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
                            } disabled:opacity-50`}
                          >
                            นักเรียน (Student)
                          </button>
                          <button 
                            onClick={() => handleRoleChange("INSTRUCTOR")}
                            disabled={loading}
                            className={`w-full text-xs font-bold px-3 py-2.5 rounded-lg transition-colors ${
                              (session?.user as any)?.role === "INSTRUCTOR" 
                                ? "bg-green-600 text-white" 
                                : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
                            } disabled:opacity-50`}
                          >
                            ผู้สอน (Instructor)
                          </button>
                          <button 
                            onClick={() => handleRoleChange("ADMIN")}
                            disabled={loading}
                            className={`w-full text-xs font-bold px-3 py-2.5 rounded-lg transition-colors ${
                              (session?.user as any)?.role === "ADMIN" 
                                ? "bg-purple-600 text-white" 
                                : "bg-white hover:bg-slate-50 border border-slate-200 text-slate-700"
                            } disabled:opacity-50`}
                          >
                            ผู้ดูแลระบบ (Admin)
                          </button>
                        </div>
                      </div>

                      {/* Role-based Conditional Rendering */}
                      {((session?.user as any)?.role === 'INSTRUCTOR' || (session?.user as any)?.role === 'ADMIN') && (
                        <Link href="/instructor" className="text-sm font-medium text-slate-700 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-md flex items-center gap-2">
                          👨‍🏫 แแดชบอร์ดผู้สอน
                        </Link>
                      )}
                      
                      {(session?.user as any)?.role === 'ADMIN' && (
                        <Link href="/admin" className="text-sm font-medium text-slate-700 hover:text-purple-700 hover:bg-purple-50 px-3 py-2 rounded-md flex items-center gap-2">
                          🛡️ ระบบหลังบ้านแอดมิน
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                <Link href="/profile" className="flex items-center gap-3 group">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-black text-slate-900 leading-none">{session.user?.name}</p>
                    <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest mt-1">
                      {(session.user as any)?.role || 'Student'}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-slate-100 group-hover:border-purple-500 transition-all shadow-sm">
                    {session.user?.image ? (
                      <img src={session.user.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold">
                        {session.user?.name?.[0]}
                      </div>
                    )}
                  </div>
                </Link>
                <button 
                  onClick={() => signOut()}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Logout"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-purple-600 transition-colors">
                  Sign In
                </Link>
                <Link href="/register" className="px-6 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-black shadow-lg shadow-purple-600/20 hover:bg-purple-700 transition-all active:scale-95">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
