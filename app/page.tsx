import Link from "next/link";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const MOCK_COURSES = [
  {
    id: "mock-1",
    title: "Google Data Analytics Professional Certificate",
    instructor: { name: "Google" },
    price: 0,
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    tags: ["Data Science", "Beginner"],
  },
  {
    id: "mock-2",
    title: "Machine Learning Specialization",
    instructor: { name: "Stanford University" },
    price: 1500,
    imageUrl: "https://images.unsplash.com/photo-1527474305487-b87b222841cc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    tags: ["AI", "Intermediate"],
  },
  {
    id: "mock-3",
    title: "IBM Full Stack Software Developer",
    instructor: { name: "IBM" },
    price: 990,
    imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    tags: ["Web Development", "Beginner"],
  },
  {
    id: "mock-4",
    title: "UI/UX Design Specialization",
    instructor: { name: "CalArts" },
    price: 2500,
    imageUrl: "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    tags: ["Design", "Intermediate"],
  }
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const { search } = await searchParams;
  
  // ดึงคอร์สที่ถูก Publish แล้วจากฐานข้อมูล (รองรับการค้นหา)
  const dbCourses = await prisma.course.findMany({
    where: { 
      isPublished: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      })
    },
    include: {
      instructor: {
        select: { name: true }
      },
      reviews: {
        select: { rating: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 12
  });

  const displayCourses = dbCourses.length > 0 ? dbCourses : (search ? [] : MOCK_COURSES);

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 min-h-[85vh] flex flex-col justify-center items-center py-20">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-purple-600 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-72 h-72 bg-indigo-600 rounded-full blur-3xl opacity-10 pointer-events-none"></div>
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-8 leading-[1.1]">
            ยกระดับทักษะของคุณกับ <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-400 to-amber-400">UpSkill สู่การพัฒนาที่ไร้ขีดจำกัด</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-12 font-medium opacity-90">
            เรียนรู้จากผู้เชี่ยวชาญตัวจริง พัฒนาศักยภาพไร้ขีดจำกัด พร้อมรับใบประกาศนียบัตรรับรองหลังเรียนจบ
          </p>
          
          {/* Search Bar */}
          <form action="/" method="GET" className="max-w-2xl mx-auto bg-white p-2 rounded-full shadow-2xl border border-white/10 flex items-center transition-all focus-within:ring-4 focus-within:ring-purple-500/20">
            <div className="pl-6 pr-2 text-purple-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              name="search"
              defaultValue={search}
              placeholder="ค้นหาคอร์สเรียนที่คุณสนใจ... (เช่น การเขียนโปรแกรม, ธุรกิจ)" 
              className="w-full py-4 px-2 text-slate-700 bg-transparent outline-none placeholder:text-slate-400 font-medium"
            />
            <button type="submit" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:to-indigo-700 text-white px-8 py-4 rounded-full font-black transition-all hover:scale-105 active:scale-95 whitespace-nowrap shadow-lg shadow-purple-900/20">
              ค้นหา
            </button>
          </form>
        </div>
      </div>

      {/* Courses Section */}
      <section id="courses" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="mb-12 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <div className="w-2 h-8 bg-purple-600 rounded-full"></div>
              หลักสูตรที่กำลังได้รับความนิยม
            </h2>
            <p className="text-slate-500 text-lg font-medium">หลักสูตรที่ผู้คนกำลังให้ความสนใจมากที่สุดในขณะนี้เพื่อยกระดับทักษะของคุณ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {displayCourses.map((course: any) => (
            <Link href={`/courses/${course.id}`} key={course.id} className="group flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="relative aspect-video w-full overflow-hidden bg-slate-50">
                {course.imageUrl ? (
                  <img
                    src={course.imageUrl}
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-100 to-indigo-100 group-hover:scale-105 transition-transform duration-500">
                    <svg className="w-12 h-12 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <div className="flex flex-wrap gap-2 mb-4">
                  {(course.tags || ["ออนไลน์", "ใหม่"]).map((tag: string) => (
                    <span key={tag} className="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-fuchsia-700 bg-fuchsia-50 rounded-full border border-fuchsia-100">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <h3 className="font-bold text-lg text-slate-800 line-clamp-2 mb-2 group-hover:text-purple-600 transition-colors leading-snug">
                  {course.title}
                </h3>
                
                <p className="text-sm text-slate-500 font-medium mb-4">โดย {course.instructor?.name || "ผู้สอนไม่ระบุชื่อ"}</p>
                
                <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-50">
                  <span className={`font-black text-xl ${(course.price === 0 || course.price === null) ? 'text-emerald-600' : 'text-slate-900'}`}>
                    {(course.price === 0 || course.price === null) ? 'ฟรี' : `฿${course.price.toLocaleString()}`}
                  </span>
                  <div className="flex items-center gap-1 bg-amber-50 text-amber-700 font-bold text-sm px-2.5 py-1 rounded-lg">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {course.reviews?.length > 0 
                      ? (course.reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / course.reviews.length).toFixed(1)
                      : "4.8"}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
